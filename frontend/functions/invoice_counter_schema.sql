CREATE TABLE IF NOT EXISTS invoice_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  next_number INTEGER DEFAULT 1
);
INSERT OR IGNORE INTO invoice_counter (id, next_number) VALUES (1, 1);
