/**
 * IMPROVED Article Text Fetcher
 * VERSION 2.0
 *
 * Purpose: Intelligently extract ONLY the main article content
 * Excludes: Navigation, sidebars, related articles, metadata
 *
 * Key Improvements:
 * 1. Targets <article> and specific content divs
 * 2. Validates extracted content matches article title
 * 3. Rejects content with excessive sidebar contamination
 * 4. Multiple extraction strategies with fallbacks
 *
 * Last Updated: 2025-11-09
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONTENT_SELECTORS = {
  // Priority order - try these in sequence
  primary: [
    'article',
    'article.post',
    'article.entry',
    'div.article-content',
    'div.entry-content',
    'div.post-content',
    'div.content',
    'main'
  ],

  // Trinidad news sites specific selectors
  trinidadNewsday: [
    'article',
    'div.entry-content',
    'div.post-content'
  ],

  trinidadExpress: [
    'article',
    'div.article-content',
    'div.asset-content'
  ],

  cnc3: [
    'article',
    'div.post-content',
    'div.entry-content'
  ]
};

// Elements to EXCLUDE (navigation, sidebar, etc.)
const EXCLUDE_SELECTORS = [
  'nav',
  'header',
  'footer',
  'aside',
  '.sidebar',
  '.widget',
  '.related-posts',
  '.related-articles',
  '.more-from',
  '.you-may-also-like',
  '.recommended-for-you',
  '.recommended',
  '.trending',
  '.comments',
  '.social-share',
  '.advertisement',
  '.ad-container',
  'script',
  'style',
  'noscript'
];

// Minimum content validation thresholds
const VALIDATION = {
  MIN_CONTENT_LENGTH: 200,           // Minimum 200 chars
  MIN_TITLE_MATCH_PCT: 40,           // At least 40% of title keywords in content
  MAX_CRIME_KEYWORDS_NONCRIME: 4,    // Max 4 crime keywords in non-crime article (increased from 2)
  MIN_SENTENCES: 3                   // At least 3 sentences
};

// ============================================================================
// MAIN FETCHING FUNCTION (IMPROVED)
// ============================================================================

/**
 * Fetch article text with intelligent content extraction
 * @param {string} url - Article URL
 * @param {string} title - Article title (for validation)
 * @returns {Object} {success: boolean, content: string, issues: []}
 */
function fetchArticleTextImproved(url, title) {
  const result = {
    success: false,
    content: '',
    issues: [],
    method: ''
  };

  try {
    // Fetch HTML
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.getResponseCode() !== 200) {
      result.issues.push(`HTTP ${response.getResponseCode()}`);
      return result;
    }

    const html = response.getContentText();

    // Try extraction strategies in order
    const strategies = [
      () => extractByArticleTag(html),
      () => extractByContentDiv(html),
      () => extractByCommonSelectors(html),
      () => extractFallback(html)  // Last resort
    ];

    for (const strategy of strategies) {
      const extracted = strategy();

      if (extracted && extracted.length > VALIDATION.MIN_CONTENT_LENGTH) {
        // Validate extracted content
        const validation = validateExtractedContent(extracted, title);

        if (validation.valid) {
          result.success = true;
          result.content = extracted;
          result.method = validation.method;
          result.issues = validation.warnings || [];
          return result;
        } else {
          result.issues.push(...validation.issues);
        }
      }
    }

    // If we get here, all strategies failed
    result.issues.push('All extraction strategies failed validation');
    return result;

  } catch (error) {
    result.issues.push(`Fetch error: ${error.message}`);
    return result;
  }
}

// ============================================================================
// EXTRACTION STRATEGIES
// ============================================================================

/**
 * Strategy 1: Extract from <article> tag
 */
function extractByArticleTag(html) {
  // Simple regex to find <article>...</article>
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  if (articleMatch && articleMatch[1]) {
    let content = articleMatch[1];

    // Remove excluded elements
    content = removeExcludedElements(content);

    // Strip HTML tags
    content = stripHtmlTags(content);

    // Clean up
    content = cleanText(content);

    return content;
  }

  return null;
}

/**
 * Strategy 2: Extract from content divs
 */
function extractByContentDiv(html) {
  // Try specific content div classes
  const divPatterns = [
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  ];

  for (const pattern of divPatterns) {
    const match = html.match(pattern);

    if (match && match[1]) {
      let content = match[1];
      content = removeExcludedElements(content);
      content = stripHtmlTags(content);
      content = cleanText(content);

      if (content.length > VALIDATION.MIN_CONTENT_LENGTH) {
        return content;
      }
    }
  }

  return null;
}

/**
 * Strategy 3: Try common news site patterns
 */
function extractByCommonSelectors(html) {
  // Look for paragraphs within main content area
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  if (mainMatch && mainMatch[1]) {
    let content = mainMatch[1];
    content = removeExcludedElements(content);
    content = stripHtmlTags(content);
    content = cleanText(content);

    if (content.length > VALIDATION.MIN_CONTENT_LENGTH) {
      return content;
    }
  }

  return null;
}

/**
 * Strategy 4: Fallback - use old method but with strict validation
 */
function extractFallback(html) {
  let text = html;

  // Remove scripts, styles, nav, aside
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
  text = text.replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '');
  text = text.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
  text = text.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');

  // Strip remaining HTML tags
  text = stripHtmlTags(text);

  // Clean
  text = cleanText(text);

  return text;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Remove excluded elements from HTML string
 */
function removeExcludedElements(html) {
  let cleaned = html;

  // Remove sidebars and related articles sections
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*sidebar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*related[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  // Remove "RECOMMENDED FOR YOU" sections (Trinidad Express pattern)
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*recommended[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*trending[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // Remove navigation
  cleaned = cleaned.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');

  // Remove scripts and styles
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  return cleaned;
}

/**
 * Strip HTML tags
 */
function stripHtmlTags(html) {
  let text = html;

  // Remove tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#039;/g, "'");

  return text;
}

/**
 * Clean extracted text
 */
function cleanText(text) {
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Remove WordPress/metadata artifacts
  text = text.replace(/\[cat_[^\]]+\]/g, '');
  text = text.replace(/=>/g, '');

  // Remove "RECOMMENDED FOR YOU" sections and everything after
  // Pattern: "RECOMMENDED FOR YOU" followed by article titles/links
  const recommendedIndex = text.search(/RECOMMENDED FOR YOU/i);
  if (recommendedIndex > 0) {
    // Only truncate if "RECOMMENDED" appears after substantial content
    if (recommendedIndex > VALIDATION.MIN_CONTENT_LENGTH) {
      text = text.substring(0, recommendedIndex).trim();
    }
  }

  // Also remove common recommendation markers
  text = text.replace(/\s*(MORE FROM|TRENDING|YOU MAY ALSO LIKE|RELATED ARTICLES?|READ ALSO)[:\s].*/gi, '');

  // Limit to first 5000 characters
  if (text.length > 5000) {
    text = text.substring(0, 5000);
  }

  return text;
}

// ============================================================================
// CONTENT VALIDATION
// ============================================================================

/**
 * Validate that extracted content actually matches the article
 * @param {string} content - Extracted text
 * @param {string} title - Article title
 * @returns {Object} {valid: boolean, issues: [], warnings: [], method: string}
 */
function validateExtractedContent(content, title) {
  const validation = {
    valid: true,
    issues: [],
    warnings: [],
    method: 'Smart extraction'
  };

  // Check 1: Minimum length
  if (content.length < VALIDATION.MIN_CONTENT_LENGTH) {
    validation.valid = false;
    validation.issues.push(`Content too short: ${content.length} chars`);
    return validation;
  }

  // Check 2: Not just metadata
  if (content.includes('[cat_name]') || content.includes('[cat_slug]')) {
    validation.valid = false;
    validation.issues.push('Content contains WordPress metadata - extraction failed');
    return validation;
  }

  // Check 3: Title keyword matching
  const titleWords = title.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !['news', 'latest', 'trinidad', 'tobago'].includes(w));

  if (titleWords.length > 0) {
    const contentLower = content.toLowerCase();
    const matchCount = titleWords.filter(w => contentLower.includes(w)).length;
    const matchPct = (matchCount / titleWords.length) * 100;

    if (matchPct < VALIDATION.MIN_TITLE_MATCH_PCT) {
      validation.valid = false;
      validation.issues.push(`Title match too low: ${matchPct.toFixed(0)}% (need ${VALIDATION.MIN_TITLE_MATCH_PCT}%)`);
      return validation;
    }

    if (matchPct < 60) {
      validation.warnings.push(`Title match moderate: ${matchPct.toFixed(0)}%`);
    }
  }

  // Check 4: Detect sidebar contamination
  const crimeKeywords = ['murder', 'shot', 'killed', 'robbery', 'assault', 'crime', 'police'];
  const crimeRelatedWords = [
    'murder', 'murdered', 'murdering', 'kill', 'killed', 'killing',
    'shot', 'shoot', 'shoots', 'shooting',
    'robbed', 'robbery', 'rob', 'robbing',
    'assault', 'assaulted', 'assaulting', 'attack', 'attacked', 'attacking',
    'stabbed', 'stabbing', 'stab',
    'kidnap', 'kidnapped', 'kidnapping',
    'rape', 'raped', 'raping',
    'theft', 'stolen', 'steal', 'stealing',
    'executed', 'execution',
    'arrested', 'arrest', 'arresting',
    'detained', 'detain', 'detaining',
    'terrorised', 'terrorized', 'terrorize', 'terror',
    'gang', 'gangs', 'gunman', 'gunmen', 'gunfire',
    'chopped', 'chopping', 'chop'  // Caribbean-specific
  ];

  const titleLower = title.toLowerCase();
  const titleHasCrimeKeywords = crimeRelatedWords.some(kw => titleLower.includes(kw));

  if (!titleHasCrimeKeywords) {
    // Title is NOT about crime - check if content has excessive crime keywords
    const contentLower = content.toLowerCase();
    const crimeKeywordCount = crimeKeywords.filter(kw => contentLower.includes(kw)).length;

    if (crimeKeywordCount > VALIDATION.MAX_CRIME_KEYWORDS_NONCRIME) {
      validation.valid = false;
      validation.issues.push(`Sidebar contamination detected: ${crimeKeywordCount} crime keywords in non-crime article`);
      return validation;
    }
  }

  // Check 5: Has actual sentences
  const sentences = content.match(/[.!?]+/g);
  if (!sentences || sentences.length < VALIDATION.MIN_SENTENCES) {
    validation.valid = false;
    validation.issues.push('Content has too few sentences - may be navigation/menu text');
    return validation;
  }

  return validation;
}

// ============================================================================
// BATCH PROCESSING (UPDATED)
// ============================================================================

/**
 * Process pending articles with improved fetcher
 * @returns {Object} Statistics on processing
 */
function fetchPendingArticlesImproved() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');

  if (!sheet) {
    Logger.log('ERROR: "Raw Articles" sheet not found');
    return {processed: 0, success: 0, failed: 0};
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const statusCol = headers.indexOf('Status');
  const urlCol = headers.indexOf('URL');
  const titleCol = headers.indexOf('Title');
  const fullTextCol = headers.indexOf('Full Text');
  const notesCol = headers.indexOf('Notes');

  let processed = 0;
  let success = 0;
  let failed = 0;

  const BATCH_SIZE = 10;

  Logger.log('=== IMPROVED ARTICLE FETCHER ===\n');

  for (let i = 1; i < data.length && processed < BATCH_SIZE; i++) {
    const row = data[i];

    if (row[statusCol] === 'pending') {
      const url = row[urlCol];
      const title = row[titleCol];

      Logger.log(`Row ${i + 1}: ${title.substring(0, 50)}...`);

      const result = fetchArticleTextImproved(url, title);

      if (result.success) {
        // Success - update Full Text and Status
        sheet.getRange(i + 1, fullTextCol + 1).setValue(result.content);
        sheet.getRange(i + 1, statusCol + 1).setValue('ready_for_processing');

        const note = `✅ Fetched (${result.content.length} chars, method: ${result.method})`;
        sheet.getRange(i + 1, notesCol + 1).setValue(note);

        Logger.log(`  ✅ Success (${result.content.length} chars)`);
        if (result.issues.length > 0) {
          Logger.log(`  Warnings: ${result.issues.join('; ')}`);
        }

        success++;
      } else {
        // Failed - mark as fetch_failed
        sheet.getRange(i + 1, statusCol + 1).setValue('fetch_failed');

        const note = `❌ Fetch failed: ${result.issues.join('; ')}`;
        sheet.getRange(i + 1, notesCol + 1).setValue(note);

        Logger.log(`  ❌ Failed: ${result.issues.join('; ')}`);

        failed++;
      }

      processed++;
      Utilities.sleep(1000);  // Rate limiting
    }
  }

  Logger.log('\n=== PROCESSING COMPLETE ===');
  Logger.log(`Processed: ${processed}`);
  Logger.log(`Success: ${success}`);
  Logger.log(`Failed: ${failed}`);
  Logger.log(`Success Rate: ${processed > 0 ? (success/processed*100).toFixed(0) : 0}%`);

  return {processed, success, failed};
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test improved fetcher with specific URL
 */
function testImprovedFetcher(url, title) {
  Logger.log('=== TESTING IMPROVED FETCHER ===\n');
  Logger.log(`URL: ${url}`);
  Logger.log(`Title: ${title}\n`);

  const result = fetchArticleTextImproved(url, title);

  Logger.log('=== RESULT ===');
  Logger.log(`Success: ${result.success}`);
  Logger.log(`Method: ${result.method}`);
  Logger.log(`Content Length: ${result.content ? result.content.length : 0} chars`);

  if (result.issues.length > 0) {
    Logger.log(`Issues: ${result.issues.join('; ')}`);
  }

  if (result.success && result.content) {
    Logger.log('\n=== FIRST 500 CHARS ===');
    Logger.log(result.content.substring(0, 500));
    Logger.log('\n=== LAST 200 CHARS ===');
    Logger.log(result.content.substring(Math.max(0, result.content.length - 200)));
  }

  return result;
}

/**
 * Test with the problematic Row 3 article
 */
function testRow3Fix() {
  Logger.log('Testing Row 3 (President: UN youth programme)...\n');

  const url = 'https://newsday.co.tt/2025/11/08/president-un-youth-programme-promotes-pathways-of-peace/';
  const title = 'President: UN youth programme promotes pathways of peace';

  const result = testImprovedFetcher(url, title);

  Logger.log('\n=== VALIDATION ===');

  // Check if it avoided sidebar crimes
  if (result.success) {
    const contentLower = result.content.toLowerCase();
    const hasCrimeKeywords = ['williamsville', 'labourer', 'shot'].some(kw =>
      contentLower.includes(kw)
    );

    if (hasCrimeKeywords) {
      Logger.log('❌ FAILED: Still contains sidebar crime content');
    } else {
      Logger.log('✅ SUCCESS: Sidebar content excluded');
    }

    const hasUnContent = contentLower.includes('youth') && contentLower.includes('peace');
    if (hasUnContent) {
      Logger.log('✅ SUCCESS: Contains actual article content');
    } else {
      Logger.log('⚠️ WARNING: May not have actual article content');
    }
  } else {
    Logger.log(`❌ Fetcher failed: ${result.issues.join('; ')}`);
  }
}

/**
 * Test "RECOMMENDED FOR YOU" fix with specific rows
 */
function testRecommendedForYouFix() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const urlCol = headers.indexOf('URL');
  const titleCol = headers.indexOf('Title');

  // Test rows that had MP mourns in RECOMMENDED section
  const testRows = [34, 70]; // Rows 34 and 70 from the log

  Logger.log('=== TESTING RECOMMENDED FOR YOU FIX ===\n');

  testRows.forEach(rowNum => {
    const row = data[rowNum - 1];
    const url = row[urlCol];
    const title = row[titleCol];

    Logger.log(`\nRow ${rowNum}: ${title.substring(0, 60)}...`);

    const result = fetchArticleTextImproved(url, title);

    if (result.success) {
      const contentLower = result.content.toLowerCase();

      // Check if "MP mourns" or "RECOMMENDED FOR YOU" still present
      const hasMPMourns = contentLower.includes('mp mourns');
      const hasRecommended = contentLower.includes('recommended for you');

      if (hasMPMourns || hasRecommended) {
        Logger.log('  ❌ FAIL: Still contains recommendation content');
        if (hasMPMourns) Logger.log('    - Contains "MP mourns"');
        if (hasRecommended) Logger.log('    - Contains "RECOMMENDED FOR YOU"');
      } else {
        Logger.log('  ✅ PASS: Recommendation content removed');
      }

      Logger.log(`  Content length: ${result.content.length} chars`);
      Logger.log(`  First 150 chars: ${result.content.substring(0, 150)}...`);
    } else {
      Logger.log(`  ❌ Fetch failed: ${result.issues.join('; ')}`);
    }
  });

  Logger.log('\n=== TEST COMPLETE ===');
}

/**
 * Re-fetch all contaminated articles
 */
function refetchContaminatedArticles() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const statusCol = headers.indexOf('Status');
  const urlCol = headers.indexOf('URL');
  const titleCol = headers.indexOf('Title');
  const fullTextCol = headers.indexOf('Full Text');
  const notesCol = headers.indexOf('Notes');

  // Rows identified as contaminated from diagnostics
  const contaminatedRows = [3, 4, 15, 32, 33, 34, 37, 38, 43, 44, 46, 47, 50, 54, 58, 61, 62, 64, 65, 66, 69, 70];

  Logger.log(`=== RE-FETCHING ${contaminatedRows.length} CONTAMINATED ARTICLES ===\n`);

  let success = 0;
  let failed = 0;

  contaminatedRows.forEach(rowNum => {
    if (rowNum >= data.length) return;

    const row = data[rowNum - 1];  // -1 because data array is 0-indexed
    const url = row[urlCol];
    const title = row[titleCol];

    Logger.log(`Row ${rowNum}: ${title.substring(0, 50)}...`);

    const result = fetchArticleTextImproved(url, title);

    if (result.success) {
      sheet.getRange(rowNum, fullTextCol + 1).setValue(result.content);
      sheet.getRange(rowNum, statusCol + 1).setValue('ready_for_processing');
      sheet.getRange(rowNum, notesCol + 1).setValue(`✅ Re-fetched with improved method`);

      Logger.log(`  ✅ Success (${result.content.length} chars)`);
      success++;
    } else {
      sheet.getRange(rowNum, statusCol + 1).setValue('fetch_failed');
      sheet.getRange(rowNum, notesCol + 1).setValue(`❌ Re-fetch failed: ${result.issues.join('; ')}`);

      Logger.log(`  ❌ Failed: ${result.issues.join('; ')}`);
      failed++;
    }

    Utilities.sleep(2000);  // 2 second delay to avoid rate limiting
  });

  Logger.log('\n=== RE-FETCH COMPLETE ===');
  Logger.log(`Success: ${success}/${contaminatedRows.length}`);
  Logger.log(`Failed: ${failed}/${contaminatedRows.length}`);
}
