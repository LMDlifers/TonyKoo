CREATE TABLE IF NOT EXISTS daily_ai_usage_by_client (
  day TEXT NOT NULL,
  client_hash TEXT NOT NULL,
  calls INTEGER NOT NULL CHECK (calls >= 0),
  PRIMARY KEY (day, client_hash)
);
