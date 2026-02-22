/**
 * RSS Feed Collector for Trinidad & Tobago Crime News
 * PRODUCTION VERSION 1.1
 *
 * Purpose: Collects articles from RSS feeds (excludes editorial/opinion content)
 * Filtering: Blocks Commentary, Opinion, Letters to Editor, Editorials
 * Trigger: Runs hourly via time-based trigger
 * Output: Appends new articles to "Raw Articles" sheet with status "pending"
 *
 * Performance: O(1) duplicate detection using TextFinder
 * References: NEWS_SOURCES from config.md (single source of truth)
 *
 * Last Updated: 2025-11-09
 */

// ============================================================================
// MAIN COLLECTION FUNCTION
// ============================================================================

/**
 * Main function to collect from all enabled RSS feeds
 * This is the entry point called by the hourly trigger
 *
 * @returns {number} Count of new articles collected
 */
function collectAllFeeds() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RAW_ARTICLES);

  if (!sheet) {
    Logger.log('ERROR: Sheet "Raw Articles" not found!');
    return 0;
  }

  let newArticlesCount = 0;
  let totalArticlesFound = 0;

  // Use NEWS_SOURCES from config.md (single source of truth)
  NEWS_SOURCES.forEach(feed => {
    if (!feed.enabled) {
      Logger.log(`⊘ ${feed.name}: Disabled, skipping`);
      return;
    }

    try {
      const articles = fetchAndParseFeed(feed);
      totalArticlesFound += articles.length;

      let collected = 0;
      let filtered = 0;
      articles.forEach(article => {
        // Filter out editorial/opinion content (Commentary, Opinion, Letters)
        if (isEditorialContent(article)) {
          filtered++;
          return; // Skip this article
        }

        // No other keyword filtering - AI will determine if it's crime-related
        if (!isDuplicate(sheet, article.url, article.title)) {
          appendArticle(sheet, article, feed.name);
          newArticlesCount++;
          collected++;
        }
      });

      Logger.log(`✓ ${feed.name}: ${articles.length} articles found, ${collected} new collected, ${filtered} filtered (editorial/opinion)`);

    } catch (error) {
      Logger.log(`✗ Error processing ${feed.name}: ${error.message}`);
      Logger.log(`  ⚠️ WARNING: Feed failed — investigate this URL: ${feed.rssUrl}`);
    }
  });

  Logger.log('─────────────────────────────');
  Logger.log(`Summary: ${totalArticlesFound} total articles, ${newArticlesCount} new articles collected`);
  Logger.log('─────────────────────────────');

  return newArticlesCount;
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
  const options = {
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  };
  const response = UrlFetchApp.fetch(feed.rssUrl, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    throw new Error(`HTTP ${statusCode}`);
  }

  const xml = XmlService.parse(response.getContentText());
  const root = xml.getRootElement();

  // Handle both RSS and Atom formats
  const namespace = root.getNamespace();
  const items = root.getChild('channel', namespace).getChildren('item', namespace);

  return items.map(item => {
    return {
      title: getChildText(item, 'title', namespace),
      url: getChildText(item, 'link', namespace),
      description: getChildText(item, 'description', namespace) || '',
      pubDate: getChildText(item, 'pubDate', namespace),
      fullText: '' // Will be fetched later by articleFetcher.md
    };
  });
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
 * Calculate string similarity using Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity percentage (0-100)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 100;

  const editDistance = levenshteinDistance(s1, s2);
  return Math.round(((longer.length - editDistance) / longer.length) * 100);
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Strip query strings and fragments for URL dedup comparison.
 * Article identity is always in the path for CNC3/Express/Newsday.
 * @param {string} url
 * @returns {string} Normalized URL (lowercase, no trailing slash, no query/fragment)
 */
function normalizeUrlForDedup(url) {
  if (!url || typeof url !== 'string') return url;
  return url.split('?')[0].split('#')[0].toLowerCase().replace(/\/$/, '');
}

/**
 * Check for duplicate URLs and headlines.
 * CHECK 1: Exact URL match (fast TextFinder).
 * CHECK 2: Combined loop — normalized URL match OR headline similarity ≥80%.
 *
 * @param {Sheet} sheet - Raw Articles sheet
 * @param {string} url - Article URL to check
 * @param {string} title - Article title to check
 * @returns {boolean} True if URL or headline already exists in sheet
 */
function isDuplicate(sheet, url, title) {
  if (sheet.getLastRow() < 2) return false;

  // CHECK 1: Fast exact URL match
  const urlFinder = sheet.createTextFinder(url)
    .matchEntireCell(true)
    .findNext();

  if (urlFinder !== null) {
    return true; // Exact URL duplicate
  }

  // CHECK 2: Combined loop — normalized URL OR headline similarity
  // One pass avoids double iteration and catches UTM-stripped URL variants
  const normalizedNew = normalizeUrlForDedup(url);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const existingUrl = data[i][3];   // Column D (URL)
    const existingTitle = data[i][2]; // Column C (Title)

    // Normalized URL match (handles ?utm_source= variants)
    if (existingUrl && normalizedNew && normalizeUrlForDedup(existingUrl) === normalizedNew) {
      Logger.log(`   ⚠️ Normalized URL duplicate detected: "${url}"`);
      return true;
    }

    // Headline similarity match
    if (existingTitle && title) {
      const similarity = calculateSimilarity(existingTitle, title);

      if (similarity >= 80) {
        Logger.log(`   ⚠️ Headline duplicate detected (${similarity}% similar):`);
        Logger.log(`      Existing: "${existingTitle}"`);
        Logger.log(`      New:      "${title}"`);
        return true;
      }
    }
  }

  return false; // Not a duplicate
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
 * Test function - Run this manually to verify RSS collection works
 * Tests the complete RSS collection pipeline
 */
function testRSSCollection() {
  Logger.log('═════════════════════════════');
  Logger.log('Starting RSS Collection Test');
  Logger.log('═════════════════════════════');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RAW_ARTICLES);

  if (!sheet) {
    Logger.log('');
    Logger.log('❌ ERROR: Sheet "Raw Articles" not found!');
    Logger.log('');
    Logger.log('SETUP REQUIRED:');
    Logger.log('1. Create a new sheet named "Raw Articles"');
    Logger.log('2. Add header row with columns:');
    Logger.log('   A: Timestamp | B: Source | C: Title | D: URL');
    Logger.log('   E: Full Text | F: Published Date | G: Status | H: Notes');
    Logger.log('');
    return;
  }

  const count = collectAllFeeds();

  Logger.log('');
  Logger.log('═════════════════════════════');
  Logger.log(`✓ Test Complete: ${count} articles collected`);
  Logger.log('═════════════════════════════');
  Logger.log('');
  Logger.log('Next steps:');
  Logger.log('1. Check your "Raw Articles" sheet for new entries');
  Logger.log('2. Verify article URLs are correct');
  Logger.log('3. Continue to Test 2: Article Fetching');
}

/**
 * Last Updated: 2025-11-09
 * Production Version: 1.1
 * Change: Added editorial/opinion content filtering
 */
