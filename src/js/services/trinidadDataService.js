// src/js/services/trinidadDataService.js
// Data fetching and processing service for Trinidad & Tobago dashboard

import Papa from 'papaparse';
import { dataCache } from '../utils/dataCache.js';

const TRINIDAD_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv';
const CACHE_KEY = 'trinidad_crime_data';
const CACHE_TTL_MINUTES = 5; // Cache for 5 minutes

/**
 * Fetch and parse Trinidad & Tobago crime data with caching
 * @param {boolean} forceRefresh - Force refresh from server
 * @returns {Promise<Array>} Parsed crime records
 */
export async function fetchTrinidadData(forceRefresh = false) {
  // Try to get from cache first
  if (!forceRefresh) {
    const cached = dataCache.get(CACHE_KEY, CACHE_TTL_MINUTES);
    if (cached) {
      console.log('📦 Using cached Trinidad data');
      return cached;
    }
  }

  // Fetch fresh data
  console.log('🌐 Fetching fresh Trinidad data from Google Sheets');

  return new Promise((resolve, reject) => {
    Papa.parse(TRINIDAD_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }

        // Cache the data
        dataCache.set(CACHE_KEY, results.data);

        // Clear old stats cache since we have new data
        dataCache.clearStats(CACHE_KEY);

        resolve(results.data);
      },
      error: (error) => {
        reject(new Error(`Failed to fetch Trinidad data: ${error.message}`));
      }
    });
  });
}

/**
 * Calculate dashboard statistics from crime data with caching
 * @param {Array} data - Crime records
 * @param {string|null} regionFilter - Optional region filter
 * @param {Object|null} dateRange - Optional date range {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
 * @returns {Object} Calculated statistics
 */
export function calculateStats(data, regionFilter = null, dateRange = null) {
  // Create cache key that includes date range
  const cacheKey = dateRange
    ? `${regionFilter || 'all'}_${dateRange.startDate}_${dateRange.endDate}`
    : regionFilter;

  // Check if we have cached stats for this region and date range
  const cachedStats = dataCache.getStats(CACHE_KEY, cacheKey);
  if (cachedStats) {
    console.log(`📊 Using cached stats for filter: ${cacheKey}`);
    return cachedStats;
  }

  console.log(`🔢 Calculating stats for filter: ${cacheKey}`);

  // Start with all data
  let filteredData = data;

  // Filter by date range if specified
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    filteredData = filteredData.filter(record => {
      if (!record.Date) return false;
      const recordDate = new Date(record.Date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    console.log(`📅 Filtered by date: ${filteredData.length} records between ${dateRange.startDate} and ${dateRange.endDate}`);
  }

  // Filter by region if specified
  if (regionFilter) {
    filteredData = filteredData.filter(record =>
      record.Region && record.Region.trim() === regionFilter.trim()
    );
  }

  // Total incidents
  const total = filteredData.length;

  // Crime type breakdown
  const crimeTypes = {};
  filteredData.forEach(record => {
    const crimeType = record['Crime Type'] || 'Unknown';
    crimeTypes[crimeType] = (crimeTypes[crimeType] || 0) + 1;
  });

  // Get specific crime counts
  const murders = crimeTypes['Murder'] || 0;
  const robberies = crimeTypes['Robbery'] || 0;
  const homeInvasions = crimeTypes['Home Invasion'] || 0;
  const thefts = crimeTypes['Theft'] || 0;

  // Last 7 days data
  const last7Days = getLast7DaysData(filteredData);

  // Top locations
  const topLocations = getTopLocations(filteredData, 10);

  const stats = {
    total,
    murders,
    robberies,
    homeInvasions,
    thefts,
    crimeTypes,
    last7Days,
    topLocations
  };

  // Cache the calculated stats (cacheKey already defined at top of function)
  dataCache.setStats(CACHE_KEY, cacheKey, stats);

  return stats;
}

/**
 * Get crime data for the last 7 days, grouped by date
 * @param {Array} data - Crime records
 * @returns {Array} Data grouped by date with counts per crime type
 */
function getLast7DaysData(data) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Filter to last 7 days
  const recentData = data.filter(record => {
    const recordDate = new Date(record.Date);
    return recordDate >= sevenDaysAgo && recordDate <= today;
  });

  // Group by date and crime type
  const dateGroups = {};
  recentData.forEach(record => {
    const date = record.Date;
    const crimeType = record['Crime Type'] || 'Unknown';

    if (!dateGroups[date]) {
      dateGroups[date] = {};
    }
    dateGroups[date][crimeType] = (dateGroups[date][crimeType] || 0) + 1;
  });

  // Convert to array and sort by date
  return Object.entries(dateGroups)
    .map(([date, crimes]) => ({ date, crimes }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Get top locations by incident count
 * @param {Array} data - Crime records
 * @param {number} limit - Number of top locations to return
 * @returns {Array} Top locations with counts
 */
function getTopLocations(data, limit = 10) {
  const locationCounts = {};

  data.forEach(record => {
    const location = record.Area || 'Unknown';
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  });

  return Object.entries(locationCounts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
