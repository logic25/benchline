import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { instantPayoutSchema } from '@/lib/validation/schemas';

// Stripe Instant Payouts fee is 1.5% of the payout amount (min $0.50 applied by
// Stripe). We surface the fee to the user; the fee is deducted from the
// connected account's balance, so the user nets amount - fee.
export const INSTANT_PAYOUT_FEE_RATE = 0.015;

export function instantPayoutFeeCents(amountCents: number): number {
  return Math.max(Math.round(amountCents * INSTANT_PAYOUT_FEE_RATE), 50);
}

// Available balance = sum of pay_rate over the user's released appearances,
// minus the sum of prior (non-failed/non-canceled) payouts.
async function computeAvailableCents(
  service: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<number> {
  const { data: released } = await service
    .from('appearances')
    .select('pay_rate')
    .eq('claimed_by', userId)
    .eq('payment_status', 'released');

  const earned = (released ?? []).reduce((sum, a) => sum + (a.pay_rate as number), 0);

  const { data: payouts } = await service
    .from('payouts')
    .select('amount_cents, status')
    .eq('user_id', userId)
    .in('status', ['pending', 'in_transit', 'paid']);

  const withdrawn = (payouts ?? []).reduce((sum, p) => sum + (p.amount_cents as number), 0);

  return Math.max(earned - withdrawn, 0);
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = instantPayoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return NextResponse.json({ error: 'Connect a payout account first' }, { status: 400 });
  }

  const service = createServiceClient();
  const available = await computeAvailableCents(service, user.id);
  const amountCents = parsed.data.amountCents ?? available;

  if (amountCents <= 0) {
    return NextResponse.json({ error: 'No funds available to withdraw' }, { status: 400 });
  }
  if (amountCents > available) {
    return NextResponse.json({ error: 'Requested amount exceeds available balance' }, { status: 400 });
  }

  const feeCents = instantPayoutFeeCents(amountCents);

  // Record the payout first (status pending) so balance accounting is correct
  // even if the webhook arrives before we return.
  const { data: payoutRow, error: insertErr } = await service
    .from('payouts')
    .insert({ user_id: user.id, amount_cents: amountCents, fee_cents: feeCents, status: 'pending' })
    .select()
    .single();

  if (insertErr || !payoutRow) {
    return NextResponse.json({ error: 'Could not record payout' }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    const payout = await stripe.payouts.create(
      {
        amount: amountCents,
        currency: 'usd',
        method: 'instant',
        metadata: { user_id: user.id, payout_row_id: payoutRow.id },
      },
      {
        stripeAccount: profile.stripe_account_id,
        idempotencyKey: `payout:${payoutRow.id}`,
      }
    );

    await service
      .from('payouts')
      .update({ stripe_payout_id: payout.id, status: 'in_transit' })
      .eq('id', payoutRow.id);

    return NextResponse.json({
      success: true,
      payoutId: payout.id,
      amountCents,
      feeCents,
      netCents: amountCents - feeCents,
    });
  } catch (err) {
    await service.from('payouts').update({ status: 'failed' }).eq('id', payoutRow.id);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payout failed' },
      { status: 500 }
    );
  }
}

// GET returns the current available balance and payout history for the UI.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const available = await computeAvailableCents(service, user.id);
  const { data: payouts } = await service
    .from('payouts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ availableCents: available, payouts: payouts ?? [] });
}
