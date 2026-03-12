-- Cloudflare D1 schema for Crime Hotspots
-- Run once: wrangler d1 execute crime-hotspots-db --remote --file=workers/crime-sync/schema.sql

CREATE TABLE IF NOT EXISTS crimes (
  story_id            TEXT PRIMARY KEY,
  date                TEXT NOT NULL,
  headline            TEXT NOT NULL,
  summary             TEXT,
  crime_type          TEXT,
  primary_crime_type  TEXT,
  related_crime_types TEXT,   -- comma-separated string, same as CSV
  victim_count        INTEGER,             -- NULL for 2025 rows; app layer defaults to 1
  street              TEXT,
  area                TEXT,
  region              TEXT,
  url                 TEXT,
  source              TEXT,
  latitude            REAL,
  longitude           REAL,
  date_published      TEXT,
  date_updated        TEXT,
  slug                TEXT,
  old_slug            TEXT,
  year                INTEGER NOT NULL,
  month               INTEGER NOT NULL,
  day                 INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_year     ON crimes(year);
CREATE INDEX IF NOT EXISTS idx_area     ON crimes(area);
CREATE INDEX IF NOT EXISTS idx_region   ON crimes(region);
CREATE INDEX IF NOT EXISTS idx_slug     ON crimes(slug);
CREATE INDEX IF NOT EXISTS idx_old_slug ON crimes(old_slug);
