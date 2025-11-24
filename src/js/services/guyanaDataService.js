// src/js/services/guyanaDataService.js
// Data fetching and processing service for Guyana dashboard

import Papa from 'papaparse';

const GUYANA_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRLuFajWrjyJk-LaZhN9SkSMMEvWcH74PHYzDJ03su3oGu_9W--2O7aUJ3_6Eul6BVUay1Gez-wWk3H/pub?gid=1749261532&single=true&output=csv';

/**
 * Fetch and parse Guyana crime data
 * @returns {Promise<Array>} Parsed crime records
 */
export async function fetchGuyanaData() {
  return new Promise((resolve, reject) => {
    Papa.parse(GUYANA_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(new Error(`Failed to fetch Guyana data: ${error.message}`));
      }
    });
  });
}

/**
 * Calculate dashboard statistics from crime data
 * @param {Array} data - Crime records
 * @param {string|null} regionFilter - Optional region filter
 * @returns {Object} Calculated statistics
 */
export function calculateStats(data, regionFilter = null) {
  // Filter by region if specified
  let filteredData = data;
  if (regionFilter) {
    filteredData = data.filter(record =>
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

  return {
    total,
    murders,
    robberies,
    homeInvasions,
    thefts,
    crimeTypes,
    last7Days,
    topLocations
  };
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
