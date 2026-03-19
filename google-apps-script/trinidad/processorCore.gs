/**
 * Main processing orchestrator
 * Processes articles from Raw Articles sheet and routes to Production or Review Queue
 */

// ============================================================================
// SHARED HELPERS — header-name mapping, safe against column reordering
// ============================================================================

/**
 * Build a header → 0-based column index map from a sheet's first row.
 * All reads/writes go through this — never use positional indices directly.
 * @param {Sheet} sheet
 * @returns {Object} e.g. { 'headline': 0, 'date': 6, ... }
 */
function buildColMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => {
    if (h) map[h.toString().toLowerCase().trim()] = i;
  });
  return map;
}

/**
 * Append a row to a sheet by matching field names to column headers.
 * Unknown keys are silently ignored — safe against column additions.
 * @param {Sheet} sheet
 * @param {Object} fieldValues - { 'Exact Header Name': value, ... }
 */
function appendRowByHeaders(sheet, fieldValues) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = new Array(headers.length).fill('');
  headers.forEach((h, i) => {
    if (!h) return;
    const key = h.toString().trim();
    if (key in fieldValues) {
      const val = fieldValues[key];
      row[i] = (val !== undefined && val !== null) ? val : '';
    }
  });
  sheet.appendRow(row);
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

/**
 * Process articles marked as "ready_for_processing"
 * This is the main function called by time-based trigger
 */
function processReadyArticles() {
    Logger.log('=== STARTING ARTICLE PROCESSING ===');

    const startTime = new Date().getTime();

    const sheet = getActiveSheet(SHEET_NAMES.RAW_ARTICLES);
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      Logger.log('No articles to process');
      return;
    }

    // Build column map from headers — safe against Raw Articles column reordering
    const rawColMap = buildColMap(sheet);
    const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const data = dataRange.getValues();

    let articlesProcessed = 0;
    let totalCrimesExtracted = 0;
    let successCount = 0;
    let reviewCount = 0;
    let failedCount = 0;
    let timeoutReached = false;

    // Pre-load Production + Archive sheet data once to avoid 3 full sheet reads per crime
    // in appendToProduction(). Cuts per-crime write time from ~80s → <5s.
    const prodSheetForCache = getActiveSheet(SHEET_NAMES.PRODUCTION);
    const prodCacheLastRow = prodSheetForCache.getLastRow();
    const prodColMap = buildColMap(prodSheetForCache);
    let cachedProdData = prodCacheLastRow >= 2
      ? prodSheetForCache.getRange(2, 1, prodCacheLastRow - 1, prodSheetForCache.getLastColumn()).getValues()
      : [];

    let cachedArchiveData = [];
    let archiveColMap = {};
    try {
      const archiveSheetForCache = getActiveSheet(SHEET_NAMES.PRODUCTION_ARCHIVE);
      const archiveCacheLastRow = archiveSheetForCache.getLastRow();
      archiveColMap = buildColMap(archiveSheetForCache);
      if (archiveCacheLastRow >= 2) {
        cachedArchiveData = archiveSheetForCache.getRange(2, 1, archiveCacheLastRow - 1, archiveSheetForCache.getLastColumn()).getValues();
      }
    } catch (e) {
      Logger.log('ℹ️ Production Archive not found for caching (may not exist yet)');
    }
    Logger.log(`📦 Cache loaded: ${cachedProdData.length} Production rows, ${cachedArchiveData.length} Archive rows`);

    for (let i = 0; i < data.length && articlesProcessed < PROCESSING_CONFIG.MAX_ARTICLES_PER_RUN; i++) {
      // ═══════════════════════════════════════════════════════════
      // CHECK EXECUTION TIME - Stop before hitting 6-minute limit
      // ═══════════════════════════════════════════════════════════
      const elapsedTime = new Date().getTime() - startTime;
      if (elapsedTime > PROCESSING_CONFIG.MAX_EXECUTION_TIME_MS) {
        Logger.log(`⏱️ Approaching execution time limit (${Math.round(elapsedTime/1000)}s elapsed)`);
        Logger.log(`⏹️ Stopping processing to avoid timeout. Processed ${articlesProcessed} articles.`);
        timeoutReached = true;
        break;
      }
      const row = data[i];
      const status = row[rawColMap['status']];

      if (status === 'ready_for_processing') {
        // ═══════════════════════════════════════════════════════════
        // SECOND TIME CHECK - Before starting article processing
        // Prevents timeout mid-processing (especially during slow Gemini API calls)
        // ═══════════════════════════════════════════════════════════
        const elapsedTimeBeforeArticle = new Date().getTime() - startTime;
        if (elapsedTimeBeforeArticle > PROCESSING_CONFIG.MAX_EXECUTION_TIME_MS) {
          Logger.log(`⏱️ Time limit reached before starting article ${i + 2} (${Math.round(elapsedTimeBeforeArticle/1000)}s elapsed)`);
          Logger.log(`⏹️ Stopping to avoid timeout. Processed ${articlesProcessed} articles.`);
          timeoutReached = true;
          break;
        }

        const rowNumber = i + 2;

        try {
          sheet.getRange(rowNumber, rawColMap['status'] + 1).setValue('processing');
          SpreadsheetApp.flush();

          const articleTitle = row[rawColMap['title']];
          const articleUrl = row[rawColMap['url']];
          const articleText = row[rawColMap['full text']];
          const publishedDate = row[rawColMap['publish date']]; // ← IMPORTANT: Get publication date
          const publishDateMissing = !publishedDate;
          if (publishDateMissing) {
            Logger.log(`🚨 MISSING PUBLISH DATE for row ${rowNumber} — "${articleTitle.substring(0, 50)}...". All crimes will route to Review Queue.`);
          }

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

              // ← CRITICAL FIX: Process crime types FIRST (converts all_crime_types array → primary/related)
              const crimeTypes = processLegacyCrimeType(crime);

              // ← NEW: Filter out crimes outside Trinidad & Tobago
              // Accept: "Trinidad", "Trinidad and Tobago", or "Trinidad & Tobago"
              const validLocations = ['Trinidad', 'Trinidad and Tobago', 'Trinidad & Tobago', 'Tobago'];
              if (crime.location_country && !validLocations.includes(crime.location_country)) {
                Logger.log(`    ⏭️ Skipped: Crime occurred in ${crime.location_country}, not Trinidad`);
                return; // Skip this crime
              }

              // ← UPDATED: Validate using processed primary crime type (not crime.crime_type which doesn't exist)
              if (crimeTypes.primary === 'Other' || !crimeTypes.primary || crimeTypes.primary === 'Unknown') {
                Logger.log(`    ⏭️ Skipped: Invalid crime type "${crimeTypes.primary}"`);
                return; // Skip this crime
              }

              // ← NEW: Validate crime date isn't too old (catches court verdicts about historical crimes)
              if (crime.crime_date && publishedDate) {
                try {
                  const crimeDate = new Date(crime.crime_date);
                  const pubDate = new Date(publishedDate);
                  const daysDiff = Math.round((pubDate - crimeDate) / (1000 * 60 * 60 * 24));

                  if (daysDiff > 30) {
                    Logger.log(`    ⚠️ Crime date is ${daysDiff} days old - likely court verdict or historical reference`);
                    // Force this crime to review queue with low confidence
                    if (crime.confidence >= PROCESSING_CONFIG.CONFIDENCE_THRESHOLD) {
                      crime.confidence = 5; // Override to force review
                    }
                    if (!Array.isArray(crime.ambiguities)) crime.ambiguities = [];
                    crime.ambiguities.push(`Crime date (${crime.crime_date}) is ${daysDiff} days before publication - verify this is a new crime report, not court verdict`);
                  }
                } catch (e) {
                  Logger.log(`    ⚠️ Error validating date: ${e.message}`);
                }
              }

              // Use per-crime confidence for routing decision
              let crimeConfidence = crime.confidence !== undefined ? crime.confidence : 5;
              if (!Array.isArray(crime.ambiguities)) crime.ambiguities = [];

              // Force review queue if publish date was missing from RSS
              if (publishDateMissing) {
                crime.ambiguities.push('Publish date missing from RSS feed — crime date may be inaccurate; verify against article');
                crimeConfidence = Math.min(crimeConfidence, 5);
              }

              // Force review queue if Claude returned no crime_date (would silently fall back to run date)
              if (!crime.crime_date) {
                crime.ambiguities.push('crime_date not extracted by Claude — verify date against article before approving');
                crimeConfidence = Math.min(crimeConfidence, 5);
                Logger.log(`    ⚠️ crime_date is null — forcing Review Queue`);
              }

              const crimeAmbiguities = crime.ambiguities;

              if (crimeConfidence >= PROCESSING_CONFIG.CONFIDENCE_THRESHOLD) {
                appendToProduction(crime, publishedDate, crimeTypes, cachedProdData, cachedArchiveData, prodColMap, archiveColMap);
                highConfCrimes++;
                Logger.log(`    ✅ Added to Production (confidence: ${crimeConfidence})`);
              } else if (crimeConfidence > 0) {
                appendToReviewQueue(crime, crimeConfidence, crimeAmbiguities, publishedDate, crimeTypes);
                lowConfCrimes++;
                Logger.log(`    ⚠️ Added to Review Queue (confidence: ${crimeConfidence})`);
              }
            });

            totalCrimesExtracted += extracted.crimes.length;

            // Update article status
            if (highConfCrimes > 0) {
              const confScores = extracted.crimes.map(c => c.confidence || '?').join(', ');
              sheet.getRange(rowNumber, rawColMap['status'] + 1).setValue('completed');
              sheet.getRange(rowNumber, rawColMap['notes'] + 1).setValue(`✅ Extracted ${extracted.crimes.length} crime(s), confidence: [${confScores}]`);
              successCount += highConfCrimes;
            } else if (lowConfCrimes > 0) {
              const confScores = extracted.crimes.map(c => c.confidence || '?').join(', ');
              sheet.getRange(rowNumber, rawColMap['status'] + 1).setValue('needs_review');
              sheet.getRange(rowNumber, rawColMap['notes'] + 1).setValue(`⚠️ ${extracted.crimes.length} crime(s) need review, confidence: [${confScores}]`);
              reviewCount += lowConfCrimes;
            }

          } else {
            // No crimes found
            sheet.getRange(rowNumber, rawColMap['status'] + 1).setValue('skipped');
            sheet.getRange(rowNumber, rawColMap['notes'] + 1).setValue(`Not a crime article: ${(extracted.ambiguities || []).join(', ')}`);
            Logger.log(`⏭️ Skipped (no crimes detected)`);
          }

          articlesProcessed++;
          Utilities.sleep(PROCESSING_CONFIG.RATE_LIMIT_DELAY);

        } catch (error) {
          Logger.log(`❌ Error processing row ${rowNumber}: ${error.message}`);
          sheet.getRange(rowNumber, rawColMap['status'] + 1).setValue('failed');
          sheet.getRange(rowNumber, rawColMap['notes'] + 1).setValue(`Error: ${error.message.substring(0, 100)}`);
          failedCount++;
        }
      }
    }

    const totalTime = Math.round((new Date().getTime() - startTime) / 1000);

    Logger.log('=== PROCESSING COMPLETE ===');
    Logger.log(`⏱️ Total execution time: ${totalTime}s`);
    Logger.log(`Articles processed: ${articlesProcessed}`);
    Logger.log(`Total crimes extracted: ${totalCrimesExtracted}`);
    Logger.log(`→ Production: ${successCount} crime(s)`);
    Logger.log(`→ Review Queue: ${reviewCount} crime(s)`);
    Logger.log(`→ Failed: ${failedCount} article(s)`);

    if (timeoutReached) {
      Logger.log(`⚠️ Stopped early due to time limit. Remaining articles will process in next run.`);
    }
    Logger.log('===========================');
  }

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
   * Validate and format date for Google Sheets
   * Returns formatted string to prevent Google Sheets auto-reformatting basedon locale
   * Format: "MM/DD/YYYY" (US standard - matches Production sheet) prefixed with apostrophe for plain text
   * @param {string} dateStr - Date string from Gemini
   * @param {Date} fallbackDate - Fallback date if parsing fails
   * @returns {string} Plain text date string in MM/DD/YYYY format
   */
  function validateAndFormatDate(dateStr, fallbackDate) {
    let dateToFormat;

    if (!dateStr) {
      Logger.log(`⚠️ No date provided, using fallback: ${fallbackDate}`);
      dateToFormat = fallbackDate;
    } else {
      try {
        // ISO date-only strings (YYYY-MM-DD) parse as UTC midnight in V8/GAS,
        // which shifts to the previous day when formatted in TT (UTC-4).
        // Appending T12:00:00 forces noon local time and avoids the off-by-one.
        const parsed = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
        if (isNaN(parsed.getTime())) {
          Logger.log(`⚠️ Invalid date format: "${dateStr}", using fallback`);
          dateToFormat = fallbackDate;
        } else {
          dateToFormat = parsed;
        }
      } catch (e) {
        Logger.log(`⚠️ Error parsing date "${dateStr}": ${e.message}, using fallback`);
        dateToFormat = fallbackDate;
      }
    }

    // Format as MM/DD/YYYY (US standard - matches Production sheet format)
    // Return as plain date string (no apostrophe prefix)
    const day = Utilities.formatDate(dateToFormat,
  Session.getScriptTimeZone(), 'dd');
    const month = Utilities.formatDate(dateToFormat,
  Session.getScriptTimeZone(), 'MM');
    const year = Utilities.formatDate(dateToFormat,
  Session.getScriptTimeZone(), 'yyyy');

    return `${month}/${day}/${year}`;
  }

