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

import { parseCSVLine, parseDate, generateSlug, createColumnMap, getColumnValue } from './csvParser';
import { TRINIDAD_CSV_URLS } from '../config/csvUrls';

// ============================================================================
// BUILD-TIME CACHE
// Module-level cache persists across all page builds in a single Astro build
// ============================================================================
let cachedCrimes: Crime[] | null = null;
let fetchPromise: Promise<Crime[]> | null = null;

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
  // Computed fields
  slug: string;
  dateObj: Date;
  year: number;
  month: number;
  day: number;
}

/**
 * Fetch and parse crime data from a CSV URL
 * Uses column header mapping to support different CSV layouts
 */
async function fetchCrimeDataFromURL(csvUrl: string): Promise<Crime[]> {
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    const lines = csvText.split('\n');

    // Parse headers and create column mapping using shared utility
    const columnMap = createColumnMap(lines[0]);

    // Debug: Log all column headers found
    console.log('📋 CSV Column Headers:', Array.from(columnMap.keys()));

    const crimes: Crime[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line);

      // Helper function using shared getColumnValue
      const getColumn = (columnName: string): string => getColumnValue(values, columnMap, columnName);

      // Extract values using column mapping
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

      const slug = generateSlug(headline, dateObj);

      // Parse victim count (default to 1 if not provided, allow 0 for victimless crimes)
      const victimCount = victimCountStr ? parseInt(victimCountStr, 10) : 1;
      const validVictimCount = !isNaN(victimCount) && victimCount >= 0 ? victimCount : 1;

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
        slug,
        dateObj,
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1,
        day: dateObj.getDate(),
      });
    }

    return crimes;
  } catch (error) {
    console.error('Error fetching crime data from URL:', csvUrl, error);
    return [];
  }
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
      const crimes2025 = await fetchCrimeDataFromURL(TRINIDAD_CSV_URLS[2025]);
      allCrimes.push(...crimes2025);
      console.log(`✅ Loaded ${crimes2025.length} crimes from 2025 sheet`);
    }

    // Fetch current/production sheet (always load this)
    const currentCrimes = await fetchCrimeDataFromURL(TRINIDAD_CSV_URLS.current);
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

/**
 * Generate URL-safe slug from a name (area, region, etc.)
 */
export function generateNameSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}
