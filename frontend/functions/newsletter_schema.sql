CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email TEXT PRIMARY KEY,
  name TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_news_status ON newsletter_subscribers (status);
