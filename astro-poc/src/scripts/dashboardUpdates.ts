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
 * Update stats cards with filtered crime data
 */
export function updateStatsCards(crimes: Crime[]) {
  // Update Total Incidents - target the value element inside the card
  const totalIncidentsCard = document.getElementById('totalIncidents');
  if (totalIncidentsCard) {
    const valueEl = totalIncidentsCard.querySelector('.text-3xl');
    if (valueEl) valueEl.textContent = crimes.length.toString();
  }

  // Update individual crime type cards
  const murders = crimes.filter(c => c.crimeType === 'Murder').length;
  const robberies = crimes.filter(c => c.crimeType === 'Robbery').length;
  const homeInvasions = crimes.filter(c => c.crimeType === 'Home Invasion').length;
  const thefts = crimes.filter(c => c.crimeType === 'Theft').length;
  const shootings = crimes.filter(c => c.crimeType === 'Shooting').length;
  const assaults = crimes.filter(c => c.crimeType === 'Assault').length;
  const burglaries = crimes.filter(c => c.crimeType === 'Burglary').length;
  const seizures = crimes.filter(c => c.crimeType === 'Seizures').length;
  const kidnappings = crimes.filter(c => c.crimeType === 'Kidnapping').length;

  // Find and update each stat card by index
  const statCards = document.querySelectorAll('.stat-card');
  const murdersEl = statCards[1]?.querySelector('.text-3xl');
  const robberiesEl = statCards[2]?.querySelector('.text-3xl');
  const homeInvasionsEl = statCards[3]?.querySelector('.text-3xl');
  const theftsEl = statCards[4]?.querySelector('.text-3xl');
  const shootingsEl = statCards[5]?.querySelector('.text-3xl');
  const assaultsEl = statCards[6]?.querySelector('.text-3xl');
  const burglariesEl = statCards[7]?.querySelector('.text-3xl');
  const seizuresEl = statCards[8]?.querySelector('.text-3xl');
  const kidnappingsEl = statCards[9]?.querySelector('.text-3xl');

  if (murdersEl) murdersEl.textContent = murders.toString();
  if (robberiesEl) robberiesEl.textContent = robberies.toString();
  if (homeInvasionsEl) homeInvasionsEl.textContent = homeInvasions.toString();
  if (theftsEl) theftsEl.textContent = thefts.toString();
  if (shootingsEl) shootingsEl.textContent = shootings.toString();
  if (assaultsEl) assaultsEl.textContent = assaults.toString();
  if (burglariesEl) burglariesEl.textContent = burglaries.toString();
  if (seizuresEl) seizuresEl.textContent = seizures.toString();
  if (kidnappingsEl) kidnappingsEl.textContent = kidnappings.toString();

  console.log('✅ Stats cards updated');
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

  // Update using ID selector
  const container = document.getElementById('topRegionsContainer');
  if (container) {
    container.innerHTML = topAreas.map(([area, count]) => `
      <div class="flex justify-between items-center pb-2 border-b border-slate-200 last:border-0">
        <span class="text-xs text-slate-500">${area}</span>
        <span class="px-3 py-1 min-h-[22px] flex items-center justify-center rounded-full bg-rose-600 text-white text-xs font-medium">
          ${count}
        </span>
      </div>
    `).join('');
  }

  console.log('✅ Top Areas updated');
}
