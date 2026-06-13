-- Phase 4 / Feature 3: onboarding wizard state.
--
-- The wizard gates posting (litigators) and claiming (per diems) until a user
-- has completed the role-appropriate steps. Rather than a separate progress
-- table, we track the small amount of state directly on profiles: a completion
-- flag, the furthest step reached (for resume), and two booleans for the two
-- async Stripe flows whose completion we cannot infer from existing columns
-- (a saved card via Setup Intent, and Connect onboarding return).
--
-- bar_verification_status / insurance_status / phone_verified already exist and
-- are the source of truth for those steps, so we do not duplicate them here.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method_setup BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing users predate onboarding; treat them as already onboarded so the
-- gate does not lock anyone out on deploy. New signups default to FALSE above.
UPDATE profiles SET onboarding_completed = TRUE WHERE created_at < NOW();

-- RLS already exists on profiles (users update their own row); these columns
-- are covered by the existing self-update policy. No new policy needed.
