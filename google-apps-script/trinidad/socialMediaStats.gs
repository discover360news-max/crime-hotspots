/**
 * SOCIAL MEDIA STATS GENERATOR
 *
 * THREE MODES FOR GENERATING CRIME STATISTICS:
 * 1. Daily Stats (Automatic with 3-day lag)
 * 2. Monthly Stats (Automatic on 5th of month)
 * 3. Custom Stats (Manual for any date range)
 *
 * SETUP:
 * 1. Copy this script to your Trinidad Google Apps Script project
 * 2. Run setupScriptProperties() to set CSV URL
 * 3. Run setupSocialPostsSheet() to create output sheet
 * 4. Optional automation:
 *    - Run setupDailyTrigger() for weekly stats at 3 PM daily
 *    - Run setupMonthlyTrigger() for monthly stats on 5th at 9 AM
 *
 * ========================================
 * MODE 1: DAILY WEEKLY STATS (WITH LAG)
 * ========================================
 * Function: generateDailyStats()
 * Purpose: Weekly crime comparison with 3-day reporting lag
 * Schedule: Daily at 3 PM (optional trigger)
 *
 * How it works:
 * - Uses 3-day lag to ensure complete data
 * - On Dec 31: Compares Dec 21-27 vs Dec 14-20
 * - Both weeks are complete (crimes have had 4+ days to be reported)
 *
 * Usage:
 * - Manual: Run generateDailyStats() anytime
 * - Auto: Run setupDailyTrigger() once to enable daily automation
 *
 * ========================================
 * MODE 2: MONTHLY STATS (NO LAG)
 * ========================================
 * Function: generateMonthlyStats(year, month)
 * Purpose: Full month comparison for comprehensive reviews
 * Schedule: 5th of month at 9 AM (optional trigger)
 *
 * How it works:
 * - Run on 5th of month to get complete previous month data
 * - On Jan 5: Compares Dec 1-31 vs Nov 1-30
 * - Gives 5 days for December crimes to be fully reported
 *
 * Usage:
 * - Easy mode: Run generateMonthlyStatsWithPrompt() - prompts for year/month
 * - Script mode: generateMonthlyStats(2025, 12) for December 2025
 * - Auto: Run setupMonthlyTrigger() once to enable monthly automation
 *
 * ========================================
 * MODE 3: CUSTOM STATS (NO LAG)
 * ========================================
 * Function: generateCustomStats(startDateStr, endDateStr)
 * Purpose: Analyze any specific date range
 * Schedule: Manual only
 *
 * How it works:
 * - You specify exact start and end dates
 * - No lag applied - uses dates you provide
 * - Compares against previous period of same duration
 *
 * Usage:
 * - Easy mode: Run generateCustomStatsWithPrompt() - prompts for dates
 * - Script mode: generateCustomStats('2025-12-01', '2025-12-31') - Full December
 * - Script mode: generateCustomStats('2025-12-21', '2025-12-27') - Specific week
 *
 * ========================================
 * OUTPUT:
 * ========================================
 * All modes save to "Social Posts" sheet with three versions:
 * - Long (Facebook/WhatsApp)
 * - Medium (Instagram)
 * - Short (Twitter/X)
 *
 * ========================================
 * YEAR TRANSITIONS:
 * ========================================
 * When year changes (e.g., 2025 → 2026):
 * - Update TRINIDAD_CSV_URL Script Property to point to new year sheet
 * - First 2 weeks of new year may have incomplete data (acceptable)
 */

const SOCIAL_CONFIG = {
  csvUrl: PropertiesService.getScriptProperties().getProperty('TRINIDAD_CSV_URL'),
  sheetName: 'Social Posts',
  dashboardUrl: 'https://crimehotspots.com/trinidad/dashboard',
  timezone: 'America/Port_of_Spain', // Trinidad timezone
  lagDays: 3 // Reporting delay: crimes take ~3 days to be fully reported
};

/**
 * CRIME TYPE CONFIGURATION
 * Controls which crime types use victim count multipliers
 *
 * useVictimCount Rules:
 * - true: Multiply PRIMARY crime type by victimCount (e.g., double murder = 2)
 * - false: Count as 1 incident regardless of victim count
 *
 * IMPORTANT: Victim count ONLY applies to PRIMARY crime type.
 * Related crimes ALWAYS count as +1 (incident-based).
 *
 * NOTE: Incidents (row count) always remain as-is. This only affects crime type counts.
 */
const SOCIAL_CRIME_TYPE_CONFIG = {
  // Victim-count crimes (count each victim for PRIMARY crime only)
  'Murder': { useVictimCount: true },
  'Assault': { useVictimCount: true },
  'Sexual Assault': { useVictimCount: true },
  'Kidnapping': { useVictimCount: true },
  'Robbery': { useVictimCount: true },
  'Shooting': { useVictimCount: true },

  // Incident-count crimes (always count as 1 incident)
  'Burglary': { useVictimCount: false },
  'Home Invasion': { useVictimCount: false },
  'Seizures': { useVictimCount: false },
  'Theft': { useVictimCount: false }
};

/**
 * Helper: Check if crime type uses victim count
 */
function usesVictimCount(crimeType) {
  return SOCIAL_CRIME_TYPE_CONFIG[crimeType]?.useVictimCount || false;
}

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

    // Account for reporting lag: end week on (today - lagDays - 1) to ensure complete data
    // Example: On Dec 31 with 3-day lag, end on Dec 27 (giving time for Dec 27 crimes to be reported by Dec 30)
    const currentWeekEnd = new Date(now);
    currentWeekEnd.setDate(currentWeekEnd.getDate() - SOCIAL_CONFIG.lagDays - 1);
    currentWeekEnd.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

    const currentWeekStart = new Date(currentWeekEnd);
    currentWeekStart.setDate(currentWeekStart.getDate() - 6); // 7-day week
    currentWeekStart.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

    const previousWeekEnd = new Date(currentWeekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1); // Day before current week
    previousWeekEnd.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

    const previousWeekStart = new Date(previousWeekEnd);
    previousWeekStart.setDate(previousWeekStart.getDate() - 6); // Previous 7 days
    previousWeekStart.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

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
 * Generate monthly stats with UI prompts (run this from menu)
 * Prompts you to enter year and month
 */
function generateMonthlyStatsWithPrompt() {
  const ui = SpreadsheetApp.getUi();

  // Prompt for year
  const yearResult = ui.prompt(
    'Generate Monthly Stats - Step 1 of 2',
    'Enter the year (e.g., 2025):',
    ui.ButtonSet.OK_CANCEL
  );

  if (yearResult.getSelectedButton() !== ui.Button.OK) {
    ui.alert('Cancelled', 'Monthly stats generation cancelled.', ui.ButtonSet.OK);
    return;
  }

  const year = parseInt(yearResult.getResponseText().trim());

  if (isNaN(year) || year < 2020 || year > 2030) {
    ui.alert('Invalid Year', 'Please enter a valid year between 2020 and 2030.', ui.ButtonSet.OK);
    return;
  }

  // Prompt for month
  const monthResult = ui.prompt(
    'Generate Monthly Stats - Step 2 of 2',
    'Enter the month (1-12, where 1=January, 12=December):',
    ui.ButtonSet.OK_CANCEL
  );

  if (monthResult.getSelectedButton() !== ui.Button.OK) {
    ui.alert('Cancelled', 'Monthly stats generation cancelled.', ui.ButtonSet.OK);
    return;
  }

  const month = parseInt(monthResult.getResponseText().trim());

  if (isNaN(month) || month < 1 || month > 12) {
    ui.alert('Invalid Month', 'Please enter a valid month between 1 and 12.', ui.ButtonSet.OK);
    return;
  }

  // Get month name for confirmation
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month - 1];

  // Confirm before running
  const confirm = ui.alert(
    'Confirm',
    `Generate stats for ${monthName} ${year}?`,
    ui.ButtonSet.YES_NO
  );

  if (confirm === ui.Button.YES) {
    generateMonthlyStats(year, month);
    ui.alert('✅ Success!',
             `Monthly stats for ${monthName} ${year} generated successfully!\n\nCheck the "Social Posts" sheet for results.`,
             ui.ButtonSet.OK);
  } else {
    ui.alert('Cancelled', 'Monthly stats generation cancelled.', ui.ButtonSet.OK);
  }
}

/**
 * Generate monthly stats comparing current month vs previous month
 * Run this on the 5th of each month to get complete previous month data
 *
 * @param {number} year - Year (e.g., 2025)
 * @param {number} month - Month (1-12, where 1 = January)
 *
 * Example usage:
 *   generateMonthlyStats(2025, 12)  // December 2025 stats
 *   OR use generateMonthlyStatsWithPrompt() for UI prompts
 */
function generateMonthlyStats(year, month) {
  // Validate parameters
  if (!year || !month) {
    throw new Error('Missing parameters! Use generateMonthlyStatsWithPrompt() for UI prompts, or call generateMonthlyStats(year, month) with parameters.');
  }

  Logger.log(`🚀 Generating monthly stats for ${year}-${month}...`);

  try {
    // Fetch and parse CSV data
    const crimes = fetchCrimeData();
    Logger.log(`📊 Fetched ${crimes.length} total crimes from CSV`);

    // Current month date range (use noon to avoid timezone issues)
    const currentMonthStart = new Date(year, month - 1, 1, 12, 0, 0, 0); // First day at noon
    const currentMonthEnd = new Date(year, month, 0, 12, 0, 0, 0); // Last day at noon

    // Previous month date range (use noon to avoid timezone issues)
    const previousMonthStart = new Date(year, month - 2, 1, 12, 0, 0, 0); // First day at noon
    const previousMonthEnd = new Date(year, month - 1, 0, 12, 0, 0, 0); // Last day at noon

    Logger.log(`📅 Current month: ${formatDateShort(currentMonthStart)} - ${formatDateShort(currentMonthEnd)}`);
    Logger.log(`📅 Previous month: ${formatDateShort(previousMonthStart)} - ${formatDateShort(previousMonthEnd)}`);

    // Filter crimes for each period
    const currentMonthCrimes = filterCrimesByDateRange(crimes, currentMonthStart, currentMonthEnd);
    const previousMonthCrimes = filterCrimesByDateRange(crimes, previousMonthStart, previousMonthEnd);

    Logger.log(`✅ Current month: ${currentMonthCrimes.length} crimes`);
    Logger.log(`✅ Previous month: ${previousMonthCrimes.length} crimes`);

    // Calculate statistics
    const stats = calculateStats(currentMonthCrimes, previousMonthCrimes);

    // Generate post texts with month names
    const posts = generateMonthlyPostTexts(stats, currentMonthStart, currentMonthEnd, previousMonthStart);

    // Save to sheet
    saveToSheet(posts, stats);

    Logger.log('✅ Monthly stats generated successfully!');
    Logger.log(`📝 Check the "${SOCIAL_CONFIG.sheetName}" sheet for results`);

    return posts;

  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    Logger.log(error.stack);
    throw error;
  }
}

/**
 * Generate custom stats with UI prompts (run this from menu)
 * Prompts you to enter start and end dates
 */
function generateCustomStatsWithPrompt() {
  const ui = SpreadsheetApp.getUi();

  // Prompt for start date
  const startResult = ui.prompt(
    'Generate Custom Stats - Step 1 of 2',
    'Enter start date (YYYY-MM-DD format, e.g., 2025-12-21):',
    ui.ButtonSet.OK_CANCEL
  );

  if (startResult.getSelectedButton() !== ui.Button.OK) {
    ui.alert('Cancelled', 'Custom stats generation cancelled.', ui.ButtonSet.OK);
    return;
  }

  const startDateStr = startResult.getResponseText().trim();

  // Validate start date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) {
    ui.alert('Invalid Format', 'Please enter date in YYYY-MM-DD format (e.g., 2025-12-21).', ui.ButtonSet.OK);
    return;
  }

  // Prompt for end date
  const endResult = ui.prompt(
    'Generate Custom Stats - Step 2 of 2',
    'Enter end date (YYYY-MM-DD format, e.g., 2025-12-27):',
    ui.ButtonSet.OK_CANCEL
  );

  if (endResult.getSelectedButton() !== ui.Button.OK) {
    ui.alert('Cancelled', 'Custom stats generation cancelled.', ui.ButtonSet.OK);
    return;
  }

  const endDateStr = endResult.getResponseText().trim();

  // Validate end date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
    ui.alert('Invalid Format', 'Please enter date in YYYY-MM-DD format (e.g., 2025-12-27).', ui.ButtonSet.OK);
    return;
  }

  // Validate end date is after start date
  if (new Date(endDateStr) < new Date(startDateStr)) {
    ui.alert('Invalid Range', 'End date must be after start date.', ui.ButtonSet.OK);
    return;
  }

  // Confirm before running
  const confirm = ui.alert(
    'Confirm',
    `Generate stats for ${startDateStr} to ${endDateStr}?`,
    ui.ButtonSet.YES_NO
  );

  if (confirm === ui.Button.YES) {
    generateCustomStats(startDateStr, endDateStr);
    ui.alert('✅ Success!',
             `Custom stats for ${startDateStr} to ${endDateStr} generated successfully!\n\nCheck the "Social Posts" sheet for results.`,
             ui.ButtonSet.OK);
  } else {
    ui.alert('Cancelled', 'Custom stats generation cancelled.', ui.ButtonSet.OK);
  }
}

/**
 * Generate custom stats for any date range (NO lag applied)
 * Use this for manual analysis of specific periods
 *
 * @param {string} startDateStr - Start date in YYYY-MM-DD format (e.g., '2025-12-01')
 * @param {string} endDateStr - End date in YYYY-MM-DD format (e.g., '2025-12-31')
 *
 * Example usage:
 *   generateCustomStats('2025-12-01', '2025-12-31')  // Full December
 *   generateCustomStats('2025-12-21', '2025-12-27')  // Specific week
 *   OR use generateCustomStatsWithPrompt() for UI prompts
 */
function generateCustomStats(startDateStr, endDateStr) {
  // Validate parameters
  if (!startDateStr || !endDateStr) {
    throw new Error('Missing parameters! Use generateCustomStatsWithPrompt() for UI prompts, or call generateCustomStats(startDate, endDate) with parameters.');
  }

  Logger.log(`🚀 Generating custom stats for ${startDateStr} to ${endDateStr}...`);

  try {
    // Fetch and parse CSV data
    const crimes = fetchCrimeData();
    Logger.log(`📊 Fetched ${crimes.length} total crimes from CSV`);

    // Parse dates (use noon to avoid timezone issues)
    const currentStart = new Date(startDateStr + 'T12:00:00');
    const currentEnd = new Date(endDateStr + 'T12:00:00');

    // Calculate previous period (same duration, immediately before)
    const duration = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24)); // Days
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - duration + 1);
    previousStart.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

    Logger.log(`📅 Current period: ${formatDateShort(currentStart)} - ${formatDateShort(currentEnd)} (${duration} days)`);
    Logger.log(`📅 Previous period: ${formatDateShort(previousStart)} - ${formatDateShort(previousEnd)} (${duration} days)`);

    // Filter crimes for each period
    const currentCrimes = filterCrimesByDateRange(crimes, currentStart, currentEnd);
    const previousCrimes = filterCrimesByDateRange(crimes, previousStart, previousEnd);

    Logger.log(`✅ Current period: ${currentCrimes.length} crimes`);
    Logger.log(`✅ Previous period: ${previousCrimes.length} crimes`);

    // Calculate statistics
    const stats = calculateStats(currentCrimes, previousCrimes);

    // Generate post texts
    const posts = generatePostTexts(stats, currentStart, currentEnd);

    // Save to sheet
    saveToSheet(posts, stats);

    Logger.log('✅ Custom stats generated successfully!');
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
 * IMPORTANT: Normalizes crime dates to noon (12:00:00) to match boundary date format
 */
function filterCrimesByDateRange(crimes, startDate, endDate) {
  return crimes.filter(crime => {
    const incidentDate = new Date(crime['Date']); // Parses as midnight (00:00:00)
    incidentDate.setHours(12, 0, 0, 0); // Normalize to noon to match startDate/endDate
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
 * Supports both old format (Crime Type) and new format (primaryCrimeType + relatedCrimeTypes)
 * Applies victim count multipliers for configured crime types (primary only)
 */
function countByCrimeType(crimes) {
  const counts = {};
  crimes.forEach(crime => {
    // Try new format first (2026+ data with primary + related crime types)
    const primaryType = crime['primaryCrimeType'] || crime['Primary Crime Type'];
    const relatedTypes = crime['relatedCrimeTypes'] || crime['Related Crime Types'] || '';
    const victimCount = parseInt(crime['victimCount'] || crime['Victim Count'] || '1', 10) || 1;

    if (primaryType && primaryType.trim() !== '') {
      // New format: count primary type with victim multiplier if configured
      if (!counts[primaryType]) counts[primaryType] = 0;

      if (usesVictimCount(primaryType)) {
        counts[primaryType] += victimCount; // Multiply by victim count
      } else {
        counts[primaryType] += 1; // Count as 1 incident
      }

      // New format: count related types (pipe-separated, always +1 each)
      if (relatedTypes && relatedTypes.trim() !== '') {
        const related = relatedTypes.split('|').map(t => t.trim()).filter(t => t !== '');
        related.forEach(type => {
          counts[type] = (counts[type] || 0) + 1; // Related crimes always +1
        });
      }
    } else {
      // Fallback to old format (2025 and earlier data)
      const type = crime['Crime Type'] || crime['crimeType'] || 'Other';
      counts[type] = (counts[type] || 0) + 1; // 2025 data doesn't have victim count
    }
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
 * Generate monthly post texts (similar to generatePostTexts but with month names)
 */
function generateMonthlyPostTexts(stats, currentMonthStart, currentMonthEnd, previousMonthStart) {
  // Format month names
  const currentMonthName = Utilities.formatDate(currentMonthStart, SOCIAL_CONFIG.timezone, 'MMMM yyyy');
  const previousMonthName = Utilities.formatDate(previousMonthStart, SOCIAL_CONFIG.timezone, 'MMMM yyyy');

  // Top 3-5 crime types for display
  const topCrimes = stats.changes.slice(0, 5).filter(c => c.current > 0);

  // Calculate total incidents comparison
  const totalDiff = stats.totalCurrent - stats.totalPrevious;
  const totalPercentChange = stats.totalPrevious > 0 ? ((totalDiff / stats.totalPrevious) * 100) : 0;
  const totalArrow = totalDiff > 0 ? '↑' : (totalDiff < 0 ? '↓' : '→');
  const totalSign = totalDiff >= 0 ? '+' : '';
  const totalTrend = `${stats.totalCurrent} incidents (${totalSign}${totalDiff}, ${totalArrow}${Math.abs(Math.round(totalPercentChange))}% vs ${previousMonthName})`;

  // Build crime type lines
  const crimeLines = topCrimes.map(c => {
    const sign = c.diff >= 0 ? '+' : '';
    return `• ${c.type}: ${c.current} incidents (${sign}${c.diff}, ${c.arrow}${Math.abs(Math.round(c.percentChange))}%)`;
  }).join('\n');

  // Build hotspots line
  const hotspots = stats.topAreas.map(a => `${a.area} (${a.count})`).join(', ');

  // LONG VERSION (Facebook, WhatsApp)
  const longPost = `🇹🇹 Trinidad Crime Report - ${currentMonthName}

📊 Total: ${totalTrend}

Top Crime Types:
${crimeLines}

🔥 Hotspots: ${hotspots}

View interactive dashboard: ${SOCIAL_CONFIG.dashboardUrl}

#Trinidad #TnT #CrimeStats #PublicSafety #CaribbeanCrime`;

  // Handle empty data case
  if (topCrimes.length === 0 || stats.topAreas.length === 0) {
    const emptyPost = `🇹🇹 Trinidad Crime Report - ${currentMonthName}

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

  const mediumPost = `🇹🇹 ${currentMonthName} Crime Report

📊 Total: ${totalTrend}

${mediumCrimeLines}

🔥 Top: ${stats.topAreas[0].area} (${stats.topAreas[0].count})

View dashboard: ${SOCIAL_CONFIG.dashboardUrl}

#Trinidad #CrimeStats #PublicSafety`;

  // SHORT VERSION (Twitter/X - must be under 280 chars)
  const topCrime = topCrimes[0];
  const sign = topCrime.diff >= 0 ? '+' : '';

  const shortPost = `🇹🇹 ${currentMonthName} Crime

Total: ${stats.totalCurrent} (${totalSign}${totalDiff})
Top: ${topCrime.type} (${topCrime.current})
Hotspot: ${stats.topAreas[0].area}

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
 * SETUP FUNCTION: Create monthly trigger (runs on 5th of month at 9 AM Trinidad time)
 * Run this once to enable automatic monthly stats
 */
function setupMonthlyTrigger() {
  // Delete existing monthly triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateMonthlyStatsAuto') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger: Monthly on the 5th at 9 AM
  ScriptApp.newTrigger('generateMonthlyStatsAuto')
    .timeBased()
    .onMonthDay(5) // Run on the 5th of each month
    .atHour(9) // 9 AM
    .inTimezone(SOCIAL_CONFIG.timezone)
    .create();

  Logger.log('✅ Monthly trigger created (5th of month at 9 AM Trinidad time)');

  const ui = SpreadsheetApp.getUi();
  ui.alert('✅ Monthly Automation Enabled!',
           'Stats will auto-generate on the 5th of each month at 9 AM Trinidad time.\n\nResults appear in the "Social Posts" sheet.',
           ui.ButtonSet.OK);
}

/**
 * AUTO FUNCTION: Called by monthly trigger
 * Automatically generates stats for previous month
 */
function generateMonthlyStatsAuto() {
  const now = new Date();

  // Get previous month
  const previousMonth = now.getMonth(); // 0-11 (current month is Jan, we want Dec)
  const year = previousMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = previousMonth === 0 ? 12 : previousMonth;

  Logger.log(`🤖 Auto-generating monthly stats for ${year}-${month}...`);

  generateMonthlyStats(year, month);
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
  currentWeekEnd.setDate(currentWeekEnd.getDate() - SOCIAL_CONFIG.lagDays - 1);
  currentWeekEnd.setHours(12, 0, 0, 0); // Noon to avoid timezone issues
  const currentWeekStart = new Date(currentWeekEnd);
  currentWeekStart.setDate(currentWeekStart.getDate() - 6);
  currentWeekStart.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

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
  currentWeekEnd.setDate(currentWeekEnd.getDate() - SOCIAL_CONFIG.lagDays - 1);
  currentWeekEnd.setHours(12, 0, 0, 0); // Noon to avoid timezone issues
  const currentWeekStart = new Date(currentWeekEnd);
  currentWeekStart.setDate(currentWeekStart.getDate() - 6);
  currentWeekStart.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

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
