-- Phase 1: enforce the appearance status state machine at the database layer.
-- The application-level state machine (lib/appearances/state-machine.ts) is the
-- primary guard, but this trigger is a backstop against any direct DB writes.

CREATE OR REPLACE FUNCTION is_valid_transition(from_status appearance_status, to_status appearance_status)
RETURNS BOOLEAN AS $$
BEGIN
  -- A no-op update (status unchanged) is always allowed.
  IF from_status = to_status THEN
    RETURN TRUE;
  END IF;

  RETURN CASE from_status
    WHEN 'open' THEN to_status IN ('claimed', 'cancelled')
    WHEN 'claimed' THEN to_status IN ('in_progress', 'cancelled', 'disputed')
    WHEN 'in_progress' THEN to_status IN ('completed', 'disputed')
    WHEN 'completed' THEN to_status IN ('disputed')
    -- A refund resolves a dispute by cancelling the appearance; "refunded" is a
    -- payment_status, not an appearance_status, so the appearance lands in
    -- 'cancelled'. Resolution in the per diem's favor goes back to 'completed'.
    WHEN 'disputed' THEN to_status IN ('completed', 'cancelled')
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION enforce_appearance_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_valid_transition(OLD.status, NEW.status) THEN
    RAISE EXCEPTION 'Invalid appearance status transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- A completed appearance can only be disputed within 7 days of completion.
  IF OLD.status = 'completed' AND NEW.status = 'disputed'
     AND OLD.completed_at IS NOT NULL
     AND OLD.completed_at < (NOW() - INTERVAL '7 days') THEN
    RAISE EXCEPTION 'Dispute window (7 days) has closed for this appearance'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appearances_enforce_transition
  BEFORE UPDATE OF status ON appearances
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_appearance_transition();
