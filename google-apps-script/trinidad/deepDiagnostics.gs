/**
 * DEEP DIAGNOSTICS - Article Content Inspection
 *
 * These functions inspect the actual content being sent to Gemini
 * to confirm the root cause of wrong extractions
 *
 * @version 1.0
 * @date 2025-11-09
 */

/**
 * DIAGNOSTIC: Show what content is actually in Full Text column
 * This reveals if article fetcher is grabbing wrong content
 *
 * @param {number} rawRowNumber - Row number in Raw Articles sheet
 */
function inspectArticleContent(rawRowNumber) {
  Logger.log('========================================');
  Logger.log('INSPECTING ARTICLE CONTENT');
  Logger.log('========================================\n');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
  const data = sheet.getRange(rawRowNumber, 1, 1, 8).getValues()[0];

  const timestamp = data[0];
  const source = data[1];
  const title = data[2];
  const url = data[3];
  const fullText = data[4];
  const publishedDate = data[5];
  const status = data[6];
  const notes = data[7];

  Logger.log(`Row ${rawRowNumber}:`);
  Logger.log(`  Title: ${title}`);
  Logger.log(`  URL: ${url}`);
  Logger.log(`  Source: ${source}`);
  Logger.log(`  Published: ${publishedDate}`);
  Logger.log(`  Status: ${status}`);
  Logger.log(`  Notes: ${notes}\n`);

  if (!fullText || fullText.trim() === '') {
    Logger.log('❌ Full Text is EMPTY\n');
    Logger.log('This article has not been fetched yet.');
    Logger.log('Run fetchPendingArticleText() first.\n');
    return;
  }

  Logger.log(`Full Text Length: ${fullText.length} characters\n`);
  Logger.log('=== FIRST 1000 CHARACTERS ===');
  Logger.log(fullText.substring(0, 1000));
  Logger.log('... [truncated] ...\n');

  Logger.log('=== LAST 500 CHARACTERS ===');
  Logger.log(fullText.substring(Math.max(0, fullText.length - 500)));
  Logger.log('\n');

  // Check if title keywords appear in content
  const titleWords = title.toLowerCase().split(' ').filter(w => w.length > 3);
  const contentLower = fullText.toLowerCase();

  let titleMatchCount = 0;
  titleWords.forEach(word => {
    if (contentLower.includes(word)) {
      titleMatchCount++;
    }
  });

  const matchPercentage = (titleMatchCount / titleWords.length * 100).toFixed(0);

  Logger.log('=== CONTENT VALIDATION ===');
  Logger.log(`Title keywords in content: ${titleMatchCount}/${titleWords.length} (${matchPercentage}%)`);

  if (matchPercentage < 30) {
    Logger.log('⚠️ WARNING: Very few title keywords found in content!');
    Logger.log('This suggests the fetched content does NOT match the article title.\n');
  } else if (matchPercentage < 60) {
    Logger.log('⚠️ CAUTION: Some title keywords missing from content.');
    Logger.log('Content may include sidebar/navigation text.\n');
  } else {
    Logger.log('✅ Good match - content likely relates to title.\n');
  }

  // Check for crime-related keywords (might indicate sidebar content)
  const crimeKeywords = ['murder', 'shot', 'killed', 'robbery', 'assault', 'crime', 'police'];
  const crimeMatches = crimeKeywords.filter(kw => contentLower.includes(kw));

  if (crimeMatches.length > 0 && !titleWords.some(w => crimeKeywords.includes(w))) {
    Logger.log('⚠️ POTENTIAL ISSUE:');
    Logger.log(`Content contains crime keywords: ${crimeMatches.join(', ')}`);
    Logger.log('But title does NOT suggest crime article.');
    Logger.log('This likely indicates sidebar/related articles being included.\n');
  }

  Logger.log('========================================');
}

/**
 * DIAGNOSTIC: Compare fetched content vs actual article
 * Fetch the URL fresh and compare to what's stored
 *
 * @param {number} rawRowNumber - Row number in Raw Articles sheet
 */
function compareStoredVsFreshContent(rawRowNumber) {
  Logger.log('========================================');
  Logger.log('COMPARING STORED VS FRESH CONTENT');
  Logger.log('========================================\n');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
  const data = sheet.getRange(rawRowNumber, 1, 1, 8).getValues()[0];

  const title = data[2];
  const url = data[3];
  const storedText = data[4];

  Logger.log(`Article: ${title}`);
  Logger.log(`URL: ${url}\n`);

  if (!storedText) {
    Logger.log('❌ No stored content to compare\n');
    return;
  }

  Logger.log('Fetching fresh content...\n');

  try {
    const freshText = fetchArticleText(url);

    Logger.log('=== COMPARISON ===');
    Logger.log(`Stored length: ${storedText.length} chars`);
    Logger.log(`Fresh length: ${freshText.length} chars`);
    Logger.log(`Difference: ${Math.abs(storedText.length - freshText.length)} chars\n`);

    // Calculate similarity
    const similarity = calculateStringSimilarity(
      storedText.substring(0, 1000),
      freshText.substring(0, 1000)
    );

    Logger.log(`Content similarity: ${(similarity * 100).toFixed(0)}%\n`);

    if (similarity < 0.5) {
      Logger.log('⚠️ WARNING: Stored and fresh content are very different!');
      Logger.log('The article may have been updated, or fetching is inconsistent.\n');
    } else if (similarity < 0.8) {
      Logger.log('⚠️ CAUTION: Some differences detected.');
      Logger.log('Minor updates or dynamic content may be present.\n');
    } else {
      Logger.log('✅ Content is consistent.\n');
    }

    Logger.log('=== STORED CONTENT (first 500 chars) ===');
    Logger.log(storedText.substring(0, 500));
    Logger.log('\n=== FRESH CONTENT (first 500 chars) ===');
    Logger.log(freshText.substring(0, 500));
    Logger.log('\n');

  } catch (error) {
    Logger.log(`❌ Failed to fetch fresh content: ${error.message}\n`);
  }

  Logger.log('========================================');
}

/**
 * DIAGNOSTIC: Analyze what Gemini received and what it extracted
 * Shows the complete input->output flow for debugging
 *
 * @param {number} rawRowNumber - Row number in Raw Articles sheet
 */
function analyzeExtractionFlow(rawRowNumber) {
  Logger.log('========================================');
  Logger.log('ANALYZING EXTRACTION FLOW');
  Logger.log('========================================\n');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
  const data = sheet.getRange(rawRowNumber, 1, 1, 8).getValues()[0];

  const title = data[2];
  const url = data[3];
  const fullText = data[4];
  const publishedDate = data[5];
  const status = data[6];
  const notes = data[7];

  Logger.log('STEP 1: INPUT TO GEMINI');
  Logger.log('------------------------');
  Logger.log(`Title: ${title}`);
  Logger.log(`URL: ${url}`);
  Logger.log(`Published: ${publishedDate}`);
  Logger.log(`Status: ${status}\n`);

  if (!fullText) {
    Logger.log('❌ No full text available\n');
    return;
  }

  Logger.log(`Full Text Length: ${fullText.length} chars`);
  Logger.log('First 800 chars sent to Gemini:');
  Logger.log('---');
  Logger.log(fullText.substring(0, 800));
  Logger.log('---\n');

  if (!verifyApiKey()) {
    Logger.log('❌ API key not configured. Cannot run extraction.\n');
    return;
  }

  Logger.log('STEP 2: GEMINI EXTRACTION');
  Logger.log('--------------------------');
  Logger.log('Calling Gemini API...\n');

  try {
    const result = extractCrimeData(fullText, title, url, publishedDate);

    Logger.log('STEP 3: EXTRACTION RESULT');
    Logger.log('-------------------------');
    Logger.log(JSON.stringify(result, null, 2));
    Logger.log('\n');

    Logger.log('STEP 4: ANALYSIS');
    Logger.log('----------------');

    if (result.crimes && result.crimes.length > 0) {
      Logger.log(`✅ Extracted ${result.crimes.length} crime(s)`);
      Logger.log(`Confidence: ${result.confidence}\n`);

      result.crimes.forEach((crime, idx) => {
        Logger.log(`Crime ${idx + 1}:`);
        Logger.log(`  Headline: ${crime.headline}`);
        Logger.log(`  Type: ${crime.crime_type}`);
        Logger.log(`  Area: ${crime.area}`);
        Logger.log(`  Date: ${crime.crime_date}`);
        Logger.log(`  Source URL: ${crime.source_url}`);

        // Check if crime headline appears in article text
        const headlineWords = crime.headline.toLowerCase().split(' ').filter(w => w.length > 3);
        const matchCount = headlineWords.filter(w => fullText.toLowerCase().includes(w)).length;
        const matchPct = (matchCount / headlineWords.length * 100).toFixed(0);

        Logger.log(`  Content match: ${matchCount}/${headlineWords.length} words (${matchPct}%)`);

        if (matchPct < 50) {
          Logger.log(`  ⚠️ WARNING: Crime headline keywords NOT found in article text!`);
          Logger.log(`  This crime likely came from sidebar/related articles.`);
        } else {
          Logger.log(`  ✅ Crime content appears in article text.`);
        }

        Logger.log('');
      });

      // Check if article title suggests it should contain these crimes
      const titleLower = title.toLowerCase();
      const isCrimeTitle = crimeKeywords.some(kw => titleLower.includes(kw));

      if (!isCrimeTitle && result.crimes.length > 0) {
        Logger.log('🚨 CRITICAL ISSUE DETECTED:');
        Logger.log('Article title does NOT suggest crime content,');
        Logger.log('but Gemini extracted crimes anyway.');
        Logger.log('\nThis confirms the article fetcher is including');
        Logger.log('sidebar/related articles content.\n');
      }

    } else {
      Logger.log('⏭️ No crimes extracted (confidence: 0)\n');
    }

    if (result.ambiguities && result.ambiguities.length > 0) {
      Logger.log('Ambiguities reported:');
      result.ambiguities.forEach(amb => Logger.log(`  - ${amb}`));
      Logger.log('');
    }

  } catch (error) {
    Logger.log(`❌ Extraction failed: ${error.message}\n`);
  }

  Logger.log('========================================');
}

/**
 * DIAGNOSTIC: Check all "completed" articles for title mismatch
 * Identifies how widespread the sidebar content issue is
 */
function scanForSidebarContamination() {
  Logger.log('========================================');
  Logger.log('SCANNING FOR SIDEBAR CONTAMINATION');
  Logger.log('========================================\n');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
  const data = sheet.getDataRange().getValues();

  const crimeKeywords = ['murder', 'shot', 'killed', 'robbery', 'assault', 'crime', 'police', 'death'];
  let contaminated = 0;
  let checked = 0;

  Logger.log('Checking articles marked "completed"...\n');

  for (let i = 1; i < data.length; i++) {
    const status = data[i][6];

    if (status === 'completed') {
      checked++;
      const title = data[i][2];
      const fullText = data[i][4];
      const notes = data[i][7];

      if (!fullText) continue;

      const titleLower = title.toLowerCase();
      const contentLower = fullText.toLowerCase();

      // Check if title is non-crime but content has crime keywords
      const titleHasCrime = crimeKeywords.some(kw => titleLower.includes(kw));
      const contentHasCrime = crimeKeywords.some(kw => contentLower.includes(kw));

      if (!titleHasCrime && contentHasCrime) {
        contaminated++;

        // Check if it actually extracted crimes
        const extractedCount = notes.match(/Extracted (\d+) crime/);
        const crimeCount = extractedCount ? parseInt(extractedCount[1]) : 0;

        if (crimeCount > 0) {
          Logger.log(`Row ${i + 1}: ⚠️ CONTAMINATED`);
          Logger.log(`  Title: ${title}`);
          Logger.log(`  Extracted: ${crimeCount} crime(s)`);
          Logger.log(`  Issue: Non-crime title but content has crime keywords\n`);
        }
      }
    }
  }

  Logger.log('=== SCAN RESULTS ===');
  Logger.log(`Checked: ${checked} completed articles`);
  Logger.log(`Contaminated: ${contaminated} (${(contaminated/checked*100).toFixed(0)}%)`);
  Logger.log('\nContamination = Non-crime title but crime keywords in content');
  Logger.log('This indicates sidebar/related articles are being included.\n');

  if (contaminated > checked * 0.3) {
    Logger.log('🚨 CRITICAL: >30% contamination rate!');
    Logger.log('Article fetcher MUST be fixed before continuing.\n');
  } else if (contaminated > 0) {
    Logger.log('⚠️ WARNING: Some contamination detected.');
    Logger.log('Consider improving article content extraction.\n');
  } else {
    Logger.log('✅ No contamination detected.\n');
  }

  Logger.log('========================================');
}

/**
 * Helper: String similarity calculation
 */
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  str1 = str1.toLowerCase().trim();
  str2 = str2.toLowerCase().trim();

  if (str1 === str2) return 1;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  // Simple word overlap method (faster than Levenshtein for long texts)
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));

  let overlap = 0;
  words1.forEach(word => {
    if (words2.has(word)) overlap++;
  });

  const unionSize = words1.size + words2.size - overlap;
  return overlap / unionSize;
}

/**
 * Crime keywords list
 */
const crimeKeywords = [
  'murder', 'killed', 'shot', 'shooting', 'robbery', 'assault',
  'crime', 'police', 'death', 'arrest', 'victim', 'attack',
  'gang', 'gun', 'weapon', 'homicide', 'theft', 'burglary'
];

/**
 * RUN DEEP DIAGNOSTICS
 * Comprehensive analysis of article content issues
 */
function runDeepDiagnostics() {
  Logger.log('\n\n');
  Logger.log('╔════════════════════════════════════════╗');
  Logger.log('║      DEEP DIAGNOSTIC SUITE             ║');
  Logger.log('╚════════════════════════════════════════╝');
  Logger.log('\n');

  // Scan all articles first
  scanForSidebarContamination();
  Logger.log('\n\n');

  // Inspect the problematic article from earlier diagnostic
  Logger.log('Inspecting Row 3 (President: UN youth programme):\n');
  inspectArticleContent(3);
  Logger.log('\n\n');

  // Analyze extraction flow for Row 3
  analyzeExtractionFlow(3);
  Logger.log('\n\n');

  Logger.log('╔════════════════════════════════════════╗');
  Logger.log('║      DEEP DIAGNOSTICS COMPLETE         ║');
  Logger.log('╚════════════════════════════════════════╝\n');
}
