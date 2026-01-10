// src/js/services/guyanaDataService.js
// Guyana-specific configuration using unified CrimeDataService

import { CrimeDataService, formatDate as baseFormatDate } from './CrimeDataService.js';

const GUYANA_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRLuFajWrjyJk-LaZhN9SkSMMEvWcH74PHYzDJ03su3oGu_9W--2O7aUJ3_6Eul6BVUay1Gez-wWk3H/pub?gid=1749261532&single=true&output=csv';

// Create Guyana-specific service instance
const guyanaService = new CrimeDataService({
  csvUrl: GUYANA_CSV_URL,
  cacheKey: 'guyana_crime_data',
  countryName: 'Guyana',
  cacheTTL: 5
});

/**
 * Fetch and parse Guyana crime data with caching
 * @param {boolean} forceRefresh - Force refresh from server
 * @returns {Promise<Array>} Parsed crime records
 */
export async function fetchGuyanaData(forceRefresh = false) {
  return guyanaService.fetchData(forceRefresh);
}

/**
 * Calculate dashboard statistics from crime data with caching
 * @param {Array} data - Crime records
 * @param {string|null} regionFilter - Optional region filter
 * @param {Object|null} dateRange - Optional date range {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
 * @returns {Object} Calculated statistics
 */
export function calculateStats(data, regionFilter = null, dateRange = null) {
  return guyanaService.calculateStats(data, regionFilter, dateRange);
}

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  return baseFormatDate(dateString);
}
