import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const supabase = await createClient();
  const { appearanceId } = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: row } = await supabase
    .from('appearances')
    .select('posted_by, pay_rate, platform_fee')
    .eq('id', appearanceId)
    .single();

  if (!row || row.posted_by !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const amount = row.pay_rate + row.platform_fee;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { appearance_id: appearanceId, user_id: user.id },
    });

    await supabase.from('appearances').update({ stripe_payment_intent_id: paymentIntent.id }).eq('id', appearanceId);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, amount });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Payment failed' }, { status: 500 });
  }
}
