/**
 * MASTER ORCHESTRATOR — JAMAICA (Split Triggers)
 * Separates RSS collection from processing for optimal efficiency.
 *
 * Adapted from: google-apps-script/trinidad/orchestrator.gs
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TRIGGER SCHEDULE (Jamaica — UTC, fully offset from T&T to prevent Claude quota clash)
 * Run setupAllTriggers() once in the Jamaica GAS editor to activate.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * T&T runs:   RSS@10, Fetch@11, Claude@12 | RSS@18, Fetch@19, Claude@20 | RSS@2, Fetch@3, Claude@4
 * Jamaica:    RSS@14, Fetch@15, Claude@16 | RSS@22, Fetch@23, Claude@0  | RSS@6, Fetch@7, Claude@8
 *
 * 1. runRSSCollection()      → 3x daily (14:00, 22:00, 06:00 UTC)
 *    - Fetches new articles from 4 Jamaica RSS feeds
 *    - JCF feed updated hourly — 3x/day captures all crime posts
 *
 * 2. runTextFetchAndFilter() → 3x daily, 1hr after RSS (15:00, 23:00, 07:00 UTC)
 *    - Stage 2: Fetch article full text
 *    - Stage 3: Pre-filter (keyword scoring + duplicate detection)
 *
 * 3. runAIProcessing()       → 3x daily, 1hr after fetch (16:00, 00:00, 08:00 UTC)
 *    - Stage 4: Claude Haiku extraction → Production (≥7) or Review Queue (<7)
 *    - Capacity: 5 articles/run × 3 runs = 15 articles/day
 *    - Claude calls are fully separated from T&T's hours (12, 20, 4 UTC)
 *
 * syncProductionToLive → manual (Kavell runs this directly in the sheet editor)
 *
 * NOTE: GAS atHour() fires within a 1-hour window — no two Jamaica Claude runs
 *       share a UTC hour with any T&T Claude run.
 */

function runFullPipeline() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   CRIME HOTSPOTS - FILTERING PIPELINE        ');
  Logger.log('   (Manual Review Workflow)                   ');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');
  Logger.log(`Started: ${new Date().toLocaleString()}`);
  Logger.log('');

  const stats = {
    rssCollected: 0,
    textFetched: 0,
    preFilterPassed: 0,
    preFilterFiltered: 0,
    groqProcessed: 0,        // Articles processed by Groq
    toProduction: 0,         // High-confidence crimes → Production
    toReviewQueue: 0,        // Low-confidence crimes → Review Queue
    groqSkipped: 0,          // Not crime articles
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
    Logger.log('   (Extracts main content, removes sidebars/ads)');
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
    Logger.log('   - Keyword scoring (0-100 scale)');
    Logger.log('   - Duplicate detection (80%+ similarity)');
    Logger.log('   - Auto-filters non-crime articles (court, sports)');
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
    // STAGE 4: GROQ AI PROCESSING (Re-enabled Jan 15, 2026)
    // ═══════════════════════════════════════════════════════════
    Logger.log('───────────────────────────────────────────────────');
    Logger.log('STAGE 4: Groq AI Processing');
    Logger.log('   - Extract crime data with llama-3.1-8b-instant');
    Logger.log('   - High confidence (7+) → Production sheet');
    Logger.log('   - Low confidence (<7) → Review Queue');
    Logger.log('───────────────────────────────────────────────────');

    const readyCount = countArticlesByStatus('ready_for_processing');

    if (readyCount > 0) {
      Logger.log(`Found ${readyCount} articles ready for Groq processing`);

      // Get counts before processing
      const beforeProd = getSheetRowCount(SHEET_NAMES.PRODUCTION);
      const beforeReview = getSheetRowCount(SHEET_NAMES.REVIEW_QUEUE);

      // Run Groq processing
      processReadyArticles();

      // Get counts after processing
      const afterProd = getSheetRowCount(SHEET_NAMES.PRODUCTION);
      const afterReview = getSheetRowCount(SHEET_NAMES.REVIEW_QUEUE);

      stats.groqProcessed = readyCount;
      stats.toProduction = afterProd - beforeProd;
      stats.toReviewQueue = afterReview - beforeReview;
      stats.groqSkipped = readyCount - stats.toProduction - stats.toReviewQueue;

      Logger.log(`✅ Stage 4 complete: ${stats.groqProcessed} articles processed`);
      Logger.log(`   → Production: ${stats.toProduction} crimes`);
      Logger.log(`   → Review Queue: ${stats.toReviewQueue} crimes`);
      Logger.log(`   → Skipped (not crimes): ${stats.groqSkipped} articles`);
    } else {
      Logger.log('ℹ️ No articles ready for processing.');
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
 * Get row count for a sheet (excluding header)
 * Used to calculate how many crimes were added by Groq
 */
function getSheetRowCount(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    return 0;
  }

  const lastRow = sheet.getLastRow();
  return lastRow > 1 ? lastRow - 1 : 0; // Subtract 1 for header row
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
  Logger.log('');
  Logger.log(`Groq Processed:       ${stats.groqProcessed} articles`);
  Logger.log(`  → Production:       ${stats.toProduction} crimes (high confidence)`);
  Logger.log(`  → Review Queue:     ${stats.toReviewQueue} crimes (low confidence)`);
  Logger.log(`  → Skipped:          ${stats.groqSkipped} articles (not crimes)`);
  Logger.log('');
  Logger.log(`API Calls Saved:      ~${stats.preFilterFiltered} articles pre-filtered`);
  Logger.log(`                      (saves ${(stats.preFilterFiltered / (stats.preFilterPassed + stats.preFilterFiltered) * 100).toFixed(0)}% of API calls)`);
  Logger.log('');
  Logger.log(`Total Time:           ${elapsedMinutes} minutes`);
  Logger.log(`Completed:            ${new Date().toLocaleString()}`);
  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');
  Logger.log('📝 NEXT STEPS:');
  Logger.log('   1. Open "Production" sheet → Review high-confidence crimes');
  Logger.log('   2. Open "Review Queue" sheet → Review low-confidence crimes');
  Logger.log('   3. Approve crimes → Move to Live sheet (feeds website)');
  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
}

// ═══════════════════════════════════════════════════════════════════════════
// SPLIT TRIGGER FUNCTIONS (Added Jan 17, 2026)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RSS COLLECTION ONLY
 * Schedule: 3x daily (6am, 2pm, 10pm Trinidad time)
 *
 * - Fetches new articles from all enabled RSS feeds
 * - RSS feeds are ephemeral, articles disappear after a few days
 * - Tracks last fetch time for monitoring
 */
function runRSSCollection() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   RSS COLLECTION (Scheduled 3x Daily)         ');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');
  Logger.log(`Started: ${new Date().toLocaleString()}`);
  Logger.log('');

  const startTime = Date.now();

  try {
    // Collect RSS feeds
    Logger.log('───────────────────────────────────────────────────');
    Logger.log('Fetching RSS feeds from all sources...');
    Logger.log('───────────────────────────────────────────────────');

    const articlesCollected = collectAllFeeds();

    // Track last RSS fetch time
    setLastRSSFetchTime();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    Logger.log('');
    Logger.log('═══════════════════════════════════════════════');
    Logger.log('   RSS COLLECTION COMPLETE                     ');
    Logger.log('═══════════════════════════════════════════════');
    Logger.log(`Articles collected: ${articlesCollected}`);
    Logger.log(`Time elapsed: ${elapsed}s`);
    Logger.log(`Next processing run will handle these articles.`);
    Logger.log('═══════════════════════════════════════════════');

  } catch (error) {
    Logger.log(`❌ RSS Collection Error: ${error.message}`);
    Logger.log(`Stack: ${error.stack}`);
    sendErrorNotification(error);
  }
}

/**
 * PROCESSING PIPELINE ONLY (Stages 2-4)
 * Schedule: Every 2 hours (12 runs/day)
 *
 * - Stage 2: Fetch article text for "pending" articles
 * - Stage 3: Pre-filter articles (keywords + duplicates)
 * - Stage 4: Groq AI extraction → Production or Review Queue
 *
 * Capacity: 5 articles/run × 12 runs = 60 articles/day
 */
function runProcessingPipeline() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   PROCESSING PIPELINE (Scheduled Every 2hrs)  ');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');
  Logger.log(`Started: ${new Date().toLocaleString()}`);
  Logger.log(`Last RSS fetch: ${getLastRSSFetchTime() || 'Never'}`);
  Logger.log('');

  const stats = {
    textFetched: 0,
    preFilterPassed: 0,
    preFilterFiltered: 0,
    groqProcessed: 0,
    toProduction: 0,
    toReviewQueue: 0,
    groqSkipped: 0
  };

  const startTime = Date.now();

  try {
    // ═══════════════════════════════════════════════════════════
    // STAGE 2: TEXT FETCHING
    // ═══════════════════════════════════════════════════════════
    Logger.log('───────────────────────────────────────────────────');
    Logger.log('STAGE 2: Article Text Fetching');
    Logger.log('───────────────────────────────────────────────────');

    const pendingCount = countArticlesByStatus('pending');
    Logger.log(`Found ${pendingCount} articles with status "pending"`);

    if (pendingCount > 0) {
      const fetchResult = fetchPendingArticlesImproved();
      stats.textFetched = fetchResult.success;
      Logger.log(`✅ Fetched: ${stats.textFetched} articles`);
    } else {
      Logger.log('ℹ️ No pending articles. Skipping Stage 2.');
    }
    Logger.log('');

    // ═══════════════════════════════════════════════════════════
    // STAGE 3: PRE-FILTERING
    // ═══════════════════════════════════════════════════════════
    Logger.log('───────────────────────────────────────────────────');
    Logger.log('STAGE 3: Pre-Filtering (Keywords + Duplicates)');
    Logger.log('───────────────────────────────────────────────────');

    const textFetchedCount = countArticlesByStatus('text_fetched');
    Logger.log(`Found ${textFetchedCount} articles with status "text_fetched"`);

    if (textFetchedCount > 0) {
      preFilterArticles();
      const preFilterStats = getPreFilterStats();
      stats.preFilterPassed = preFilterStats.readyForProcessing;
      stats.preFilterFiltered = preFilterStats.filteredOut;
      Logger.log(`✅ Passed: ${stats.preFilterPassed}, Filtered: ${stats.preFilterFiltered}`);
    } else {
      Logger.log('ℹ️ No text_fetched articles. Skipping Stage 3.');
    }
    Logger.log('');

    // ═══════════════════════════════════════════════════════════
    // STAGE 4: GROQ AI PROCESSING
    // ═══════════════════════════════════════════════════════════
    Logger.log('───────────────────────────────────────────────────');
    Logger.log('STAGE 4: Groq AI Processing');
    Logger.log('───────────────────────────────────────────────────');

    const readyCount = countArticlesByStatus('ready_for_processing');
    Logger.log(`Found ${readyCount} articles ready for Groq processing`);

    if (readyCount > 0) {
      const beforeProd = getSheetRowCount(SHEET_NAMES.PRODUCTION);
      const beforeReview = getSheetRowCount(SHEET_NAMES.REVIEW_QUEUE);

      processReadyArticles();

      const afterProd = getSheetRowCount(SHEET_NAMES.PRODUCTION);
      const afterReview = getSheetRowCount(SHEET_NAMES.REVIEW_QUEUE);

      stats.groqProcessed = Math.min(readyCount, PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN);
      stats.toProduction = afterProd - beforeProd;
      stats.toReviewQueue = afterReview - beforeReview;
      stats.groqSkipped = stats.groqProcessed - stats.toProduction - stats.toReviewQueue;

      Logger.log(`✅ Processed: ${stats.groqProcessed} articles`);
      Logger.log(`   → Production: ${stats.toProduction}`);
      Logger.log(`   → Review Queue: ${stats.toReviewQueue}`);
      Logger.log(`   → Skipped: ${stats.groqSkipped}`);
    } else {
      Logger.log('ℹ️ No articles ready for processing.');
    }
    Logger.log('');

  } catch (error) {
    Logger.log(`❌ Processing Error: ${error.message}`);
    Logger.log(`Stack: ${error.stack}`);
    sendErrorNotification(error);
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const remainingReady = countArticlesByStatus('ready_for_processing');

  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   PROCESSING PIPELINE COMPLETE                ');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log(`Text fetched:     ${stats.textFetched}`);
  Logger.log(`Pre-filter pass:  ${stats.preFilterPassed}`);
  Logger.log(`Pre-filter block: ${stats.preFilterFiltered}`);
  Logger.log(`Groq processed:   ${stats.groqProcessed}`);
  Logger.log(`  → Production:   ${stats.toProduction}`);
  Logger.log(`  → Review Queue: ${stats.toReviewQueue}`);
  Logger.log('');
  Logger.log(`Backlog remaining: ${remainingReady} articles ready_for_processing`);
  Logger.log(`Time elapsed: ${elapsed} minutes`);
  Logger.log('═══════════════════════════════════════════════');
}

/**
 * Track last RSS fetch time (for monitoring)
 */
function setLastRSSFetchTime() {
  PropertiesService.getScriptProperties().setProperty(
    'LAST_RSS_FETCH',
    new Date().toISOString()
  );
}

/**
 * Get last RSS fetch time
 * @returns {string|null} ISO timestamp or null
 */
function getLastRSSFetchTime() {
  const timestamp = PropertiesService.getScriptProperties().getProperty('LAST_RSS_FETCH');
  if (timestamp) {
    return new Date(timestamp).toLocaleString();
  }
  return null;
}

/**
 * Check processing backlog status (useful for monitoring)
 * Run manually to see current queue state
 */
function checkQueueStatus() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   QUEUE STATUS CHECK                          ');
  Logger.log('═══════════════════════════════════════════════');

  const pending = countArticlesByStatus('pending');
  const textFetched = countArticlesByStatus('text_fetched');
  const ready = countArticlesByStatus('ready_for_processing');
  const processing = countArticlesByStatus('processing');

  Logger.log(`Last RSS fetch: ${getLastRSSFetchTime() || 'Never'}`);
  Logger.log('');
  Logger.log('Queue Status:');
  Logger.log(`  pending:              ${pending} (need text fetch)`);
  Logger.log(`  text_fetched:         ${textFetched} (need pre-filter)`);
  Logger.log(`  ready_for_processing: ${ready} (need Groq)`);
  Logger.log(`  processing:           ${processing} (in progress)`);
  Logger.log('');
  Logger.log(`Total backlog: ${pending + textFetched + ready} articles`);

  // Estimate time to clear
  const totalBacklog = pending + textFetched + ready;
  const runsNeeded = Math.ceil(totalBacklog / PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN);
  const hoursNeeded = runsNeeded * 2; // 2 hours between runs

  Logger.log(`Estimated runs to clear: ${runsNeeded}`);
  Logger.log(`Estimated time to clear: ~${hoursNeeded} hours`);
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

// ═══════════════════════════════════════════════════════════════════════════
// SPLIT STAGE WRAPPERS (Added Mar 2026)
// Separates runProcessingPipeline() into two triggers to avoid 6-min limit.
//
// TRIGGER SCHEDULE (set up via setupAllTriggers()):
//   runRSSCollection()       14:00, 22:00, 06:00 UTC → Stage 1: collect feeds
//   runTextFetchAndFilter()  15:00, 23:00, 07:00 UTC → Stages 2+3: fetch + pre-filter
//   runAIProcessing()        16:00, 00:00, 08:00 UTC → Stage 4: Claude extraction
// ═══════════════════════════════════════════════════════════════════════════

/**
 * STAGES 2+3 ONLY: Text fetching + pre-filtering
 * Runs 1 hour after runRSSCollection().
 * Fast (<2 min) — safe to combine.
 */
function runTextFetchAndFilter() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   STAGES 2+3: Text Fetch + Pre-Filter         ');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log(`Started: ${new Date().toLocaleString()}`);

  const startTime = Date.now();

  try {
    // Stage 2: Text fetching
    const pendingCount = countArticlesByStatus('pending');
    Logger.log(`Stage 2 — pending: ${pendingCount}`);
    if (pendingCount > 0) {
      const fetchResult = fetchPendingArticlesImproved();
      Logger.log(`✅ Stage 2 done: ${fetchResult.success} articles fetched`);
    } else {
      Logger.log('ℹ️ Stage 2 — nothing to fetch');
    }

    // Stage 3: Pre-filtering
    const textFetchedCount = countArticlesByStatus('text_fetched');
    Logger.log(`Stage 3 — text_fetched: ${textFetchedCount}`);
    if (textFetchedCount > 0) {
      preFilterArticles();
      const stats = getPreFilterStats();
      Logger.log(`✅ Stage 3 done: ${stats.readyForProcessing} passed, ${stats.filteredOut} filtered`);
    } else {
      Logger.log('ℹ️ Stage 3 — nothing to filter');
    }

  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    sendErrorNotification(error);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  Logger.log(`Completed in ${elapsed}s`);
  Logger.log('═══════════════════════════════════════════════');
}

/**
 * STAGE 4 ONLY: Claude AI extraction
 * Runs 1 hour after runTextFetchAndFilter().
 * Isolated so 30s-per-article delays don't risk timeout.
 */
function runAIProcessing() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   STAGE 4: Claude AI Processing               ');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log(`Started: ${new Date().toLocaleString()}`);

  const startTime = Date.now();

  try {
    const readyCount = countArticlesByStatus('ready_for_processing');
    Logger.log(`ready_for_processing: ${readyCount}`);

    if (readyCount > 0) {
      const beforeProd = getSheetRowCount(SHEET_NAMES.PRODUCTION);
      const beforeReview = getSheetRowCount(SHEET_NAMES.REVIEW_QUEUE);

      processReadyArticles();

      const toProduction = getSheetRowCount(SHEET_NAMES.PRODUCTION) - beforeProd;
      const toReview = getSheetRowCount(SHEET_NAMES.REVIEW_QUEUE) - beforeReview;

      Logger.log(`✅ Stage 4 done: → Production: ${toProduction}, Review Queue: ${toReview}`);
    } else {
      Logger.log('ℹ️ Nothing ready for processing');
    }

  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    sendErrorNotification(error);
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  Logger.log(`Completed in ${elapsed} min`);
  Logger.log('═══════════════════════════════════════════════');
}

// ═══════════════════════════════════════════════════════════════════════════
// TRIGGER SETUP (Run once manually — do NOT set as a trigger itself)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates all Jamaica pipeline triggers.
 * Run this ONCE manually in the Jamaica Apps Script editor.
 * Deletes any existing triggers first to avoid duplicates.
 *
 * After running, verify with: ScriptApp.getProjectTriggers().forEach(t => Logger.log(t.getHandlerFunction() + ' @ ' + t.getTriggerSource()))
 *
 * syncProductionToLive is intentionally excluded — run manually in the sheet editor.
 *
 * Jamaica UTC schedule (fully offset from T&T):
 *   runRSSCollection       → 14:00, 22:00, 06:00 UTC
 *   runTextFetchAndFilter  → 15:00, 23:00, 07:00 UTC
 *   runAIProcessing        → 16:00, 00:00, 08:00 UTC
 *
 * T&T UTC schedule (for reference — do not duplicate):
 *   runRSSCollection       → 10:00, 18:00, 02:00 UTC
 *   runTextFetchAndFilter  → 11:00, 19:00, 03:00 UTC
 *   runAIProcessing        → 12:00, 20:00, 04:00 UTC
 */
function setupAllTriggers() {
  // Delete all existing triggers first
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log('✅ Deleted all existing triggers');

  const triggerDefs = [
    { fn: 'runRSSCollection',      hours: [14, 22, 6]  },
    { fn: 'runTextFetchAndFilter', hours: [15, 23, 7]  },
    { fn: 'runAIProcessing',       hours: [16, 0,  8]  }
    // syncProductionToLive — manual only, no trigger
  ];

  let created = 0;

  triggerDefs.forEach(({ fn, hours }) => {
    hours.forEach(hour => {
      ScriptApp.newTrigger(fn)
        .timeBased()
        .atHour(hour)
        .everyDays(1)
        .create();
      created++;
    });
    Logger.log(`✅ ${fn}: scheduled at UTC hours ${hours.join(', ')}`);
  });

  Logger.log('');
  Logger.log(`Total triggers created: ${created}`);
  Logger.log('Run ScriptApp.getProjectTriggers() to verify.');
}

/**
 * Test the full pipeline manually
 */
function testFullPipeline() {
  Logger.log('🧪 TESTING FILTERING PIPELINE (Manual Run)');
  Logger.log('');
  runFullPipeline();
}
