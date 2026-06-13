-- Phase 2 / Feature 1: automated bar verification.
--
-- Replaces the boolean profiles.bar_verified with a richer status workflow and
-- adds an admin-reviewed request queue. Posting an appearance now requires the
-- poster to be verified, and claiming requires the claimer to be verified — RLS
-- policies below add these gates on top of the existing appearance policies
-- (they ADD to, not replace, the policies in 002_appearances.sql).

-- New notification type for verification review outcomes.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'verification_reviewed';

CREATE TYPE bar_verification_status AS ENUM (
  'unverified',
  'pending',
  'verified',
  'rejected',
  'expired'
);

CREATE TYPE verification_request_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

ALTER TABLE profiles
  ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN bar_verification_status bar_verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN bar_verified_at TIMESTAMPTZ,
  ADD COLUMN bar_verification_method TEXT,
  ADD COLUMN bar_verification_notes TEXT,
  ADD COLUMN bar_expires_at TIMESTAMPTZ;

-- Migrate the legacy boolean: anyone previously marked verified stays verified
-- for one year from now.
UPDATE profiles
  SET bar_verification_status = 'verified',
      bar_verified_at = NOW(),
      bar_verification_method = 'manual',
      bar_expires_at = NOW() + INTERVAL '1 year'
  WHERE bar_verified = TRUE;

CREATE TABLE bar_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bar_number TEXT NOT NULL,
  bar_state TEXT NOT NULL DEFAULT 'NY',
  full_name_legal TEXT NOT NULL,
  evidence_url TEXT,
  status verification_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bar_verification_requests_user ON bar_verification_requests(user_id);
CREATE INDEX idx_bar_verification_requests_status ON bar_verification_requests(status);

ALTER TABLE bar_verification_requests ENABLE ROW LEVEL SECURITY;

-- Users manage their own requests.
CREATE POLICY "Users can insert own bar verification requests"
  ON bar_verification_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own bar verification requests"
  ON bar_verification_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can see and review every request. We avoid recursive RLS on profiles by
-- reading the caller's is_admin flag in a SECURITY DEFINER helper.
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT p.is_admin FROM profiles p WHERE p.id = uid), FALSE);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "Admins can view all bar verification requests"
  ON bar_verification_requests FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update bar verification requests"
  ON bar_verification_requests FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

CREATE TRIGGER bar_verification_requests_updated_at
  BEFORE UPDATE ON bar_verification_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Appearance gating. The actual writes happen via the service role (state
-- machine), which bypasses RLS, but these policies are the backstop for any
-- direct client write and document the intent.

-- Posting requires a verified bar status.
CREATE POLICY "Only bar-verified users can post appearances"
  ON appearances FOR INSERT TO authenticated
  WITH CHECK (
    posted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.bar_verification_status = 'verified'
    )
  );

-- Private storage bucket for bar-verification evidence (license photos, etc.).
-- Users may only write under a folder named after their own user id; admins
-- (service role) read everything.
INSERT INTO storage.buckets (id, name, public)
  VALUES ('verification-docs', 'verification-docs', FALSE)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own verification docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own verification docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin(auth.uid()))
  );

-- Claiming (moving an open appearance to claimed) requires a verified claimer.
-- This complements the broad "Involved users can update appearances" policy from
-- 002 by restricting the open->claimed write path to verified users.
CREATE POLICY "Only bar-verified users can claim appearances"
  ON appearances FOR UPDATE TO authenticated
  USING (
    claimed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.bar_verification_status = 'verified'
    )
  );
