-- Phase 2 / Feature 3: conflict-of-interest checks.
--
-- Appearances now record opposing counsel so a per diem attorney is never
-- matched to a case where they (or their firm) represent the other side. Users
-- declare known conflicts; the claim route blocks claims that match.

ALTER TABLE appearances
  ADD COLUMN opposing_counsel_name TEXT,
  ADD COLUMN opposing_counsel_firm TEXT,
  ADD COLUMN opposing_counsel_bar_number TEXT;

ALTER TABLE profiles
  ADD COLUMN firm_name TEXT,
  ADD COLUMN firm_bar_numbers TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE conflict_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conflicted_party_name TEXT NOT NULL,
  conflicted_party_firm TEXT,
  conflicted_party_bar_number TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conflict_declarations_user ON conflict_declarations(user_id);

ALTER TABLE conflict_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conflict declarations - select"
  ON conflict_declarations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own conflict declarations - insert"
  ON conflict_declarations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own conflict declarations - delete"
  ON conflict_declarations FOR DELETE TO authenticated
  USING (user_id = auth.uid());
