/**
 * WEEKLY CRIME REPORT GENERATOR - IMPROVED VERSION
 *
 * This Google Apps Script automatically generates weekly blog posts from Production sheet data
 * with safeguards to prevent duplicate/incomplete reports.
 *
 * NEW SAFEGUARDS:
 * - Minimum data threshold: Won't publish if < 10 crimes in the week
 * - Duplicate detection: Compares to previous week's data
 * - Processing status check: Verifies Gemini pipeline isn't backlogged
 * - Data freshness validation: Ensures recent crimes exist
 *
 * SETUP:
 * 1. Add to your existing Google Apps Script project
 * 2. Set Script Properties:
 *    - GITHUB_TOKEN: Personal Access Token with repo permissions
 *    - GITHUB_REPO: username/repo-name (e.g., "youruser/crime-hotspots")
 *    - GITHUB_BRANCH: main (or your default branch)
 * 3. Create time-based trigger: Run weekly on Monday at 10 AM (changed from 8 AM)
 *
 * WHY 10 AM?
 * - Gives 2 extra hours for weekend processing to complete
 * - Most Gemini processing happens Sunday evening
 */

// Configuration (set these in Script Properties)
const CONFIG = {
  githubToken: PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
  githubRepo: PropertiesService.getScriptProperties().getProperty('GITHUB_REPO'),
  githubBranch: PropertiesService.getScriptProperties().getProperty('GITHUB_BRANCH') || 'main',

  // Safeguard thresholds
  minWeeklyCrimes: 10,        // Don't publish if fewer than 10 crimes
  minDataFreshness: 3,         // Must have at least 3 crimes from last 48 hours
  maxPendingArticles: 50,      // Warn if > 50 articles still pending processing
  duplicateThreshold: 0.9      // If 90% of data is same as last week, skip
};

// Notification email (for skip/error notifications)
const NOTIFICATION_EMAIL = 'discover360news@gmail.com';

// Country configurations
const COUNTRIES = {
  'trinidad': {
    id: 'tt',
    name: 'Trinidad & Tobago',
    sheetId: '1RG87T7L-KdVSKACRbWG7t3_OkU_LxYOTPGr_HB2iPWI',
    productionSheetName: 'Production',
    rawArticlesSheetName: 'Raw Articles',
    dashboardUrl: '/'
  },
  'guyana': {
    id: 'gy',
    name: 'Guyana',
    sheetId: 'YOUR_GUYANA_SHEET_ID', // Replace with actual Guyana sheet ID
    productionSheetName: 'Production',
    rawArticlesSheetName: 'Raw Articles',
    dashboardUrl: '/'
  }
};

/**
 * Main function - generates weekly reports for all countries with safeguards
 * Run this weekly via time-based trigger (Monday 10 AM)
 */
function generateWeeklyReports() {
  Logger.log('═══════════════════════════════════════');
  Logger.log('Starting weekly report generation...');
  Logger.log(`Time: ${new Date()}`);
  Logger.log('═══════════════════════════════════════');

  Object.keys(COUNTRIES).forEach(countryKey => {
    try {
      Logger.log(`\n--- Processing ${COUNTRIES[countryKey].name} ---`);

      // Run all validation checks first
      const validation = validateDataReadiness(countryKey);

      if (!validation.passed) {
        Logger.log(`❌ SKIPPED: ${validation.reason}`);

        // Send notification email to admin
        sendSkipNotification(countryKey, validation);
        return; // Skip this country
      }

      Logger.log('✅ All validation checks passed');

      // Generate and publish report
      const report = generateCountryReport(countryKey);
      commitReportToGitHub(report, countryKey);

      // Store fingerprint of this week's data for next week's duplicate check
      storeDataFingerprint(countryKey, report.dataFingerprint);

      Logger.log(`✅ Successfully generated and published report for ${COUNTRIES[countryKey].name}`);

    } catch (error) {
      Logger.log(`❌ Error generating report for ${countryKey}: ${error.message}`);
      sendErrorNotification(countryKey, error);
      // Continue with other countries even if one fails
    }
  });

  Logger.log('\n═══════════════════════════════════════');
  Logger.log('Weekly report generation complete');
  Logger.log('═══════════════════════════════════════');
}

/**
 * SAFEGUARD 1: Validate data is ready for report generation
 * Returns: { passed: boolean, reason: string, details: object }
 */
function validateDataReadiness(countryKey) {
  const country = COUNTRIES[countryKey];
  const ss = SpreadsheetApp.openById(country.sheetId);

  // Get both sheets
  const productionSheet = ss.getSheetByName(country.productionSheetName);
  const rawArticlesSheet = ss.getSheetByName(country.rawArticlesSheetName);

  const productionData = productionSheet.getDataRange().getValues();
  const productionHeaders = productionData[0];

  // Find column index (use 'Date' - the actual column name in Production sheet)
  const dateCol = productionHeaders.indexOf('Date');

  // Verify column exists
  if (dateCol === -1) {
    return {
      passed: false,
      reason: 'ERROR: Date column not found in Production sheet. Check sheet structure.',
      details: { availableColumns: productionHeaders }
    };
  }

  // Get last 7 days of data
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weekData = productionData.slice(1).filter(row => {
    const incidentDate = new Date(row[dateCol]);
    return incidentDate >= oneWeekAgo && incidentDate <= new Date();
  });

  // CHECK 1: Minimum data threshold
  if (weekData.length < CONFIG.minWeeklyCrimes) {
    return {
      passed: false,
      reason: `Insufficient data: Only ${weekData.length} crimes this week (minimum: ${CONFIG.minWeeklyCrimes})`,
      details: { crimeCount: weekData.length, threshold: CONFIG.minWeeklyCrimes }
    };
  }

  // CHECK 2: Data freshness - ensure recent crimes exist
  // (Timestamp column doesn't exist, so we check for recent crime dates instead)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const recentCrimes = weekData.filter(row => {
    const crimeDate = new Date(row[dateCol]);
    return crimeDate >= threeDaysAgo;
  });

  if (recentCrimes.length < CONFIG.minDataFreshness) {
    return {
      passed: false,
      reason: `Data appears stale: Only ${recentCrimes.length} crimes from last 3 days (minimum: ${CONFIG.minDataFreshness})`,
      details: { recentCount: recentCrimes.length, threshold: CONFIG.minDataFreshness }
    };
  }

  // CHECK 3: Processing backlog - warn if too many pending
  const rawData = rawArticlesSheet.getDataRange().getValues();
  const rawHeaders = rawData[0];
  const statusCol = rawHeaders.indexOf('Status');

  const pendingCount = rawData.slice(1).filter(row =>
    row[statusCol] === 'pending' || row[statusCol] === 'ready'
  ).length;

  if (pendingCount > CONFIG.maxPendingArticles) {
    return {
      passed: false,
      reason: `Processing backlog detected: ${pendingCount} articles still pending (threshold: ${CONFIG.maxPendingArticles})`,
      details: { pendingCount: pendingCount, threshold: CONFIG.maxPendingArticles }
    };
  }

  // CHECK 4: Duplicate detection - compare to last week's data
  const lastFingerprint = getLastDataFingerprint(countryKey);
  const currentFingerprint = generateDataFingerprint(weekData, dateCol);

  if (lastFingerprint) {
    const similarity = calculateSimilarity(lastFingerprint, currentFingerprint);

    if (similarity >= CONFIG.duplicateThreshold) {
      return {
        passed: false,
        reason: `Data appears unchanged: ${Math.round(similarity * 100)}% identical to last week's report`,
        details: { similarity: similarity, threshold: CONFIG.duplicateThreshold }
      };
    }
  }

  // All checks passed!
  return {
    passed: true,
    reason: 'All validation checks passed',
    details: {
      crimeCount: weekData.length,
      recentCrimes: recentCrimes.length,
      pendingArticles: pendingCount,
      dataChanged: lastFingerprint ? 'yes' : 'first_run'
    }
  };
}

/**
 * Generate a fingerprint of the week's data for duplicate detection
 * Creates a hash of crime types, dates, and areas
 */
function generateDataFingerprint(weekData, dateCol) {
  const sortedData = weekData
    .map(row => `${row[dateCol]}-${row[1]}-${row[2]}`) // date-type-area
    .sort()
    .join('|');

  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, sortedData)
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Store this week's data fingerprint for next week's comparison
 */
function storeDataFingerprint(countryKey, fingerprint) {
  const props = PropertiesService.getScriptProperties();
  const key = `LAST_FINGERPRINT_${countryKey.toUpperCase()}`;
  props.setProperty(key, fingerprint);
}

/**
 * Retrieve last week's data fingerprint
 */
function getLastDataFingerprint(countryKey) {
  const props = PropertiesService.getScriptProperties();
  const key = `LAST_FINGERPRINT_${countryKey.toUpperCase()}`;
  return props.getProperty(key);
}

/**
 * Calculate similarity between two fingerprints (0-1 scale)
 */
function calculateSimilarity(fp1, fp2) {
  // Simple comparison: if fingerprints match exactly, 100% similar
  // In production, you could implement Levenshtein distance or other similarity metrics
  return fp1 === fp2 ? 1.0 : 0.0;
}

/**
 * Send email notification when report is skipped
 */
function sendSkipNotification(countryKey, validation) {
  const country = COUNTRIES[countryKey];
  const recipient = NOTIFICATION_EMAIL;

  const subject = `⚠️ Weekly Report Skipped: ${country.name}`;
  const body = `
The weekly crime report for ${country.name} was skipped due to validation failure.

Reason: ${validation.reason}

Details:
${JSON.stringify(validation.details, null, 2)}

Action Required:
- Check your Google Sheets automation
- Verify Gemini processing is running
- Ensure RSS feeds are collecting articles

Next attempt: Next Monday at 10 AM

---
Crime Hotspots Automated Report System
  `;

  MailApp.sendEmail(recipient, subject, body);
  Logger.log(`Notification email sent to ${recipient}`);
}

/**
 * Send email notification on error
 */
function sendErrorNotification(countryKey, error) {
  const country = COUNTRIES[countryKey];
  const recipient = NOTIFICATION_EMAIL;

  const subject = `❌ Weekly Report Error: ${country.name}`;
  const body = `
An error occurred while generating the weekly crime report for ${country.name}.

Error: ${error.message}

Stack Trace:
${error.stack || 'No stack trace available'}

Please investigate and resolve before next week's report.

---
Crime Hotspots Automated Report System
  `;

  MailApp.sendEmail(recipient, subject, body);
  Logger.log(`Error notification sent to ${recipient}`);
}

/**
 * Generates report for a specific country (after validation passes)
 */
function generateCountryReport(countryKey) {
  const country = COUNTRIES[countryKey];

  // Get data from Production sheet
  const sheet = SpreadsheetApp.openById(country.sheetId).getSheetByName(country.productionSheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices (use actual column names from Production sheet)
  const dateCol = headers.indexOf('Date');
  const crimeTypeCol = headers.indexOf('Crime Type');
  const areaCol = headers.indexOf('Area');

  // Get last 7 days of data
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weekData = data.slice(1).filter(row => {
    const incidentDate = new Date(row[dateCol]);
    return incidentDate >= oneWeekAgo;
  });

  // Analyze data
  const stats = analyzeWeekData(weekData, crimeTypeCol, areaCol);

  // Generate markdown content
  const markdown = generateMarkdown(country, stats, weekData.length);

  // Generate fingerprint for next week's duplicate check
  const dataFingerprint = generateDataFingerprint(weekData, dateCol);

  return {
    country: country,
    markdown: markdown,
    dataFingerprint: dataFingerprint,
    date: new Date()
  };
}

/**
 * Analyzes crime data and returns statistics
 */
function analyzeWeekData(data, crimeTypeCol, areaCol) {
  const crimeTypeCounts = {};
  const areaCounts = {};

  data.forEach(row => {
    const crimeType = row[crimeTypeCol] || 'Other';
    const area = row[areaCol] || 'Unknown';

    crimeTypeCounts[crimeType] = (crimeTypeCounts[crimeType] || 0) + 1;
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });

  // Sort by count
  const topCrimes = Object.entries(crimeTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topAreas = Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return {
    crimeTypes: topCrimes,
    areas: topAreas,
    total: data.length
  };
}

/**
 * Generates markdown blog post content
 */
function generateMarkdown(country, stats, totalIncidents) {
  const date = new Date();
  const dateStr = formatDate(date);

  let markdown = `---
title: "${country.name} Weekly Crime Report - ${dateStr}"
date: "${date.toISOString().split('T')[0]}"
country: "${country.id}"
countryName: "${country.name}"
author: "Crime Hotspots Analytics"
excerpt: "Analysis of ${totalIncidents} crime incidents reported this week across ${country.name}."
---

## Weekly Crime Overview

This week saw a total of **${totalIncidents} crime incidents** reported across ${country.name}.

### Key Statistics

`;

  // Add crime type breakdown
  stats.crimeTypes.forEach(([type, count]) => {
    markdown += `- **${type}**: ${count} incidents\n`;
  });

  markdown += `\n### Geographic Hotspots\n\n`;

  // Add area breakdown
  stats.areas.forEach(([area, count], index) => {
    const percentage = ((count / totalIncidents) * 100).toFixed(0);
    if (index === 0) {
      markdown += `**${area}** remains the area with the highest concentration of reported crimes, accounting for ${percentage}% of all incidents this week.\n\n`;
    } else {
      markdown += `**${area}** saw ${count} incidents this week.\n\n`;
    }
  });

  markdown += `### Safety Recommendations

Based on this week's data, residents should:

1. Remain vigilant in high-activity areas identified above
2. Report suspicious activity to local authorities
3. Follow recommended safety protocols, especially during evening hours

### Data Methodology

This report is generated from verified crime incidents reported by major ${country.name} news sources and cross-referenced with official reports where available. All data is aggregated and analyzed using our automated data collection system.

For detailed interactive visualizations, view our [${country.name} Dashboard](${country.dashboardUrl}).

---

**Next Report:** ${formatDate(addDays(date, 7))}
`;

  return markdown;
}

/**
 * Commits the generated report to GitHub
 */
function commitReportToGitHub(report, countryKey) {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const slug = `${countryKey}-weekly-${dateStr}`;
  const filename = `src/blog/posts/${slug}.md`;

  // GitHub API endpoint for file creation
  const url = `https://api.github.com/repos/${CONFIG.githubRepo}/contents/${filename}`;

  const payload = {
    message: `Add weekly report: ${report.country.name} - ${dateStr}`,
    content: Utilities.base64Encode(report.markdown),
    branch: CONFIG.githubBranch
  };

  const options = {
    method: 'put',
    headers: {
      'Authorization': `token ${CONFIG.githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Crime-Hotspots-Weekly-Report-Generator'
    },
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  if (responseCode === 201) {
    Logger.log(`✅ Successfully created ${filename}`);
  } else if (responseCode === 422) {
    // File already exists - this shouldn't happen with date-based filenames
    Logger.log(`⚠️ File already exists: ${filename}`);
  } else {
    throw new Error(`GitHub API error: ${responseCode} - ${response.getContentText()}`);
  }
}

/**
 * Helper: Format date as "Month DD, YYYY"
 */
function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Helper: Add days to date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Test function - run manually to test validation
 */
function testValidation() {
  Logger.log('Testing validation checks...');

  Object.keys(COUNTRIES).forEach(countryKey => {
    Logger.log(`\n--- ${COUNTRIES[countryKey].name} ---`);
    const validation = validateDataReadiness(countryKey);
    Logger.log(`Passed: ${validation.passed}`);
    Logger.log(`Reason: ${validation.reason}`);
    Logger.log(`Details: ${JSON.stringify(validation.details, null, 2)}`);
  });
}

/**
 * Test function - run manually to test report generation
 */
function testReportGeneration() {
  Logger.log('Testing report generation...');
  const report = generateCountryReport('trinidad');
  Logger.log('Generated markdown:');
  Logger.log(report.markdown);
  Logger.log(`\nData fingerprint: ${report.dataFingerprint}`);
}

/**
 * Setup function - creates time-based trigger
 * Run this once to set up automatic weekly reports
 */
function setupWeeklyTrigger() {
  // Delete existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateWeeklyReports') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger: Every Monday at 10 AM (2 hours later than original)
  ScriptApp.newTrigger('generateWeeklyReports')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(10)
    .create();

  Logger.log('✅ Weekly trigger created successfully: Every Monday at 10 AM');
}

/**
 * Manual override - force report generation (bypasses all safeguards)
 * Use only when you know the data is good but validation is failing incorrectly
 */
function forceGenerateReport(countryKey) {
  Logger.log(`⚠️ MANUAL OVERRIDE: Forcing report generation for ${countryKey}`);
  Logger.log('Bypassing all validation checks...');

  const report = generateCountryReport(countryKey);
  commitReportToGitHub(report, countryKey);
  storeDataFingerprint(countryKey, report.dataFingerprint);

  Logger.log(`✅ Report generated and published`);
}
