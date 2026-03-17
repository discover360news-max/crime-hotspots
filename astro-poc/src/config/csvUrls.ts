/**
 * Shared CSV URL Configuration
 *
 * SINGLE SOURCE OF TRUTH for all CSV URLs
 *
 * Used by:
 * - src/lib/crimeData.ts (server-side SSG)
 * - src/scripts/dashboardDataLoader.ts (client-side)
 * - src/lib/areaAliases.ts (client-side)
 *
 * IMPORTANT: When changing URLs, this is the ONLY file you need to update.
 * Both server-side and client-side code import from here.
 *
 * Created: Jan 17, 2026
 */

/**
 * Trinidad crime data CSV URLs by year
 */
export const TRINIDAD_CSV_URLS = {
  // Historical year sheets
  2025: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv',
  2026: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1963637925&single=true&output=csv',

  // Current production sheet (switched to 2026 on Jan 1, 2026)
  // This is the "live" sheet that the website fetches
  current: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1963637925&single=true&output=csv',

} as const;

/**
 * Region/Area metadata CSV URL
 * Contains: Area, Region, Division, known_as (local names)
 */
export const REGION_DATA_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=910363151&single=true&output=csv';

/**
 * Region population CSV URL
 * Contains: Region, population
 * Used for per-capita crime rate calculations in Top Regions card
 */
export const REGION_POPULATION_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=533682063&single=true&output=csv';

/**
 * Type for year keys in TRINIDAD_CSV_URLS
 */
export type TrinidadYear = keyof typeof TRINIDAD_CSV_URLS;

/**
 * Jamaica crime data CSV URL (LIVE production sheet)
 * Populated by the Jamaica GAS pipeline (RSS → AI → Sheets → LIVE)
 */
export const JAMAICA_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaZbgg8gAOl5DBg0GAuohDnecZL3qG4olfL5O57UPc2eg7bXj0w1UoRJ3TELGUXcRUTXVhFDzb6VgV/pub?gid=1963637925&single=true&output=csv';

/**
 * Jamaica Region/Area metadata CSV URL
 * Contains: Area, Parish, Division, known_as, population
 * Source: Jamaica Google Sheet → RegionData tab
 */
export const JAMAICA_REGION_DATA_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaZbgg8gAOl5DBg0GAuohDnecZL3qG4olfL5O57UPc2eg7bXj0w1UoRJ3TELGUXcRUTXVhFDzb6VgV/pub?gid=910363151&single=true&output=csv';
