/**
 * API USAGE TRACKER
 * Logs daily API usage to "API Usage Tracker" sheet for monitoring
 */

const API_TRACKER_SHEET = 'API Usage Tracker';

/**
 * Log API usage for today
 * @param {Object} stats - Pipeline statistics
 * @param {number} stats.geminiCalls - Number of Gemini API calls made
 * @param {number} stats.articlesProcessed - Articles sent to Gemini
 * @param {number} stats.preFilterSaved - Articles blocked by pre-filter
 * @param {number} stats.errors - API errors encountered
 * @param {string} stats.notes - Optional notes
 */
function logApiUsage(stats) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(API_TRACKER_SHEET);

    if (!sheet) {
      Logger.log(`⚠️ "${API_TRACKER_SHEET}" sheet not found - skipping API tracking`);
      return;
    }

    const today = Utilities.formatDate(new Date(), 'GMT-4', 'yyyy-MM-dd');
    const lastRow = sheet.getLastRow();

    // Check if today already has an entry
    if (lastRow > 1) {
      const lastDate = sheet.getRange(lastRow, 1).getValue();
      const lastDateStr = Utilities.formatDate(new Date(lastDate), 'GMT-4', 'yyyy-MM-dd');

      if (lastDateStr === today) {
        // Update existing row (today already has data from earlier run)
        updateExistingApiUsage(sheet, lastRow, stats);
        return;
      }
    }

    // Create new row for today
    createNewApiUsage(sheet, today, stats);

  } catch (error) {
    Logger.log(`⚠️ Error logging API usage: ${error.message}`);
  }
}

/**
 * Update existing API usage entry (cumulative for the day)
 */
function updateExistingApiUsage(sheet, row, stats) {
  // Get current values
  const currentCalls = sheet.getRange(row, 2).getValue() || 0;
  const currentProcessed = sheet.getRange(row, 3).getValue() || 0;
  const currentSaved = sheet.getRange(row, 4).getValue() || 0;
  const currentErrors = sheet.getRange(row, 6).getValue() || 0;
  const currentNotes = sheet.getRange(row, 7).getValue() || '';

  // Add to totals
  const newCalls = currentCalls + (stats.geminiCalls || 0);
  const newProcessed = currentProcessed + (stats.articlesProcessed || 0);
  const newSaved = currentSaved + (stats.preFilterSaved || 0);
  const newErrors = currentErrors + (stats.errors || 0);

  // Calculate savings percentage
  const totalArticles = newProcessed + newSaved;
  const savingsPercentage = totalArticles > 0 ? ((newSaved / totalArticles) * 100).toFixed(1) : 0;

  // Append to notes
  const timestamp = Utilities.formatDate(new Date(), 'GMT-4', 'HH:mm');
  const newNotes = currentNotes + (currentNotes ? ' | ' : '') + `${timestamp}: +${stats.geminiCalls || 0} calls`;

  // Update row
  sheet.getRange(row, 2).setValue(newCalls);                    // Total Calls
  sheet.getRange(row, 3).setValue(newProcessed);                // Articles Processed
  sheet.getRange(row, 4).setValue(newSaved);                    // Pre-Filter Saved
  sheet.getRange(row, 5).setValue(`${savingsPercentage}%`);     // Savings Percentage
  sheet.getRange(row, 6).setValue(newErrors);                   // Errors
  sheet.getRange(row, 7).setValue(newNotes);                    // Notes

  Logger.log(`📊 Updated API Usage Tracker for today: ${newCalls} total calls`);
}

/**
 * Create new API usage entry for today
 */
function createNewApiUsage(sheet, date, stats) {
  const totalArticles = (stats.articlesProcessed || 0) + (stats.preFilterSaved || 0);
  const savingsPercentage = totalArticles > 0
    ? (((stats.preFilterSaved || 0) / totalArticles) * 100).toFixed(1)
    : 0;

  const timestamp = Utilities.formatDate(new Date(), 'GMT-4', 'HH:mm');
  const notes = `${timestamp}: Pipeline run`;

  sheet.appendRow([
    new Date(),                          // A: Date
    stats.geminiCalls || 0,              // B: Total Calls
    stats.articlesProcessed || 0,        // C: Articles Processed
    stats.preFilterSaved || 0,           // D: Pre-Filter Saved
    `${savingsPercentage}%`,             // E: Savings Percentage
    stats.errors || 0,                   // F: Errors
    notes                                // G: Notes
  ]);

  Logger.log(`📊 Logged to API Usage Tracker: ${stats.geminiCalls || 0} calls today`);
}

/**
 * Get today's API usage (for monitoring)
 * @returns {Object} Today's usage stats or null
 */
function getTodayApiUsage() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(API_TRACKER_SHEET);

    if (!sheet || sheet.getLastRow() < 2) {
      return null;
    }

    const today = Utilities.formatDate(new Date(), 'GMT-4', 'yyyy-MM-dd');
    const lastRow = sheet.getLastRow();
    const lastDate = sheet.getRange(lastRow, 1).getValue();
    const lastDateStr = Utilities.formatDate(new Date(lastDate), 'GMT-4', 'yyyy-MM-dd');

    if (lastDateStr === today) {
      return {
        date: lastDate,
        totalCalls: sheet.getRange(lastRow, 2).getValue(),
        articlesProcessed: sheet.getRange(lastRow, 3).getValue(),
        preFilterSaved: sheet.getRange(lastRow, 4).getValue(),
        savingsPercentage: sheet.getRange(lastRow, 5).getValue(),
        errors: sheet.getRange(lastRow, 6).getValue(),
        notes: sheet.getRange(lastRow, 7).getValue()
      };
    }

    return null; // No entry for today yet

  } catch (error) {
    Logger.log(`Error getting today's API usage: ${error.message}`);
    return null;
  }
}

/**
 * Check if approaching daily API limit
 * Logs warning if close to 20 RPD
 */
function checkApiLimitWarning() {
  const today = getTodayApiUsage();

  if (!today) {
    return; // No data for today
  }

  const calls = today.totalCalls || 0;
  const limit = 20; // Gemini free tier daily limit

  if (calls >= limit) {
    Logger.log('🚨 WARNING: Daily API limit REACHED! (20 RPD)');
    Logger.log('   No more Gemini calls will succeed today.');
    Logger.log('   Articles will remain as ready_for_processing until tomorrow.');
  } else if (calls >= limit * 0.9) {
    Logger.log(`⚠️ WARNING: Close to daily API limit (${calls}/${limit} calls used)`);
  } else if (calls >= limit * 0.75) {
    Logger.log(`⚠️ Notice: ${calls}/${limit} API calls used today (75%+)`);
  }
}
