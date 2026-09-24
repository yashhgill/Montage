-- Stores admin overrides for site images.
-- key = a unique identifier (e.g. "hero.0", "gallery.photo.3", "service.bar.photo.0")
-- url = the R2 (or any HTTPS) image URL replacing the default
-- label = human-readable description shown in the admin panel
CREATE TABLE IF NOT EXISTS site_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT NOT NULL UNIQUE,
  url        TEXT NOT NULL,
  label      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_site_images_key ON site_images(key);
