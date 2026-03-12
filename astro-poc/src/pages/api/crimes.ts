/**
 * GET /api/crimes?year=2026|2025|all
 *
 * SSR endpoint — returns full Crime objects for a given year from D1.
 * dateObj/datePublished/dateUpdated (Date instances) are omitted from JSON;
 * the client reconstructs dateObj from year/month/day.
 *
 * Cache: 1h browser / ~23h CDN edge
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import {
  getAllCrimesFromD1,
  getCrimesByYearFromD1,
} from '../../lib/crimeData';
import type { Crime } from '../../lib/crimeData';

// Fields to omit — these are Date instances that don't survive JSON.stringify cleanly
const DATE_FIELDS = new Set(['dateObj', 'datePublished', 'dateUpdated']);

function serializeCrime(crime: Crime): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(crime)) {
    if (!DATE_FIELDS.has(key)) {
      out[key] = value;
    }
  }
  return out;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    return new Response(JSON.stringify({ error: 'D1 database not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const yearParam = url.searchParams.get('year') ?? String(new Date().getFullYear());

  try {
    let crimes: Crime[];

    if (yearParam === 'all') {
      crimes = await getAllCrimesFromD1(db);
    } else {
      const year = parseInt(yearParam, 10);
      if (isNaN(year)) {
        return new Response(JSON.stringify({ error: 'Invalid year parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      crimes = await getCrimesByYearFromD1(db, year);
    }

    const yearValue = yearParam === 'all' ? 'all' : parseInt(yearParam, 10);

    return new Response(
      JSON.stringify({ year: yearValue, crimes: crimes.map(serializeCrime) }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600, s-maxage=82800',
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/crimes] handler failed:', msg);
    return new Response(JSON.stringify({ error: 'Internal server error', detail: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
