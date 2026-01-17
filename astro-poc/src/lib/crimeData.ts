/**
 * Crime Data Fetcher
 * Fetches and processes crime data from Google Sheets CSV
 */

import { parseCSVLine, parseDate, generateSlug, createColumnMap, getColumnValue } from './csvParser';
import { TRINIDAD_CSV_URLS } from '../config/csvUrls';

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

      // Parse victim count (default to 1 if not provided or invalid)
      const victimCount = victimCountStr ? parseInt(victimCountStr, 10) : 1;
      const validVictimCount = !isNaN(victimCount) && victimCount > 0 ? victimCount : 1;

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
 */
export async function getTrinidadCrimes(): Promise<Crime[]> {
  const allCrimes: Crime[] = [];

  // Fetch 2025 data (only if it's different from current sheet)
  if (TRINIDAD_CSV_URLS[2025] && TRINIDAD_CSV_URLS[2025] !== TRINIDAD_CSV_URLS.current) {
    const crimes2025 = await fetchCrimeDataFromURL(TRINIDAD_CSV_URLS[2025]);
    allCrimes.push(...crimes2025);
    console.log(`Loaded ${crimes2025.length} crimes from 2025 sheet`);
  }

  // Fetch current/production sheet (always load this)
  const currentCrimes = await fetchCrimeDataFromURL(TRINIDAD_CSV_URLS.current);
  allCrimes.push(...currentCrimes);
  console.log(`Loaded ${currentCrimes.length} crimes from current sheet`);

  console.log(`Total crimes loaded: ${allCrimes.length}`);

  // Sort all crimes by date (newest first)
  return allCrimes.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
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
