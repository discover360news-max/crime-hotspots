/**
 * CSV Build Plugin — Astro Integration (slimmed)
 *
 * Runs at build time to:
 * 1. Fetch the RegionData CSV and write src/data/area-aliases.json
 *    (used as a stable baked lookup for area metadata at runtime)
 * 2. Write src/data/health-data.json (build timestamp + alias count)
 *
 * Crime data is no longer fetched at build time — it comes from D1 at request
 * time on all pages. csv-cache.json is no longer written or read.
 */

import type { AstroIntegration } from 'astro';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { REGION_DATA_CSV_URL } from '../config/csvUrls.ts';

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

// ---------------------------------------------------------------------------
// Retry fetch (1 initial attempt + up to 3 retries = 4 total)
// ---------------------------------------------------------------------------

interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
}

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
// Area alias parser
// Parses RegionData CSV rows to produce { area → known_as } mapping
// ---------------------------------------------------------------------------

function parseAreaAliases(csvText: string): Record<string, string> {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return {};

  const columnMap = createColumnMap(lines[0]);
  const areaIdx = columnMap.get('area');
  const knownAsIdx = columnMap.get('known_as');

  if (areaIdx === undefined || knownAsIdx === undefined) return {};

  const aliases: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const area = values[areaIdx]?.trim();
    const knownAs = values[knownAsIdx]?.trim();
    if (area && knownAs && knownAs !== area) {
      aliases[area] = knownAs;
    }
  }
  return aliases;
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const DIR = fileURLToPath(new URL('.', import.meta.url));
const AREA_ALIASES_PATH = join(DIR, '../data/area-aliases.json');
const HEALTH_DATA_PATH = join(DIR, '../data/health-data.json');

// ---------------------------------------------------------------------------
// Integration export
// ---------------------------------------------------------------------------

export default function csvBuildPlugin(): AstroIntegration {
  return {
    name: 'csv-build-plugin',
    hooks: {
      'astro:build:start': async ({ logger }) => {
        const buildStartedAt = new Date().toISOString();

        mkdirSync(join(DIR, '../data'), { recursive: true });

        // --- Generate area-aliases.json from RegionData CSV ---
        let aliasCount = 0;
        try {
          logger.info('[csvBuildPlugin] Fetching RegionData CSV for area aliases...');
          const regionCsvText = await fetchWithRetry(REGION_DATA_CSV_URL, logger);
          const aliases = parseAreaAliases(regionCsvText);
          aliasCount = Object.keys(aliases).length;
          writeFileSync(AREA_ALIASES_PATH, JSON.stringify(aliases, null, 2), 'utf-8');
          logger.info(`[csvBuildPlugin] area-aliases.json written — ${aliasCount} aliases`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          logger.warn(`[csvBuildPlugin] ⚠️ RegionData fetch failed (${msg}) — area-aliases.json unchanged`);
        }

        // --- Write health-data.json ---
        const healthData = {
          status: 'ok',
          build_time: buildStartedAt,
          area_aliases_count: aliasCount,
        };
        writeFileSync(HEALTH_DATA_PATH, JSON.stringify(healthData, null, 2), 'utf-8');
        logger.info('[csvBuildPlugin] health-data.json written');
      },
    },
  };
}
