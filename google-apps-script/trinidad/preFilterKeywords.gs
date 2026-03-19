
// ============================================================================
// KEYWORD FILTER SYSTEM
// ============================================================================

/**
 * Load keywords from "Crime Filter Keywords" sheet
 * Results are cached for 1 hour to improve performance
 * @returns {Array} Array of keyword objects {category, keyword, weight, active, country}
 */
function loadKeywords() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'crime_keywords_cache';

  // Try cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    Logger.log('✅ Using cached keywords');
    return JSON.parse(cached);
  }

  // Load from sheet
  Logger.log('📥 Loading keywords from sheet...');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PREFILTER_CONFIG.KEYWORD_SHEET);

  if (!sheet) {
    Logger.log(`⚠️ "${PREFILTER_CONFIG.KEYWORD_SHEET}" sheet not found. Keyword filtering disabled.`);
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const keywords = [];

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Only include active keywords
    if (row[3] === true || row[3] === 'TRUE') {
      keywords.push({
        category: row[0],
        keyword: row[1].toString().toLowerCase(),
        weight: parseFloat(row[2]) || 0,
        active: true,
        country: row[4],
        notes: row[5] || ''
      });
    }
  }

  // Cache for 1 hour
  cache.put(cacheKey, JSON.stringify(keywords), PREFILTER_CONFIG.KEYWORD_CACHE_DURATION / 1000);
  Logger.log(`✅ Loaded ${keywords.length} active keywords`);

  return keywords;
}

/**
 * Force refresh keyword cache
 * Run this manually after updating the Keywords sheet
 */
function refreshKeywordCache() {
  const cache = CacheService.getScriptCache();
  cache.remove('crime_keywords_cache');
  Logger.log('🗑️ Keyword cache cleared');

  const keywords = loadKeywords();
  Logger.log(`✅ Keyword cache refreshed with ${keywords.length} keywords`);
}

/**
 * Calculate crime score for an article based on keyword matching
 * @param {string} title - Article headline
 * @param {string} text - Article full text (optional, uses title if not provided)
 * @returns {Object} {score, matchedKeywords, reason}
 */
function scoreArticle(title, text) {
  const keywords = loadKeywords();

  if (keywords.length === 0) {
    Logger.log('⚠️ No keywords loaded, skipping score calculation');
    return { score: 0, matchedKeywords: [], reason: 'No keywords configured' };
  }

  // Combine title and text, convert to lowercase
  const content = `${title || ''} ${text || ''}`.toLowerCase();

  let totalScore = 0;
  const matchedKeywords = [];

  // Check each keyword
  for (const kw of keywords) {
    if (content.includes(kw.keyword)) {
      totalScore += kw.weight;
      matchedKeywords.push({
        keyword: kw.keyword,
        weight: kw.weight,
        category: kw.category
      });
    }
  }

  // Determine reason
  let reason = '';
  if (totalScore >= PREFILTER_CONFIG.SCORE_THRESHOLD_HIGH) {
    reason = 'Very likely crime (high score)';
  } else if (totalScore >= PREFILTER_CONFIG.SCORE_THRESHOLD_MEDIUM) {
    reason = 'Probable crime (medium score)';
  } else if (totalScore >= PREFILTER_CONFIG.SCORE_THRESHOLD_LOW) {
    reason = 'Possible crime (low score, risky)';
  } else if (totalScore < 0) {
    reason = 'Likely not crime (negative score - court/non-crime)';
  } else {
    reason = 'Weak crime signal (insufficient keywords)';
  }

  return {
    score: totalScore,
    matchedKeywords: matchedKeywords,
    reason: reason
  };
}


// ============================================================================
// FILTERED OUT ARTICLES LOGGING
// ============================================================================

/**
 * Log filtered out article to tracking sheet
 * @param {Object} article - Article data
 * @param {string} filterReason - Why it was filtered
 * @param {number} score - Keyword score
 * @param {Array} matchedKeywords - Keywords that matched
 */
function logFilteredArticle(article, filterReason, score, matchedKeywords) {
  try {
    const sheet = getOrCreateFilteredOutSheet();

    const keywordsSummary = matchedKeywords
      .map(kw => `${kw.keyword}(${kw.weight})`)
      .join(', ');

    sheet.appendRow([
      new Date(),                    // Date Filtered
      article.title || '',           // Article Title
      article.url || '',             // Article URL
      filterReason,                  // Filter Reason
      score,                         // Keyword Score
      keywordsSummary,               // Keywords Matched
      'Pending',                     // Manual Review Status
      '',                            // Action Taken
      ''                             // Notes
    ]);

    Logger.log(`📝 Logged filtered article: ${article.title.substring(0, 50)}...`);

  } catch (error) {
    Logger.log(`⚠️ Error logging filtered article: ${error.message}`);
  }
}

/**
 * Get or create Filtered Out Articles sheet
 * @returns {Sheet}
 */
function getOrCreateFilteredOutSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(PREFILTER_CONFIG.FILTERED_OUT_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(PREFILTER_CONFIG.FILTERED_OUT_SHEET);
    sheet.appendRow([
      'Date Filtered',
      'Article Title',
      'Article URL',
      'Filter Reason',
      'Keyword Score',
      'Keywords Matched',
      'Manual Review Status',
      'Action Taken',
      'Notes'
    ]);
    Logger.log(`✅ Created "${PREFILTER_CONFIG.FILTERED_OUT_SHEET}" sheet`);
  }

  return sheet;
}

// ============================================================================
// API USAGE TRACKING
// ============================================================================

/**
 * Log Gemini API call
 * @param {Object} article - Article being processed
 * @param {boolean} success - Whether call succeeded
 * @param {string} errorMessage - Error message if failed
 */
function logApiUsage(article, success, errorMessage = '') {
  try {
    const sheet = getOrCreateApiTrackerSheet();

    sheet.appendRow([
      new Date(),                           // Date
      new Date().getHours(),                // Hour
      article.title || '',                  // Article Title
      article.url || '',                    // Article URL
      success ? 'Success' : 'Error',        // Success/Error
      errorMessage                          // Error Message
    ]);

  } catch (error) {
    Logger.log(`⚠️ Error logging API usage: ${error.message}`);
  }
}

/**
 * Get or create API Usage Tracker sheet
 * @returns {Sheet}
 */
function getOrCreateApiTrackerSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(PREFILTER_CONFIG.API_TRACKER_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(PREFILTER_CONFIG.API_TRACKER_SHEET);
    sheet.appendRow([
      'Date',
      'Hour',
      'Article Title',
      'Article URL',
      'Success/Error',
      'Error Message'
    ]);
    Logger.log(`✅ Created "${PREFILTER_CONFIG.API_TRACKER_SHEET}" sheet`);
  }

  return sheet;
}
