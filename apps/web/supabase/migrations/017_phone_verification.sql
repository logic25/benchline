-- Phase 3 / Feature 3: phone verification for day-of SMS reminders.
--
-- We only send SMS to users who have verified ownership of their phone number.
-- A short numeric code is sent via the verification API; the user echoes it back
-- to confirm. Codes are single-use and short-lived.

ALTER TABLE profiles
  ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN phone_verified_at TIMESTAMPTZ;

CREATE TABLE phone_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_phone_verification_codes_user ON phone_verification_codes(user_id, created_at DESC);

ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- Codes are written and consumed by the server (service role). Clients never
-- read raw codes, so there are intentionally no permissive SELECT policies; the
-- table is locked down and only the service role (which bypasses RLS) touches it.
