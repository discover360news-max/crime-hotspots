/**
 * Area Aliases Data Loader
 *
 * Fetches RegionData CSV and creates a lookup map for area -> local name mapping.
 *
 * CSV Structure:
 * Area, Region, Division, known_as
 *
 * Usage:
 * const aliases = await loadAreaAliases();
 * const localName = aliases.get('Warrenville'); // Returns local name or undefined
 */

const REGION_DATA_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=910363151&single=true&output=csv';

export interface AreaInfo {
  area: string;
  region: string;
  division: string;
  knownAs: string; // Local name
}

/**
 * Fetches and parses the RegionData CSV
 * Returns a Map of area name -> local name
 */
export async function loadAreaAliases(): Promise<Map<string, string>> {
  try {
    const response = await fetch(REGION_DATA_CSV_URL);
    if (!response.ok) {
      console.error('Failed to fetch RegionData CSV:', response.statusText);
      return new Map();
    }

    const csvText = await response.text();
    return parseAreaAliases(csvText);
  } catch (error) {
    console.error('Error loading area aliases:', error);
    return new Map();
  }
}

/**
 * Helper function to parse a CSV line properly (handles quoted fields with commas)
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
 * Strips surrounding quotes and smart quotes from a string
 */
function stripQuotes(str: string): string {
  // Remove regular quotes, smart quotes, and any whitespace
  return str.replace(/^[""\u201C\u201D]+|[""\u201C\u201D]+$/g, '').trim();
}

/**
 * Parses CSV text and creates area -> local name map
 */
export function parseAreaAliases(csvText: string): Map<string, string> {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return new Map();

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => stripQuotes(h));

  // Find column indices
  const areaIndex = headers.indexOf('Area');
  const knownAsIndex = headers.indexOf('known_as');

  if (areaIndex === -1 || knownAsIndex === -1) {
    console.error('Missing required columns in RegionData CSV');
    return new Map();
  }

  const aliasMap = new Map<string, string>();

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line).map((col) => stripQuotes(col));

    const area = columns[areaIndex];
    const knownAs = columns[knownAsIndex];

    // Only add to map if:
    // 1. Area exists
    // 2. knownAs exists and is not empty
    // 3. knownAs is different from area (no point showing identical tooltip)
    if (area && knownAs && knownAs !== area) {
      aliasMap.set(area, knownAs);
    }
  }

  return aliasMap;
}

/**
 * Gets the local name for an area, or undefined if none exists
 */
export function getLocalName(
  aliasMap: Map<string, string>,
  area: string
): string | undefined {
  return aliasMap.get(area);
}
