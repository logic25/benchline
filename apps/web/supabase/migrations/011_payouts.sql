-- Phase 1: Stripe Instant Payouts. Tracks per-diem-initiated payouts from their
-- Connect balance to their bank/debit card. amount_cents is what the user receives
-- before the instant-payout fee; fee_cents is Stripe's 1.5% instant fee.

CREATE TYPE payout_status AS ENUM ('pending', 'in_transit', 'paid', 'failed', 'canceled');

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL DEFAULT 0,
  stripe_payout_id TEXT UNIQUE,
  status payout_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_user ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Users can read their own payout history.
CREATE POLICY "Users can view own payouts"
  ON payouts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT/UPDATE happen via the service role (the instant-payout route and
-- webhook), which bypasses RLS. No authenticated write policies.
