CREATE TABLE IF NOT EXISTS site_counters (
  counter_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_counters (counter_key, count)
VALUES ('site-visits', 0);
