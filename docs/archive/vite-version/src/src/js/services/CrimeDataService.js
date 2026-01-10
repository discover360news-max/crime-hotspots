// src/js/services/CrimeDataService.js
// Unified data fetching and processing service for all countries

import Papa from 'papaparse';
import { dataCache } from '../utils/dataCache.js';

/**
 * Generic crime data service for any country
 */
export class CrimeDataService {
  /**
   * @param {Object} config - Configuration object
   * @param {string} config.csvUrl - Google Sheets CSV URL
   * @param {string} config.cacheKey - Cache key for this country
   * @param {string} config.countryName - Country name for logging
   * @param {number} [config.cacheTTL=5] - Cache TTL in minutes
   */
  constructor(config) {
    this.csvUrl = config.csvUrl;
    this.cacheKey = config.cacheKey;
    this.countryName = config.countryName;
    this.cacheTTL = config.cacheTTL || 5;
  }

  /**
   * Fetch and parse crime data with caching
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Array>} Parsed crime records
   */
  async fetchData(forceRefresh = false) {
    // Try to get from cache first
    if (!forceRefresh) {
      const cached = dataCache.get(this.cacheKey, this.cacheTTL);
      if (cached) {
        console.log(`📦 Using cached ${this.countryName} data`);
        return cached;
      }
    }

    // Fetch fresh data
    console.log(`🌐 Fetching fresh ${this.countryName} data from Google Sheets`);

    return new Promise((resolve, reject) => {
      Papa.parse(this.csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }

          // Cache the data
          dataCache.set(this.cacheKey, results.data);

          // Clear old stats cache since we have new data
          dataCache.clearStats(this.cacheKey);

          resolve(results.data);
        },
        error: (error) => {
          reject(new Error(`Failed to fetch ${this.countryName} data: ${error.message}`));
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
  calculateStats(data, regionFilter = null, dateRange = null) {
    // Create cache key that includes date range
    const cacheKey = dateRange
      ? `${regionFilter || 'all'}_${dateRange.startDate}_${dateRange.endDate}`
      : regionFilter;

    // Check if we have cached stats for this region and date range
    const cachedStats = dataCache.getStats(this.cacheKey, cacheKey);
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
    const last7Days = this._getLast7DaysData(filteredData);

    // Top locations
    const topLocations = this._getTopLocations(filteredData, 10);

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

    // Cache the calculated stats
    dataCache.setStats(this.cacheKey, cacheKey, stats);

    return stats;
  }

  /**
   * Get crime data for the last 7 days, grouped by date
   * @private
   * @param {Array} data - Crime records
   * @returns {Array} Data grouped by date with counts per crime type
   */
  _getLast7DaysData(data) {
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
   * @private
   * @param {Array} data - Crime records
   * @param {number} limit - Number of top locations to return
   * @returns {Array} Top locations with counts
   */
  _getTopLocations(data, limit = 10) {
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
