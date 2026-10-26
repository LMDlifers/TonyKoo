CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  transcript TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoke_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS shares_expiry ON shares(expires_at);

CREATE TABLE IF NOT EXISTS feedback (
  answer_id TEXT PRIMARY KEY,
  rating TEXT NOT NULL CHECK (rating IN ('helpful', 'not_helpful')),
  comment TEXT NOT NULL,
  source_ids TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS feedback_created ON feedback(created_at);

CREATE TABLE IF NOT EXISTS daily_ai_usage (
  day TEXT PRIMARY KEY,
  calls INTEGER NOT NULL CHECK (calls >= 0)
);
