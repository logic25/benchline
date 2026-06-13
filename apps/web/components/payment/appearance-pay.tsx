'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

function PayInner({
  appearanceId,
  onSuccess,
  onSkip,
}: {
  appearanceId: string;
  onSuccess: () => void;
  onSkip: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setMessage(null);
    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setMessage(submitErr.message ?? 'Validation failed');
      setBusy(false);
      return;
    }
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/appearances/${appearanceId}?paid=1`,
      },
      redirect: 'if_required',
    });
    if (error) {
      setMessage(error.message ?? 'Payment failed');
      setBusy(false);
      return;
    }
    onSuccess();
    setBusy(false);
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {message && <p className="text-sm text-destructive">{message}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!stripe || busy}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? 'Processing…' : 'Pay now'}
        </button>
        <button type="button" onClick={onSkip} className="text-sm text-muted-foreground underline">
          Skip for now
        </button>
      </div>
    </form>
  );
}

export function AppearancePay({
  appearanceId,
  onComplete,
}: {
  appearanceId: string;
  onComplete: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearanceId }),
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error || 'Could not start payment');
        return;
      }
      setClientSecret(data.clientSecret);
    })();
    return () => {
      cancelled = true;
    };
  }, [appearanceId]);

  if (!pk || !stripePromise) {
    return (
      <p className="text-sm text-muted-foreground">
        Stripe publishable key is not set. Your appearance was posted — configure{' '}
        <code className="text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to collect card payments.
      </p>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">{error}</p>
        <button type="button" onClick={onComplete} className="text-sm underline text-muted-foreground">
          Continue without paying
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return <p className="text-sm text-muted-foreground">Loading payment form…</p>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PayInner appearanceId={appearanceId} onSuccess={onComplete} onSkip={onComplete} />
    </Elements>
  );
}
