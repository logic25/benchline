import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { computePlatformFee } from '@/lib/pricing';
import { createPaymentIntentSchema } from '@/lib/validation/schemas';
import { rateLimitGuard } from '@/lib/api/guard';

// Pre-authorize the litigator's card at post time. The appearance is not yet
// claimed, so we don't know the per diem's Connect account — we therefore use
// capture_method='manual' (auth only). On claim we attach transfer_data; on
// release we capture, which moves the application fee to Benchline and the
// remainder to the per diem via the destination charge.
export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const parsed = createPaymentIntentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const { appearanceId } = parsed.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = await rateLimitGuard('mutation', user.id);
  if (blocked) return blocked;

  const { data: row } = await supabase
    .from('appearances')
    .select('posted_by, pay_rate, case_type, fee_model, stripe_payment_intent_id')
    .eq('id', appearanceId)
    .single();

  if (!row || row.posted_by !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // No virtual flag exists in the schema yet; treat all appearances as in-person
  // (the higher, safer flat fee). Phase 2 can add an is_virtual column.
  const fee = computePlatformFee(row.pay_rate, row.case_type, false);
  const applicationFeeCents = fee.feeCents + fee.salesTaxCents;
  const amount = fee.totalChargedCents;

  const stripe = getStripe();
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: 'usd',
        capture_method: 'manual',
        automatic_payment_methods: { enabled: true },
        metadata: {
          appearance_id: appearanceId,
          user_id: user.id,
          application_fee_amount: String(applicationFeeCents),
        },
      },
      { idempotencyKey: `${appearanceId}:create_payment_intent` }
    );

    await supabase
      .from('appearances')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        fee_model: fee.model,
        platform_fee_cents: fee.feeCents,
        sales_tax_cents: fee.salesTaxCents,
        total_charged_cents: amount,
        stripe_application_fee_amount: applicationFeeCents,
      })
      .eq('id', appearanceId);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, amount });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Payment failed' }, { status: 500 });
  }
}
