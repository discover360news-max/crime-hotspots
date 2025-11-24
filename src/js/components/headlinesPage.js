// src/js/components/headlinesPage.js
// Reusable headlines page module - eliminates code duplication across countries

import { COUNTRIES } from '../data/countries.js';
import { initDashboardPanel } from './dashboardPanel.js';
import DOMPurify from 'dompurify';

const BATCH_SIZE = 10;

/**
 * Initializes a headlines page for a given country CSV
 * @param {string} csvUrl - Google Sheets CSV export URL for the country
 */
export function initHeadlinesPage(csvUrl) {
  // DOM refs
  const skeleton = document.getElementById("headlineSkeleton");
  const container = document.getElementById("headlinesContainer");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const areaSelect = document.getElementById("areaSelect");
  const crimeSelect = document.getElementById("crimeSelect");
  const clearFilterBtn = document.getElementById("clearFilterBtn");
  const resultsCount = document.getElementById("resultsCount");
  const dashboardButtonContainer = document.getElementById("dashboardButtonContainer");
  const modal = document.getElementById("headlineModal");
  const iframe = document.getElementById("headlineIframe");
  const modalPrev = document.getElementById("articlePrev");
  const modalNext = document.getElementById("articleNext");
  const modalClose = document.getElementById("articleClose");
  const modalOpenExternal = document.getElementById("modalViewExternal");

  // Dashboard panel (shared)
  const dashboard = initDashboardPanel();

  // state
  let allHeadlines = [];
  let filteredList = null;
  let visibleCount = 0;
  let currentList = null;
  let currentIndex = -1;
  let uniqueAreas = [];
  let activeAreaFilter = null;
  let activeCrimeFilter = null;

  // Retry logic state
  let retryCount = 0;
  const MAX_RETRIES = 3;

  // UTIL: parse date robustly
  function parseDate(s) {
    if (!s) return new Date(0);
    const d = new Date(s);
    if (!isNaN(d)) return d;
    const parts = s.trim().split(/[\/\-\.]/).map(p => p.trim());
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        const day = parseInt(parts[0],10), month = parseInt(parts[1],10)-1, year = parseInt(parts[2],10);
        const dt = new Date(year, month, day);
        if (!isNaN(dt)) return dt;
      }
    }
    return new Date(s);
  }

  // UTIL: sanitize with DOMPurify
  function sanitizeText(s) {
    if (!s) return "";
    return DOMPurify.sanitize(String(s), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  function sanitizeAttr(s) {
    if (!s) return "";
    return DOMPurify.sanitize(String(s), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }

  // skeleton show/hide
  function showSkeleton(show = true) {
    if (!skeleton) return;
    skeleton.classList.toggle("hidden", !show);
  }

  // Show user error message
  function showUserError(message) {
    if (!container) return;
    container.innerHTML = `
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="max-w-md mx-auto p-6 bg-rose-50 border border-rose-200 rounded-lg text-center">
          <svg class="w-12 h-12 mx-auto text-rose-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-rose-700 font-medium mb-4">${sanitizeText(message)}</p>
          <button onclick="location.reload()" class="px-6 py-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }

  // Show retry message
  function showRetryMessage(message) {
    if (!container) return;
    container.innerHTML = `
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="max-w-md mx-auto p-6 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <svg class="w-12 h-12 mx-auto text-amber-500 mb-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p class="text-amber-700 font-medium">${sanitizeText(message)}</p>
        </div>
      </div>
    `;
  }

  // get current page slug
  function pageHeadlineSlug() {
    const path = window.location.pathname.split("/").pop() || "";
    const match = path.match(/^headlines-(.+?)(?:\.html)?$/i);
    return match ? match[1].toLowerCase() : null;
  }

  // find country config by slug
  function countryForCurrentPage() {
    const slug = pageHeadlineSlug();
    if (!slug) return null;

    const country = COUNTRIES.find(c => {
      const countrySlug = (c.headlinesSlug || "").toLowerCase();

      if (countrySlug === slug) return true;
      if (countrySlug.includes(slug)) return true;
      if (slug.includes(countrySlug)) return true;

      return false;
    });

    if (!country) {
      console.error(`Country lookup failed for slug: "${slug}"`);
    }

    return country || null;
  }

  // format date badge
  function formatDate(d) {
    if (!d) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  // create a card
  function createCard(item, indexInCurrentList) {
    const hasUrl = item.URL && item.URL.trim().length > 0;
    const card = document.createElement("div");

    // Enhanced styling with better click affordance
    if (hasUrl) {
      card.className = "bg-white rounded-2xl shadow-md p-5 w-full text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-rose-200 group";
      card.setAttribute("data-has-url", "true");
    } else {
      card.className = "bg-white rounded-2xl shadow-md p-5 w-full text-left";
    }

    card.setAttribute("data-index", indexInCurrentList);

    const dateBadge = `<span class="text-xs text-slate-500">${formatDate(item.Date)}</span>`;

    // Crime tag with icon
    const crimeTag = `<button class="text-xs font-semibold text-rose-600 hover:text-rose-700 uppercase hover:underline crimeLink flex items-center gap-1" data-crime="${sanitizeAttr(item["Crime Type"]||'')}">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
      ${sanitizeText(item["Crime Type"]||"")}
    </button>`;

    const address = `<p class="text-xs text-slate-500 mb-2">${sanitizeText(item["Street Address"]||"")}</p>`;

    // Area button with location icon
    const areaBtn = `<button class="text-xs text-rose-600 hover:text-rose-700 underline areaLink flex items-center gap-1" data-area="${sanitizeAttr(item.Area||'')}">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      ${sanitizeText(item.Area||'')}
    </button>`;

    const headlineHtml = `<div class="mb-2 text-sm text-slate-900 line-clamp-2">${sanitizeText(item.Headline||'')}</div>`;

    // Read article hint (only for clickable cards)
    const readHint = hasUrl ? `
      <div class="mt-3 pt-3 border-t border-slate-100 text-xs text-rose-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span>Read article</span>
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    ` : '';

    card.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        ${dateBadge}
        ${crimeTag}
      </div>
      ${headlineHtml}
      ${address}
      ${areaBtn}
      ${readHint}
    `;

    return card;
  }

  // render next batch
  function renderBatch() {
    currentList = filteredList || allHeadlines;
    if (!currentList) return;
    const start = visibleCount;
    const next = currentList.slice(start, start + BATCH_SIZE);
    next.forEach((item, idx) => {
      const indexInList = start + idx;
      const card = createCard(item, indexInList);
      container.appendChild(card);
    });
    visibleCount += next.length;
    if (visibleCount >= currentList.length) loadMoreBtn.classList.add("hidden"); else loadMoreBtn.classList.remove("hidden");
    updateResultsCount();
  }

  // apply combined filters
  function applyFilters() {
    if (!activeAreaFilter && !activeCrimeFilter) {
      filteredList = null;
      visibleCount = 0;
      container.innerHTML = "";
      renderBatch();
      clearFilterBtn.classList.add("hidden");
      updateFilterDisplay();
      updateResultsCount();
      return;
    }

    filteredList = allHeadlines.filter(h => {
      const areaMatch = !activeAreaFilter || (h.Area||"").toLowerCase() === activeAreaFilter.toLowerCase();
      const crimeMatch = !activeCrimeFilter || (h["Crime Type"]||"").toLowerCase() === activeCrimeFilter.toLowerCase();
      return areaMatch && crimeMatch;
    });

    visibleCount = 0;
    container.innerHTML = "";
    renderBatch();
    clearFilterBtn.classList.remove("hidden");
    updateFilterDisplay();
    updateResultsCount();
  }

  // update filter display with visual badges
  function updateFilterDisplay() {
    const activeFilterBox = document.getElementById("activeFilterBox");
    if (!activeFilterBox) return;

    if (!activeAreaFilter && !activeCrimeFilter) {
      activeFilterBox.classList.add("hidden");
      return;
    }

    const badges = [];
    if (activeAreaFilter) {
      badges.push(`<span class="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
        Area: <strong>${sanitizeText(activeAreaFilter)}</strong>
      </span>`);
    }
    if (activeCrimeFilter) {
      badges.push(`<span class="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
        Crime: <strong>${sanitizeText(activeCrimeFilter)}</strong>
      </span>`);
    }

    activeFilterBox.innerHTML = badges.join('');
    activeFilterBox.classList.remove("hidden");
  }

  // update results count display
  function updateResultsCount() {
    if (!resultsCount) return;

    const currentListForCount = filteredList || allHeadlines;
    const total = allHeadlines.length;
    const shown = currentListForCount.length;

    if (filteredList) {
      resultsCount.textContent = `Showing ${shown} of ${total} crimes`;
    } else {
      resultsCount.textContent = `${total} crimes`;
    }
  }

  // URL validation
  function isValidHttpUrl(urlString) {
    if (!urlString || typeof urlString !== 'string') return false;

    try {
      const url = new URL(urlString);

      if (!['http:', 'https:'].includes(url.protocol)) {
        console.warn('Blocked non-HTTP(S) URL protocol:', url.protocol);
        return false;
      }

      if (url.hostname === 'localhost' ||
          url.hostname === '127.0.0.1' ||
          url.hostname.match(/^192\.168\./) ||
          url.hostname.match(/^10\./) ||
          url.hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
        console.warn('Blocked private/localhost URL:', url.hostname);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  // modal logic
  function openModalForIndex(indexInList) {
    currentList = filteredList || allHeadlines;
    if (!currentList || indexInList < 0 || indexInList >= currentList.length) return;
    currentIndex = indexInList;
    const item = currentList[currentIndex];
    if (!item) return;

    const rawUrl = item.URL?.trim();
    if (rawUrl && isValidHttpUrl(rawUrl)) {
      try {
        const url = new URL(rawUrl);
        const isSameDomain = url.hostname === window.location.hostname;

        if (!isSameDomain) {
          window.open(url.href, "_blank", "noopener,noreferrer");
          return;
        }

        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        iframe.classList.remove("opacity-100");
        iframe.classList.add("opacity-0");

        iframe.src = url.href;
        modalOpenExternal.href = url.href;
        modalOpenExternal.rel = "noopener noreferrer nofollow";
        modalOpenExternal.classList.remove("hidden");
      } catch (e) {
        console.warn("URL processing error:", rawUrl, e);
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
        iframe.src = "about:blank";
        modalOpenExternal.classList.add("hidden");
      }
    } else {
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";

      if (rawUrl) {
        console.warn("Blocked unsafe URL:", rawUrl);
      }
      iframe.src = "about:blank";
      modalOpenExternal.classList.add("hidden");
    }

    requestAnimationFrame(() => {
      modal.classList.remove("translate-y-full", "opacity-0");
      modal.classList.add("translate-y-0", "opacity-100");
    });

    iframe.onload = () => {
      setTimeout(() => {
        iframe.classList.remove("opacity-0");
        iframe.classList.add("opacity-100");
      }, 250);
    };

    updateModalNavButtons();
  }

  // modal navigation
  function updateModalNavButtons() {
    currentList = filteredList || allHeadlines;
    modalPrev.disabled = currentIndex <= 0;
    modalNext.disabled = currentIndex >= (currentList.length - 1);
    modalPrev.classList.toggle("opacity-50", modalPrev.disabled);
    modalNext.classList.toggle("opacity-50", modalNext.disabled);
  }

  function showPrev() {
    if (currentIndex > 0) openModalForIndex(currentIndex - 1);
  }

  function showNext() {
    currentList = filteredList || allHeadlines;
    if (currentIndex < currentList.length - 1) openModalForIndex(currentIndex + 1);
  }

  function closeModal() {
    modal.classList.remove("translate-y-0", "opacity-100");
    modal.classList.add("translate-y-full", "opacity-0");
    setTimeout(() => {
      modal.classList.add("hidden");
      iframe.src = "about:blank";
      document.body.style.overflow = "";
    }, 400);
  }

  // populate area dropdown
  function populateAreaSelect() {
    if (!areaSelect) return;
    areaSelect.innerHTML = `<option value="">All Areas</option>`;
    uniqueAreas.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a;
      opt.textContent = a;
      areaSelect.appendChild(opt);
    });
  }

  // Setup dashboard button
  function setupDashboardLink() {
    const country = countryForCurrentPage();

    if (!country) {
      console.error("Dashboard link setup failed: Could not find country data for this page slug.");
      return;
    }

    if (!country.dashboard || !dashboardButtonContainer) {
      console.warn("Dashboard button skipped: Missing dashboard URL or container element.");
      return;
    }

    const button = document.createElement('button');
    button.id = 'viewDashboardMain';
    button.className = 'inline-block px-6 py-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition font-medium shadow-md';
    button.textContent = `View ${country.name} Dashboard`;
    button.setAttribute('aria-label', `View ${country.name} Dashboard`);

    button.addEventListener('click', () => {
      dashboard.loadDashboard(country.dashboard, country.name, country.headlinesSlug);
    });

    dashboardButtonContainer.appendChild(button);
  }

  // CSV loading with retry
  function loadCSVWithRetry() {
    fetch(csvUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
      headers: {
        'Accept': 'text/csv, text/plain'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !(contentType.includes('text/csv') || contentType.includes('text/plain'))) {
        console.warn('Unexpected content type:', contentType);
      }

      return response.text();
    })
    .then(csvText => {
      if (!csvText || csvText.length < 10) {
        throw new Error('Empty or invalid CSV response');
      }

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data || [];

          if (!rows || rows.length === 0) {
            showSkeleton(false);
            showUserError('No headlines available at this time. Please try again later.');
            return;
          }

          const requiredCols = ['Date', 'Headline', 'Crime Type', 'Area'];
          const firstRow = rows[0];
          const missingCols = requiredCols.filter(col => !(col in firstRow));

          if (missingCols.length > 0) {
            showSkeleton(false);
            showUserError(`Data error: Missing required columns (${missingCols.join(', ')}). Please contact support.`);
            return;
          }

          retryCount = 0;

          allHeadlines = rows
            .map(r => ({
              Date: parseDate((r["Date"] || "").trim()),
              Headline: (r["Headline"] || "").trim(),
              "Crime Type": (r["Crime Type"] || "").trim(),
              "Street Address": (r["Street Address"] || "").trim(),
              Area: (r["Area"] || "").trim(),
              URL: (r["URL"] || "").trim()
            }))
            .filter(r => r.Headline);

          if (allHeadlines.length === 0) {
            showSkeleton(false);
            showUserError('No valid headlines found. Please try again later.');
            return;
          }

          allHeadlines.sort((a,b) => b.Date - a.Date);

          uniqueAreas = [...new Set(allHeadlines.map(h => (h.Area||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));

          populateAreaSelect();

          container.innerHTML = "";
          visibleCount = 0;
          filteredList = null;
          renderBatch();

          showSkeleton(false);
        },
        error: (err) => {
          console.error("CSV parse error:", err);
          showSkeleton(false);

          if (retryCount < MAX_RETRIES) {
            retryCount++;
            showRetryMessage(`Loading failed. Retrying (${retryCount}/${MAX_RETRIES})...`);
            setTimeout(() => loadCSVWithRetry(), 2000 * retryCount);
          } else {
            showUserError('Unable to load headlines after multiple attempts. Please refresh the page or try again later.');
          }
        }
      });
    })
    .catch(err => {
      console.error("CSV fetch error:", err);
      showSkeleton(false);

      if (retryCount < MAX_RETRIES) {
        retryCount++;
        showRetryMessage(`Loading failed. Retrying (${retryCount}/${MAX_RETRIES})...`);
        setTimeout(() => loadCSVWithRetry(), 2000 * retryCount);
      } else {
        showUserError('Unable to load headlines after multiple attempts. Please refresh the page or try again later.');
      }
    });
  }

  // Initialize
  function init() {
    showSkeleton(true);
    if (typeof Papa === "undefined") {
      console.error("PapaParse not loaded.");
      showSkeleton(false);
      showUserError("Failed to load required libraries. Please refresh the page.");
      return;
    }

    loadCSVWithRetry();
  }

  // Event delegation for cards
  if (container) {
    container.addEventListener("click", (e) => {
      const card = e.target.closest('[data-index]');
      if (card && card.hasAttribute('data-has-url')) {
        const areaLink = e.target.closest('.areaLink');
        const crimeLink = e.target.closest('.crimeLink');

        if (areaLink) {
          e.stopPropagation();
          const area = areaLink.dataset.area;
          activeAreaFilter = area;
          if (areaSelect) {
            areaSelect.value = area;
          }
          applyFilters();
        } else if (crimeLink) {
          e.stopPropagation();
          const crime = crimeLink.dataset.crime;
          activeCrimeFilter = crime;
          if (crimeSelect) {
            crimeSelect.value = crime;
          }
          applyFilters();
        } else {
          const index = parseInt(card.dataset.index);
          if (!isNaN(index)) {
            openModalForIndex(index);
          }
        }
      }
    });
  }

  // Event listeners
  if (loadMoreBtn) loadMoreBtn.addEventListener("click", renderBatch);
  if (modalPrev) modalPrev.addEventListener("click", showPrev);
  if (modalNext) modalNext.addEventListener("click", showNext);
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (areaSelect) areaSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    activeAreaFilter = val || null;
    applyFilters();
  });
  if (crimeSelect) crimeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    activeCrimeFilter = val || null;
    applyFilters();
  });
  if (clearFilterBtn) clearFilterBtn.addEventListener("click", () => {
    if (areaSelect) areaSelect.value = "";
    if (crimeSelect) crimeSelect.value = "";
    activeAreaFilter = null;
    activeCrimeFilter = null;
    applyFilters();
  });

  // Initialize on DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    init();
    setupDashboardLink();
  });
}
