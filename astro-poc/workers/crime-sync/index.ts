/**
 * Crime Sync Worker — Cloudflare D1 Cron Sync
 *
 * Runs daily at 10:00 UTC (06:00 Trinidad).
 * Fetches ALL year CSVs from Google Sheets → upserts into D1 via INSERT OR REPLACE.
 *
 * Why all years (not just current):
 *   If 2025 data is later enriched (victim counts, geocodes backfilled in Sheets),
 *   the daily cron propagates those changes to D1 automatically within 24 hours.
 *
 * URL sources: keep in sync with astro-poc/src/config/csvUrls.ts
 */

import Papa from 'papaparse';

export interface Env {
  DB: D1Database;
  // Optional: set SYNC_SECRET to protect the POST /sync endpoint
  SYNC_SECRET?: string;
}

// Year CSV URLs — mirrors TRINIDAD_CSV_URLS in astro-poc/src/config/csvUrls.ts.
// 'current' is the same sheet as the latest year, so we don't add it separately.
// historicalTrends is intentionally excluded (one-time migration only; removed post-migration).
const YEAR_CSV_URLS: Record<string, string> = {
  '2025': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv',
  '2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1963637925&single=true&output=csv',
};

// ============================================================================
// SLUG GENERATION (mirrors csvParser.ts — keep in sync)
// ============================================================================

function generateSlug(headline: string, date: Date): string {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const slugText = headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
  return `${slugText}-${dateStr}`;
}

function generateSlugWithId(storyId: string, headline: string): string {
  const words = headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0)
    .slice(0, 6)
    .join('-');
  return `${storyId}-${words}`;
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0]) - 1;
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

// ============================================================================
// CSV ROW HELPERS
// ============================================================================

type CsvRow = Record<string, string>;

/** Returns the first non-empty value for any of the given column names (case-insensitive). */
function col(row: CsvRow, ...names: string[]): string {
  for (const name of names) {
    const key = Object.keys(row).find(k => k.trim().toLowerCase() === name.toLowerCase());
    if (key && row[key]?.trim()) return row[key].trim();
  }
  return '';
}

function parseNullableInt(value: string): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return isNaN(n) || n < 0 ? null : n;
}

function parseNullableFloat(value: string): number | null {
  if (!value) return null;
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

// ============================================================================
// CORE SYNC LOGIC
// ============================================================================

const BATCH_SIZE = 100;

const INSERT_SQL = `
  INSERT OR REPLACE INTO crimes (
    story_id, date, headline, summary, crime_type, primary_crime_type,
    related_crime_types, victim_count, street, area, region, url, source,
    latitude, longitude, date_published, date_updated, slug, old_slug,
    year, month, day
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const INSERT_FTS_SQL = `
  INSERT INTO crimes_fts(story_id, title, body, url) VALUES (?, ?, ?, ?)
`;

async function syncCsvToD1(db: D1Database, csvUrl: string, year: string): Promise<number> {
  console.log(`[sync] Fetching ${year} CSV...`);
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`[sync] HTTP ${response.status} fetching ${year} CSV`);
  }
  const csvText = await response.text();

  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value: string) => value.trim(),
  });

  const rows = parsed.data;
  console.log(`[sync] Parsed ${rows.length} rows from ${year} CSV`);

  let upsertCount = 0;
  let skipCount = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const stmts: D1PreparedStatement[] = [];

    for (const row of batch) {
      const rawStoryId = col(row, 'story_id');
      const headline = col(row, 'Headline');
      const dateStr = col(row, 'Date');

      // Skip rows missing required fields or story_id (can't upsert without PK)
      if (!rawStoryId || !headline || !dateStr) {
        skipCount++;
        continue;
      }

      const dateObj = parseDate(dateStr);
      if (isNaN(dateObj.getTime())) {
        skipCount++;
        continue;
      }

      // Normalize date to YYYY-MM-DD for correct string-comparison in SQL range queries
      const normalizedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

      // Year-prefix the PK to prevent ID collisions across years (each year's CSV restarts from 1)
      const storyId = `${year}-${rawStoryId}`;
      const oldSlug = generateSlug(headline, dateObj);
      // Slug uses the raw ID (not year-prefixed) — these are the public-facing URLs
      const slug = generateSlugWithId(rawStoryId, headline);

      const summary = col(row, 'Summary') || null;
      const crimeType = col(row, 'Crime Type', 'crimeType') || null;
      const primaryCrimeType = col(row, 'primaryCrimeType') || null;
      const relatedCrimeTypes = col(row, 'relatedCrimeType', 'relatedCrimeTypes') || null;
      const victimCountStr = col(row, 'victimCount', 'victimcount', 'Victim Count');
      const victimCount = parseNullableInt(victimCountStr); // NULL for 2025 rows
      const street = col(row, 'Street Address', 'Street') || null;
      const area = col(row, 'Area') || null;
      const region = col(row, 'Region') || null;
      const url = col(row, 'URL') || null;
      const source = col(row, 'Source') || null;
      const latitude = parseNullableFloat(col(row, 'Latitude'));
      const longitude = parseNullableFloat(col(row, 'Longitude'));
      const datePublished = col(row, 'Date_Published') || null;
      const dateUpdated = col(row, 'Date_Updated') || null;

      stmts.push(
        db.prepare(INSERT_SQL).bind(
          storyId,
          normalizedDate,
          headline,
          summary,
          crimeType,
          primaryCrimeType,
          relatedCrimeTypes,
          victimCount,
          street,
          area,
          region,
          url,
          source,
          latitude,
          longitude,
          datePublished,
          dateUpdated,
          slug,
          oldSlug,
          dateObj.getFullYear(),
          dateObj.getMonth() + 1,
          dateObj.getDate(),
        ),
      );

      // FTS entry — title=headline, body=searchable metadata fields
      const ftsBody = [area, region, crimeType, street, summary].filter(Boolean).join(' ');
      const ftsUrl = `/trinidad/crime/${slug}/`;
      stmts.push(db.prepare(INSERT_FTS_SQL).bind(storyId, headline, ftsBody, ftsUrl));

      upsertCount++;
    }

    if (stmts.length > 0) {
      await db.batch(stmts);
    }
  }

  console.log(`[sync] ${year}: upserted ${upsertCount}, skipped ${skipCount}`);
  return upsertCount;
}

async function runFullSync(db: D1Database): Promise<void> {
  const start = Date.now();
  let total = 0;

  // Clear FTS before re-syncing so stale entries don't accumulate
  await db.prepare('DELETE FROM crimes_fts').run();
  console.log('[sync] crimes_fts cleared — will re-populate from CSV');

  for (const [year, url] of Object.entries(YEAR_CSV_URLS)) {
    const count = await syncCsvToD1(db, url, year);
    total += count;
  }

  console.log(`[sync] Full sync complete: ${total} rows upserted in ${Date.now() - start}ms`);
}

// ============================================================================
// WORKER EXPORT
// ============================================================================

export default {
  // Cron trigger — runs daily at 10:00 UTC
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await runFullSync(env.DB);
  },

  // HTTP handler — POST /sync (protected by SYNC_SECRET) for manual trigger / one-time migration
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/sync') {
      // Require secret if configured
      if (env.SYNC_SECRET) {
        const auth = request.headers.get('x-sync-secret');
        if (auth !== env.SYNC_SECRET) {
          return new Response('Unauthorized', { status: 401 });
        }
      }
      try {
        await runFullSync(env.DB);
        return new Response('Sync complete', { status: 200 });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[sync] Sync failed:', message);
        return new Response(`Sync failed: ${message}`, { status: 500 });
      }
    }

    return new Response('Crime Sync Worker — POST /sync to trigger manually', { status: 200 });
  },
};
