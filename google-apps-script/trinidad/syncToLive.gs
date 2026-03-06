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

// Name-based field mapping: Production header (lowercase) → LIVE header (lowercase)
// Resolved at runtime — safe against Production or LIVE column reordering.
// Timestamp is special-cased (auto-generated, not copied from Production).
const NAME_BASED_FIELD_MAP = {
  'date':                 'date',
  'headline':             'headline',
  'summary':              'summary',
  'primarycrimetype':     'primarycrimetype',
  'relatedcrimetypes':    'relatedcrimetypes',
  'victimcount':          'victimcount',
  'crimetype':            'crime type',
  'street address':       'street address',
  'latitude':             'latitude',
  'longitude':            'longitude',
  'location (plus code)': 'location',
  'area':                 'area',
  'region':               'region',
  'island':               'island',
  'url':                  'url',
  'source':               'source',
  'safety_tip_flag':      'safety_tip_flag',
  'safety_tip_category':  'safety_tip_category',
  'safety_tip_context':   'safety_tip_context',
  'tactic_noted':         'tactic_noted',
  'date_published':       'date_published',
  'date_updated':         'date_updated',
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

    // Build Production column map from header row (name → 0-based index)
    const prodHeaders = prodData[0];
    const prodColMap = {};
    prodHeaders.forEach((h, i) => {
      if (h) prodColMap[h.toString().toLowerCase().trim()] = i;
    });
    Logger.log('Production headers mapped: ' + JSON.stringify(Object.keys(prodColMap)));

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

      // Access by name — safe against column reordering
      const crimeDate = new Date(row[prodColMap['date']]);
      const headline = row[prodColMap['headline']];

      // Skip old crimes
      if (crimeDate < cutoffDate) {
        oldCrimes++;
        continue;
      }

      // Check for duplicate in LIVE sheet
      const isDuplicate = checkDuplicateInLive(liveData, row, prodColMap);

      if (isDuplicate) {
        Logger.log(`⏭️  Skip (duplicate): ${String(headline).substring(0, 50)}...`);
        duplicates++;

        // Mark for archiving (already in LIVE)
        rowsToArchive.push(i + 1); // +1 because row numbers are 1-indexed
        continue;
      }

      // Not a duplicate - map Production row to LIVE format and append
      const mappedRow = mapProductionToLive(row, prodColMap, liveSheet);
      liveSheet.appendRow(mappedRow);
      Logger.log(`✅ Added: ${String(headline).substring(0, 50)}...`);
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
 * Map Production row to LIVE sheet format using name-based column lookup.
 * Safe against Production or LIVE column reordering.
 *
 * @param {Array} prodRow - Row from Production sheet
 * @param {Object} prodColMap - Production header → index map (from syncProductionToLive)
 * @param {Sheet} liveSheet - LIVE sheet object (passed in to avoid reopening)
 * @returns {Array} Mapped row for LIVE sheet
 */
function mapProductionToLive(prodRow, prodColMap, liveSheet) {
  // Build LIVE column map from header row
  const liveHeaders = liveSheet.getRange(1, 1, 1, liveSheet.getLastColumn()).getValues()[0];
  const liveColMap = {};
  liveHeaders.forEach((h, i) => {
    if (h) liveColMap[h.toString().toLowerCase().trim()] = i;
  });

  const liveColumnCount = liveSheet.getLastColumn();
  const mappedRow = new Array(liveColumnCount).fill('');

  // Timestamp: always in first LIVE column (auto-generated)
  mappedRow[0] = new Date();

  // Copy each field by name where both Production and LIVE headers match
  for (const [prodKey, liveKey] of Object.entries(NAME_BASED_FIELD_MAP)) {
    const prodIdx = prodColMap[prodKey];
    const liveIdx = liveColMap[liveKey];
    if (prodIdx !== undefined && liveIdx !== undefined) {
      mappedRow[liveIdx] = prodRow[prodIdx] !== undefined ? prodRow[prodIdx] : '';
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
 * @param {Object} prodColMap - Production header → index map
 * @returns {boolean} True if duplicate found
 */
function checkDuplicateInLive(liveData, prodRow, prodColMap) {
  const prodDate     = new Date(prodRow[prodColMap['date']]);
  const prodHeadline = prodRow[prodColMap['headline']];
  const prodCrimeType = prodRow[prodColMap['crimetype']];
  const prodArea     = prodRow[prodColMap['area']];
  const prodUrl      = prodRow[prodColMap['url']];

  // Build LIVE column map once from header row
  const liveHeaderRow = liveData[0];
  const liveColMap = {};
  liveHeaderRow.forEach((h, i) => {
    if (h) liveColMap[h.toString().toLowerCase().trim()] = i;
  });

  // LIVE column positions (name-based, with fallback to legacy positions)
  const liveDateIdx     = liveColMap['date']         !== undefined ? liveColMap['date']         : 1;
  const liveHeadlineIdx = liveColMap['headline']      !== undefined ? liveColMap['headline']      : 2;
  const liveCrimeTypeIdx = liveColMap['crime type']   !== undefined ? liveColMap['crime type']    :
                           liveColMap['crimetype']    !== undefined ? liveColMap['crimetype']     : 3;
  const liveAreaIdx     = liveColMap['area']          !== undefined ? liveColMap['area']          : 6;
  const liveUrlIdx      = liveColMap['url']           !== undefined ? liveColMap['url']           : 8;

  // Skip header row (index 0)
  for (let i = 1; i < liveData.length; i++) {
    const liveRow = liveData[i];
    const liveDate      = new Date(liveRow[liveDateIdx]);
    const liveHeadline  = liveRow[liveHeadlineIdx];
    const liveCrimeType = liveRow[liveCrimeTypeIdx];
    const liveArea      = liveRow[liveAreaIdx];
    const liveUrl       = liveRow[liveUrlIdx];

    // Check 1: Exact URL match
    if (prodUrl && liveUrl && prodUrl === liveUrl) {
      return true;
    }

    // Check 2: Same date + same headline (80%+ similarity)
    if (isSameDate(prodDate, liveDate)) {
      const similarity = calculateSimilarity(String(prodHeadline), String(liveHeadline));
      if (similarity > 0.80) {
        return true;
      }
    }

    // Check 3: Same date + same area + same crime type (high similarity)
    if (isSameDate(prodDate, liveDate) && prodArea === liveArea && prodCrimeType === liveCrimeType) {
      const similarity = calculateSimilarity(String(prodHeadline), String(liveHeadline));
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

  // Build column map from header row
  const prodHeaders = prodData[0];
  const prodColMap = {};
  prodHeaders.forEach((h, i) => {
    if (h) prodColMap[h.toString().toLowerCase().trim()] = i;
  });
  Logger.log('Production headers: ' + JSON.stringify(Object.keys(prodColMap)) + '\n');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_SYNC);

  let wouldSync = 0;
  let wouldSkip = 0;

  Logger.log('Crimes that would be synced:\n');

  for (let i = 1; i < prodData.length; i++) {
    const row = prodData[i];
    const crimeDate = new Date(row[prodColMap['date']]);
    const headline = row[prodColMap['headline']];
    const datePublished = row[prodColMap['date_published']] || '(no Date_Published yet)';

    if (crimeDate >= cutoffDate) {
      Logger.log(`✅ ${Utilities.formatDate(crimeDate, Session.getScriptTimeZone(), 'yyyy-MM-dd')} - ${String(headline).substring(0, 60)} | Published: ${datePublished}`);
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
