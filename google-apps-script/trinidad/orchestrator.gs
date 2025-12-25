/**
 * MASTER ORCHESTRATOR
 * Runs the complete pipeline from RSS collection to Gemini processing
 *
 * Workflow:
 * 1. Collect RSS feeds
 * 2. Fetch article text
 * 3. Pre-filter articles (keyword scoring + duplicate detection)
 * 4. Process filtered articles with Gemini
 *
 * Schedule: Every 8 hours (8am, 4pm, 12am)
 */

function runFullPipeline() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('       CRIME HOTSPOTS - FULL PIPELINE         ');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');
  Logger.log(`Started: ${new Date().toLocaleString()}`);
  Logger.log('');

  const stats = {
    rssCollected: 0,
    textFetched: 0,
    preFilterPassed: 0,
    preFilterFiltered: 0,
    geminiCalls: 0,           // Gemini API calls made this run
    articlesProcessed: 0,     // Articles sent to Gemini
    errors: 0,                // API errors encountered
    totalTime: 0
  };

  const startTime = Date.now();

  try {
    // ═══════════════════════════════════════════════════════════
    // STAGE 1: RSS COLLECTION
    // ═══════════════════════════════════════════════════════════
    Logger.log('───────────────────────────────────────────────────');
    Logger.log('STAGE 1: RSS Collection');
    Logger.log('───────────────────────────────────────────────────');

    stats.rssCollected = collectAllFeeds();
    Logger.log(`✅ Stage 1 complete: ${stats.rssCollected} new articles collected`);
    Logger.log('');

    // ═══════════════════════════════════════════════════════════
    // STAGE 2: TEXT FETCHING
    // Check for articles with status "pending" (regardless of RSS results)
    // ═══════════════════════════════════════════════════════════
    Logger.log('───────────────────────────────────────────────────');
    Logger.log('STAGE 2: Article Text Fetching');
    Logger.log('───────────────────────────────────────────────────');

    const pendingCount = countArticlesByStatus('pending');
    Logger.log(`Found ${pendingCount} articles with status "pending"`);

    if (pendingCount > 0) {
      const fetchResult = fetchPendingArticlesImproved();
      stats.textFetched = fetchResult.success;
      Logger.log(`✅ Stage 2 complete: ${stats.textFetched} articles fetched`);
    } else {
      Logger.log('ℹ️ No pending articles to fetch. Skipping Stage 2.');
    }
    Logger.log('');

    // ═══════════════════════════════════════════════════════════
    // STAGE 3: PRE-FILTERING
    // Check for articles with status "text_fetched" (regardless of fetch results)
    // ═══════════════════════════════════════════════════════════
    Logger.log('───────────────────────────────────────────────────');
    Logger.log('STAGE 3: Pre-Filtering (Keyword Scoring + Duplicates)');
    Logger.log('───────────────────────────────────────────────────');

    const textFetchedCount = countArticlesByStatus('text_fetched');
    Logger.log(`Found ${textFetchedCount} articles with status "text_fetched"`);

    if (textFetchedCount > 0) {
      preFilterArticles();
      // Get counts after pre-filtering
      const preFilterStats = getPreFilterStats();
      stats.preFilterPassed = preFilterStats.readyForProcessing;
      stats.preFilterFiltered = preFilterStats.filteredOut;
      Logger.log(`✅ Stage 3 complete: ${stats.preFilterPassed} passed, ${stats.preFilterFiltered} filtered`);
    } else {
      Logger.log('ℹ️ No text_fetched articles to pre-filter. Skipping Stage 3.');
    }
    Logger.log('');

    // ═══════════════════════════════════════════════════════════
    // STAGE 4: GEMINI PROCESSING
    // Check for articles with status "ready_for_processing" (regardless of pre-filter results)
    // ═══════════════════════════════════════════════════════════
    Logger.log('───────────────────────────────────────────────────');
    Logger.log('STAGE 4: Gemini AI Processing');
    Logger.log('───────────────────────────────────────────────────');

    const readyCountBefore = countArticlesByStatus('ready_for_processing');
    Logger.log(`Found ${readyCountBefore} articles with status "ready_for_processing"`);

    if (readyCountBefore > 0) {
      processReadyArticles();

      // Count how many were processed
      const readyCountAfter = countArticlesByStatus('ready_for_processing');
      const processed = readyCountBefore - readyCountAfter;
      stats.articlesProcessed = processed;
      stats.geminiCalls = processed; // 1 API call per article

      // Count failures
      const failedCount = countArticlesByStatus('failed');
      stats.errors = failedCount;

      Logger.log(`✅ Stage 4 complete: ${processed} articles processed by Gemini`);
    } else {
      Logger.log('ℹ️ No ready_for_processing articles for Gemini. Skipping Stage 4.');
    }
    Logger.log('');

  } catch (error) {
    Logger.log('');
    Logger.log('❌ PIPELINE ERROR:');
    Logger.log(`   ${error.message}`);
    Logger.log(`   Stack: ${error.stack}`);
    Logger.log('');

    // Send error notification email (optional)
    sendErrorNotification(error);
  }

  // ═══════════════════════════════════════════════════════════
  // API USAGE TRACKING
  // ═══════════════════════════════════════════════════════════
  logApiUsage({
    geminiCalls: stats.geminiCalls,
    articlesProcessed: stats.articlesProcessed,
    preFilterSaved: stats.preFilterFiltered,
    errors: stats.errors,
    notes: ''
  });

  // Check if approaching API limit
  checkApiLimitWarning();

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  logPipelineSummary(stats, startTime);
}

/**
 * Count articles by status in Raw Articles sheet
 * Used to determine if each stage should run
 */
function countArticlesByStatus(targetStatus) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RAW_ARTICLES);

  if (!sheet || sheet.getLastRow() < 2) {
    return 0;
  }

  const data = sheet.getDataRange().getValues();
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    const status = data[i][6]; // Column G

    if (status === targetStatus) {
      count++;
    }
  }

  return count;
}

/**
 * Get pre-filter statistics from Raw Articles sheet
 */
function getPreFilterStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RAW_ARTICLES);

  if (!sheet || sheet.getLastRow() < 2) {
    return { readyForProcessing: 0, filteredOut: 0 };
  }

  const data = sheet.getDataRange().getValues();
  let readyCount = 0;
  let filteredCount = 0;

  for (let i = 1; i < data.length; i++) {
    const status = data[i][6]; // Column G

    if (status === 'ready_for_processing') {
      readyCount++;
    } else if (status === 'filtered_out') {
      filteredCount++;
    }
  }

  return {
    readyForProcessing: readyCount,
    filteredOut: filteredCount
  };
}

/**
 * Log pipeline summary
 */
function logPipelineSummary(stats, startTime) {
  const elapsed = Date.now() - startTime;
  const elapsedMinutes = (elapsed / 1000 / 60).toFixed(1);

  Logger.log('═══════════════════════════════════════════════');
  Logger.log('       PIPELINE SUMMARY                       ');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');
  Logger.log(`RSS Collected:        ${stats.rssCollected} articles`);
  Logger.log(`Text Fetched:         ${stats.textFetched} articles`);
  Logger.log(`Pre-Filter Passed:    ${stats.preFilterPassed} articles`);
  Logger.log(`Pre-Filter Blocked:   ${stats.preFilterFiltered} articles`);
  Logger.log(`Gemini Processed:     ${stats.articlesProcessed} articles`);
  Logger.log('');
  Logger.log(`Gemini API Calls:     ${stats.geminiCalls} (limit: 20/day)`);
  Logger.log(`API Call Savings:     ${stats.preFilterFiltered} calls avoided`);
  Logger.log(`Errors:               ${stats.errors}`);
  Logger.log('');
  Logger.log(`Total Time:           ${elapsedMinutes} minutes`);
  Logger.log(`Completed:            ${new Date().toLocaleString()}`);
  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
}

/**
 * Send error notification email (optional)
 */
function sendErrorNotification(error) {
  // Uncomment and configure if you want email alerts
  /*
  const recipient = 'your-email@example.com';
  const subject = 'Crime Hotspots Pipeline Error';
  const body = `Pipeline failed at ${new Date().toLocaleString()}\n\nError: ${error.message}\n\nStack:\n${error.stack}`;

  MailApp.sendEmail(recipient, subject, body);
  */
}

/**
 * Test the full pipeline manually
 */
function testFullPipeline() {
  Logger.log('🧪 TESTING FULL PIPELINE (Manual Run)');
  Logger.log('');
  runFullPipeline();
}
