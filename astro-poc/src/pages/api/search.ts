/**
 * GET /api/search/?q=...
 *
 * D1 FTS5 search for crimes + static filter for MPs and areas.
 * Returns a typed results array consumed by SearchModal.
 *
 * Result types: 'crime' | 'mp' | 'area'
 * No CDN caching — results are query-specific.
 */

export const prerender = false;

import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { generateNameSlug } from '../../lib/csvParser';
import mpsData from '../../data/mps.json';

const MAX_CRIMES = 8;
const MAX_MPS = 3;
const MAX_AREAS = 4;

export interface SearchResult {
  type: 'crime' | 'mp' | 'area';
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

function searchMps(q: string): SearchResult[] {
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
      title: `${mp.honorific} ${mp.fullName}`,
      excerpt: `${mp.partyFull}`,
      url: `/trinidad/mp/${mp.nameSlug}/`,
      meta: `MP · ${mp.party} · ${mp.constituency}`,
    }));
}

export const GET: APIRoute = async ({ request, locals }) => {
  const db = env.DB as D1Database | undefined;
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const results: SearchResult[] = [];

    if (db) {
      const ftsQuery = buildFtsQuery(q);

      // Crimes — FTS5 matched, sorted by most recent first (year/month/day DESC)
      if (ftsQuery) {
        const crimeRows = await db
          .prepare(`
            SELECT crimes_fts.title, crimes_fts.url,
              snippet(crimes_fts, 2, '', '', '...', 20) AS excerpt
            FROM crimes_fts
            JOIN crimes ON crimes_fts.story_id = crimes.story_id
            WHERE crimes_fts MATCH ?
            ORDER BY crimes.year DESC, crimes.month DESC, crimes.day DESC
            LIMIT ?
          `)
          .bind(ftsQuery, MAX_CRIMES)
          .all<{ title: string; url: string; excerpt: string }>();

        for (const row of crimeRows.results ?? []) {
          results.push({
            type: 'crime',
            title: row.title ?? '',
            excerpt: row.excerpt ?? '',
            url: row.url ?? '',
            meta: 'Crime incident',
          });
        }
      }

      // Areas — distinct from crimes table, case-insensitive LIKE
      const areaRows = await db
        .prepare(
          `SELECT DISTINCT area, region FROM crimes
           WHERE area IS NOT NULL AND LOWER(area) LIKE LOWER(?)
           LIMIT ?`
        )
        .bind(`%${q}%`, MAX_AREAS)
        .all<{ area: string; region: string | null }>();

      for (const row of areaRows.results ?? []) {
        if (!row.area) continue;
        results.push({
          type: 'area',
          title: row.area,
          excerpt: row.region ? `${row.region} Region` : '',
          url: `/trinidad/area/${generateNameSlug(row.area)}/`,
          meta: `Area${row.region ? ` · ${row.region}` : ''}`,
        });
      }
    }

    // MPs — static JSON, no D1 needed
    results.push(...searchMps(q));

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
    return new Response(JSON.stringify({ error: 'Search failed', detail: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
