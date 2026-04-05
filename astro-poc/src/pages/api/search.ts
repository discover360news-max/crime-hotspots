/**
 * GET /api/search/?q=...
 *
 * D1 FTS5 search for crimes + static filter for MPs and areas/parishes.
 * Queries both T&T (DB) and Jamaica (JM_DB) in parallel.
 * Returns a typed results array consumed by SearchModal.
 *
 * Result types: 'crime' | 'mp' | 'area' | 'parish'
 * No CDN caching — results are query-specific.
 */

export const prerender = false;

import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { generateNameSlug } from '../../lib/csvParser';
import mpsData from '../../data/mps.json';
import mpsJamaicaData from '../../data/mps-jamaica.json';

const MAX_CRIMES = 5;   // per country
const MAX_MPS = 3;      // per country
const MAX_AREAS = 4;    // per country

export interface SearchResult {
  type: 'crime' | 'mp' | 'area' | 'parish';
  title: string;
  excerpt: string;
  url: string;
  meta: string;
}

/**
 * Build an FTS5-safe prefix query from user input.
 * Strips FTS5 special chars, then appends * to each token for prefix matching.
 * e.g. "port of spain" → "port* of* spain*"
 */
function buildFtsQuery(q: string): string {
  return q
    .replace(/["'*:()\-^]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => `${w}*`)
    .join(' ');
}

function searchMpsTT(q: string): SearchResult[] {
  const lower = q.toLowerCase();
  return (mpsData as any[])
    .filter(mp =>
      mp.fullName?.toLowerCase().includes(lower) ||
      mp.constituency?.toLowerCase().includes(lower) ||
      mp.party?.toLowerCase().includes(lower) ||
      mp.partyFull?.toLowerCase().includes(lower)
    )
    .slice(0, MAX_MPS)
    .map(mp => ({
      type: 'mp' as const,
      title: `${mp.honorific} ${mp.fullName}`.trim(),
      excerpt: `${mp.partyFull}`,
      url: `/trinidad/mp/${mp.nameSlug}/`,
      meta: `MP · ${mp.party} · ${mp.constituency}`,
    }));
}

function searchMpsJamaica(q: string): SearchResult[] {
  const lower = q.toLowerCase();
  return (mpsJamaicaData as any[])
    .filter(mp =>
      mp.fullName?.toLowerCase().includes(lower) ||
      mp.constituency?.toLowerCase().includes(lower) ||
      mp.party?.toLowerCase().includes(lower) ||
      mp.partyFull?.toLowerCase().includes(lower)
    )
    .slice(0, MAX_MPS)
    .map(mp => ({
      type: 'mp' as const,
      title: [mp.honorific, mp.fullName].filter(Boolean).join(' '),
      excerpt: `${mp.partyFull}`,
      url: `/jamaica/mp/${mp.nameSlug}/`,
      meta: `MP · ${mp.party} · ${mp.constituency} · Jamaica`,
    }));
}

export const GET: APIRoute = async ({ request, locals }) => {
  const db = env.DB as D1Database | undefined;
  const jmDb = env.JM_DB as D1Database | undefined;
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const results: SearchResult[] = [];
    const ftsQuery = buildFtsQuery(q);

    // Run T&T and Jamaica DB queries in parallel
    const [
      ttCrimeRows,
      ttAreaRows,
      jmCrimeRows,
      jmParishRows,
    ] = await Promise.all([
      // T&T crimes — FTS5
      db && ftsQuery
        ? db.prepare(`
            SELECT crimes_fts.title, crimes_fts.url,
              snippet(crimes_fts, 2, '', '', '...', 20) AS excerpt
            FROM crimes_fts
            JOIN crimes ON crimes_fts.story_id = crimes.story_id
            WHERE crimes_fts MATCH ?
            ORDER BY crimes.year DESC, crimes.month DESC, crimes.day DESC
            LIMIT ?
          `).bind(ftsQuery, MAX_CRIMES).all<{ title: string; url: string; excerpt: string }>()
        : Promise.resolve({ results: [] as { title: string; url: string; excerpt: string }[] }),

      // T&T areas — LIKE on area column
      db
        ? db.prepare(
            `SELECT DISTINCT area, region FROM crimes
             WHERE area IS NOT NULL AND LOWER(area) LIKE LOWER(?)
             LIMIT ?`
          ).bind(`%${q}%`, MAX_AREAS).all<{ area: string; region: string | null }>()
        : Promise.resolve({ results: [] as { area: string; region: string | null }[] }),

      // Jamaica crimes — FTS5
      jmDb && ftsQuery
        ? jmDb.prepare(`
            SELECT crimes_fts.title, crimes_fts.url,
              snippet(crimes_fts, 2, '', '', '...', 20) AS excerpt
            FROM crimes_fts
            JOIN crimes ON crimes_fts.story_id = crimes.story_id
            WHERE crimes_fts MATCH ?
            ORDER BY crimes.year DESC, crimes.month DESC, crimes.day DESC
            LIMIT ?
          `).bind(ftsQuery, MAX_CRIMES).all<{ title: string; url: string; excerpt: string }>()
        : Promise.resolve({ results: [] as { title: string; url: string; excerpt: string }[] }),

      // Jamaica parishes — LIKE on region column (14 parishes, not 113 granular areas)
      jmDb
        ? jmDb.prepare(
            `SELECT DISTINCT region FROM crimes
             WHERE region IS NOT NULL AND LOWER(region) LIKE LOWER(?)
             LIMIT ?`
          ).bind(`%${q}%`, MAX_AREAS).all<{ region: string }>()
        : Promise.resolve({ results: [] as { region: string }[] }),
    ]);

    // T&T crimes
    for (const row of ttCrimeRows.results ?? []) {
      results.push({
        type: 'crime',
        title: row.title ?? '',
        excerpt: row.excerpt ?? '',
        url: row.url ?? '',
        meta: 'Crime incident',
      });
    }

    // Jamaica crimes
    for (const row of jmCrimeRows.results ?? []) {
      results.push({
        type: 'crime',
        title: row.title ?? '',
        excerpt: row.excerpt ?? '',
        url: row.url ?? '',
        meta: 'Crime incident · Jamaica',
      });
    }

    // T&T areas
    for (const row of ttAreaRows.results ?? []) {
      if (!row.area) continue;
      results.push({
        type: 'area',
        title: row.area,
        excerpt: row.region ? `${row.region} Region` : '',
        url: `/trinidad/area/${generateNameSlug(row.area)}/`,
        meta: `Area${row.region ? ` · ${row.region}` : ''}`,
      });
    }

    // Jamaica parishes
    for (const row of jmParishRows.results ?? []) {
      if (!row.region) continue;
      results.push({
        type: 'parish',
        title: row.region,
        excerpt: 'Jamaica',
        url: `/jamaica/parish/${generateNameSlug(row.region)}/`,
        meta: `Parish · Jamaica`,
      });
    }

    // MPs — static JSON, no D1 needed
    results.push(...searchMpsTT(q));
    results.push(...searchMpsJamaica(q));

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/search] handler failed:', msg);
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
