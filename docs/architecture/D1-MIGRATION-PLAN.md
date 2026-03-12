# Data Layer Migration Plan: CSV → Cloudflare D1

**Created:** March 12, 2026
**Status:** Approved — not yet started
**Owner:** Kavell Forde
**Context session:** Full CSV/data-layer architecture review

---

## Why We Are Doing This

The current approach (Google Sheets CSV → custom parser → in-memory array) works at
30–50 users/day but has a compounding structural problem:

- Every new year = new CSV URL + new sheet + manual sync of any schema changes across all sheets
- `csv-cache.json` grows unboundedly (already 559k tokens bundled into the Worker)
- The dashboard makes **3 CSV fetches per user visit** direct to Google Sheets
- All filtering is done in-memory (load full dataset, JS `.filter()`) — fine now, costly at scale

**D1 fixes all of these without changing GAS or Google Sheets.**

---

## What Stays the Same

- GAS pipeline (RSS → Claude Haiku → Google Sheets) — untouched
- Google Sheets — still the human-readable admin/audit view
- All Astro page components — untouched
- `Crime` TypeScript interface — same shape
- `csvUrls.ts` — still used by the cron sync Worker

---

## The Three Phases

---

### Phase 1 — Replace the CSV Parser with Papaparse

**Status:** Complete (Mar 12, 2026)
**Effort:** ~2 hours
**Risk:** Low

**Problem:** The hand-rolled `parseCSVLine()` in `csvParser.ts` doesn't handle:
- `""` escaped quotes within fields (we patched around this with B008 column fallbacks)
- Newlines embedded inside quoted fields

**Fix:** Swap `parseCSVLine` for Papaparse's `parse()`. Both `crimeData.ts` and
`dashboardDataLoader.ts` import from `csvParser.ts`, so both get fixed in one change.

**Files touched:**
- `src/lib/csvParser.ts` — replace `parseCSVLine()` implementation
- `package.json` — add `papaparse` + `@types/papaparse`

**Nothing else changes.** This is a standalone improvement that's worth doing regardless
of whether Phase 2 ever happens.

---

### Phase 2 — Cloudflare D1 + Cron Sync Worker

**Status:** Not started
**Effort:** 1–2 days
**Risk:** Medium (new infrastructure, but rollback is straightforward)

#### D1 Schema

```sql
CREATE TABLE crimes (
  story_id            TEXT PRIMARY KEY,
  date                TEXT NOT NULL,
  headline            TEXT NOT NULL,
  summary             TEXT,
  crime_type          TEXT,
  primary_crime_type  TEXT,
  related_crime_types TEXT,   -- comma-separated string, same as CSV
  victim_count        INTEGER,             -- NULL for 2025 rows (field not collected); app layer defaults to 1
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

CREATE INDEX idx_year   ON crimes(year);
CREATE INDEX idx_area   ON crimes(area);
CREATE INDEX idx_region ON crimes(region);
CREATE INDEX idx_slug   ON crimes(slug);
```

**Key decisions:**
- `story_id` is the `PRIMARY KEY` — always populated on all 2025+ rows (confirmed)
- `victim_count` is nullable (no DEFAULT). 2025 rows insert NULL — the `Crime` interface marks
  it optional and all app logic already falls back to 1 for null/undefined. When 2025 data is
  later enriched in Sheets, the daily cron automatically upserts the updated rows via
  `INSERT OR REPLACE` — no manual re-migration needed.
- `primary_crime_type` is also nullable — same reasoning as victim_count for 2025 rows
- `related_crime_types` stays comma-separated for now — Phase 2 doesn't change the data model,
  just the storage layer

#### Cron Sync Worker

New file: `workers/crime-sync/index.ts`

- **Trigger:** Cloudflare Cron, once daily (site is stats-driven, not breaking-news sensitive)
- **Logic:** For every year URL in `TRINIDAD_CSV_URLS` — fetch CSV → parse with Papaparse →
  `INSERT OR REPLACE INTO crimes` by `story_id` — only new or changed rows write
- **Why all years, not just current:** If 2025 data is later enriched in Sheets (e.g. victim
  counts backfilled, geocodes corrected), the daily cron automatically propagates those updates
  to D1 within 24 hours. No manual re-migration needed. Fetching an extra 1,500-row CSV once
  daily is negligible overhead.
- **historicalTrends:** Not synced by cron — that URL is removed after the one-time migration

#### One-Time Migration Script

Runs once locally via Wrangler:
- Fetches all year CSVs (currently 2025 + current/2026)
- Bulk inserts all rows into D1 via `INSERT OR REPLACE`
- After this succeeds: `historicalTrends` URL removed from `csvUrls.ts`
  (the dashboard can query Nov-Dec 2025 rows directly from D1)

#### `crimeData.ts` Changes

Replace CSV fetch + parse with D1 queries:

| Current | After Phase 2 |
|---|---|
| `getTrinidadCrimes()` fetches 2 CSVs, parses, combines | `SELECT * FROM crimes ORDER BY year DESC, month DESC, day DESC` |
| `getCrimesByArea(area)` filters in-memory | `SELECT * FROM crimes WHERE LOWER(area) = LOWER(?)` |
| `getCrimesByRegion(region)` filters in-memory | `SELECT * FROM crimes WHERE LOWER(region) = LOWER(?)` |
| Module-level cache to avoid re-fetching | D1 is already low-latency — cache only if benchmarks show need |

#### What Gets Removed

- `src/data/csv-cache.json` — no longer needed (D1 is the reliable source)
- `src/integrations/csvBuildPlugin.ts` — no longer needed
- `historicalTrends` key from `csvUrls.ts`

---

### Phase 3 — Slim the Dashboard Client Payload

**Status:** Not started — do when Phase 2 is stable for 2–4 weeks
**Effort:** ~4 hours
**Risk:** Low

**Problem:** The dashboard currently makes 3 CSV fetches per user visit to Google Sheets:
1. `historicalTrends` (Nov-Dec 2025, trend baseline)
2. `current` (full 2026 dataset)
3. `REGION_DATA_CSV_URL` (area aliases)

At 30–50 users/day this is ~100–150 Google Sheets requests/day. At 500/day it's 1,500 — still
under Google limits but fragile and slow for users.

**Fix:** Replace `dashboardDataLoader.ts`'s 3 CSV fetches with one Cloudflare Pages Function
at `/api/dashboard?year=2026`. That endpoint queries D1 and returns pre-computed stats as
slim JSON. No raw CSV download in the browser.

The area aliases (`REGION_DATA_CSV_URL`) move to a small `area_aliases` table in D1 or a
static JSON file baked into the build — to be decided when we get here.

---

## Year Rollover Process (Post-Migration)

Before migration: adding a new year requires:
1. New Google Sheet tab + URL
2. New entry in `csvUrls.ts`
3. New entry in `csv-cache.json` (build plugin)
4. Manual GAS `TRINIDAD_CSV_URL` Script Property update

After migration:
1. Add new year's CSV URL to `TRINIDAD_CSV_URLS` in `csvUrls.ts` (one entry)
2. The daily cron picks it up automatically on next run — no code changes to the Worker needed
3. Done

---

## Rollback Plan

If D1 causes issues after Phase 2:
- `crimeData.ts` has a clear interface boundary — swap D1 queries back to CSV fetches
- `csv-cache.json` and `csvBuildPlugin.ts` can be restored from git
- The D1 database keeps running in the background until confirmed stable

---

## Continuation Prompt (New Session)

Paste this at the start of a new session to continue this work:

```
We are migrating the Crime Hotspots data layer from CSV (Google Sheets) to Cloudflare D1.
The full plan is documented in docs/architecture/D1-MIGRATION-PLAN.md — read that first.

Phase 1 (Papaparse) is complete. Continue with Phase 2 (D1 + Cron Sync Worker).

Decisions already locked — do not re-litigate these:
- story_id is PRIMARY KEY for all upserts (always populated on 2025+ rows)
- victim_count is nullable (no DEFAULT) — 2025 rows insert NULL; app layer already falls back
  to 1 for null/undefined in dashboardHelpers.ts and dashboardUpdates.ts
- Cron runs once daily and syncs ALL year CSVs — not just current. This ensures future
  2025 data enrichment (victim counts, geocodes) propagates automatically via INSERT OR REPLACE
- historicalTrends CSV is removed from csvUrls.ts after the one-time migration succeeds
- GAS pipeline and Google Sheets are NOT being changed — only the site's read layer changes

Before writing any code: read .memory/INDEX.md, then docs/claude-context/site-features.md.
```

---

## Change Log

| Date | Change |
|------|--------|
| 2026-03-12 | Plan created after full CSV/data-layer architecture review |
| 2026-03-12 | Phase 1 complete — Papaparse installed; parseCSVLine, parseCrimeDataFromText, fetchCrimesFromURL, fetchAreaAliases, parseAreaAliases, parseRegionPopulations, parseFullAreaData all updated to use parseFullCSV; build passes (2591 crimes) |
| 2026-03-12 | Phase 2 spec locked: victim_count nullable (NULL for 2025, app defaults to 1); cron syncs ALL year CSVs once daily (stats-driven site, not breaking-news); daily cron auto-propagates future 2025 data enrichment via INSERT OR REPLACE |
| 2026-03-12 | Phase 2 COMPLETE — workers/crime-sync/ created (schema.sql, index.ts, wrangler.toml); astro-poc/wrangler.toml + src/env.d.ts created; crimeData.ts: getAllCrimesFromD1/getCrimesByAreaFromD1/getCrimesByRegionFromD1 added; [slug].astro uses D1 at runtime with CSV fallback. Pre-rendered pages keep CSV + csvBuildPlugin (Phase 3). Build passes (2591 crimes). |
| 2026-03-12 | Infrastructure live — D1 database created (crime-hotspots-db, ID: 23311480-68d6-45ec-b351-e6185a5af80a); schema applied; cron Worker deployed at https://crime-sync.discover360news.workers.dev (daily 10:00 UTC). Pending (Kavell): (1) curl -X POST https://crime-sync.discover360news.workers.dev/sync to run one-time migration, (2) add DB binding in Pages dashboard, (3) redeploy Pages. |
