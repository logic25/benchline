CREATE TYPE outcome_type AS ENUM ('adjourned', 'settled', 'dismissed', 'granted', 'denied', 'default', 'other');

CREATE TABLE outcome_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appearance_id UUID NOT NULL REFERENCES appearances(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  outcome outcome_type NOT NULL,
  next_date DATE,
  judge_name TEXT,
  judge_notes TEXT,
  opposing_counsel TEXT,
  action_items TEXT,
  red_flags TEXT,
  raw_notes TEXT,
  ai_structured_report JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outcome_reports_appearance ON outcome_reports(appearance_id);

ALTER TABLE outcome_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports viewable by involved parties"
  ON outcome_reports FOR SELECT TO authenticated
  USING (
    submitted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM appearances
      WHERE appearances.id = outcome_reports.appearance_id
      AND (appearances.posted_by = auth.uid() OR appearances.claimed_by = auth.uid())
    )
  );

CREATE POLICY "Per diem can submit report"
  ON outcome_reports FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());
