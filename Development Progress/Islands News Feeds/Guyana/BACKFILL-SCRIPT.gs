/**
 * Guyana Crime Data Backfill Script
 * ONE-TIME USE - Collects historical crime articles from 2025
 *
 * Strategy:
 * 1. Use Google Custom Search API to find crime articles by date range
 * 2. Add URLs to Raw Articles sheet
 * 3. Let existing pipeline process them (fetchPendingArticles + processReadyArticles)
 *
 * Expected yield: 300-500 articles from Jan-Nov 2025
 *
 * Last Updated: 2025-11-13
 */

// ============================================================================
// BACKFILL CONFIGURATION
// ============================================================================

/**
 * Date range for backfill
 * Adjust these dates as needed
 */
const BACKFILL_CONFIG = {
  START_DATE: '2025-01-01',  // YYYY-MM-DD
  END_DATE: '2025-11-13',    // Today
  BATCH_SIZE: 50,             // Process 50 URLs at a time
  DELAY_BETWEEN_BATCHES: 60000 // 1 minute (to avoid rate limits)
};

/**
 * Crime keywords for search
 * These will be used to find relevant articles
 */
const CRIME_KEYWORDS = [
  'murder',
  'shooting',
  'robbery',
  'assault',
  'bandit',
  'killed',
  'arrested',
  'police',
  'crime'
];

/**
 * Guyana news site domains to search
 */
const GUYANA_SITES = [
  'demerarawaves.com',
  'inewsguyana.com',
  'kaieteurnewsonline.com',
  'newsroom.gy',
  'guyanatimesgy.com'
];

// ============================================================================
// METHOD 1: GOOGLE CUSTOM SEARCH (Requires API Key)
// ============================================================================

/**
 * Use Google Custom Search API to find crime articles
 * Requires: Google Custom Search API key and Search Engine ID
 *
 * Setup:
 * 1. Go to https://developers.google.com/custom-search/v1/overview
 * 2. Create API key and Custom Search Engine
 * 3. Add to Script Properties: CUSTOM_SEARCH_API_KEY and SEARCH_ENGINE_ID
 */
function backfillUsingGoogleSearch() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('CUSTOM_SEARCH_API_KEY');
  const searchEngineId = PropertiesService.getScriptProperties().getProperty('SEARCH_ENGINE_ID');

  if (!apiKey || !searchEngineId) {
    Logger.log('❌ ERROR: Google Custom Search not configured');
    Logger.log('Run setupGoogleSearch() first');
    return;
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RAW_ARTICLES);
  let totalFound = 0;

  CRIME_KEYWORDS.forEach(keyword => {
    GUYANA_SITES.forEach(site => {
      try {
        const query = `site:${site} ${keyword}`;
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&dateRestrict=d365&num=10`;

        const response = UrlFetchApp.fetch(searchUrl, {muteHttpExceptions: true});
        const results = JSON.parse(response.getContentText());

        if (results.items) {
          results.items.forEach(item => {
            if (!isDuplicate(sheet, item.link)) {
              sheet.appendRow([
                new Date(),
                site,
                item.title,
                item.link,
                item.snippet || '',
                '', // Published date (unknown)
                'pending',
                'Backfilled from archive'
              ]);
              totalFound++;
            }
          });
        }

        Utilities.sleep(1000); // Rate limit: 1 second between requests

      } catch (error) {
        Logger.log(`Error searching ${site} for ${keyword}: ${error.message}`);
      }
    });
  });

  Logger.log(`✅ Backfill complete: ${totalFound} historical articles added`);
}

// ============================================================================
// METHOD 2: MANUAL URL LIST (No API Required - RECOMMENDED)
// ============================================================================

/**
 * Process a manual list of URLs from Google Sheets
 *
 * SETUP:
 * 1. Create a new sheet called "Backfill URLs"
 * 2. Column A: URL
 * 3. Column B: Source name (e.g., "Demerara Waves")
 * 4. Paste URLs you find manually or via browser search
 * 5. Run this function
 */
function backfillFromManualList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const backfillSheet = ss.getSheetByName('Backfill URLs');
  const rawSheet = ss.getSheetByName(SHEET_NAMES.RAW_ARTICLES);

  if (!backfillSheet) {
    Logger.log('❌ ERROR: Sheet "Backfill URLs" not found');
    Logger.log('Create a sheet named "Backfill URLs" with columns: URL | Source');
    return;
  }

  const data = backfillSheet.getDataRange().getValues();
  let added = 0;
  let duplicates = 0;

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const url = data[i][0];
    const source = data[i][1] || 'Unknown Source';

    if (!url) continue;

    if (!isDuplicate(rawSheet, url)) {
      rawSheet.appendRow([
        new Date(),
        source,
        '', // Title (will be fetched)
        url,
        '', // Full text (will be fetched)
        '', // Published date (will be extracted)
        'pending',
        'Backfilled from manual list'
      ]);
      added++;
    } else {
      duplicates++;
    }
  }

  Logger.log('═══════════════════════════');
  Logger.log(`✅ Backfill complete`);
  Logger.log(`Added: ${added} articles`);
  Logger.log(`Skipped (duplicates): ${duplicates}`);
  Logger.log('═══════════════════════════');
  Logger.log('Next: Let triggers run to fetch text and process with Gemini');
}

// ============================================================================
// METHOD 3: SITE-SPECIFIC SEARCH SCRAPING (Advanced)
// ============================================================================

/**
 * Search each Guyana news site's internal search
 * This scrapes search results pages to find crime articles
 *
 * WARNING: This may violate some sites' Terms of Service
 * Use responsibly and respect robots.txt
 */
function backfillUsingSiteSearch() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.RAW_ARTICLES);
  let totalFound = 0;

  const siteSearchConfigs = [
    {
      name: 'Demerara Waves',
      searchUrl: 'https://demerarawaves.com/?s={keyword}',
      linkSelector: 'article h2 a' // CSS selector for article links
    },
    {
      name: 'INews Guyana',
      searchUrl: 'https://www.inewsguyana.com/?s={keyword}',
      linkSelector: 'h2.entry-title a'
    },
    {
      name: 'Kaieteur News',
      searchUrl: 'https://www.kaieteurnewsonline.com/?s={keyword}',
      linkSelector: '.entry-title a'
    },
    {
      name: 'News Room Guyana',
      searchUrl: 'https://newsroom.gy/?s={keyword}',
      linkSelector: 'h3.entry-title a'
    },
    {
      name: 'Guyana Times',
      searchUrl: 'https://www.guyanatimesgy.com/?s={keyword}',
      linkSelector: '.entry-title a'
    }
  ];

  // This is a simplified example - actual implementation requires HTML parsing
  Logger.log('⚠️ Site-specific scraping requires advanced HTML parsing');
  Logger.log('Recommend using Method 2 (Manual URL List) instead');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Setup Google Custom Search (one-time)
 * Follow prompts to add API key and Search Engine ID
 */
function setupGoogleSearch() {
  Logger.log('═══════════════════════════════════════');
  Logger.log('Google Custom Search Setup');
  Logger.log('═══════════════════════════════════════');
  Logger.log('');
  Logger.log('Step 1: Get API Key');
  Logger.log('Go to: https://developers.google.com/custom-search/v1/introduction');
  Logger.log('Click "Get a Key" and create a new project');
  Logger.log('');
  Logger.log('Step 2: Create Custom Search Engine');
  Logger.log('Go to: https://programmablesearchengine.google.com/');
  Logger.log('Create a new search engine for Guyana news sites');
  Logger.log('Add sites: demerarawaves.com, inewsguyana.com, etc.');
  Logger.log('');
  Logger.log('Step 3: Add to Script Properties');
  Logger.log('Run these functions with your values:');
  Logger.log('  setCustomSearchApiKey("YOUR_API_KEY_HERE")');
  Logger.log('  setSearchEngineId("YOUR_SEARCH_ENGINE_ID_HERE")');
  Logger.log('');
  Logger.log('Free tier: 100 searches/day');
  Logger.log('═══════════════════════════════════════');
}

function setCustomSearchApiKey(apiKey) {
  PropertiesService.getScriptProperties().setProperty('CUSTOM_SEARCH_API_KEY', apiKey);
  Logger.log('✅ Custom Search API key saved');
}

function setSearchEngineId(searchEngineId) {
  PropertiesService.getScriptProperties().setProperty('SEARCH_ENGINE_ID', searchEngineId);
  Logger.log('✅ Search Engine ID saved');
}

/**
 * Generate search URLs for manual searching
 * This gives you URLs to open in browser and collect results
 */
function generateManualSearchUrls() {
  Logger.log('═══════════════════════════════════════');
  Logger.log('Manual Search URLs for Guyana Crime Data');
  Logger.log('Open these in browser, copy article URLs');
  Logger.log('═══════════════════════════════════════');
  Logger.log('');

  const keywords = ['murder', 'shooting', 'robbery', 'bandit', 'killed'];

  GUYANA_SITES.forEach(site => {
    Logger.log(`\n--- ${site} ---`);
    keywords.forEach(keyword => {
      const googleSearchUrl = `https://www.google.com/search?q=site:${site}+${keyword}+after:2025-01-01+before:2025-11-13`;
      Logger.log(`${keyword}: ${googleSearchUrl}`);
    });
  });

  Logger.log('\n═══════════════════════════════════════');
  Logger.log('Copy article URLs from results to "Backfill URLs" sheet');
  Logger.log('Then run: backfillFromManualList()');
}

/**
 * Estimate how many articles to expect
 */
function estimateBackfillSize() {
  Logger.log('═══════════════════════════════════════');
  Logger.log('Backfill Estimate for Guyana (Jan-Nov 2025)');
  Logger.log('═══════════════════════════════════════');
  Logger.log('');
  Logger.log('Assumptions:');
  Logger.log('  - 5 news sources');
  Logger.log('  - ~2-3 crime articles per source per day');
  Logger.log('  - 315 days (Jan 1 - Nov 13)');
  Logger.log('');
  Logger.log('Conservative estimate: 5 sources × 2 articles × 315 days = 3,150 articles');
  Logger.log('After filtering (50% crime-related): ~1,575 articles');
  Logger.log('After deduplication: ~1,200-1,400 articles');
  Logger.log('');
  Logger.log('Time to process:');
  Logger.log('  - Fetching: 1,400 articles ÷ 10/hour = 140 hours (~6 days)');
  Logger.log('  - Gemini processing: 1,400 articles ÷ 15/hour = 93 hours (~4 days)');
  Logger.log('  - Total: ~10 days for complete backfill');
  Logger.log('═══════════════════════════════════════');
}

/**
 * Last Updated: 2025-11-13
 */
