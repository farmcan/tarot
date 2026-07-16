CREATE TABLE IF NOT EXISTS product_event_daily (
  event_date TEXT NOT NULL,
  event_name TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'default',
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_date, event_name, variant)
);

CREATE INDEX IF NOT EXISTS idx_product_event_daily_name_date
ON product_event_daily (event_name, event_date DESC);
