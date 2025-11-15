// ============================================================================
// ARCHIVING FUNCTION
// ============================================================================

function archiveProcessedArticles() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
    const archiveSheet = getOrCreateArchiveSheet();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const data = sheet.getDataRange().getValues();
    const toArchive = [];
    const toKeep = [data[0]]; // Headers

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const timestamp = new Date(row[0]);
      const status = row[6]; // Column G: Status

      // Archive if: old AND (completed or skipped)
      const shouldArchive = timestamp < cutoffDate &&
                           (status === 'completed' || status === 'skipped');

      if (shouldArchive) {
        toArchive.push(row);
      } else {
        toKeep.push(row);
      }
    }

    // Append to archive
    if (toArchive.length > 0) {
      archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1,toArchive.length, 8)
        .setValues(toArchive);
    }

    // Rewrite main sheet
    sheet.clear();
    sheet.getRange(1, 1, toKeep.length, 8).setValues(toKeep);

    Logger.log(`✅ Archived: ${toArchive.length} articles (>90 days, completed/skipped)`);
    Logger.log(`✅ Kept: ${toKeep.length - 1} articles (recent or pending review)`);

    // Send email notification
    GmailApp.sendEmail(
      NOTIFICATION_EMAIL,
      '📦 Crime Hotspots - Quarterly Archive Complete',
      `Archived ${toArchive.length} old articles.\nKept ${toKeep.length - 1}recent articles.`
    );
  }