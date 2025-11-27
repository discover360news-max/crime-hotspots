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
  const container = document.createElement('div');
  container.className = 'metrics-cards grid grid-cols-2 md:grid-cols-5 gap-4 mb-6';

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

  return container;
}

/**
 * Create a single metric card
 */
function createMetricCard({ label, value, color }) {
  const card = document.createElement('div');
  card.className = 'metric-card bg-white rounded-lg p-4 shadow-md transition-all hover:shadow-lg';
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
 * Create bar chart for last 7 days
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

    // Prepare data
    const dates = stats.last7Days.map(item => formatDate(item.date));
    const allCrimeTypes = new Set();
    stats.last7Days.forEach(item => {
      Object.keys(item.crimes).forEach(type => allCrimeTypes.add(type));
    });

    const crimeTypesArray = Array.from(allCrimeTypes);
    const colors = getCrimeColorsArray(crimeTypesArray);

    const datasets = crimeTypesArray.map((crimeType, index) => {
      return {
        label: crimeType,
        data: stats.last7Days.map(item => item.crimes[crimeType] || 0),
        backgroundColor: colors[index],
        borderRadius: 4
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
            stacked: true,
            grid: {
              display: false
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              stepSize: 1
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
                size: 11
              },
              usePointStyle: false
            }
          },
          datalabels: {
            display: false
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
          backgroundColor: '#3b82f6',
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
              stepSize: 1
            }
          },
          y: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          datalabels: {
            display: false
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
