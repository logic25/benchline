-- Phase 1: append-only audit log. The Stripe webhook is the source of truth for
-- payment state, and every state transition / payment event is recorded here.
-- stripe_event_id has a UNIQUE constraint so webhook delivery is idempotent.

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appearance_id UUID REFERENCES appearances(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  stripe_event_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_appearance ON audit_log(appearance_id);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Involved parties can read audit rows for their own appearance.
CREATE POLICY "Involved parties can view appearance audit rows"
  ON audit_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appearances a
      WHERE a.id = audit_log.appearance_id
      AND (a.posted_by = auth.uid() OR a.claimed_by = auth.uid())
    )
  );

-- Admins (profiles.role would need an 'admin' concept; we gate on a custom claim).
-- Admin reads are performed with the service role, which bypasses RLS, so no
-- separate admin SELECT policy is required here.

-- No INSERT/UPDATE/DELETE policies: writes happen only via the service role
-- (webhook + server actions), which bypasses RLS. This keeps the log append-only
-- from the client's perspective.
