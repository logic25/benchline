import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  try {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', (event.data.object as Stripe.PaymentIntent).id);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', (event.data.object as Stripe.PaymentIntent).id);
        break;
      default:
        console.log('Unhandled event:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Webhook error' }, { status: 400 });
  }
}
