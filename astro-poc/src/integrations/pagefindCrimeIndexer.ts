/**
 * Pagefind Crime Indexer — Astro Integration
 *
 * Crime pages are SSR (no static HTML), so astro-pagefind's build-time crawler
 * never sees them. This integration runs AFTER astro-pagefind in astro:build:done,
 * creates a fresh Pagefind index that includes BOTH the existing static HTML pages
 * AND all 2,500+ crime records as custom entries, then overwrites the index.
 *
 * Ordering: must be listed after pagefind() in astro.config.mjs integrations[].
 */

import type { AstroIntegration } from 'astro';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createIndex } from 'pagefind';
import {
  parseFullCSV,
  createColumnMapFromArray,
  parseDate,
  generateSlug,
  generateSlugWithId,
} from '../lib/csvParser.ts';

const DIR = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(DIR, '../data/csv-cache.json');

interface CsvCache {
  timestamp: string;
  rowCount: number;
  csvTexts: Record<string, string>;
}

interface CrimeRecord {
  slug: string;
  headline: string;
  area: string;
  region: string;
  crimeType: string;
  summary: string;
  street: string;
  date: string;
}

/** Parse one CSV text block into minimal crime records needed for indexing */
function parseCrimesFromCsvText(csvText: string): CrimeRecord[] {
  const rows = parseFullCSV(csvText);
  if (rows.length < 2) return [];

  const columnMap = createColumnMapFromArray(rows[0]);
  const records: CrimeRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const get = (name: string): string => {
      const idx = columnMap.get(name.toLowerCase());
      return idx !== undefined ? (values[idx] ?? '').trim() : '';
    };

    const headline = get('Headline');
    const date = get('Date');
    if (!headline || !date) continue;

    const dateObj = parseDate(date);
    if (isNaN(dateObj.getTime())) continue;

    const storyId = get('story_id') || null;
    const slug = storyId ? generateSlugWithId(storyId, headline) : generateSlug(headline, dateObj);

    records.push({
      slug,
      headline,
      area:      get('Area'),
      region:    get('Region'),
      crimeType: get('Crime Type') || get('crimeType') || get('primaryCrimeType'),
      summary:   get('Summary'),
      street:    get('Street Address') || get('Street'),
      date,
    });
  }

  return records;
}

export default function pagefindCrimeIndexer(): AstroIntegration {
  return {
    name: 'pagefind-crime-indexer',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const distPath = fileURLToPath(dir);

        // ── Load csv-cache.json ───────────────────────────────────────────────
        if (!existsSync(CACHE_PATH)) {
          logger.warn('[pagefind-crime-indexer] csv-cache.json not found — skipping');
          return;
        }
        let cache: CsvCache;
        try {
          cache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) as CsvCache;
        } catch {
          logger.warn('[pagefind-crime-indexer] Failed to parse csv-cache.json — skipping');
          return;
        }

        // ── Parse crime records from all CSV sheets ───────────────────────────
        const allCrimes: CrimeRecord[] = [];
        for (const [key, csvText] of Object.entries(cache.csvTexts || {})) {
          const parsed = parseCrimesFromCsvText(csvText);
          allCrimes.push(...parsed);
          logger.info(`[pagefind-crime-indexer] ${key}: ${parsed.length} crimes parsed`);
        }

        if (allCrimes.length === 0) {
          logger.warn('[pagefind-crime-indexer] No crimes parsed — skipping index write');
          return;
        }

        // ── Build combined Pagefind index ─────────────────────────────────────
        const { errors, index } = await createIndex({ forceLanguage: 'en' });
        if (errors.length > 0 || !index) {
          logger.error(`[pagefind-crime-indexer] createIndex failed: ${errors.join(', ')}`);
          return;
        }

        // Index existing static pages (areas, regions, blog, mp profiles, etc.)
        await index.addDirectory({ path: distPath });
        logger.info('[pagefind-crime-indexer] Static pages indexed');

        // Add each crime as a custom record
        for (const crime of allCrimes) {
          const content = [
            crime.headline,
            crime.area,
            crime.region,
            crime.crimeType,
            crime.street,
            crime.summary,
          ].filter(Boolean).join(' ');

          await index.addCustomRecord({
            url: `/trinidad/crime/${crime.slug}/`,
            content,
            language: 'en',
            meta: { title: crime.headline },
            filters: {
              ...(crime.crimeType ? { crimeType: [crime.crimeType] } : {}),
              ...(crime.area      ? { area:      [crime.area]      } : {}),
            },
          });
        }

        // Write combined index, overwriting what astro-pagefind produced
        await index.writeFiles({ outputPath: join(distPath, 'pagefind') });

        logger.info(
          `[pagefind-crime-indexer] Done — ${allCrimes.length} crimes added to Pagefind index`
        );
      },
    },
  };
}
