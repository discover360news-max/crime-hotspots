function cleanUpTestData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Raw Articles - keep headers, delete rows 2+
    const rawSheet = ss.getSheetByName('Raw Articles');
    if (rawSheet.getLastRow() > 1) {
      rawSheet.deleteRows(2, rawSheet.getLastRow() - 1);
      Logger.log('✅ Cleared Raw Articles (kept headers)');
    }

    // 2. Production - keep headers, delete rows 2+
    const prodSheet = ss.getSheetByName('Production');
    if (prodSheet.getLastRow() > 1) {
      prodSheet.deleteRows(2, prodSheet.getLastRow() - 1);
      Logger.log('✅ Cleared Production (kept headers)');
    }

    // 3. Review Queue - keep headers, delete rows 2+
    const reviewSheet = ss.getSheetByName('Review Queue');
    if (reviewSheet && reviewSheet.getLastRow() > 1) {
      reviewSheet.deleteRows(2, reviewSheet.getLastRow() - 1);
      Logger.log('✅ Cleared Review Queue (kept headers)');
    }

    Logger.log('');
    Logger.log('🎯 All test data cleared - ready for production!');
  }