CREATE TABLE IF NOT EXISTS expo_prizes (
  code TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  score INTEGER,
  discount_pct INTEGER,
  status TEXT DEFAULT 'issued',
  valid_until TEXT,
  created_at TEXT,
  redeemed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_expo_created ON expo_prizes (created_at);
