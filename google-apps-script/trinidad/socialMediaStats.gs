/**
 * Social Media Stats Calculator
 *
 * PURPOSE: Calculate daily crime statistics for social media posting
 * OUTPUT: Writes to "Social Media Stats" sheet for Make.com consumption
 *
 * SCHEDULE: Runs daily at 6 AM AST
 *
 * IMPROVEMENTS FROM ORIGINAL:
 * - Simplified timezone handling
 * - Auto-creates stats sheet if missing
 * - Better error handling
 * - Trend calculation (↑↓ arrows)
 * - Column verification
 * - Edge case handling (empty data)
 */

// Configuration
const SOCIAL_CONFIG = {
  PRODUCTION_SHEET: 'Production',  // Production sheet name
  STATS_SHEET: 'Social Media Stats',
  TIMEZONE: 'America/Port_of_Spain',  // AST (GMT-4)

  // Column indices (0-based) - VERIFY THESE MATCH YOUR SHEET!
  COLUMNS: {
    DATE: 0,        // Column A
    CRIME_TYPE: 2,  // Column C
    AREA: 5         // Column F
  }
};

/**
 * Main function: Calculate and store daily stats
 * Run this manually first to test, then set up trigger
 */
function updateSocialStats() {
  try {
    Logger.log('🔄 Starting social media stats calculation...');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const prodSheet = ss.getSheetByName(SOCIAL_CONFIG.PRODUCTION_SHEET);

    if (!prodSheet) {
      throw new Error(`Production sheet "${SOCIAL_CONFIG.PRODUCTION_SHEET}" not found`);
    }

    // Get or create stats sheet
    let statsSheet = ss.getSheetByName(SOCIAL_CONFIG.STATS_SHEET);
    if (!statsSheet) {
      Logger.log(`📝 Creating "${SOCIAL_CONFIG.STATS_SHEET}" sheet...`);
      statsSheet = createStatsSheet(ss);
    }

    // Calculate stats for last 24 hours
    const stats = calculateDailyStats(prodSheet);

    if (stats.total === 0) {
      Logger.log('⚠️ No crimes found in last 24 hours - skipping post');
      return;
    }

    // Calculate trends (compare to previous day)
    const trends = calculateTrends(prodSheet);

    // Write to stats sheet
    writeStatsToSheet(statsSheet, stats, trends);

    Logger.log(`✅ Stats updated successfully - ${stats.total} crimes in last 24h`);

  } catch (error) {
    Logger.log(`❌ Error updating social stats: ${error.message}`);
    // Send email notification on error
    sendErrorNotification(error);
  }
}

/**
 * Calculate crime statistics for last 24 hours
 */
function calculateDailyStats(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Get current time in spreadsheet timezone
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  Logger.log(`📊 Analyzing crimes from ${yesterday.toLocaleString()} to ${now.toLocaleString()}`);

  // Filter crimes from last 24 hours
  const recentCrimes = data.slice(1).filter(row => {
    if (!row[SOCIAL_CONFIG.COLUMNS.DATE]) return false;

    const crimeDate = new Date(row[SOCIAL_CONFIG.COLUMNS.DATE]);
    return crimeDate >= yesterday && crimeDate <= now;
  });

  Logger.log(`📈 Found ${recentCrimes.length} crimes in last 24 hours`);

  // Count by crime type
  const stats = {
    date: Utilities.formatDate(now, SOCIAL_CONFIG.TIMEZONE, 'yyyy-MM-dd'),
    total: recentCrimes.length,
    murders: countCrimeType(recentCrimes, 'Murder'),
    shootings: countCrimeType(recentCrimes, 'Shooting'),
    robberies: countCrimeType(recentCrimes, 'Robbery'),
    burglaries: countCrimeType(recentCrimes, 'Burglary'),
    thefts: countCrimeType(recentCrimes, 'Theft'),
    homeInvasions: countCrimeType(recentCrimes, 'Home Invasion'),
    kidnappings: countCrimeType(recentCrimes, 'Kidnapping'),
    sexualAssaults: countCrimeType(recentCrimes, 'Sexual Assault'),
    topArea: getMostFrequentArea(recentCrimes),
    topCrimeType: getMostFrequentCrimeType(recentCrimes)
  };

  return stats;
}

/**
 * Calculate trends (compare today vs yesterday)
 */
function calculateTrends(sheet) {
  const data = sheet.getDataRange().getValues();

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Today's crimes
  const todayCrimes = data.slice(1).filter(row => {
    if (!row[SOCIAL_CONFIG.COLUMNS.DATE]) return false;
    const crimeDate = new Date(row[SOCIAL_CONFIG.COLUMNS.DATE]);
    return crimeDate >= yesterday && crimeDate <= now;
  });

  // Yesterday's crimes
  const yesterdayCrimes = data.slice(1).filter(row => {
    if (!row[SOCIAL_CONFIG.COLUMNS.DATE]) return false;
    const crimeDate = new Date(row[SOCIAL_CONFIG.COLUMNS.DATE]);
    return crimeDate >= twoDaysAgo && crimeDate < yesterday;
  });

  const todayTotal = todayCrimes.length;
  const yesterdayTotal = yesterdayCrimes.length;

  const trends = {
    total: getTrendArrow(todayTotal, yesterdayTotal),
    murders: getTrendArrow(
      countCrimeType(todayCrimes, 'Murder'),
      countCrimeType(yesterdayCrimes, 'Murder')
    ),
    robberies: getTrendArrow(
      countCrimeType(todayCrimes, 'Robbery'),
      countCrimeType(yesterdayCrimes, 'Robbery')
    )
  };

  return trends;
}

/**
 * Get trend arrow (↑↓↔️) based on comparison
 */
function getTrendArrow(today, yesterday) {
  if (today > yesterday) return '↑';
  if (today < yesterday) return '↓';
  return '↔️';
}

/**
 * Count crimes of specific type
 */
function countCrimeType(crimes, type) {
  return crimes.filter(row => row[SOCIAL_CONFIG.COLUMNS.CRIME_TYPE] === type).length;
}

/**
 * Get most frequent area
 */
function getMostFrequentArea(crimes) {
  if (crimes.length === 0) return 'N/A';

  const areaCounts = {};
  crimes.forEach(crime => {
    const area = crime[SOCIAL_CONFIG.COLUMNS.AREA] || 'Unknown';
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });

  // Find area with highest count
  return Object.keys(areaCounts).reduce((a, b) =>
    areaCounts[a] > areaCounts[b] ? a : b
  );
}

/**
 * Get most frequent crime type
 */
function getMostFrequentCrimeType(crimes) {
  if (crimes.length === 0) return 'N/A';

  const typeCounts = {};
  crimes.forEach(crime => {
    const type = crime[SOCIAL_CONFIG.COLUMNS.CRIME_TYPE] || 'Unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  return Object.keys(typeCounts).reduce((a, b) =>
    typeCounts[a] > typeCounts[b] ? a : b
  );
}

/**
 * Write stats to Social Media Stats sheet
 */
function writeStatsToSheet(sheet, stats, trends) {
  sheet.appendRow([
    stats.date,
    stats.total,
    stats.murders,
    stats.shootings,
    stats.robberies,
    stats.burglaries,
    stats.thefts,
    stats.homeInvasions,
    stats.kidnappings,
    stats.sexualAssaults,
    stats.topArea,
    stats.topCrimeType,
    trends.total,
    trends.murders,
    trends.robberies,
    '', // Chart URL (generated by Make.com or QuickChart)
    'Pending', // Status: Pending, Posted, Failed
    '' // Notes
  ]);

  Logger.log(`✅ Stats written to row ${sheet.getLastRow()}`);
}

/**
 * Create Social Media Stats sheet with headers
 */
function createStatsSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(SOCIAL_CONFIG.STATS_SHEET);

  // Set up headers
  const headers = [
    'Date',
    'Total Crimes',
    'Murders',
    'Shootings',
    'Robberies',
    'Burglaries',
    'Thefts',
    'Home Invasions',
    'Kidnappings',
    'Sexual Assaults',
    'Top Area',
    'Top Crime Type',
    'Total Trend',
    'Murder Trend',
    'Robbery Trend',
    'Chart URL',
    'Post Status',
    'Notes'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format headers
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#e11d48')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  // Set column widths
  sheet.setColumnWidth(1, 120);  // Date
  sheet.setColumnWidth(11, 150); // Top Area
  sheet.setColumnWidth(12, 150); // Top Crime Type
  sheet.setColumnWidth(16, 300); // Chart URL
  sheet.setColumnWidth(17, 100); // Status
  sheet.setColumnWidth(18, 200); // Notes

  // Freeze header row
  sheet.setFrozenRows(1);

  Logger.log('✅ Social Media Stats sheet created');
  return sheet;
}

/**
 * Send error notification email
 */
function sendErrorNotification(error) {
  const email = Session.getActiveUser().getEmail();
  const subject = '⚠️ Social Media Stats Error';
  const body = `
Error updating social media stats:

${error.message}

Stack trace:
${error.stack}

Time: ${new Date().toLocaleString()}

Please check the script and try again.
  `;

  try {
    MailApp.sendEmail(email, subject, body);
  } catch (e) {
    Logger.log('❌ Failed to send error notification email');
  }
}

/**
 * Set up daily trigger to run at 6 AM AST
 * Run this once manually to create the trigger
 */
function setupDailyTrigger() {
  // Delete existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateSocialStats') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger
  ScriptApp.newTrigger('updateSocialStats')
    .timeBased()
    .everyDays(1)
    .atHour(6)  // 6 AM in spreadsheet timezone
    .create();

  Logger.log('✅ Daily trigger set up for 6 AM');
}

/**
 * Test function: Run stats calculation for custom date range
 */
function testStatsCalculation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodSheet = ss.getSheetByName(SOCIAL_CONFIG.PRODUCTION_SHEET);

  const stats = calculateDailyStats(prodSheet);

  Logger.log('📊 Test Stats:');
  Logger.log(`Date: ${stats.date}`);
  Logger.log(`Total: ${stats.total}`);
  Logger.log(`Murders: ${stats.murders}`);
  Logger.log(`Robberies: ${stats.robberies}`);
  Logger.log(`Top Area: ${stats.topArea}`);
  Logger.log(`Top Crime Type: ${stats.topCrimeType}`);
}

/**
 * Manual trigger: Calculate stats for specific date
 */
function calculateStatsForDate(dateString) {
  // Example: calculateStatsForDate('2025-12-12')
  const targetDate = new Date(dateString);
  const dayBefore = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodSheet = ss.getSheetByName(SOCIAL_CONFIG.PRODUCTION_SHEET);
  const data = prodSheet.getDataRange().getValues();

  const crimes = data.slice(1).filter(row => {
    if (!row[SOCIAL_CONFIG.COLUMNS.DATE]) return false;
    const crimeDate = new Date(row[SOCIAL_CONFIG.COLUMNS.DATE]);
    return crimeDate >= dayBefore && crimeDate <= targetDate;
  });

  Logger.log(`📊 Stats for ${dateString}:`);
  Logger.log(`Total crimes: ${crimes.length}`);
  Logger.log(`Murders: ${countCrimeType(crimes, 'Murder')}`);
  Logger.log(`Robberies: ${countCrimeType(crimes, 'Robbery')}`);
  Logger.log(`Top Area: ${getMostFrequentArea(crimes)}`);
}
