-- Avara v2 — Voice Sessions Table

CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','failed')),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  transcript JSONB DEFAULT '[]',
  extracted_data JSONB DEFAULT '{}',
  summary TEXT,
  chapter_at_start INT,
  trigger_context TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own voice sessions" ON voice_sessions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_voice_sessions_user ON voice_sessions(user_id);
