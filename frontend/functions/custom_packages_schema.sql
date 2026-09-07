CREATE TABLE IF NOT EXISTS custom_packages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  token       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  items_json  TEXT NOT NULL DEFAULT '[]',
  total_rm    REAL NOT NULL,
  deposit_rm  REAL NOT NULL DEFAULT 500,
  status      TEXT NOT NULL DEFAULT 'pending',
  promo_allowed INTEGER NOT NULL DEFAULT 1,
  expires_at  TEXT,
  created_at  TEXT NOT NULL,
  used_at     TEXT,
  reference   TEXT
);
CREATE INDEX IF NOT EXISTS idx_custom_packages_token ON custom_packages(token);
