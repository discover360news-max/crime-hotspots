/**
 * Shared CSV Parsing Utilities
 *
 * Single source of truth for CSV parsing functions used across:
 * - src/lib/crimeData.ts (server-side)
 * - src/scripts/dashboardDataLoader.ts (client-side)
 * - src/lib/areaAliases.ts (client-side)
 *
 * Created: Jan 17, 2026
 * Updated: Mar 2026 — replaced hand-rolled parser with Papaparse (Phase 1 D1 migration)
 */

import Papa from 'papaparse';

/**
 * Parse a single CSV line into an array of field values.
 * Backed by Papaparse — handles "" escaped quotes correctly.
 * For full-file parsing (including embedded newlines), use parseFullCSV().
 *
 * @param line - Single line from CSV
 * @returns Array of trimmed field values
 */
export function parseCSVLine(line: string): string[] {
  const result = Papa.parse<string[]>(line, {
    header: false,
    skipEmptyLines: false,
    transform: (value: string) => value.trim(),
  });
  return (result.data[0] as string[]) ?? [];
}

/**
 * Parse a full CSV text into a 2D array of rows × fields.
 * Handles quoted commas, "" escaped quotes, and embedded newlines.
 * Row 0 is the header row; rows 1+ are data rows.
 * Empty lines are skipped automatically.
 *
 * @param csvText - Full CSV text string
 * @returns string[][] where [0] is headers, [1..] are data rows
 */
export function parseFullCSV(csvText: string): string[][] {
  const result = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
    transform: (value: string) => value.trim(),
  });
  return result.data as string[][];
}

/**
 * Build a column-name → index map from an already-parsed header row.
 * Column names are normalised to lowercase for case-insensitive lookup.
 *
 * @param headers - Parsed header row (string[])
 * @returns Map of lowercase column name to zero-based column index
 */
export function createColumnMapFromArray(headers: string[]): Map<string, number> {
  const columnMap = new Map<string, number>();
  headers.forEach((header, index) => {
    columnMap.set(header.trim().toLowerCase(), index);
  });
  return columnMap;
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
 * Generate stable slug from Story_ID prefix + headline words
 * Format: "00842-missing-man-found-dead-princes-town"
 *
 * @param storyId - Story_ID from CSV (e.g. "00842")
 * @param headline - Crime headline
 * @returns URL-safe slug with ID prefix
 */
export function generateSlugWithId(storyId: string, headline: string): string {
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

/**
 * Generate URL-safe slug from a name (area, region, etc.)
 * Canonical implementation — used by both server and client code.
 */
export function generateNameSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}
