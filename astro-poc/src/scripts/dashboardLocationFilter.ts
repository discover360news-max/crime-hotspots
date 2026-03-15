/**
 * Dashboard Location Filter
 * Handles Region / Area cascading dropdowns, filter active state,
 * and applying location filters on top of the current year selection.
 */

import { updateStatsCards, updateQuickInsights, updateTopRegions } from './dashboardUpdates';
import { updateLeafletMap } from './leafletMap';

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyShimmerUpdate(
  shimmerId: string,
  targetId: string,
  updateFn: () => void
) {
  const shimmer = document.getElementById(shimmerId) as HTMLElement | null;
  const target = (targetId.startsWith('.')
    ? document.querySelector(targetId)
    : document.getElementById(targetId)) as HTMLElement | null;

  if (shimmer) { shimmer.style.opacity = '1'; shimmer.style.pointerEvents = ''; }
  if (target) target.style.opacity = '0';

  setTimeout(async () => {
    const t = Date.now();
    updateFn();
    await (window as any).hideShimmerWithMinTime(shimmer, target, t);
  }, 100);
}

// ── Area Cascade ──────────────────────────────────────────────────────────────

function updateDashboardAreaOptions(selectedRegion: string): void {
  const areaSelect = document.getElementById('areaFilter') as unknown as HTMLSelectElement | null;
  if (!areaSelect) return;

  const currentArea = areaSelect.value;
  areaSelect.innerHTML = '<option value="">All Areas</option>';

  const regionToAreas = (window as any).__dashboardRegionToAreas || {};
  const allAreas: string[] = (window as any).__dashboardAllAreas || [];
  const areasToShow: string[] = selectedRegion ? (regionToAreas[selectedRegion] || []) : allAreas;

  areasToShow.forEach(area => {
    const opt = document.createElement('option');
    opt.value = area;
    opt.textContent = area;
    if (area === currentArea && (!selectedRegion || (regionToAreas[selectedRegion] || []).includes(currentArea))) {
      opt.selected = true;
    }
    areaSelect.appendChild(opt);
  });
}

// ── Apply Filters ─────────────────────────────────────────────────────────────

function applyDashboardLocationFilter(): void {
  if (!(window as any).__crimesData) return;

  const yearEl = document.getElementById('yearFilter') as unknown as HTMLSelectElement | null;
  const regionEl = document.getElementById('regionFilter') as unknown as HTMLSelectElement | null;
  const areaEl = document.getElementById('areaFilter') as unknown as HTMLSelectElement | null;
  if (!yearEl || !regionEl || !areaEl) return;

  const selectedYear = yearEl.value;
  const selectedRegion = regionEl.value;
  const selectedArea = areaEl.value;

  let crimes = selectedYear === 'all' || !selectedYear
    ? (window as any).__crimesData
    : (window as any).__crimesData.filter((c: any) => String(c.year) === selectedYear);

  if (selectedRegion) crimes = crimes.filter((c: any) => c.region === selectedRegion);
  if (selectedArea) crimes = crimes.filter((c: any) => c.area === selectedArea);

  applyShimmerUpdate('statsShimmer', '.stats-scroll-container', () =>
    updateStatsCards(crimes, (window as any).__crimesData)
  );
  applyShimmerUpdate('insightsShimmer', 'insightsCards', () =>
    updateQuickInsights(crimes)
  );
  applyShimmerUpdate('topRegionsShimmer', 'topRegionsCard', () =>
    updateTopRegions(crimes)
  );
  applyShimmerUpdate('mapShimmer', 'leafletMap', () =>
    updateLeafletMap(crimes, '/trinidad/crime/')
  );
}

// ── Filter Active State ───────────────────────────────────────────────────────

function showDashboardFilterActive(): void {
  const btn = document.getElementById('filtersBtn') as HTMLElement | null;
  const clearBtn = document.getElementById('clearFiltersInline');
  if (btn) {
    btn.style.color = '#e11d48';
    btn.style.backgroundColor = 'color-mix(in srgb, #e11d48 12%, transparent)';
  }
  if (clearBtn) clearBtn.classList.remove('hidden');
}

function hideDashboardFilterActive(): void {
  const btn = document.getElementById('filtersBtn') as HTMLElement | null;
  const clearBtn = document.getElementById('clearFiltersInline');
  if (btn) { btn.style.color = ''; btn.style.backgroundColor = ''; }
  if (clearBtn) clearBtn.classList.add('hidden');
}

function checkDashboardFilterState(): void {
  const crimeTypeEl = document.getElementById('crimeTypeFilter') as unknown as HTMLSelectElement | null;
  const regionEl = document.getElementById('regionFilter') as unknown as HTMLSelectElement | null;
  const areaEl = document.getElementById('areaFilter') as unknown as HTMLSelectElement | null;
  const active =
    (crimeTypeEl ? crimeTypeEl.value !== '' : false) ||
    (regionEl ? regionEl.value !== '' : false) ||
    (areaEl ? areaEl.value !== '' : false);
  if (active) showDashboardFilterActive(); else hideDashboardFilterActive();
}

function clearDashboardFilters(): void {
  const yearEl = document.getElementById('yearFilter') as unknown as HTMLSelectElement | null;
  const crimeTypeEl = document.getElementById('crimeTypeFilter') as unknown as HTMLSelectElement | null;
  const regionEl = document.getElementById('regionFilter') as unknown as HTMLSelectElement | null;
  const areaEl = document.getElementById('areaFilter') as unknown as HTMLSelectElement | null;
  const defaultYear = (window as any).__dashboardDefaultYear || '';

  if (yearEl && yearEl.value !== defaultYear) {
    yearEl.value = defaultYear;
    yearEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (crimeTypeEl && crimeTypeEl.value !== '') {
    crimeTypeEl.value = '';
    crimeTypeEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (regionEl) regionEl.value = '';
  if (areaEl) areaEl.value = '';

  updateDashboardAreaOptions('');
  applyDashboardLocationFilter();
  hideDashboardFilterActive();
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initializeDashboardLocationFilter(): void {
  function waitForElements() {
    const regionEl = document.getElementById('regionFilter') as unknown as HTMLSelectElement | null;
    const areaEl = document.getElementById('areaFilter') as unknown as HTMLSelectElement | null;
    if (!regionEl || !areaEl) { setTimeout(waitForElements, 100); return; }

    regionEl.addEventListener('change', () => {
      updateDashboardAreaOptions(regionEl.value);
      applyDashboardLocationFilter();
      checkDashboardFilterState();
    });
    areaEl.addEventListener('change', () => {
      applyDashboardLocationFilter();
      checkDashboardFilterState();
    });

    const yearEl = document.getElementById('yearFilter') as unknown as HTMLSelectElement | null;
    const crimeTypeEl = document.getElementById('crimeTypeFilter') as unknown as HTMLSelectElement | null;
    if (yearEl) yearEl.addEventListener('change', checkDashboardFilterState);
    if (crimeTypeEl) crimeTypeEl.addEventListener('change', checkDashboardFilterState);

    const clearBtn = document.getElementById('clearFiltersInline');
    if (clearBtn) clearBtn.addEventListener('click', clearDashboardFilters);

    checkDashboardFilterState();
  }

  waitForElements();
}
