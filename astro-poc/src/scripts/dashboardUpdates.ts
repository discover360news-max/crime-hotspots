/**
 * Dashboard Update Functions
 * Handles updating dashboard components when filters change
 * Used by year filter and stat card filtering
 */

import type { Crime } from '../lib/crimeData';
import { countCrimeType } from '../lib/dashboardHelpers';
import { generateNameSlug } from '../lib/csvParser';
import { getRiskWeight } from '../config/riskWeights';
import { usesVictimCount } from '../config/crimeTypeConfig';
import { buildRoute } from '../config/routes';

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
 * Calculate risk scores for all areas and return each area's share of total weighted risk.
 *
 * Returns a Map of area -> risk percentage (0-100)
 * Percentage = area_risk_score / total_risk_across_all_areas × 100
 *
 * This means an area with 50% of total weighted crime scores 50, not 100.
 * Labels and bar widths reflect actual crime burden share, not rank relative to the worst area.
 */
export function calculateAreaRiskLevels(crimes: Crime[]): Map<string, number> {
  // Calculate raw risk scores per area
  const areaRiskScores = new Map<string, number>();

  crimes.forEach(crime => {
    const area = crime.area || 'Unknown';
    const riskScore = calculateCrimeRisk(crime);
    areaRiskScores.set(area, (areaRiskScores.get(area) || 0) + riskScore);
  });

  // Sum total risk across ALL areas (denominator)
  const totalRiskScore = Array.from(areaRiskScores.values()).reduce((sum, s) => sum + s, 0);

  // Each area's share of total weighted risk
  const normalizedRisks = new Map<string, number>();
  areaRiskScores.forEach((score, area) => {
    const percentage = totalRiskScore > 0 ? Math.round((score / totalRiskScore) * 100) : 0;
    normalizedRisks.set(area, percentage);
  });

  return normalizedRisks;
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
  const crimesForTrends = isViewingAllData ? crimes : crimes;

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

  // Helper function to update card with trend
  function updateCardWithTrend(card: Element | null, displayValue: number, last30Count: number, prev30Count: number) {
    if (!card) return;

    const valueEl = card.querySelector('.text-3xl');
    const trendEl = card.querySelector('.trend-indicator');

    // Update the main display value (full dataset)
    if (valueEl) valueEl.textContent = displayValue.toString();

    // Update trend indicator (30-day comparison)
    if (trendEl && prev30Count > 0) {
      const change = last30Count - prev30Count;
      const percent = Math.round((change / prev30Count) * 100);
      const arrow = change >= 0 ? '↑' : '↓';
      const color = change >= 0 ? 'text-red-600' : 'text-emerald-600';

      trendEl.innerHTML = `<span class="${color}">${arrow} ${Math.abs(change)} (${Math.abs(percent)}%)</span> vs prev 30 days`;
      trendEl.classList.remove('hidden');
    } else if (trendEl) {
      // Hide trend if no previous data
      trendEl.classList.add('hidden');
    }
  }

  // Calculate display counts (from filtered crimes parameter)
  // Uses countCrimeType to count across both primaryCrimeType and relatedCrimeTypes
  const displayTotal = crimes.length;
  const displayMurders = countCrimeType(crimes, 'Murder');
  const displayRobberies = countCrimeType(crimes, 'Robbery');
  const displayHomeInvasions = countCrimeType(crimes, 'Home Invasion');
  const displayThefts = countCrimeType(crimes, 'Theft');
  const displayShootings = countCrimeType(crimes, 'Shooting');
  const displayAssaults = countCrimeType(crimes, 'Assault');
  const displayBurglaries = countCrimeType(crimes, 'Burglary');
  const displaySeizures = countCrimeType(crimes, 'Seizures');
  const displayKidnappings = countCrimeType(crimes, 'Kidnapping');

  // Calculate trend counts (last 30 days from ALL crimes)
  const last30Total = last30DaysCrimes.length;
  const last30Murders = countCrimeType(last30DaysCrimes, 'Murder');
  const last30Robberies = countCrimeType(last30DaysCrimes, 'Robbery');
  const last30HomeInvasions = countCrimeType(last30DaysCrimes, 'Home Invasion');
  const last30Thefts = countCrimeType(last30DaysCrimes, 'Theft');
  const last30Shootings = countCrimeType(last30DaysCrimes, 'Shooting');
  const last30Assaults = countCrimeType(last30DaysCrimes, 'Assault');
  const last30Burglaries = countCrimeType(last30DaysCrimes, 'Burglary');
  const last30Seizures = countCrimeType(last30DaysCrimes, 'Seizures');
  const last30Kidnappings = countCrimeType(last30DaysCrimes, 'Kidnapping');

  // Calculate previous 30-day counts
  const prev30Total = prev30DaysCrimes.length;
  const prev30Murders = countCrimeType(prev30DaysCrimes, 'Murder');
  const prev30Robberies = countCrimeType(prev30DaysCrimes, 'Robbery');
  const prev30HomeInvasions = countCrimeType(prev30DaysCrimes, 'Home Invasion');
  const prev30Thefts = countCrimeType(prev30DaysCrimes, 'Theft');
  const prev30Shootings = countCrimeType(prev30DaysCrimes, 'Shooting');
  const prev30Assaults = countCrimeType(prev30DaysCrimes, 'Assault');
  const prev30Burglaries = countCrimeType(prev30DaysCrimes, 'Burglary');
  const prev30Seizures = countCrimeType(prev30DaysCrimes, 'Seizures');
  const prev30Kidnappings = countCrimeType(prev30DaysCrimes, 'Kidnapping');

  // Update all cards with trends
  const statCards = document.querySelectorAll('.stat-card');
  updateCardWithTrend(document.getElementById('totalIncidents'), displayTotal, last30Total, prev30Total);
  updateCardWithTrend(statCards[1], displayMurders, last30Murders, prev30Murders);
  updateCardWithTrend(statCards[2], displayRobberies, last30Robberies, prev30Robberies);
  updateCardWithTrend(statCards[3], displayHomeInvasions, last30HomeInvasions, prev30HomeInvasions);
  updateCardWithTrend(statCards[4], displayThefts, last30Thefts, prev30Thefts);
  updateCardWithTrend(statCards[5], displayShootings, last30Shootings, prev30Shootings);
  updateCardWithTrend(statCards[6], displayAssaults, last30Assaults, prev30Assaults);
  updateCardWithTrend(statCards[7], displayBurglaries, last30Burglaries, prev30Burglaries);
  updateCardWithTrend(statCards[8], displaySeizures, last30Seizures, prev30Seizures);
  updateCardWithTrend(statCards[9], displayKidnappings, last30Kidnappings, prev30Kidnappings);
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
    const top3PercentageEl = document.getElementById('top3Percentage');
    const mostDangerousRegionEl = document.getElementById('mostDangerousRegion');
    const mostDangerousRegionCountEl = document.getElementById('mostDangerousRegionCount');
    const safestRegionEl = document.getElementById('safestRegion');
    const safestRegionCountEl = document.getElementById('safestRegionCount');

    if (avgPerDayEl) avgPerDayEl.textContent = 'No data';
    if (victimsPerDayEl) victimsPerDayEl.textContent = '0 victims/day';
    if (mostDangerousDayEl) mostDangerousDayEl.textContent = 'N/A';
    if (busiestMonthEl) busiestMonthEl.textContent = 'N/A';
    if (top3PercentageEl) top3PercentageEl.textContent = 'N/A';
    if (mostDangerousRegionEl) mostDangerousRegionEl.textContent = 'N/A';
    if (mostDangerousRegionCountEl) mostDangerousRegionCountEl.textContent = '0 incidents';
    if (safestRegionEl) safestRegionEl.textContent = 'N/A';
    if (safestRegionCountEl) safestRegionCountEl.textContent = '0 incidents';
    return;
  }

  const dates = crimes.map(c => new Date(c.date)).filter(d => !isNaN(d.getTime()));
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

    return sum + 1; // Count as 1 if crime type doesn't use victim count
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

  // Area stats
  const areaCount = new Map<string, number>();
  crimes.forEach(crime => {
    const area = crime.area || 'Unknown';
    areaCount.set(area, (areaCount.get(area) || 0) + 1);
  });
  const areaArray = Array.from(areaCount.entries()).sort((a, b) => b[1] - a[1]);
  const top3Count = areaArray.slice(0, 3).reduce((sum, [_, count]) => sum + count, 0);
  const top3Percentage = ((top3Count / crimes.length) * 100).toFixed(0);

  // Find safest area (exclude "Unknown" and empty values)
  const validAreas = areaArray.filter(([area]) => area && area !== 'Unknown' && area.trim() !== '');
  const safestRegion = validAreas[validAreas.length - 1]?.[0] || 'N/A';
  const safestRegionCount = validAreas[validAreas.length - 1]?.[1] || 0;

  const mostDangerousRegion = areaArray[0]?.[0] || 'N/A';
  const mostDangerousRegionCount = areaArray[0]?.[1] || 0;

  // Update DOM using IDs
  const avgPerDayEl = document.getElementById('avgPerDay');
  const victimsPerDayEl = document.getElementById('victimsPerDay');
  const mostDangerousDayEl = document.getElementById('mostDangerousDay');
  const busiestMonthEl = document.getElementById('busiestMonth');
  const top3PercentageEl = document.getElementById('top3Percentage');
  const mostDangerousRegionEl = document.getElementById('mostDangerousRegion');
  const mostDangerousRegionCountEl = document.getElementById('mostDangerousRegionCount');
  const safestRegionEl = document.getElementById('safestRegion');
  const safestRegionCountEl = document.getElementById('safestRegionCount');

  if (avgPerDayEl) avgPerDayEl.textContent = `${avgPerDay} crimes/day`;
  if (victimsPerDayEl) victimsPerDayEl.textContent = `${victimsPerDay} victims/day`;
  if (mostDangerousDayEl) mostDangerousDayEl.textContent = mostDangerousDay;
  if (busiestMonthEl) busiestMonthEl.textContent = busiestMonth;
  if (top3PercentageEl) top3PercentageEl.textContent = `Top 3 areas: ${top3Percentage}%`;
  // Update area names and wrap parent <a> with correct href
  if (mostDangerousRegionEl) {
    mostDangerousRegionEl.textContent = mostDangerousRegion;
    const dangerousLink = mostDangerousRegionEl.closest('a');
    if (dangerousLink) dangerousLink.href = buildRoute.area(generateNameSlug(mostDangerousRegion));
  }
  if (mostDangerousRegionCountEl) mostDangerousRegionCountEl.textContent = `${mostDangerousRegionCount} incidents`;
  if (safestRegionEl) {
    safestRegionEl.textContent = safestRegion;
    const safestLink = safestRegionEl.closest('a');
    if (safestLink) safestLink.href = buildRoute.area(generateNameSlug(safestRegion));
  }
  if (safestRegionCountEl) safestRegionCountEl.textContent = `${safestRegionCount} incidents`;
}

/**
 * Helper function to render area name with tooltip if local name exists
 */
function renderAreaName(area: string): string {
  const areaAliases = (window as any).__areaAliases || {};
  const localName = areaAliases[area];

  // If no local name or it's the same as official name, show plain text
  if (!localName || localName.trim() === '' || localName.trim() === area.trim()) {
    return `<span>${area}</span>`;
  }

  // Show with tooltip trigger
  return `<span class="area-tooltip-trigger inline-block border-b-2 border-dotted border-slate-400 hover:border-rose-600 cursor-help transition-colors" data-area="${area}" data-local-name="${localName}">${area}</span>`;
}

/**
 * Update Top Areas card with filtered crime data
 */
export function updateTopRegions(crimes: Crime[]) {
  const container = document.getElementById('topRegionsContainer');
  if (!container) return;

  // If no crimes, show "No data" message
  if (crimes.length === 0) {
    container.innerHTML = '<div class="text-xs text-slate-400 text-center py-4">No data available</div>';
    return;
  }

  // Calculate top 10 areas
  const areaCount = crimes.reduce((acc, crime) => {
    const area = crime.area || 'Unknown';
    acc.set(area, (acc.get(area) || 0) + 1);
    return acc;
  }, new Map<string, number>());

  const topAreas = Array.from(areaCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Calculate risk levels for all areas
  const riskLevels = calculateAreaRiskLevels(crimes);

  // Update using ID selector (2-column grid with gradient risk bars)
  container.innerHTML = topAreas.map(([area, count]) => {
    const riskPercentage = riskLevels.get(area) || 0;
    const riskLevelText = getRiskLevelText(riskPercentage);
    const riskTextColor = getRiskTextColor(riskPercentage);
    const areaSlug = generateNameSlug(area);
    return `
    <a href="${buildRoute.area(areaSlug)}" class="flex flex-col gap-1 pb-3 border-b border-slate-200 dark:border-[hsl(0_0%_18%)] hover:bg-slate-50 dark:hover:bg-[hsl(0_0%_12%)] active:bg-slate-50 dark:active:bg-[hsl(0_0%_12%)] rounded-lg px-2 -mx-2 py-2 transition">
      <div class="flex justify-between items-center gap-2">
        <span class="text-xs text-slate-500 dark:text-[hsl(0_0%_55%)] truncate flex-1 underline decoration-slate-300 underline-offset-2">${renderAreaName(area)}</span>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <span class="px-1.5 py-0.5 min-h-[20px] flex items-center justify-center rounded-full bg-slate-200 dark:bg-[hsl(0_0%_20%)] text-slate-600 dark:text-[hsl(0_0%_55%)] text-xs font-medium">
            ${count}
          </span>
          <span class="text-xs text-slate-500 dark:text-[hsl(0_0%_55%)]">${count === 1 ? 'crime' : 'crimes'}</span>
          <svg class="w-3.5 h-3.5 text-slate-400 dark:text-[hsl(0_0%_50%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <!-- Gradient reveal bar -->
      <div class="relative w-full h-2 bg-slate-200 dark:bg-[hsl(0_0%_18%)] rounded-full overflow-hidden">
        <!-- Gradient bar wrapper (clips at percentage) -->
        <div class="absolute top-0 left-0 h-full overflow-hidden transition-all duration-300" style="width: ${riskPercentage}%">
          <!-- Gradient spans full container width, clipped by wrapper -->
          <div class="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-rose-600" style="width: ${riskPercentage > 0 ? (100 / riskPercentage) * 100 : 100}%"></div>
        </div>
      </div>
      <!-- Risk level text -->
      <span class="text-xs font-medium ${riskTextColor}">Risk: ${riskLevelText}</span>
    </a>
  `;
  }).join('');

  // Dispatch event to re-initialize tooltips
  window.dispatchEvent(new CustomEvent('topAreasRendered'));
}

/**
 * Get risk level text based on share of total weighted crime burden.
 *
 * Thresholds are calibrated for share-of-total normalization:
 * - With ~10 areas shown, average share ≈ 5-10%
 * - A dominant area (e.g. Port of Spain) typically holds 20-40%
 * - Smaller areas tail off below 5%
 */
function getRiskLevelText(percentage: number): string {
  if (percentage <= 3) {
    return 'Low';
  } else if (percentage <= 8) {
    return 'Medium';
  } else if (percentage <= 15) {
    return 'Concerning';
  } else if (percentage <= 25) {
    return 'High';
  } else if (percentage <= 40) {
    return 'Dangerous';
  } else {
    return 'Extremely Dangerous';
  }
}

/**
 * Get text color based on risk level (share-of-total thresholds)
 */
function getRiskTextColor(percentage: number): string {
  if (percentage <= 8) {
    return 'text-green-600';
  } else if (percentage <= 25) {
    return 'text-yellow-600';
  } else {
    return 'text-rose-600';
  }
}
