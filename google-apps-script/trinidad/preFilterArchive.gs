
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
