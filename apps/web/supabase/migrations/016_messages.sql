-- Phase 3 / Feature 1: in-app messaging, per appearance.
--
-- A thread is scoped to a single appearance and is visible only to the two
-- involved parties (the poster and the per diem who claimed it). Messages are
-- only useful once an appearance has been claimed; the API enforces that, while
-- RLS here enforces who may read/write at all.

-- New notification type for inbound messages.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'message_received';

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appearance_id UUID NOT NULL REFERENCES appearances(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_appearance ON messages(appearance_id, created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Only the appearance's poster and claimer can see the thread.
CREATE POLICY "Involved parties can view messages"
  ON messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appearances a
      WHERE a.id = messages.appearance_id
      AND (a.posted_by = auth.uid() OR a.claimed_by = auth.uid())
    )
  );

-- A sender may only insert messages they author, into a thread they belong to.
CREATE POLICY "Involved parties can send messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM appearances a
      WHERE a.id = messages.appearance_id
      AND (a.posted_by = auth.uid() OR a.claimed_by = auth.uid())
    )
  );

-- Recipients may mark messages read (the only column they update).
CREATE POLICY "Involved parties can mark messages read"
  ON messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appearances a
      WHERE a.id = messages.appearance_id
      AND (a.posted_by = auth.uid() OR a.claimed_by = auth.uid())
    )
  );

-- Enable Supabase Realtime so the thread updates live for both parties.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Private storage bucket for message attachments. As elsewhere, a user may only
-- write under a folder named after their own user id. Reads are allowed to any
-- involved party of the appearance referenced in the second path segment
-- ({user_id}/{appearance_id}/{filename}).
INSERT INTO storage.buckets (id, name, public)
  VALUES ('appearance-attachments', 'appearance-attachments', FALSE)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own appearance attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'appearance-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Involved parties read appearance attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'appearance-attachments'
    AND EXISTS (
      SELECT 1 FROM appearances a
      WHERE a.id::text = (storage.foldername(name))[2]
      AND (a.posted_by = auth.uid() OR a.claimed_by = auth.uid())
    )
  );
