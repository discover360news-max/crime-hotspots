/**
 * Shared CSV Parsing Utilities
 *
 * Single source of truth for CSV parsing functions used across:
 * - src/lib/crimeData.ts (server-side)
 * - src/scripts/dashboardDataLoader.ts (client-side)
 * - src/lib/areaAliases.ts (client-side)
 *
 * Created: Jan 17, 2026
 */

/**
 * Parse CSV line handling quoted commas
 * Properly handles fields that contain commas within quotes
 *
 * @param line - Single line from CSV
 * @returns Array of field values
 */
export function parseCSVLine(line: string): string[] {
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
 * Parse date string (handles M/D/YYYY format from Google Sheets)
 *
 * @param dateStr - Date string in M/D/YYYY format
 * @returns Date object
 */
export function parseDate(dateStr: string): Date {
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
 *
 * @param headline - Crime headline
 * @param date - Crime date
 * @returns URL-safe slug (e.g., "man-shot-in-port-of-spain-2026-01-15")
 */
export function generateSlug(headline: string, date: Date): string {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const slugText = headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);

  return `${slugText}-${dateStr}`;
}

/**
 * Strips surrounding quotes and smart quotes from a string
 * Useful for cleaning up CSV values
 *
 * @param str - String that may have quotes
 * @returns Cleaned string without surrounding quotes
 */
export function stripQuotes(str: string): string {
  // Remove regular quotes, smart quotes, and any whitespace
  return str.replace(/^[""\u201C\u201D]+|[""\u201C\u201D]+$/g, '').trim();
}

/**
 * Create column mapping from CSV header row
 *
 * @param headerLine - First line of CSV containing headers
 * @returns Map of lowercase column names to indices
 */
export function createColumnMap(headerLine: string): Map<string, number> {
  const headerValues = parseCSVLine(headerLine);
  const columnMap = new Map<string, number>();

  headerValues.forEach((header, index) => {
    // Normalize header names (trim, lowercase)
    const normalizedHeader = header.trim().toLowerCase();
    columnMap.set(normalizedHeader, index);
  });

  return columnMap;
}

/**
 * Get column value by name from parsed CSV values
 *
 * @param values - Parsed CSV values array
 * @param columnMap - Column name to index mapping
 * @param columnName - Name of column to retrieve
 * @returns Column value or empty string if not found
 */
export function getColumnValue(
  values: string[],
  columnMap: Map<string, number>,
  columnName: string
): string {
  const index = columnMap.get(columnName.toLowerCase());
  return index !== undefined ? (values[index] || '') : '';
}
