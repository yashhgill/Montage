CREATE TABLE IF NOT EXISTS leads (
  phone TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  consent INTEGER DEFAULT 0,
  source TEXT DEFAULT 'website',
  event_type TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at);

-- If the leads table already exists without these columns, run:
-- ALTER TABLE leads ADD COLUMN event_type TEXT;
-- ALTER TABLE leads ADD COLUMN message TEXT;
