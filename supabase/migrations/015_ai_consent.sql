-- Phase 2 / Feature 4: AI processing consent + redaction bookkeeping.
--
-- Outcome reports may be structured by an LLM (now via AWS Bedrock under a
-- zero-data-retention agreement). Identifying details are redacted before the
-- model call and re-stitched afterward; the placeholder->original dictionary is
-- stored so a structured report can be displayed with names restored. Users may
-- opt out of AI processing entirely.

ALTER TABLE profiles
  ADD COLUMN ai_processing_consent BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE outcome_reports
  ADD COLUMN ai_redaction_dictionary JSONB;
