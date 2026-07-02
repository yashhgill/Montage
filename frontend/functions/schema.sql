CREATE TABLE IF NOT EXISTS event_bookings (
  reference TEXT PRIMARY KEY,
  status TEXT DEFAULT 'pending',
  heard_from TEXT,
  heard_from_detail TEXT,
  is_complimentary INTEGER DEFAULT 0,
  package_id TEXT,
  package_name TEXT,
  package_price TEXT,
  venue TEXT,
  event_date TEXT,
  time_slot TEXT,
  pax TEXT,
  notes TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  bill_code TEXT,
  deposit_rm INTEGER DEFAULT 500,
  calendar_event_id TEXT,
  email_sent INTEGER DEFAULT 0,
  created_at TEXT,
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_date_slot ON event_bookings (event_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_status ON event_bookings (status);
