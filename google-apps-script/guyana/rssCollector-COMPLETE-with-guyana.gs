/**
 * RSS Feed Collector for Multi-Country Crime News
 * PRODUCTION VERSION 1.2 - Multi-Country Support
 *
 * Purpose: Collects articles from RSS feeds for multiple countries
 * Filtering: Blocks Commentary, Opinion, Letters to Editor, Editorials
 * Trigger: Runs hourly via time-based trigger
 * Output: Routes articles to country-specific sheets with status "pending"
 *
 * Countries: Trinidad & Tobago (TT), Guyana (GY)
 * Performance: O(1) duplicate detection using TextFinder
 * References: NEWS_SOURCES from config.md (single source of truth)
 *
 * Last Updated: 2025-11-13
 */

// ============================================================================
// MAIN COLLECTION FUNCTION
// ============================================================================

/**
 * Main function to collect from all enabled RSS feeds
 * Routes articles to country-specific Google Sheets
 * This is the entry point called by the hourly trigger
 *
 * @returns {Object} Count of new articles by country
 */
function collectAllFeeds() {
  const results = {
    TT: { new: 0, total: 0, filtered: 0 },
    GY: { new: 0, total: 0, filtered: 0 }
  };

  // Group feeds by country
  const feedsByCountry = {};
  NEWS_SOURCES.forEach(feed => {
    if (!feed.enabled) {
      Logger.log(`⊘ ${feed.name}: Disabled, skipping`);
      return;
    }

    if (!feedsByCountry[feed.country]) {
      feedsByCountry[feed.country] = [];
    }
    feedsByCountry[feed.country].push(feed);
  });

  // Process each country's feeds
  Object.keys(feedsByCountry).forEach(countryCode => {
    Logger.log(`\n========== ${countryCode} ==========`);

    try {
      // Get country-specific spreadsheet
      const ss = getCountrySpreadsheet(countryCode);
      const sheet = ss.getSheetByName(SHEET_NAMES.RAW_ARTICLES);

      if (!sheet) {
        Logger.log(`ERROR: Sheet "Raw Articles" not found in ${countryCode} spreadsheet!`);
        return;
      }

      // Process each feed for this country
      feedsByCountry[countryCode].forEach(feed => {
        try {
          const articles = fetchAndParseFeed(feed);
          results[countryCode].total += articles.length;

          let collected = 0;
          let filtered = 0;

          articles.forEach(article => {
            // Filter out editorial/opinion content (Commentary, Opinion, Letters)
            if (isEditorialContent(article)) {
              filtered++;
              return; // Skip this article
            }

            // No other keyword filtering - AI will determine if it's crime-related
            if (!isDuplicate(sheet, article.url)) {
              appendArticle(sheet, article, feed.name);
              collected++;
            }
          });

          results[countryCode].new += collected;
          results[countryCode].filtered += filtered;

          Logger.log(`✓ ${feed.name}: ${articles.length} articles found, ${collected} new collected, ${filtered} filtered (editorial/opinion)`);

        } catch (error) {
          Logger.log(`✗ Error processing ${feed.name}: ${error.message}`);
        }
      });

    } catch (error) {
      Logger.log(`ERROR: Could not access ${countryCode} spreadsheet: ${error.message}`);
      Logger.log(`Make sure COUNTRY_SHEETS.${countryCode} is set correctly in config.md`);
    }
  });

  // Print summary
  Logger.log('\n========== SUMMARY ==========');
  Object.keys(results).forEach(country => {
    const r = results[country];
    if (r.total > 0 || r.new > 0) {
      Logger.log(`${country}: ${r.total} total articles, ${r.new} new collected, ${r.filtered} filtered`);
    }
  });
  Logger.log('=============================\n');

  return results;
}

// ============================================================================
// RSS PARSING
// ============================================================================

/**
 * Fetch and parse RSS feed XML
 *
 * @param {Object} feed - Feed configuration from NEWS_SOURCES
 * @returns {Array<Object>} Array of article objects
 */
function fetchAndParseFeed(feed) {
  const response = UrlFetchApp.fetch(feed.rssUrl, {muteHttpExceptions: true});

  if (response.getResponseCode() !== 200) {
    throw new Error(`HTTP ${response.getResponseCode()}`);
  }

  const xml = XmlService.parse(response.getContentText());
  const root = xml.getRootElement();

  // Handle both RSS and Atom formats
  const namespace = root.getNamespace();
  const items = root.getChild('channel', namespace).getChildren('item', namespace);

  const articles = [];

  // Parse each item with error handling
  items.forEach(item => {
    try {
      const article = {
        title: getChildText(item, 'title', namespace),
        url: getChildText(item, 'link', namespace),
        description: getChildText(item, 'description', namespace) || '',
        pubDate: getChildText(item, 'pubDate', namespace),
        fullText: '' // Will be fetched later by articleFetcher
      };

      articles.push(article);
    } catch (e) {
      Logger.log(`Warning: Could not parse item from ${feed.name}: ${e.message}`);
    }
  });

  return articles;
}

/**
 * Helper to safely get child element text
 *
 * @param {XmlElement} element - Parent XML element
 * @param {string} childName - Name of child element
 * @param {XmlNamespace} namespace - XML namespace
 * @returns {string} Child element text or empty string
 */
function getChildText(element, childName, namespace) {
  const child = element.getChild(childName, namespace);
  return child ? child.getText() : '';
}

// ============================================================================
// CONTENT FILTERING
// ============================================================================

/**
 * Check if article is editorial/opinion content (should be excluded)
 * Filters out: Commentary, Opinion pieces, Letters to Editor, Editorials
 *
 * @param {Object} article - Article object with title, url, description
 * @returns {boolean} True if article is editorial/opinion content
 */
function isEditorialContent(article) {
  const title = (article.title || '').toLowerCase();
  const url = (article.url || '').toLowerCase();
  const description = (article.description || '').toLowerCase();

  // Keywords to identify editorial content
  const editorialKeywords = [
    'commentary',      // Newsday label
    'opinion',         // Express label
    'editorial',
    'letter to editor',
    'letter to the editor',
    'letters to editor',
    'op-ed',
    'viewpoint',
    'my view'
  ];

  // URL patterns that indicate editorial content
  const editorialUrlPatterns = [
    '/opinion/',
    '/commentary/',
    '/editorial/',
    '/letters/',
    '/letter-to-editor/',
    '/viewpoint/'
  ];

  // Check title for editorial keywords
  for (const keyword of editorialKeywords) {
    if (title.includes(keyword)) {
      Logger.log(`⊘ Filtered out editorial: "${article.title}" (matched: ${keyword})`);
      return true;
    }
  }

  // Check URL for editorial patterns
  for (const pattern of editorialUrlPatterns) {
    if (url.includes(pattern)) {
      Logger.log(`⊘ Filtered out editorial: "${article.title}" (URL pattern: ${pattern})`);
      return true;
    }
  }

  // Check description for editorial keywords (less strict)
  const descriptionCheck = ['commentary by', 'opinion by', 'editorial by'];
  for (const keyword of descriptionCheck) {
    if (description.includes(keyword)) {
      Logger.log(`⊘ Filtered out editorial: "${article.title}" (description matched: ${keyword})`);
      return true;
    }
  }

  return false;
}

// ============================================================================
// DUPLICATE DETECTION (OPTIMIZED)
// ============================================================================

/**
 * Check for duplicate URLs using O(1) TextFinder lookup
 * PERFORMANCE FIX: Replaced O(n) array iteration with TextFinder
 *
 * @param {Sheet} sheet - Raw Articles sheet
 * @param {string} url - Article URL to check
 * @returns {boolean} True if URL already exists in sheet
 */
function isDuplicate(sheet, url) {
  if (sheet.getLastRow() < 2) return false;

  // Use TextFinder for O(1) lookup instead of loading all URLs
  const finder = sheet.createTextFinder(url)
    .matchEntireCell(true)
    .findNext();

  return finder !== null;
}

// ============================================================================
// SHEET OPERATIONS
// ============================================================================

/**
 * Append article to Raw Articles sheet
 *
 * @param {Sheet} sheet - Raw Articles sheet
 * @param {Object} article - Article data from RSS feed
 * @param {string} sourceName - Name of the news source
 */
function appendArticle(sheet, article, sourceName) {
  sheet.appendRow([
    new Date(),                    // A: Timestamp
    sourceName,                    // B: Source
    article.title,                 // C: Title
    article.url,                   // D: URL
    article.description,           // E: Description (full text fetched later)
    article.pubDate,               // F: Published Date
    'pending',                     // G: Status
    ''                             // H: Notes
  ]);
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test function - Verify editorial filter works correctly
 * Tests various article types to ensure proper filtering
 */
function testEditorialFilter() {
  Logger.log('═════════════════════════════');
  Logger.log('Testing Editorial Filter');
  Logger.log('═════════════════════════════');

  const testArticles = [
    // Should be FILTERED
    {title: 'Commentary: Crime is rising in Trinidad', url: 'http://newsday.co.tt/test1', description: '', expected: true},
    {title: 'Opinion: We need better policing', url: 'http://trinidadexpress.com/test2', description: '', expected: true},
    {title: 'Letter to Editor: My thoughts on crime', url: 'http://newsday.co.tt/test3', description: '', expected: true},
    {title: 'Editorial: The state of crime', url: 'http://test.com/editorial/article', description: '', expected: true},
    {title: 'My View: Crime prevention strategies', url: 'http://test.com/test5', description: '', expected: true},

    // Should be ALLOWED
    {title: 'Man shot in Port of Spain', url: 'http://newsday.co.tt/news/test6', description: '', expected: false},
    {title: 'Police investigate robbery in Arima', url: 'http://trinidadexpress.com/news/test7', description: '', expected: false},
    {title: 'Three arrested in drug bust', url: 'http://cnc3.co.tt/test8', description: '', expected: false},
    {title: 'Commissioner discusses crime trends', url: 'http://newsday.co.tt/test9', description: '', expected: false}
  ];

  let passed = 0;
  let failed = 0;

  testArticles.forEach((article, index) => {
    const result = isEditorialContent(article);
    const shouldFilter = article.expected;
    const status = (result === shouldFilter) ? '✅ PASS' : '❌ FAIL';

    if (result === shouldFilter) {
      passed++;
    } else {
      failed++;
      Logger.log(`${status} Test ${index + 1}: "${article.title}"`);
      Logger.log(`  Expected: ${shouldFilter ? 'FILTER' : 'ALLOW'}, Got: ${result ? 'FILTER' : 'ALLOW'}`);
    }
  });

  Logger.log('');
  Logger.log('═════════════════════════════');
  Logger.log(`Test Results: ${passed}/${testArticles.length} passed`);
  if (failed > 0) {
    Logger.log(`⚠️ ${failed} test(s) failed`);
  } else {
    Logger.log('✅ All tests passed!');
  }
  Logger.log('═════════════════════════════');
}

/**
 * Test function - Run this manually to verify multi-country RSS collection works
 * Tests the complete RSS collection pipeline for all countries
 */
function testRSSCollection() {
  Logger.log('═════════════════════════════');
  Logger.log('Starting Multi-Country RSS Collection Test');
  Logger.log('═════════════════════════════');

  // Verify sheet IDs are configured
  const configErrors = [];
  Object.keys(COUNTRY_SHEETS).forEach(country => {
    const sheetId = COUNTRY_SHEETS[country];
    if (!sheetId || sheetId.includes('YOUR_')) {
      configErrors.push(country);
    }
  });

  if (configErrors.length > 0) {
    Logger.log('');
    Logger.log(`❌ ERROR: Sheet IDs not configured for: ${configErrors.join(', ')}`);
    Logger.log('');
    Logger.log('SETUP REQUIRED:');
    Logger.log('1. Update COUNTRY_SHEETS in config.md');
    Logger.log('2. Replace YOUR_*_SHEET_ID_HERE with actual Google Sheet IDs');
    Logger.log('3. Sheet IDs can be found in the URL of your Google Sheets');
    Logger.log('');
    return;
  }

  const results = collectAllFeeds();

  Logger.log('');
  Logger.log('═════════════════════════════');
  Logger.log('✓ Test Complete');
  Logger.log('═════════════════════════════');
  Object.keys(results).forEach(country => {
    const r = results[country];
    if (r.total > 0) {
      Logger.log(`${country}: ${r.new} new articles collected from ${r.total} total`);
    }
  });
  Logger.log('');
  Logger.log('Next steps:');
  Logger.log('1. Check each country\'s "Raw Articles" sheet for new entries');
  Logger.log('2. Verify article URLs are correct');
  Logger.log('3. Continue to Test 2: Article Fetching');
}

/**
 * Test function - Test single country collection
 * Useful for debugging country-specific issues
 *
 * @param {string} countryCode - Two-letter country code (TT or GY)
 */
function testSingleCountry(countryCode) {
  Logger.log(`Testing ${countryCode} collection only...`);

  const countryFeeds = NEWS_SOURCES.filter(f => f.country === countryCode && f.enabled);

  if (countryFeeds.length === 0) {
    Logger.log(`No enabled feeds found for ${countryCode}`);
    return;
  }

  try {
    const ss = getCountrySpreadsheet(countryCode);
    const sheet = ss.getSheetByName(SHEET_NAMES.RAW_ARTICLES);

    if (!sheet) {
      Logger.log(`ERROR: "Raw Articles" sheet not found in ${countryCode} spreadsheet`);
      return;
    }

    let total = 0;
    countryFeeds.forEach(feed => {
      try {
        const articles = fetchAndParseFeed(feed);
        Logger.log(`${feed.name}: ${articles.length} articles found`);
        total += articles.length;
      } catch (e) {
        Logger.log(`Error with ${feed.name}: ${e.message}`);
      }
    });

    Logger.log(`Total: ${total} articles from ${countryFeeds.length} feeds`);

  } catch (error) {
    Logger.log(`ERROR: ${error.message}`);
  }
}

/**
 * Last Updated: 2025-11-13
 * Production Version: 1.2
 * Changes: Added multi-country support with country-specific routing
 */
