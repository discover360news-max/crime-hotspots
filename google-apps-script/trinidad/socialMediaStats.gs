/**
 * SOCIAL MEDIA STATS GENERATOR
 *
 * Automatically generates social media post text with crime statistics
 * Calculates current 7 days vs previous 7 days comparison
 * Outputs to "Social Posts" sheet for easy copy/paste
 *
 * SETUP:
 * 1. Copy this script to your Trinidad Google Apps Script project
 * 2. Set Script Property:
 *    - TRINIDAD_CSV_URL: Your published Production sheet CSV URL
 *      Example: https://docs.google.com/spreadsheets/d/e/.../pub?gid=1749261532&single=true&output=csv
 * 3. Run setupSocialPostsSheet() once to create the output sheet
 * 4. Optional: Create time-based trigger for generateDailyStats() at 3 PM daily
 *
 * USAGE:
 * - Manual: Run generateDailyStats() anytime you want fresh stats
 * - Automatic: Set up daily trigger (see setupDailyTrigger function below)
 * - View results in "Social Posts" sheet tab
 *
 * REPORTING LAG:
 * - Accounts for 2-day reporting delay (crimes happen before they're reported)
 * - On Dec 25, generates stats for Dec 17-23 (ending 2 days ago)
 * - Ensures comparison uses COMPLETE data for both weeks
 * - Adjust SOCIAL_CONFIG.lagDays if your reporting delay changes
 *
 * YEAR TRANSITIONS:
 * - When year changes (e.g., 2025 → 2026), update TRINIDAD_CSV_URL to point to new year sheet
 * - First 2 weeks of new year may have incomplete data (this is acceptable)
 */

const SOCIAL_CONFIG = {
  csvUrl: PropertiesService.getScriptProperties().getProperty('TRINIDAD_CSV_URL'),
  sheetName: 'Social Posts',
  dashboardUrl: 'https://crimehotspots.com/trinidad/dashboard',
  timezone: 'America/Port_of_Spain', // Trinidad timezone
  lagDays: 3 // Typical reporting delay: crimes from 3 days ago
};

/**
 * Main function - generates social media stats and saves to sheet
 * Run this manually or via daily trigger
 */
function generateDailyStats() {
  Logger.log('🚀 Starting social media stats generation...');

  try {
    // Fetch and parse CSV data
    const crimes = fetchCrimeData();
    Logger.log(`📊 Fetched ${crimes.length} total crimes from CSV`);

    // Calculate date ranges (accounting for reporting lag)
    const now = new Date();

    // Account for 2-day reporting lag
    const currentWeekEnd = new Date(now);
    currentWeekEnd.setDate(currentWeekEnd.getDate() - SOCIAL_CONFIG.lagDays);

    const currentWeekStart = new Date(currentWeekEnd);
    currentWeekStart.setDate(currentWeekStart.getDate() - 6); // Last 7 days

    const previousWeekEnd = new Date(currentWeekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1); // Day before current week
    const previousWeekStart = new Date(previousWeekEnd);
    previousWeekStart.setDate(previousWeekStart.getDate() - 6); // Previous 7 days

    Logger.log(`📅 Current week: ${formatDateShort(currentWeekStart)} - ${formatDateShort(currentWeekEnd)}`);
    Logger.log(`📅 Previous week: ${formatDateShort(previousWeekStart)} - ${formatDateShort(previousWeekEnd)}`);

    // Filter crimes for each period
    const currentWeekCrimes = filterCrimesByDateRange(crimes, currentWeekStart, currentWeekEnd);
    const previousWeekCrimes = filterCrimesByDateRange(crimes, previousWeekStart, previousWeekEnd);

    Logger.log(`✅ Current week: ${currentWeekCrimes.length} crimes`);
    Logger.log(`✅ Previous week: ${previousWeekCrimes.length} crimes`);

    // Calculate statistics
    const stats = calculateStats(currentWeekCrimes, previousWeekCrimes);

    // Generate post texts
    const posts = generatePostTexts(stats, currentWeekStart, currentWeekEnd);

    // Save to sheet
    saveToSheet(posts, stats);

    Logger.log('✅ Social media stats generated successfully!');
    Logger.log(`📝 Check the "${SOCIAL_CONFIG.sheetName}" sheet for results`);

    return posts;

  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    Logger.log(error.stack);
    throw error;
  }
}

/**
 * Fetches crime data from published CSV
 */
function fetchCrimeData() {
  const csvUrl = SOCIAL_CONFIG.csvUrl;

  if (!csvUrl) {
    throw new Error('TRINIDAD_CSV_URL not set in Script Properties. Run setupScriptProperties() first.');
  }

  Logger.log(`🔗 Fetching CSV from: ${csvUrl.substring(0, 50)}...`);

  const response = UrlFetchApp.fetch(csvUrl);
  const csv = response.getContentText();

  return parseCSV(csv);
}

/**
 * Simple CSV parser (handles quoted fields)
 */
function parseCSV(csv) {
  const lines = csv.split('\n');
  const headers = parseCSVLine(lines[0]);

  const crimes = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue; // Skip malformed rows

    const crime = {};
    headers.forEach((header, index) => {
      crime[header] = values[index] || '';
    });

    crimes.push(crime);
  }

  return crimes;
}

/**
 * Parse a single CSV line (handles quoted fields with commas)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim()); // Add last field
  return result;
}

/**
 * Filter crimes by date range
 */
function filterCrimesByDateRange(crimes, startDate, endDate) {
  return crimes.filter(crime => {
    const incidentDate = new Date(crime['Date']); // Changed from 'Incident Date' to 'Date'
    return incidentDate >= startDate && incidentDate <= endDate;
  });
}

/**
 * Calculate statistics comparing current vs previous week
 */
function calculateStats(currentWeekCrimes, previousWeekCrimes) {
  // Count by crime type
  const currentCounts = countByCrimeType(currentWeekCrimes);
  const previousCounts = countByCrimeType(previousWeekCrimes);

  // Calculate changes
  const changes = [];
  const allCrimeTypes = new Set([...Object.keys(currentCounts), ...Object.keys(previousCounts)]);

  allCrimeTypes.forEach(type => {
    const current = currentCounts[type] || 0;
    const previous = previousCounts[type] || 0;
    const diff = current - previous;
    const percentChange = previous > 0 ? ((diff / previous) * 100) : (current > 0 ? 100 : 0);

    changes.push({
      type: type,
      current: current,
      previous: previous,
      diff: diff,
      percentChange: percentChange,
      arrow: diff > 0 ? '↑' : (diff < 0 ? '↓' : '→')
    });
  });

  // Sort by current count (descending)
  changes.sort((a, b) => b.current - a.current);

  // Get top areas
  const topAreas = getTopAreas(currentWeekCrimes, 3);

  return {
    changes: changes,
    topAreas: topAreas,
    totalCurrent: currentWeekCrimes.length,
    totalPrevious: previousWeekCrimes.length
  };
}

/**
 * Count crimes by type
 */
function countByCrimeType(crimes) {
  const counts = {};
  crimes.forEach(crime => {
    const type = crime['Crime Type'] || 'Other';
    counts[type] = (counts[type] || 0) + 1;
  });
  return counts;
}

/**
 * Get top N areas by crime count
 */
function getTopAreas(crimes, limit) {
  const areaCounts = {};

  crimes.forEach(crime => {
    const area = crime['Area'] || 'Unknown';
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });

  const sorted = Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return sorted.map(([area, count]) => ({ area, count }));
}

/**
 * Generate post texts in multiple formats
 */
function generatePostTexts(stats, startDate, endDate) {
  const dateRange = `${formatDateShort(startDate)}-${formatDateShort(endDate)}`;

  // Top 3-5 crime types for display
  const topCrimes = stats.changes.slice(0, 5).filter(c => c.current > 0);

  // Calculate total incidents comparison
  const totalDiff = stats.totalCurrent - stats.totalPrevious;
  const totalPercentChange = stats.totalPrevious > 0 ? ((totalDiff / stats.totalPrevious) * 100) : 0;
  const totalArrow = totalDiff > 0 ? '↑' : (totalDiff < 0 ? '↓' : '→');
  const totalSign = totalDiff >= 0 ? '+' : '';
  const totalTrend = `${stats.totalCurrent} incidents (${totalSign}${totalDiff}, ${totalArrow}${Math.abs(Math.round(totalPercentChange))}%)`;

  // Build crime type lines
  const crimeLines = topCrimes.map(c => {
    const sign = c.diff >= 0 ? '+' : '';
    return `• ${c.type}: ${c.current} incidents (${sign}${c.diff}, ${c.arrow}${Math.abs(Math.round(c.percentChange))}%)`;
  }).join('\n');

  // Build hotspots line
  const hotspots = stats.topAreas.map(a => `${a.area} (${a.count})`).join(', ');

  // LONG VERSION (Facebook, WhatsApp)
  const longPost = `🇹🇹 Trinidad Crime Update (${dateRange})

📊 Total: ${totalTrend}

Top Crime Types:
${crimeLines}

🔥 Hotspots: ${hotspots}

View interactive dashboard: ${SOCIAL_CONFIG.dashboardUrl}

#Trinidad #TnT #CrimeStats #PublicSafety #CaribbeanCrime`;

  // Handle empty data case
  if (topCrimes.length === 0 || stats.topAreas.length === 0) {
    const emptyPost = `🇹🇹 Trinidad Crime Update (${dateRange})

✅ No crimes reported in this period.

This is excellent news for public safety!

View dashboard: ${SOCIAL_CONFIG.dashboardUrl}

#Trinidad #TnT #CrimeStats #PublicSafety`;

    return {
      long: emptyPost,
      medium: emptyPost,
      short: emptyPost,
      charCounts: {
        long: emptyPost.length,
        medium: emptyPost.length,
        short: emptyPost.length
      }
    };
  }

  // MEDIUM VERSION (Instagram)
  const mediumCrimeLines = topCrimes.slice(0, 3).map(c => {
    const sign = c.diff >= 0 ? '+' : '';
    return `• ${c.type}: ${c.current} (${sign}${c.diff}, ${c.arrow}${Math.abs(Math.round(c.percentChange))}%)`;
  }).join('\n');

  const mediumPost = `🇹🇹 Crime Update (${dateRange})

📊 Total: ${totalTrend}

${mediumCrimeLines}

🔥 Top: ${stats.topAreas[0].area} (${stats.topAreas[0].count})

View dashboard: ${SOCIAL_CONFIG.dashboardUrl}

#Trinidad #CrimeStats #PublicSafety`;

  // SHORT VERSION (Twitter/X - must be under 280 chars)
  const topCrime = topCrimes[0];
  const sign = topCrime.diff >= 0 ? '+' : '';

  const shortPost = `🇹🇹 Trinidad Crime (${dateRange})

Total: ${totalTrend}
Top type: ${topCrime.type} (${topCrime.current})
Top area: ${stats.topAreas[0].area}

${SOCIAL_CONFIG.dashboardUrl}

#Trinidad #CrimeStats`;

  return {
    long: longPost,
    medium: mediumPost,
    short: shortPost,
    charCounts: {
      long: longPost.length,
      medium: mediumPost.length,
      short: shortPost.length
    }
  };
}

/**
 * Save generated posts to sheet
 */
function saveToSheet(posts, stats) {
  const sheet = getOrCreateSocialPostsSheet();

  // Clear previous content (keep last 30 rows for history)
  const lastRow = sheet.getLastRow();
  if (lastRow > 31) {
    sheet.deleteRows(2, lastRow - 31); // Keep header + last 30
  }

  // Add new row at top (below header)
  sheet.insertRowBefore(2);

  const timestamp = new Date();
  const formattedTimestamp = Utilities.formatDate(timestamp, SOCIAL_CONFIG.timezone, 'yyyy-MM-dd HH:mm:ss');

  // Format: Timestamp | Long Post | Medium Post | Short Post | Stats Summary
  const statSummary = `${stats.totalCurrent} crimes this week (vs ${stats.totalPrevious} last week)`;

  sheet.getRange(2, 1, 1, 5).setValues([[
    formattedTimestamp,
    posts.long,
    posts.medium,
    posts.short,
    statSummary
  ]]);

  // Set row height for better readability
  sheet.setRowHeight(2, 150);

  // Auto-resize columns
  sheet.autoResizeColumns(1, 5);

  Logger.log(`📝 Saved to sheet at row 2`);
}

/**
 * Get or create the Social Posts sheet
 */
function getOrCreateSocialPostsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SOCIAL_CONFIG.sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(SOCIAL_CONFIG.sheetName);

    // Set up headers
    const headers = [
      'Generated At',
      'Long Post (Facebook/WhatsApp)',
      'Medium Post (Instagram)',
      'Short Post (Twitter/X)',
      'Stats Summary'
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#f3f3f3');

    // Set column widths
    sheet.setColumnWidth(1, 150); // Timestamp
    sheet.setColumnWidth(2, 400); // Long post
    sheet.setColumnWidth(3, 350); // Medium post
    sheet.setColumnWidth(4, 300); // Short post
    sheet.setColumnWidth(5, 250); // Stats

    // Enable text wrapping for post columns
    sheet.getRange(2, 2, 100, 3).setWrap(true);

    Logger.log(`✅ Created new "${SOCIAL_CONFIG.sheetName}" sheet`);
  }

  return sheet;
}

/**
 * Helper: Format date as "Dec 18"
 */
function formatDateShort(date) {
  return Utilities.formatDate(date, SOCIAL_CONFIG.timezone, 'MMM d');
}

/**
 * SETUP FUNCTION: Set Script Properties
 * Run this once to configure the CSV URL
 */
function setupScriptProperties() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.prompt(
    'Setup Social Media Stats',
    'Enter your Trinidad Production CSV URL\n(From File → Share → Publish to web → CSV):',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() === ui.Button.OK) {
    const csvUrl = result.getResponseText().trim();
    PropertiesService.getScriptProperties().setProperty('TRINIDAD_CSV_URL', csvUrl);

    ui.alert('✅ Setup Complete!',
             `CSV URL saved.\n\nNow run:\n1. setupSocialPostsSheet() - Creates output sheet\n2. generateDailyStats() - Generates first post`,
             ui.ButtonSet.OK);

    Logger.log('✅ CSV URL saved to Script Properties');
  }
}

/**
 * SETUP FUNCTION: Create the Social Posts sheet
 * Run this once after setupScriptProperties()
 */
function setupSocialPostsSheet() {
  getOrCreateSocialPostsSheet();

  const ui = SpreadsheetApp.getUi();
  ui.alert('✅ Sheet Created!',
           `The "${SOCIAL_CONFIG.sheetName}" sheet is ready.\n\nNext: Run generateDailyStats() to create your first post!`,
           ui.ButtonSet.OK);
}

/**
 * SETUP FUNCTION: Create daily trigger (runs at 3 PM Trinidad time)
 * Run this once to enable automatic daily stats
 */
function setupDailyTrigger() {
  // Delete existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateDailyStats') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger: Daily at 3 PM
  ScriptApp.newTrigger('generateDailyStats')
    .timeBased()
    .everyDays(1)
    .atHour(15) // 3 PM
    .inTimezone(SOCIAL_CONFIG.timezone)
    .create();

  Logger.log('✅ Daily trigger created (3 PM Trinidad time)');

  const ui = SpreadsheetApp.getUi();
  ui.alert('✅ Automation Enabled!',
           'Stats will auto-generate daily at 3 PM Trinidad time.\n\nResults appear in the "Social Posts" sheet.',
           ui.ButtonSet.OK);
}

/**
 * DIAGNOSTIC FUNCTION: Check what dates are in your CSV
 * Run this to debug date filtering issues
 */
function debugDates() {
  Logger.log('🔍 DIAGNOSTIC: Checking date formats in CSV...');

  const crimes = fetchCrimeData();
  Logger.log(`✅ Fetched ${crimes.length} total crimes\n`);

  // Show first 5 crimes and their date values
  Logger.log('📅 First 5 crimes in CSV:');
  crimes.slice(0, 5).forEach((crime, index) => {
    const rawDate = crime['Date'];
    const parsedDate = new Date(rawDate);
    Logger.log(`${index + 1}. Raw: "${rawDate}" → Parsed: ${parsedDate} → Valid: ${!isNaN(parsedDate)}`);
  });

  // Show date range in dataset
  const validDates = crimes
    .map(c => new Date(c['Date']))
    .filter(d => !isNaN(d))
    .sort((a, b) => a - b);

  if (validDates.length > 0) {
    Logger.log(`\n📊 Date range in dataset:`);
    Logger.log(`  Earliest: ${validDates[0]}`);
    Logger.log(`  Latest: ${validDates[validDates.length - 1]}`);
    Logger.log(`  Valid dates: ${validDates.length} / ${crimes.length}`);
  } else {
    Logger.log('\n❌ No valid dates found! Check your CSV column name.');
  }

  // Show what the script is looking for (with lag adjustment)
  const now = new Date();
  const currentWeekEnd = new Date(now);
  currentWeekEnd.setDate(currentWeekEnd.getDate() - SOCIAL_CONFIG.lagDays);
  const currentWeekStart = new Date(currentWeekEnd);
  currentWeekStart.setDate(currentWeekStart.getDate() - 6);

  Logger.log(`\n🎯 Script is looking for crimes between:`);
  Logger.log(`  ${currentWeekStart} and ${currentWeekEnd}`);
  Logger.log(`  (Accounting for ${SOCIAL_CONFIG.lagDays}-day reporting lag)`);

  // Check column names
  Logger.log(`\n📋 Available columns in CSV:`);
  if (crimes.length > 0) {
    Object.keys(crimes[0]).forEach(col => Logger.log(`  - "${col}"`));
  }
}

/**
 * TEST FUNCTION: Quick test without saving to sheet
 */
function testStatsGeneration() {
  Logger.log('🧪 Testing stats generation...');

  const crimes = fetchCrimeData();
  Logger.log(`✅ Fetched ${crimes.length} crimes`);

  const now = new Date();
  const currentWeekEnd = new Date(now);
  currentWeekEnd.setDate(currentWeekEnd.getDate() - SOCIAL_CONFIG.lagDays);
  const currentWeekStart = new Date(currentWeekEnd);
  currentWeekStart.setDate(currentWeekStart.getDate() - 6);

  const currentWeekCrimes = filterCrimesByDateRange(crimes, currentWeekStart, currentWeekEnd);
  Logger.log(`✅ Current week: ${currentWeekCrimes.length} crimes`);

  if (currentWeekCrimes.length === 0) {
    Logger.log('⚠️ No crimes found in date range. Run debugDates() to diagnose.');
    return;
  }

  Logger.log('\n📊 Sample crime types:');
  const counts = countByCrimeType(currentWeekCrimes);
  Object.entries(counts).slice(0, 5).forEach(([type, count]) => {
    Logger.log(`  ${type}: ${count}`);
  });

  Logger.log('\n✅ Test successful! Run generateDailyStats() to create full post.');
}
