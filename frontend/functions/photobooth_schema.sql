CREATE TABLE IF NOT EXISTS photobooth_entries (
  id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'awaiting_claim', -- awaiting_claim | claimed | ready
  raw_photo_key TEXT,
  ai_photo_key TEXT,
  style TEXT,
  guest_name TEXT,
  message TEXT,
  share_token TEXT,
  created_at TEXT,
  claimed_at TEXT,
  ready_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_photobooth_status ON photobooth_entries (status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_photobooth_share ON photobooth_entries (share_token);
