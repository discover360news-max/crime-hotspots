// src/js/components/dashboardWidgets.js
// Dashboard widgets using Chart.js

import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { formatDate } from '../services/guyanaDataService.js';
import { getCrimeColorsArray } from '../config/crimeColors.js';

// Register Chart.js components
Chart.register(...registerables, ChartDataLabels);

let pieChartInstance = null;
let barChartInstance = null;
let locationChartInstance = null;

/**
 * Create key metrics cards
 * @param {Object} stats - Statistics object
 * @returns {HTMLElement} Container with metric cards
 */
export function createMetricsCards(stats) {
  // Wrapper with relative positioning for scroll indicators
  const wrapper = document.createElement('div');
  wrapper.className = 'relative mb-6';

  // Scrollable container
  const container = document.createElement('div');
  container.className = 'metrics-cards rounded-lg flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 hide-scrollbar';
  // container.style.scrollbarWidth = 'thin'; // Firefox
  // container.style.scrollbarColor = '#cbd5e1 #f1f5f9'; // Firefox (thumb track)

  const metrics = [
    { label: 'Total Incidents', value: stats.total, color: 'blue' },
    { label: 'Murders', value: stats.murders, color: 'red' },
    { label: 'Robberies', value: stats.robberies, color: 'orange' },
    { label: 'Home Invasions', value: stats.homeInvasions, color: 'purple' },
    { label: 'Thefts', value: stats.thefts, color: 'yellow' }
  ];

  metrics.forEach(metric => {
    const card = createMetricCard(metric);
    container.appendChild(card);
  });

  // Fade gradient hint on the right (indicates more content)
  const fadeHint = document.createElement('div');
  fadeHint.className = 'absolute rounded-lg right-0 top-2 h-full w-24 pointer-events-none bg-gradient-to-l from-slate-100 via-slate-50 to-transparent opacity-0 transition-opacity duration-300';
  fadeHint.id = 'scrollFadeHint';

  // Chevron arrow indicator for scrolling (MOBILE ONLY with "Scroll" text)
  const chevronHint = document.createElement('div');
  chevronHint.className = 'md:hidden absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 transition-opacity duration-300 flex items-center gap-1';
  chevronHint.id = 'scrollChevronHint';
  chevronHint.innerHTML = `
    <svg class="w-4 h-4 text-rose-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  `;

  // Desktop navigation arrows (LEFT arrow)
  const leftArrow = document.createElement('button');
  leftArrow.className = 'hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center bg-white/50 backdrop-blur-sm rounded-full shadow-md border border-slate-200 hover:bg-rose-50 hover:border-rose-600 transition z-10 opacity-0 pointer-events-none';
  leftArrow.id = 'metricsScrollLeft';
  leftArrow.setAttribute('aria-label', 'Scroll metrics left');
  leftArrow.innerHTML = `
    <svg class="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
  `;

  // Desktop navigation arrows (RIGHT arrow)
  const rightArrow = document.createElement('button');
  rightArrow.className = 'hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-slate-200 hover:bg-rose-50 hover:border-rose-600 transition z-10';
  rightArrow.id = 'metricsScrollRight';
  rightArrow.setAttribute('aria-label', 'Scroll metrics right');
  rightArrow.innerHTML = `
    <svg class="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  `;

  wrapper.appendChild(container);
  wrapper.appendChild(fadeHint);
  wrapper.appendChild(chevronHint);
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  // Arrow click handlers (desktop only)
  leftArrow.addEventListener('click', () => {
    container.scrollBy({ left: -300, behavior: 'smooth' });
  });

  rightArrow.addEventListener('click', () => {
    container.scrollBy({ left: 300, behavior: 'smooth' });
  });

  // Show/hide hints and arrows based on scroll position
  function updateScrollIndicators() {
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;

    // Mobile: Show fade hint and chevron if not scrolled all the way to the right
    if (maxScroll - scrollLeft > 10) {
      fadeHint.classList.remove('opacity-0');
      fadeHint.classList.add('opacity-100');
      chevronHint.classList.remove('opacity-0');
      chevronHint.classList.add('opacity-100');
    } else {
      fadeHint.classList.remove('opacity-100');
      fadeHint.classList.add('opacity-0');
      chevronHint.classList.remove('opacity-100');
      chevronHint.classList.add('opacity-0');
    }

    // Desktop: Show/hide left arrow (hidden if at start)
    if (scrollLeft <= 10) {
      leftArrow.classList.remove('opacity-100');
      leftArrow.classList.add('opacity-0');
      leftArrow.style.pointerEvents = 'none';
    } else {
      leftArrow.classList.remove('opacity-0');
      leftArrow.classList.add('opacity-100');
      leftArrow.style.pointerEvents = 'auto';
    }

    // Desktop: Show/hide right arrow (hidden if at end)
    if (maxScroll - scrollLeft <= 10) {
      rightArrow.classList.remove('opacity-100');
      rightArrow.classList.add('opacity-0');
      rightArrow.style.pointerEvents = 'none';
    } else {
      rightArrow.classList.remove('opacity-0');
      rightArrow.classList.add('opacity-100');
      rightArrow.style.pointerEvents = 'auto';
    }
  }

  container.addEventListener('scroll', updateScrollIndicators);

  // Initially show indicators if content is scrollable
  setTimeout(() => {
    updateScrollIndicators();
  }, 100);

  return wrapper;
}

/**
 * Create a single metric card
 */
function createMetricCard({ label, value, color }) {
  const card = document.createElement('div');
  card.className = 'metric-card bg-white rounded-lg p-4 shadow-md transition-all hover:shadow-lg flex-shrink-0 w-40 snap-start';
  card.innerHTML = `
    <div class="text-small font-medium text-slate-400 mb-2">${label}</div>
    <div class="text-display font-bold text-slate-600">${value}</div>
  `;
  return card;
}

/**
 * Create pie chart for crime type breakdown
 * @param {Object} stats - Statistics object
 * @returns {HTMLElement} Container with pie chart
 */
export function createPieChart(stats) {
  const container = document.createElement('div');
  container.className = 'chart-container bg-white/25 backdrop-blur-md rounded-lg p-6 shadow-md';
  container.innerHTML = `
    <h3 class="text-h3 font-semibold text-slate-500 mb-4">Crime Type Breakdown</h3>
    <div class="relative" style="height: 300px;">
      <canvas id="pieChart"></canvas>
    </div>
  `;

  // Wait for DOM insertion, then create chart
  setTimeout(() => {
    const canvas = document.getElementById('pieChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy previous instance if exists
    if (pieChartInstance) {
      pieChartInstance.destroy();
    }

    const labels = Object.keys(stats.crimeTypes);
    const data = Object.values(stats.crimeTypes);
    const colors = getCrimeColorsArray(labels);

    pieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            labels: {
              padding: 8,
              boxWidth: 12,
              boxHeight: 12,
              font: {
                size: 8
              },
              usePointStyle: false
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          },
          datalabels: {
            formatter: (value, ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return percentage + '%';
            },
            color: '#ffffff',
            font: {
              weight: 'normal',
              size: 7
            },
            display: function(ctx) {
              // Only show label if percentage is > 5% to avoid cluttering small slices
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = (ctx.dataset.data[ctx.dataIndex] / total) * 100;
              return percentage > 5;
            }
          }
        }
      }
    });
  }, 100);

  return container;
}

/**
 * Create bar chart for last 7 days trend
 * @param {Object} stats - Statistics object
 * @returns {HTMLElement} Container with bar chart
 */
export function createLast7DaysChart(stats) {
  const container = document.createElement('div');
  container.className = 'chart-container bg-white/25 backdrop-blur-md rounded-lg p-6 shadow-md';
  container.innerHTML = `
    <h3 class="text-h3 font-semibold text-slate-500 mb-4">Last 7 Days Trend</h3>
    <div class="relative" style="height: 300px;">
      <canvas id="barChart"></canvas>
    </div>
  `;

  setTimeout(() => {
    const canvas = document.getElementById('barChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy previous instance if exists
    if (barChartInstance) {
      barChartInstance.destroy();
    }

    // Check if we have data
    if (!stats.last7Days || stats.last7Days.length === 0) {
      console.warn('No last 7 days data available');
      return;
    }

    // Prepare data - last 7 days timeline
    const dates = stats.last7Days.map(item => formatDate(item.date));

    // Get all unique crime types across all days
    const allCrimeTypes = new Set();
    stats.last7Days.forEach(item => {
      Object.keys(item.crimes).forEach(type => allCrimeTypes.add(type));
    });

    const crimeTypesArray = Array.from(allCrimeTypes);
    const colors = getCrimeColorsArray(crimeTypesArray);

    // Create datasets for each crime type (stacked bars)
    const datasets = crimeTypesArray.map((crimeType, index) => {
      return {
        label: crimeType,
        data: stats.last7Days.map(item => item.crimes[crimeType] || 0),
        backgroundColor: colors[index],
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.9
      };
    });

    barChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true, // Stacked bars
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 8
              },
              maxRotation: 0, // Horizontal labels (no slant)
              minRotation: 0,
              autoSkip: true, // Automatically skip labels to prevent overlap
              maxTicksLimit: 7 // Limit to 7 labels for 7 days
            }
          },
          y: {
            stacked: true, // Stacked bars
            beginAtZero: true,
            ticks: {
              stepSize: 2,
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            labels: {
              padding: 8,
              boxWidth: 12,
              boxHeight: 12,
              font: {
                size: 8
              },
              usePointStyle: false
            }
          },
          datalabels: {
            display: false // Too cluttered with multiple bars per day
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return context[0].label;
              },
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y}`;
              }
            }
          }
        }
      }
    });
  }, 100);

  return container;
}

/**
 * Create bar chart for top locations
 * @param {Object} stats - Statistics object
 * @returns {HTMLElement} Container with horizontal bar chart
 */
export function createTopLocationsChart(stats) {
  const container = document.createElement('div');
  container.className = 'chart-container bg-white/25 backdrop-blur-md rounded-lg p-6 shadow-md';
  container.innerHTML = `
    <h3 class="text-h3 font-semibold text-slate-500 mb-4">Top Locations</h3>
    <div class="relative" style="height: 400px;">
      <canvas id="locationChart"></canvas>
    </div>
  `;

  setTimeout(() => {
    const canvas = document.getElementById('locationChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy previous instance if exists
    if (locationChartInstance) {
      locationChartInstance.destroy();
    }

    const labels = stats.topLocations.map(item => item.location);
    const data = stats.topLocations.map(item => item.count);

    locationChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Incidents',
          data,
          backgroundColor: '#e11d48', // Rose-600 to match site theme
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 25,
              font: {
                size: 8
              }
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 8
              },
              // Truncate long location names
              callback: function(value, index) {
                const label = this.getLabelForValue(value);
                if (label.length > 15) {
                  return label.substring(0, 10) + '...';
                }
                return label;
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          datalabels: {
            anchor: 'end',
            align: 'right',
            formatter: (value) => value,
            color: '#a5a5a5ff',
            font: {
              weight: 'bold',
              size: 8
            }
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                // Show full location name in tooltip
                return stats.topLocations[context[0].dataIndex].location;
              }
            }
          }
        }
      }
    });
  }, 100);

  return container;
}

/**
 * Create loading state
 * @returns {HTMLElement} Loading spinner
 */
export function createLoadingState() {
  const container = document.createElement('div');
  container.className = 'loading-state flex flex-col items-center justify-center py-12';
  container.innerHTML = `
    <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-rose-600 mb-4"></div>
    <p class="text-gray-600 font-medium">Loading dashboard data...</p>
  `;
  return container;
}

/**
 * Create error state
 * @param {string} message - Error message
 * @returns {HTMLElement} Error display
 */
export function createErrorState(message) {
  const container = document.createElement('div');
  container.className = 'error-state bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center';
  container.innerHTML = `
    <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <h3 class="text-h3 font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h3>
    <p class="text-small text-gray-600">${message}</p>
  `;
  return container;
}

/**
 * Destroy all chart instances (cleanup)
 */
export function destroyAllCharts() {
  if (pieChartInstance) pieChartInstance.destroy();
  if (barChartInstance) barChartInstance.destroy();
  if (locationChartInstance) locationChartInstance.destroy();
}
