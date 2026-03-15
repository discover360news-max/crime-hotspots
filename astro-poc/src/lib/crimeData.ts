/**
 * Crime Data Fetcher
 * Fetches and processes crime data from Google Sheets CSV
 *
 * BUILD-TIME CACHING:
 * Data is cached at the module level during build. This means:
 * - First page that calls getTrinidadCrimes() fetches from Google Sheets
 * - All subsequent pages reuse the cached data (no additional HTTP requests)
 * - This reduces build time significantly (from ~30 min to ~5-10 min)
 */

import { parseDate, generateSlug, generateSlugWithId, getColumnValue, generateNameSlug, parseFullCSV, createColumnMapFromArray } from './csvParser';
export { generateNameSlug }; // Re-exported for backward compatibility — canonical definition is in csvParser.ts
import { TRINIDAD_CSV_URLS } from '../config/csvUrls';
import csvCacheRaw from '../data/csv-cache.json';

// ============================================================================
// RUNTIME FALLBACK CACHE
// Bundled at build time from src/data/csv-cache.json (written by csvBuildPlugin).
// Used when Google Sheets is temporarily unreachable at runtime.
// ============================================================================
interface CsvCache {
  timestamp: string;
  rowCount: number;
  csvTexts: Record<string, string>;
}
const csvCache = csvCacheRaw as CsvCache;

// ============================================================================
// MODULE-LEVEL RUNTIME CACHE
// Persists across requests within the same Worker instance (warm requests).
// ============================================================================
let cachedCrimes: Crime[] | null = null;
let fetchPromise: Promise<Crime[]> | null = null;

// ============================================================================
// FETCH WITH RETRY (exponential backoff: 2s → 4s → 8s)
// 1 initial attempt + up to 3 retries = 4 total attempts maximum.
// ============================================================================
async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  const delays = [2000, 4000, 8000];
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = delays[attempt - 1] ?? 8000;
        const ts = new Date().toISOString();
        console.log(`[CSV] ${ts} Retry ${attempt}/${maxRetries} for ${url.slice(0, 60)}... (waiting ${delay / 1000}s)`);
        await new Promise(r => setTimeout(r, delay));
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.text();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[CSV] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.message}`);
    }
  }

  throw lastError ?? new Error('All retries exhausted');
}

export interface Crime {
  date: string;
  headline: string;
  crimeType: string;
  primaryCrimeType?: string; // New 2026 field
  relatedCrimeTypes?: string; // New 2026 field (comma-separated)
  victimCount?: number; // New 2026 field (applies to primary crime only)
  street: string;
  area: string;
  region: string;
  url: string;
  source: string;
  latitude: number;
  longitude: any;
  summary: string;
  // Optional entry/correction timestamps (from Date_Published / Date_Updated columns)
  datePublished?: Date;   // When the row was entered into the pipeline
  dateUpdated?: Date;     // When the story was corrected (filled manually in LIVE sheet)
  // Computed fields
  slug: string;
  storyId: string | null; // Story_ID from CSV; null if blank
  oldSlug: string;        // Legacy headline-date slug (for redirect fallback)
  dateObj: Date;
  year: number;
  month: number;
  day: number;
}

/**
 * Parse crime data from raw CSV text.
 * Uses column header mapping so column order doesn't matter.
 */
function parseCrimeDataFromText(csvText: string): Crime[] {
  const rows = parseFullCSV(csvText);
  if (rows.length < 2) return [];

  const columnMap = createColumnMapFromArray(rows[0]);

  // Debug: Log all column headers found (only once per session)
  console.log('📋 CSV Column Headers:', Array.from(columnMap.keys()));

  const crimes: Crime[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];

    // Helper function using shared getColumnValue — never accesses by index directly
    const getColumn = (columnName: string): string => getColumnValue(values, columnMap, columnName);

    // Extract values using column names (resilient to column reordering)
    const headline = getColumn('Headline');
    const summary = getColumn('Summary');
    const primaryCrimeType = getColumn('primaryCrimeType');
    const relatedCrimeTypes = getColumn('relatedCrimeType') || getColumn('relatedCrimeTypes');
    const victimCountStr = getColumn('victimCount') || getColumn('victimcount') || getColumn('Victim Count');
    const crimeType = getColumn('Crime Type') || getColumn('crimeType');
    const date = getColumn('Date');
    const street = getColumn('Street Address') || getColumn('Street');
    const area = getColumn('Area');
    const region = getColumn('Region');
    const url = getColumn('URL');
    const source = getColumn('Source');
    const latitude = getColumn('Latitude');
    const longitude = getColumn('Longitude');

    if (!headline || !date) continue;

    const dateObj = parseDate(date);

    // Skip entries with invalid dates
    if (isNaN(dateObj.getTime())) {
      continue;
    }

    const storyId = getColumn('story_id') || null;
    const oldSlug = generateSlug(headline, dateObj);
    const slug = storyId ? generateSlugWithId(storyId, headline) : oldSlug;

    // Parse victim count (default to 1 if not provided, allow 0 for victimless crimes)
    const victimCount = victimCountStr ? parseInt(victimCountStr, 10) : 1;
    const validVictimCount = !isNaN(victimCount) && victimCount >= 0 ? victimCount : 1;

    // Parse optional entry/correction timestamps
    const datePublishedStr = getColumn('Date_Published');
    const dateUpdatedStr = getColumn('Date_Updated');
    const datePublishedObj = datePublishedStr ? parseDate(datePublishedStr) : undefined;
    const dateUpdatedObj = dateUpdatedStr ? parseDate(dateUpdatedStr) : undefined;

    crimes.push({
      date,
      headline,
      crimeType,
      primaryCrimeType: primaryCrimeType || undefined,
      relatedCrimeTypes: relatedCrimeTypes || undefined,
      victimCount: validVictimCount,
      street,
      area,
      region,
      url,
      source,
      latitude: Number(latitude),
      longitude: Number(longitude),
      summary,
      datePublished: datePublishedObj && !isNaN(datePublishedObj.getTime()) ? datePublishedObj : undefined,
      dateUpdated: dateUpdatedObj && !isNaN(dateUpdatedObj.getTime()) ? dateUpdatedObj : undefined,
      slug,
      storyId,
      oldSlug,
      dateObj,
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      day: dateObj.getDate(),
    });
  }

  return crimes;
}

/**
 * Fetch CSV from a URL with retry, falling back to bundled cache on failure.
 * cacheKey matches the key in csv-cache.json (e.g. '2025', 'current').
 */
async function fetchCrimeDataFromURL(csvUrl: string, cacheKey: string): Promise<Crime[]> {
  let csvText: string;
  try {
    csvText = await fetchWithRetry(csvUrl);
  } catch (error) {
    // All retries failed — fall back to the bundled cache snapshot
    const cachedText = csvCache.csvTexts[cacheKey] ?? '';
    if (!cachedText) {
      console.error(`[CSV] FETCH FAILED for '${cacheKey}' — no cached data available. Returning empty.`);
      return [];
    }
    const cacheTs = csvCache.timestamp || 'unknown';
    console.warn(`[CSV] ⚠️ CSV FETCH FAILED — using cached data from ${cacheTs} (key: ${cacheKey})`);
    csvText = cachedText;
  }
  return parseCrimeDataFromText(csvText);
}

/**
 * Fetch and parse Trinidad crime data from ALL year sheets
 * Returns all years combined and sorted by date (newest first)
 *
 * CACHING: Data is fetched once per build and cached for all subsequent calls.
 * This dramatically reduces build time by avoiding repeated HTTP requests.
 */
export async function getTrinidadCrimes(): Promise<Crime[]> {
  // Return cached data if available
  if (cachedCrimes !== null) {
    console.log(`📦 Using cached crime data (${cachedCrimes.length} crimes)`);
    return cachedCrimes;
  }

  // If a fetch is already in progress, wait for it (prevents race conditions)
  if (fetchPromise !== null) {
    console.log('⏳ Waiting for in-progress data fetch...');
    return fetchPromise;
  }

  // Start fetching and store the promise
  fetchPromise = (async () => {
    console.log('🔄 Fetching crime data from Google Sheets (first request)...');
    const allCrimes: Crime[] = [];

    // Fetch 2025 data (only if it's different from current sheet)
    if (TRINIDAD_CSV_URLS[2025] && TRINIDAD_CSV_URLS[2025] !== TRINIDAD_CSV_URLS.current) {
      const crimes2025 = await fetchCrimeDataFromURL(TRINIDAD_CSV_URLS[2025], '2025');
      allCrimes.push(...crimes2025);
      console.log(`✅ Loaded ${crimes2025.length} crimes from 2025 sheet`);
    }

    // Fetch current/production sheet (always load this)
    const currentCrimes = await fetchCrimeDataFromURL(TRINIDAD_CSV_URLS.current, 'current');
    allCrimes.push(...currentCrimes);
    console.log(`✅ Loaded ${currentCrimes.length} crimes from current sheet`);

    // Sort all crimes by date (newest first)
    const sortedCrimes = allCrimes.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    // Cache the result
    cachedCrimes = sortedCrimes;
    console.log(`💾 Cached ${cachedCrimes.length} total crimes for build`);

    return sortedCrimes;
  })();

  return fetchPromise;
}

/**
 * Get crimes by year/month
 */
export async function getCrimesByMonth(year: number, month: number): Promise<Crime[]> {
  const allCrimes = await getTrinidadCrimes();
  return allCrimes.filter(crime => crime.year === year && crime.month === month);
}

/**
 * Get crimes by region
 */
export async function getCrimesByRegion(region: string): Promise<Crime[]> {
  const allCrimes = await getTrinidadCrimes();
  return allCrimes.filter(crime =>
    crime.region.toLowerCase() === region.toLowerCase()
  );
}

/**
 * Get crimes by type
 */
export async function getCrimesByType(type: string): Promise<Crime[]> {
  const allCrimes = await getTrinidadCrimes();
  return allCrimes.filter(crime =>
    crime.crimeType.toLowerCase() === type.toLowerCase()
  );
}

/**
 * Get unique years for archive navigation
 */
export async function getAvailableYears(): Promise<number[]> {
  const allCrimes = await getTrinidadCrimes();
  const years = new Set(allCrimes.map(c => c.year));
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Get unique regions
 */
export async function getAvailableRegions(): Promise<string[]> {
  const allCrimes = await getTrinidadCrimes();
  const regions = new Set(allCrimes.map(c => c.region).filter(r => r));
  return Array.from(regions).sort();
}

/**
 * Get unique crime types
 */
export async function getAvailableCrimeTypes(): Promise<string[]> {
  const allCrimes = await getTrinidadCrimes();
  const types = new Set(allCrimes.map(c => c.crimeType).filter(t => t));
  return Array.from(types).sort();
}

/**
 * Get crimes by area
 */
export async function getCrimesByArea(area: string): Promise<Crime[]> {
  const allCrimes = await getTrinidadCrimes();
  return allCrimes.filter(crime =>
    crime.area.toLowerCase() === area.toLowerCase()
  );
}

/**
 * Get unique areas that have crime data
 */
export async function getAvailableAreas(): Promise<string[]> {
  const allCrimes = await getTrinidadCrimes();
  const areas = new Set(allCrimes.map(c => c.area).filter(a => a));
  return Array.from(areas).sort();
}

// ============================================================================
// D1 DATABASE QUERIES (SSR runtime only — pre-rendered pages use getTrinidadCrimes())
// ============================================================================

interface D1CrimeRow {
  story_id: string;
  date: string;
  headline: string;
  summary: string | null;
  crime_type: string | null;
  primary_crime_type: string | null;
  related_crime_types: string | null;
  victim_count: number | null;
  street: string | null;
  area: string | null;
  region: string | null;
  url: string | null;
  source: string | null;
  latitude: number | null;
  longitude: number | null;
  date_published: string | null;
  date_updated: string | null;
  slug: string;
  old_slug: string;
  year: number;
  month: number;
  day: number;
}

function mapD1RowToCrime(row: D1CrimeRow): Crime {
  // Reconstruct dateObj from stored year/month/day (avoids re-parsing the date string)
  const dateObj = new Date(row.year, row.month - 1, row.day);

  const datePublishedObj = row.date_published ? parseDate(row.date_published) : undefined;
  const dateUpdatedObj = row.date_updated ? parseDate(row.date_updated) : undefined;

  return {
    date: row.date,
    headline: row.headline,
    crimeType: row.crime_type ?? '',
    primaryCrimeType: row.primary_crime_type ?? undefined,
    relatedCrimeTypes: row.related_crime_types ?? undefined,
    // victim_count NULL means 2025 row (not yet collected) — app layer defaults to 1
    victimCount: row.victim_count ?? undefined,
    street: row.street ?? '',
    area: row.area ?? '',
    region: row.region ?? '',
    url: row.url ?? '',
    source: row.source ?? '',
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    summary: row.summary ?? '',
    datePublished: datePublishedObj && !isNaN(datePublishedObj.getTime()) ? datePublishedObj : undefined,
    dateUpdated: dateUpdatedObj && !isNaN(dateUpdatedObj.getTime()) ? dateUpdatedObj : undefined,
    slug: row.slug,
    // Strip year-prefix added by sync worker (e.g. "2025-1" → "1") to keep storyId consistent with CSV-parsed crimes
    storyId: row.story_id.replace(/^\d{4}-/, ''),
    oldSlug: row.old_slug,
    dateObj,
    year: row.year,
    month: row.month,
    day: row.day,
  };
}

/**
 * Fetch ALL crimes from D1, sorted newest-first.
 * Use this in SSR pages (pass Astro.locals.runtime.env.DB).
 * Pre-rendered pages continue using getTrinidadCrimes() at build time.
 */
export async function getAllCrimesFromD1(db: D1Database): Promise<Crime[]> {
  const { results } = await db
    .prepare('SELECT * FROM crimes ORDER BY year DESC, month DESC, day DESC')
    .all<D1CrimeRow>();
  return results.map(mapD1RowToCrime);
}

/**
 * Get crimes for a specific area from D1.
 */
export async function getCrimesByAreaFromD1(db: D1Database, area: string): Promise<Crime[]> {
  const { results } = await db
    .prepare('SELECT * FROM crimes WHERE LOWER(area) = LOWER(?) ORDER BY year DESC, month DESC, day DESC')
    .bind(area)
    .all<D1CrimeRow>();
  return results.map(mapD1RowToCrime);
}

/**
 * Get crimes for a specific region from D1.
 */
export async function getCrimesByRegionFromD1(db: D1Database, region: string): Promise<Crime[]> {
  const { results } = await db
    .prepare('SELECT * FROM crimes WHERE LOWER(region) = LOWER(?) ORDER BY year DESC, month DESC, day DESC')
    .bind(region)
    .all<D1CrimeRow>();
  return results.map(mapD1RowToCrime);
}

/**
 * Get crimes for a specific year from D1.
 * Used by /api/dashboard and /api/crimes endpoints.
 */
export async function getCrimesByYearFromD1(db: D1Database, year: number): Promise<Crime[]> {
  const { results } = await db
    .prepare('SELECT * FROM crimes WHERE year = ? ORDER BY month DESC, day DESC')
    .bind(year)
    .all<D1CrimeRow>();
  return results.map(mapD1RowToCrime);
}

/**
 * Get crimes for a specific year/month from D1.
 * Used by the /trinidad/archive/[year]/[month] SSR page.
 */
export async function getCrimesByMonthFromD1(db: D1Database, year: number, month: number): Promise<Crime[]> {
  const { results } = await db
    .prepare('SELECT * FROM crimes WHERE year = ? AND month = ? ORDER BY day DESC')
    .bind(year, month)
    .all<D1CrimeRow>();
  return results.map(mapD1RowToCrime);
}

/**
 * Get crimes within a date range from D1 (for trend windows).
 * Dates are YYYY-MM-DD strings matching the stored TEXT date column.
 * Naturally crosses year boundaries, eliminating the historicalTrends CSV.
 */
export async function getCrimesByDateRangeFromD1(
  db: D1Database,
  fromDate: string,
  toDate: string
): Promise<Crime[]> {
  const { results } = await db
    .prepare('SELECT * FROM crimes WHERE date >= ? AND date <= ? ORDER BY date DESC')
    .bind(fromDate, toDate)
    .all<D1CrimeRow>();
  return results.map(mapD1RowToCrime);
}
