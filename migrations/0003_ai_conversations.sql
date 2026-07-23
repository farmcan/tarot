CREATE TABLE IF NOT EXISTS ai_conversations (
  conversation_id TEXT PRIMARY KEY,
  access_key_hash TEXT NOT NULL,
  reading_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL CHECK (length(snapshot_json) <= 49152),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_expires_at
ON ai_conversations (expires_at);
