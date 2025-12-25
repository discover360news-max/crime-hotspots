/**
 * Test Pre-Filter System
 *
 * Test functions to validate keyword scoring and filtering logic
 * WITHOUT modifying your Raw Articles sheet
 *
 * Run these tests BEFORE enabling the pre-filter in production
 *
 * Last Updated: 2025-12-08
 */

// ============================================================================
// TEST ON EXISTING RAW ARTICLES
// ============================================================================

/**
 * Test pre-filter on existing Raw Articles (READ-ONLY)
 * Shows what WOULD happen without changing anything
 *
 * This is your main test function - run this first!
 */
function testPreFilterOnRawArticles() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   PRE-FILTER TEST (READ-ONLY)');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');

  const sheet = getActiveSheet(SHEET_NAMES.RAW_ARTICLES);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log('❌ No articles found in Raw Articles sheet');
    return;
  }

  const dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
  const data = dataRange.getValues();

  // Stats tracking
  const stats = {
    total: 0,
    wouldPass: 0,
    wouldFilter: 0,
    lowScore: 0,
    duplicate: 0,
    negativeScore: 0,
    highScore: 0,
    mediumScore: 0
  };

  const sampleResults = [];

  Logger.log(`📊 Testing ${data.length} articles from Raw Articles sheet...`);
  Logger.log('');

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const status = row[6]; // Column G

    // Only test articles with fetched text (what preFilter would process)
    if (status === 'text_fetched' || status === 'ready_for_processing' || status === 'completed' || status === 'skipped') {
      stats.total++;
      const rowNumber = i + 2;

      const article = {
        title: row[2],
        url: row[3],
        fullText: row[4],
        publishedDate: row[5],
        currentStatus: status
      };

      // Run scoring
      const scoring = scoreArticle(article.title, article.fullText || article.title);

      // Check duplicates
      const dupCheck = checkForRawArticleDuplicate(article.title, article.url, article.publishedDate);

      // Determine outcome
      let decision = '';
      let reason = '';

      if (scoring.score < 0) {
        decision = '🚫 FILTER';
        reason = 'Negative score (court/non-crime)';
        stats.wouldFilter++;
        stats.negativeScore++;
      } else if (scoring.score < PREFILTER_CONFIG.MIN_SCORE_TO_PROCESS) {
        decision = '🚫 FILTER';
        reason = `Low score (${scoring.score})`;
        stats.wouldFilter++;
        stats.lowScore++;
      } else if (dupCheck.isDuplicate) {
        decision = '🚫 FILTER';
        reason = `Duplicate in ${dupCheck.matchedIn}`;
        stats.wouldFilter++;
        stats.duplicate++;
      } else {
        decision = '✅ PASS';
        reason = `Score: ${scoring.score}`;
        stats.wouldPass++;

        if (scoring.score >= 15) {
          stats.highScore++;
        } else {
          stats.mediumScore++;
        }
      }

      // Collect sample results (first 10)
      if (sampleResults.length < 10) {
        sampleResults.push({
          rowNumber: rowNumber,
          title: article.title.substring(0, 60),
          score: scoring.score,
          keywords: scoring.matchedKeywords.length,
          decision: decision,
          reason: reason,
          currentStatus: article.currentStatus
        });
      }
    }
  }

  // Display results
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   TEST RESULTS SUMMARY');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');
  Logger.log(`Total articles tested: ${stats.total}`);
  Logger.log('');
  Logger.log(`✅ Would PASS (send to Gemini): ${stats.wouldPass} (${Math.round(stats.wouldPass/stats.total*100)}%)`);
  Logger.log(`   - High confidence (score >= 15): ${stats.highScore}`);
  Logger.log(`   - Medium confidence (score 10-14): ${stats.mediumScore}`);
  Logger.log('');
  Logger.log(`🚫 Would FILTER (skip Gemini): ${stats.wouldFilter} (${Math.round(stats.wouldFilter/stats.total*100)}%)`);
  Logger.log(`   - Low score: ${stats.lowScore}`);
  Logger.log(`   - Duplicates: ${stats.duplicate}`);
  Logger.log(`   - Negative score: ${stats.negativeScore}`);
  Logger.log('');

  // Calculate API call savings
  const apiCallsBefore = stats.total;
  const apiCallsAfter = stats.wouldPass;
  const savings = apiCallsBefore - apiCallsAfter;
  const savingsPercent = Math.round(savings / apiCallsBefore * 100);

  Logger.log('💰 API CALL SAVINGS:');
  Logger.log(`   Before pre-filter: ${apiCallsBefore} Gemini calls`);
  Logger.log(`   After pre-filter: ${apiCallsAfter} Gemini calls`);
  Logger.log(`   SAVED: ${savings} calls (${savingsPercent}% reduction)`);
  Logger.log('');

  // Show sample results
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   SAMPLE RESULTS (First 10 Articles)');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');

  sampleResults.forEach((result, index) => {
    Logger.log(`${index + 1}. Row ${result.rowNumber} [${result.decision}]`);
    Logger.log(`   Title: ${result.title}...`);
    Logger.log(`   Score: ${result.score} (${result.keywords} keywords)`);
    Logger.log(`   Reason: ${result.reason}`);
    Logger.log(`   Current Status: ${result.currentStatus}`);
    Logger.log('');
  });

  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   RECOMMENDATIONS');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');

  if (savingsPercent < 20) {
    Logger.log('⚠️ Low savings detected. Consider:');
    Logger.log('   - Adding more exclude keywords (court, sports, etc.)');
    Logger.log('   - Increasing MIN_SCORE_TO_PROCESS threshold');
  } else if (savingsPercent > 50) {
    Logger.log('⚠️ High filter rate. Verify not filtering real crimes:');
    Logger.log('   - Review "Filtered Out Articles" sheet');
    Logger.log('   - Consider lowering MIN_SCORE_TO_PROCESS');
    Logger.log('   - Add missing strong crime keywords');
  } else {
    Logger.log('✅ Filter rate looks good! (20-50% filtered)');
    Logger.log('   - Review a few filtered articles to confirm');
    Logger.log('   - If satisfied, enable preFilterArticles() in workflow');
  }

  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('Test complete! No changes made to your data.');
  Logger.log('═══════════════════════════════════════════════');
}

// ============================================================================
// TEST INDIVIDUAL HEADLINES
// ============================================================================

/**
 * Quick test on sample headlines
 * Use this to validate specific keywords
 */
function testSampleHeadlines() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   TESTING SAMPLE HEADLINES');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');

  const testCases = [
    {
      title: 'Man shot dead in Laventille',
      expectedResult: 'PASS',
      notes: 'Clear crime - should score high'
    },
    {
      title: 'Murder suspect convicted of 2022 killing',
      expectedResult: 'FILTER',
      notes: 'Court verdict - negative score'
    },
    {
      title: 'Prime Minister discusses crime plan',
      expectedResult: 'FILTER',
      notes: 'Not actual crime - low score'
    },
    {
      title: 'Woman chopped in Diego Martin home invasion',
      expectedResult: 'PASS',
      notes: 'Multiple strong keywords - very high score'
    },
    {
      title: 'Police seize drugs and firearms in raid',
      expectedResult: 'PASS',
      notes: 'Crime enforcement - should pass'
    },
    {
      title: 'Cricket match ends in brawl',
      expectedResult: 'FILTER',
      notes: 'Sports - should filter'
    },
    {
      title: 'Body found in bushes, murder suspected',
      expectedResult: 'PASS',
      notes: 'Clear murder indication'
    }
  ];

  testCases.forEach((testCase, index) => {
    Logger.log(`${index + 1}. "${testCase.title}"`);
    Logger.log(`   Expected: ${testCase.expectedResult}`);
    Logger.log(`   Notes: ${testCase.notes}`);

    const result = scoreArticle(testCase.title, '');

    const actualResult = result.score >= PREFILTER_CONFIG.MIN_SCORE_TO_PROCESS ? 'PASS' : 'FILTER';

    Logger.log(`   Score: ${result.score}`);
    Logger.log(`   Keywords matched: ${result.matchedKeywords.length}`);
    Logger.log(`   Actual Result: ${actualResult} ${actualResult === testCase.expectedResult ? '✅' : '❌'}`);

    if (result.matchedKeywords.length > 0) {
      Logger.log(`   Matched: ${result.matchedKeywords.map(kw => `${kw.keyword}(${kw.weight})`).join(', ')}`);
    }

    Logger.log('');
  });

  Logger.log('═══════════════════════════════════════════════');
}

// ============================================================================
// DUPLICATE DETECTION TEST
// ============================================================================

/**
 * Test duplicate detection on Production sheet
 */
function testDuplicateDetection() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   TESTING DUPLICATE DETECTION');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');

  // Test with a known headline from Production
  const prodSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PRODUCTION);

  if (!prodSheet || prodSheet.getLastRow() < 2) {
    Logger.log('❌ Production sheet is empty, cannot test duplicates');
    return;
  }

  // Get first 3 headlines from Production
  const prodData = prodSheet.getRange(2, 1, Math.min(3, prodSheet.getLastRow() - 1), 11).getValues();

  Logger.log('Testing exact matches:');
  Logger.log('');

  prodData.forEach((row, index) => {
    const headline = row[1]; // Column B
    const url = row[7];      // Column H

    Logger.log(`${index + 1}. Testing: "${headline.substring(0, 60)}..."`);

    // Test exact match
    const dupCheck = checkForRawArticleDuplicate(headline, url, new Date());

    if (dupCheck.isDuplicate) {
      Logger.log(`   ✅ Correctly identified as duplicate`);
      Logger.log(`   Matched in: ${dupCheck.matchedIn}`);
      Logger.log(`   Similarity: ${dupCheck.similarity}%`);
    } else {
      Logger.log(`   ❌ ERROR: Should have been detected as duplicate!`);
    }
    Logger.log('');
  });

  // Test similarity matching
  Logger.log('Testing fuzzy matching:');
  Logger.log('');

  if (prodData.length > 0) {
    const originalHeadline = prodData[0][1].toString();
    const modifiedHeadline = originalHeadline.replace(/\d+/g, 'XX'); // Replace numbers

    Logger.log(`Original: "${originalHeadline}"`);
    Logger.log(`Modified: "${modifiedHeadline}"`);

    const similarity = calculateSimilarity(originalHeadline, modifiedHeadline);
    Logger.log(`Similarity: ${similarity}%`);

    const dupCheck = checkForRawArticleDuplicate(modifiedHeadline, 'http://fake.url', new Date());
    if (dupCheck.isDuplicate) {
      Logger.log(`✅ Correctly caught similar headline (${dupCheck.similarity}% match)`);
    } else {
      Logger.log(`   Similarity: ${similarity}% (threshold: ${PREFILTER_CONFIG.DUPLICATE_SIMILARITY_THRESHOLD}%)`);
      if (similarity < PREFILTER_CONFIG.DUPLICATE_SIMILARITY_THRESHOLD) {
        Logger.log(`   ℹ️ Below threshold, not flagged as duplicate (expected)`);
      }
    }
  }

  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
}

// ============================================================================
// KEYWORD COVERAGE TEST
// ============================================================================

/**
 * Analyze keyword coverage on your actual data
 * Shows which keywords are being used and which aren't
 */
function analyzeKeywordCoverage() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   KEYWORD COVERAGE ANALYSIS');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');

  const keywords = loadKeywords();
  const keywordUsage = {};

  // Initialize usage counts
  keywords.forEach(kw => {
    keywordUsage[kw.keyword] = {
      count: 0,
      weight: kw.weight,
      category: kw.category
    };
  });

  // Scan Raw Articles
  const sheet = getActiveSheet(SHEET_NAMES.RAW_ARTICLES);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const title = (data[i][2] || '').toString().toLowerCase();
    const text = (data[i][4] || '').toString().toLowerCase();
    const content = `${title} ${text}`;

    keywords.forEach(kw => {
      if (content.includes(kw.keyword)) {
        keywordUsage[kw.keyword].count++;
      }
    });
  }

  // Sort by usage count
  const sorted = Object.entries(keywordUsage).sort((a, b) => b[1].count - a[1].count);

  Logger.log('TOP 20 MOST USED KEYWORDS:');
  Logger.log('');
  sorted.slice(0, 20).forEach((entry, index) => {
    const [keyword, data] = entry;
    Logger.log(`${index + 1}. "${keyword}" - Used ${data.count} times [${data.category}, weight: ${data.weight}]`);
  });

  Logger.log('');
  Logger.log('UNUSED KEYWORDS (consider removing):');
  Logger.log('');
  const unused = sorted.filter(entry => entry[1].count === 0);
  unused.forEach((entry, index) => {
    const [keyword, data] = entry;
    Logger.log(`${index + 1}. "${keyword}" [${data.category}, weight: ${data.weight}]`);
  });

  Logger.log('');
  Logger.log(`Total keywords: ${keywords.length}`);
  Logger.log(`Used: ${keywords.length - unused.length}`);
  Logger.log(`Unused: ${unused.length}`);
  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
}

// ============================================================================
// MANUAL REVIEW HELPER
// ============================================================================

/**
 * Show 20 random filtered articles for manual review
 * Use this to verify the filter isn't removing real crimes
 */
function showFilteredArticlesForReview() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   FILTERED ARTICLES - MANUAL REVIEW');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');
  Logger.log('Review these headlines and confirm they should be filtered:');
  Logger.log('');

  const sheet = getActiveSheet(SHEET_NAMES.RAW_ARTICLES);
  const data = sheet.getDataRange().getValues();

  const filteredArticles = [];

  // Collect all articles that would be filtered
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[6];

    if (status === 'text_fetched' || status === 'ready_for_processing' || status === 'completed' || status === 'skipped') {
      const article = {
        rowNumber: i + 2,
        title: row[2],
        url: row[3],
        fullText: row[4],
        publishedDate: row[5]
      };

      const scoring = scoreArticle(article.title, article.fullText || article.title);
      const dupCheck = checkForRawArticleDuplicate(article.title, article.url, article.publishedDate);

      // Determine if would be filtered
      let wouldFilter = false;
      let reason = '';

      if (scoring.score < 0) {
        wouldFilter = true;
        reason = `Negative score (${scoring.score}) - ${scoring.reason}`;
      } else if (scoring.score < PREFILTER_CONFIG.MIN_SCORE_TO_PROCESS) {
        wouldFilter = true;
        reason = `Low score (${scoring.score})`;
      } else if (dupCheck.isDuplicate) {
        wouldFilter = true;
        reason = `Duplicate in ${dupCheck.matchedIn}`;
      }

      if (wouldFilter) {
        filteredArticles.push({
          ...article,
          score: scoring.score,
          reason: reason,
          keywords: scoring.matchedKeywords
        });
      }
    }
  }

  // Shuffle and take 20
  const shuffled = filteredArticles.sort(() => 0.5 - Math.random());
  const sample = shuffled.slice(0, 20);

  Logger.log(`Showing 20 of ${filteredArticles.length} filtered articles:`);
  Logger.log('');

  sample.forEach((article, index) => {
    Logger.log(`${index + 1}. Row ${article.rowNumber}`);
    Logger.log(`   Title: ${article.title}`);
    Logger.log(`   Reason: ${article.reason}`);
    Logger.log(`   Score: ${article.score}`);
    if (article.keywords.length > 0) {
      Logger.log(`   Keywords: ${article.keywords.map(kw => `${kw.keyword}(${kw.weight})`).join(', ')}`);
    }
    Logger.log('');
  });

  Logger.log('═══════════════════════════════════════════════');
  Logger.log('REVIEW CHECKLIST:');
  Logger.log('');
  Logger.log('For each headline above, ask:');
  Logger.log('1. Is this an actual crime report? (murder, robbery, assault, etc.)');
  Logger.log('2. Or is it court news, sports, politics, opinion?');
  Logger.log('');
  Logger.log('If you find REAL CRIMES in this list:');
  Logger.log('→ Note the Row Number');
  Logger.log('→ Check which keywords it has');
  Logger.log('→ We need to add missing crime keywords');
  Logger.log('');
  Logger.log('If all look correctly filtered:');
  Logger.log('→ System is working well!');
  Logger.log('→ Ready to create monitoring sheets');
  Logger.log('═══════════════════════════════════════════════');
}
