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

-- FTS5 virtual table for site search (/api/search endpoint)
-- story_id and url are UNINDEXED (stored but not full-text searched)
-- title = headline (weight 10 in bm25), body = area+region+crimeType+street+summary (weight 1)
-- Populated by sync worker on every full sync (DELETE all + re-insert)
-- Run once to apply: wrangler d1 execute crime-hotspots-db --remote --command="CREATE VIRTUAL TABLE IF NOT EXISTS crimes_fts USING fts5(story_id UNINDEXED, title, body, url UNINDEXED)"
CREATE VIRTUAL TABLE IF NOT EXISTS crimes_fts USING fts5(
  story_id UNINDEXED,
  title,
  body,
  url UNINDEXED
);
