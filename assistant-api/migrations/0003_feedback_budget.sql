CREATE TABLE IF NOT EXISTS daily_feedback_usage (
  day TEXT PRIMARY KEY,
  submissions INTEGER NOT NULL CHECK (submissions >= 0)
);
