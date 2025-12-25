/**
 * Archive URL Scraper for Trinidad News Sources
 *
 * PURPOSE: Scrape Trinidad Express, Guardian TT, and Newsday archives to find missing articles
 * CRITICAL: URLs are written to "Archive Review" sheet for MANUAL review, NOT auto-processed
 *
 * Why manual review?
 * - We also collect news from Facebook sources
 * - Need to verify articles are actual crime incidents (not politics, court cases, etc.)
 * - Pre-filter helps but human verification preferred for backfill
 *
 * USAGE:
 * 1. Run scrapeAllArchives() to collect URLs from all sources
 * 2. Review URLs in "Archive Review" sheet
 * 3. Manually approve URLs by setting status to "Approved"
 * 4. Run processApprovedArchiveUrls() to add approved URLs to Raw Articles
 */

// Configuration
const ARCHIVE_CONFIG = {
  REVIEW_SHEET_NAME: 'Archive Review',

  // Trinidad Express - pagination based
  TRINIDAD_EXPRESS: {
    baseUrl: 'https://trinidadexpress.com/news/local/',
    pageParam: '?page=',
    maxPages: 50, // Adjust based on how far back you want to go
    urlPattern: /https:\/\/trinidadexpress\.com\/[^"'\s]+\/article_[a-f0-9-]+\.html/gi
  },

  // Guardian TT - date-based archives
  GUARDIAN: {
    baseUrl: 'https://www.guardian.co.tt/archive/',
    // Format: https://www.guardian.co.tt/archive/2025-12-01
    urlPattern: /https:\/\/www\.guardian\.co\.tt\/[^"'\s]+/gi
  },

  // Newsday - pagination based
  NEWSDAY: {
    baseUrl: 'https://newsday.co.tt/category/news/',
    pageParam: 'page/',
    maxPages: 50,
    urlPattern: /https:\/\/newsday\.co\.tt\/\d{4}\/\d{2}\/\d{2}\/[^"'\s]+/gi
  }
};

/**
 * Main function: Scrape all Trinidad news archives
 */
function scrapeAllArchives() {
  Logger.log('🔍 Starting archive scraping for all Trinidad sources...');

  const scrapedUrls = [];

  // Scrape Trinidad Express
  Logger.log('📰 Scraping Trinidad Express...');
  const expressUrls = scrapeTrinidadExpress();
  scrapedUrls.push(...expressUrls);
  Logger.log(`✅ Trinidad Express: ${expressUrls.length} URLs found`);

  // Scrape Guardian TT
  Logger.log('📰 Scraping Guardian TT...');
  const guardianUrls = scrapeGuardian();
  scrapedUrls.push(...guardianUrls);
  Logger.log(`✅ Guardian TT: ${guardianUrls.length} URLs found`);

  // Scrape Newsday
  Logger.log('📰 Scraping Newsday...');
  const newsdayUrls = scrapeNewsday();
  scrapedUrls.push(...newsdayUrls);
  Logger.log(`✅ Newsday: ${newsdayUrls.length} URLs found`);

  // Remove duplicates
  const uniqueUrls = [...new Set(scrapedUrls)];
  Logger.log(`📊 Total unique URLs scraped: ${uniqueUrls.length}`);

  // Cross-reference with existing data
  Logger.log('🔍 Cross-referencing with existing articles...');
  const missingUrls = findMissingArticles(uniqueUrls);
  Logger.log(`🆕 Missing URLs (not in our database): ${missingUrls.length}`);

  // Write to Archive Review sheet
  writeToReviewSheet(missingUrls);

  Logger.log(`✅ Complete! ${missingUrls.length} URLs written to "${ARCHIVE_CONFIG.REVIEW_SHEET_NAME}" sheet for manual review`);

  return {
    totalScraped: scrapedUrls.length,
    uniqueUrls: uniqueUrls.length,
    missingUrls: missingUrls.length
  };
}

/**
 * Scrape Trinidad Express archives (pagination-based)
 */
function scrapeTrinidadExpress() {
  const urls = new Set();
  const config = ARCHIVE_CONFIG.TRINIDAD_EXPRESS;

  for (let page = 1; page <= config.maxPages; page++) {
    try {
      const pageUrl = `${config.baseUrl}${config.pageParam}${page}`;
      const html = UrlFetchApp.fetch(pageUrl, { muteHttpExceptions: true }).getContentText();

      // Extract article URLs using regex
      const matches = html.match(config.urlPattern);
      if (matches) {
        matches.forEach(url => urls.add(url.replace(/['"]/g, '')));
      }

      // Log progress every 10 pages
      if (page % 10 === 0) {
        Logger.log(`  Trinidad Express: Page ${page}/${config.maxPages} - ${urls.size} URLs so far`);
      }

      // Rate limiting: sleep 1 second between requests
      Utilities.sleep(1000);

    } catch (error) {
      Logger.log(`⚠️ Error scraping Trinidad Express page ${page}: ${error.message}`);
    }
  }

  return Array.from(urls);
}

/**
 * Scrape Guardian TT archives (date-based)
 */
function scrapeGuardian() {
  const urls = new Set();
  const config = ARCHIVE_CONFIG.GUARDIAN;

  // Scrape archives for 2025 and 2024
  const years = [2025, 2024];

  years.forEach(year => {
    // For current year, only scrape up to current month
    const maxMonth = (year === 2025) ? new Date().getMonth() + 1 : 12;

    for (let month = 1; month <= maxMonth; month++) {
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        try {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const archiveUrl = `${config.baseUrl}${dateStr}`;

          const html = UrlFetchApp.fetch(archiveUrl, { muteHttpExceptions: true }).getContentText();

          // Extract article URLs
          const matches = html.match(config.urlPattern);
          if (matches) {
            matches.forEach(url => {
              const cleanUrl = url.replace(/['"]/g, '');
              // Only include article URLs, not category/archive pages
              if (!cleanUrl.includes('/archive/') && !cleanUrl.includes('/category/')) {
                urls.add(cleanUrl);
              }
            });
          }

          // Rate limiting: sleep 500ms between requests
          Utilities.sleep(500);

        } catch (error) {
          // Silent fail for dates without archives
        }
      }

      Logger.log(`  Guardian TT: ${year}-${String(month).padStart(2, '0')} complete - ${urls.size} URLs so far`);
    }
  });

  return Array.from(urls);
}

/**
 * Scrape Newsday archives (pagination-based)
 */
function scrapeNewsday() {
  const urls = new Set();
  const config = ARCHIVE_CONFIG.NEWSDAY;

  for (let page = 1; page <= config.maxPages; page++) {
    try {
      const pageUrl = `${config.baseUrl}${config.pageParam}${page}`;
      const html = UrlFetchApp.fetch(pageUrl, { muteHttpExceptions: true }).getContentText();

      // Extract article URLs using regex
      const matches = html.match(config.urlPattern);
      if (matches) {
        matches.forEach(url => urls.add(url.replace(/['"]/g, '')));
      }

      // Log progress every 10 pages
      if (page % 10 === 0) {
        Logger.log(`  Newsday: Page ${page}/${config.maxPages} - ${urls.size} URLs so far`);
      }

      // Rate limiting: sleep 1 second between requests
      Utilities.sleep(1000);

    } catch (error) {
      Logger.log(`⚠️ Error scraping Newsday page ${page}: ${error.message}`);
    }
  }

  return Array.from(urls);
}

/**
 * Cross-reference scraped URLs with existing articles
 * Returns only URLs that are NOT already in our database
 */
function findMissingArticles(scrapedUrls) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get existing URLs from multiple sheets
  const existingSources = [
    'Raw Articles',
    'Processing',
    'Production',
    'Production Archive',
    'Failed Processing'
  ];

  const existingUrls = new Set();

  existingSources.forEach(sheetName => {
    try {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return;

      const data = sheet.getDataRange().getValues();
      // Assuming URL is in column A (adjust if different)
      data.slice(1).forEach(row => {
        if (row[0]) existingUrls.add(row[0].trim());
      });

      Logger.log(`  Loaded ${existingUrls.size} URLs from ${sheetName}`);
    } catch (error) {
      Logger.log(`⚠️ Could not read ${sheetName}: ${error.message}`);
    }
  });

  // Filter out URLs that already exist
  const missingUrls = scrapedUrls.filter(url => !existingUrls.has(url));

  return missingUrls;
}

/**
 * Write missing URLs to Archive Review sheet for manual review
 */
function writeToReviewSheet(urls) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ARCHIVE_CONFIG.REVIEW_SHEET_NAME);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(ARCHIVE_CONFIG.REVIEW_SHEET_NAME);

    // Set up headers
    sheet.getRange('A1:F1').setValues([[
      'URL',
      'Source',
      'Date Found',
      'Status',
      'Pre-filter Score',
      'Notes'
    ]]);

    // Format headers
    sheet.getRange('A1:F1')
      .setFontWeight('bold')
      .setBackground('#e11d48')
      .setFontColor('#ffffff');

    // Set column widths
    sheet.setColumnWidth(1, 400); // URL
    sheet.setColumnWidth(2, 120); // Source
    sheet.setColumnWidth(3, 120); // Date Found
    sheet.setColumnWidth(4, 100); // Status
    sheet.setColumnWidth(5, 120); // Pre-filter Score
    sheet.setColumnWidth(6, 300); // Notes
  }

  // Prepare data rows
  const today = new Date();
  const rows = urls.map(url => {
    const source = url.includes('trinidadexpress.com') ? 'Trinidad Express' :
                   url.includes('guardian.co.tt') ? 'Guardian TT' :
                   url.includes('newsday.co.tt') ? 'Newsday' : 'Unknown';

    return [
      url,
      source,
      today,
      'Pending Review', // Status: Pending Review, Approved, Rejected
      '', // Pre-filter score (filled by pre-filter function)
      '' // Notes
    ];
  });

  // Append rows
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 6).setValues(rows);
  }

  // Apply conditional formatting for status
  const statusRange = sheet.getRange(2, 4, sheet.getLastRow() - 1, 1);

  // Clear existing rules
  sheet.clearConditionalFormatRules();

  // Pending Review = yellow
  const pendingRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending Review')
    .setBackground('#fef3c7')
    .setRanges([statusRange])
    .build();

  // Approved = green
  const approvedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Approved')
    .setBackground('#d1fae5')
    .setRanges([statusRange])
    .build();

  // Rejected = red
  const rejectedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Rejected')
    .setBackground('#fee2e2')
    .setRanges([statusRange])
    .build();

  sheet.setConditionalFormatRules([pendingRule, approvedRule, rejectedRule]);

  Logger.log(`✅ ${rows.length} URLs written to "${ARCHIVE_CONFIG.REVIEW_SHEET_NAME}" sheet`);
}

/**
 * Run pre-filter on Archive Review URLs to help with manual review
 * This scores URLs based on crime-related keywords WITHOUT adding to Raw Articles
 */
function scoreArchiveUrls() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ARCHIVE_CONFIG.REVIEW_SHEET_NAME);

  if (!sheet) {
    Logger.log('❌ Archive Review sheet not found');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const urlsToScore = [];

  // Find URLs with no pre-filter score
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && !data[i][4]) { // Has URL, no score
      urlsToScore.push({ row: i + 1, url: data[i][0] });
    }
  }

  Logger.log(`🔍 Scoring ${urlsToScore.length} URLs with pre-filter...`);

  urlsToScore.forEach((item, index) => {
    try {
      // Fetch article title/content
      const html = UrlFetchApp.fetch(item.url, { muteHttpExceptions: true }).getContentText();

      // Extract title (simple approach - look for <title> tag)
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : '';

      // Calculate pre-filter score (reuse existing pre-filter logic)
      // For now, simple keyword matching
      const crimeKeywords = ['murder', 'kill', 'shot', 'robbery', 'rape', 'assault', 'kidnap', 'theft', 'burglary', 'shooting', 'stabbing'];
      const nonCrimeKeywords = ['minister', 'rowley', 'court', 'case collapse', 'venezuela', 'election', 'parliament'];

      let score = 0;
      const lowerTitle = title.toLowerCase();

      crimeKeywords.forEach(keyword => {
        if (lowerTitle.includes(keyword)) score += 5;
      });

      nonCrimeKeywords.forEach(keyword => {
        if (lowerTitle.includes(keyword)) score -= 5;
      });

      // Write score to sheet
      sheet.getRange(item.row, 5).setValue(score);

      // Log progress every 10 URLs
      if ((index + 1) % 10 === 0) {
        Logger.log(`  Scored ${index + 1}/${urlsToScore.length} URLs`);
      }

      // Rate limiting
      Utilities.sleep(1000);

    } catch (error) {
      Logger.log(`⚠️ Error scoring ${item.url}: ${error.message}`);
    }
  });

  Logger.log(`✅ Pre-filter scoring complete`);
}

/**
 * Process approved archive URLs and add them to Raw Articles
 * Only runs on URLs with status = "Approved"
 */
function processApprovedArchiveUrls() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reviewSheet = ss.getSheetByName(ARCHIVE_CONFIG.REVIEW_SHEET_NAME);
  const rawSheet = ss.getSheetByName('Raw Articles');

  if (!reviewSheet || !rawSheet) {
    Logger.log('❌ Required sheets not found');
    return;
  }

  const data = reviewSheet.getDataRange().getValues();
  const approvedUrls = [];

  // Find approved URLs
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === 'Approved') {
      approvedUrls.push({
        row: i + 1,
        url: data[i][0],
        source: data[i][1]
      });
    }
  }

  Logger.log(`📝 Processing ${approvedUrls.length} approved URLs...`);

  if (approvedUrls.length === 0) {
    Logger.log('ℹ️ No approved URLs to process');
    return;
  }

  // Add approved URLs to Raw Articles
  const rawRows = approvedUrls.map(item => [
    item.url,
    item.source,
    new Date(),
    'Pending', // Status
    '' // Notes: "From archive backfill"
  ]);

  rawSheet.getRange(rawSheet.getLastRow() + 1, 1, rawRows.length, 5).setValues(rawRows);

  // Update Archive Review sheet status
  approvedUrls.forEach(item => {
    reviewSheet.getRange(item.row, 4).setValue('Processed');
    reviewSheet.getRange(item.row, 6).setValue(`Added to Raw Articles on ${new Date().toLocaleString()}`);
  });

  Logger.log(`✅ ${approvedUrls.length} URLs added to Raw Articles sheet`);
}

/**
 * Utility: Scrape specific date range from Guardian
 */
function scrapeGuardianDateRange(startDate, endDate) {
  const urls = new Set();
  const config = ARCHIVE_CONFIG.GUARDIAN;

  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');

      const dateStr = `${year}-${month}-${day}`;
      const archiveUrl = `${config.baseUrl}${dateStr}`;

      const html = UrlFetchApp.fetch(archiveUrl, { muteHttpExceptions: true }).getContentText();

      const matches = html.match(config.urlPattern);
      if (matches) {
        matches.forEach(url => {
          const cleanUrl = url.replace(/['"]/g, '');
          if (!cleanUrl.includes('/archive/') && !cleanUrl.includes('/category/')) {
            urls.add(cleanUrl);
          }
        });
      }

      // Next day
      currentDate.setDate(currentDate.getDate() + 1);

      Utilities.sleep(500);

    } catch (error) {
      // Silent fail
    }
  }

  Logger.log(`Guardian date range ${startDate} to ${endDate}: ${urls.size} URLs found`);
  return Array.from(urls);
}
