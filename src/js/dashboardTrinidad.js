// src/js/dashboardTrinidad.js
// Dedicated Trinidad & Tobago dashboard page with custom data widgets

import { createTrinidadMap, TRINIDAD_REGIONS } from './components/trinidadMap.js';
import { fetchTrinidadData, calculateStats } from './services/trinidadDataService.js';
import {
  createMetricsCards,
  createPieChart,
  createLast7DaysChart,
  createTopLocationsChart,
  createLoadingState,
  createErrorState,
  destroyAllCharts
} from './components/dashboardWidgets.js';
import { createTrinidadLeafletMap, getLeafletMapStyles } from './components/trinidadLeafletMap.js';

// DOM Elements
const mapContainer = document.getElementById('trinidadMapContainer');
const widgetsContainer = document.getElementById('dashboardWidgets');
const subtitle = document.getElementById('dashboardSubtitle');
const mobileRegionButton = document.getElementById('mobileRegionButton');
const regionTray = document.getElementById('regionTray');
const trayOverlay = document.getElementById('trayOverlay');
const closeTrayButton = document.getElementById('closeTrayButton');
const mobileMapContainer = document.getElementById('mobileMapContainer');
const resetFilterButton = document.getElementById('resetFilterButton');
const resetFilterButtonTray = document.getElementById('resetFilterButtonTray');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const applyDateFilterButton = document.getElementById('applyDateFilter');
const clearDateFilterButton = document.getElementById('clearDateFilter');

// Track current state
let currentRegion = null;
let currentDateRange = null;
let trinidadMapInstance = null;
let mobileTrinidadMapInstance = null;
let leafletMapInstance = null;
let allData = null;
let isUpdatingRegion = false; // Prevent infinite loops

/**
 * Initialize the page
 */
async function init() {
  try {
    // Inject Leaflet map styles
    injectLeafletStyles();

    // Create and inject the Trinidad map (desktop only)
    if (mapContainer) {
      try {
        trinidadMapInstance = createTrinidadMap(handleRegionClick);

        // Hide skeleton and show map
        const mapSkeleton = document.getElementById('mapSkeleton');
        if (mapSkeleton) {
          mapSkeleton.remove();
        }

        mapContainer.appendChild(trinidadMapInstance.element);
      } catch (error) {
        console.error('Error creating desktop map:', error);
      }
    }

    // Initialize mobile region selector tray
    initializeMobileTray();

    // Initialize date filter controls
    initializeDateFilter();

    // Load dashboard data and widgets
    await loadDashboard();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    // Show error to user
    if (widgetsContainer) {
      widgetsContainer.innerHTML = '<div class="p-6 text-center text-red-600">Failed to initialize dashboard. Please refresh the page.</div>';
    }
  }
}

/**
 * Inject Leaflet custom styles
 */
function injectLeafletStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = getLeafletMapStyles();
  document.head.appendChild(styleElement);
}

/**
 * Load dashboard data and render widgets
 */
async function loadDashboard(regionFilter = null, dateRange = null) {
  if (!widgetsContainer) {
    console.warn('widgetsContainer not found, cannot load dashboard');
    return;
  }

  try {
    // Skeleton is already in the HTML, no need to show loading state

    // Fetch data (or use cached data)
    if (!allData) {
      console.log('Fetching Trinidad data from CSV...');
      allData = await fetchTrinidadData();
      console.log(`Fetched ${allData.length} records`);
      if (allData.length > 0) {
        console.log('Sample record:', allData[0]);
      }
    }

    // Calculate statistics (with optional region and date filters)
    console.log('Calculating stats with filters - Region:', regionFilter, 'Date Range:', dateRange);
    const stats = calculateStats(allData, regionFilter, dateRange);
    console.log('Stats calculated:', stats);

    // Hide skeleton and render widgets
    const widgetsSkeleton = document.getElementById('widgetsSkeleton');
    if (widgetsSkeleton) {
      widgetsSkeleton.remove();
    }

    console.log('Rendering widgets...');
    renderWidgets(stats);

    console.log(`Dashboard loaded successfully. Total incidents: ${stats.total}`);
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    console.error('Error stack:', error.stack);

    // Safely show error state
    try {
      if (widgetsContainer) {
        widgetsContainer.innerHTML = '';
        widgetsContainer.appendChild(createErrorState(error.message || 'Unknown error occurred'));
      }
    } catch (errorStateError) {
      console.error('Error showing error state:', errorStateError);
      // Last resort - show simple error message
      if (widgetsContainer) {
        widgetsContainer.innerHTML = '<div class="p-6 text-center text-red-600">Failed to load dashboard data. Please refresh the page.</div>';
      }
    }
  }
}

/**
 * Render all dashboard widgets
 */
function renderWidgets(stats) {
  try {
    // Destroy existing charts to prevent memory leaks
    try {
      destroyAllCharts();
    } catch (error) {
      console.error('Error destroying charts:', error);
    }

    // Create metrics cards
    try {
      const metricsCards = createMetricsCards(stats);
      widgetsContainer.appendChild(metricsCards);
    } catch (error) {
      console.error('Error creating metrics cards:', error);
    }

    // Create Leaflet map with crime markers (full width)
    if (allData) {
      try {
        if (leafletMapInstance) {
          leafletMapInstance.destroy();
        }
        leafletMapInstance = createTrinidadLeafletMap(allData, currentRegion?.name);
        leafletMapInstance.element.classList.add('mb-6');
        widgetsContainer.appendChild(leafletMapInstance.element);
      } catch (error) {
        console.error('Error creating Leaflet map:', error);
      }
    }

    // Create charts container with 2-column grid
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6';

    // Pie chart for crime type breakdown
    try {
      const pieChart = createPieChart(stats);
      chartsContainer.appendChild(pieChart);
    } catch (error) {
      console.error('Error creating pie chart:', error);
    }

    // Last 7 days trend chart
    try {
      const last7DaysChart = createLast7DaysChart(stats);
      chartsContainer.appendChild(last7DaysChart);
    } catch (error) {
      console.error('Error creating last 7 days chart:', error);
    }

    widgetsContainer.appendChild(chartsContainer);

    // Top locations chart (full width)
    try {
      const topLocationsChart = createTopLocationsChart(stats);
      topLocationsChart.classList.add('mt-6');
      widgetsContainer.appendChild(topLocationsChart);
    } catch (error) {
      console.error('Error creating top locations chart:', error);
    }
  } catch (error) {
    console.error('Error rendering widgets:', error);
    throw error; // Re-throw to be caught by loadDashboard
  }
}

/**
 * Initialize date filter controls
 */
function initializeDateFilter() {
  // Apply date filter button
  if (applyDateFilterButton) {
    applyDateFilterButton.addEventListener('click', async () => {
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;

      if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date');
        return;
      }

      currentDateRange = { startDate, endDate };
      await loadDashboard(currentRegion?.name || null, currentDateRange);
      updateSubtitle();
      updateResetButtonVisibility();
    });
  }

  // Clear date filter button
  if (clearDateFilterButton) {
    clearDateFilterButton.addEventListener('click', async () => {
      startDateInput.value = '';
      endDateInput.value = '';
      currentDateRange = null;
      await loadDashboard(currentRegion?.name || null, null);
      updateSubtitle();
      updateResetButtonVisibility();
    });
  }
}

/**
 * Initialize mobile region selector tray
 */
function initializeMobileTray() {
  try {
    // Create mobile map instance
    if (mobileMapContainer) {
      mobileTrinidadMapInstance = createTrinidadMap((regionNumber, regionName) => {
        try {
          handleRegionClick(regionNumber, regionName);
          closeTray();
        } catch (error) {
          console.error('Error handling region click from mobile tray:', error);
        }
      });
      mobileMapContainer.innerHTML = '';
      mobileMapContainer.appendChild(mobileTrinidadMapInstance.element);
    }

    // Mobile region button - open tray
    if (mobileRegionButton) {
      mobileRegionButton.addEventListener('click', () => {
        try {
          openTray();
        } catch (error) {
          console.error('Error opening tray:', error);
        }
      });
    }

    // Close tray button
    if (closeTrayButton) {
      closeTrayButton.addEventListener('click', () => {
        try {
          closeTray();
        } catch (error) {
          console.error('Error closing tray:', error);
        }
      });
    }

    // Overlay - close tray when clicked
    if (trayOverlay) {
      trayOverlay.addEventListener('click', () => {
        try {
          closeTray();
        } catch (error) {
          console.error('Error closing tray via overlay:', error);
        }
      });
    }

    // Reset filter buttons
    if (resetFilterButton) {
      resetFilterButton.addEventListener('click', async () => {
        try {
          // Clear date filter inputs
          startDateInput.value = '';
          endDateInput.value = '';
          currentDateRange = null;

          // Clear region filter
          await handleRegionClick(null, null);
        } catch (error) {
          console.error('Error resetting filters:', error);
        }
      });
    }

    if (resetFilterButtonTray) {
      resetFilterButtonTray.addEventListener('click', async () => {
        try {
          // Clear date filter inputs
          startDateInput.value = '';
          endDateInput.value = '';
          currentDateRange = null;

          // Clear region filter
          await handleRegionClick(null, null);
          closeTray();
        } catch (error) {
          console.error('Error resetting filters from tray:', error);
          // Still try to close the tray even if reset fails
          try {
            closeTray();
          } catch (closeError) {
            console.error('Error closing tray after failed reset:', closeError);
          }
        }
      });
    }
  } catch (error) {
    console.error('Error initializing mobile tray:', error);
  }
}

/**
 * Open mobile region tray
 */
function openTray() {
  try {
    if (regionTray && trayOverlay) {
      regionTray.classList.remove('translate-x-full');
      trayOverlay.classList.remove('opacity-0', 'pointer-events-none');
      if (document.body) {
        document.body.style.overflow = 'hidden'; // Prevent scrolling
      }
    }
  } catch (error) {
    console.error('Error opening tray:', error);
  }
}

/**
 * Close mobile region tray
 */
function closeTray() {
  try {
    if (regionTray && trayOverlay) {
      regionTray.classList.add('translate-x-full');
      trayOverlay.classList.add('opacity-0', 'pointer-events-none');
      if (document.body) {
        document.body.style.overflow = ''; // Re-enable scrolling
      }
    }
  } catch (error) {
    console.error('Error closing tray:', error);
  }
}

/**
 * Update reset filter button visibility
 */
function updateResetButtonVisibility() {
  try {
    if (resetFilterButton) {
      if (currentRegion || currentDateRange) {
        resetFilterButton.classList.remove('hidden');
      } else {
        resetFilterButton.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Error updating reset button visibility:', error);
  }
}

/**
 * Handle region clicks from the map
 */
async function handleRegionClick(regionNumber, regionName) {
  // Prevent infinite loops from map clearFilter callbacks
  if (isUpdatingRegion) {
    console.log('Already updating region, skipping duplicate call');
    return;
  }

  isUpdatingRegion = true;

  try {
    if (regionNumber) {
      // Region selected - filter dashboard
      currentRegion = { number: regionNumber, name: regionName };

      // Reload dashboard with region filter (preserve date filter)
      await loadDashboard(regionName, currentDateRange);
    } else {
      // Clear filter - show all regions
      currentRegion = null;

      // Reload dashboard without region filter (preserve date filter)
      await loadDashboard(null, currentDateRange);

      // Clear both map visual states WITHOUT triggering their callbacks
      // (since we've already loaded the unfiltered data above)
      if (trinidadMapInstance && typeof trinidadMapInstance.clearFilter === 'function') {
        try {
          trinidadMapInstance.clearFilter();
        } catch (error) {
          console.error('Error clearing desktop map filter:', error);
        }
      }

      if (mobileTrinidadMapInstance && typeof mobileTrinidadMapInstance.clearFilter === 'function') {
        try {
          mobileTrinidadMapInstance.clearFilter();
        } catch (error) {
          console.error('Error clearing mobile map filter:', error);
        }
      }
    }

    // Update reset button visibility
    updateResetButtonVisibility();
  } catch (error) {
    console.error('Error in handleRegionClick:', error);
    // Try to recover by at least updating the subtitle
    try {
      updateSubtitle('Error loading data');
    } catch (subtitleError) {
      console.error('Error updating subtitle:', subtitleError);
    }
  } finally {
    // Always reset the flag after processing
    isUpdatingRegion = false;
  }
}

/**
 * Update dashboard subtitle
 */
function updateSubtitle(text = null) {
  if (!subtitle) return;

  // If text is provided, use it directly
  if (text) {
    subtitle.textContent = text;
    return;
  }

  // Otherwise, build subtitle from current filters
  let subtitleText = '';

  if (currentRegion) {
    subtitleText = currentRegion.name;
  } else {
    subtitleText = 'Nationwide data';
  }

  if (currentDateRange) {
    const startDate = new Date(currentDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endDate = new Date(currentDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    subtitleText += ` | ${startDate} - ${endDate}`;
  }

  subtitle.textContent = subtitleText;
}

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
  // Press 'R' to reset filters
  if (e.key === 'r' || e.key === 'R') {
    if (currentRegion && trinidadMapInstance) {
      e.preventDefault();
      trinidadMapInstance.clearFilter();
      handleRegionClick(null, null);
    }
  }
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
