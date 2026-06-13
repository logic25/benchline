import type { SupabaseClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/client';
import { performTransition, TransitionError } from '@/lib/appearances/state-machine';
import { sendForNotification } from '@/lib/email/send-for-notification';

// Shared release logic used by the litigator-initiated release-payment route and
// the auto-release cron.
//
// Money model: separate charges & transfers. The destination (the per diem's
// Connect account) is unknown at post time, and Stripe does not allow setting
// transfer_data.destination after PaymentIntent creation — so we capture the
// full pre-authorized amount to the platform balance, then transfer the
// pay_rate to the per diem. The application fee + sales tax (total - pay_rate)
// stays on the platform.
//
// Requires that a submitted outcome report exists. The appearance must be
// in_progress (manual confirm) or already in_progress when auto-released.
export async function releaseAppearancePayment(
  supabase: SupabaseClient,
  appearanceId: string,
  actorUserId: string | null,
  opts: { auto: boolean }
): Promise<{ released: boolean; note: string }> {
  const { data: appearance, error } = await supabase
    .from('appearances')
    .select('id, status, claimed_by, pay_rate, stripe_payment_intent_id, payment_status, stripe_transfer_id')
    .eq('id', appearanceId)
    .single();

  if (error || !appearance) throw new TransitionError('Appearance not found');

  const { data: report } = await supabase
    .from('outcome_reports')
    .select('id')
    .eq('appearance_id', appearanceId)
    .maybeSingle();

  if (!report) {
    throw new TransitionError('Cannot release payment before a report is submitted');
  }

  await performTransition(
    supabase,
    appearanceId,
    opts.auto ? 'auto_release' : 'confirm_completion',
    actorUserId,
    {
      auditEventType: 'payment.released',
      patch: {
        payment_status: 'released',
        payment_released_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      payload: { auto: opts.auto },
      sideEffect: async () => {
        if (!process.env.STRIPE_SECRET_KEY) return { capture_note: 'no_stripe' };
        if (!appearance.stripe_payment_intent_id) return { capture_note: 'no_payment_intent' };

        const stripe = getStripe();

        // 1. Capture the pre-authorized amount to the platform balance.
        await stripe.paymentIntents.capture(appearance.stripe_payment_intent_id, undefined, {
          idempotencyKey: `${appearanceId}:capture`,
        });

        // 2. Transfer the pay_rate to the per diem's Connect account. The
        // application fee + sales tax remains on the platform.
        let transferId: string | null = appearance.stripe_transfer_id as string | null;
        if (!transferId && appearance.claimed_by) {
          const { data: claimer } = await supabase
            .from('profiles')
            .select('stripe_account_id')
            .eq('id', appearance.claimed_by)
            .single();
          if (claimer?.stripe_account_id) {
            const transfer = await stripe.transfers.create(
              {
                amount: appearance.pay_rate as number,
                currency: 'usd',
                destination: claimer.stripe_account_id,
                metadata: { appearance_id: appearanceId },
              },
              { idempotencyKey: `${appearanceId}:transfer` }
            );
            transferId = transfer.id;
            await supabase
              .from('appearances')
              .update({ stripe_transfer_id: transferId })
              .eq('id', appearanceId);
          } else {
            return { capture_note: 'captured', transfer_note: 'no_connect_account' };
          }
        }
        return { capture_note: 'captured', transfer_note: 'transferred', stripe_transfer_id: transferId };
      },
    }
  );

  // Notify the per diem.
  if (appearance.claimed_by) {
    await supabase.from('notifications').insert({
      user_id: appearance.claimed_by,
      type: 'payment_released',
      title: 'Payment Released',
      body: `$${(appearance.pay_rate / 100).toFixed(2)} has been released to you.`,
      metadata: { appearance_id: appearanceId, auto: opts.auto },
    });

    await sendForNotification({
      service: supabase,
      recipientUserId: appearance.claimed_by,
      notificationType: 'payment_released',
      context: {
        appearanceId,
        body: `$${(appearance.pay_rate / 100).toFixed(2)} has been released to you.`,
      },
    });
  }

  return { released: true, note: opts.auto ? 'auto_released' : 'released' };
}
