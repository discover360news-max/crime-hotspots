/**
 * Debug: Check what statuses exist in Raw Articles
 */
function debugStatuses() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');

  if (!sheet) {
    Logger.log('ERROR: Raw Articles sheet not found');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const statusCol = headers.indexOf('Status');
  const titleCol = headers.indexOf('Title');

  Logger.log('=== STATUS CHECK ===\n');
  Logger.log(`Total rows (including header): ${data.length}`);
  Logger.log(`Status column index: ${statusCol}\n`);

  // Count each status type
  const statusCounts = {};

  for (let i = 1; i < data.length; i++) {
    const status = data[i][statusCol];
    const statusStr = String(status).trim();

    if (!statusCounts[statusStr]) {
      statusCounts[statusStr] = 0;
    }
    statusCounts[statusStr]++;
  }

  Logger.log('Status Counts:');
  Object.keys(statusCounts).sort().forEach(status => {
    Logger.log(`  "${status}": ${statusCounts[status]} articles`);
  });

  // Show first 10 rows with their status
  Logger.log('\n=== FIRST 10 ROWS ===');
  for (let i = 1; i < Math.min(11, data.length); i++) {
    const status = data[i][statusCol];
    const title = data[i][titleCol];
    Logger.log(`Row ${i + 1}: Status="${status}" | ${title ? title.substring(0, 50) : 'No title'}...`);
  }
}
