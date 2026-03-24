/**
 * Dashboard Data Loader
 * Handles data loading and initialization for the dashboard.
 *
 * PRIMARY PATH (Phase 3): Fetches pre-computed JSON from /api/dashboard + /api/crimes (D1-backed).
 * FALLBACK PATH: Falls back to CSV fetches if the API is unavailable.
 * AREA ALIASES: Loaded from static area-aliases.json (baked at build time by csvBuildPlugin).
 */

// Import shared utilities - SINGLE SOURCE OF TRUTH
import { parseCSVLine, parseDate, generateSlug, generateSlugWithId, getColumnValue, parseFullCSV, createColumnMapFromArray } from '../lib/csvParser';
import { TRINIDAD_CSV_URLS, REGION_DATA_CSV_URL } from '../config/csvUrls';

// Static area aliases — baked at build time, zero network cost
import areaAliasesJson from '../data/area-aliases.json';

// Re-export for backwards compatibility with any code that imports from here
export { parseCSVLine, parseDate, generateSlug, generateSlugWithId };
export { TRINIDAD_CSV_URLS, REGION_DATA_CSV_URL };

/**
 * Fetch and parse crimes from a CSV URL
 * Uses column header mapping to support different CSV layouts
 */
export async function fetchCrimesFromURL(url: string): Promise<any[]> {
  try {
    const response = await fetch(url);
    const csvText = await response.text();
    const rows = parseFullCSV(csvText);

    if (rows.length < 2) return [];

    const columnMap = createColumnMapFromArray(rows[0]);

    const crimes: any[] = [];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];

      const getColumn = (columnName: string): string => getColumnValue(values, columnMap, columnName);

      const headline = getColumn('Headline');
      const summary = getColumn('Summary');
      const primaryCrimeType = getColumn('primaryCrimeType');
      const relatedCrimeTypes = getColumn('relatedCrimeType') || getColumn('relatedCrimeTypes');
      const victimCountStr = getColumn('victimCount') || getColumn('victimcount') || getColumn('Victim Count');
      const crimeType = getColumn('Crime Type') || getColumn('crimeType');
      const date = getColumn('Date');
      const street = getColumn('Street Address') || getColumn('Street');
      const area = getColumn('Area');
      const region = getColumn('Region');
      const crimeUrl = getColumn('URL');
      const source = getColumn('Source');
      const latitude = getColumn('Latitude');
      const longitude = getColumn('Longitude');

      if (!headline || !date) continue;

      const dateObj = parseDate(date);
      if (isNaN(dateObj.getTime())) {
        continue;
      }

      const storyId = getColumn('story_id') || null;
      const oldSlug = generateSlug(headline, dateObj);
      const slug = storyId ? generateSlugWithId(storyId, headline) : oldSlug;

      const victimCount = victimCountStr ? parseInt(victimCountStr, 10) : 1;
      const validVictimCount = !isNaN(victimCount) && victimCount >= 0 ? victimCount : 1;

      const datePublishedStr = getColumn('Date_Published');
      const dateUpdatedStr = getColumn('Date_Updated');
      const datePublishedObj = datePublishedStr ? parseDate(datePublishedStr) : undefined;
      const dateUpdatedObj = dateUpdatedStr ? parseDate(dateUpdatedStr) : undefined;

      crimes.push({
        date,
        headline,
        crimeType,
        primaryCrimeType: primaryCrimeType || undefined,
        relatedCrimeTypes: relatedCrimeTypes || undefined,
        victimCount: validVictimCount,
        street,
        area,
        region,
        url: crimeUrl,
        source,
        latitude: Number(latitude),
        longitude: Number(longitude),
        summary,
        datePublished: datePublishedObj && !isNaN(datePublishedObj.getTime()) ? datePublishedObj : undefined,
        dateUpdated: dateUpdatedObj && !isNaN(dateUpdatedObj.getTime()) ? dateUpdatedObj : undefined,
        slug,
        storyId,
        oldSlug,
        dateObj,
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1,
        day: dateObj.getDate()
      });
    }

    return crimes;
  } catch (error) {
    console.error('Error fetching crimes from URL:', url, error);
    return [];
  }
}

/**
 * Fetch and parse area aliases from RegionData CSV
 */
export async function fetchAreaAliases(url: string): Promise<Record<string, string>> {
  try {
    const response = await fetch(url);
    const csvText = await response.text();
    const rows = parseFullCSV(csvText);

    if (rows.length < 2) return {};

    const columnMap = createColumnMapFromArray(rows[0]);

    const areaIndex = columnMap.get('area');
    const knownAsIndex = columnMap.get('known_as');

    if (areaIndex === undefined || knownAsIndex === undefined) {
      console.error('❌ RegionData CSV missing required columns (Area, known_as)');
      return {};
    }

    const aliases: Record<string, string> = {};

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      const area = values[areaIndex];
      const knownAs = values[knownAsIndex];

      if (area && knownAs && knownAs !== area) {
        aliases[area] = knownAs;
      }
    }

    console.log(`✅ Loaded ${Object.keys(aliases).length} area aliases`);
    return aliases;
  } catch (error) {
    console.error('Error fetching area aliases:', url, error);
    return {};
  }
}

/**
 * Shimmer control with minimum display time
 */
const MINIMUM_SHIMMER_TIME = 500; // milliseconds

export async function hideShimmerWithMinTime(
  shimmerEl: HTMLElement | null,
  contentEl: HTMLElement | null,
  shimmerStartTime: number
): Promise<void> {
  const elapsed = Date.now() - shimmerStartTime;
  const remaining = Math.max(0, MINIMUM_SHIMMER_TIME - elapsed);

  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }

  if (shimmerEl) {
    shimmerEl.style.opacity = '0';
    shimmerEl.style.pointerEvents = 'none';
  }
  if (contentEl) {
    contentEl.style.opacity = '1';
  }
}

/**
 * CSV fallback: fetch crimes + area aliases from Google Sheets CSVs.
 * Called if the primary API path fails.
 */
async function initializeDashboardDataFromCSV(): Promise<void> {
  const shimmerStartTime = Date.now();

  console.log('🔍 Loading crimes data and area aliases from CSV (fallback)...');

  const [areaAliases, crimes] = await Promise.all([
    fetchAreaAliases(REGION_DATA_CSV_URL),
    fetchCrimesFromURL(TRINIDAD_CSV_URLS.current)
  ]);

  (window as any).__areaAliases = areaAliases;
  crimes.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  (window as any).__crimesData = crimes;

  const availableYears = [...new Set(crimes.map((c: any) => c.year))].sort((a: any, b: any) => b - a);
  const currentYear = availableYears[0];
  const currentYearCrimes = crimes.filter((c: any) => c.year === currentYear);

  const { updateStatsCards } = await import('./dashboardUpdates');
  updateStatsCards(currentYearCrimes, crimes);

  await hideShimmerWithMinTime(
    document.getElementById('statsShimmer'),
    document.querySelector('.stats-scroll-container'),
    shimmerStartTime
  );

  const statsScrollHint = document.getElementById('statsScrollHint');
  if (statsScrollHint) statsScrollHint.style.opacity = '1';

  await hideShimmerWithMinTime(
    document.getElementById('insightsShimmer'),
    document.getElementById('insightsCards'),
    shimmerStartTime
  );

  await hideShimmerWithMinTime(
    document.getElementById('topRegionsShimmer'),
    document.getElementById('topRegionsCard'),
    shimmerStartTime
  );

  // Signal that crimes data is ready
  window.dispatchEvent(new CustomEvent('crimesDataReady'));
}

/**
 * Initialize dashboard data loading.
 *
 * SSR PATH (production): Initial HTML already has real D1 data. Skip shimmer dance —
 * immediately reveal stats/insights/topRegions, then silently fetch /api/crimes/ for
 * window.__crimesData (needed by Leaflet map + onYearChange year filter).
 *
 * NON-SSR PATH (local dev without D1): shimmer → fetch /api/dashboard + /api/crimes → apply.
 * FALLBACK: Falls back to CSV fetches if the API is unavailable.
 */
export async function initializeDashboardData(): Promise<void> {
  // Area aliases — static, zero network cost
  (window as any).__areaAliases = areaAliasesJson;

  // Default year and SSR flag set via define:vars in dashboard.astro
  const year = (window as any).__dashboardDefaultYear || String(new Date().getFullYear());
  const isSSR = !!(window as any).__dashboardSSR;

  if (isSSR) {
    // SSR path: stats/insights/topRegions already rendered with real D1 data.
    // Reveal them immediately — no shimmer needed on first load.
    const statsShimmer = document.getElementById('statsShimmer');
    const statsContainer = document.querySelector('.stats-scroll-container') as HTMLElement | null;
    const insightsShimmer = document.getElementById('insightsShimmer');
    const insightsCards = document.getElementById('insightsCards');
    const topRegionsShimmer = document.getElementById('topRegionsShimmer');
    const topRegionsCard = document.getElementById('topRegionsCard');

    if (statsShimmer) { statsShimmer.style.opacity = '0'; statsShimmer.style.pointerEvents = 'none'; }
    if (statsContainer) statsContainer.style.opacity = '1';
    if (insightsShimmer) { insightsShimmer.style.opacity = '0'; insightsShimmer.style.pointerEvents = 'none'; }
    if (insightsCards) insightsCards.style.opacity = '1';
    if (topRegionsShimmer) { topRegionsShimmer.style.opacity = '0'; topRegionsShimmer.style.pointerEvents = 'none'; }
    if (topRegionsCard) topRegionsCard.style.opacity = '1';

    const statsScrollHint = document.getElementById('statsScrollHint');
    if (statsScrollHint) statsScrollHint.style.opacity = '1';

    // Fetch crimes (for map/filter) and dashboard stats (for trend indicators) in parallel.
    // Both are CDN-cached. Counts are already correct in SSR HTML — only trends need populating.
    try {
      const [crimesData, dashData] = await Promise.all([
        fetch(`/api/crimes/?year=${year}`).then(r => {
          if (!r.ok) throw new Error(`/api/crimes responded ${r.status}`);
          return r.json();
        }),
        fetch(`/api/dashboard/?year=${year}`).then(r => {
          if (!r.ok) throw new Error(`/api/dashboard responded ${r.status}`);
          return r.json();
        }),
      ]) as [any, any];
      const crimes = (crimesData.crimes as any[]).map(c => ({
        ...c,
        dateObj: new Date(c.year, c.month - 1, c.day),
      }));
      (window as any).__crimesData = crimes;
      const { applyPrecomputedStats } = await import('./dashboardUpdates');
      applyPrecomputedStats(dashData.stats, dashData.trends);
    } catch (err) {
      console.warn('Background fetch failed (trends/map/filter may not work):', err);
      // Ensure map can still initialize (will show empty tiles rather than hanging shimmer)
      if (!(window as any).__crimesData) (window as any).__crimesData = [];
    }

    // Signal crimes data ready — wires up year filter dropdown
    window.dispatchEvent(new CustomEvent('crimesDataReady'));
    return;
  }

  // Non-SSR path (local dev without D1): shimmer → API → apply precomputed stats
  const shimmerStartTime = Date.now();

  try {
    const [dashData, crimesData] = await Promise.all([
      fetch(`/api/dashboard/?year=${year}`).then(r => {
        if (!r.ok) throw new Error(`/api/dashboard responded ${r.status}`);
        return r.json();
      }),
      fetch(`/api/crimes/?year=${year}`).then(r => {
        if (!r.ok) throw new Error(`/api/crimes responded ${r.status}`);
        return r.json();
      }),
    ]) as [any, any];

    // Reconstruct dateObj (omitted from JSON serialization)
    const crimes = (crimesData.crimes as any[]).map(c => ({
      ...c,
      dateObj: new Date(c.year, c.month - 1, c.day),
    }));

    (window as any).__crimesData = crimes;

    const {
      applyPrecomputedStats,
      applyPrecomputedInsights,
      applyPrecomputedTopRegions,
    } = await import('./dashboardUpdates');

    applyPrecomputedStats(dashData.stats, dashData.trends);
    applyPrecomputedInsights(dashData.insights);
    applyPrecomputedTopRegions(dashData.topRegions);

    await hideShimmerWithMinTime(
      document.getElementById('statsShimmer'),
      document.querySelector('.stats-scroll-container'),
      shimmerStartTime
    );

    const statsScrollHint = document.getElementById('statsScrollHint');
    if (statsScrollHint) statsScrollHint.style.opacity = '1';

    await hideShimmerWithMinTime(
      document.getElementById('insightsShimmer'),
      document.getElementById('insightsCards'),
      shimmerStartTime
    );

    await hideShimmerWithMinTime(
      document.getElementById('topRegionsShimmer'),
      document.getElementById('topRegionsCard'),
      shimmerStartTime
    );

    // Signal that crimes data is ready for the year filter script
    window.dispatchEvent(new CustomEvent('crimesDataReady'));

  } catch (err) {
    console.warn('API fetch failed, falling back to CSV:', err);
    await initializeDashboardDataFromCSV();
  }
}

// Make hideShimmerWithMinTime available globally for use by other scripts
(window as any).hideShimmerWithMinTime = hideShimmerWithMinTime;
