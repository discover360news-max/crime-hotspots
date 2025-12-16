/**
 * Crime Data Fetcher
 * Fetches and processes crime data from Google Sheets CSV
 */

export interface Crime {
  date: string;
  headline: string;
  crimeType: string;
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

const TRINIDAD_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv';

/**
 * Fetch and parse Trinidad crime data from Google Sheets CSV
 */
export async function getTrinidadCrimes(): Promise<Crime[]> {
  try {
    const response = await fetch(TRINIDAD_CSV_URL);
    const csvText = await response.text();

    const lines = csvText.split('\n');
    const headers = lines[0].split(',');

    const crimes: Crime[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line);

      const date = values[0] || '';
      const headline = values[1] || '';
      const crimeType = values[2] || '';
      const street = values[3] || '';
      const area = values[5] || '';
      const region = values[6] || '';
      const url = values[8] || '';
      const source = values[9] || '';
      const latitude = values[10] || '';
      const longitude = values[11] || '';
      const summary = values[12] || '';

      if (!headline || !date) continue;

      const dateObj = parseDate(date);

      // Skip entries with invalid dates
      if (isNaN(dateObj.getTime())) {
        console.warn(`Skipping entry with invalid date: ${date} - ${headline}`);
        continue;
      }

      const slug = generateSlug(headline, dateObj);

      crimes.push({
        date,
        headline,
        crimeType,
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

    return crimes.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  } catch (error) {
    console.error('Error fetching Trinidad crimes:', error);
    return [];
  }
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
