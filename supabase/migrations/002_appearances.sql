CREATE TYPE borough AS ENUM ('manhattan', 'brooklyn', 'bronx', 'queens', 'staten_island');
CREATE TYPE case_type AS ENUM ('civil', 'criminal', 'family', 'housing', 'commercial', 'other');
CREATE TYPE appearance_type AS ENUM ('adjournment', 'conference', 'status_call', 'motion', 'hearing', 'other');
CREATE TYPE appearance_status AS ENUM ('open', 'claimed', 'in_progress', 'completed', 'disputed', 'cancelled');

CREATE TABLE appearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claimed_by UUID REFERENCES profiles(id),
  status appearance_status NOT NULL DEFAULT 'open',
  court_name TEXT NOT NULL,
  court_address TEXT,
  borough borough NOT NULL,
  appearance_date DATE NOT NULL,
  appearance_time TIME NOT NULL,
  case_type case_type NOT NULL,
  case_caption TEXT NOT NULL,
  case_index_number TEXT,
  appearance_type appearance_type NOT NULL,
  instructions TEXT,
  pay_rate INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appearances_status ON appearances(status);
CREATE INDEX idx_appearances_date ON appearances(appearance_date);
CREATE INDEX idx_appearances_borough ON appearances(borough);
CREATE INDEX idx_appearances_posted_by ON appearances(posted_by);
CREATE INDEX idx_appearances_claimed_by ON appearances(claimed_by);

ALTER TABLE appearances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open appearances are viewable by all authenticated"
  ON appearances FOR SELECT TO authenticated
  USING (status = 'open' OR posted_by = auth.uid() OR claimed_by = auth.uid());

CREATE POLICY "Users can post appearances"
  ON appearances FOR INSERT TO authenticated
  WITH CHECK (posted_by = auth.uid());

CREATE POLICY "Involved users can update appearances"
  ON appearances FOR UPDATE TO authenticated
  USING (posted_by = auth.uid() OR claimed_by = auth.uid());

CREATE TRIGGER appearances_updated_at
  BEFORE UPDATE ON appearances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
