/**
 * GET /api/health.json
 *
 * Build-time static health endpoint.
 * Data is populated by csvBuildPlugin at build:start, so it reflects
 * the CSV fetch results from the most recent deployment.
 *
 * Pre-rendered (static) — zero Worker invocations, served from CDN.
 */

export const prerender = true;

import type { APIRoute } from 'astro';
import healthData from '../../data/health-data.json';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
