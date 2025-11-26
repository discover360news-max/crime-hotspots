// src/js/services/trinidadDataService.js
// Trinidad & Tobago-specific configuration using unified CrimeDataService

import { CrimeDataService, formatDate as baseFormatDate } from './CrimeDataService.js';

const TRINIDAD_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv';

// Create Trinidad-specific service instance
const trinidadService = new CrimeDataService({
  csvUrl: TRINIDAD_CSV_URL,
  cacheKey: 'trinidad_crime_data',
  countryName: 'Trinidad & Tobago',
  cacheTTL: 5
});

/**
 * Fetch and parse Trinidad & Tobago crime data with caching
 * @param {boolean} forceRefresh - Force refresh from server
 * @returns {Promise<Array>} Parsed crime records
 */
export async function fetchTrinidadData(forceRefresh = false) {
  return trinidadService.fetchData(forceRefresh);
}

/**
 * Calculate dashboard statistics from crime data with caching
 * @param {Array} data - Crime records
 * @param {string|null} regionFilter - Optional region filter
 * @param {Object|null} dateRange - Optional date range {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
 * @returns {Object} Calculated statistics
 */
export function calculateStats(data, regionFilter = null, dateRange = null) {
  return trinidadService.calculateStats(data, regionFilter, dateRange);
}

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  return baseFormatDate(dateString);
}
