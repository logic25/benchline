import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/supabase/service';
import type Stripe from 'stripe';
import type { PaymentStatus, PayoutStatus } from '@/lib/types';

// Stripe webhook = source of truth for payment state. Every event is recorded in
// audit_log keyed by stripe_event_id (UNIQUE), which makes delivery idempotent:
// a duplicate event hits the unique constraint and is skipped before any
// appearance mutation.

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Idempotency gate: claim the event id first. If it already exists, we've
  // processed this delivery — return 200 so Stripe stops retrying.
  const appearanceId = extractAppearanceId(event);
  const { error: claimErr } = await supabase.from('audit_log').insert({
    appearance_id: appearanceId,
    actor_user_id: null,
    event_type: `stripe.${event.type}`,
    payload: { stripe_object_id: stripeObjectId(event) },
    stripe_event_id: event.id,
  });
  if (claimErr) {
    // Unique violation => already handled. Any other error is a real failure.
    if (claimErr.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error('audit_log claim failed:', claimErr.message);
    return NextResponse.json({ error: 'Could not record event' }, { status: 500 });
  }

  try {
    await handleEvent(supabase, event);
  } catch (err) {
    console.error('webhook handler error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Handler error' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

type ServiceClient = ReturnType<typeof createServiceClient>;

async function handleEvent(supabase: ServiceClient, event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.amount_capturable_updated':
      await setPaymentStatusByIntent(supabase, event.data.object as Stripe.PaymentIntent, 'authorized', {
        payment_authorized_at: new Date().toISOString(),
      });
      break;
    case 'payment_intent.succeeded':
      await setPaymentStatusByIntent(supabase, event.data.object as Stripe.PaymentIntent, 'captured', {
        payment_captured_at: new Date().toISOString(),
      });
      break;
    case 'payment_intent.payment_failed':
      await setPaymentStatusByIntent(supabase, event.data.object as Stripe.PaymentIntent, 'failed', {});
      break;
    case 'payment_intent.canceled':
      await setPaymentStatusByIntent(supabase, event.data.object as Stripe.PaymentIntent, 'failed', {});
      break;
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
      if (intentId) {
        await setPaymentStatusByIntentId(supabase, intentId, 'refunded', {
          stripe_refund_id: charge.refunds?.data?.[0]?.id ?? null,
        });
      }
      break;
    }
    case 'transfer.created': {
      const transfer = event.data.object as Stripe.Transfer;
      const aId = transfer.metadata?.appearance_id;
      if (aId) {
        await supabase.from('appearances').update({ stripe_transfer_id: transfer.id }).eq('id', aId);
      }
      break;
    }
    case 'transfer.reversed':
      // Recorded in audit_log via the idempotency gate; surfaced for ops review.
      console.error('transfer.reversed:', (event.data.object as Stripe.Transfer).id);
      break;
    case 'payout.paid':
    case 'payout.failed':
    case 'payout.canceled': {
      const payout = event.data.object as Stripe.Payout;
      const status: PayoutStatus =
        event.type === 'payout.paid' ? 'paid' : event.type === 'payout.failed' ? 'failed' : 'canceled';
      await supabase.from('payouts').update({ status }).eq('stripe_payout_id', payout.id);
      break;
    }
    case 'account.updated': {
      // Connect onboarding completion. We don't persist capability state in
      // Phase 1 beyond logging; the connect-onboard flow checks live status.
      const account = event.data.object as Stripe.Account;
      console.log('account.updated:', account.id, 'charges_enabled:', account.charges_enabled);
      break;
    }
    default:
      // Already logged in audit_log; nothing else to do.
      break;
  }
}

async function setPaymentStatusByIntent(
  supabase: ServiceClient,
  intent: Stripe.PaymentIntent,
  status: PaymentStatus,
  extra: Record<string, unknown>
) {
  await setPaymentStatusByIntentId(supabase, intent.id, status, extra);
}

async function setPaymentStatusByIntentId(
  supabase: ServiceClient,
  intentId: string,
  status: PaymentStatus,
  extra: Record<string, unknown>
) {
  await supabase
    .from('appearances')
    .update({ payment_status: status, ...extra })
    .eq('stripe_payment_intent_id', intentId);
}

function extractAppearanceId(event: Stripe.Event): string | null {
  const obj = event.data.object as { metadata?: Record<string, string> };
  return obj?.metadata?.appearance_id ?? null;
}

function stripeObjectId(event: Stripe.Event): string | null {
  const obj = event.data.object as { id?: string };
  return obj?.id ?? null;
}
