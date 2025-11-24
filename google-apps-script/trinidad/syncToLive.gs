/**
 * Production → LIVE Sync Helper for Trinidad & Tobago
 *
 * Purpose: Copy approved crimes from Production sheet to LIVE sheet
 * Features:
 *   - Duplicate detection (prevents re-copying same crimes)
 *   - Date filtering (only recent crimes)
 *   - Automatic archiving after successful copy
 *
 * Usage: Run manually every 2-3 days after reviewing Production sheet
 */

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

const LIVE_SHEET_ID = '1ornc_adllfJeA9V984qFCDdwfrEEX2H6rNH6nNQUHCQ'; // Replace with your LIVE Google Sheet ID
const LIVE_SHEET_NAME = 'Form Responses 1';      // Name of the tab in LIVE sheet

const DAYS_TO_SYNC = 7; // Only sync crimes from last 7 days (adjust as needed)

// Column mapping: Production → LIVE
// Production columns: Date, Headline, Crime Type, Street, Plus Code, Area, Island, URL, Lat, Long, Status
// LIVE columns: Timestamp, Date, Headline, Crime Type, Street Address, Location, Area, Island, URL, ...
const COLUMN_MAPPING = {
  // LIVE column index: Production column index (0-based)
  0: 'timestamp',        // Timestamp (auto-generated)
  1: 0,                  // Date → Date
  2: 1,                  // Headline → Headline
  3: 2,                  // Crime Type → Crime Type
  4: 3,                  // Street Address → Street
  5: 4,                  // Location → Plus Code
  6: 5,                  // Area → Area
  7: 6,                  // Island → Island
  8: 7,                  // URL → URL
  // Columns 9-27 are extra form fields - leave empty
};

// ============================================================================
// MAIN SYNC FUNCTION
// ============================================================================

/**
 * Copy approved crimes from Production → LIVE with duplicate detection
 *
 * @returns {Object} Stats on what was synced
 */
function syncProductionToLive() {
  Logger.log('=== SYNCING PRODUCTION → LIVE (TRINIDAD & TOBAGO) ===\n');

  try {
    // Get Production sheet (current spreadsheet)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const prodSheet = ss.getSheetByName('Production');

    if (!prodSheet) {
      throw new Error('Production sheet not found in current spreadsheet');
    }

    // Get LIVE sheet (external spreadsheet)
    const liveSpreadsheet = SpreadsheetApp.openById(LIVE_SHEET_ID);
    const liveSheet = liveSpreadsheet.getSheetByName(LIVE_SHEET_NAME);

    if (!liveSheet) {
      throw new Error(`Sheet "${LIVE_SHEET_NAME}" not found in LIVE spreadsheet`);
    }

    // Get Production data
    const prodData = prodSheet.getDataRange().getValues();

    // Get LIVE data for duplicate detection
    const liveData = liveSheet.getDataRange().getValues();

    Logger.log(`Production sheet: ${prodData.length - 1} rows`);
    Logger.log(`LIVE sheet: ${liveData.length - 1} rows\n`);

    // Calculate cutoff date (only sync recent crimes)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_SYNC);

    let newCrimes = 0;
    let duplicates = 0;
    let oldCrimes = 0;
    const rowsToArchive = [];

    // Process each Production row (skip header)
    for (let i = 1; i < prodData.length; i++) {
      const row = prodData[i];
      const crimeDate = new Date(row[0]); // Column A: Date
      const headline = row[1];            // Column B: Headline
      const crimeType = row[2];           // Column C: Crime Type
      const area = row[5];                // Column F: Area
      const url = row[7];                 // Column H: URL

      // Skip old crimes
      if (crimeDate < cutoffDate) {
        oldCrimes++;
        continue;
      }

      // Check for duplicate in LIVE sheet
      const isDuplicate = checkDuplicateInLive(liveData, row);

      if (isDuplicate) {
        Logger.log(`⏭️  Skip (duplicate): ${headline.substring(0, 50)}...`);
        duplicates++;

        // Mark for archiving (already in LIVE)
        rowsToArchive.push(i + 1); // +1 because row numbers are 1-indexed
        continue;
      }

      // Not a duplicate - map Production row to LIVE format and append
      const mappedRow = mapProductionToLive(row);
      liveSheet.appendRow(mappedRow);
      Logger.log(`✅ Added: ${headline.substring(0, 50)}...`);
      newCrimes++;

      // Mark for archiving (successfully copied)
      rowsToArchive.push(i + 1);

      // Rate limiting to avoid quota issues
      Utilities.sleep(100);
    }

    // Archive synced rows
    if (rowsToArchive.length > 0) {
      archiveSyncedRows(prodSheet, rowsToArchive);
    }

    // Summary
    Logger.log('\n=== SYNC COMPLETE ===');
    Logger.log(`✅ New crimes added to LIVE: ${newCrimes}`);
    Logger.log(`⏭️  Duplicates skipped: ${duplicates}`);
    Logger.log(`📅 Old crimes skipped (>${DAYS_TO_SYNC} days): ${oldCrimes}`);
    Logger.log(`📦 Rows archived: ${rowsToArchive.length}`);
    Logger.log('=====================\n');

    return {
      newCrimes,
      duplicates,
      oldCrimes,
      archived: rowsToArchive.length
    };

  } catch (error) {
    Logger.log(`\n❌ ERROR: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// COLUMN MAPPING FUNCTION
// ============================================================================

/**
 * Map Production row to LIVE sheet format
 *
 * @param {Array} prodRow - Row from Production sheet
 * @returns {Array} Mapped row for LIVE sheet
 */
function mapProductionToLive(prodRow) {
  // Get LIVE sheet to determine column count
  const liveSpreadsheet = SpreadsheetApp.openById(LIVE_SHEET_ID);
  const liveSheet = liveSpreadsheet.getSheetByName(LIVE_SHEET_NAME);
  const liveColumnCount = liveSheet.getLastColumn();

  // Create array with correct length for LIVE sheet
  const mappedRow = new Array(liveColumnCount).fill('');

  // Map each column according to COLUMN_MAPPING
  for (const [liveIdx, prodIdx] of Object.entries(COLUMN_MAPPING)) {
    const liveIndex = parseInt(liveIdx);

    if (prodIdx === 'timestamp') {
      // Auto-generate timestamp
      mappedRow[liveIndex] = new Date();
    } else if (typeof prodIdx === 'number') {
      // Copy from Production column
      mappedRow[liveIndex] = prodRow[prodIdx] || '';
    }
  }

  return mappedRow;
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Check if crime already exists in LIVE sheet
 *
 * @param {Array} liveData - All rows from LIVE sheet
 * @param {Array} prodRow - Single row from Production sheet
 * @returns {boolean} True if duplicate found
 */
function checkDuplicateInLive(liveData, prodRow) {
  // Production columns: Date(0), Headline(1), Crime Type(2), Street(3), Plus Code(4), Area(5), Island(6), URL(7), Lat(8), Long(9)
  const prodDate = new Date(prodRow[0]);
  const prodHeadline = prodRow[1];
  const prodCrimeType = prodRow[2];
  const prodArea = prodRow[5];
  const prodUrl = prodRow[7];
  const prodLat = prodRow[8];
  const prodLng = prodRow[9];

  // Skip header row
  for (let i = 1; i < liveData.length; i++) {
    const liveRow = liveData[i];
    // LIVE columns: Timestamp(0), Date(1), Headline(2), Crime Type(3), Street Address(4), Location(5), Area(6), Island(7), URL(8), ...
    const liveDate = new Date(liveRow[1]);  // Column 1 (not 0, because 0 is Timestamp)
    const liveHeadline = liveRow[2];
    const liveCrimeType = liveRow[3];
    const liveArea = liveRow[6];
    const liveUrl = liveRow[8];
    // Note: Lat/Lng not in LIVE sheet - skip coordinate check

    // Check 1: Exact URL match
    if (prodUrl && liveUrl && prodUrl === liveUrl) {
      return true;
    }

    // Check 2: Same date + same headline (80%+ similarity)
    if (isSameDate(prodDate, liveDate)) {
      const similarity = calculateSimilarity(prodHeadline, liveHeadline);
      if (similarity > 0.80) {
        return true;
      }
    }

    // Check 3: Same date + same area + same crime type (high similarity)
    if (isSameDate(prodDate, liveDate) && prodArea === liveArea && prodCrimeType === liveCrimeType) {
      const similarity = calculateSimilarity(prodHeadline, liveHeadline);
      if (similarity > 0.70) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if two dates are the same day
 */
function isSameDate(date1, date2) {
  if (!date1 || !date2) return false;

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Calculate string similarity (Levenshtein-based)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance calculation
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
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// ============================================================================
// ARCHIVING
// ============================================================================

/**
 * Move synced rows from Production to Production Archive
 *
 * @param {Sheet} prodSheet - Production sheet
 * @param {Array<number>} rowNumbers - Array of row numbers to archive (1-indexed)
 */
function archiveSyncedRows(prodSheet, rowNumbers) {
  Logger.log('\n📦 Archiving synced rows...');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let archiveSheet = ss.getSheetByName('Production Archive');

  // Create Archive sheet if it doesn't exist
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Production Archive');

    // Copy headers from Production
    const headers = prodSheet.getRange(1, 1, 1, prodSheet.getLastColumn()).getValues();
    archiveSheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

    Logger.log('✅ Created "Production Archive" sheet');
  }

  // Sort row numbers in descending order (delete from bottom up to avoid index shifting)
  rowNumbers.sort((a, b) => b - a);

  let archived = 0;

  for (const rowNum of rowNumbers) {
    try {
      // Get the row data
      const rowData = prodSheet.getRange(rowNum, 1, 1, prodSheet.getLastColumn()).getValues();

      // Append to archive
      archiveSheet.appendRow(rowData[0]);

      // Delete from Production
      prodSheet.deleteRow(rowNum);

      archived++;
    } catch (error) {
      Logger.log(`⚠️ Error archiving row ${rowNum}: ${error.message}`);
    }
  }

  Logger.log(`✅ Archived ${archived} rows to Production Archive`);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Test the sync without actually modifying sheets
 * Use this to preview what would be synced
 */
function testSyncDryRun() {
  Logger.log('=== DRY RUN (NO CHANGES WILL BE MADE) ===\n');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodSheet = ss.getSheetByName('Production');

  if (!prodSheet) {
    Logger.log('❌ Production sheet not found');
    return;
  }

  const prodData = prodSheet.getDataRange().getValues();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_SYNC);

  let wouldSync = 0;
  let wouldSkip = 0;

  Logger.log('Crimes that would be synced:\n');

  for (let i = 1; i < prodData.length; i++) {
    const row = prodData[i];
    const crimeDate = new Date(row[0]);
    const headline = row[1];

    if (crimeDate >= cutoffDate) {
      Logger.log(`✅ ${Utilities.formatDate(crimeDate, Session.getScriptTimeZone(), 'yyyy-MM-dd')} - ${headline.substring(0, 60)}...`);
      wouldSync++;
    } else {
      wouldSkip++;
    }
  }

  Logger.log(`\n=== DRY RUN SUMMARY ===`);
  Logger.log(`Would sync: ${wouldSync} crimes`);
  Logger.log(`Would skip (too old): ${wouldSkip} crimes`);
  Logger.log(`=======================\n`);
}

/**
 * Manual function to update LIVE_SHEET_ID
 * Run this once to set your LIVE sheet ID
 */
function setupLiveSheetId() {
  Logger.log('To use this sync script:');
  Logger.log('1. Open your LIVE Google Sheet');
  Logger.log('2. Copy the sheet ID from the URL (the long string between /d/ and /edit)');
  Logger.log('3. Update LIVE_SHEET_ID at the top of this script');
  Logger.log('4. Update LIVE_SHEET_NAME to match the tab name in your LIVE sheet');
  Logger.log('5. Run testSyncDryRun() to preview what would sync');
  Logger.log('6. Run syncProductionToLive() to perform actual sync');
}
