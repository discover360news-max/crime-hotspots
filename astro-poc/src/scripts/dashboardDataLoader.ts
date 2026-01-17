/**
 * Dashboard Data Loader
 * Handles CSV loading, parsing, and data initialization for the dashboard
 */

// Import shared utilities - SINGLE SOURCE OF TRUTH
import { parseCSVLine, parseDate, generateSlug, createColumnMap, getColumnValue } from '../lib/csvParser';
import { TRINIDAD_CSV_URLS, REGION_DATA_CSV_URL } from '../config/csvUrls';

// Re-export for backwards compatibility with any code that imports from here
export { parseCSVLine, parseDate, generateSlug };
export { TRINIDAD_CSV_URLS, REGION_DATA_CSV_URL };

/**
 * Fetch and parse crimes from a CSV URL
 * Uses column header mapping to support different CSV layouts
 */
export async function fetchCrimesFromURL(url: string): Promise<any[]> {
  try {
    const response = await fetch(url);
    const csvText = await response.text();
    const lines = csvText.split('\n');

    // Parse headers and create column mapping using shared utility
    const columnMap = createColumnMap(lines[0]);

    // Debug: Log all column headers found
    console.log('📋 CSV Column Headers:', Array.from(columnMap.keys()));

    const crimes: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line);

      // Helper function using shared getColumnValue
      const getColumn = (columnName: string): string => getColumnValue(values, columnMap, columnName);

      // Extract values using column mapping
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

      const slug = generateSlug(headline, dateObj);

      // Parse victim count (default to 1 if not provided or invalid)
      const victimCount = victimCountStr ? parseInt(victimCountStr, 10) : 1;
      const validVictimCount = !isNaN(victimCount) && victimCount > 0 ? victimCount : 1;

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
        slug,
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
    const lines = csvText.split('\n');

    // Parse headers using shared utility
    const columnMap = createColumnMap(lines[0]);

    const areaIndex = columnMap.get('area');
    const knownAsIndex = columnMap.get('known_as');

    if (areaIndex === undefined || knownAsIndex === undefined) {
      console.error('❌ RegionData CSV missing required columns (Area, known_as)');
      return {};
    }

    const aliases: Record<string, string> = {};

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line);
      const area = values[areaIndex]?.trim();
      const knownAs = values[knownAsIndex]?.trim();

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

  // Wait for minimum time if needed
  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }

  // Hide shimmer, show content (opacity only - no layout shift)
  if (shimmerEl) shimmerEl.style.opacity = '0';
  if (contentEl) {
    contentEl.style.opacity = '1';
  }
}

/**
 * Initialize dashboard data loading
 * Fetches crime data and area aliases, then updates the dashboard
 */
export async function initializeDashboardData(): Promise<void> {
  // Track when shimmers started
  const shimmerStartTime = Date.now();

  console.log('🔍 Loading crimes data and area aliases from CSV...');

  // Fetch area aliases, historical trends, and current crimes in parallel
  const [areaAliases, historicalTrendsData, crimesCurrentData] = await Promise.all([
    fetchAreaAliases(REGION_DATA_CSV_URL),
    // Fetch historical snippet (Nov-Dec 2025) for trend calculations only
    fetchCrimesFromURL(TRINIDAD_CSV_URLS.historicalTrends),
    fetchCrimesFromURL(TRINIDAD_CSV_URLS.current)
  ]);

  // Store area aliases globally for map popups
  (window as any).__areaAliases = areaAliases;

  // Log loaded data
  if (historicalTrendsData.length > 0) {
    console.log(`✅ Loaded ${historicalTrendsData.length} historical crimes (Nov-Dec 2025) for trend calculations`);
  }
  console.log(`✅ Loaded ${crimesCurrentData.length} crimes from current sheet (2026)`);

  // Combine all crimes (historical + current)
  // Historical data is used ONLY for trend calculations, not display
  const crimes = [...historicalTrendsData, ...crimesCurrentData];
  crimes.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  console.log(`✅ Total crimes loaded: ${crimes.length}`);

  // Store ALL crimes globally for year filter script
  (window as any).__crimesData = crimes;

  // Calculate current year (highest year)
  const availableYears = [...new Set(crimes.map(c => c.year))].sort((a, b) => b - a);
  const currentYear = availableYears[0];
  console.log(`🎯 Current year detected: ${currentYear}`);

  // Filter to show only current year by default
  const currentYearCrimes = crimes.filter(c => c.year === currentYear);
  console.log(`📊 Showing ${currentYearCrimes.length} crimes from ${currentYear} (filtered from ${crimes.length} total)`);
  console.log(`📊 Current year crimes sample:`, currentYearCrimes.slice(0, 3).map(c => ({
    year: c.year,
    headline: c.headline,
    primaryCrimeType: c.primaryCrimeType,
    relatedCrimeTypes: c.relatedCrimeTypes
  })));

  // Update stats with trends (need to import the function)
  const { updateStatsCards } = await import('./dashboardUpdates');
  console.log(`📊 About to call updateStatsCards with ${currentYearCrimes.length} current year crimes`);
  updateStatsCards(currentYearCrimes, crimes);
  console.log(`📊 updateStatsCards completed`);

  // Hide stats and insights shimmers with minimum display time
  await hideShimmerWithMinTime(
    document.getElementById('statsShimmer'),
    document.querySelector('.stats-scroll-container'),
    shimmerStartTime
  );

  await hideShimmerWithMinTime(
    document.getElementById('insightsShimmer'),
    document.getElementById('insightsCards'),
    shimmerStartTime
  );

  // Hide Top Regions shimmer (no overlay pattern - sequential display)
  const topRegionsShimmer = document.getElementById('topRegionsShimmer');
  const topRegionsCard = document.getElementById('topRegionsCard');

  const elapsed = Date.now() - shimmerStartTime;
  const remaining = Math.max(0, MINIMUM_SHIMMER_TIME - elapsed);

  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }

  if (topRegionsShimmer) topRegionsShimmer.style.display = 'none';
  if (topRegionsCard) topRegionsCard.style.opacity = '1';
}

// Make hideShimmerWithMinTime available globally for use by other scripts
(window as any).hideShimmerWithMinTime = hideShimmerWithMinTime;
