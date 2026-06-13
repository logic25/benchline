-- Phase 3 / Feature 6: dispute workflow.
--
-- Either party may raise a dispute on an in_progress appearance, or on a
-- completed one within a 7-day window (the window is enforced in the API). An
-- admin resolves it: for the raiser (refund the litigator), for the other party
-- (release to the per diem), or split (partial refund, admin sets the amount).

-- New notification type for dispute lifecycle updates.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'dispute_update';

CREATE TYPE dispute_status AS ENUM (
  'open',
  'in_review',
  'resolved_for_raiser',
  'resolved_for_other',
  'split'
);

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appearance_id UUID NOT NULL REFERENCES appearances(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  against UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence_urls JSONB NOT NULL DEFAULT '[]',
  status dispute_status NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  refund_amount_cents INTEGER,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disputes_appearance ON disputes(appearance_id);
CREATE INDEX idx_disputes_status ON disputes(status);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Involved parties (raiser or the party disputed against) and admins can view.
CREATE POLICY "Involved parties can view disputes"
  ON disputes FOR SELECT TO authenticated
  USING (raised_by = auth.uid() OR against = auth.uid() OR is_admin(auth.uid()));

-- Only the raiser may open a dispute, and only naming themselves as raiser.
CREATE POLICY "Raiser can create dispute"
  ON disputes FOR INSERT TO authenticated
  WITH CHECK (raised_by = auth.uid());

-- Only admins may update (resolve) a dispute. Money movement and the appearance
-- status transition happen server-side under the service role.
CREATE POLICY "Admins can resolve disputes"
  ON disputes FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
