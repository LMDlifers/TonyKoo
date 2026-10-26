CREATE TABLE IF NOT EXISTS daily_share_usage (
  day TEXT PRIMARY KEY,
  shares INTEGER NOT NULL CHECK (shares >= 0)
);
