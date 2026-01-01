/**
 * Crime Data Fetcher
 * Fetches and processes crime data from Google Sheets CSV
 */

export interface Crime {
  date: string;
  headline: string;
  crimeType: string;
  primaryCrimeType?: string; // New 2026 field
  relatedCrimeTypes?: string; // New 2026 field (comma-separated)
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

// Year-specific CSV URLs for Trinidad
const TRINIDAD_CSV_URLS = {
  2025: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv',
  2026: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1963637925&single=true&output=csv',

  // Production sheet (current year - switched to 2026 on Jan 1, 2026)
  current: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1963637925&single=true&output=csv'
};

/**
 * Fetch and parse crime data from a CSV URL
 * Uses column header mapping to support different CSV layouts
 */
async function fetchCrimeDataFromURL(csvUrl: string): Promise<Crime[]> {
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    const lines = csvText.split('\n');

    // Parse headers and create column mapping
    const headerValues = parseCSVLine(lines[0]);
    const columnMap = new Map<string, number>();
    headerValues.forEach((header, index) => {
      // Normalize header names (trim, lowercase)
      const normalizedHeader = header.trim().toLowerCase();
      columnMap.set(normalizedHeader, index);
    });

    // Debug: Log all column headers found
    console.log('📋 CSV Column Headers:', Array.from(columnMap.keys()));

    const crimes: Crime[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line);

      // Helper function to get value by column name
      const getColumn = (columnName: string): string => {
        const index = columnMap.get(columnName.toLowerCase());
        return index !== undefined ? (values[index] || '') : '';
      };

      // Extract values using column mapping
      const headline = getColumn('Headline');
      const summary = getColumn('Summary');
      const primaryCrimeType = getColumn('primaryCrimeType');
      const relatedCrimeTypes = getColumn('relatedCrimeType') || getColumn('relatedCrimeTypes');
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

      crimes.push({
        date,
        headline,
        crimeType,
        primaryCrimeType: primaryCrimeType || undefined,
        relatedCrimeTypes: relatedCrimeTypes || undefined,
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
 * Parse CSV line handling quoted commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse date string (handles M/D/YYYY format)
 */
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

/**
 * Generate SEO-friendly slug from headline and date
 */
function generateSlug(headline: string, date: Date): string {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const slugText = headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);

  return `${slugText}-${dateStr}`;
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
