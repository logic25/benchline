-- Phase 3 / Feature 7: insurance referral click tracking.
--
-- We surface malpractice-insurance partner links to per diems. Each click goes
-- through a server redirect route that logs the click here before 302-ing to the
-- partner. This lets us measure referral interest (and reconcile partner payouts)
-- without any third-party tracking pixels.

CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  partner TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_clicks_partner ON referral_clicks(partner, created_at DESC);
CREATE INDEX idx_referral_clicks_user ON referral_clicks(user_id);

ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;

-- Users may see their own clicks; admins may see all. Inserts happen server-side
-- under the service role, so there is no INSERT policy for authenticated users.
CREATE POLICY "Users can view own referral clicks"
  ON referral_clicks FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));
