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

import { parseFullCSV, stripQuotes } from './csvParser';
import { REGION_DATA_CSV_URL, REGION_POPULATION_CSV_URL, JAMAICA_REGION_DATA_CSV_URL } from '../config/csvUrls';

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
 * Parses CSV text and creates area -> local name map
 */
export function parseAreaAliases(csvText: string): Map<string, string> {
  const rows = parseFullCSV(csvText);
  if (rows.length < 2) return new Map();

  const headers = rows[0].map((h) => stripQuotes(h));

  // Find column indices
  const areaIndex = headers.indexOf('Area');
  const knownAsIndex = headers.indexOf('known_as');

  if (areaIndex === -1 || knownAsIndex === -1) {
    console.error('Missing required columns in RegionData CSV');
    return new Map();
  }

  const aliasMap = new Map<string, string>();

  for (let i = 1; i < rows.length; i++) {
    const columns = rows[i].map((col) => stripQuotes(col));
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

// ============================================================================
// REGION POPULATIONS (for per-capita risk calculations)
// ============================================================================

/**
 * Fetches region populations CSV and returns a Map of region name -> population.
 * Strips commas from numbers. Skips the totals summary row.
 */
export async function loadRegionPopulations(): Promise<Map<string, number>> {
  try {
    const response = await fetch(REGION_POPULATION_CSV_URL);
    if (!response.ok) {
      console.error('Failed to fetch region populations CSV:', response.statusText);
      return new Map();
    }
    const csvText = await response.text();
    return parseRegionPopulations(csvText);
  } catch (error) {
    console.error('Error loading region populations:', error);
    return new Map();
  }
}

export function parseRegionPopulations(csvText: string): Map<string, number> {
  const rows = parseFullCSV(csvText);
  if (rows.length < 2) return new Map();

  const headers = rows[0].map(h => stripQuotes(h));
  const regionIndex = headers.indexOf('Region');
  const populationIndex = headers.indexOf('population');

  if (regionIndex === -1 || populationIndex === -1) {
    console.error('Missing Region or population column in region populations CSV');
    return new Map();
  }

  const map = new Map<string, number>();

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].map(c => stripQuotes(c));
    const region = cols[regionIndex];
    const popStr = cols[populationIndex];

    // Skip totals/summary rows
    if (!region || region.toLowerCase().startsWith('total')) continue;

    // Strip commas from numbers e.g. "115,936" -> 115936
    const pop = parseInt(popStr.replace(/,/g, ''), 10);
    if (!isNaN(pop) && pop > 0) {
      map.set(region, pop);
    }
  }

  return map;
}

// ============================================================================
// FULL AREA DATA (for area/region pages)
// ============================================================================

let cachedAreaData: AreaInfo[] | null = null;

/**
 * Fetches and parses the RegionData CSV
 * Returns full AreaInfo[] with area, region, division, knownAs
 */
export async function loadFullAreaData(): Promise<AreaInfo[]> {
  if (cachedAreaData !== null) return cachedAreaData;

  try {
    const response = await fetch(REGION_DATA_CSV_URL);
    if (!response.ok) {
      console.error('Failed to fetch RegionData CSV:', response.statusText);
      return [];
    }

    const csvText = await response.text();
    cachedAreaData = parseFullAreaData(csvText);
    return cachedAreaData;
  } catch (error) {
    console.error('Error loading full area data:', error);
    return [];
  }
}

/**
 * Parses CSV text and returns full AreaInfo array.
 * @param regionColumn - Column name to use as the `region` field (default: 'Region'; use 'Parish' for Jamaica CSV)
 */
export function parseFullAreaData(csvText: string, regionColumn: string = 'Region'): AreaInfo[] {
  const rows = parseFullCSV(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => stripQuotes(h));

  const areaIndex = headers.indexOf('Area');
  const regionIndex = headers.indexOf(regionColumn);
  const divisionIndex = headers.indexOf('Division');
  const knownAsIndex = headers.indexOf('known_as');

  if (areaIndex === -1) {
    console.error('Missing Area column in RegionData CSV');
    return [];
  }

  const areas: AreaInfo[] = [];
  const seenAreas = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const columns = rows[i].map((col) => stripQuotes(col));
    const area = columns[areaIndex];
    if (!area) continue;

    // Deduplicate: keep only the first occurrence (has complete data)
    if (seenAreas.has(area)) continue;
    seenAreas.add(area);

    areas.push({
      area,
      region: regionIndex !== -1 ? columns[regionIndex] || '' : '',
      division: divisionIndex !== -1 ? columns[divisionIndex] || '' : '',
      knownAs: knownAsIndex !== -1 ? columns[knownAsIndex] || '' : '',
    });
  }

  return areas;
}

// ============================================================================
// JAMAICA FULL AREA DATA
// ============================================================================

let cachedJamaicaAreaData: AreaInfo[] | null = null;

/**
 * Fetches and parses the Jamaica RegionData CSV.
 * Maps the `Parish` column to the `region` field so the same AreaInfo interface
 * is used downstream (parish pages, area pages).
 */
export async function loadFullJamaicaAreaData(): Promise<AreaInfo[]> {
  if (cachedJamaicaAreaData !== null) return cachedJamaicaAreaData;

  try {
    const response = await fetch(JAMAICA_REGION_DATA_CSV_URL);
    if (!response.ok) {
      console.error('Failed to fetch Jamaica RegionData CSV:', response.statusText);
      return [];
    }

    const csvText = await response.text();
    cachedJamaicaAreaData = parseFullAreaData(csvText, 'Parish');
    return cachedJamaicaAreaData;
  } catch (error) {
    console.error('Error loading Jamaica area data:', error);
    return [];
  }
}
