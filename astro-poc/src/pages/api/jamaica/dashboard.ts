/**
 * GET /api/jamaica/dashboard?year=2026|2025|all
 *
 * SSR endpoint — pre-computed dashboard stats for Jamaica (JM_DB).
 * Mirrors /api/dashboard/ but uses the JM_DB binding.
 *
 * Cache: 1h browser / ~23h CDN edge
 */

export const prerender = false;

import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import {
  getAllCrimesFromD1,
  getCrimesByYearFromD1,
  getCrimesByDateRangeFromD1,
} from '../../../lib/crimeData';
import { countCrimeType, calculateInsights } from '../../../lib/dashboardHelpers';
import { getTotalCrimeCount } from '../../../lib/statisticsHelpers';
import { getRiskWeight } from '../../../config/riskWeights';
import { usesVictimCount } from '../../../config/crimeTypeConfig';
import type { Crime } from '../../../lib/crimeData';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildStats(crimes: Crime[]) {
  return {
    total: getTotalCrimeCount(crimes),
    murders: countCrimeType(crimes, 'Murder'),
    attemptedMurders: countCrimeType(crimes, 'Attempted Murder'),
    shootings: countCrimeType(crimes, 'Shooting'),
    robberies: countCrimeType(crimes, 'Robbery'),
    carjackings: countCrimeType(crimes, 'Carjacking'),
    homeInvasions: countCrimeType(crimes, 'Home Invasion'),
    burglaries: countCrimeType(crimes, 'Burglary'),
    thefts: countCrimeType(crimes, 'Theft'),
    assaults: countCrimeType(crimes, 'Assault'),
    kidnappings: countCrimeType(crimes, 'Kidnapping'),
  };
}

function computeTopRegions(crimes: Crime[]) {
  const regionWeightedScores = new Map<string, number>();
  const regionCrimeCounts = new Map<string, number>();

  crimes.forEach(crime => {
    const region = (crime.region || '').trim();
    if (!region || region === 'Unknown') return;

    let riskScore = 0;
    const primaryType = crime.primaryCrimeType || crime.crimeType;
    if (primaryType) {
      const weight = getRiskWeight(primaryType);
      const victimCount = usesVictimCount(primaryType) && crime.victimCount ? crime.victimCount : 1;
      riskScore += weight * victimCount;
    }
    if (crime.relatedCrimeTypes) {
      crime.relatedCrimeTypes.split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
        riskScore += getRiskWeight(t);
      });
    }
    regionWeightedScores.set(region, (regionWeightedScores.get(region) || 0) + riskScore);

    let count = crime.primaryCrimeType || crime.crimeType ? 1 : 0;
    if (crime.relatedCrimeTypes) {
      count += crime.relatedCrimeTypes.split(',').map(t => t.trim()).filter(Boolean).length;
    }
    regionCrimeCounts.set(region, (regionCrimeCounts.get(region) || 0) + count);
  });

  const entries = Array.from(regionWeightedScores.entries())
    .map(([region, weightedScore]) => ({
      region,
      crimeCount: regionCrimeCounts.get(region) ?? 0,
      weightedScore,
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 10);

  const maxScore = entries[0]?.weightedScore ?? 1;

  return entries.map(entry => ({
    ...entry,
    barWidth: maxScore > 0 ? Math.round((entry.weightedScore / maxScore) * 100) : 0,
  }));
}

export const GET: APIRoute = async ({ request }) => {
  const db = env.JM_DB as D1Database | undefined;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Jamaica D1 database not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const yearParam = url.searchParams.get('year') ?? String(new Date().getFullYear());

  const now = new Date();
  const threeDaysAgo = new Date(now); threeDaysAgo.setDate(now.getDate() - 3);
  const thirtyThreeDaysAgo = new Date(now); thirtyThreeDaysAgo.setDate(now.getDate() - 33);
  const sixtyThreeDaysAgo = new Date(now); sixtyThreeDaysAgo.setDate(now.getDate() - 63);

  try {
    let crimes: Crime[];
    let last30Crimes: Crime[] = [];
    let prev30Crimes: Crime[] = [];
    const isCurrentOrAllYears = yearParam === 'all' || parseInt(yearParam, 10) === new Date().getFullYear();

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

    if (isCurrentOrAllYears) {
      [last30Crimes, prev30Crimes] = await Promise.all([
        getCrimesByDateRangeFromD1(db, formatDate(thirtyThreeDaysAgo), formatDate(threeDaysAgo)),
        getCrimesByDateRangeFromD1(db, formatDate(sixtyThreeDaysAgo), formatDate(thirtyThreeDaysAgo)),
      ]);
    }

    const stats = buildStats(crimes);
    const trends = {
      last30: buildStats(last30Crimes),
      prev30: buildStats(prev30Crimes),
    };

    const rawInsights = calculateInsights(crimes);
    const insights = {
      avgPerDay: rawInsights.avgPerDay,
      victimsPerDay: rawInsights.victimsPerDay,
      mostDangerousDay: rawInsights.mostDangerousDay,
      busiestMonth: rawInsights.busiestMonth,
      mostDangerousArea: rawInsights.mostDangerousRegion,
      mostDangerousAreaCount: rawInsights.mostDangerousRegionCount,
      safestArea: rawInsights.safestRegion,
      safestAreaCount: rawInsights.safestRegionCount,
    };

    const topRegions = computeTopRegions(crimes);
    const yearValue = yearParam === 'all' ? 'all' : parseInt(yearParam, 10);

    return new Response(
      JSON.stringify({ year: yearValue, stats, trends, insights, topRegions }),
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
    console.error('[/api/jamaica/dashboard] handler failed:', msg);
    return new Response(JSON.stringify({ error: 'Internal server error', detail: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
