/**
 * Dashboard Update Functions
 * Handles updating dashboard components when filters change
 * Used by year filter and stat card filtering
 */

import { usesVictimCount } from '../config/crimeTypeConfig';

interface Crime {
  date: string;
  headline: string;
  crimeType: string;
  primaryCrimeType?: string; // New 2026 field
  relatedCrimeTypes?: string; // New 2026 field (comma-separated)
  victimCount?: number; // New 2026 field (applies to primary crime only)
  street: string;
  area: string;
  region: string;
  url: string;
  source: string;
  latitude: number;
  longitude: number;
  summary: string;
  slug: string;
  dateObj: Date;
  year: number;
  month: number;
  day: number;
}

/**
 * Count crimes by type across both primaryCrimeType and relatedCrimeTypes
 *
 * VICTIM COUNT RULES:
 * - Only applies to PRIMARY crime type (not related crimes)
 * - Only for crime types configured with useVictimCount=true
 * - Related crimes ALWAYS count as +1 (incident-based)
 *
 * Example:
 * - Primary: Murder, victimCount: 3, Related: [Shooting]
 * - Result: Murder +3, Shooting +1
 */
function countCrimeType(crimeData: Crime[], targetType: string): number {
  let totalCount = 0;
  let primaryCount = 0;
  let legacyCount = 0;
  let relatedCount = 0;

  crimeData.forEach(crime => {
    // Check if primaryCrimeType matches
    if (crime.primaryCrimeType === targetType) {
      // Apply victim count ONLY if this crime type uses it AND it's the primary crime
      if (usesVictimCount(targetType) && crime.victimCount && crime.victimCount > 1) {
        totalCount += crime.victimCount;
        primaryCount += crime.victimCount;
      } else {
        totalCount += 1;
        primaryCount += 1;
      }
      return;
    }

    // Check if crimeType matches (fallback for old data - always count as 1)
    if (crime.crimeType === targetType) {
      totalCount += 1;
      legacyCount += 1;
      return;
    }

    // Check if relatedCrimeTypes contains the target type (always count as 1)
    if (crime.relatedCrimeTypes) {
      const relatedTypes = crime.relatedCrimeTypes.split(',').map(t => t.trim());
      if (relatedTypes.includes(targetType)) {
        totalCount += 1;
        relatedCount += 1;
        console.log(`🔍 Found ${targetType} in relatedCrimeTypes:`, {
          headline: crime.headline,
          primaryCrimeType: crime.primaryCrimeType,
          relatedCrimeTypes: crime.relatedCrimeTypes,
          parsed: relatedTypes
        });
      }
    }
  });

  if (relatedCount > 0 || primaryCount > 0) {
    console.log(`📊 ${targetType} count breakdown: Primary=${primaryCount}, Legacy=${legacyCount}, Related=${relatedCount}, Total=${totalCount}`);
  }

  return totalCount;
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

  // Trend data: last 30 days (ending 3 days ago) from FILTERED crimes
  // This ensures trends match the active year filter
  const last30DaysCrimes = crimes.filter(c => {
    const crimeDate = new Date(c.date);
    return crimeDate >= thirtyThreeDaysAgo && crimeDate <= threeDaysAgo;
  });

  // Trend data: previous 30 days (33-63 days ago) from FILTERED crimes
  const prev30DaysCrimes = crimes.filter(c => {
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

  console.log('✅ Stats cards updated with trends');
}

/**
 * Update Quick Insights card with filtered crime data
 */
export function updateQuickInsights(crimes: Crime[]) {
  // If no crimes, show "No data" message
  if (crimes.length === 0) {
    const avgPerDayEl = document.getElementById('avgPerDay');
    const totalVictimsEl = document.getElementById('totalVictims');
    const mostDangerousDayEl = document.getElementById('mostDangerousDay');
    const busiestMonthEl = document.getElementById('busiestMonth');
    const top3PercentageEl = document.getElementById('top3Percentage');
    const mostDangerousRegionEl = document.getElementById('mostDangerousRegion');
    const mostDangerousRegionCountEl = document.getElementById('mostDangerousRegionCount');
    const safestRegionEl = document.getElementById('safestRegion');
    const safestRegionCountEl = document.getElementById('safestRegionCount');

    if (avgPerDayEl) avgPerDayEl.textContent = 'No data';
    if (totalVictimsEl) totalVictimsEl.textContent = '0 total victims';
    if (mostDangerousDayEl) mostDangerousDayEl.textContent = 'N/A';
    if (busiestMonthEl) busiestMonthEl.textContent = 'N/A';
    if (top3PercentageEl) top3PercentageEl.textContent = 'N/A';
    if (mostDangerousRegionEl) mostDangerousRegionEl.textContent = 'N/A';
    if (mostDangerousRegionCountEl) mostDangerousRegionCountEl.textContent = '0 incidents';
    if (safestRegionEl) safestRegionEl.textContent = 'N/A';
    if (safestRegionCountEl) safestRegionCountEl.textContent = '0 incidents';

    console.log('✅ Quick Insights cleared (no data)');
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
  const totalVictimsEl = document.getElementById('totalVictims');
  const mostDangerousDayEl = document.getElementById('mostDangerousDay');
  const busiestMonthEl = document.getElementById('busiestMonth');
  const top3PercentageEl = document.getElementById('top3Percentage');
  const mostDangerousRegionEl = document.getElementById('mostDangerousRegion');
  const mostDangerousRegionCountEl = document.getElementById('mostDangerousRegionCount');
  const safestRegionEl = document.getElementById('safestRegion');
  const safestRegionCountEl = document.getElementById('safestRegionCount');

  if (avgPerDayEl) avgPerDayEl.textContent = `${avgPerDay} crimes/day`;
  if (totalVictimsEl) totalVictimsEl.textContent = `${totalVictims} total victims`;
  if (mostDangerousDayEl) mostDangerousDayEl.textContent = mostDangerousDay;
  if (busiestMonthEl) busiestMonthEl.textContent = busiestMonth;
  if (top3PercentageEl) top3PercentageEl.textContent = `Top 3 areas: ${top3Percentage}%`;
  if (mostDangerousRegionEl) mostDangerousRegionEl.textContent = mostDangerousRegion;
  if (mostDangerousRegionCountEl) mostDangerousRegionCountEl.textContent = `${mostDangerousRegionCount} incidents`;
  if (safestRegionEl) safestRegionEl.textContent = safestRegion;
  if (safestRegionCountEl) safestRegionCountEl.textContent = `${safestRegionCount} incidents`;

  console.log('✅ Quick Insights updated');
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
    console.log('✅ Top Areas cleared (no data)');
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

  // Update using ID selector (2-column grid)
  container.innerHTML = topAreas.map(([area, count]) => `
    <div class="flex justify-between items-center gap-2 pb-2 border-b border-slate-200">
      <span class="text-xs text-slate-500 truncate flex-1">${area}</span>
      <span class="px-2 py-1 min-h-[22px] flex items-center justify-center rounded-full bg-rose-600 text-white text-xs font-medium flex-shrink-0">
        ${count}
      </span>
    </div>
  `).join('');

  console.log('✅ Top Areas updated');
}
