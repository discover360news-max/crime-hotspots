// ============================================================================
// BACKLOG MONITORING
// ============================================================================

/**
 * Check backlog status and send email if queue is too large
 * Can be called by a daily trigger to monitor processing health
 */
function checkBacklogStatus() {
  Logger.log('=== CHECKING BACKLOG STATUS ===');

  const sheet = getActiveSheet(SHEET_NAMES.RAW_ARTICLES);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log('No articles in Raw Articles sheet');
    return;
  }

  const dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
  const data = dataRange.getValues();

  let readyCount = 0;
  let processingCount = 0;
  let failedCount = 0;
  let needsReviewCount = 0;
  let oldestReadyDate = null;

  data.forEach(row => {
    const timestamp = row[0];
    const status = row[6];

    if (status === 'ready_for_processing') {
      readyCount++;
      if (!oldestReadyDate || timestamp < oldestReadyDate) {
        oldestReadyDate = timestamp;
      }
    } else if (status === 'processing') {
      processingCount++;
    } else if (status === 'failed') {
      failedCount++;
    } else if (status === 'needs_review') {
      needsReviewCount++;
    }
  });

  Logger.log(`Backlog Summary:`);
  Logger.log(`  Ready for processing: ${readyCount}`);
  Logger.log(`  Currently processing: ${processingCount}`);
  Logger.log(`  Failed: ${failedCount}`);
  Logger.log(`  Needs review: ${needsReviewCount}`);

  // Alert if backlog is large
  const BACKLOG_ALERT_THRESHOLD = 50;
  if (readyCount > BACKLOG_ALERT_THRESHOLD) {
    const oldestAge = oldestReadyDate ? Math.round((new Date() - new Date(oldestReadyDate)) / (1000 * 60 * 60)) : 'unknown';

    const emailBody = `
⚠️ Large Processing Backlog Detected

Current Status:
- Ready for processing: ${readyCount} articles
- Oldest pending: ${oldestAge} hours old
- Currently processing: ${processingCount}
- Failed: ${failedCount}
- Needs review: ${needsReviewCount}

The backlog threshold is ${BACKLOG_ALERT_THRESHOLD} articles.

Recommendations:
1. Check if triggers are running on schedule
2. Review failed articles for common errors
3. Consider temporarily increasing MAX_ARTICLES_PER_RUN if all is well
4. Check API quota usage (Gemini free tier: 60 req/min)

View spreadsheet: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
    `.trim();

    GmailApp.sendEmail(
      NOTIFICATION_EMAIL,
      `⚠️ Crime Hotspots - Large Backlog (${readyCount} articles pending)`,
      emailBody
    );

    Logger.log('⚠️ Alert email sent - backlog exceeds threshold');
  } else {
    Logger.log('✅ Backlog is within normal range');
  }

  Logger.log('===========================');
}

// ============================================================================
// TESTING FUNCTION
// ============================================================================

/**
 * Test the full processing pipeline with existing data
 * Run this manually to test end-to-end
 */
function testProcessingPipeline() {
  Logger.log('=== TESTING PROCESSING PIPELINE ===');

  // First verify configuration
  logConfigStatus();
  verifyApiKey();

  // Test with limit of 1 article
  const originalLimit = PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN;
  PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN = 1;

  try {
    processReadyArticles();
  } finally {
    // Restore original limit
    PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN = originalLimit;
  }

  Logger.log('=== TEST COMPLETE ===');
}

// ============================================================================
// ARCHIVING FUNCTION
// ============================================================================

/**
 * Archive old processed raw articles (7+ days old)
 * Schedule: Daily trigger (recommended 3am-4am Trinidad time / 7am-8am UTC)
 *
 * Archives articles that are:
 * - Older than 7 days AND
 * - Status is: completed, skipped, or filtered_out
 *
 * Does NOT archive: pending, text_fetched, ready_for_processing, processing, failed, needs_review
 * (These still need attention)
 */
function archiveProcessedArticles() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   RAW ARTICLES ARCHIVE (Daily)                ');
  Logger.log('═══════════════════════════════════════════════');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
  const archiveSheet = getOrCreateArchiveSheet();

  // Archive articles older than 7 days
  const DAYS_TO_KEEP = 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);

  Logger.log(`Cutoff date: ${cutoffDate.toLocaleDateString()}`);
  Logger.log(`Archiving articles older than ${DAYS_TO_KEEP} days with finished status`);

  const data = sheet.getDataRange().getValues();
  const toArchive = [];
  const toKeep = [data[0]]; // Headers

  // Statuses that are safe to archive (processing is complete)
  const archivableStatuses = ['completed', 'skipped', 'filtered_out'];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const timestamp = new Date(row[0]);
    const status = row[6]; // Column G: Status

    // Archive if: old AND has a finished status
    const isOld = timestamp < cutoffDate;
    const isFinished = archivableStatuses.includes(status);

    if (isOld && isFinished) {
      toArchive.push(row);
    } else {
      toKeep.push(row);
    }
  }

  // Get the number of columns dynamically
  const numColumns = data[0].length;

  // Append to archive
  if (toArchive.length > 0) {
    archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, toArchive.length, numColumns)
      .setValues(toArchive);
  }

  // Rewrite main sheet
  sheet.clear();
  sheet.getRange(1, 1, toKeep.length, numColumns).setValues(toKeep);

  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log(`✅ Archived: ${toArchive.length} articles (>${DAYS_TO_KEEP} days, finished)`);
  Logger.log(`✅ Kept: ${toKeep.length - 1} articles (recent or still processing)`);
  Logger.log('═══════════════════════════════════════════════');

  // Only send email if something was archived
  if (toArchive.length > 0) {
    GmailApp.sendEmail(
      NOTIFICATION_EMAIL,
      `📦 Crime Hotspots - Archived ${toArchive.length} Raw Articles`,
      `Daily archive complete.\n\nArchived: ${toArchive.length} articles (older than ${DAYS_TO_KEEP} days)\nKept: ${toKeep.length - 1} articles (recent or pending)\n\nView spreadsheet: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`
    );
  }
}