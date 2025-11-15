/**
 * DIAGNOSTIC TOOLS - Identify Data Quality Issues
 *
 * Run these functions to diagnose why wrong URLs, duplicates,
 * and non-crimes are appearing in Production
 *
 * @version 1.0
 * @date 2025-11-09
 */

/**
 * DIAGNOSTIC 1: Trace a specific crime back to its source
 * Use this to see the complete data flow for one entry
 *
 * @param {number} productionRowNumber - Row number in Production sheet (e.g., 2 for first data row)
 */
function traceCrimeToSource(productionRowNumber) {
  Logger.log('========================================');
  Logger.log('TRACING CRIME TO SOURCE');
  Logger.log('========================================\n');

  const prodSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Production');
  const rawSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');

  // Get the crime entry
  const prodData = prodSheet.getRange(productionRowNumber, 1, 1, 10).getValues()[0];

  Logger.log('PRODUCTION ENTRY:');
  Logger.log(`  Date: ${prodData[0]}`);
  Logger.log(`  Headline: ${prodData[1]}`);
  Logger.log(`  Crime Type: ${prodData[2]}`);
  Logger.log(`  Street: ${prodData[3]}`);
  Logger.log(`  Area: ${prodData[5]}`);
  Logger.log(`  URL: ${prodData[7]}`);
  Logger.log(`  Lat/Lng: ${prodData[8]}, ${prodData[9]}\n`);

  const crimeUrl = prodData[7];

  // Find the source article in Raw Articles
  const rawData = rawSheet.getDataRange().getValues();
  let sourceFound = false;

  for (let i = 1; i < rawData.length; i++) {
    const rawUrl = rawData[i][3]; // Column D

    if (rawUrl === crimeUrl) {
      sourceFound = true;
      Logger.log(`✅ FOUND SOURCE ARTICLE (Row ${i + 1}):`);
      Logger.log(`  Timestamp: ${rawData[i][0]}`);
      Logger.log(`  Source: ${rawData[i][1]}`);
      Logger.log(`  Title: ${rawData[i][2]}`);
      Logger.log(`  URL: ${rawData[i][3]}`);
      Logger.log(`  Published: ${rawData[i][5]}`);
      Logger.log(`  Status: ${rawData[i][6]}`);
      Logger.log(`  Notes: ${rawData[i][7]}`);
      Logger.log(`  Full Text Length: ${rawData[i][4] ? rawData[i][4].length : 0} chars\n`);

      // Check if the title matches
      if (rawData[i][2].toLowerCase().includes(prodData[1].toLowerCase().substring(0, 20))) {
        Logger.log('✅ Headline matches article title');
      } else {
        Logger.log('⚠️ WARNING: Headline does NOT match article title!');
        Logger.log(`  Production headline: ${prodData[1]}`);
        Logger.log(`  Raw article title: ${rawData[i][2]}`);
      }

      break;
    }
  }

  if (!sourceFound) {
    Logger.log('❌ SOURCE ARTICLE NOT FOUND IN RAW ARTICLES SHEET');
    Logger.log('This suggests the URL was incorrectly set during extraction.\n');
  }

  Logger.log('========================================');
}

/**
 * DIAGNOSTIC 2: Check Raw Articles sheet for data integrity
 * Identifies articles with issues that would cause extraction problems
 */
function checkRawArticlesIntegrity() {
  Logger.log('========================================');
  Logger.log('RAW ARTICLES INTEGRITY CHECK');
  Logger.log('========================================\n');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
  const data = sheet.getDataRange().getValues();

  let emptyUrlCount = 0;
  let emptyTextCount = 0;
  let readyForProcessing = 0;
  let processingCount = 0;
  let completedCount = 0;
  let failedCount = 0;

  const urlDuplicates = {};

  Logger.log(`Total articles: ${data.length - 1}\n`);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const url = row[3];
    const fullText = row[4];
    const status = row[6];

    // Check for empty URLs
    if (!url || url.trim() === '') {
      emptyUrlCount++;
      Logger.log(`Row ${i + 1}: ❌ Empty URL`);
    }

    // Check for empty full text
    if (!fullText || fullText.trim().length < 100) {
      emptyTextCount++;
    }

    // Count by status
    if (status === 'ready_for_processing') readyForProcessing++;
    else if (status === 'processing') processingCount++;
    else if (status === 'completed') completedCount++;
    else if (status === 'failed') failedCount++;

    // Track URL duplicates
    if (url) {
      urlDuplicates[url] = (urlDuplicates[url] || 0) + 1;
    }
  }

  Logger.log('\n--- SUMMARY ---');
  Logger.log(`Empty URLs: ${emptyUrlCount}`);
  Logger.log(`Empty/Short Text: ${emptyTextCount}`);
  Logger.log(`\nStatus Breakdown:`);
  Logger.log(`  Ready for processing: ${readyForProcessing}`);
  Logger.log(`  Currently processing: ${processingCount}`);
  Logger.log(`  Completed: ${completedCount}`);
  Logger.log(`  Failed: ${failedCount}`);

  // Show duplicate URLs
  const duplicateUrls = Object.entries(urlDuplicates).filter(([url, count]) => count > 1);
  if (duplicateUrls.length > 0) {
    Logger.log(`\n⚠️ Duplicate URLs found: ${duplicateUrls.length}`);
    duplicateUrls.slice(0, 5).forEach(([url, count]) => {
      Logger.log(`  ${count}x: ${url.substring(0, 60)}...`);
    });
  }

  Logger.log('\n========================================');
}

/**
 * DIAGNOSTIC 3: Check for URL mismatches in Production
 * Identifies entries where the headline doesn't match the article URL
 */
function checkUrlMismatches() {
  Logger.log('========================================');
  Logger.log('CHECKING FOR URL MISMATCHES');
  Logger.log('========================================\n');

  const prodSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Production');
  const rawSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');

  const prodData = prodSheet.getDataRange().getValues();
  const rawData = rawSheet.getDataRange().getValues();

  // Build index of Raw Articles by URL
  const rawIndex = {};
  for (let i = 1; i < rawData.length; i++) {
    const url = rawData[i][3];
    const title = rawData[i][2];
    if (url) {
      rawIndex[url] = title;
    }
  }

  let mismatchCount = 0;
  const mismatches = [];

  for (let i = 1; i < prodData.length; i++) {
    const headline = prodData[i][1];
    const url = prodData[i][7];

    if (!url) continue;

    const sourceTitle = rawIndex[url];
    if (sourceTitle) {
      // Check if headline contains key words from source title
      const headlineWords = headline.toLowerCase().split(' ').filter(w => w.length > 3);
      const titleWords = sourceTitle.toLowerCase().split(' ').filter(w => w.length > 3);

      // If there's no word overlap, it's likely a mismatch
      const overlap = headlineWords.filter(w => titleWords.includes(w));

      if (overlap.length === 0) {
        mismatchCount++;
        mismatches.push({
          row: i + 1,
          headline: headline,
          sourceTitle: sourceTitle,
          url: url.substring(0, 60)
        });
      }
    } else {
      Logger.log(`Row ${i + 1}: ⚠️ URL not found in Raw Articles: ${url.substring(0, 60)}...`);
    }
  }

  if (mismatchCount > 0) {
    Logger.log(`\n❌ Found ${mismatchCount} likely URL mismatches:\n`);
    mismatches.slice(0, 10).forEach(m => {
      Logger.log(`Row ${m.row}:`);
      Logger.log(`  Production headline: ${m.headline}`);
      Logger.log(`  Source article title: ${m.sourceTitle}`);
      Logger.log(`  URL: ${m.url}...\n`);
    });

    if (mismatches.length > 10) {
      Logger.log(`... and ${mismatches.length - 10} more\n`);
    }
  } else {
    Logger.log('✅ No obvious URL mismatches found\n');
  }

  Logger.log('========================================');
}

/**
 * DIAGNOSTIC 4: Identify non-crime articles in Production
 * Checks for keywords that indicate non-crime content
 */
function findNonCrimeArticles() {
  Logger.log('========================================');
  Logger.log('FINDING NON-CRIME ARTICLES IN PRODUCTION');
  Logger.log('========================================\n');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Production');
  const data = sheet.getDataRange().getValues();

  // Keywords that suggest non-crime content
  const nonCrimeKeywords = [
    'government announce', 'minister', 'policy', 'budget', 'election',
    'celebrate', 'festival', 'award', 'ceremony', 'project launch',
    'solar power', 'funds', 'investment', 'development', 'education',
    'traffic', 'accident', 'injured crossing', 'car crash', 'vehicle',
    'airstrike', 'military', 'war', 'foreign', 'international',
    'weather', 'flood', 'hurricane', 'storm'
  ];

  const suspects = [];

  for (let i = 1; i < data.length; i++) {
    const headline = data[i][1].toLowerCase();
    const crimeType = data[i][2];
    const url = data[i][7];

    // Check for non-crime keywords
    const matchedKeywords = nonCrimeKeywords.filter(kw => headline.includes(kw));

    if (matchedKeywords.length > 0) {
      suspects.push({
        row: i + 1,
        headline: data[i][1],
        crimeType: crimeType,
        keywords: matchedKeywords,
        url: url.substring(0, 50)
      });
    }

    // Also flag "Other" crime type as potentially non-crime
    if (crimeType === 'Other' && !headline.includes('death') && !headline.includes('arrest')) {
      suspects.push({
        row: i + 1,
        headline: data[i][1],
        crimeType: 'Other (suspicious)',
        keywords: ['Crime type is "Other"'],
        url: url.substring(0, 50)
      });
    }
  }

  if (suspects.length > 0) {
    Logger.log(`⚠️ Found ${suspects.length} potential non-crime entries:\n`);
    suspects.forEach(s => {
      Logger.log(`Row ${s.row} (${s.crimeType}):`);
      Logger.log(`  ${s.headline}`);
      Logger.log(`  Flags: ${s.keywords.join(', ')}`);
      Logger.log(`  URL: ${s.url}...\n`);
    });
  } else {
    Logger.log('✅ No obvious non-crime articles found\n');
  }

  Logger.log('========================================');
}

/**
 * DIAGNOSTIC 5: Test extraction with a specific Raw Article
 * Re-runs Gemini extraction on a specific article to see what it produces
 *
 * @param {number} rawRowNumber - Row number in Raw Articles sheet
 */
function testExtractionForArticle(rawRowNumber) {
  Logger.log('========================================');
  Logger.log('TEST EXTRACTION FOR SPECIFIC ARTICLE');
  Logger.log('========================================\n');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
  const data = sheet.getRange(rawRowNumber, 1, 1, 8).getValues()[0];

  const articleTitle = data[2];
  const articleUrl = data[3];
  const articleText = data[4];
  const publishedDate = data[5];

  Logger.log(`Testing Row ${rawRowNumber}:`);
  Logger.log(`  Title: ${articleTitle}`);
  Logger.log(`  URL: ${articleUrl}`);
  Logger.log(`  Published: ${publishedDate}`);
  Logger.log(`  Text Length: ${articleText ? articleText.length : 0} chars\n`);

  if (!articleText || articleText.length < 100) {
    Logger.log('❌ Article text is empty or too short. Cannot extract.\n');
    Logger.log('Run fetchPendingArticleText() first to populate Column E.');
    return;
  }

  try {
    Logger.log('Calling Gemini API...\n');
    const result = extractCrimeData(articleText, articleTitle, articleUrl, publishedDate);

    Logger.log('=== EXTRACTION RESULT ===');
    Logger.log(JSON.stringify(result, null, 2));
    Logger.log('=========================\n');

    if (result.crimes && result.crimes.length > 0) {
      Logger.log(`✅ Extracted ${result.crimes.length} crime(s):`);
      result.crimes.forEach((crime, idx) => {
        Logger.log(`\nCrime ${idx + 1}:`);
        Logger.log(`  Date: ${crime.crime_date}`);
        Logger.log(`  Type: ${crime.crime_type}`);
        Logger.log(`  Area: ${crime.area}`);
        Logger.log(`  Headline: ${crime.headline}`);
        Logger.log(`  Source URL: ${crime.source_url}`);
        Logger.log(`  URL Match: ${crime.source_url === articleUrl ? '✅ CORRECT' : '❌ WRONG'}`);
      });
    } else {
      Logger.log('⚠️ No crimes detected');
    }

    Logger.log(`\nConfidence: ${result.confidence}`);
    if (result.ambiguities && result.ambiguities.length > 0) {
      Logger.log(`Ambiguities: ${result.ambiguities.join('; ')}`);
    }

  } catch (error) {
    Logger.log(`❌ Extraction failed: ${error.message}`);
  }

  Logger.log('\n========================================');
}

/**
 * RUN ALL DIAGNOSTICS
 * Comprehensive check of the entire system
 */
function runAllDiagnostics() {
  Logger.log('\n\n');
  Logger.log('╔════════════════════════════════════════╗');
  Logger.log('║   COMPREHENSIVE DIAGNOSTIC SUITE       ║');
  Logger.log('╚════════════════════════════════════════╝');
  Logger.log('\n');

  checkRawArticlesIntegrity();
  Logger.log('\n\n');

  checkUrlMismatches();
  Logger.log('\n\n');

  findNonCrimeArticles();
  Logger.log('\n\n');

  // Check first 3 production entries
  Logger.log('Tracing first 3 production entries to source:\n');
  for (let i = 2; i <= 4; i++) {
    traceCrimeToSource(i);
    Logger.log('\n');
  }

  Logger.log('\n╔════════════════════════════════════════╗');
  Logger.log('║       DIAGNOSTICS COMPLETE             ║');
  Logger.log('╚════════════════════════════════════════╝\n');
}
