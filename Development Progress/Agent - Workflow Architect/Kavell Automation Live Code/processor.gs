/**
 * Main processing orchestrator
 * Processes articles from Raw Articles sheet and routes to Production or Review Queue
 */

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

/**
 * Process articles marked as "ready_for_processing"
 * This is the main function called by time-based trigger
 */
function processReadyArticles() {
    Logger.log('=== STARTING ARTICLE PROCESSING ===');

    const sheet = getActiveSheet(SHEET_NAMES.RAW_ARTICLES);
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      Logger.log('No articles to process');
      return;
    }

    const dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
    const data = dataRange.getValues();

    let articlesProcessed = 0;
    let totalCrimesExtracted = 0;
    let successCount = 0;
    let reviewCount = 0;
    let failedCount = 0;

    for (let i = 0; i < data.length && articlesProcessed < PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN; i++) {
      const row = data[i];
      const status = row[6]; // Column G

      if (status === 'ready_for_processing') {
        const rowNumber = i + 2;

        try {
          sheet.getRange(rowNumber, 7).setValue('processing');
          SpreadsheetApp.flush();

          const articleTitle = row[2];
          const articleUrl = row[3];
          const articleText = row[4];
          const publishedDate = row[5]; // ← IMPORTANT: Get publication date

          Logger.log(`Processing row ${rowNumber}: ${articleTitle.substring(0, 50)}...`);

          // Extract data using Gemini (now returns array of crimes)
          const extracted = extractCrimeData(articleText, articleTitle,articleUrl, publishedDate);

          // ← CRITICAL FIX: Check if crimes array exists and has items
          if (extracted.crimes && Array.isArray(extracted.crimes) &&extracted.crimes.length > 0) {

            Logger.log(`✅ Found ${extracted.crimes.length} crime(s) in thisarticle`);

            let highConfCrimes = 0;
            let lowConfCrimes = 0;

            // ← CRITICAL FIX: Loop through EACH crime separately
            extracted.crimes.forEach((crime, index) => {
              Logger.log(`  Processing crime ${index + 1}/${extracted.crimes.length}: ${crime.headline}`);

              // Use overall confidence for routing decision
              if (extracted.confidence >= PROCESSING_CONFIG.CONFIDENCE_THRESHOLD) {
                appendToProduction(crime);
                highConfCrimes++;
                Logger.log(`    ✅ Added to Production`);
              } else if (extracted.confidence > 0) {
                appendToReviewQueue(crime, extracted.confidence,extracted.ambiguities);
                lowConfCrimes++;
                Logger.log(`    ⚠️ Added to Review Queue`);
              }
            });

            totalCrimesExtracted += extracted.crimes.length;

            // Update article status
            if (highConfCrimes > 0) {
              sheet.getRange(rowNumber, 7).setValue('completed');
              sheet.getRange(rowNumber, 8).setValue(`✅ Extracted ${extracted.crimes.length} crime(s), confidence: ${extracted.confidence}`);
              successCount += highConfCrimes;
            } else if (lowConfCrimes > 0) {
              sheet.getRange(rowNumber, 7).setValue('needs_review');
              sheet.getRange(rowNumber, 8).setValue(`⚠️ ${extracted.crimes.length} crime(s) need review, confidence: ${extracted.confidence}`);
              reviewCount += lowConfCrimes;
            }

          } else {
            // No crimes found
            sheet.getRange(rowNumber, 7).setValue('skipped');
            sheet.getRange(rowNumber, 8).setValue(`Not a crime article: ${(extracted.ambiguities || []).join(', ')}`);
            Logger.log(`⏭️ Skipped (no crimes detected)`);
          }

          articlesProcessed++;
          Utilities.sleep(PROCESSING_CONFIG.RATE_LIMIT_DELAY);

        } catch (error) {
          Logger.log(`❌ Error processing row ${rowNumber}: ${error.message}`);
          sheet.getRange(rowNumber, 7).setValue('failed');
          sheet.getRange(rowNumber, 8).setValue(`Error: ${error.message.substring(0, 100)}`);
          failedCount++;
        }
      }
    }

    Logger.log('=== PROCESSING COMPLETE ===');
    Logger.log(`Articles processed: ${articlesProcessed}`);
    Logger.log(`Total crimes extracted: ${totalCrimesExtracted}`);
    Logger.log(`→ Production: ${successCount} crime(s)`);
    Logger.log(`→ Review Queue: ${reviewCount} crime(s)`);
    Logger.log(`→ Failed: ${failedCount} article(s)`);
    Logger.log('===========================');
  }

// ============================================================================
// PRODUCTION SHEET FUNCTIONS
// ============================================================================

/**
   * Append extracted data to production sheet
   * @param {Object} extracted - Crime data from Gemini
   */
  function appendToProduction(crime) {
    const prodSheet = getActiveSheet(SHEET_NAMES.PRODUCTION);

    // Check for duplicate before appending
    if (isDuplicateCrime(prodSheet, crime)) {
      Logger.log(`⚠️ Duplicate detected, skipping: ${crime.headline}`);
      return;
    }

    const fullAddress = `${crime.street || ''}, ${crime.area || ''}, Trinidad and Tobago`;
    const geocoded = geocodeAddress(fullAddress);

    prodSheet.appendRow([
      crime.crime_date || '',
      crime.headline || 'No headline',
      crime.crime_type || 'Other',
      crime.street || '',
      geocoded.plus_code || '',
      crime.area || '',
      'Trinidad',
      crime.source_url || '',
      geocoded.lat || '',
      geocoded.lng || ''
    ]);

    Logger.log(`✅ Added to production: ${crime.headline} 
  [${geocoded.plus_code || 'No Plus Code'}]`);
  }

/**
   * Append to review queue for manual verification
   * @param {Object} extracted - Crime data from Gemini
   */
  function appendToReviewQueue(crime, confidence, ambiguities) {
    const reviewSheet = getActiveSheet(SHEET_NAMES.REVIEW_QUEUE);

    const fullAddress = `${crime.street || ''}, ${crime.area || ''}, 
  Trinidad and Tobago`;
    const geocoded = geocodeAddress(fullAddress);

    reviewSheet.appendRow([
      crime.crime_date || '',
      crime.headline || 'Needs headline',
      crime.crime_type || 'Unknown',
      crime.street || '',
      geocoded.plus_code || '',
      crime.area || '',
      'Trinidad',
      crime.source_url || '',
      geocoded.lat || '',
      geocoded.lng || '',
      confidence,
      (ambiguities || []).join('; '),
      'pending',
      ''
    ]);

    Logger.log(`⚠️ Added to review queue: ${crime.headline}`);
  }

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Check for duplicate crimes (fuzzy matching)
 * @param {Sheet} sheet - Production or review sheet
 * @param {Object} extracted - Crime data to check
 * @returns {boolean} True if duplicate found
 */
function isDuplicateCrime(sheet, crime) {
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      return false; // Empty sheet
    }

    const dataRange = sheet.getRange(2, 1, lastRow - 1, 10);
    const data = dataRange.getValues();

    for (let row of data) {
      const existingDate = row[0];
      const existingHeadline = row[1];
      const existingUrl = row[7];

      // ← CHANGED: Only duplicate if URL AND headline match
      // (Not just URL, since multi-crime articles share URLs)

      // Exact URL + headline match
      if (existingUrl === crime.source_url && existingHeadline === crime.headline) {
        Logger.log('Duplicate found: Exact URL + headline match');
        return true;
      }

      // Fuzzy match: Same URL + very similar headline
      if (existingUrl === crime.source_url) {
        const similarity = calculateSimilarity(existingHeadline,crime.headline);
        if (similarity > 0.9) { // 90% similar headlines
          Logger.log(`Duplicate found: Same URL + ${(similarity * 100).toFixed(0)}% similar headline`);
          return true;
        }
      }

      // Fuzzy match on date + headline (different URL)
      if (existingDate && crime.crime_date) {
        const existingDateStr = Utilities.formatDate(new Date(existingDate),Session.getScriptTimeZone(), 'yyyy-MM-dd');

        if (existingDateStr === crime.crime_date) {
          const similarity = calculateSimilarity(existingHeadline,crime.headline);
          if (similarity > 0.8) {
            Logger.log(`Duplicate found: Same date + ${(similarity * 100).toFixed(0)}% similar headline`);
            return true;
          }
        }
      }
    }

    return false;
  }

/**
 * Simple string similarity (Levenshtein-based)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score 0-1
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
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
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// ============================================================================
// TESTING FUNCTION
// ============================================================================

/**
 * Test the full processing pipeline with existing data
 * Run this manually to test end-to-end
 */
function testProcessingPipeline() {
  Logger.log('=== TESTING PROCESSING PIPELINE ===');

  // First verify configuration
  logConfigStatus();
  verifyApiKey();

  // Test with limit of 1 article
  const originalLimit = PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN;
  PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN = 1;

  try {
    processReadyArticles();
  } finally {
    // Restore original limit
    PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN = originalLimit;
  }

  Logger.log('=== TEST COMPLETE ===');
}

// ============================================================================
// ARCHIVING FUNCTION
// ============================================================================

function archiveProcessedArticles() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
    const archiveSheet = getOrCreateArchiveSheet();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const data = sheet.getDataRange().getValues();
    const toArchive = [];
    const toKeep = [data[0]]; // Headers

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const timestamp = new Date(row[0]);
      const status = row[6]; // Column G: Status

      // Archive if: old AND (completed or skipped)
      const shouldArchive = timestamp < cutoffDate &&
                           (status === 'completed' || status === 'skipped');

      if (shouldArchive) {
        toArchive.push(row);
      } else {
        toKeep.push(row);
      }
    }

    // Append to archive
    if (toArchive.length > 0) {
      archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1,toArchive.length, 8)
        .setValues(toArchive);
    }

    // Rewrite main sheet
    sheet.clear();
    sheet.getRange(1, 1, toKeep.length, 8).setValues(toKeep);

    Logger.log(`✅ Archived: ${toArchive.length} articles (>90 days, completed/skipped)`);
    Logger.log(`✅ Kept: ${toKeep.length - 1} articles (recent or pending review)`);

    // Send email notification
    GmailApp.sendEmail(
      NOTIFICATION_EMAIL,
      '📦 Crime Hotspots - Quarterly Archive Complete',
      `Archived ${toArchive.length} old articles.\nKept ${toKeep.length - 1}recent articles.`
    );
  }