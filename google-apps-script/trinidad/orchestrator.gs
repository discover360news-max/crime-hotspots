/**
 * MASTER ORCHESTRATOR (Manual Workflow - Updated Jan 1, 2026)
 * Runs article collection and filtering pipeline for manual review
 *
 * Workflow:
 * 1. Collect RSS feeds
 * 2. Fetch article text (removes sidebars, navigation)
 * 3. Pre-filter articles (keyword scoring + duplicate detection)
 * 4. [MANUAL REVIEW] - Review "ready_for_processing" articles and enter via Google Form
 *
 * NOTE: Gemini Stage 4 REMOVED - Manual data entry via Google Form now used
 * Articles scored high (10+) are marked "ready_for_processing" for your review
 *
 * Schedule: Every 8 hours (8am, 4pm, 12am)
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
    readyForReview: 0,  // Articles needing manual review
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
    // STAGE 4: MANUAL REVIEW (Replaces Gemini Processing)
    // ═══════════════════════════════════════════════════════════
    Logger.log('───────────────────────────────────────────────────');
    Logger.log('STAGE 4: Manual Review');
    Logger.log('───────────────────────────────────────────────────');

    const readyCount = countArticlesByStatus('ready_for_processing');
    stats.readyForReview = readyCount;

    if (readyCount > 0) {
      Logger.log(`📋 ${readyCount} articles ready for manual review`);
      Logger.log('');
      Logger.log('   ACTION REQUIRED:');
      Logger.log('   1. Open "Raw Articles" sheet');
      Logger.log('   2. Filter by status = "ready_for_processing"');
      Logger.log('   3. Review each article');
      Logger.log('   4. Submit crimes via Google Form:');
      Logger.log('      https://docs.google.com/forms/d/e/1FAIpQLSdiEp6DGiXl58GoQSEnRBMOsFXY962pn8khgFKnApuCq6pVCg/viewform');
      Logger.log('');
      Logger.log('✅ Stage 4 ready: Articles filtered and awaiting your review');
    } else {
      Logger.log('ℹ️ No articles ready for review.');
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
  Logger.log(`📋 READY FOR REVIEW:  ${stats.readyForReview} articles`);
  Logger.log('');
  Logger.log(`Articles Saved:       ~${stats.preFilterFiltered} articles auto-filtered`);
  Logger.log(`                      (saves ~${(stats.preFilterFiltered / (stats.preFilterPassed + stats.preFilterFiltered) * 100).toFixed(0)}% of manual review time)`);
  Logger.log('');
  Logger.log(`Total Time:           ${elapsedMinutes} minutes`);
  Logger.log(`Completed:            ${new Date().toLocaleString()}`);
  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');
  Logger.log('📝 NEXT STEPS:');
  Logger.log('   1. Open Raw Articles sheet');
  Logger.log('   2. Filter status = "ready_for_processing"');
  Logger.log('   3. Review high-scoring articles');
  Logger.log('   4. Submit crimes via Google Form');
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
  Logger.log('🧪 TESTING FILTERING PIPELINE (Manual Run)');
  Logger.log('');
  runFullPipeline();
}
