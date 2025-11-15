/**
 * WEEKLY CRIME REPORT GENERATOR
 *
 * This Google Apps Script automatically generates weekly blog posts from Production sheet data
 * and commits them to GitHub repository using GitHub API.
 *
 * SETUP:
 * 1. Add to your existing Google Apps Script project
 * 2. Set Script Properties:
 *    - GITHUB_TOKEN: Personal Access Token with repo permissions
 *    - GITHUB_REPO: username/repo-name (e.g., "youruser/crime-hotspots")
 *    - GITHUB_BRANCH: main (or your default branch)
 * 3. Create time-based trigger: Run weekly on Monday at 8 AM
 *
 * DEPENDENCIES:
 * - Uses existing Production sheets (Trinidad & Guyana)
 * - Requires GitHub repository to be initialized
 */

// Configuration (set these in Script Properties)
const CONFIG = {
  githubToken: PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
  githubRepo: PropertiesService.getScriptProperties().getProperty('GITHUB_REPO'),
  githubBranch: PropertiesService.getScriptProperties().getProperty('GITHUB_BRANCH') || 'main',
  spreadsheetId: '1RG87T7L-KdVSKACRbWG7t3_OkU_LxYOTPGr_HB2iPWI' // Your Trinidad sheet
};

// Country configurations
const COUNTRIES = {
  'trinidad': {
    id: 'tt',
    name: 'Trinidad & Tobago',
    sheetId: '1RG87T7L-KdVSKACRbWG7t3_OkU_LxYOTPGr_HB2iPWI',
    sheetName: 'Production',
    dashboardUrl: '/'
  },
  'guyana': {
    id: 'gy',
    name: 'Guyana',
    sheetId: '1123456789', // Replace with actual Guyana sheet ID
    sheetName: 'Production',
    dashboardUrl: '/'
  }
};

/**
 * Main function - generates weekly reports for all countries
 * Run this weekly via time-based trigger
 */
function generateWeeklyReports() {
  Logger.log('Starting weekly report generation...');

  Object.keys(COUNTRIES).forEach(countryKey => {
    try {
      const report = generateCountryReport(countryKey);
      commitReportToGitHub(report, countryKey);
      Logger.log(`Successfully generated report for ${COUNTRIES[countryKey].name}`);
    } catch (error) {
      Logger.log(`Error generating report for ${countryKey}: ${error.message}`);
      // Continue with other countries even if one fails
    }
  });

  Logger.log('Weekly report generation complete');
}

/**
 * Generates report for a specific country
 */
function generateCountryReport(countryKey) {
  const country = COUNTRIES[countryKey];

  // Get data from Production sheet
  const sheet = SpreadsheetApp.openById(country.sheetId).getSheetByName(country.sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const dateCol = headers.indexOf('Incident Date');
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

  return {
    country: country,
    markdown: markdown,
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
    Logger.log(`Successfully created ${filename}`);
  } else if (responseCode === 422) {
    // File already exists, update it instead
    updateExistingFile(url, payload);
  } else {
    throw new Error(`GitHub API error: ${responseCode} - ${response.getContentText()}`);
  }
}

/**
 * Updates existing file on GitHub
 */
function updateExistingFile(url, payload) {
  // First, get the current file to retrieve its SHA
  const getOptions = {
    method: 'get',
    headers: {
      'Authorization': `token ${CONFIG.githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    },
    muteHttpExceptions: true
  };

  const getResponse = UrlFetchApp.fetch(url, getOptions);
  const fileData = JSON.parse(getResponse.getContentText());

  // Add SHA to payload for update
  payload.sha = fileData.sha;
  payload.message = `Update weekly report: ${payload.message}`;

  const updateOptions = {
    method: 'put',
    headers: {
      'Authorization': `token ${CONFIG.githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    },
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, updateOptions);
  Logger.log(`Updated existing file. Response: ${response.getResponseCode()}`);
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
 * Test function - run manually to test report generation
 */
function testReportGeneration() {
  Logger.log('Testing report generation...');
  const report = generateCountryReport('trinidad');
  Logger.log('Generated markdown:');
  Logger.log(report.markdown);
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

  // Create new trigger: Every Monday at 8 AM
  ScriptApp.newTrigger('generateWeeklyReports')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();

  Logger.log('Weekly trigger created successfully');
}
