-- Allow counterpart notifications tied to an appearance (claim, check-in, payment, report)
CREATE POLICY "Participants can notify counterparts on appearances"
ON notifications FOR INSERT TO authenticated
WITH CHECK (
  metadata ? 'appearance_id'
  AND EXISTS (
    SELECT 1 FROM appearances a
    WHERE a.id::text = (metadata->>'appearance_id')
    AND (
      (a.posted_by = user_id AND a.claimed_by = auth.uid())
      OR (a.claimed_by = user_id AND a.posted_by = auth.uid())
    )
  )
);

-- Submitter can update own report (e.g. AI structured JSON after insert)
CREATE POLICY "Submitter can update own outcome report"
ON outcome_reports FOR UPDATE TO authenticated
USING (submitted_by = auth.uid())
WITH CHECK (submitted_by = auth.uid());
