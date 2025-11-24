// src/js/dashboardGuyana.js
// Dedicated Guyana dashboard page with interactive regional map

import { createGuyanaMap, GUYANA_REGIONS } from './components/guyanaMap.js';

// DOM Elements
const mapContainer = document.getElementById('guyanaMapContainer');
const iframe = document.getElementById('dashboardIframe');
const loader = document.getElementById('dashboardLoader');
const errorBox = document.getElementById('dashboardError');
const subtitle = document.getElementById('dashboardSubtitle');

// Base Looker Studio URL (without filters)
const BASE_DASHBOARD_URL = 'https://lookerstudio.google.com/embed/reporting/da8269b7-4987-4bbc-9206-ca5406b8ef97/page/LyPbF';

// Track current state
let currentRegion = null;
let guyanaMapInstance = null;

/**
 * Initialize the page
 */
function init() {
  // Create and inject the Guyana map
  if (mapContainer) {
    guyanaMapInstance = createGuyanaMap(handleRegionClick);
    mapContainer.innerHTML = '';
    mapContainer.appendChild(guyanaMapInstance.element);
  }

  // Set up iframe load handlers
  setupIframeHandlers();

  // Load the dashboard
  loadDashboard();
}

/**
 * Handle region clicks from the map
 */
function handleRegionClick(regionNumber, regionName) {
  if (regionNumber) {
    // Region selected - filter dashboard
    currentRegion = { number: regionNumber, name: regionName };
    filterDashboardByRegion(regionName);
    updateSubtitle(`Region ${regionNumber} - ${regionName}`);
  } else {
    // Clear filter - show all regions
    currentRegion = null;
    loadDashboard();
    updateSubtitle('Nationwide data');
  }
}

/**
 * Load the base dashboard (no filters)
 */
function loadDashboard() {
  if (!iframe) return;

  showLoader();
  iframe.src = BASE_DASHBOARD_URL;
}

/**
 * Filter dashboard by region
 */
function filterDashboardByRegion(regionName) {
  if (!iframe) return;

  try {
    showLoader();

    // Parse base URL
    const url = new URL(BASE_DASHBOARD_URL);

    // Looker Studio filtering attempts (try multiple formats)
    // Format 1: params object
    url.searchParams.set('params', JSON.stringify({
      filter_Area: regionName
    }));

    // Format 2: Alternative filter syntax (commented out - uncomment if needed)
    // url.searchParams.set('filter', `Area=${encodeURIComponent(regionName)}`);

    // Update iframe
    iframe.src = url.toString();

    console.log(`Filtering dashboard by region: ${regionName}`);
    console.log(`Filtered URL: ${url.toString()}`);
  } catch (e) {
    console.error('Error filtering dashboard:', e);
    showError();
  }
}

/**
 * Update dashboard subtitle
 */
function updateSubtitle(text) {
  if (subtitle) {
    subtitle.textContent = text;
  }
}

/**
 * Show loading state
 */
function showLoader() {
  if (loader) {
    loader.classList.remove('hidden');
  }
  if (errorBox) {
    errorBox.classList.add('hidden');
  }
}

/**
 * Hide loading state
 */
function hideLoader() {
  if (loader) {
    // Add slight delay so users see the loader briefly
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 800);
  }
}

/**
 * Show error state
 */
function showError() {
  if (loader) {
    loader.classList.add('hidden');
  }
  if (errorBox) {
    errorBox.classList.remove('hidden');
  }
}

/**
 * Setup iframe event handlers
 */
function setupIframeHandlers() {
  if (!iframe) return;

  // iframe loaded successfully
  iframe.addEventListener('load', () => {
    // Ignore onload for about:blank
    if (iframe.src === 'about:blank' || iframe.src === '') {
      return;
    }

    hideLoader();
    console.log('Dashboard loaded successfully');
  });

  // iframe error
  iframe.addEventListener('error', () => {
    showError();
    console.error('Dashboard failed to load');
  });

  // Fallback timeout (Looker Studio can be slow)
  setTimeout(() => {
    // If still loading after 15 seconds, assume success
    // (Looker Studio often doesn't trigger onload properly)
    hideLoader();
  }, 15000);
}

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
  // Press 'R' to reset filters
  if (e.key === 'r' || e.key === 'R') {
    if (currentRegion && guyanaMapInstance) {
      e.preventDefault();
      guyanaMapInstance.clearFilter();
      handleRegionClick(null, null);
    }
  }
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
