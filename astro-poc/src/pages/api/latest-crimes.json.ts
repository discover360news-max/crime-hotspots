/**
 * GET /api/latest-crimes.json
 *
 * SSR endpoint — returns the 2 most recent crime entries used by the SearchModal
 * suggestions panel. CDN-cached at edge for ~23h.
 */

import type { APIRoute } from 'astro';
import { getTrinidadCrimes, getAllCrimesFromD1 } from '../../lib/crimeData';

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  const crimes = db ? await getAllCrimesFromD1(db) : await getTrinidadCrimes();

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
      'CDN-Cache-Control': 'max-age=82800',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
};
