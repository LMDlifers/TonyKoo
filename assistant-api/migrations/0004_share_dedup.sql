ALTER TABLE shares ADD COLUMN fingerprint TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS shares_fingerprint ON shares(fingerprint);
