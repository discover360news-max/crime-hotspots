/**
 * GET /api/latest-crimes.json
 *
 * Pre-rendered at build time. Returns the 2 most recent crime entries
 * used by the SearchModal suggestions panel.
 *
 * Pre-rendered (static) — served from CDN, zero Worker invocations.
 */

export const prerender = true;

import type { APIRoute } from 'astro';
import { getTrinidadCrimes } from '../../lib/crimeData';

export const GET: APIRoute = async () => {
  const crimes = await getTrinidadCrimes();

  const latest = crimes
    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
    .slice(0, 2)
    .map(c => ({
      headline: c.headline,
      date: c.date,
      area: c.area,
      crimeType: c.primaryCrimeType || c.crimeType,
      slug: c.slug,
    }));

  return new Response(JSON.stringify({ crimes: latest }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
