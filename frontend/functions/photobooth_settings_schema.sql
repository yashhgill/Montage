CREATE TABLE IF NOT EXISTS photobooth_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  couple_names TEXT,
  duitnow_qr_key TEXT,
  capture_mode TEXT DEFAULT 'dslr', -- 'dslr' or 'device'
  updated_at TEXT
);
INSERT OR IGNORE INTO photobooth_settings (id, couple_names, capture_mode) VALUES (1, 'The Happy Couple', 'dslr');
