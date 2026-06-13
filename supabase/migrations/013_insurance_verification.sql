-- Phase 2 / Feature 2: malpractice-insurance upload + verification.
--
-- Per diem attorneys must carry verified malpractice insurance to claim
-- appearances. Mirrors the bar-verification flow: profile status columns, an
-- admin-reviewed upload queue, a private storage bucket, and a daily expiry
-- cron (see app/api/cron/insurance-expiry).

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'insurance_expiring';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'insurance_expired';

CREATE TYPE insurance_status AS ENUM ('none', 'pending', 'verified', 'expired');

ALTER TABLE profiles
  ADD COLUMN insurance_status insurance_status NOT NULL DEFAULT 'none',
  ADD COLUMN insurance_verified_at TIMESTAMPTZ,
  ADD COLUMN insurance_expires_at TIMESTAMPTZ,
  ADD COLUMN insurance_carrier TEXT,
  ADD COLUMN insurance_policy_number TEXT,
  ADD COLUMN insurance_coverage_amount_cents BIGINT;

CREATE TABLE insurance_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_url TEXT,
  carrier TEXT,
  policy_number TEXT,
  coverage_amount_cents BIGINT,
  effective_date DATE,
  expires_date DATE,
  status verification_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insurance_uploads_user ON insurance_uploads(user_id);
CREATE INDEX idx_insurance_uploads_status ON insurance_uploads(status);

ALTER TABLE insurance_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own insurance uploads"
  ON insurance_uploads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own insurance uploads"
  ON insurance_uploads FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all insurance uploads"
  ON insurance_uploads FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update insurance uploads"
  ON insurance_uploads FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

-- Private bucket for insurance policy documents. Same folder-per-user RLS as
-- verification-docs.
INSERT INTO storage.buckets (id, name, public)
  VALUES ('insurance-docs', 'insurance-docs', FALSE)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own insurance docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'insurance-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own insurance docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'insurance-docs'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin(auth.uid()))
  );

-- Claiming requires verified insurance in addition to bar verification. ADDs to
-- the open->claimed gate from 012 (RLS combines policies with OR for the same
-- command, so the route also enforces this explicitly under the service role).
CREATE POLICY "Only insured users can claim appearances"
  ON appearances FOR UPDATE TO authenticated
  USING (
    claimed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.insurance_status = 'verified'
    )
  );
