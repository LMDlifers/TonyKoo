CREATE TABLE IF NOT EXISTS web_search_usage (
  period TEXT NOT NULL,
  scope TEXT NOT NULL,
  calls INTEGER NOT NULL CHECK(calls >= 0),
  PRIMARY KEY (period, scope)
);
