/**
 * Headlines page — filter, chip, and render logic
 * Reads from window.__hlData (set by define:vars in headlines.astro)
 *
 * HTML structure this script generates must mirror headlines.astro server render exactly.
 * NOTE: calculateVictimCount must stay in sync with the server-side version in headlines.astro
 */

import { usesVictimCount, crimeHasVictims } from '../config/crimeTypeConfig';

document.addEventListener('DOMContentLoaded', () => {
  const { allCrimes, regionToAreas, allAreas } = (window as any).__hlData || {};
  if (!allCrimes) return;

  // ── State ──────────────────────────────────────────────────────────────────
  let currentPage = 1;
  const perPage = 30;
  let filteredCrimes = [...allCrimes];
  let isFiltered = false;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function escapeHtml(str: any): string {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Maps crime type → left-bar hex + pill Tailwind classes
  // Must stay in sync with getTypeStyle() in headlines.astro frontmatter
  function getTypeStyle(crimeType: string): { hex: string; pillClass: string } {
    const t = (crimeType || '').toLowerCase();
    if (['murder', 'attempted murder'].some(s => t.includes(s)))
      return { hex: '#e11d48', pillClass: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' };
    if (['shooting', 'kidnapping', 'sexual assault', 'home invasion', 'arson', 'carjacking', 'robbery', 'domestic violence', 'extortion'].some(s => t.includes(s)))
      return { hex: '#f59e0b', pillClass: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' };
    return { hex: '#94a3b8', pillClass: 'text-slate-600 bg-slate-100 dark:bg-[hsl(0_0%_15%)] dark:text-[hsl(0_0%_60%)]' };
  }

  function calculateVictimCount(crimes: any[]): number {
    return crimes.reduce((total: number, crime: any) => {
      const primaryType = crime.primaryCrimeType || crime.crimeType;
      if (!crimeHasVictims(primaryType)) return total;
      if (usesVictimCount(primaryType)) return total + (crime.victimCount && crime.victimCount > 0 ? crime.victimCount : 1);
      return total + 1;
    }, 0);
  }

  function countCrimes(crimes: any[]): number {
    return crimes.reduce((sum: number, crime: any) => {
      let count = (crime.primaryCrimeType || crime.crimeType) ? 1 : 0;
      if (crime.relatedCrimeTypes) {
        const related = crime.relatedCrimeTypes.split(',').map((t: string) => t.trim()).filter((t: string) => t);
        count += related.length;
      }
      return sum + count;
    }, 0);
  }

  // ── HTML generators ────────────────────────────────────────────────────────

  function createCrimeCardHTML(crime: any): string {
    const crimeType = escapeHtml(crime.primaryCrimeType || crime.crimeType);
    const style = getTypeStyle(crime.primaryCrimeType || crime.crimeType);
    return `
      <a href="/trinidad/crime/${escapeHtml(crime.slug)}/"
        class="crime-card group flex items-start gap-3 py-3 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[hsl(0_0%_11%)] transition-colors block">
        <div class="w-1 rounded-full shrink-0 mt-0.5" style="background:${style.hex};min-height:36px;align-self:stretch"></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="${style.pillClass} inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">${crimeType}</span>
            <span class="text-[10px] text-slate-400 dark:text-[hsl(0_0%_45%)] truncate">${escapeHtml(crime.area)}</span>
          </div>
          <p class="text-sm font-medium text-slate-700 dark:text-[hsl(0_0%_80%)] group-hover:text-slate-900 dark:group-hover:text-white leading-snug line-clamp-2 transition-colors">${escapeHtml(crime.headline)}</p>
        </div>
        <svg class="w-3.5 h-3.5 text-slate-300 dark:text-[hsl(0_0%_30%)] group-hover:text-rose-500 transition-colors shrink-0 mt-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </a>`;
  }

  function createSeparatorAccordionHTML(date: string, crimes: any[], isExpanded: boolean): string {
    const incidentCount = crimes.length;
    const victimCount = calculateVictimCount(crimes);
    // Use year/month/day integers for timezone-safe display
    const c0 = crimes[0];
    const d = (c0?.year && c0?.month && c0?.day)
      ? new Date(c0.year, c0.month - 1, c0.day)
      : new Date(date);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const shortDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const crimeItems = crimes.map(createCrimeCardHTML).join('');
    const expandedClass = isExpanded ? ' is-open' : '';
    const chevronClass = isExpanded ? ' rotate-90' : '';

    return `
      <div class="date-accordion mb-4" data-date="${escapeHtml(date)}">
        <button
          class="da-header w-full text-left bg-slate-800 dark:bg-[hsl(0_0%_8%)] rounded-xl px-4 py-3 flex items-center justify-between group hover:bg-slate-700 dark:hover:bg-[hsl(0_0%_11%)] transition-colors"
          aria-expanded="${isExpanded}"
        >
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">${escapeHtml(weekday)}</p>
            <h3 class="text-white font-black text-base leading-tight">${escapeHtml(shortDate)}</h3>
            <p class="text-slate-400 text-xs mt-0.5">${incidentCount} ${incidentCount === 1 ? 'crime' : 'crimes'} · ${victimCount} ${victimCount === 1 ? 'victim' : 'victims'}</p>
          </div>
          <svg class="da-chevron w-4 h-4 text-slate-500 transition-transform${chevronClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <div class="da-content overflow-hidden${expandedClass}">
          <div class="space-y-1 pt-2">${crimeItems}</div>
        </div>
      </div>`;
  }

  // ── Chip management ────────────────────────────────────────────────────────
  function syncChips(activeType: string) {
    document.querySelectorAll<HTMLElement>('.chip-filter').forEach(chip => {
      chip.classList.toggle('chip-active', (chip.dataset.type ?? '') === activeType);
    });
  }

  document.querySelectorAll<HTMLElement>('.chip-filter').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.type ?? '';
      const select = document.getElementById('crimeTypeFilter') as HTMLSelectElement | null;
      if (select) select.value = type;
      syncChips(type);
      applyFilters();
      syncFilterIndicator();
    });
  });

  // ── Tray open/close ────────────────────────────────────────────────────────
  const filtersTray = document.getElementById('filtersTray')!;
  const filtersTrayContent = document.getElementById('filtersTrayContent')!;
  const filtersBackdrop = document.getElementById('filtersBackdrop')!;

  function openTray() {
    filtersTray.classList.remove('pointer-events-none');
    filtersBackdrop.classList.remove('pointer-events-none');
    setTimeout(() => {
      filtersBackdrop.classList.remove('opacity-0');
      filtersTrayContent.classList.remove('translate-x-full');
    }, 10);
  }

  function closeTray() {
    filtersBackdrop.classList.add('opacity-0');
    filtersTrayContent.classList.add('translate-x-full');
    setTimeout(() => {
      filtersTray.classList.add('pointer-events-none');
      filtersBackdrop.classList.add('pointer-events-none');
    }, 300);
  }

  document.getElementById('filtersBtn')?.addEventListener('click', openTray);
  document.getElementById('closeFiltersBtn')?.addEventListener('click', closeTray);
  filtersBackdrop?.addEventListener('click', closeTray);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !filtersTray.classList.contains('pointer-events-none')) closeTray();
  });

  // ── Cascading area dropdown ────────────────────────────────────────────────
  function updateAreaOptions(selectedRegion: string) {
    const areaSelect = document.getElementById('areaFilter') as HTMLSelectElement | null;
    if (!areaSelect) return;
    const currentArea = areaSelect.value;
    areaSelect.innerHTML = '<option value="">All Areas</option>';
    const areasToShow: string[] = selectedRegion ? (regionToAreas[selectedRegion] || []) : allAreas;
    areasToShow.forEach((area: string) => {
      const opt = document.createElement('option');
      opt.value = area;
      opt.textContent = area;
      if (area === currentArea && (!selectedRegion || (regionToAreas[selectedRegion] || []).includes(currentArea))) opt.selected = true;
      areaSelect.appendChild(opt);
    });
  }

  // ── Filtering ──────────────────────────────────────────────────────────────
  function applyFilters() {
    const dateFrom = (document.getElementById('dateFrom') as HTMLInputElement).value;
    const dateTo = (document.getElementById('dateTo') as HTMLInputElement).value;
    const crimeType = (document.getElementById('crimeTypeFilter') as HTMLSelectElement).value;
    const region = (document.getElementById('regionFilter') as HTMLSelectElement).value;
    const area = (document.getElementById('areaFilter') as HTMLSelectElement).value;

    isFiltered = !!(dateFrom || dateTo || crimeType || region || area);

    filteredCrimes = allCrimes.filter((crime: any) => {
      const crimeDate = new Date(crime.date);
      if (dateFrom && crimeDate < new Date(dateFrom)) return false;
      if (dateTo && crimeDate > new Date(dateTo)) return false;
      if (crimeType && crime.crimeType !== crimeType) return false;
      if (region && crime.region !== region) return false;
      if (area && crime.area !== area) return false;
      return true;
    });

    currentPage = 1;
    renderCrimes();
    updateResultsCount();
  }

  // ── Rendering ──────────────────────────────────────────────────────────────
  function renderCrimes() {
    const container = document.getElementById('crimeAccordions')!;
    const loadMoreEl = document.getElementById('loadMore')!;

    if (filteredCrimes.length === 0) {
      container.innerHTML = `
        <div class="rounded-xl p-8 text-center border border-slate-200 dark:border-[var(--ch-border-card)]">
          <svg class="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-[hsl(0_0%_25%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p class="text-sm mb-2 text-slate-500 dark:text-[var(--ch-text-faint)]">No crimes match your filters.</p>
          <p class="text-xs text-slate-400 dark:text-[hsl(0_0%_40%)]">Try broadening your date range, area, or crime type.</p>
        </div>`;
      loadMoreEl.style.display = 'none';
      return;
    }

    const crimes = filteredCrimes.slice(0, currentPage * perPage);

    if (isFiltered) {
      // Flat list when filters are active
      container.innerHTML = `<div class="space-y-1">${crimes.map(createCrimeCardHTML).join('')}</div>`;
    } else {
      // Separator accordion grouped by date
      const byDate = new Map<string, any[]>();
      crimes.forEach((crime: any) => {
        if (!byDate.has(crime.date)) byDate.set(crime.date, []);
        byDate.get(crime.date)!.push(crime);
      });
      const sortedDates = Array.from(byDate.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      container.innerHTML = sortedDates
        .map((date, index) => createSeparatorAccordionHTML(date, byDate.get(date)!, index < 3))
        .join('');
    }

    loadMoreEl.style.display = crimes.length >= filteredCrimes.length ? 'none' : 'inline-block';
  }

  // ── Results count ──────────────────────────────────────────────────────────
  function updateResultsCount() {
    const rowsShowing = Math.min(currentPage * perPage, filteredCrimes.length);
    const visibleCrimes = filteredCrimes.slice(0, rowsShowing);
    const showingEl = document.getElementById('resultsShowing');
    const totalEl = document.getElementById('resultsTotal');
    if (showingEl) showingEl.textContent = String(countCrimes(visibleCrimes));
    if (totalEl) totalEl.textContent = String(countCrimes(filteredCrimes));
  }

  // ── Filter indicator ───────────────────────────────────────────────────────
  const filtersBtnEl = document.getElementById('filtersBtn') as HTMLElement | null;
  const filtersBtnText = document.getElementById('filtersBtnText');
  const clearFiltersInline = document.getElementById('clearFiltersInline') as HTMLElement | null;
  const applyBtn = document.getElementById('applyFilters') as HTMLElement | null;

  function showFilterActive() {
    if (filtersBtnText) filtersBtnText.textContent = 'Filters Active ›';
    if (filtersBtnEl) { filtersBtnEl.style.borderColor = '#e11d48'; filtersBtnEl.style.color = '#e11d48'; filtersBtnEl.style.backgroundColor = 'color-mix(in srgb, #e11d48 10%, transparent)'; }
    if (clearFiltersInline) clearFiltersInline.classList.remove('hidden');
    if (applyBtn) { applyBtn.style.backgroundColor = '#e11d48'; applyBtn.style.color = '#fff'; applyBtn.style.borderColor = '#e11d48'; }
  }

  function hideFilterActive() {
    if (filtersBtnText) filtersBtnText.textContent = 'Filters ›';
    if (filtersBtnEl) { filtersBtnEl.style.borderColor = ''; filtersBtnEl.style.color = ''; filtersBtnEl.style.backgroundColor = ''; }
    if (clearFiltersInline) clearFiltersInline.classList.add('hidden');
    if (applyBtn) { applyBtn.style.backgroundColor = ''; applyBtn.style.color = ''; applyBtn.style.borderColor = ''; }
  }

  function syncFilterIndicator() {
    if (isFiltered) showFilterActive(); else hideFilterActive();
  }

  // ── Clear all filters ──────────────────────────────────────────────────────
  function clearAllFilters() {
    (document.getElementById('dateFrom') as HTMLInputElement).value = '';
    (document.getElementById('dateTo') as HTMLInputElement).value = '';
    (document.getElementById('crimeTypeFilter') as HTMLSelectElement).value = '';
    (document.getElementById('regionFilter') as HTMLSelectElement).value = '';
    updateAreaOptions('');
    (document.getElementById('areaFilter') as HTMLSelectElement).value = '';
    syncChips('');
    applyFilters();
    hideFilterActive();
  }

  // ── Event listeners ────────────────────────────────────────────────────────
  document.getElementById('dateFrom')?.addEventListener('change', () => { applyFilters(); syncFilterIndicator(); });
  document.getElementById('dateTo')?.addEventListener('change', () => { applyFilters(); syncFilterIndicator(); });
  document.getElementById('crimeTypeFilter')?.addEventListener('change', () => {
    const val = (document.getElementById('crimeTypeFilter') as HTMLSelectElement).value;
    syncChips(val);
    applyFilters();
    syncFilterIndicator();
  });
  document.getElementById('regionFilter')?.addEventListener('change', () => {
    updateAreaOptions((document.getElementById('regionFilter') as HTMLSelectElement).value);
    applyFilters();
    syncFilterIndicator();
  });
  document.getElementById('areaFilter')?.addEventListener('change', () => { applyFilters(); syncFilterIndicator(); });
  document.getElementById('clearFilters')?.addEventListener('click', clearAllFilters);
  clearFiltersInline?.addEventListener('click', clearAllFilters);
  applyBtn?.addEventListener('click', closeTray);

  document.getElementById('loadMore')?.addEventListener('click', () => {
    currentPage++;
    renderCrimes();
    updateResultsCount();
  });

  // ── Initial setup ──────────────────────────────────────────────────────────
  updateResultsCount();
  const loadMoreEl = document.getElementById('loadMore') as HTMLElement | null;
  if (loadMoreEl) loadMoreEl.style.display = filteredCrimes.length <= perPage ? 'none' : 'inline-block';
});
