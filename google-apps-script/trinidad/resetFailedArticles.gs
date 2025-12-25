/**
 * EMERGENCY HELPER: Reset Failed Articles
 *
 * Use this when articles fail due to hitting Gemini rate limit
 * and need to be retried in the next run.
 *
 * This resets status from "failed" → "ready_for_processing"
 * so they'll be picked up in the next pipeline run.
 */

/**
 * Reset all failed articles back to ready_for_processing
 * Run this manually after hitting rate limits
 */
function resetFailedArticlesToReady() {
  Logger.log('=== RESETTING FAILED ARTICLES ===');
  Logger.log('');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RAW_ARTICLES);

  if (!sheet) {
    Logger.log('ERROR: Raw Articles sheet not found');
    return;
  }

  const data = sheet.getDataRange().getValues();
  let resetCount = 0;

  for (let i = 1; i < data.length; i++) {
    const status = data[i][6]; // Column G
    const title = data[i][2];   // Column C

    if (status === 'failed') {
      const rowNumber = i + 1;

      // Reset status to ready_for_processing
      sheet.getRange(rowNumber, 7).setValue('ready_for_processing');

      // Clear old notes and add reset note
      const now = new Date().toLocaleString();
      sheet.getRange(rowNumber, 8).setValue(`Reset from failed at ${now} - will retry next run`);

      Logger.log(`Row ${rowNumber}: ${title.substring(0, 50)}...`);
      Logger.log(`   Status: failed → ready_for_processing`);

      resetCount++;
    }
  }

  Logger.log('');
  Logger.log('═══════════════════════════════════════');
  Logger.log(`✅ Reset ${resetCount} failed articles`);
  Logger.log('   Status changed: failed → ready_for_processing');
  Logger.log('   Will be processed in next pipeline run');
  Logger.log('═══════════════════════════════════════');
}

/**
 * Preview which articles would be reset (read-only)
 */
function previewFailedArticles() {
  Logger.log('=== FAILED ARTICLES PREVIEW ===');
  Logger.log('');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RAW_ARTICLES);

  if (!sheet) {
    Logger.log('ERROR: Raw Articles sheet not found');
    return;
  }

  const data = sheet.getDataRange().getValues();
  let failedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const status = data[i][6]; // Column G
    const title = data[i][2];   // Column C
    const notes = data[i][7];   // Column H

    if (status === 'failed') {
      const rowNumber = i + 1;

      Logger.log(`Row ${rowNumber}:`);
      Logger.log(`   Title: ${title}`);
      Logger.log(`   Notes: ${notes}`);
      Logger.log('');

      failedCount++;
    }
  }

  if (failedCount === 0) {
    Logger.log('✅ No failed articles found');
  } else {
    Logger.log('═══════════════════════════════════════');
    Logger.log(`Found ${failedCount} failed articles`);
    Logger.log('Run resetFailedArticlesToReady() to reset them');
    Logger.log('═══════════════════════════════════════');
  }
}

/**
 * Get count of articles by status (diagnostic)
 */
function getStatusCounts() {
  Logger.log('=== STATUS COUNTS ===');
  Logger.log('');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RAW_ARTICLES);

  if (!sheet) {
    Logger.log('ERROR: Raw Articles sheet not found');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const counts = {};

  for (let i = 1; i < data.length; i++) {
    const status = data[i][6]; // Column G

    if (!counts[status]) {
      counts[status] = 0;
    }
    counts[status]++;
  }

  // Sort by count (descending)
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  sorted.forEach(([status, count]) => {
    Logger.log(`${status}: ${count}`);
  });

  Logger.log('');
  Logger.log(`Total articles: ${data.length - 1}`);
}
