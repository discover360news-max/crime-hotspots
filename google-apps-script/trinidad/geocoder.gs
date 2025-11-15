/**
   * Geocoding service for addresses
   * Extracts Plus Codes (e.g., MF4R+FQV) for Looker Studio mapping
   * Uses Google Maps Geocoding API
   */

  /**
   * Geocode an address to Plus Code, lat/lng
   * @param {string} address - Full address to geocode
   * @returns {Object} Geocoding result with Plus Code
   */
  function geocodeAddress(address) {
    // Validate input
    if (!address || address.trim().length < 5) {
      Logger.log('⚠️ Address too short or empty, skipping geocoding');
      return {
        plus_code: null,
        lat: null,
        lng: null,
        formatted_address: null
      };
    }

    // Check cache first to save API calls
    const cache = CacheService.getScriptCache();
    const cacheKey = 'geo_' + address.toLowerCase().replace(/\s+/g,
  '_').substring(0, 100);
    const cached = cache.get(cacheKey);

    if (cached) {
      Logger.log('✓ Geocoding cache hit');
      return JSON.parse(cached);
    }

    // Call Geocoding API
    const apiKey = getGeminiApiKey(); // Same API key works for all Google APIs
    const endpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
    const url =`${endpoint}?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
      const response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
      const data = JSON.parse(response.getContentText());

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];

        // Extract Plus Code (preferred for Looker Studio)
        const plusCode = result.plus_code
          ? result.plus_code.global_code || result.plus_code.compound_code
          : null;

        const geocoded = {
          plus_code: plusCode,
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted_address: result.formatted_address
        };

        Logger.log(`✓ Geocoded: ${plusCode || 'No Plus Code'}`);

        // Cache for 30 days
        cache.put(cacheKey, JSON.stringify(geocoded), 2592000);
        return geocoded;

      } else if (data.status === 'REQUEST_DENIED') {
        Logger.log(`❌ Geocoding API not enabled. Enable it at: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com`);
        return {plus_code: null, lat: null, lng: null, formatted_address:null};

      } else {
        Logger.log(`⚠️ Geocoding failed for "${address}": ${data.status}`);
        return {plus_code: null, lat: null, lng: null, formatted_address:null};
      }

    } catch (error) {
      Logger.log(`❌ Geocoding error: ${error.message}`);
      return {plus_code: null, lat: null, lng: null, formatted_address:null};
    }
  }

  /**
   * Test geocoding with sample Trinidad addresses
   */
  function testGeocoding() {
    Logger.log('=== TESTING GEOCODING ===');

    const testAddresses = [
      'San Pedro Road, Pool Village, Rio Claro, Trinidad and Tobago',
      'Queen Street, Port of Spain, Trinidad and Tobago',
      'San Fernando, Trinidad and Tobago',
      'Arima, Trinidad and Tobago'
    ];

    testAddresses.forEach(address => {
      Logger.log(`\nTesting: ${address}`);
      const result = geocodeAddress(address);
      Logger.log(`Plus Code: ${result.plus_code || 'Not found'}`);
      Logger.log(`Lat/Lng: ${result.lat}, ${result.lng}`);
      Logger.log(`Formatted: ${result.formatted_address || 'N/A'}`);

      // Rate limit between tests
      Utilities.sleep(1000);
    });

    Logger.log('\n=== TEST COMPLETE ===');
  }

  /**
   * Clear geocoding cache (run if you need fresh lookups)
   */
  function clearGeocodingCache() {
    const cache = CacheService.getScriptCache();
    cache.removeAll(['geo_']);
    Logger.log('✓ Geocoding cache cleared');
  }