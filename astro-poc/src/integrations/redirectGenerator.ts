/**
 * Redirect Map Generator — Astro Integration
 *
 * Build-time only integration that generates src/data/redirect-map.json
 * mapping old headline-date slugs → new Story_ID-prefixed slugs.
 *
 * SSR handles the actual redirects at runtime (see [slug].astro).
 * This file is for validation and inspection only.
 *
 * Runs only on `astro build`, skipped in dev.
 */

import type { AstroIntegration } from 'astro';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Inline the CSV utilities to avoid ESM/CJS issues in the integration context
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

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  }
  return new Date(dateStr);
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

function generateSlug(headline: string, date: Date): string {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const slugText = headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
  return `${slugText}-${dateStr}`;
}

function generateSlugWithId(storyId: string, headline: string): string {
  const words = headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w: string) => w.length > 0)
    .slice(0, 6)
    .join('-');
  return `${storyId}-${words}`;
}

interface CrimeEntry {
  storyId: string | null;
  oldSlug: string;
  newSlug: string;
}

async function fetchAndParseCSV(csvUrl: string, logger: { warn: (msg: string) => void }): Promise<CrimeEntry[]> {
  let csvText: string;
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    csvText = await response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`[redirectGenerator] CSV fetch failed (${msg}) — skipping redirect map update for this URL`);
    return [];
  }
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];

  const columnMap = createColumnMap(lines[0]);
  const entries: CrimeEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCSVLine(line);
    const getColumn = (name: string) => getColumnValue(values, columnMap, name);

    const headline = getColumn('headline');
    const date = getColumn('date');

    if (!headline || !date) continue;

    const dateObj = parseDate(date);
    if (isNaN(dateObj.getTime())) continue;

    const storyId = getColumn('story_id') || null;
    const oldSlug = generateSlug(headline, dateObj);
    const newSlug = storyId ? generateSlugWithId(storyId, headline) : oldSlug;

    if (!storyId) {
      logger.warn(`[redirectGenerator] Missing Story_ID for: "${headline}" (${date})`);
    }

    entries.push({ storyId, oldSlug, newSlug });
  }

  return entries;
}

export default function redirectGenerator(): AstroIntegration {
  return {
    name: 'redirect-generator',
    hooks: {
      'astro:build:start': async ({ logger }) => {
        logger.info('[redirectGenerator] Generating redirect-map.json...');

        // Import CSV URLs — using dynamic import to support ESM
        const { TRINIDAD_CSV_URLS } = await import('../config/csvUrls.ts');

        const allEntries: CrimeEntry[] = [];

        // Fetch 2025 data if different from current
        if (TRINIDAD_CSV_URLS[2025] && TRINIDAD_CSV_URLS[2025] !== TRINIDAD_CSV_URLS.current) {
          const entries2025 = await fetchAndParseCSV(TRINIDAD_CSV_URLS[2025], logger);
          allEntries.push(...entries2025);
          logger.info(`[redirectGenerator] Loaded ${entries2025.length} entries from 2025 sheet`);
        }

        // Fetch current sheet
        const currentEntries = await fetchAndParseCSV(TRINIDAD_CSV_URLS.current, logger);
        allEntries.push(...currentEntries);
        logger.info(`[redirectGenerator] Loaded ${currentEntries.length} entries from current sheet`);

        // Build redirect map: only entries where old !== new (i.e. storyId exists)
        const redirectMap: Record<string, string> = {};
        const seenNewSlugs = new Map<string, string>(); // newSlug → oldSlug (for dupe detection)
        let duplicateFound = false;

        for (const entry of allEntries) {
          if (entry.oldSlug === entry.newSlug) continue; // No redirect needed

          const oldPath = `/trinidad/crime/${entry.oldSlug}/`;
          const newPath = `/trinidad/crime/${entry.newSlug}/`;

          // Validate: duplicate new slugs indicate collisions
          if (seenNewSlugs.has(entry.newSlug)) {
            logger.error(
              `[redirectGenerator] DUPLICATE new slug "${entry.newSlug}" — ` +
              `collides with previous entry from "${seenNewSlugs.get(entry.newSlug)}". ` +
              `Story_ID values must be unique.`
            );
            duplicateFound = true;
          } else {
            seenNewSlugs.set(entry.newSlug, entry.oldSlug);
          }

          redirectMap[oldPath] = newPath;
        }

        if (duplicateFound) {
          throw new Error('[redirectGenerator] Build aborted: duplicate new slugs detected. Fix Story_ID values in the CSV.');
        }

        // Write redirect-map.json to src/data/
        const outputPath = join(
          fileURLToPath(new URL('../data/redirect-map.json', import.meta.url))
        );
        mkdirSync(join(fileURLToPath(new URL('../data/', import.meta.url))), { recursive: true });
        writeFileSync(outputPath, JSON.stringify(redirectMap, null, 2), 'utf-8');

        const count = Object.keys(redirectMap).length;
        logger.info(`[redirectGenerator] Written ${count} redirects to src/data/redirect-map.json`);
      }
    }
  };
}
