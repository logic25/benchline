-- Phase 1: money handling. Add payment lifecycle, fee model, and Stripe Connect
-- destination-charge bookkeeping to appearances. All money is stored in integer cents.

CREATE TYPE payment_status AS ENUM (
  'pending', 'authorized', 'captured', 'released', 'refunded', 'disputed', 'failed'
);

CREATE TYPE fee_model AS ENUM ('flat', 'percentage');

ALTER TABLE appearances
  ADD COLUMN payment_status payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN fee_model fee_model NOT NULL DEFAULT 'flat',
  -- Rename the legacy platform_fee column to make the cents unit explicit.
  ADD COLUMN platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN sales_tax_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN total_charged_cents INTEGER,
  ADD COLUMN payment_authorized_at TIMESTAMPTZ,
  ADD COLUMN payment_captured_at TIMESTAMPTZ,
  ADD COLUMN payment_released_at TIMESTAMPTZ,
  ADD COLUMN auto_release_at TIMESTAMPTZ,
  ADD COLUMN stripe_application_fee_amount INTEGER,
  ADD COLUMN stripe_transfer_id TEXT,
  ADD COLUMN stripe_refund_id TEXT;

-- Backfill the new cents column from the legacy platform_fee column, then drop legacy.
UPDATE appearances SET platform_fee_cents = platform_fee;
ALTER TABLE appearances DROP COLUMN platform_fee;

-- Backfill total charged for existing rows (pay_rate + platform_fee + sales_tax).
UPDATE appearances
  SET total_charged_cents = pay_rate + platform_fee_cents + sales_tax_cents
  WHERE total_charged_cents IS NULL;

CREATE INDEX idx_appearances_auto_release ON appearances(auto_release_at)
  WHERE auto_release_at IS NOT NULL;
CREATE INDEX idx_appearances_payment_status ON appearances(payment_status);
