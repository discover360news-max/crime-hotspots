/**
 * Article Text Fetcher
 * PRODUCTION VERSION 1.0
 *
 * Purpose: Fetches full article text from URLs in Raw Articles sheet
 * Trigger: Runs every 2 hours via time-based trigger
 * Status Transitions: pending → ready_for_processing (or fetch_failed)
 *
 * Batch Size: 10 articles per run (matches PROCESSING_CONFIG.MAX_FETCH_PER_RUN)
 * Rate Limiting: 1 second delay between fetches to avoid blocking
 *
 * Last Updated: 2025-11-08
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const RAW_ARTICLES_SHEET = 'Raw Articles';
const BATCH_SIZE = 10; // Matches PROCESSING_CONFIG.MAX_FETCH_PER_RUN from config.md

// ============================================================================
// MAIN FETCHING FUNCTION
// ============================================================================

/**
 * Main function to fetch article text for pending articles
 * This is the entry point called by the time-based trigger
 *
 * @returns {number} Number of articles processed
 */
function fetchPendingArticleText() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(RAW_ARTICLES_SHEET);

  if (!sheet) {
    Logger.log('ERROR: Sheet "Raw Articles" not found');
    return 0;
  }

  // Find rows with status = 'pending'
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const statusCol = headers.indexOf('Status');
  const urlCol = headers.indexOf('URL');
  const fullTextCol = headers.indexOf('Full Text');

  let processed = 0;

  for (let i = 1; i < data.length && processed < BATCH_SIZE; i++) {
    const row = data[i];

    if (row[statusCol] === 'pending') {
      const url = row[urlCol];

      try {
        Logger.log(`Fetching: ${url}`);

        const fullText = fetchArticleText(url);

        // Update Full Text column (E) and Status column (G)
        sheet.getRange(i + 1, fullTextCol + 1).setValue(fullText);
        sheet.getRange(i + 1, statusCol + 1).setValue('ready_for_processing');

        Logger.log(`✓ Fetched (${fullText.length} chars)`);
        processed++;

        // Rate limiting to avoid being blocked
        Utilities.sleep(1000);

      } catch (error) {
        Logger.log(`✗ Error: ${error.message}`);
        sheet.getRange(i + 1, statusCol + 1).setValue('fetch_failed');
        sheet.getRange(i + 1, 8).setValue(error.message); // Notes column
      }
    }
  }

  Logger.log(`─────────────────────────────`);
  Logger.log(`Processed: ${processed} articles`);
  Logger.log(`─────────────────────────────`);

  return processed;
}

// ============================================================================
// TEXT EXTRACTION
// ============================================================================

/**
 * Fetch full text from article URL
 *
 * @param {string} url - Article URL to fetch
 * @returns {string} Extracted article text
 * @throws {Error} If fetch fails or returns non-200 status
 */
function fetchArticleText(url) {
  try {
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`HTTP ${response.getResponseCode()}`);
    }

    const html = response.getContentText();

    // Extract article text from HTML
    const articleText = extractArticleFromHTML(html);

    return articleText;

  } catch (error) {
    throw new Error(`Failed to fetch: ${error.message}`);
  }
}

/**
 * Extract article text from HTML
 * Simple extraction that works across different news sites
 *
 * @param {string} html - Raw HTML content
 * @returns {string} Extracted text (max 5000 chars for API efficiency)
 */
function extractArticleFromHTML(html) {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Limit to first 5000 characters for API efficiency
  if (text.length > 5000) {
    text = text.substring(0, 5000);
  }

  return text;
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test function - fetches text for pending articles
 * Run this manually to verify article fetching works
 */
function testArticleFetching() {
  Logger.log('═════════════════════════════');
  Logger.log('Testing Article Text Fetching');
  Logger.log('═════════════════════════════');

  const count = fetchPendingArticleText();

  Logger.log('');
  Logger.log('✓ Test Complete');
  Logger.log('Check "Raw Articles" sheet:');
  Logger.log('- Column E should have article text');
  Logger.log('- Status should be "ready_for_processing"');
  Logger.log('');
}

/**
 * Mark first article as ready for processing (for testing)
 * Useful when you want to re-test an article that's already been processed
 */
function markArticleForTesting() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');

  // Change row 2's status from "skipped" to "ready_for_processing"
  sheet.getRange(2, 7).setValue('ready_for_processing');

  Logger.log('✓ Row 2 marked as ready_for_processing');
  Logger.log('Now run: testGeminiExtraction()');
}

/**
 * Last Updated: 2025-11-08
 * Production Version: 1.0
 */
