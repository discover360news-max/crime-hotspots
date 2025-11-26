// src/js/dashboardTrinidad.js
// Trinidad & Tobago dashboard using modular components

import { createTrinidadMap } from './components/trinidadMap.js';
import { fetchTrinidadData, calculateStats } from './services/trinidadDataService.js';
import {
  createMetricsCards,
  createPieChart,
  createLast7DaysChart,
  createTopLocationsChart,
  createErrorState,
  destroyAllCharts
} from './components/dashboardWidgets.js';
import { createTrinidadLeafletMap, getLeafletMapStyles } from './components/trinidadLeafletMap.js';
import { FilterController } from './components/FilterController.js';
import { RegionTray } from './components/RegionTray.js';

// DOM Elements
const mapContainer = document.getElementById('trinidadMapContainer');
const widgetsContainer = document.getElementById('dashboardWidgets');
const subtitle = document.getElementById('dashboardSubtitle');
const resetFilterButton = document.getElementById('resetFilterButton');

// State
let trinidadMapInstance = null;
let leafletMapInstance = null;
let allData = null;
let isUpdatingRegion = false;
let filterController = null;
let regionTray = null;

/**
 * Initialize the page
 */
async function init() {
  try {
    // Inject Leaflet map styles
    injectLeafletStyles();

    // Create and inject the desktop map
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

    // Initialize filter controller
    filterController = new FilterController({
      desktopStartInputId: 'startDate',
      desktopEndInputId: 'endDate',
      desktopApplyButtonId: 'applyDateFilter',
      desktopClearButtonId: 'clearDateFilter',
      mobileStartInputId: 'startDateMobile',
      mobileEndInputId: 'endDateMobile',
      mobileApplyButtonId: 'applyDateFilterMobile',
      mobileClearButtonId: 'clearDateFilterMobile',
      onFilterChange: async (regionFilter, dateRange) => {
        await loadDashboard(regionFilter, dateRange);
      },
      onSubtitleUpdate: updateSubtitle,
      onResetButtonUpdate: updateResetButtonVisibility
    });

    // Initialize region tray
    regionTray = new RegionTray({
      trayId: 'regionTray',
      overlayId: 'trayOverlay',
      openButtonId: 'mobileRegionButton',
      closeButtonId: 'closeTrayButton',
      resetButtonId: 'resetFilterButtonTray',
      mobileMapContainerId: 'mobileMapContainer',
      createMapFn: (onClickCallback) => {
        return createTrinidadMap((regionNumber, regionName) => {
          handleRegionClick(regionNumber, regionName);
          onClickCallback(regionNumber, regionName);
        });
      },
      onReset: async () => {
        await handleRegionClick(null, null);
        if (filterController) {
          await filterController.clearAllFilters();
        }
      }
    });

    // Reset filter button
    if (resetFilterButton) {
      resetFilterButton.addEventListener('click', async () => {
        try {
          if (filterController) {
            await filterController.clearAllFilters();
          }
          await handleRegionClick(null, null);
        } catch (error) {
          console.error('Error resetting filters:', error);
        }
      });
    }

    // Keyboard shortcut (R to reset)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        if (filterController && filterController.getRegion() && trinidadMapInstance) {
          e.preventDefault();
          trinidadMapInstance.clearFilter();
          handleRegionClick(null, null);
        }
      }
    });

    // Load dashboard data
    await loadDashboard();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
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
    // Clear existing widgets
    widgetsContainer.innerHTML = '';

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
        const currentRegion = filterController ? filterController.getRegion() : null;
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
    throw error;
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
      // Region selected - update filter controller
      if (filterController) {
        filterController.setRegion({ number: regionNumber, name: regionName });
      }

      // Reload dashboard with region filter
      const dateRange = filterController ? filterController.getDateRange() : null;
      await loadDashboard(regionName, dateRange);
    } else {
      // Clear filter
      if (filterController) {
        filterController.setRegion(null);
      }

      // Reload dashboard without region filter
      const dateRange = filterController ? filterController.getDateRange() : null;
      await loadDashboard(null, dateRange);

      // Clear both map visual states
      if (trinidadMapInstance && typeof trinidadMapInstance.clearFilter === 'function') {
        try {
          trinidadMapInstance.clearFilter();
        } catch (error) {
          console.error('Error clearing desktop map filter:', error);
        }
      }

      if (regionTray) {
        const mobileMapInstance = regionTray.getMapInstance();
        if (mobileMapInstance && typeof mobileMapInstance.clearFilter === 'function') {
          try {
            mobileMapInstance.clearFilter();
          } catch (error) {
            console.error('Error clearing mobile map filter:', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in handleRegionClick:', error);
    try {
      updateSubtitle(null, null, 'Error loading data');
    } catch (subtitleError) {
      console.error('Error updating subtitle:', subtitleError);
    }
  } finally {
    isUpdatingRegion = false;
  }
}

/**
 * Update dashboard subtitle
 */
function updateSubtitle(region, dateRange, errorText = null) {
  if (!subtitle) return;

  if (errorText) {
    subtitle.textContent = errorText;
    return;
  }

  let subtitleText = '';

  if (region) {
    subtitleText = region.name;
  } else {
    subtitleText = 'Nationwide data';
  }

  if (dateRange) {
    const startDate = new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endDate = new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    subtitleText += ` | ${startDate} - ${endDate}`;
  }

  subtitle.textContent = subtitleText;
}

/**
 * Update reset filter button visibility
 */
function updateResetButtonVisibility(region, dateRange) {
  try {
    if (resetFilterButton) {
      if (region || dateRange) {
        resetFilterButton.classList.remove('hidden');
      } else {
        resetFilterButton.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Error updating reset button visibility:', error);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
