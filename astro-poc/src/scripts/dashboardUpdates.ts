/**
 * Dashboard Update Functions
 * Handles updating dashboard components when filters change
 * Used by year filter and stat card filtering
 */

import type { Crime } from '../lib/crimeData';
import { countCrimeType } from '../lib/dashboardHelpers';
import { getTotalCrimeCount } from '../lib/statisticsHelpers';
import { generateNameSlug } from '../lib/csvParser';
import { getRiskWeight } from '../config/riskWeights';
import { usesVictimCount, crimeHasVictims } from '../config/crimeTypeConfig';
import { buildRoute } from '../config/routes';
import { escapeHtml } from '../lib/escapeHtml';

/**
 * Calculate risk score for a single crime
 *
 * Risk calculation:
 * - Primary crime: weight × victimCount (if crime type uses victim count)
 * - Primary crime: weight × 1 (if crime type doesn't use victim count)
 * - Related crimes: weight × 1 (always count as 1, no victim multiplier)
 *
 * Example:
 * - Murder (weight 10) with victimCount=3 + Shooting (weight 7) related
 * - Risk = (10 × 3) + (7 × 1) = 30 + 7 = 37
 */
function calculateCrimeRisk(crime: Crime): number {
  let riskScore = 0;

  // Calculate primary crime risk
  const primaryType = crime.primaryCrimeType || crime.crimeType;
  if (primaryType) {
    const weight = getRiskWeight(primaryType);
    const victimCount = usesVictimCount(primaryType) && crime.victimCount ? crime.victimCount : 1;
    riskScore += weight * victimCount;
  }

  // Calculate related crimes risk (always × 1, no victim multiplier)
  if (crime.relatedCrimeTypes) {
    const relatedTypes = crime.relatedCrimeTypes.split(',').map(t => t.trim()).filter(t => t);
    relatedTypes.forEach(relatedType => {
      const weight = getRiskWeight(relatedType);
      riskScore += weight * 1; // Always count as 1 for related crimes
    });
  }

  return riskScore;
}


/**
 * Update a stat card's value and trend indicator.
 * Shared by updateStatsCards (computed from Crime[]) and applyPrecomputedStats (from API).
 */
function updateCardWithTrend(card: Element | null, displayValue: number, last30Count: number, prev30Count: number) {
  if (!card) return;

  const valueEl = card.querySelector('.text-3xl');
  const trendEl = card.querySelector('.trend-indicator');

  if (valueEl) valueEl.textContent = displayValue.toString();

  if (trendEl && prev30Count > 0) {
    const change = last30Count - prev30Count;
    const percent = Math.round((change / prev30Count) * 100);
    const arrow = change >= 0 ? '↑' : '↓';
    const color = change >= 0 ? 'text-red-600' : 'text-emerald-600';

    trendEl.innerHTML = `<span class="${color}">${arrow} ${Math.abs(change)} (${Math.abs(percent)}%)</span> vs prev 30 days`;
    trendEl.classList.remove('hidden');
  } else if (trendEl) {
    trendEl.classList.add('hidden');
  }
}

/**
 * Update stats cards with filtered crime data and trends
 */
export function updateStatsCards(crimes: Crime[], allCrimes?: Crime[]) {
  // Calculate time periods for trend comparison with 3-day lag
  // (crimes are posted with crime date, not report date, so we have a 3-day processing lag)
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);

  const thirtyThreeDaysAgo = new Date(now);
  thirtyThreeDaysAgo.setDate(now.getDate() - 33); // 3 + 30 days

  const sixtyThreeDaysAgo = new Date(now);
  sixtyThreeDaysAgo.setDate(now.getDate() - 63); // 3 + 60 days

  // Determine which dataset to use for trends based on active filter
  // - If viewing "All Years" OR filtered data matches allCrimes: use allCrimes (includes historical)
  // - If viewing specific year filter: use filtered data only (respects year filter)
  const isViewingAllData = !allCrimes || crimes.length === allCrimes.length;

  // Special case: If user is viewing current year (2026), use allCrimes to include historical data
  // This ensures trends work even in early 2026 when we don't have 63 days yet
  const currentYear = new Date().getFullYear();
  const viewingYears = [...new Set(crimes.map(c => c.year))];
  const isViewingCurrentYear = viewingYears.length === 1 && viewingYears[0] === currentYear;

  const finalCrimesForTrends = (isViewingAllData || isViewingCurrentYear) && allCrimes ? allCrimes : crimes;

  // Trend data: last 30 days (ending 3 days ago)
  const last30DaysCrimes = finalCrimesForTrends.filter(c => {
    const crimeDate = new Date(c.date);
    return crimeDate >= thirtyThreeDaysAgo && crimeDate <= threeDaysAgo;
  });

  // Trend data: previous 30 days (33-63 days ago)
  const prev30DaysCrimes = finalCrimesForTrends.filter(c => {
    const crimeDate = new Date(c.date);
    return crimeDate >= sixtyThreeDaysAgo && crimeDate < thirtyThreeDaysAgo;
  });

  // Calculate display counts (from filtered crimes parameter)
  // Uses countCrimeType to count across both primaryCrimeType and relatedCrimeTypes
  const displayTotal = getTotalCrimeCount(crimes);
  const displayMurders = countCrimeType(crimes, 'Murder');
  const displayAttemptedMurders = countCrimeType(crimes, 'Attempted Murder');
  const displayShootings = countCrimeType(crimes, 'Shooting');
  const displayRobberies = countCrimeType(crimes, 'Robbery');
  const displayCarjackings = countCrimeType(crimes, 'Carjacking');
  const displayHomeInvasions = countCrimeType(crimes, 'Home Invasion');
  const displayBurglaries = countCrimeType(crimes, 'Burglary');
  const displayThefts = countCrimeType(crimes, 'Theft');
  const displayAssaults = countCrimeType(crimes, 'Assault');
  const displayKidnappings = countCrimeType(crimes, 'Kidnapping');

  // Calculate trend counts (last 30 days from ALL crimes)
  const last30Total = getTotalCrimeCount(last30DaysCrimes);
  const last30Murders = countCrimeType(last30DaysCrimes, 'Murder');
  const last30AttemptedMurders = countCrimeType(last30DaysCrimes, 'Attempted Murder');
  const last30Shootings = countCrimeType(last30DaysCrimes, 'Shooting');
  const last30Robberies = countCrimeType(last30DaysCrimes, 'Robbery');
  const last30Carjackings = countCrimeType(last30DaysCrimes, 'Carjacking');
  const last30HomeInvasions = countCrimeType(last30DaysCrimes, 'Home Invasion');
  const last30Burglaries = countCrimeType(last30DaysCrimes, 'Burglary');
  const last30Thefts = countCrimeType(last30DaysCrimes, 'Theft');
  const last30Assaults = countCrimeType(last30DaysCrimes, 'Assault');
  const last30Kidnappings = countCrimeType(last30DaysCrimes, 'Kidnapping');

  // Calculate previous 30-day counts
  const prev30Total = getTotalCrimeCount(prev30DaysCrimes);
  const prev30Murders = countCrimeType(prev30DaysCrimes, 'Murder');
  const prev30AttemptedMurders = countCrimeType(prev30DaysCrimes, 'Attempted Murder');
  const prev30Shootings = countCrimeType(prev30DaysCrimes, 'Shooting');
  const prev30Robberies = countCrimeType(prev30DaysCrimes, 'Robbery');
  const prev30Carjackings = countCrimeType(prev30DaysCrimes, 'Carjacking');
  const prev30HomeInvasions = countCrimeType(prev30DaysCrimes, 'Home Invasion');
  const prev30Burglaries = countCrimeType(prev30DaysCrimes, 'Burglary');
  const prev30Thefts = countCrimeType(prev30DaysCrimes, 'Theft');
  const prev30Assaults = countCrimeType(prev30DaysCrimes, 'Assault');
  const prev30Kidnappings = countCrimeType(prev30DaysCrimes, 'Kidnapping');

  // Update all cards with trends — data-crime-type attribute lookup (not brittle positional index)
  const cardByType = (type: string) => document.querySelector(`.stat-card[data-crime-type="${type}"]`);
  updateCardWithTrend(document.getElementById('totalIncidents'), displayTotal, last30Total, prev30Total);
  updateCardWithTrend(cardByType('Murder'), displayMurders, last30Murders, prev30Murders);
  // Sync vitals row murders card
  const vitalsMurdersEl = document.getElementById('vitals-murders');
  if (vitalsMurdersEl) { const v = vitalsMurdersEl.querySelector('.text-3xl'); if (v) v.textContent = String(displayMurders); }
  updateCardWithTrend(cardByType('Attempted Murder'), displayAttemptedMurders, last30AttemptedMurders, prev30AttemptedMurders);
  updateCardWithTrend(cardByType('Shooting'), displayShootings, last30Shootings, prev30Shootings);
  updateCardWithTrend(cardByType('Robbery'), displayRobberies, last30Robberies, prev30Robberies);
  updateCardWithTrend(cardByType('Carjacking'), displayCarjackings, last30Carjackings, prev30Carjackings);
  updateCardWithTrend(cardByType('Home Invasion'), displayHomeInvasions, last30HomeInvasions, prev30HomeInvasions);
  updateCardWithTrend(cardByType('Burglary'), displayBurglaries, last30Burglaries, prev30Burglaries);
  updateCardWithTrend(cardByType('Theft'), displayThefts, last30Thefts, prev30Thefts);
  updateCardWithTrend(cardByType('Assault'), displayAssaults, last30Assaults, prev30Assaults);
  updateCardWithTrend(cardByType('Kidnapping'), displayKidnappings, last30Kidnappings, prev30Kidnappings);
}

/**
 * Update Quick Insights card with filtered crime data
 */
export function updateQuickInsights(crimes: Crime[]) {
  // If no crimes, show "No data" message
  if (crimes.length === 0) {
    const avgPerDayEl = document.getElementById('avgPerDay');
    const victimsPerDayEl = document.getElementById('victimsPerDay');
    const mostDangerousDayEl = document.getElementById('mostDangerousDay');
    const busiestMonthEl = document.getElementById('busiestMonth');
    const mostDangerousRegionEl = document.getElementById('mostDangerousRegion');
    const mostDangerousRegionCountEl = document.getElementById('mostDangerousRegionCount');
    const safestRegionEl = document.getElementById('safestRegion');
    const safestRegionCountEl = document.getElementById('safestRegionCount');

    if (avgPerDayEl) avgPerDayEl.textContent = 'No data';
    if (victimsPerDayEl) victimsPerDayEl.textContent = '0 victims/day';
    if (mostDangerousDayEl) mostDangerousDayEl.textContent = 'N/A';
    if (busiestMonthEl) busiestMonthEl.textContent = 'N/A';
    if (mostDangerousRegionEl) mostDangerousRegionEl.textContent = 'N/A';
    if (mostDangerousRegionCountEl) mostDangerousRegionCountEl.textContent = '0 crimes';
    if (safestRegionEl) safestRegionEl.textContent = 'N/A';
    if (safestRegionCountEl) safestRegionCountEl.textContent = '0 crimes';
    return;
  }

  // Use dateObj (local-time Date) when available; fall back to parsing c.date string.
  // Avoids UTC-midnight parse shifting Peak Day/Busiest Month in non-UTC timezones.
  const dates = crimes.map(c => (c as any).dateObj instanceof Date ? (c as any).dateObj : new Date(c.date)).filter((d: Date) => !isNaN(d.getTime()));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate total crimes (primary + related)
  const totalCrimes = crimes.reduce((sum, crime) => {
    let crimeCount = 0;

    // Count primary crime type
    if (crime.primaryCrimeType || crime.crimeType) {
      crimeCount += 1;
    }

    // Count related crimes
    if (crime.relatedCrimeTypes) {
      const relatedTypes = crime.relatedCrimeTypes.split(',').map(t => t.trim()).filter(t => t);
      crimeCount += relatedTypes.length;
    }

    return sum + crimeCount;
  }, 0);

  // Calculate total victims (respecting victimCount config)
  const totalVictims = crimes.reduce((sum, crime) => {
    const primaryType = crime.primaryCrimeType || crime.crimeType;

    if (primaryType && usesVictimCount(primaryType)) {
      const victimCount = Number(crime.victimCount) || 1;
      return sum + victimCount;
    }

    return crimeHasVictims(primaryType) ? sum + 1 : sum;
  }, 0);

  const avgPerDay = (totalCrimes / daysDiff).toFixed(1);
  const victimsPerDay = Math.round(totalVictims / daysDiff);

  // Most dangerous day
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCount = new Map<string, number>();
  dates.forEach(date => {
    const day = dayNames[date.getDay()];
    dayCount.set(day, (dayCount.get(day) || 0) + 1);
  });
  const mostDangerousDay = Array.from(dayCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Busiest month
  const monthCount = new Map<string, number>();
  dates.forEach(date => {
    const month = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthCount.set(month, (monthCount.get(month) || 0) + 1);
  });
  const busiestMonth = Array.from(monthCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Area stats — count primary + related crime types per row (matches "All Crimes" methodology)
  const areaCount = new Map<string, number>();
  crimes.forEach(crime => {
    const area = crime.area || 'Unknown';
    let crimeCount = crime.primaryCrimeType || crime.crimeType ? 1 : 0;
    if (crime.relatedCrimeTypes) {
      const relatedTypes = crime.relatedCrimeTypes.split(',').map(t => t.trim()).filter(t => t);
      crimeCount += relatedTypes.length;
    }
    areaCount.set(area, (areaCount.get(area) || 0) + crimeCount);
  });
  const areaArray = Array.from(areaCount.entries()).sort((a, b) => b[1] - a[1]);

  // Filter out "Unknown" and empty area values for both highest and lowest lookups
  const validAreas = areaArray.filter(([area]) => area && area !== 'Unknown' && area.trim() !== '');
  const safestRegion = validAreas[validAreas.length - 1]?.[0] || 'N/A';
  const safestRegionCount = validAreas[validAreas.length - 1]?.[1] || 0;

  // Use validAreas (not areaArray) so "Unknown" is never returned as the highest-crime area
  const mostDangerousRegion = validAreas[0]?.[0] || 'N/A';
  const mostDangerousRegionCount = validAreas[0]?.[1] || 0;

  // Update DOM using IDs
  const avgPerDayEl = document.getElementById('avgPerDay');
  const victimsPerDayEl = document.getElementById('victimsPerDay');
  const mostDangerousDayEl = document.getElementById('mostDangerousDay');
  const busiestMonthEl = document.getElementById('busiestMonth');
  const mostDangerousRegionEl = document.getElementById('mostDangerousRegion');
  const mostDangerousRegionCountEl = document.getElementById('mostDangerousRegionCount');
  const safestRegionEl = document.getElementById('safestRegion');
  const safestRegionCountEl = document.getElementById('safestRegionCount');

  if (avgPerDayEl) avgPerDayEl.textContent = `${avgPerDay} crimes/day`;
  if (victimsPerDayEl) victimsPerDayEl.textContent = `${victimsPerDay} victims/day`;
  if (mostDangerousDayEl) mostDangerousDayEl.textContent = mostDangerousDay;
  if (busiestMonthEl) busiestMonthEl.textContent = busiestMonth;
  // Sync vitals daily avg card
  const vd = document.getElementById('vitals-daily'); if (vd) { const v = vd.querySelector('.text-3xl'); if (v) v.textContent = avgPerDay; const s = document.getElementById('vitals-daily-sub'); if (s) s.textContent = `${victimsPerDay} victims/day`; }
  // Sync vitals hotspot card
  const vh = document.getElementById('vitals-hotspot') as HTMLAnchorElement | null; if (vh) { const v = vh.querySelector('.text-3xl'); if (v) v.textContent = String(mostDangerousRegionCount); const s = document.getElementById('vitals-hotspot-sub'); if (s) s.textContent = mostDangerousRegion; vh.href = buildRoute.area(generateNameSlug(mostDangerousRegion)); }
  // Update area names and wrap parent <a> with correct href
  if (mostDangerousRegionEl) {
    mostDangerousRegionEl.textContent = mostDangerousRegion;
    const dangerousLink = mostDangerousRegionEl.closest('a');
    if (dangerousLink) dangerousLink.href = buildRoute.area(generateNameSlug(mostDangerousRegion));
  }
  if (mostDangerousRegionCountEl) mostDangerousRegionCountEl.textContent = `${mostDangerousRegionCount} crimes`;
  if (safestRegionEl) {
    safestRegionEl.textContent = safestRegion;
    const safestLink = safestRegionEl.closest('a');
    if (safestLink) safestLink.href = buildRoute.area(generateNameSlug(safestRegion));
  }
  if (safestRegionCountEl) safestRegionCountEl.textContent = `${safestRegionCount} crimes`;
}


/**
 * Update Top Areas card with filtered crime data
 */
export function updateTopRegions(crimes: Crime[]) {
  const container = document.getElementById('topRegionsContainer');
  if (!container) return;

  if (crimes.length === 0) {
    container.innerHTML = '<div class="text-xs text-slate-400 text-center py-4">No data available</div>';
    return;
  }

  // Accumulate weighted scores and raw crime counts per region
  const regionWeightedScores = new Map<string, number>();
  const regionCrimeCounts = new Map<string, number>();

  crimes.forEach(crime => {
    const region = (crime.region || '').trim();
    if (!region || region === 'Unknown') return;
    regionWeightedScores.set(region, (regionWeightedScores.get(region) || 0) + calculateCrimeRisk(crime));
    let count = crime.primaryCrimeType || crime.crimeType ? 1 : 0;
    if (crime.relatedCrimeTypes) {
      count += crime.relatedCrimeTypes.split(',').map((t: string) => t.trim()).filter(Boolean).length;
    }
    regionCrimeCounts.set(region, (regionCrimeCounts.get(region) || 0) + count);
  });

  const regionEntries = Array.from(regionWeightedScores.entries())
    .map(([region, weightedScore]) => ({
      region,
      crimeCount: regionCrimeCounts.get(region) ?? 0,
      weightedScore,
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 10);

  const maxWeightedScore = regionEntries[0]?.weightedScore ?? 1;

  container.innerHTML = regionEntries.map(({ region, crimeCount, weightedScore }, index) => {
    const barWidth = maxWeightedScore > 0 ? Math.round((weightedScore / maxWeightedScore) * 100) : 0;
    const riskLevelText = getRiskLevelText(barWidth);
    const riskTextColor = getRiskTextColor(barWidth);
    const regionSlug = generateNameSlug(region);
    const mobileHidden = index >= 5 ? 'hidden sm:flex' : '';
    return `
    <a href="${buildRoute.region(regionSlug)}" class="${mobileHidden} flex flex-col gap-1 pb-3 border-b border-slate-200 dark:border-[var(--ch-border-card)] hover:bg-slate-100 dark:hover:bg-[hsl(0_0%_14%)] active:bg-slate-100 dark:active:bg-[hsl(0_0%_14%)] rounded-lg px-2 -mx-2 py-2 transition">
      <div class="flex justify-between items-center gap-2">
        <span class="text-xs text-slate-500 dark:text-[var(--ch-text-muted)] truncate flex-1">${escapeHtml(region)}</span>
        <svg class="w-3.5 h-3.5 flex-shrink-0 text-slate-400 dark:text-[var(--ch-text-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <!-- Bar width relative to #1 region's absolute weighted score -->
      <div class="relative w-full h-2 bg-slate-200 dark:bg-[hsl(0_0%_18%)] rounded-full overflow-hidden">
        <div class="absolute top-0 left-0 h-full overflow-hidden transition-all duration-300" style="width: ${barWidth}%">
          <div class="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-rose-600" style="width: ${barWidth > 0 ? Math.round((100 / barWidth) * 100) : 100}%"></div>
        </div>
      </div>
      <!-- Risk label: weighted severity score per 100k residents -->
      <span class="text-xs font-medium ${riskTextColor}">Risk: ${riskLevelText}</span>
    </a>
  `;
  }).join('');

  window.dispatchEvent(new CustomEvent('topAreasRendered'));
}

/**
 * Risk label derived from bar width (0–100% relative to #1 region).
 * Label and bar always tell the same story — #1 region = Extremely Dangerous.
 * Must match getRiskLevelText in TopRegionsCard.astro.
 */
function getRiskLevelText(barWidth: number): string {
  if (barWidth <= 10) return 'Low';
  if (barWidth <= 25) return 'Medium';
  if (barWidth <= 45) return 'Concerning';
  if (barWidth <= 65) return 'High';
  if (barWidth <= 85) return 'Dangerous';
  return 'Extremely Dangerous';
}

function getRiskTextColor(barWidth: number): string {
  if (barWidth <= 25) return 'text-green-600';
  if (barWidth <= 65) return 'text-yellow-600';
  return 'text-rose-600';
}

// ============================================================================
// PRE-COMPUTED API PATH — apply server-computed data directly to DOM
// Used by dashboardDataLoader when fetching from /api/dashboard
// ============================================================================

export interface DashboardStats {
  total: number;
  murders: number;
  attemptedMurders: number;
  shootings: number;
  robberies: number;
  carjackings: number;
  homeInvasions: number;
  burglaries: number;
  thefts: number;
  assaults: number;
  kidnappings: number;
}

export interface DashboardTrends {
  last30: DashboardStats;
  prev30: DashboardStats;
}

export interface DashboardInsights {
  avgPerDay: string;
  victimsPerDay: number;
  mostDangerousDay: string;
  busiestMonth: string;
  mostDangerousArea: string;
  mostDangerousAreaCount: number;
  safestArea: string;
  safestAreaCount: number;
}

export interface TopRegionEntry {
  region: string;
  crimeCount: number;
  weightedScore: number;
  barWidth: number;
}

/**
 * Apply pre-computed stat card values + trend indicators from API response.
 * No client-side computation — values come from /api/dashboard.
 */
export function applyPrecomputedStats(stats: DashboardStats, trends: DashboardTrends): void {
  const cardByType = (type: string) => document.querySelector(`.stat-card[data-crime-type="${type}"]`);
  updateCardWithTrend(document.getElementById('totalIncidents'), stats.total, trends.last30.total, trends.prev30.total);
  updateCardWithTrend(cardByType('Murder'), stats.murders, trends.last30.murders, trends.prev30.murders);
  // Sync vitals row murders card
  const vitalsMurdersEl = document.getElementById('vitals-murders');
  if (vitalsMurdersEl) { const v = vitalsMurdersEl.querySelector('.text-3xl'); if (v) v.textContent = String(stats.murders); }
  updateCardWithTrend(cardByType('Attempted Murder'), stats.attemptedMurders, trends.last30.attemptedMurders, trends.prev30.attemptedMurders);
  updateCardWithTrend(cardByType('Shooting'), stats.shootings, trends.last30.shootings, trends.prev30.shootings);
  updateCardWithTrend(cardByType('Robbery'), stats.robberies, trends.last30.robberies, trends.prev30.robberies);
  updateCardWithTrend(cardByType('Carjacking'), stats.carjackings, trends.last30.carjackings, trends.prev30.carjackings);
  updateCardWithTrend(cardByType('Home Invasion'), stats.homeInvasions, trends.last30.homeInvasions, trends.prev30.homeInvasions);
  updateCardWithTrend(cardByType('Burglary'), stats.burglaries, trends.last30.burglaries, trends.prev30.burglaries);
  updateCardWithTrend(cardByType('Theft'), stats.thefts, trends.last30.thefts, trends.prev30.thefts);
  updateCardWithTrend(cardByType('Assault'), stats.assaults, trends.last30.assaults, trends.prev30.assaults);
  updateCardWithTrend(cardByType('Kidnapping'), stats.kidnappings, trends.last30.kidnappings, trends.prev30.kidnappings);
}

/**
 * Apply pre-computed quick insights values from API response.
 */
export function applyPrecomputedInsights(insights: DashboardInsights): void {
  const avgPerDayEl = document.getElementById('avgPerDay');
  const victimsPerDayEl = document.getElementById('victimsPerDay');
  const mostDangerousDayEl = document.getElementById('mostDangerousDay');
  const busiestMonthEl = document.getElementById('busiestMonth');
  const mostDangerousRegionEl = document.getElementById('mostDangerousRegion');
  const mostDangerousRegionCountEl = document.getElementById('mostDangerousRegionCount');
  const safestRegionEl = document.getElementById('safestRegion');
  const safestRegionCountEl = document.getElementById('safestRegionCount');

  if (avgPerDayEl) avgPerDayEl.textContent = `${insights.avgPerDay} crimes/day`;
  if (victimsPerDayEl) victimsPerDayEl.textContent = `${insights.victimsPerDay} victims/day`;
  if (mostDangerousDayEl) mostDangerousDayEl.textContent = insights.mostDangerousDay;
  if (busiestMonthEl) busiestMonthEl.textContent = insights.busiestMonth;
  // Sync vitals daily avg card
  const vd2 = document.getElementById('vitals-daily'); if (vd2) { const v = vd2.querySelector('.text-3xl'); if (v) v.textContent = insights.avgPerDay; const s = document.getElementById('vitals-daily-sub'); if (s) s.textContent = `${insights.victimsPerDay} victims/day`; }
  // Sync vitals hotspot card
  const vh2 = document.getElementById('vitals-hotspot') as HTMLAnchorElement | null; if (vh2) { const v = vh2.querySelector('.text-3xl'); if (v) v.textContent = String(insights.mostDangerousAreaCount); const s = document.getElementById('vitals-hotspot-sub'); if (s) s.textContent = insights.mostDangerousArea; vh2.href = buildRoute.area(generateNameSlug(insights.mostDangerousArea)); }
  if (mostDangerousRegionEl) {
    mostDangerousRegionEl.textContent = insights.mostDangerousArea;
    const dangerousLink = mostDangerousRegionEl.closest('a');
    if (dangerousLink) dangerousLink.href = buildRoute.area(generateNameSlug(insights.mostDangerousArea));
  }
  if (mostDangerousRegionCountEl) mostDangerousRegionCountEl.textContent = `${insights.mostDangerousAreaCount} crimes`;
  if (safestRegionEl) {
    safestRegionEl.textContent = insights.safestArea;
    const safestLink = safestRegionEl.closest('a');
    if (safestLink) safestLink.href = buildRoute.area(generateNameSlug(insights.safestArea));
  }
  if (safestRegionCountEl) safestRegionCountEl.textContent = `${insights.safestAreaCount} crimes`;
}

/**
 * Apply pre-computed top regions from API response.
 * Uses same HTML template as updateTopRegions but reads barWidth from pre-computed data.
 */
export function applyPrecomputedTopRegions(regions: TopRegionEntry[]): void {
  const container = document.getElementById('topRegionsContainer');
  if (!container) return;

  if (regions.length === 0) {
    container.innerHTML = '<div class="text-xs text-slate-400 text-center py-4">No data available</div>';
    return;
  }

  container.innerHTML = regions.map(({ region, crimeCount, barWidth }, index) => {
    const riskLevelText = getRiskLevelText(barWidth);
    const riskTextColor = getRiskTextColor(barWidth);
    const regionSlug = generateNameSlug(region);
    const mobileHidden = index >= 5 ? 'hidden sm:flex' : '';
    return `
    <a href="${buildRoute.region(regionSlug)}" class="${mobileHidden} flex flex-col gap-1 pb-3 border-b border-slate-200 dark:border-[var(--ch-border-card)] hover:bg-slate-100 dark:hover:bg-[hsl(0_0%_14%)] active:bg-slate-100 dark:active:bg-[hsl(0_0%_14%)] rounded-lg px-2 -mx-2 py-2 transition">
      <div class="flex justify-between items-center gap-2">
        <span class="text-xs text-slate-500 dark:text-[var(--ch-text-muted)] truncate flex-1">${escapeHtml(region)}</span>
        <svg class="w-3.5 h-3.5 flex-shrink-0 text-slate-400 dark:text-[var(--ch-text-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <div class="relative w-full h-2 bg-slate-200 dark:bg-[hsl(0_0%_18%)] rounded-full overflow-hidden">
        <div class="absolute top-0 left-0 h-full overflow-hidden transition-all duration-300" style="width: ${barWidth}%">
          <div class="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-rose-600" style="width: ${barWidth > 0 ? Math.round((100 / barWidth) * 100) : 100}%"></div>
        </div>
      </div>
      <span class="text-xs font-medium ${riskTextColor}">Risk: ${riskLevelText}</span>
    </a>
  `;
  }).join('');

  window.dispatchEvent(new CustomEvent('topAreasRendered'));
}
