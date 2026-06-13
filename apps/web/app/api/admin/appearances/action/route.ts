import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getStripe } from '@/lib/stripe/client';
import { log } from '@/lib/log';
import { rateLimitGuard } from '@/lib/api/guard';

// Admin power actions on an appearance. These are deliberate overrides that may
// move an appearance outside the normal lifecycle (e.g. cancelling a stuck row),
// so they bypass the user-facing state machine but always write an audit_log
// entry attributing the change to the acting admin. Money movement uses the live
// PaymentIntent status and deterministic idempotency keys, mirroring the dispute
// resolver.

const schema = z.object({
  appearanceId: z.string().uuid(),
  action: z.enum(['force_release', 'force_refund', 'force_cancel', 'mark_resolved']),
  notes: z.string().trim().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { appearanceId, action, notes } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = await rateLimitGuard('mutation', user.id);
  if (blocked) return blocked;

  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!me?.is_admin) {
    // 404, not 403 — do not confirm the admin route exists to non-admins.
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const service = createServiceClient();
  const { data: appearance } = await service
    .from('appearances')
    .select('id, status, claimed_by, pay_rate, payment_status, stripe_payment_intent_id, stripe_transfer_id')
    .eq('id', appearanceId)
    .single();
  if (!appearance) return NextResponse.json({ error: 'Appearance not found' }, { status: 404 });

  const nowIso = new Date().toISOString();
  let patch: Record<string, unknown> = {};
  let stripeNote: Record<string, unknown> = {};

  try {
    if (action === 'force_release') {
      stripeNote = await forceRelease(service, appearance);
      patch = { status: 'completed', payment_status: 'released', payment_released_at: nowIso, completed_at: nowIso };
    } else if (action === 'force_refund') {
      stripeNote = await forceRefund(appearance);
      patch = { status: 'cancelled', payment_status: 'refunded', payment_released_at: null };
    } else if (action === 'force_cancel') {
      patch = { status: 'cancelled' };
    } else {
      // mark_resolved: close any open dispute and return the appearance to completed.
      await service
        .from('disputes')
        .update({ status: 'resolved_for_other', resolution_notes: notes ?? 'Resolved by admin', resolved_by: user.id, resolved_at: nowIso })
        .eq('appearance_id', appearanceId)
        .in('status', ['open', 'in_review']);
      patch = { status: 'completed' };
    }
  } catch (err) {
    log.error('admin.appearance.action.stripe_failed', { appearanceId, action, error: err instanceof Error ? err.message : 'unknown' });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Action failed' }, { status: 500 });
  }

  const { error: updErr } = await service.from('appearances').update({ ...patch, updated_at: nowIso }).eq('id', appearanceId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  await service.from('audit_log').insert({
    appearance_id: appearanceId,
    actor_user_id: user.id,
    event_type: `admin.${action}`,
    from_status: appearance.status,
    to_status: (patch.status as string) ?? appearance.status,
    payload: { notes: notes ?? null, ...stripeNote },
  });

  return NextResponse.json({ success: true });
}

type ApprRow = {
  id: string;
  claimed_by: string | null;
  pay_rate: number;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
};

async function forceRelease(
  service: ReturnType<typeof createServiceClient>,
  a: ApprRow
): Promise<Record<string, unknown>> {
  if (!process.env.STRIPE_SECRET_KEY) return { stripe_note: 'no_stripe' };
  if (!a.stripe_payment_intent_id) return { stripe_note: 'no_payment_intent' };
  const stripe = getStripe();
  const pi = await stripe.paymentIntents.retrieve(a.stripe_payment_intent_id);
  if (pi.status === 'requires_capture') {
    await stripe.paymentIntents.capture(a.stripe_payment_intent_id, undefined, {
      idempotencyKey: `${a.id}:admin_capture`,
    });
  }
  let transferId = a.stripe_transfer_id;
  if (!transferId && a.claimed_by) {
    const { data: claimer } = await service.from('profiles').select('stripe_account_id').eq('id', a.claimed_by).single();
    if (claimer?.stripe_account_id) {
      const transfer = await stripe.transfers.create(
        { amount: a.pay_rate, currency: 'usd', destination: claimer.stripe_account_id, metadata: { appearance_id: a.id, admin_release: 'true' } },
        { idempotencyKey: `${a.id}:admin_transfer` }
      );
      transferId = transfer.id;
      await service.from('appearances').update({ stripe_transfer_id: transferId }).eq('id', a.id);
    }
  }
  return { stripe_note: 'released', stripe_transfer_id: transferId };
}

async function forceRefund(a: ApprRow): Promise<Record<string, unknown>> {
  if (!process.env.STRIPE_SECRET_KEY) return { stripe_note: 'no_stripe' };
  if (!a.stripe_payment_intent_id) return { stripe_note: 'no_payment_intent' };
  const stripe = getStripe();
  const pi = await stripe.paymentIntents.retrieve(a.stripe_payment_intent_id);
  if (pi.status === 'requires_capture') {
    await stripe.paymentIntents.cancel(a.stripe_payment_intent_id, { idempotencyKey: `${a.id}:admin_void` });
    return { stripe_note: 'authorization_voided' };
  }
  const refund = await stripe.refunds.create(
    { payment_intent: a.stripe_payment_intent_id, amount: a.pay_rate },
    { idempotencyKey: `${a.id}:admin_refund` }
  );
  return { stripe_note: 'refunded', stripe_refund_id: refund.id };
}
