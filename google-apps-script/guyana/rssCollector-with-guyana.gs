/**
 * RSS Feed Collector for Multi-Country Crime News
 * PRODUCTION VERSION 1.2 - Multi-Country Support
 *
 * Purpose: Collects articles from RSS feeds for multiple countries
 * Filtering: Blocks Commentary, Opinion, Letters to Editor, Editorials
 * Trigger: Runs hourly via time-based trigger
 * Output: Routes articles to country-specific sheets
 *
 * Countries Supported: Trinidad & Tobago (TT), Guyana (GY)
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
            // Filter out editorial/opinion content
            if (isEditorialContent(article)) {
              filtered++;
              return;
            }

            // Check for duplicates in this country's sheet
            if (!isDuplicate(sheet, article.url)) {
              appendArticle(sheet, article, feed.name);
              collected++;
            }
          });

          results[countryCode].new += collected;
          results[countryCode].filtered += filtered;

          Logger.log(`✓ ${feed.name}: ${articles.length} articles found, ${collected} new collected, ${filtered} filtered`);

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
      Logger.log(`${country}: ${r.total} total, ${r.new} new, ${r.filtered} filtered`);
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
  const items = root.getChild('channel', namespace)
                    .getChildren('item', namespace);

  const articles = [];

  items.forEach(item => {
    try {
      const title = item.getChildText('title', namespace) || '';
      const link = item.getChildText('link', namespace) || '';
      const description = item.getChildText('description', namespace) || '';
      const pubDate = item.getChildText('pubDate', namespace) || '';

      articles.push({
        title: title,
        url: link,
        description: description,
        pubDate: pubDate
      });
    } catch (e) {
      Logger.log(`Warning: Could not parse item from ${feed.name}: ${e.message}`);
    }
  });

  return articles;
}

// ============================================================================
// EDITORIAL CONTENT FILTERING
// ============================================================================

/**
 * Check if article is editorial/opinion content
 * Filters out: Commentary, Opinion, Letters to Editor, Editorials
 *
 * @param {Object} article - Article object with title, url, description
 * @returns {boolean} True if editorial content (should be filtered out)
 */
function isEditorialContent(article) {
  const title = (article.title || '').toLowerCase();
  const url = (article.url || '').toLowerCase();
  const description = (article.description || '').toLowerCase();

  // Editorial keywords to filter
  const editorialKeywords = [
    'commentary',
    'opinion',
    'editorial',
    'letter to editor',
    'letter to the editor',
    'letters to editor',
    'op-ed',
    'viewpoint',
    'my view',
    'perspective'
  ];

  // URL patterns indicating editorial content
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
      Logger.log(`  ⊘ Filtered editorial: "${article.title}" (matched: ${keyword})`);
      return true;
    }
  }

  // Check URL for editorial patterns
  for (const pattern of editorialUrlPatterns) {
    if (url.includes(pattern)) {
      Logger.log(`  ⊘ Filtered editorial: "${article.title}" (URL pattern: ${pattern})`);
      return true;
    }
  }

  return false;
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Check if article URL already exists in sheet (O(1) performance)
 *
 * @param {Sheet} sheet - Google Sheet to check
 * @param {string} url - Article URL
 * @returns {boolean} True if duplicate exists
 */
function isDuplicate(sheet, url) {
  if (!url || url.trim() === '') return false;

  const finder = sheet.createTextFinder(url);
  const found = finder.findNext();

  return found !== null;
}

// ============================================================================
// SHEET OPERATIONS
// ============================================================================

/**
 * Append article to Raw Articles sheet
 *
 * @param {Sheet} sheet - Raw Articles sheet
 * @param {Object} article - Article object
 * @param {string} sourceName - Name of the news source
 */
function appendArticle(sheet, article, sourceName) {
  const timestamp = new Date();
  const row = [
    timestamp,
    sourceName,
    article.title,
    article.url,
    '', // Full text (will be filled by articleFetcher)
    article.pubDate,
    'pending', // Status
    '' // Notes
  ];

  sheet.appendRow(row);
}

/**
 * Last Updated: 2025-11-13
 * Production Version: 1.2 (Multi-Country Support)
 */
