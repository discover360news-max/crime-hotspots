// src/js/services/barbadosDataService.js
// Barbados-specific configuration using unified CrimeDataService

import { CrimeDataService, formatDate as baseFormatDate } from './CrimeDataService.js';

const BARBADOS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6y1Btbcvj2U1hlQD4-AMiOLDx-NgZc3IVYxXWYGb88vWs8D1EMWU3-BYxwy1fEAw9IqGiv8-KokeO/pub?gid=1749261532&single=true&output=csv';

// Create Barbados-specific service instance
const barbadosService = new CrimeDataService({
  csvUrl: BARBADOS_CSV_URL,
  cacheKey: 'barbados_crime_data',
  countryName: 'Barbados',
  cacheTTL: 5
});

/**
 * Fetch and parse Barbados crime data with caching
 * @param {boolean} forceRefresh - Force refresh from server
 * @returns {Promise<Array>} Parsed crime records
 */
export async function fetchBarbadosData(forceRefresh = false) {
  return barbadosService.fetchData(forceRefresh);
}

/**
 * Calculate dashboard statistics from crime data with caching
 * @param {Array} data - Crime records
 * @param {string|null} regionFilter - Optional region filter
 * @param {Object|null} dateRange - Optional date range {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
 * @returns {Object} Calculated statistics
 */
export function calculateStats(data, regionFilter = null, dateRange = null) {
  return barbadosService.calculateStats(data, regionFilter, dateRange);
}

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  return baseFormatDate(dateString);
}
