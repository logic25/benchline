-- Phase 1: idempotency tracking for mutating API routes. A client supplies an
-- Idempotency-Key header; the route stores the key + request hash and replays the
-- stored response on a duplicate request. Rows expire after 24 hours.

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  request_hash TEXT,
  response JSONB,
  status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_idempotency_keys_key ON idempotency_keys(key);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Written and read only by the service role (server-side), which bypasses RLS.
-- No authenticated policies: clients never touch this table directly.
