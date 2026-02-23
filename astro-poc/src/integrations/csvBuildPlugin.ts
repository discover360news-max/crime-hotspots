/**
 * CSV Build Plugin — Astro Integration
 *
 * Runs at build time to:
 * 1. Fetch Google Sheets CSVs with exponential-backoff retry (2s, 4s, 8s)
 * 2. Validate rows and emit warnings (missing fields, duplicate Story_IDs, row count drops)
 * 3. Write src/data/csv-cache.json — bundled into the Cloudflare Worker as a runtime fallback
 * 4. Log a BUILD SUMMARY with story count, warnings, and CSV age
 * 5. Write public/api/health.json as a static health endpoint
 *
 * If all fetch retries fail and a previous csv-cache.json exists, the build
 * continues using the stale cache so Googlebot never sees a broken site.
 */

import type { AstroIntegration } from 'astro';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { TRINIDAD_CSV_URLS } from '../config/csvUrls.ts';

// ---------------------------------------------------------------------------
// Inline CSV utilities (avoids ESM/CJS import issues inside integration hooks)
// ---------------------------------------------------------------------------

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

function createColumnMap(headerLine: string): Map<string, number> {
  const map = new Map<string, number>();
  parseCSVLine(headerLine).forEach((header, i) => {
    map.set(header.trim().toLowerCase(), i);
  });
  return map;
}

function getColumnValue(values: string[], columnMap: Map<string, number>, columnName: string): string {
  const index = columnMap.get(columnName.toLowerCase());
  return index !== undefined ? (values[index] || '') : '';
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  }
  return new Date(dateStr);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
}

interface ValidationResult {
  rowCount: number;
  warnings: number;
  oldestStory: string;
  newestStory: string;
}

interface CsvCache {
  timestamp: string;
  rowCount: number;
  csvTexts: Record<string, string>;
}

interface BuildStats {
  csvFetchedAt: string;
  rowCount: number;
  oldestStory: string;
  newestStory: string;
  warnings: number;
  buildStartedAt: string;
  usingCache: boolean;
}

// ---------------------------------------------------------------------------
// Retry fetch (1 initial attempt + up to 3 retries = 4 total)
// ---------------------------------------------------------------------------

async function fetchWithRetry(url: string, logger: Logger, maxRetries = 3): Promise<string> {
  const delays = [2000, 4000, 8000];
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = delays[attempt - 1] ?? 8000;
        const ts = new Date().toISOString();
        logger.warn(`[csvBuildPlugin] ${ts} — retry ${attempt}/${maxRetries}, waiting ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(`[csvBuildPlugin] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.message}`);
    }
  }

  throw lastError ?? new Error('All retries exhausted');
}

// ---------------------------------------------------------------------------
// CSV validation — checks required fields, duplicate Story_IDs, date range
// ---------------------------------------------------------------------------

function validateCsvRows(csvText: string, sheetLabel: string, logger: Logger): ValidationResult {
  if (!csvText.trim()) {
    return { rowCount: 0, warnings: 0, oldestStory: '', newestStory: '' };
  }

  const lines = csvText.split('\n');
  if (lines.length < 2) {
    logger.warn(`[csvBuildPlugin] ${sheetLabel}: CSV has no data rows`);
    return { rowCount: 0, warnings: 1, oldestStory: '', newestStory: '' };
  }

  const columnMap = createColumnMap(lines[0]);
  const seenStoryIds = new Map<string, number>(); // storyId → first row number
  let warnings = 0;
  let rowCount = 0;
  let oldestMs = Infinity;
  let newestMs = -Infinity;
  let oldestStory = '';
  let newestStory = '';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    rowCount++;

    const values = parseCSVLine(line);
    const getCol = (name: string) => getColumnValue(values, columnMap, name);

    const date = getCol('Date');
    const headline = getCol('Headline');
    const area = getCol('Area') || getCol('Location');
    const storyId = getCol('story_id');

    // Warn on missing required fields
    if (!date) {
      logger.warn(`[csvBuildPlugin] ${sheetLabel} row ${i + 1}: missing Date`);
      warnings++;
    }
    if (!headline) {
      logger.warn(`[csvBuildPlugin] ${sheetLabel} row ${i + 1}: missing Headline`);
      warnings++;
    }
    if (!area) {
      logger.warn(`[csvBuildPlugin] ${sheetLabel} row ${i + 1}: missing Location/Area (headline: "${headline.slice(0, 60)}")`);
      warnings++;
    }
    if (!storyId) {
      // Story_ID absence is expected for older entries — only log at debug level
      // (no warning increment — expected for pre-Feb-2026 entries)
    }

    // Warn on duplicate Story_IDs
    if (storyId) {
      if (seenStoryIds.has(storyId)) {
        logger.warn(
          `[csvBuildPlugin] ${sheetLabel} row ${i + 1}: duplicate Story_ID "${storyId}" ` +
          `(first seen at row ${seenStoryIds.get(storyId)})`
        );
        warnings++;
      } else {
        seenStoryIds.set(storyId, i + 1);
      }
    }

    // Track date range
    if (date) {
      const dateObj = parseDate(date);
      if (!isNaN(dateObj.getTime())) {
        const ms = dateObj.getTime();
        if (ms < oldestMs) { oldestMs = ms; oldestStory = dateObj.toISOString().slice(0, 10); }
        if (ms > newestMs) { newestMs = ms; newestStory = dateObj.toISOString().slice(0, 10); }
      }
    }
  }

  return { rowCount, warnings, oldestStory, newestStory };
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const DIR = fileURLToPath(new URL('.', import.meta.url));
// src/integrations/ → src/data/
const CACHE_PATH = join(DIR, '../data/csv-cache.json');

function readExistingCache(): CsvCache | null {
  try {
    if (existsSync(CACHE_PATH)) {
      const raw = readFileSync(CACHE_PATH, 'utf-8');
      return JSON.parse(raw) as CsvCache;
    }
  } catch {
    // Ignore parse errors — stale/corrupted cache
  }
  return null;
}

// ---------------------------------------------------------------------------
// Integration export
// ---------------------------------------------------------------------------

export default function csvBuildPlugin(): AstroIntegration {
  let buildStats: BuildStats | null = null;

  return {
    name: 'csv-build-plugin',
    hooks: {
      'astro:build:start': async ({ logger }) => {
        const buildStartedAt = new Date().toISOString();
        logger.info('[csvBuildPlugin] Starting CSV fetch with retry...');

        // Read previous cache so we can compare row counts and use as fallback
        const previousCache = readExistingCache();
        const previousRowCount = previousCache?.rowCount ?? 0;

        const newCache: CsvCache = {
          timestamp: buildStartedAt,
          rowCount: 0,
          csvTexts: { '2025': previousCache?.csvTexts?.['2025'] ?? '', current: previousCache?.csvTexts?.['current'] ?? '' },
        };

        let usingCache = false;
        let totalWarnings = 0;
        let totalRows = 0;
        let oldestStory = '';
        let newestStory = '';

        // --- Fetch 2025 sheet (only if different from current) ---
        if (TRINIDAD_CSV_URLS[2025] && TRINIDAD_CSV_URLS[2025] !== TRINIDAD_CSV_URLS.current) {
          try {
            const ts = new Date().toISOString();
            logger.info(`[csvBuildPlugin] ${ts} — fetching 2025 sheet...`);
            const csvText2025 = await fetchWithRetry(TRINIDAD_CSV_URLS[2025], logger);
            newCache.csvTexts['2025'] = csvText2025;

            const result = validateCsvRows(csvText2025, '2025 sheet', logger);
            totalRows += result.rowCount;
            totalWarnings += result.warnings;
            if (result.oldestStory && (!oldestStory || result.oldestStory < oldestStory)) oldestStory = result.oldestStory;
            if (result.newestStory && result.newestStory > newestStory) newestStory = result.newestStory;

            logger.info(`[csvBuildPlugin] 2025 sheet: ${result.rowCount} rows loaded`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (newCache.csvTexts['2025']) {
              logger.warn(`[csvBuildPlugin] ⚠️ 2025 sheet fetch FAILED (${msg}) — using cached data from ${previousCache?.timestamp ?? 'unknown'}`);
              usingCache = true;
              const result = validateCsvRows(newCache.csvTexts['2025'], '2025 sheet (cache)', logger);
              totalRows += result.rowCount;
            } else {
              logger.warn(`[csvBuildPlugin] ⚠️ 2025 sheet fetch FAILED and no cache available — skipping`);
            }
          }
        }

        // --- Fetch current/production sheet ---
        try {
          const ts = new Date().toISOString();
          logger.info(`[csvBuildPlugin] ${ts} — fetching current sheet...`);
          const csvTextCurrent = await fetchWithRetry(TRINIDAD_CSV_URLS.current, logger);
          newCache.csvTexts['current'] = csvTextCurrent;

          const result = validateCsvRows(csvTextCurrent, 'current sheet', logger);
          totalRows += result.rowCount;
          totalWarnings += result.warnings;
          if (result.oldestStory && (!oldestStory || result.oldestStory < oldestStory)) oldestStory = result.oldestStory;
          if (result.newestStory && result.newestStory > newestStory) newestStory = result.newestStory;

          logger.info(`[csvBuildPlugin] current sheet: ${result.rowCount} rows loaded`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (newCache.csvTexts['current']) {
            logger.warn(`[csvBuildPlugin] ⚠️ current sheet fetch FAILED (${msg}) — using cached data from ${previousCache?.timestamp ?? 'unknown'}`);
            usingCache = true;
            const result = validateCsvRows(newCache.csvTexts['current'], 'current sheet (cache)', logger);
            totalRows += result.rowCount;
          } else {
            logger.error('[csvBuildPlugin] ❌ current sheet fetch FAILED and no cache available — build will have empty data');
          }
        }

        // --- Warn if row count dropped more than 10% ---
        if (previousRowCount > 0 && totalRows < previousRowCount * 0.9) {
          const drop = Math.round((1 - totalRows / previousRowCount) * 100);
          logger.warn(
            `[csvBuildPlugin] ⚠️ Row count dropped ${drop}% — ` +
            `previous: ${previousRowCount}, current: ${totalRows}. ` +
            `Check Google Sheets for data loss.`
          );
          totalWarnings++;
        }

        // --- Write updated cache ---
        newCache.rowCount = totalRows;
        mkdirSync(join(DIR, '../data'), { recursive: true });
        writeFileSync(CACHE_PATH, JSON.stringify(newCache, null, 2), 'utf-8');

        const cacheStatus = usingCache ? ' [USING STALE CACHE]' : '';
        logger.info(
          `[csvBuildPlugin] csv-cache.json written — ${totalRows} rows, ` +
          `${totalWarnings} warning(s)${cacheStatus}`
        );

        // Store stats for build:done hook
        buildStats = {
          csvFetchedAt: buildStartedAt,
          rowCount: totalRows,
          oldestStory,
          newestStory,
          warnings: totalWarnings,
          buildStartedAt,
          usingCache,
        };

        // Write health-data.json now (build:start) so the pre-rendered
        // /api/health.json page can import it during the build phase.
        // build_time will be the fetch timestamp (updated at build:done).
        const healthData = {
          status: usingCache ? 'degraded' : 'ok',
          csv_last_fetched: buildStartedAt,
          csv_row_count: totalRows,
          csv_cache_age_minutes: 0,
          oldest_story: oldestStory,
          newest_story: newestStory,
          build_time: buildStartedAt,
        };
        writeFileSync(
          join(DIR, '../data/health-data.json'),
          JSON.stringify(healthData, null, 2),
          'utf-8'
        );
        logger.info('[csvBuildPlugin] health-data.json written for /api/health.json endpoint');
      },

      'astro:build:done': async ({ logger }) => {
        const buildTime = new Date().toISOString();

        if (!buildStats) {
          logger.warn('[csvBuildPlugin] No build stats available — skipping health summary');
          return;
        }

        // Calculate cache age (build:done time minus CSV fetch time)
        const fetchedMs = new Date(buildStats.csvFetchedAt).getTime();
        const doneMs = new Date(buildTime).getTime();
        const cacheAgeMinutes = Math.round((doneMs - fetchedMs) / 60000);

        logger.info(`[csvBuildPlugin] health.json written — status: ${buildStats.usingCache ? 'degraded' : 'ok'}`);

        // Log BUILD SUMMARY
        logger.info(
          `[csvBuildPlugin] BUILD SUMMARY: ${buildStats.rowCount} stories processed, ` +
          `${buildStats.warnings} warning(s), ` +
          `CSV fetched at ${buildStats.csvFetchedAt}, ` +
          `cache age ${cacheAgeMinutes} minute(s)`
        );
      },
    },
  };
}
