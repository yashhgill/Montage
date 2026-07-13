CREATE TABLE IF NOT EXISTS leads (
  phone TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  consent INTEGER DEFAULT 0,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new',
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at);
