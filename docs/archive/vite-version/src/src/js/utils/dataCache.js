// src/js/utils/dataCache.js
// Centralized data caching utility with TTL support

/**
 * Cache manager for crime data with Time-To-Live (TTL) support
 * Uses localStorage for persistent caching across page loads
 */
class DataCache {
  constructor() {
    this.memoryCache = new Map();
    this.statsCache = new Map();
  }

  /**
   * Get data from cache if available and not expired
   * @param {string} key - Cache key
   * @param {number} ttlMinutes - Time to live in minutes
   * @returns {any|null} Cached data or null if expired/not found
   */
  get(key, ttlMinutes = 5) {
    // Try memory cache first (faster)
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (this._isValid(cached.timestamp, ttlMinutes)) {
        return cached.data;
      }
      this.memoryCache.delete(key);
    }

    // Try localStorage (persistent across page loads)
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const cached = JSON.parse(stored);
        if (this._isValid(cached.timestamp, ttlMinutes)) {
          // Restore to memory cache for faster subsequent access
          this.memoryCache.set(key, cached);
          return cached.data;
        }
        localStorage.removeItem(`cache_${key}`);
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    return null;
  }

  /**
   * Store data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    const cached = {
      data,
      timestamp: Date.now()
    };

    // Store in memory cache
    this.memoryCache.set(key, cached);

    // Store in localStorage for persistence
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cached));
    } catch (error) {
      // localStorage might be full or disabled
      console.warn('Cache write error:', error);
    }
  }

  /**
   * Get cached statistics for a specific region
   * @param {string} dataKey - Data cache key
   * @param {string|null} region - Region filter (null for nationwide)
   * @returns {Object|null} Cached stats or null
   */
  getStats(dataKey, region = null) {
    const statsKey = `${dataKey}_stats_${region || 'all'}`;
    return this.statsCache.get(statsKey) || null;
  }

  /**
   * Cache statistics for a specific region
   * @param {string} dataKey - Data cache key
   * @param {string|null} region - Region filter (null for nationwide)
   * @param {Object} stats - Calculated statistics
   */
  setStats(dataKey, region = null, stats) {
    const statsKey = `${dataKey}_stats_${region || 'all'}`;
    this.statsCache.set(statsKey, stats);
  }

  /**
   * Clear all stats cache (useful when data is refreshed)
   * @param {string} dataKey - Data cache key
   */
  clearStats(dataKey) {
    const keysToDelete = [];
    for (const key of this.statsCache.keys()) {
      if (key.startsWith(`${dataKey}_stats_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.statsCache.delete(key));
  }

  /**
   * Clear specific cache entry
   * @param {string} key - Cache key to clear
   */
  clear(key) {
    this.memoryCache.delete(key);
    this.clearStats(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll() {
    this.memoryCache.clear();
    this.statsCache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear all error:', error);
    }
  }

  /**
   * Check if cached data is still valid based on TTL
   * @param {number} timestamp - Cache timestamp
   * @param {number} ttlMinutes - Time to live in minutes
   * @returns {boolean} True if valid, false if expired
   */
  _isValid(timestamp, ttlMinutes) {
    const now = Date.now();
    const age = (now - timestamp) / 1000 / 60; // Age in minutes
    return age < ttlMinutes;
  }

  /**
   * Get cache info for debugging
   * @returns {Object} Cache info
   */
  getCacheInfo() {
    return {
      memoryEntries: this.memoryCache.size,
      statsEntries: this.statsCache.size,
      localStorageKeys: this._getLocalStorageKeys().length
    };
  }

  /**
   * Get all cache keys from localStorage
   * @returns {Array<string>} Cache keys
   */
  _getLocalStorageKeys() {
    try {
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.startsWith('cache_'));
    } catch (error) {
      return [];
    }
  }
}

// Export singleton instance
export const dataCache = new DataCache();
