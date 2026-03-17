/**
 * Configuration file for Crime Hotspots Automated Pipeline — JAMAICA
 * PRODUCTION VERSION 1.0
 *
 * Adapted from: google-apps-script/trinidad/config.gs
 * Country: Jamaica | 14 parishes | 4 RSS sources + JCF RSS
 *
 * Last Updated: 2026-03-17
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
  const apiKey = 'YOUR_API_KEY_HERE'; // REPLACE THIS WITH YOUR ACTUAL API KEY

  if (apiKey === 'YOUR_API_KEY_HERE') {
    Logger.log('❌ ERROR: You must replace YOUR_API_KEY_HERE with your actual API key');
    throw new Error('API key not configured');
  }

  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
  Logger.log('✅ API key saved securely to Script Properties');
}

/**                                                                                                                          
  * Get Groq API key from Script Properties (secure storage)                                                                  
  * @returns {string|null} API key or null if not set                                                                         
  */                                                                                                                          
function getGroqApiKey() {                                                                                                   
  return PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');                                                
}                                                                                                                            
                                                                                                                              
/**                                                                                                                          
  * Set Groq API key (run once manually to store securely)                                                                    
  * IMPORTANT: Replace 'YOUR_API_KEY_HERE' with your actual key before running                                                
  *                                                                                                                           
  * SECURITY WARNING: Never commit actual API keys to version control                                                         
  */                                                                                                                          
function setGroqApiKey() {                                                                                                   
  const apiKey = 'YOUR_API_KEY_HERE'; // REPLACE THIS WITH YOUR ACTUAL GROQ API KEY                                          
                                                                                                                              
  if (apiKey === 'YOUR_API_KEY_HERE') {                                                                                      
    Logger.log('❌ ERROR: You must replace YOUR_API_KEY_HERE with your actual Groq API key');                                
    throw new Error('Groq API key not configured');                                                                          
  }                                                                                                                          
                                                                                                                              
  PropertiesService.getScriptProperties().setProperty('GROQ_API_KEY', apiKey);                                               
  Logger.log('✅ Groq API key saved securely to Script Properties');                                                         
}                                                                                                                            
                                                                                                                              
/**
  * Verify Groq API key is set (utility function for debugging)
  */
function verifyGroqApiKey() {
  const apiKey = getGroqApiKey();
  if (apiKey) {
    Logger.log(`✅ Groq API key is set (length: ${apiKey.length} characters)`);
    return true;
  } else {
    Logger.log('❌ Groq API key is NOT set. Run setGroqApiKey() first.');
    return false;
  }
}

// ============================================================================
// CLAUDE API KEY MANAGEMENT (NEW - Jan 2026)
// ============================================================================

/**
 * Get Claude API key from Script Properties (secure storage)
 * @returns {string|null} API key or null if not set
 */
function getClaudeApiKey() {
  return PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
}

/**
 * Set Claude API key (run once manually to store securely)
 * IMPORTANT: Replace 'YOUR_API_KEY_HERE' with your actual key before running
 *
 * SECURITY WARNING: Never commit actual API keys to version control
 */
function setClaudeApiKey() {
  const apiKey = 'YOUR_API_KEY_HERE'; // REPLACE THIS WITH YOUR ACTUAL CLAUDE API KEY

  if (apiKey === 'YOUR_API_KEY_HERE') {
    Logger.log('❌ ERROR: You must replace YOUR_API_KEY_HERE with your actual Claude API key');
    throw new Error('Claude API key not configured');
  }

  PropertiesService.getScriptProperties().setProperty('CLAUDE_API_KEY', apiKey);
  Logger.log('✅ Claude API key saved securely to Script Properties');
}

/**
 * Verify Claude API key is set (utility function for debugging)
 */
function verifyClaudeApiKey() {
  const apiKey = getClaudeApiKey();
  if (apiKey) {
    Logger.log(`✅ Claude API key is set (length: ${apiKey.length} characters)`);
    return true;
  } else {
    Logger.log('❌ Claude API key is NOT set. Run setClaudeApiKey() first.');
    return false;
  }
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
// GROQ API CONFIGURATION                                                                                                    
// ============================================================================                                              
                                                                                                                              
/**                                                                                                                          
  * Groq API endpoint using llama-3.1-8b-instant model                                                                        
  * Free tier: 14,400 requests/day (vs Gemini's 20/day)                                                                       
  */                                                                                                                          
const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';                                                 
                                                                                                                              
/**                                                                                                                          
  * Groq generation configuration                                                                                             
  * Optimized for factual crime data extraction                                                                               
  */                                                                                                                          
const GROQ_CONFIG = {
  model: 'llama-3.1-8b-instant',  // Fast, accurate, 14.4K RPD free tier
  temperature: 0.1,                // Low temperature = more deterministic
  max_tokens: 2048,                // Reduced from 4096 to save tokens (enough for multi-crime JSON)
  top_p: 1
};

// ============================================================================
// CLAUDE API CONFIGURATION (PRIMARY - Jan 2026)
// ============================================================================

/**
 * Claude API endpoint (Anthropic)
 * Model: Claude Haiku 4.5 - Fast, affordable, reliable
 * Cost: ~$2.70/month for 20 articles/day
 */
const CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';

/**
 * Claude generation configuration
 * Optimized for factual crime data extraction with minimal hallucinations
 */
const CLAUDE_CONFIG = {
  model: 'claude-haiku-4-5-20251001',  // Haiku 4.5: Current model ($1/$5 per million tokens)
  max_tokens: 4096,                     // MUST stay at 4096 — multi-crime articles with full schema can exceed 2048
  temperature: 0.1                      // Low temperature = more deterministic (top_p removed for Claude 4.5)
};

// ============================================================================
// GEMINI API CONFIGURATION (LEGACY - Kept for backward compatibility)
// ============================================================================

/**
 * DEPRECATED: Gemini API endpoint (replaced by Groq)
 * Kept for compatibility with logConfigStatus() and any legacy code
 */
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

/**
 * DEPRECATED: Gemini generation config (replaced by Groq)
 */
const GEMINI_CONFIG = {
  temperature: 0.1,
  maxOutputTokens: 4096,
  topK: 1,
  topP: 1
};

// ============================================================================
// SHEET CONFIGURATION
// ============================================================================

/**
 * Sheet names used throughout the application.
 * All sheets must exist in the Jamaica Google Sheet before running.
 *
 * Tab mapping (user's short names → full names expected here):
 *   RA  = Raw Articles
 *   Production = Production
 *   RQ  = Review Queue
 *   PA  = Production Archive
 *   A   = Archive
 *
 * NOTE: LIVE sheet lives in a SEPARATE spreadsheet (see syncToLive.gs → LIVE_SHEET_ID).
 * FOA / RAA / CFK tabs in your sheet are not referenced by the pipeline — safe to keep or remove.
 */
const SHEET_NAMES = {
  RAW_ARTICLES: 'Raw Articles',
  PRODUCTION: 'Production',
  PRODUCTION_ARCHIVE: 'Production Archive',
  REVIEW_QUEUE: 'Review Queue',
  PROCESSING_QUEUE: 'Processing Queue',
  ARCHIVE: 'Archive'
};

// ============================================================================
// JAMAICA GEOGRAPHY
// ============================================================================

/**
 * Jamaica bounding box (WGS84)
 * Used by geocoder / map config validation.
 */
const JAMAICA_BOUNDS = {
  north: 18.53,
  south: 17.70,
  east:  -76.18,
  west:  -78.37
};

/** Default map center (Kingston) */
const JAMAICA_CENTER = { lat: 17.9970, lng: -76.7936 };

/**
 * All 14 parishes in official order.
 * Used for area validation and parish-level page routing.
 * HIGH-volume parishes (>10% of violent crime): St. Andrew, St. Catherine, Kingston, St. James.
 */
const JAMAICA_PARISHES = [
  'Kingston',
  'St. Andrew',
  'St. Thomas',
  'Portland',
  'St. Mary',
  'St. Ann',
  'Trelawny',
  'St. James',
  'Hanover',
  'Westmoreland',
  'St. Elizabeth',
  'Manchester',
  'Clarendon',
  'St. Catherine'
];

// ============================================================================
// NEWS SOURCES (SINGLE SOURCE OF TRUTH)
// ============================================================================

/**
 * RSS feed configuration for Jamaica news sources.
 * This is the ONLY place where feeds should be defined.
 * rssCollector.gs references this configuration.
 *
 * Sources (in priority order):
 *   1. Observer Crime Watch — crime-filtered feed, includes parish tags. Best signal/noise.
 *   2. Jamaica Gleaner       — general news; pre-filter handles non-crime noise.
 *   3. Jamaica Star          — tabloid, heavy crime focus.
 *   4. JCF (police)          — official press releases; police-confirmed, highest confidence.
 *                              Pre-filter needed: also posts recruitment, witness notices etc.
 *
 * Facebook sources (no RSS — use Facebook Submitter web app):
 *   TVJ, CVM TV, Nationwide 90FM, RJR News — see docs/guides/JAMAICA-INTEGRATION-PLAN.md
 */
const NEWS_SOURCES = [
  {
    name: "Jamaica Observer Crime Watch",
    country: "JM",
    rssUrl: "https://www.jamaicaobserver.com/category/crime-watch/feed/",
    enabled: true,
    priority: 1, // Crime-filtered feed — best signal-to-noise. Often includes parish in tags.
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "home invasion", "gunman", "praedial", "lottery scam", "lotto scam", "fraud", "extortion"]
  },
  {
    name: "Jamaica Gleaner",
    country: "JM",
    rssUrl: "https://jamaica-gleaner.com/feed/news.xml",
    enabled: true,
    priority: 1,
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "home invasion", "gunman", "praedial", "lottery scam", "lotto scam", "fraud", "extortion"]
  },
  {
    name: "Jamaica Star",
    country: "JM",
    rssUrl: "http://jamaica-star.com/rss/news/feed",
    enabled: true,
    priority: 2, // Tabloid — heavy crime focus but occasional sensationalism. Pre-filter handles noise.
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "home invasion", "gunman", "praedial", "lottery scam", "lotto scam", "fraud", "extortion"]
  },
  {
    name: "Jamaica Constabulary Force",
    country: "JM",
    rssUrl: "https://jcf.gov.jm/feed/",
    enabled: true,
    priority: 1, // Police-confirmed press releases — highest confidence source.
    // NOTE: Also posts recruitment, "Witness for Court", commissioner statements, road safety.
    // Pre-filter keyword scoring handles this noise well (crime posts score high, others score low).
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "victim", "attack", "gang", "arrest", "wanted", "gunman", "homicide", "fatally", "apprehended", "seized", "operation"]
  }
];

// ============================================================================
// PROCESSING CONFIGURATION
// ============================================================================

/**
 * Pipeline processing limits and thresholds
 * Configured for Groq free tier (14,400 requests/day, 30 requests/minute)
 *
 * Updated Jan 17, 2026: Optimized for faster backlog clearing
 * - Increased MAX_ARTICLES_PER_RUN: 3 → 5
 * - Reduced RATE_LIMIT_DELAY: 60s → 30s (Groq handles 30 req/min easily)
 * - Capacity: 5 articles × 12 runs/day = 60 articles/day
 */
const PROCESSING_CONFIG = {
  CONFIDENCE_THRESHOLD: 7,     // Articles below this go to review queue
  MAX_ARTICLES_PER_RUN: 5,     // Process 5 articles per run (30s delay each = ~2.5 min)
  MAX_EXECUTION_TIME_MS: 270000, // 4.5 minutes (270 seconds) - buffer before 6min limit
  MAX_FETCH_PER_RUN: 15,       // Article text fetching limit per run (increased from 10)
  RATE_LIMIT_DELAY: 30000,     // 30 seconds between API calls (Groq handles 30 req/min)
  FETCH_DELAY: 2000            // Milliseconds between article fetches
};

// ============================================================================
// NOTIFICATION CONFIGURATION
// ============================================================================

/**
 * Email address for daily summaries and alerts
 * CHANGE THIS to your email address
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
      'Publish Date', 'Status', 'Notes'
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
  Logger.log('=== CONFIGURATION STATUS ===');
  Logger.log(`Claude API Endpoint: ${CLAUDE_API_ENDPOINT}`);
  Logger.log(`Claude Model:        ${CLAUDE_CONFIG.model}`);
  Logger.log(`Claude Max Tokens:   ${CLAUDE_CONFIG.max_tokens}`);
  Logger.log(`Claude Temperature:  ${CLAUDE_CONFIG.temperature}`);
  Logger.log(`Claude API Key Set:  ${getClaudeApiKey() ? 'YES' : 'NO'}`);
  Logger.log('---');
  Logger.log(`Groq API Key Set (legacy): ${getGroqApiKey() ? 'YES' : 'NO'}`);
  Logger.log(`Gemini API Key Set (legacy): ${getGeminiApiKey() ? 'YES' : 'NO'}`);
  Logger.log('---');
  Logger.log(`Notification Email: ${NOTIFICATION_EMAIL}`);
  Logger.log(`Active News Sources: ${NEWS_SOURCES.filter(s => s.enabled).length}`);
  Logger.log(`Confidence Threshold: ${PROCESSING_CONFIG.CONFIDENCE_THRESHOLD}`);
  Logger.log(`Max Articles Per Run: ${PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN}`);
  Logger.log(`Rate Limit Delay: ${PROCESSING_CONFIG.RATE_LIMIT_DELAY / 1000}s between Claude calls`);
  Logger.log(`Max Fetch Per Run: ${PROCESSING_CONFIG.MAX_FETCH_PER_RUN}`);
  Logger.log('===========================');
}

/**
 * Last Updated: 2026-03-17 (Jamaica adaptation)
 * Production Version: 1.0
 */
