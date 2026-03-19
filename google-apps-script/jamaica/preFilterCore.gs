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
