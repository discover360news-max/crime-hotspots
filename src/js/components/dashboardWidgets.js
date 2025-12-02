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
  container.className = 'metrics-cards flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100';
  container.style.scrollbarWidth = 'thin'; // Firefox
  container.style.scrollbarColor = '#cbd5e1 #f1f5f9'; // Firefox (thumb track)

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
  fadeHint.className = 'absolute right-0 top-0 bottom-0 w-24 pointer-events-none bg-gradient-to-l from-slate-100 via-slate-50 to-transparent opacity-0 transition-opacity duration-300';
  fadeHint.id = 'scrollFadeHint';

  // Chevron arrow indicator for scrolling
  const chevronHint = document.createElement('div');
  chevronHint.className = 'absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 transition-opacity duration-300';
  chevronHint.id = 'scrollChevronHint';
  chevronHint.innerHTML = `
    <svg class="w-5 h-5 text-slate-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  `;

  wrapper.appendChild(container);
  wrapper.appendChild(fadeHint);
  wrapper.appendChild(chevronHint);

  // Show/hide fade hint and chevron based on scroll position
  container.addEventListener('scroll', () => {
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;

    // Show hint if not scrolled all the way to the right
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
  });

  // Initially show the hint if content is scrollable
  setTimeout(() => {
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll > 10) {
      fadeHint.classList.remove('opacity-0');
      fadeHint.classList.add('opacity-100');
      chevronHint.classList.remove('opacity-0');
      chevronHint.classList.add('opacity-100');
    }
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
    <div class="text-small font-medium text-slate-600 mb-2">${label}</div>
    <div class="text-display font-bold text-slate-900">${value}</div>
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
  container.className = 'chart-container bg-white rounded-lg p-6 shadow-md';
  container.innerHTML = `
    <h3 class="text-h3 font-semibold text-slate-700 mb-4">Crime Type Breakdown</h3>
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
                size: 11
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
  container.className = 'chart-container bg-white rounded-lg p-6 shadow-md';
  container.innerHTML = `
    <h3 class="text-h3 font-semibold text-slate-700 mb-4">Last 7 Days Trend</h3>
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
                size: 10
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
              stepSize: 1,
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
                size: 10
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
  container.className = 'chart-container bg-white rounded-lg p-6 shadow-md';
  container.innerHTML = `
    <h3 class="text-h3 font-semibold text-slate-700 mb-4">Top Locations</h3>
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
          borderRadius: 4
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
              stepSize: 1,
              font: {
                size: 11
              }
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              },
              // Truncate long location names
              callback: function(value, index) {
                const label = this.getLabelForValue(value);
                if (label.length > 25) {
                  return label.substring(0, 22) + '...';
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
            color: '#ffffff',
            font: {
              weight: 'bold',
              size: 10
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
