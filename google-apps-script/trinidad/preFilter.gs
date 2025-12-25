/**
 * Pre-Filter System for Crime Articles
 *
 * Filters articles BEFORE Gemini API calls to save tokens and stay within free tier limits.
 *
 * Three-stage filtering:
 * 1. Keyword Scoring: Weighted keyword matching against "Crime Filter Keywords" sheet
 * 2. Duplicate Detection: Check against Production + Production Archive
 * 3. Geographic Filter: Ensure article is about Trinidad/Tobago
 *
 * Articles that pass all filters are marked "ready_for_processing" for Gemini extraction.
 * Articles that fail are logged to "Filtered Out Articles" sheet for review.
 *
 * Last Updated: 2025-12-08
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const PREFILTER_CONFIG = {
  // Keyword sheet name
  KEYWORD_SHEET: 'Crime Filter Keywords',

  // Filtered out articles logging
  FILTERED_OUT_SHEET: 'Filtered Out Articles',

  // API usage tracking
  API_TRACKER_SHEET: 'API Usage Tracker',

  // Scoring thresholds
  SCORE_THRESHOLD_HIGH: 15,    // Very likely crime
  SCORE_THRESHOLD_MEDIUM: 10,  // Probable crime
  SCORE_THRESHOLD_LOW: 5,      // Possible crime (risky)

  // Minimum score to send to Gemini
  MIN_SCORE_TO_PROCESS: 10,

  // Duplicate detection similarity threshold (0-100%)
  DUPLICATE_SIMILARITY_THRESHOLD: 80,

  // Cache duration for keywords (milliseconds)
  KEYWORD_CACHE_DURATION: 3600000  // 1 hour
};

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
// URL INDEX CACHE (Performance Optimization)
// ============================================================================

/**
 * Build URL index from multiple sheets for fast duplicate checking
 * Caches individual sheets separately (Raw Archive not cached - too large)
 * @returns {Object} URL index by sheet name
 */
function buildUrlIndex() {
  const cache = CacheService.getScriptCache();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('📥 Building URL index from sheets...');
  const startTime = Date.now();

  const urlIndex = {
    rawArticles: [],
    rawArchive: [],
    production: [],
    productionArchive: []
  };

  // Try to get Raw Articles from cache
  const cachedRaw = cache.get('url_index_raw');
  if (cachedRaw) {
    urlIndex.rawArticles = JSON.parse(cachedRaw);
    Logger.log('   ✓ Raw Articles from cache');
  } else {
    try {
      const rawSheet = ss.getSheetByName(SHEET_NAMES.RAW_ARTICLES);
      if (rawSheet && rawSheet.getLastRow() > 1) {
        const urls = rawSheet.getRange(2, 4, rawSheet.getLastRow() - 1, 1).getValues();
        urlIndex.rawArticles = urls.flat().filter(url => url);
        cache.put('url_index_raw', JSON.stringify(urlIndex.rawArticles), 3600);
      }
    } catch (e) {
      Logger.log(`⚠️ Error indexing Raw Articles: ${e.message}`);
    }
  }

  // Raw Archive - DON'T CACHE (1516 URLs = ~121 KB, exceeds 100 KB limit)
  // Build on demand each time - acceptable since only checked once per article
  try {
    const archiveSheet = ss.getSheetByName('Raw Articles Archive');
    if (archiveSheet && archiveSheet.getLastRow() > 1) {
      const urls = archiveSheet.getRange(2, 4, archiveSheet.getLastRow() - 1, 1).getValues();
      urlIndex.rawArchive = urls.flat().filter(url => url);
    }
  } catch (e) {
    Logger.log(`⚠️ Error indexing Raw Articles Archive: ${e.message}`);
  }

  // Try to get Production from cache
  const cachedProd = cache.get('url_index_production');
  if (cachedProd) {
    urlIndex.production = JSON.parse(cachedProd);
    Logger.log('   ✓ Production from cache');
  } else {
    try {
      const prodSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTION);
      if (prodSheet && prodSheet.getLastRow() > 1) {
        const urls = prodSheet.getRange(2, 8, prodSheet.getLastRow() - 1, 1).getValues();
        urlIndex.production = urls.flat().filter(url => url);
        cache.put('url_index_production', JSON.stringify(urlIndex.production), 3600);
      }
    } catch (e) {
      Logger.log(`⚠️ Error indexing Production: ${e.message}`);
    }
  }

  // Production Archive - DON'T CACHE (will grow large over time)
  // Read on-demand like Raw Archive
  try {
    const prodArchiveSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTION_ARCHIVE);
    if (prodArchiveSheet && prodArchiveSheet.getLastRow() > 1) {
      const urls = prodArchiveSheet.getRange(2, 8, prodArchiveSheet.getLastRow() - 1, 1).getValues();
      urlIndex.productionArchive = urls.flat().filter(url => url);
    }
  } catch (e) {
    Logger.log(`⚠️ Error indexing Production Archive: ${e.message}`);
  }

  const elapsed = Date.now() - startTime;
  Logger.log(`✅ URL index built in ${elapsed}ms`);
  Logger.log(`   - Raw Articles: ${urlIndex.rawArticles.length} URLs (cached)`);
  Logger.log(`   - Raw Archive: ${urlIndex.rawArchive.length} URLs (not cached - too large)`);
  Logger.log(`   - Production: ${urlIndex.production.length} URLs (cached)`);
  Logger.log(`   - Production Archive: ${urlIndex.productionArchive.length} URLs (not cached - will grow)`);

  return urlIndex;
}

/**
 * Force refresh URL index cache
 * Run this after bulk operations or when cache seems stale
 */
function refreshUrlIndexCache() {
  const cache = CacheService.getScriptCache();

  // Remove cached keys only (Raw Archive & Production Archive not cached)
  cache.remove('url_index_raw');
  cache.remove('url_index_production');

  Logger.log('🗑️ URL index cache cleared (small sheets only)');

  const index = buildUrlIndex();
  Logger.log('✅ URL index cache refreshed');
  return index;
}

/**
 * Debug: Diagnose Raw Articles - Archive sheet structure
 * Run this to figure out why 0 URLs are being found
 */
function debugRawArchiveSheet() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   DEBUGGING RAW ARTICLES - ARCHIVE SHEET');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetNames = ss.getSheets().map(sheet => sheet.getName());

  Logger.log('All sheet names in spreadsheet:');
  sheetNames.forEach((name, index) => {
    Logger.log(`  ${index + 1}. "${name}"`);
  });
  Logger.log('');

  // Try different possible names
  const possibleNames = [
    'Raw Articles - Archive',
    'Raw Articles-Archive',
    'Raw Articles Archive',
    'RawArticles-Archive',
    'Raw_Articles_Archive'
  ];

  Logger.log('Trying different sheet name variations:');
  Logger.log('');

  possibleNames.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      Logger.log(`✅ FOUND: "${name}"`);
      Logger.log(`   Total rows: ${sheet.getLastRow()}`);
      Logger.log(`   Total columns: ${sheet.getLastColumn()}`);

      // Check first few rows
      if (sheet.getLastRow() > 0) {
        const headers = sheet.getRange(1, 1, 1, Math.min(8, sheet.getLastColumn())).getValues()[0];
        Logger.log(`   Headers: ${headers.join(' | ')}`);

        if (sheet.getLastRow() > 1) {
          // Check column D (URL column - 0-indexed = 3)
          const firstDataRow = sheet.getRange(2, 1, 1, Math.min(8, sheet.getLastColumn())).getValues()[0];
          Logger.log(`   First data row:`);
          firstDataRow.forEach((val, idx) => {
            Logger.log(`     Col ${String.fromCharCode(65 + idx)}: ${val ? val.toString().substring(0, 50) : '(empty)'}`);
          });

          // Count non-empty URLs in column D
          if (sheet.getLastColumn() >= 4) {
            const urlColumn = sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).getValues();
            const nonEmptyUrls = urlColumn.filter(row => row[0] && row[0].toString().trim().length > 0).length;
            Logger.log(`   URLs in Column D: ${nonEmptyUrls} non-empty out of ${sheet.getLastRow() - 1} rows`);
          }
        }
      }
      Logger.log('');
    } else {
      Logger.log(`❌ NOT FOUND: "${name}"`);
    }
  });

  Logger.log('═══════════════════════════════════════════════');
  Logger.log('DIAGNOSIS:');
  Logger.log('');
  Logger.log('If no sheet was found:');
  Logger.log('  → Copy the EXACT sheet name from your spreadsheet tab');
  Logger.log('  → Share it with me');
  Logger.log('');
  Logger.log('If sheet was found but 0 URLs:');
  Logger.log('  → Check if URLs are in Column D');
  Logger.log('  → Check if Column D has data');
  Logger.log('═══════════════════════════════════════════════');
}

// ============================================================================
// DUPLICATE DETECTION ENHANCEMENT
// ============================================================================

/**
 * Calculate string similarity (0-100%)
 * Uses Levenshtein distance algorithm
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity percentage (0-100)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 100;

  const editDistance = levenshteinDistance(longer, shorter);
  return Math.round(((longer.length - editDistance) / longer.length) * 100);
}

/**
 * Levenshtein distance calculation
 * @param {string} str1
 * @param {string} str2
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * PRE-GEMINI: Check if raw article is duplicate (SAVE API CALLS)
 * Checks 3 sheets: Raw Articles, Raw Articles - Archive, Production (URL only)
 *
 * @param {string} title - Article title (RSS headline)
 * @param {string} url - Article URL
 * @param {Date} publishedDate - Article publication date
 * @returns {Object} {isDuplicate, matchedIn, matchedRow, similarity, reason}
 */
function checkForRawArticleDuplicate(title, url, publishedDate) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Build/get URL index for fast lookups
    const urlIndex = buildUrlIndex();

    // NOTE: We skip checking Raw Articles because the articles being tested
    // are IN Raw Articles, so they would all match themselves!
    // We only check historical/processed sheets below.

    // ═══════════════════════════════════════════════════════════
    // CHECK 1: Raw Articles Archive (Historical - 1517+ rows)
    // ═══════════════════════════════════════════════════════════
    if (urlIndex.rawArchive.includes(url)) {
      return {
        isDuplicate: true,
        matchedIn: 'Raw Articles - Archive',
        matchedRow: null,
        similarity: 100,
        reason: 'Exact URL match (historical)'
      };
    }

    // Also check headline similarity in Archive (slower, but necessary)
    const archiveSheet = ss.getSheetByName('Raw Articles Archive');
    if (archiveSheet) {
      const headlineCheck = checkSheetForHeadlineSimilarity(archiveSheet, title, 3); // Column C
      if (headlineCheck.isDuplicate) {
        return {
          ...headlineCheck,
          matchedIn: 'Raw Articles - Archive'
        };
      }
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 2: Production (URL ONLY - already processed)
    // ═══════════════════════════════════════════════════════════
    if (urlIndex.production.includes(url)) {
      return {
        isDuplicate: true,
        matchedIn: 'Production',
        matchedRow: null,
        similarity: 100,
        reason: 'Article already processed (URL in Production)'
      };
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 3: Production Archive (URL ONLY - processed & archived)
    // ═══════════════════════════════════════════════════════════
    if (urlIndex.productionArchive.includes(url)) {
      return {
        isDuplicate: true,
        matchedIn: 'Production Archive',
        matchedRow: null,
        similarity: 100,
        reason: 'Article already processed and archived (URL in Production Archive)'
      };
    }

    // Not a duplicate - safe to process
    return {
      isDuplicate: false,
      matchedIn: null,
      matchedRow: null,
      similarity: 0,
      reason: 'No duplicate found - safe to process'
    };

  } catch (error) {
    Logger.log(`⚠️ Error checking raw article duplicates: ${error.message}`);
    return {
      isDuplicate: false,
      matchedIn: null,
      matchedRow: null,
      similarity: 0,
      reason: `Error: ${error.message}`
    };
  }
}

/**
 * POST-GEMINI: Check if extracted crime is duplicate (PREVENT DUPLICATE CRIMES)
 * Checks 2 sheets: Production, Production Archive
 * Uses crime-level matching: Victim + Date + Location, Headline similarity
 *
 * @param {string} title - Crime headline (Gemini-generated)
 * @param {string} url - Article URL
 * @param {Object} crimeData - Extracted crime data (victim, date, location)
 * @returns {Object} {isDuplicate, matchedIn, matchedRow, similarity, reason}
 */
function checkForCrimeDuplicate(title, url, crimeData) {
  try {
    // Check Production first
    const prodSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PRODUCTION);
    if (prodSheet) {
      const prodCheck = checkSheetForCrimeDuplicate(prodSheet, title, url, crimeData);
      if (prodCheck.isDuplicate) {
        return {
          ...prodCheck,
          matchedIn: 'Production'
        };
      }
    }

    // Check Production Archive
    const archiveSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PRODUCTION_ARCHIVE);
    if (archiveSheet) {
      const archiveCheck = checkSheetForCrimeDuplicate(archiveSheet, title, url, crimeData);
      if (archiveCheck.isDuplicate) {
        return {
          ...archiveCheck,
          matchedIn: 'Production Archive'
        };
      }
    }

    // Not a duplicate
    return {
      isDuplicate: false,
      matchedIn: null,
      matchedRow: null,
      similarity: 0,
      reason: 'No crime duplicate found'
    };

  } catch (error) {
    Logger.log(`⚠️ Error checking crime duplicates: ${error.message}`);
    return {
      isDuplicate: false,
      matchedIn: null,
      matchedRow: null,
      similarity: 0,
      reason: `Error: ${error.message}`
    };
  }
}

/**
 * Check sheet for headline similarity (for Raw Articles sheets)
 * @param {Sheet} sheet - Sheet to check
 * @param {string} title - Article title to match
 * @param {number} titleColumn - Column number for title (0-indexed)
 * @returns {Object} Duplicate check result
 */
function checkSheetForHeadlineSimilarity(sheet, title, titleColumn) {
  if (!sheet || !title) {
    return { isDuplicate: false, matchedRow: null, similarity: 0, reason: 'Invalid input' };
  }

  try {
    const data = sheet.getDataRange().getValues();

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const existingTitle = data[i][titleColumn];

      if (existingTitle) {
        const similarity = calculateSimilarity(existingTitle.toString(), title.toString());

        if (similarity >= PREFILTER_CONFIG.DUPLICATE_SIMILARITY_THRESHOLD) {
          return {
            isDuplicate: true,
            matchedRow: i + 1,
            similarity: similarity,
            reason: `Headline ${similarity}% similar`
          };
        }
      }
    }

    return {
      isDuplicate: false,
      matchedRow: null,
      similarity: 0,
      reason: 'No similar headline found'
    };

  } catch (error) {
    Logger.log(`⚠️ Error checking headline similarity: ${error.message}`);
    return { isDuplicate: false, matchedRow: null, similarity: 0, reason: `Error: ${error.message}` };
  }
}

/**
 * Check sheet for crime-level duplicates (for Production sheets)
 * Uses victim name + date + location matching and headline similarity
 * @param {Sheet} sheet - Sheet to check
 * @param {string} title - Crime headline (Gemini-generated)
 * @param {string} url - Article URL
 * @param {Object} crimeData - {victimName, crimeDate, area, street}
 * @returns {Object} Duplicate check result
 */
function checkSheetForCrimeDuplicate(sheet, title, url, crimeData) {
  if (!sheet) {
    return { isDuplicate: false, matchedRow: null, similarity: 0, reason: 'Sheet not found' };
  }

  try {
    const data = sheet.getDataRange().getValues();

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const existingHeadline = row[1]; // Column B
      const existingArea = row[5];     // Column F
      const existingUrl = row[7];      // Column H

      // Exact URL match
      if (existingUrl && url && existingUrl.toString() === url.toString()) {
        return {
          isDuplicate: true,
          matchedRow: i + 1,
          similarity: 100,
          reason: 'Exact URL match'
        };
      }

      // Headline similarity check
      if (existingHeadline && title) {
        const similarity = calculateSimilarity(existingHeadline.toString(), title.toString());

        if (similarity >= PREFILTER_CONFIG.DUPLICATE_SIMILARITY_THRESHOLD) {
          return {
            isDuplicate: true,
            matchedRow: i + 1,
            similarity: similarity,
            reason: `Crime headline ${similarity}% similar`
          };
        }
      }

      // TODO: Future enhancement - Victim + Date + Location matching
      // This would require parsing victim names from headlines
      // and comparing crime dates + areas
    }

    return {
      isDuplicate: false,
      matchedRow: null,
      similarity: 0,
      reason: 'No crime duplicate found'
    };

  } catch (error) {
    Logger.log(`⚠️ Error checking crime duplicates: ${error.message}`);
    return { isDuplicate: false, matchedRow: null, similarity: 0, reason: `Error: ${error.message}` };
  }
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

// ============================================================================
// MAIN PRE-FILTER ORCHESTRATOR
// ============================================================================

/**
 * Pre-filter articles in Raw Articles sheet
 * Runs BEFORE Gemini extraction to save API calls
 *
 * This function:
 * 1. Finds articles with status "text_fetched"
 * 2. Runs keyword scoring
 * 3. Checks for duplicates
 * 4. Updates status to "ready_for_processing" or "filtered_out"
 * 5. Logs filtered articles for review
 */
function preFilterArticles() {
  Logger.log('=== STARTING PRE-FILTER ===');

  const sheet = getActiveSheet(SHEET_NAMES.RAW_ARTICLES);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log('No articles to pre-filter');
    return;
  }

  const dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
  const data = dataRange.getValues();

  let articlesProcessed = 0;
  let passedCount = 0;
  let filteredCount = 0;

  const filterStats = {
    lowScore: 0,
    duplicate: 0,
    negativeScore: 0
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const status = row[6]; // Column G

    // Only process articles that have full text fetched
    if (status === 'text_fetched') {
      const rowNumber = i + 2;

      const article = {
        title: row[2],         // Column C
        url: row[3],           // Column D
        fullText: row[4],      // Column E
        publishedDate: row[5]  // Column F
      };

      Logger.log(`\n🔍 Pre-filtering row ${rowNumber}: ${article.title.substring(0, 50)}...`);

      // ═══════════════════════════════════════════
      // STAGE 1: Keyword Scoring
      // ═══════════════════════════════════════════
      const scoring = scoreArticle(article.title, article.fullText);
      Logger.log(`   Score: ${scoring.score} (${scoring.matchedKeywords.length} keywords matched)`);
      Logger.log(`   Reason: ${scoring.reason}`);

      // Negative score = court case, sports, etc.
      if (scoring.score < 0) {
        sheet.getRange(rowNumber, 7).setValue('filtered_out');
        sheet.getRange(rowNumber, 8).setValue(`Filtered: ${scoring.reason} (score: ${scoring.score})`);
        logFilteredArticle(article, scoring.reason, scoring.score, scoring.matchedKeywords);
        filterStats.negativeScore++;
        filteredCount++;
        articlesProcessed++;
        continue;
      }

      // Too low score
      if (scoring.score < PREFILTER_CONFIG.MIN_SCORE_TO_PROCESS) {
        sheet.getRange(rowNumber, 7).setValue('filtered_out');
        sheet.getRange(rowNumber, 8).setValue(`Filtered: Low score (${scoring.score}), likely not crime`);
        logFilteredArticle(article, 'Low keyword score', scoring.score, scoring.matchedKeywords);
        filterStats.lowScore++;
        filteredCount++;
        articlesProcessed++;
        continue;
      }

      // ═══════════════════════════════════════════
      // STAGE 2: Duplicate Detection (3 Sheets)
      // ═══════════════════════════════════════════
      const dupCheck = checkForRawArticleDuplicate(article.title, article.url, article.publishedDate);

      if (dupCheck.isDuplicate) {
        Logger.log(`   ⚠️ Duplicate found in ${dupCheck.matchedIn} (${dupCheck.reason})`);
        sheet.getRange(rowNumber, 7).setValue('duplicate_found');
        sheet.getRange(rowNumber, 8).setValue(`Duplicate: ${dupCheck.matchedIn} - ${dupCheck.reason}`);
        logFilteredArticle(article, `Duplicate in ${dupCheck.matchedIn}`, scoring.score, scoring.matchedKeywords);
        filterStats.duplicate++;
        filteredCount++;
        articlesProcessed++;
        continue;
      }

      // ═══════════════════════════════════════════
      // PASSED ALL FILTERS - Ready for Gemini
      // ═══════════════════════════════════════════
      Logger.log(`   ✅ PASSED - Ready for Gemini extraction`);
      sheet.getRange(rowNumber, 7).setValue('ready_for_processing');
      sheet.getRange(rowNumber, 8).setValue(`Score: ${scoring.score}, ${scoring.matchedKeywords.length} keywords matched`);
      passedCount++;
      articlesProcessed++;
    }
  }

  Logger.log('\n=== PRE-FILTER COMPLETE ===');
  Logger.log(`Articles processed: ${articlesProcessed}`);
  Logger.log(`✅ Passed (ready for Gemini): ${passedCount}`);
  Logger.log(`🚫 Filtered out: ${filteredCount}`);
  Logger.log(`   - Low score: ${filterStats.lowScore}`);
  Logger.log(`   - Duplicates: ${filterStats.duplicate}`);
  Logger.log(`   - Negative score (court/non-crime): ${filterStats.negativeScore}`);
  Logger.log('===========================');
}

// ============================================================================
// MANUAL OVERRIDE FUNCTIONS
// ============================================================================

/**
 * Promote a filtered article back to processing
 * Use when you find a crime in "Filtered Out Articles" sheet
 *
 * @param {number} filteredOutRowNumber - Row number in Filtered Out Articles sheet
 */
function promoteFilteredArticle(filteredOutRowNumber) {
  const filteredSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(PREFILTER_CONFIG.FILTERED_OUT_SHEET);

  if (!filteredSheet) {
    Logger.log('❌ Filtered Out Articles sheet not found');
    return;
  }

  // Get article URL from filtered sheet
  const articleUrl = filteredSheet.getRange(filteredOutRowNumber, 3).getValue();

  if (!articleUrl) {
    Logger.log('❌ No URL found in that row');
    return;
  }

  // Find article in Raw Articles
  const rawSheet = getActiveSheet(SHEET_NAMES.RAW_ARTICLES);
  const rawData = rawSheet.getDataRange().getValues();

  for (let i = 1; i < rawData.length; i++) {
    if (rawData[i][3] === articleUrl) {  // Column D (URL)
      const rowNumber = i + 1;
      rawSheet.getRange(rowNumber, 7).setValue('ready_for_processing');
      rawSheet.getRange(rowNumber, 8).setValue('Manually promoted from filtered list');

      // Update filtered sheet
      filteredSheet.getRange(filteredOutRowNumber, 7).setValue('Promoted');
      filteredSheet.getRange(filteredOutRowNumber, 8).setValue(`Moved to processing on ${new Date()}`);

      Logger.log(`✅ Promoted article back to processing: ${rawData[i][2]}`);
      return;
    }
  }

  Logger.log('❌ Article not found in Raw Articles sheet');
}

/**
 * Test keyword scoring on a sample article
 * @param {string} title - Article title
 * @param {string} text - Article text (optional)
 */
function testKeywordScoring(title, text = '') {
  Logger.log('=== TESTING KEYWORD SCORING ===');
  Logger.log(`Title: ${title}`);
  Logger.log('');

  const result = scoreArticle(title, text);

  Logger.log(`Score: ${result.score}`);
  Logger.log(`Reason: ${result.reason}`);
  Logger.log(`Matched Keywords (${result.matchedKeywords.length}):`);

  result.matchedKeywords.forEach(kw => {
    Logger.log(`  - ${kw.keyword} (${kw.weight}) [${kw.category}]`);
  });

  Logger.log('');
  Logger.log(`Decision: ${result.score >= PREFILTER_CONFIG.MIN_SCORE_TO_PROCESS ? '✅ PASS - Send to Gemini' : '🚫 FILTER - Skip Gemini'}`);
  Logger.log('===============================');
}

// ============================================================================
// AUTO-ARCHIVING FUNCTIONS
// ============================================================================

/**
 * Auto-archive processed articles from Raw Articles to Raw Articles - Archive
 * Moves articles that are:
 * - Older than specified days (default 30)
 * - Status: completed, skipped, filtered_out, duplicate_found
 *
 * Run this monthly to keep Raw Articles sheet manageable
 */
function autoArchiveProcessedArticles(daysOld = 30) {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   AUTO-ARCHIVING PROCESSED ARTICLES');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName(SHEET_NAMES.RAW_ARTICLES);
  const archiveSheet = ss.getSheetByName('Raw Articles - Archive');

  if (!rawSheet) {
    Logger.log('❌ Raw Articles sheet not found');
    return;
  }

  if (!archiveSheet) {
    Logger.log('❌ Raw Articles - Archive sheet not found');
    Logger.log('💡 Create this sheet manually first with same structure as Raw Articles');
    return;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  Logger.log(`Archiving articles older than ${daysOld} days (before ${cutoffDate.toLocaleDateString()})`);
  Logger.log('');

  const data = rawSheet.getDataRange().getValues();
  const rowsToArchive = [];

  // Find rows to archive (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const timestamp = new Date(row[0]); // Column A
    const status = row[6];               // Column G

    const archivableStatuses = ['completed', 'skipped', 'filtered_out', 'duplicate_found'];

    if (timestamp < cutoffDate && archivableStatuses.includes(status)) {
      rowsToArchive.push({
        rowNumber: i + 1,
        rowData: row
      });
    }
  }

  if (rowsToArchive.length === 0) {
    Logger.log(`✅ No articles to archive (0 older than ${daysOld} days with completed/skipped status)`);
    Logger.log('═══════════════════════════════════════════════');
    return;
  }

  Logger.log(`Found ${rowsToArchive.length} articles to archive`);
  Logger.log('');

  // Append to archive sheet
  rowsToArchive.forEach(item => {
    archiveSheet.appendRow(item.rowData);
  });

  Logger.log(`✅ Copied ${rowsToArchive.length} rows to Archive sheet`);

  // Delete from Raw Articles (in reverse order to maintain row numbers)
  Logger.log('🗑️ Deleting archived rows from Raw Articles...');
  rowsToArchive.reverse().forEach(item => {
    rawSheet.deleteRow(item.rowNumber);
  });

  Logger.log(`✅ Deleted ${rowsToArchive.length} rows from Raw Articles`);
  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('ARCHIVING COMPLETE');
  Logger.log(`Moved: ${rowsToArchive.length} articles`);
  Logger.log(`Raw Articles rows remaining: ${rawSheet.getLastRow() - 1}`);
  Logger.log(`Archive total rows: ${archiveSheet.getLastRow() - 1}`);
  Logger.log('═══════════════════════════════════════════════');

  // Refresh URL index cache after archiving
  Logger.log('');
  Logger.log('🔄 Refreshing URL index cache...');
  refreshUrlIndexCache();
  Logger.log('✅ Cache refreshed');
}

/**
 * Preview what would be archived (doesn't actually move anything)
 * @param {number} daysOld - Age threshold in days
 */
function previewArchivableArticles(daysOld = 30) {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   PREVIEW: Articles That Would Be Archived');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');

  const rawSheet = getActiveSheet(SHEET_NAMES.RAW_ARTICLES);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  Logger.log(`Looking for articles older than ${daysOld} days (before ${cutoffDate.toLocaleDateString()})`);
  Logger.log('');

  const data = rawSheet.getDataRange().getValues();
  const archivableRows = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const timestamp = new Date(row[0]);
    const status = row[6];

    const archivableStatuses = ['completed', 'skipped', 'filtered_out', 'duplicate_found'];

    if (timestamp < cutoffDate && archivableStatuses.includes(status)) {
      archivableRows.push({
        rowNumber: i + 1,
        timestamp: timestamp.toLocaleDateString(),
        title: row[2].substring(0, 60),
        status: status
      });
    }
  }

  if (archivableRows.length === 0) {
    Logger.log('✅ No articles would be archived');
  } else {
    Logger.log(`${archivableRows.length} articles would be archived:`);
    Logger.log('');

    archivableRows.slice(0, 10).forEach(item => {
      Logger.log(`Row ${item.rowNumber}: ${item.timestamp} - ${item.title}... [${item.status}]`);
    });

    if (archivableRows.length > 10) {
      Logger.log(`... and ${archivableRows.length - 10} more`);
    }
  }

  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log(`Total: ${archivableRows.length} articles would be moved`);
  Logger.log('');
  Logger.log('To actually archive these, run:');
  Logger.log('autoArchiveProcessedArticles(30)');
  Logger.log('═══════════════════════════════════════════════');
}
