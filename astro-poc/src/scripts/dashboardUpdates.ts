/**
 * Dashboard Update Functions
 * Handles updating dashboard components when filters change
 * Used by year filter and stat card filtering
 */

interface Crime {
  date: string;
  headline: string;
  crimeType: string;
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

  // Trend data: last 30 days (ending 3 days ago) from ALL crimes
  const last30DaysCrimes = allCrimes
    ? allCrimes.filter(c => {
        const crimeDate = new Date(c.date);
        return crimeDate >= thirtyThreeDaysAgo && crimeDate <= threeDaysAgo;
      })
    : [];

  // Trend data: previous 30 days (33-63 days ago) from ALL crimes
  const prev30DaysCrimes = allCrimes
    ? allCrimes.filter(c => {
        const crimeDate = new Date(c.date);
        return crimeDate >= sixtyThreeDaysAgo && crimeDate < thirtyThreeDaysAgo;
      })
    : [];

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
  const displayTotal = crimes.length;
  const displayMurders = crimes.filter(c => c.crimeType === 'Murder').length;
  const displayRobberies = crimes.filter(c => c.crimeType === 'Robbery').length;
  const displayHomeInvasions = crimes.filter(c => c.crimeType === 'Home Invasion').length;
  const displayThefts = crimes.filter(c => c.crimeType === 'Theft').length;
  const displayShootings = crimes.filter(c => c.crimeType === 'Shooting').length;
  const displayAssaults = crimes.filter(c => c.crimeType === 'Assault').length;
  const displayBurglaries = crimes.filter(c => c.crimeType === 'Burglary').length;
  const displaySeizures = crimes.filter(c => c.crimeType === 'Seizures').length;
  const displayKidnappings = crimes.filter(c => c.crimeType === 'Kidnapping').length;

  // Calculate trend counts (last 30 days from ALL crimes)
  const last30Total = last30DaysCrimes.length;
  const last30Murders = last30DaysCrimes.filter(c => c.crimeType === 'Murder').length;
  const last30Robberies = last30DaysCrimes.filter(c => c.crimeType === 'Robbery').length;
  const last30HomeInvasions = last30DaysCrimes.filter(c => c.crimeType === 'Home Invasion').length;
  const last30Thefts = last30DaysCrimes.filter(c => c.crimeType === 'Theft').length;
  const last30Shootings = last30DaysCrimes.filter(c => c.crimeType === 'Shooting').length;
  const last30Assaults = last30DaysCrimes.filter(c => c.crimeType === 'Assault').length;
  const last30Burglaries = last30DaysCrimes.filter(c => c.crimeType === 'Burglary').length;
  const last30Seizures = last30DaysCrimes.filter(c => c.crimeType === 'Seizures').length;
  const last30Kidnappings = last30DaysCrimes.filter(c => c.crimeType === 'Kidnapping').length;

  // Calculate previous 30-day counts
  const prev30Total = prev30DaysCrimes.length;
  const prev30Murders = prev30DaysCrimes.filter(c => c.crimeType === 'Murder').length;
  const prev30Robberies = prev30DaysCrimes.filter(c => c.crimeType === 'Robbery').length;
  const prev30HomeInvasions = prev30DaysCrimes.filter(c => c.crimeType === 'Home Invasion').length;
  const prev30Thefts = prev30DaysCrimes.filter(c => c.crimeType === 'Theft').length;
  const prev30Shootings = prev30DaysCrimes.filter(c => c.crimeType === 'Shooting').length;
  const prev30Assaults = prev30DaysCrimes.filter(c => c.crimeType === 'Assault').length;
  const prev30Burglaries = prev30DaysCrimes.filter(c => c.crimeType === 'Burglary').length;
  const prev30Seizures = prev30DaysCrimes.filter(c => c.crimeType === 'Seizures').length;
  const prev30Kidnappings = prev30DaysCrimes.filter(c => c.crimeType === 'Kidnapping').length;

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
  if (crimes.length === 0) return;

  const dates = crimes.map(c => new Date(c.date)).filter(d => !isNaN(d.getTime()));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const avgPerDay = (crimes.length / daysDiff).toFixed(1);

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
  const mostDangerousDayEl = document.getElementById('mostDangerousDay');
  const busiestMonthEl = document.getElementById('busiestMonth');
  const top3PercentageEl = document.getElementById('top3Percentage');
  const mostDangerousRegionEl = document.getElementById('mostDangerousRegion');
  const mostDangerousRegionCountEl = document.getElementById('mostDangerousRegionCount');
  const safestRegionEl = document.getElementById('safestRegion');
  const safestRegionCountEl = document.getElementById('safestRegionCount');

  if (avgPerDayEl) avgPerDayEl.textContent = `${avgPerDay} crimes/day`;
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
  const container = document.getElementById('topRegionsContainer');
  if (container) {
    container.innerHTML = topAreas.map(([area, count]) => `
      <div class="flex justify-between items-center gap-2 pb-2 border-b border-slate-200">
        <span class="text-xs text-slate-500 truncate flex-1">${area}</span>
        <span class="px-2 py-1 min-h-[22px] flex items-center justify-center rounded-full bg-rose-600 text-white text-xs font-medium flex-shrink-0">
          ${count}
        </span>
      </div>
    `).join('');
  }

  console.log('✅ Top Areas updated');
}
