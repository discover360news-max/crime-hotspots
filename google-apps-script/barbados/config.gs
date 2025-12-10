/**
 * Configuration file for Crime Hotspots Automated Pipeline - BARBADOS
 * PRODUCTION VERSION 1.0
 *
 * SECURITY: This file contains API key setup. Follow security checklist before deployment.
 *
 * Last Updated: 2025-12-04
 */

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

/**
 * Get Gemini API key from Script Properties (secure storage)
 * @returns {string|null} API key or null if not set
 */
function getGeminiApiKey() {
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
}

/**
 * Set Gemini API key (run once manually to store securely)
 * IMPORTANT: Replace 'YOUR_API_KEY_HERE' with your actual key before running
 *
 * SECURITY WARNING: Never commit actual API keys to version control
 */
function setGeminiApiKey() {
  const apiKey = 'YOUR_API_KEY_HERE'; // Barbados Key is INDEPENDANT

  if (apiKey === 'YOUR_API_KEY_HERE') {
    Logger.log('❌ ERROR: You must replace YOUR_API_KEY_HERE with your actual API key');
    throw new Error('API key not configured');
  }

  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
  Logger.log('✅ API key saved securely to Script Properties');
}

/**
 * Get Geocoding API key (Maps API)
 * Falls back to Gemini key if separate geocoding key not set
 * @returns {string|null} API key or null if not set
 */
function getGeocodingApiKey() {
  // Try geocoding-specific key first
  const geocodingKey = PropertiesService.getScriptProperties().getProperty('GEOCODING_API_KEY');
  if (geocodingKey) {
    return geocodingKey;
  }

  // Fallback to Gemini key (works if Maps API is enabled for same key)
  return getGeminiApiKey();
}

/**
 * Set separate Geocoding API key (optional - run only if using different key)
 * If not set, geocoding will use Gemini API key (which must have Maps API enabled)
 *
 * SECURITY WARNING: Never commit actual API keys to version control
 */
function setGeocodingApiKey() {
  const apiKey = 'YOUR_GEOCODING_API_KEY_HERE'; // REPLACE THIS WITH YOUR ACTUAL KEY

  if (apiKey === 'YOUR_GEOCODING_API_KEY_HERE') {
    Logger.log('❌ ERROR: You must replace YOUR_GEOCODING_API_KEY_HERE with your actual API key');
    throw new Error('Geocoding API key not configured');
  }

  PropertiesService.getScriptProperties().setProperty('GEOCODING_API_KEY', apiKey);
  Logger.log('✅ Geocoding API key saved securely to Script Properties');
}

/**
 * Verify API key is set (utility function for debugging)
 */
function verifyApiKey() {
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    Logger.log(`✅ API key is set (length: ${apiKey.length} characters)`);
    return true;
  } else {
    Logger.log('❌ API key is NOT set. Run setGeminiApiKey() first.');
    return false;
  }
}

// ============================================================================
// GEMINI API CONFIGURATION
// ============================================================================

/**
 * Gemini API endpoint using gemini-flash-latest model
 * This is the current production model for the free tier
 */
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

/**
 * Gemini generation configuration
 * Optimized for factual crime data extraction with multi-crime support
 */
const GEMINI_CONFIG = {
  temperature: 0.1,        // Low temperature = more deterministic/factual
  maxOutputTokens: 4096,   // Increased from 2048 to support multi-crime extraction
  topK: 1,                 // Most likely token only
  topP: 1                  // Nucleus sampling disabled
};

// ============================================================================
// SHEET CONFIGURATION
// ============================================================================

/**
 * Sheet names used throughout the application
 * All sheets must exist before running the automation
 */
const SHEET_NAMES = {
  RAW_ARTICLES: 'Raw Articles',
  PRODUCTION: 'Production',
  PRODUCTION_ARCHIVE: 'Production Archive',
  REVIEW_QUEUE: 'Review Queue',
  PROCESSING_QUEUE: 'Processing Queue',
  ARCHIVE: 'Archive',
  LIVE: 'LIVE'
};

const RAW_ARTICLE_HEADERS = [
  'Timestamp', 'Source', 'Title', 'URL', 'Full Text',
  'Published Date', 'Status', 'Notes'
];

/**
 * Dynamically generates a mapping of column headers to their 0-based index
 * by reading the header row of the specified sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet object to read headers from.
 * @returns {Object} Map of {HEADER_NAME_UPPERCASE: 0_BASED_INDEX}
 */
function getDynamicColumnMap(sheet) {
  // Read the first row (headers)
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};

  headers.forEach((header, index) => {
    // Normalize header names for consistent key lookups (UPPERCASE_UNDERSCORE)
    const key = header.toUpperCase().replace(/\s/g, '_');
    map[key] = index;
  });

  return map;
}

// ============================================================================
// NEWS SOURCES (SINGLE SOURCE OF TRUTH)
// ============================================================================

/**
 * RSS feed configuration for Barbados news sources
 * This is the ONLY place where feeds should be defined
 * rssCollector.gs references this configuration
 */
const NEWS_SOURCES = [
  {
    name: "Barbados Today",
    country: "BB",
    rssUrl: "https://barbadostoday.bb/feed/",
    enabled: true,
    priority: 1, // Highest priority - established mainstream source
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "home invasion", "break-in", "theft", "stolen"]
  },
  {
    name: "Nation News",
    country: "BB",
    rssUrl: "https://nationnews.com/feed/",
    enabled: true,
    priority: 1, // Highest priority - established mainstream source
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "home invasion", "break-in", "theft", "stolen"]
  },
  {
    name: "Barbados Underground",
    country: "BB",
    rssUrl: "https://barbadosunderground.net/feed/",
    enabled: true,
    priority: 2, // Secondary priority - community blog
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "home invasion", "break-in", "theft", "stolen"]
  }
];

// ============================================================================
// PROCESSING CONFIGURATION
// ============================================================================

/**
 * Pipeline processing limits and thresholds
 * Configured for Gemini free tier (60 requests per minute)
 */
const PROCESSING_CONFIG = {
  CONFIDENCE_THRESHOLD: 7,     // Articles below this go to review queue
  MAX_ARTICLES_PER_RUN: 30,    // Increased from 10 - safer with better time checks
  MAX_EXECUTION_TIME_MS: 270000, // 4.5 minutes (270 seconds) - buffer before 6min limit
  MAX_FETCH_PER_RUN: 10,       // Article text fetching limit per run
  RATE_LIMIT_DELAY: 1000,      // Milliseconds between API calls
  FETCH_DELAY: 2000            // Milliseconds between article fetches
};

// ============================================================================
// BARBADOS GEOGRAPHIC CONFIGURATION
// ============================================================================

/**
 * Barbados parishes (11 total)
 * Used for geocoding and regional categorization
 */
const BARBADOS_PARISHES = [
  'Christ Church',
  'St. Andrew',
  'St. George',
  'St. James',
  'St. John',
  'St. Joseph',
  'St. Lucy',
  'St. Michael',
  'St. Peter',
  'St. Philip',
  'St. Thomas'
];

/**
 * Barbados major areas and landmarks
 * Used for more granular location identification
 */
const BARBADOS_AREAS = [
  // Capital and major towns
  'Bridgetown', 'Speightstown', 'Oistins', 'Holetown',

  // Popular areas
  'Black Rock', 'Six Cross Roads', 'Haggatt Hall', 'Warrens',
  'Wildey', 'Pine', 'Rendezvous', 'Bank Hall', 'Belleville',
  'Fontabelle', 'Cheapside', 'Tudor Street', 'Swan Street',

  // Coastal areas
  'South Coast', 'West Coast', 'East Coast', 'Platinum Coast',
  'Worthing', 'St. Lawrence Gap', 'Hastings', 'Rockley',

  // Popular beaches and landmarks
  'Carlisle Bay', 'Accra Beach', 'Mullins Beach', 'Crane Beach',
  'Bathsheba', 'Cattlewash'
];

/**
 * Barbados bounding box for geocoding validation
 * Ensures geocoded coordinates are actually in Barbados
 */
const BARBADOS_BOUNDS = {
  north: 13.35,
  south: 13.04,
  east: -59.42,
  west: -59.65
};

/**
 * Barbados center coordinates (Bridgetown)
 * Used as fallback when exact location cannot be determined
 */
const BARBADOS_CENTER = {
  lat: 13.1939,
  lng: -59.5432
};

// ============================================================================
// NOTIFICATION CONFIGURATION
// ============================================================================

/**
 * Email address for daily summaries and alerts
 */
const NOTIFICATION_EMAIL = 'discover360news@gmail.com';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get active spreadsheet sheet with error handling
 * @param {string} sheetName - Name of the sheet to retrieve
 * @returns {Sheet} Google Sheets sheet object
 */
function getActiveSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found. Please create it first.`);
  }

  return sheet;
}

/**
 * Get or create archive sheet
 * Called by maintenance functions to store old processed articles
 * @returns {Sheet} Archive sheet
 */
function getOrCreateArchiveSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.ARCHIVE);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.ARCHIVE);
    // Add headers matching Raw Articles structure
    sheet.appendRow([
      'Timestamp', 'Source', 'Title', 'URL', 'Full Text',
      'Published Date', 'Status', 'Notes'
    ]);
    Logger.log('✅ Created Archive sheet');
  }

  return sheet;
}

/**
 * Log configuration status (useful for debugging)
 * Run this to verify all settings before deploying triggers
 */
function logConfigStatus() {
  Logger.log('=== BARBADOS CONFIGURATION STATUS ===');
  Logger.log(`Gemini API Endpoint: ${GEMINI_API_ENDPOINT}`);
  Logger.log(`API Key Set: ${getGeminiApiKey() ? 'YES' : 'NO'}`);
  Logger.log(`Max Output Tokens: ${GEMINI_CONFIG.maxOutputTokens}`);
  Logger.log(`Notification Email: ${NOTIFICATION_EMAIL}`);
  Logger.log(`Active News Sources: ${NEWS_SOURCES.filter(s => s.enabled).length}`);
  Logger.log(`Confidence Threshold: ${PROCESSING_CONFIG.CONFIDENCE_THRESHOLD}`);
  Logger.log(`Max Articles Per Run: ${PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN}`);
  Logger.log(`Max Fetch Per Run: ${PROCESSING_CONFIG.MAX_FETCH_PER_RUN}`);
  Logger.log(`Total Parishes: ${BARBADOS_PARISHES.length}`);
  Logger.log('=====================================');
}

/**
 * Last Updated: 2025-12-04
 * Production Version: 1.0
 * Country: Barbados
 */
