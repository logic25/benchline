import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getStripe } from '@/lib/stripe/client';
import { performTransition, TransitionError, type TransitionEvent } from '@/lib/appearances/state-machine';
import { resolveDisputeSchema } from '@/lib/validation/schemas';
import { sendForNotification } from '@/lib/email/send-for-notification';
import { rateLimitGuard } from '@/lib/api/guard';
import { NextRequest, NextResponse } from 'next/server';
import type { DisputeStatus } from '@/lib/types';

// Maps the admin's decision to: the resulting dispute status, the state-machine
// event, and the appearance payment status. Money movement is decision-specific
// and handled in the side effect below.
const DECISION_MAP: Record<
  'for_raiser' | 'for_other' | 'split',
  { disputeStatus: DisputeStatus; event: TransitionEvent }
> = {
  for_raiser: { disputeStatus: 'resolved_for_raiser', event: 'resolve_dispute_for_raiser' },
  for_other: { disputeStatus: 'resolved_for_other', event: 'resolve_dispute_for_other' },
  split: { disputeStatus: 'split', event: 'resolve_dispute_split' },
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = resolveDisputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { disputeId, decision, resolutionNotes, refundAmountCents } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = await rateLimitGuard('mutation', user.id);
  if (blocked) return blocked;

  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!me?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = createServiceClient();

  const { data: dispute } = await service
    .from('disputes')
    .select('id, appearance_id, raised_by, against, status')
    .eq('id', disputeId)
    .single();
  if (!dispute) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
  if (dispute.status !== 'open' && dispute.status !== 'in_review') {
    return NextResponse.json({ error: 'Dispute already resolved' }, { status: 409 });
  }

  const { data: appearance } = await service
    .from('appearances')
    .select(
      'id, status, claimed_by, pay_rate, payment_status, stripe_payment_intent_id, stripe_transfer_id, case_caption'
    )
    .eq('id', dispute.appearance_id)
    .single();
  if (!appearance) return NextResponse.json({ error: 'Appearance not found' }, { status: 404 });

  if (decision === 'split' && (refundAmountCents ?? 0) > appearance.pay_rate) {
    return NextResponse.json(
      { error: 'Refund amount cannot exceed the appearance pay rate' },
      { status: 400 }
    );
  }

  const { disputeStatus, event } = DECISION_MAP[decision];
  const nowIso = new Date().toISOString();

  try {
    await performTransition(service, dispute.appearance_id, event, user.id, {
      auditEventType: 'dispute.resolved',
      payload: { dispute_id: disputeId, decision, refund_amount_cents: refundAmountCents ?? null },
      patch: paymentPatch(decision, nowIso),
      sideEffect: async () => moveMoney(service, decision, appearance, refundAmountCents ?? 0),
    });
  } catch (err) {
    if (err instanceof TransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not resolve dispute' },
      { status: 500 }
    );
  }

  const { error: updErr } = await service
    .from('disputes')
    .update({
      status: disputeStatus,
      resolution_notes: resolutionNotes ?? null,
      refund_amount_cents: decision === 'split' ? refundAmountCents ?? null : null,
      resolved_by: user.id,
      resolved_at: nowIso,
    })
    .eq('id', disputeId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Notify both parties of the outcome.
  const outcomeBody = outcomeMessage(decision, appearance.case_caption);
  for (const recipient of [dispute.raised_by, dispute.against]) {
    const { error: nErr } = await service.from('notifications').insert({
      user_id: recipient,
      type: 'dispute_update',
      title: 'Dispute resolved',
      body: outcomeBody,
      metadata: { appearance_id: dispute.appearance_id, dispute_id: disputeId, decision },
    });
    if (nErr) console.error('notifications insert:', nErr.message);

    await sendForNotification({
      service,
      recipientUserId: recipient,
      notificationType: 'dispute_update',
      context: { appearanceId: dispute.appearance_id, caseCaption: appearance.case_caption, body: outcomeBody },
    });
  }

  return NextResponse.json({ success: true });
}

// Appearance-row patch applied alongside the status transition.
function paymentPatch(
  decision: 'for_raiser' | 'for_other' | 'split',
  nowIso: string
): Record<string, unknown> {
  if (decision === 'for_raiser') {
    return { payment_status: 'refunded', payment_released_at: null };
  }
  // for_other and split both release (full or partial) to the per diem.
  return { payment_status: 'released', payment_released_at: nowIso, completed_at: nowIso };
}

// Decision-specific Stripe money movement. Returns audit metadata. No-op when
// Stripe is unconfigured or there is no payment intent yet.
async function moveMoney(
  service: ReturnType<typeof createServiceClient>,
  decision: 'for_raiser' | 'for_other' | 'split',
  appearance: {
    id: string;
    claimed_by: string | null;
    pay_rate: number;
    stripe_payment_intent_id: string | null;
    stripe_transfer_id: string | null;
  },
  refundAmountCents: number
): Promise<Record<string, unknown>> {
  if (!process.env.STRIPE_SECRET_KEY) return { stripe_note: 'no_stripe' };
  if (!appearance.stripe_payment_intent_id) return { stripe_note: 'no_payment_intent' };

  const stripe = getStripe();
  const pi = await stripe.paymentIntents.retrieve(appearance.stripe_payment_intent_id);

  // If funds are still only authorized (manual-capture, not yet captured),
  // cancelling the intent voids the hold without ever charging the card.
  if (decision === 'for_raiser') {
    if (pi.status === 'requires_capture') {
      await stripe.paymentIntents.cancel(appearance.stripe_payment_intent_id, {
        idempotencyKey: `${appearance.id}:dispute_cancel`,
      });
      return { stripe_note: 'authorization_voided' };
    }
    // Already captured: refund the full pay_rate to the litigator.
    const refund = await stripe.refunds.create(
      { payment_intent: appearance.stripe_payment_intent_id, amount: appearance.pay_rate },
      { idempotencyKey: `${appearance.id}:dispute_refund_full` }
    );
    return { stripe_note: 'refunded_full', stripe_refund_id: refund.id };
  }

  if (decision === 'split') {
    // Capture (if still authorized) so we can both refund part and transfer the
    // remainder to the per diem.
    if (pi.status === 'requires_capture') {
      await stripe.paymentIntents.capture(appearance.stripe_payment_intent_id, undefined, {
        idempotencyKey: `${appearance.id}:dispute_split_capture`,
      });
    }
    let refundId: string | null = null;
    if (refundAmountCents > 0) {
      const refund = await stripe.refunds.create(
        { payment_intent: appearance.stripe_payment_intent_id, amount: refundAmountCents },
        { idempotencyKey: `${appearance.id}:dispute_refund_split` }
      );
      refundId = refund.id;
    }
    const remainder = appearance.pay_rate - refundAmountCents;
    let transferId: string | null = appearance.stripe_transfer_id;
    if (remainder > 0 && !transferId && appearance.claimed_by) {
      const { data: claimer } = await service
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', appearance.claimed_by)
        .single();
      if (claimer?.stripe_account_id) {
        const transfer = await stripe.transfers.create(
          {
            amount: remainder,
            currency: 'usd',
            destination: claimer.stripe_account_id,
            metadata: { appearance_id: appearance.id, dispute_split: 'true' },
          },
          { idempotencyKey: `${appearance.id}:dispute_split_transfer` }
        );
        transferId = transfer.id;
        await service.from('appearances').update({ stripe_transfer_id: transferId }).eq('id', appearance.id);
      }
    }
    return { stripe_note: 'split', stripe_refund_id: refundId, stripe_transfer_id: transferId };
  }

  // for_other: capture (if needed) and transfer the full pay_rate to the per diem.
  if (pi.status === 'requires_capture') {
    await stripe.paymentIntents.capture(appearance.stripe_payment_intent_id, undefined, {
      idempotencyKey: `${appearance.id}:dispute_capture`,
    });
  }
  let transferId: string | null = appearance.stripe_transfer_id;
  if (!transferId && appearance.claimed_by) {
    const { data: claimer } = await service
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', appearance.claimed_by)
      .single();
    if (claimer?.stripe_account_id) {
      const transfer = await stripe.transfers.create(
        {
          amount: appearance.pay_rate,
          currency: 'usd',
          destination: claimer.stripe_account_id,
          metadata: { appearance_id: appearance.id, dispute_for_other: 'true' },
        },
        { idempotencyKey: `${appearance.id}:dispute_transfer` }
      );
      transferId = transfer.id;
      await service.from('appearances').update({ stripe_transfer_id: transferId }).eq('id', appearance.id);
    }
  }
  return { stripe_note: 'released_to_per_diem', stripe_transfer_id: transferId };
}

function outcomeMessage(decision: 'for_raiser' | 'for_other' | 'split', caption: string): string {
  switch (decision) {
    case 'for_raiser':
      return `The dispute on ${caption} was resolved in favor of the party who raised it; a refund has been issued.`;
    case 'for_other':
      return `The dispute on ${caption} was resolved in favor of the per diem; payment has been released.`;
    case 'split':
      return `The dispute on ${caption} was resolved with a partial refund.`;
  }
}
