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
              const crimeConfidence = crime.confidence !== undefined ? crime.confidence : 5;
              const crimeAmbiguities = Array.isArray(crime.ambiguities) ? crime.ambiguities : [];

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

// ============================================================================
// PRODUCTION SHEET FUNCTIONS
// ============================================================================

/**
   * Append extracted data to production sheet
   * @param {Object} crime - Crime data from Gemini
   * @param {Date} publishedDate - Article publication date (fallback)
   * @param {Object} crimeTypes - Pre-calculated crime types (primary/related)
   */
  function appendToProduction(crime, publishedDate, crimeTypes, cachedProdData, cachedArchiveData, prodColMap, archiveColMap) {
    // Acquire lock to prevent race conditions when multiple processes run simultaneously
    const lock = LockService.getScriptLock();

    try {
      // Wait up to 30 seconds for lock
      lock.waitLock(30000);

      const prodSheet = getActiveSheet(SHEET_NAMES.PRODUCTION);

      // Geocode first (needed for coordinate-based duplicate detection)
      const fullAddress = `${crime.street || ''}, ${crime.area || ''}, Trinidad and Tobago`;
      const geocoded = geocodeAddress(fullAddress);

      // Check for duplicate in Production sheet (uses pre-loaded cache if available)
      if (isDuplicateCrime(prodSheet, crime, geocoded, cachedProdData, prodColMap)) {
        Logger.log(`⚠️ Duplicate detected in Production, skipping: ${crime.headline}`);
        return;
      }

      // Check for duplicate in Production Archive (may be archived already)
      try {
        const archiveSheet = getActiveSheet(SHEET_NAMES.PRODUCTION_ARCHIVE);
        if (archiveSheet && isDuplicateCrime(archiveSheet, crime, geocoded, cachedArchiveData, archiveColMap)) {
          Logger.log(`⚠️ Duplicate detected in Production Archive, skipping: ${crime.headline}`);
          return;
        }
      } catch (e) {
        // Archive sheet might not exist yet, that's okay
        Logger.log(`ℹ️ Production Archive not found (may not exist yet): ${e.message}`);
      }

      // ═══════════════════════════════════════════════════════════
      // NEW: Check for POTENTIAL duplicates - redirect to Review Queue
      // These are near-misses that a human should verify
      // ═══════════════════════════════════════════════════════════
      const potentialDupe = findPotentialDuplicate(prodSheet, crime, geocoded, cachedProdData, prodColMap);
      if (potentialDupe.isPotential) {
        Logger.log(`⚠️ Potential duplicate detected, routing to Review Queue: ${crime.headline}`);
        Logger.log(`   Reason: ${potentialDupe.reason}`);

        // Route to review queue with duplicate warning
        const reviewSheet = getActiveSheet(SHEET_NAMES.REVIEW_QUEUE);
        const validatedDate = validateAndFormatDate(crime.crime_date, null);
        const victimCount = crime.victimCount ||
                            (crime.victims && Array.isArray(crime.victims) ? crime.victims.length : 1);

        // Get crimeTypes if not already processed
        const crimeTypesForReview = crimeTypes || processLegacyCrimeType(crime);

        appendRowByHeaders(reviewSheet, {
          'Headline':            crime.headline || 'Needs headline',
          'Summary':             crime.details || '',
          'primaryCrimeType':    crimeTypesForReview.primary,
          'relatedCrimeTypes':   crimeTypesForReview.related,
          'victimCount':         victimCount,
          'crimeType':           crimeTypesForReview.primary,
          'Date':                validatedDate,
          'Street Address':      crime.street || '',
          'Latitude':            geocoded.lat || '',
          'Longitude':           geocoded.lng || '',
          'Location (Plus Code)': geocoded.plus_code || '',
          'Area':                crime.area || '',
          'Region':              '',
          'Island':              'Trinidad',
          'URL':                 crime.source_url || '',
          'Source':              '',
          'Confidence':          6,  // Lowered due to potential duplicate
          'Ambiguities':         `POTENTIAL DUPLICATE: ${potentialDupe.reason}`,
          'Status':              'pending',
          'Notes':               '',
          'Date_Published':      Utilities.formatDate(new Date(), 'America/Port_of_Spain', 'M/d/yyyy'),
          'Date_Updated':        ''
        });

        // Release lock before returning
        lock.releaseLock();
        return;
      }

      // Validate and format crime date
      const validatedDate = validateAndFormatDate(crime.crime_date, publishedDate || new Date());

      // Use victimCount from Claude if provided, otherwise calculate from victims array
      const victimCount = crime.victimCount ||
                          (crime.victims && Array.isArray(crime.victims) ? crime.victims.length : 1);

      appendRowByHeaders(prodSheet, {
        'Headline':             crime.headline || 'No headline',
        'Summary':              crime.details || '',
        'primaryCrimeType':     crimeTypes.primary,
        'relatedCrimeTypes':    crimeTypes.related,
        'victimCount':          victimCount,
        'crimeType':            crimeTypes.primary,
        'Date':                 validatedDate,
        'Street Address':       crime.street || '',
        'Latitude':             geocoded.lat || '',
        'Longitude':            geocoded.lng || '',
        'Location (Plus Code)': geocoded.plus_code || '',
        'Area':                 crime.area || '',
        'Region':               '',
        'Island':               'Trinidad',
        'URL':                  crime.source_url || '',
        'Source':               '',
        'Safety_Tip_Flag':      crime.safety_tip_flag || '',
        'Safety_Tip_Category':  Array.isArray(crime.safety_tip_category) ? crime.safety_tip_category.join(', ') : (crime.safety_tip_category || ''),
        'Safety_Tip_Context':   Array.isArray(crime.safety_tip_context) ? crime.safety_tip_context.join(', ') : (crime.safety_tip_context || ''),
        'Tactic_Noted':         crime.tactic_noted || '',
        'Date_Published':       Utilities.formatDate(new Date(), 'America/Port_of_Spain', 'M/d/yyyy'),
        'Date_Updated':         ''
      });

      // Fix A: Update in-memory cache so same-run duplicate detection works for
      // subsequent articles in the same batch — without this, articles 2-N of the
      // same incident bypass all checks because the cache snapshot was taken before
      // article 1 was written.
      const newLastRow = prodSheet.getLastRow();
      if (newLastRow >= 2) {
        const newRow = prodSheet.getRange(newLastRow, 1, 1, prodSheet.getLastColumn()).getValues()[0];
        if (cachedProdData) cachedProdData.push(newRow);
      }

      Logger.log(`✅ Added to production: ${crime.headline}
  [${geocoded.plus_code || 'No Plus Code'}]`);

    } catch (e) {
      Logger.log(`❌ Could not acquire lock or append failed: ${e.message}`);
      throw e;
    } finally {
      // Always release lock
      lock.releaseLock();
    }
  }

/**
   * Append to review queue for manual verification
   * @param {Object} crime - Crime data from Gemini
   * @param {number} confidence - Confidence score
   * @param {Array} ambiguities - Array of ambiguity strings
   * @param {Date} publishedDate - Article publication date (fallback)
   * @param {Object} crimeTypes - Pre-calculated crime types (primary/related)
   */
  function appendToReviewQueue(crime, confidence, ambiguities, publishedDate, crimeTypes) {
    const reviewSheet = getActiveSheet(SHEET_NAMES.REVIEW_QUEUE);

    const fullAddress = `${crime.street || ''}, ${crime.area || ''},
  Trinidad and Tobago`;
    const geocoded = geocodeAddress(fullAddress);

    // Check for duplicate in Production (another source may have captured it with high confidence)
    const prodSheet = getActiveSheet(SHEET_NAMES.PRODUCTION);
    if (isDuplicateCrime(prodSheet, crime, geocoded)) {
      Logger.log(`⚠️ Duplicate detected in Production (review queue entry skipped): ${crime.headline}`);
      return;
    }

    // Check for duplicate already in Review Queue (same article processed twice)
    if (isDuplicateCrime(reviewSheet, crime, geocoded)) {
      Logger.log(`⚠️ Duplicate detected in Review Queue, skipping: ${crime.headline}`);
      return;
    }

    // Validate and format crime date
    const validatedDate = validateAndFormatDate(crime.crime_date, publishedDate || new Date());

    // Use victimCount from Claude if provided, otherwise calculate from victims array
    const victimCount = crime.victimCount ||
                        (crime.victims && Array.isArray(crime.victims) ? crime.victims.length : 1);

    appendRowByHeaders(reviewSheet, {
      'Headline':             crime.headline || 'Needs headline',
      'Summary':              crime.details || '',
      'primaryCrimeType':     crimeTypes.primary,
      'relatedCrimeTypes':    crimeTypes.related,
      'victimCount':          victimCount,
      'crimeType':            crimeTypes.primary,
      'Date':                 validatedDate,
      'Street Address':       crime.street || '',
      'Latitude':             geocoded.lat || '',
      'Longitude':            geocoded.lng || '',
      'Location (Plus Code)': geocoded.plus_code || '',
      'Area':                 crime.area || '',
      'Region':               '',
      'Island':               'Trinidad',
      'URL':                  crime.source_url || '',
      'Source':               '',
      'Confidence':           confidence,
      'Ambiguities':          (ambiguities || []).join('; '),
      'Status':               'pending',
      'Notes':                '',
      'Date_Published':       Utilities.formatDate(new Date(), 'America/Port_of_Spain', 'M/d/yyyy'),
      'Date_Updated':         ''
    });

    Logger.log(`⚠️ Added to review queue: ${crime.headline}`);
  }

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Normalize URLs for comparison (handles Trinidad Express article ID system)
 * Trinidad Express URLs have format: /article-slug/article_UUID.html
 * The slug can vary (typos, edits), but UUID is the unique identifier
 *
 * @param {string} url - Source URL
 * @returns {string} Normalized URL (article ID for Trinidad Express, original URL otherwise)
 */
function normalizeUrl(url) {
  // ← CRITICAL FIX: Ensure url is a string before calling .match()
  if (!url || typeof url !== 'string') return url;

  // Trinidad Express: Extract article ID (article_UUID.html)
  const expressMatch = url.match(/article_([a-f0-9-]+)\.html/i);
  if (expressMatch) {
    return `trinidadexpress:${expressMatch[0]}`; // Returns "trinidadexpress:article_UUID.html"
  }

  // Other sources: Return original URL
  return url;
}

/**
 * Check for duplicate crimes (enhanced fuzzy matching with victim/location)
 * @param {Sheet} sheet - Production or review sheet
 * @param {Object} crime - Crime data to check
 * @param {Object} geocoded - Geocoded coordinates {lat, lng, plus_code, formatted_address}
 * @returns {boolean} True if duplicate found
 */
function isDuplicateCrime(sheet, crime, geocoded, cachedData, cachedColMap) {
    let data;
    let colMap;
    if (cachedData && cachedColMap) {
      data = cachedData;
      colMap = cachedColMap;
    } else {
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return false;
      colMap = buildColMap(sheet);
      data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    }
    if (!data || data.length === 0) return false;

    // Extract victim name from crime if available
    const victimName = (crime.victims && crime.victims.length > 0 && crime.victims[0].name)
                       ? crime.victims[0].name.toLowerCase()
                       : null;

    for (let row of data) {
      // Coerce to the correct primitive type — Sheets can return Date/Number for any cell
      const existingHeadline  = String(row[colMap['headline']]  || '');
      const existingCrimeType = String(row[colMap['crimetype']] || '');
      const existingDate      = row[colMap['date']]; // keep raw for new Date() parsing
      const existingStreet    = String(row[colMap['street address']] || '');
      const existingLat       = Number(row[colMap['latitude']])  || 0;
      const existingLng       = Number(row[colMap['longitude']]) || 0;
      const existingArea      = String(row[colMap['area']]  || '');
      const existingUrl       = String(row[colMap['url']]   || '');

      // ═══════════════════════════════════════════════════════════
      // PRE-CHECK: Same exact coordinates + same date + same crime type + some headline similarity
      // Very strong signal - different news sources reporting same incident at exact location
      // Catches cross-source duplicates like "PS robbed in Cascade" reported by multiple outlets
      // Requires minimal headline similarity to avoid false positives from generic city-center coordinates
      // ═══════════════════════════════════════════════════════════
      if (existingDate && crime.crime_date && existingLat && existingLng && geocoded && geocoded.lat && geocoded.lng) {
        const existingDateStr = Utilities.formatDate(new Date(existingDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');

        if (existingDateStr === crime.crime_date && existingCrimeType === crime.crime_type) {
          // Compare coordinates (round to 4 decimal places = ~11 meters precision)
          const latMatch = Math.abs(existingLat - geocoded.lat) < 0.0001;
          const lngMatch = Math.abs(existingLng - geocoded.lng) < 0.0001;

          if (latMatch && lngMatch) {
            // SAFETY CHECK: Require at least 30% headline similarity
            // Prevents false positives when multiple crimes geocode to same city center
            const similarity = calculateSimilarity(existingHeadline, crime.headline);

            if (similarity > 0.30) {
              Logger.log(`Duplicate found: Exact coordinates (${geocoded.lat}, ${geocoded.lng}) + same date + same crime type + ${(similarity * 100).toFixed(0)}% similar headline (cross-source duplicate)`);
              return true;
            } else {
              Logger.log(`⚠️ Same coordinates but headlines too different (${(similarity * 100).toFixed(0)}% similarity) - likely different crimes at same general location`);
            }
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // NEW CHECK: Same exact coordinates + similar dates (±2 days) + same crime type + victim name match
      // Catches cross-source duplicates where dates vary due to different publication times
      // Example: Article A says "yesterday" (Nov 20), Article B says "on Thursday" (Nov 21) - both about same Nov 20 crime
      // ═══════════════════════════════════════════════════════════
      if (existingDate && crime.crime_date && existingLat && existingLng && geocoded && geocoded.lat && geocoded.lng) {
        const existingDateObj = new Date(existingDate);
        const crimeDateObj = new Date(crime.crime_date);
        const daysDiff = Math.abs(Math.round((existingDateObj - crimeDateObj) / (1000 * 60 * 60 * 24)));

        // Allow 2-day variance for cross-source reporting
        if (daysDiff <= 2 && existingCrimeType === crime.crime_type) {
          // Compare coordinates (round to 4 decimal places = ~11 meters precision)
          const latMatch = Math.abs(existingLat - geocoded.lat) < 0.0001;
          const lngMatch = Math.abs(existingLng - geocoded.lng) < 0.0001;

          if (latMatch && lngMatch) {
            // Extract victim names from both headlines for comparison
            const existingNames = extractNamesFromHeadline(existingHeadline);
            const newNames = extractNamesFromHeadline(crime.headline);

            // If both headlines contain a matching victim name, it's very likely the same incident
            let victimNameMatch = false;
            for (const existingName of existingNames) {
              for (const newName of newNames) {
                if (existingName.length > 5 && newName.length > 5 &&
                    (existingName.includes(newName) || newName.includes(existingName))) {
                  victimNameMatch = true;
                  Logger.log(`Duplicate found: Exact coordinates + ${daysDiff} day variance + same crime type + victim name match "${existingName}" (cross-source duplicate with date variance)`);
                  return true;
                }
              }
            }

            // If no victim name match, require higher headline similarity
            const similarity = calculateSimilarity(existingHeadline, crime.headline);
            if (similarity > 0.50) {
              Logger.log(`Duplicate found: Exact coordinates + ${daysDiff} day variance + same crime type + ${(similarity * 100).toFixed(0)}% headline similarity (cross-source duplicate with date variance)`);
              return true;
            }
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // CHECK 1: Same URL + Same location + Same date/type (same incident re-extracted)
      // Smart logic: Allows multi-crime articles with different incidents
      // Uses normalized URLs to handle Trinidad Express article ID variations
      // ═══════════════════════════════════════════════════════════
      const normalizedExistingUrl = normalizeUrl(existingUrl);
      const normalizedNewUrl = normalizeUrl(crime.source_url);

      if (normalizedExistingUrl === normalizedNewUrl && normalizedExistingUrl && normalizedNewUrl) {
        // existingStreet already defined above (row[6])
        const existingLocationText = `${existingArea} ${existingStreet}`.toLowerCase();
        const newLocationText = `${crime.area || ''} ${crime.street || ''}`.toLowerCase();

        // Check if same area
        const sameArea = existingArea && crime.area && existingArea === crime.area;
        const existingDateStr = existingDate ? Utilities.formatDate(new Date(existingDate), Session.getScriptTimeZone(), 'yyyy-MM-dd') : null;
        const sameDate = existingDateStr && crime.crime_date && existingDateStr === crime.crime_date;

        // SCENARIO 1: Same URL + Same Area + Same Date → Likely duplicate
        if (sameArea && sameDate) {
          Logger.log('Duplicate found: Same URL + Same area + Same date (re-extraction)');
          return true;
        }

        // SCENARIO 2: Same URL + Same Area + Different Date → Allow (different incidents)
        if (sameArea && !sameDate) {
          Logger.log(`✓ Same URL + Same area but different dates (${existingDateStr} vs ${crime.crime_date}) - allowing separate incidents`);
          return false; // Explicitly allow
        }

        // SCENARIO 3: Same URL + Different Area → Allow (multi-location article)
        if (!sameArea) {
          Logger.log(`✓ Same URL but different areas (${existingArea} vs ${crime.area}) - allowing multi-location article`);
          return false; // Explicitly allow
        }

        // Check for location keywords overlap (handles street-level duplicates)
        const locationWords = existingLocationText.split(/\s+/).filter(w => w.length > 4);
        const newWords = newLocationText.split(/\s+/).filter(w => w.length > 4);
        const commonLocationWords = locationWords.filter(w => newWords.includes(w));

        if (commonLocationWords.length >= 2 && sameDate) {
          Logger.log(`Duplicate found: Same URL + ${commonLocationWords.length} location words + same date`);
          return true;
        }
      }

      // ═══════════════════════════════════════════════════════════
      // CHECK 2: Same victim names in headline (multi-victim incidents)
      // Prevents double-counting same person in different extractions
      // ═══════════════════════════════════════════════════════════
      if (existingDate && crime.crime_date) {
        const existingDateStr = Utilities.formatDate(new Date(existingDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');

        if (existingDateStr === crime.crime_date) {
          // Extract names from both headlines
          const existingNames = extractNamesFromHeadline(existingHeadline);
          const newNames = extractNamesFromHeadline(crime.headline);

          // If any name appears in both, and locations match, it's likely same victim
          for (const existingName of existingNames) {
            for (const newName of newNames) {
              if (existingName.length > 5 && newName.length > 5 &&
                  (existingName.includes(newName) || newName.includes(existingName))) {
                const similarity = calculateSimilarity(existingHeadline, crime.headline);
                if (similarity > 0.6) {
                  Logger.log(`Duplicate found: Same victim name "${existingName}" detected`);
                  return true;
                }
              }
            }
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // CHECK 3: Same date + victim name + crime type (different sources)
      // ═══════════════════════════════════════════════════════════
      if (existingDate && crime.crime_date && victimName) {
        const existingDateStr = Utilities.formatDate(new Date(existingDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');

        if (existingDateStr === crime.crime_date && existingCrimeType === crime.crime_type) {
          // Check if victim name appears in existing headline
          const existingHeadlineLower = existingHeadline.toLowerCase();
          if (existingHeadlineLower.includes(victimName)) {
            Logger.log(`Duplicate found: Same date + victim name "${victimName}" + crime type`);
            return true;
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // CHECK 4: Same date + location + crime type (70%+ headline similarity)
      // Lowered from 80% to catch cross-source duplicates (different journalists write different headlines)
      // ═══════════════════════════════════════════════════════════
      if (existingDate && crime.crime_date) {
        const existingDateStr = Utilities.formatDate(new Date(existingDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');

        if (existingDateStr === crime.crime_date &&
            existingCrimeType === crime.crime_type &&
            existingArea === crime.area) {
          const similarity = calculateSimilarity(existingHeadline, crime.headline);
          if (similarity > 0.70) {
            Logger.log(`Duplicate found: Same date + area "${crime.area}" + crime type + ${(similarity * 100).toFixed(0)}% similar headline`);
            return true;
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // CHECK 5: Same date + crime type + very high headline similarity (85%+)
      // Catches same incident even when location fields differ between sources
      // ═══════════════════════════════════════════════════════════
      if (existingDate && crime.crime_date) {
        const existingDateStr = Utilities.formatDate(new Date(existingDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');

        if (existingDateStr === crime.crime_date && existingCrimeType === crime.crime_type) {
          const similarity = calculateSimilarity(existingHeadline, crime.headline);
          if (similarity > 0.85) {
            Logger.log(`Duplicate found: Same date + crime type + ${(similarity * 100).toFixed(0)}% similar headline (different sources)`);
            return true;
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // CHECK 6: Same date + crime type + shared location keywords
      // Catches when "Grand Bazaar" appears in different field combinations
      // ═══════════════════════════════════════════════════════════
      if (existingDate && crime.crime_date) {
        const existingDateStr = Utilities.formatDate(new Date(existingDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');

        if (existingDateStr === crime.crime_date && existingCrimeType === crime.crime_type) {
          // Get all location text from both crimes (existingStreet already defined above)
          const existingLocationText = `${existingArea} ${existingStreet}`.toLowerCase();
          const newLocationText = `${crime.area || ''} ${crime.street || ''}`.toLowerCase();

          // Extract significant location keywords (2+ words, ignore common words)
          const significantWords = [
            'grand bazaar', 'movie towne', 'trincity mall', 'central market', 'queens park',
            'priority bus route', 'pbr', 'churchill roosevelt highway'
          ];

          for (const keyword of significantWords) {
            if (existingLocationText.includes(keyword) && newLocationText.includes(keyword)) {
              const similarity = calculateSimilarity(existingHeadline, crime.headline);
              if (similarity > 0.75) {
                Logger.log(`Duplicate found: Same date + crime type + location keyword "${keyword}" + ${(similarity * 100).toFixed(0)}% similar headline`);
                return true;
              }
            }
          }

          // Fuzzy location match: if both have 2+ word overlap in location
          const existingWords = existingLocationText.split(/\s+/).filter(w => w.length > 3);
          const newWords = newLocationText.split(/\s+/).filter(w => w.length > 3);
          const commonWords = existingWords.filter(w => newWords.includes(w));

          if (commonWords.length >= 2) {
            const similarity = calculateSimilarity(existingHeadline, crime.headline);
            if (similarity > 0.75) {
              Logger.log(`Duplicate found: Same date + crime type + ${commonWords.length} common location words + ${(similarity * 100).toFixed(0)}% similar headline`);
              return true;
            }
          }

          // ═══════════════════════════════════════════════════════════
          // SPECIAL CASE: Maxi taxi robberies with contextual matching
          // These are frequently reported by multiple news sources
          // Lower threshold to 65% when both mention "maxi" and share location
          // ═══════════════════════════════════════════════════════════
          const existingHeadlineLower = existingHeadline.toLowerCase();
          const newHeadlineLower = crime.headline.toLowerCase();

          // Check if both mention "maxi" (common crime context in Trinidad)
          const bothMentionMaxi = existingHeadlineLower.includes('maxi') && newHeadlineLower.includes('maxi');

          if (bothMentionMaxi && commonWords.length >= 2) {
            const similarity = calculateSimilarity(existingHeadline, crime.headline);
            if (similarity > 0.65) {
              Logger.log(`Duplicate found: Same date + crime type + maxi taxi context + ${commonWords.length} location words + ${(similarity * 100).toFixed(0)}% similar headline`);
              return true;
            }
          }

          // Check for other common crime contexts that indicate same incident
          const crimeContextKeywords = [
            ['home invasion', 'home invasion'], // Both must mention home invasion
            ['pbr', 'pbr'],                     // Both mention PBR
            ['kfc', 'kfc'],                     // Both mention KFC
            ['movie towne', 'movie towne']      // Both mention Movie Towne
          ];

          for (const [keyword1, keyword2] of crimeContextKeywords) {
            if (existingHeadlineLower.includes(keyword1) && newHeadlineLower.includes(keyword2)) {
              const similarity = calculateSimilarity(existingHeadline, crime.headline);
              if (similarity > 0.65 && existingArea === crime.area) {
                Logger.log(`Duplicate found: Same date + area + crime type + "${keyword1}" context + ${(similarity * 100).toFixed(0)}% similar headline`);
                return true;
              }
            }
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // CHECK 7: Semantic keyword matching for cross-source duplicates
      // Catches different headline styles reporting same incident
      // Example: "Pregnant woman shot dead" vs "Venezuelan killed in shooting"
      // ═══════════════════════════════════════════════════════════
      if (existingDate && crime.crime_date) {
        const existingDateStr = Utilities.formatDate(new Date(existingDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');

        if (existingDateStr === crime.crime_date && existingCrimeType === crime.crime_type) {
          const semanticMatch = checkSemanticDuplicate(existingHeadline, crime.headline, existingArea, crime.area);

          if (semanticMatch.isMatch) {
            Logger.log(`Duplicate found: Same date + crime type + semantic match (${semanticMatch.matchedKeywords.join(', ')}) + ${(semanticMatch.similarity * 100).toFixed(0)}% headline similarity`);
            return true;
          }
        }
      }
    }

    return false;
  }

/**
 * Check for semantic duplicate using victim descriptors and crime action keywords
 * @param {string} headline1 - First headline
 * @param {string} headline2 - Second headline
 * @param {string} area1 - First area
 * @param {string} area2 - Second area
 * @returns {Object} {isMatch: boolean, matchedKeywords: string[], similarity: number}
 */
function checkSemanticDuplicate(headline1, headline2, area1, area2) {
  const h1 = headline1.toLowerCase();
  const h2 = headline2.toLowerCase();

  // Victim descriptors that strongly identify the same person
  const victimDescriptors = [
    'pregnant', 'elderly', 'pensioner', 'teen', 'teenager', 'child', 'baby',
    'toddler', 'minor', 'businessman', 'taxi driver', 'maxi driver', 'vendor',
    'security guard', 'police officer', 'soldier', 'teacher', 'student'
  ];

  // Crime action words
  const crimeActions = [
    'shot', 'shooting', 'stabbed', 'stabbing', 'killed', 'murdered', 'slain',
    'robbed', 'robbery', 'kidnapped', 'kidnapping', 'raped', 'beaten', 'chopped',
    'gunned down', 'executed'
  ];

  // Find matching keywords
  const matchedDescriptors = victimDescriptors.filter(kw => h1.includes(kw) && h2.includes(kw));
  const matchedActions = crimeActions.filter(kw => h1.includes(kw) && h2.includes(kw));

  const allMatched = [...matchedDescriptors, ...matchedActions];
  const similarity = calculateSimilarity(headline1, headline2);

  // Strong match: victim descriptor + action + (same area OR 50%+ similarity)
  if (matchedDescriptors.length >= 1 && matchedActions.length >= 1) {
    const sameArea = area1 && area2 && area1.toLowerCase() === area2.toLowerCase();
    if (sameArea || similarity > 0.50) {
      return { isMatch: true, matchedKeywords: allMatched, similarity };
    }
  }

  // Medium match: 2+ descriptors/actions + 60%+ similarity
  if (allMatched.length >= 2 && similarity > 0.60) {
    return { isMatch: true, matchedKeywords: allMatched, similarity };
  }

  // Special case: Both mention specific victim type (pregnant, elderly) + any similarity
  const highValueDescriptors = ['pregnant', 'elderly', 'pensioner', 'baby', 'toddler'];
  const matchedHighValue = highValueDescriptors.filter(kw => h1.includes(kw) && h2.includes(kw));

  if (matchedHighValue.length >= 1 && similarity > 0.40) {
    const sameArea = area1 && area2 && area1.toLowerCase() === area2.toLowerCase();
    if (sameArea) {
      return { isMatch: true, matchedKeywords: matchedHighValue, similarity };
    }
  }

  return { isMatch: false, matchedKeywords: allMatched, similarity };
}

/**
 * Find potential duplicates that should go to Review Queue for human verification
 * These are near-misses that don't meet the hard duplicate threshold
 * @param {Sheet} sheet - Production sheet to check against
 * @param {Object} crime - Crime data to check
 * @param {Object} geocoded - Geocoded coordinates
 * @returns {Object} {isPotential: boolean, reason: string, matchRow: number}
 */
function findPotentialDuplicate(sheet, crime, geocoded, cachedData, cachedColMap) {
  let data;
  let colMap;
  if (cachedData && cachedColMap) {
    data = cachedData;
    colMap = cachedColMap;
  } else {
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { isPotential: false, reason: '', matchRow: -1 };
    colMap = buildColMap(sheet);
    data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  }
  if (!data || data.length === 0) return { isPotential: false, reason: '', matchRow: -1 };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2;

    // Coerce to the correct primitive type — Sheets can return Date/Number for any cell
    const existingHeadline  = String(row[colMap['headline']]  || '');
    const existingCrimeType = String(row[colMap['crimetype']] || '');
    const existingDate      = row[colMap['date']]; // keep raw for new Date() parsing
    const existingArea      = String(row[colMap['area']]  || '');

    if (!existingDate || !crime.crime_date) continue;

    const existingDateStr = Utilities.formatDate(new Date(existingDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    // ═══════════════════════════════════════════════════════════
    // POTENTIAL 1: Same date + same crime type + 50-70% headline similarity
    // (Below hard threshold but suspicious)
    // ═══════════════════════════════════════════════════════════
    if (existingDateStr === crime.crime_date && existingCrimeType === crime.crime_type) {
      const similarity = calculateSimilarity(existingHeadline, crime.headline);

      if (similarity > 0.50 && similarity < 0.70) {
        return {
          isPotential: true,
          reason: `Similar to row ${rowNumber}: "${existingHeadline.substring(0, 50)}..." (${(similarity * 100).toFixed(0)}% similar)`,
          matchRow: rowNumber
        };
      }
    }

    // ═══════════════════════════════════════════════════════════
    // POTENTIAL 2: Same area + same crime type + dates within 1 day
    // (Could be reporting delay between sources)
    // ═══════════════════════════════════════════════════════════
    if (existingArea && crime.area && existingArea.toLowerCase() === crime.area.toLowerCase()) {
      if (existingCrimeType === crime.crime_type) {
        const existingDateObj = new Date(existingDate);
        const crimeDateObj = new Date(crime.crime_date);
        const daysDiff = Math.abs(Math.round((existingDateObj - crimeDateObj) / (1000 * 60 * 60 * 24)));

        if (daysDiff === 1) {
          const similarity = calculateSimilarity(existingHeadline, crime.headline);
          if (similarity > 0.40) {
            return {
              isPotential: true,
              reason: `Same area "${crime.area}" + crime type, 1 day apart from row ${rowNumber}`,
              matchRow: rowNumber
            };
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // POTENTIAL 3: Semantic near-miss (matched keywords but similarity too low)
    // ═══════════════════════════════════════════════════════════
    if (existingDateStr === crime.crime_date && existingCrimeType === crime.crime_type) {
      const semanticResult = checkSemanticDuplicate(existingHeadline, crime.headline, existingArea, crime.area);

      // If we found matching keywords but not enough for a hard match
      if (!semanticResult.isMatch && semanticResult.matchedKeywords.length >= 1 && semanticResult.similarity > 0.30) {
        return {
          isPotential: true,
          reason: `Shared keywords [${semanticResult.matchedKeywords.join(', ')}] with row ${rowNumber}, ${(semanticResult.similarity * 100).toFixed(0)}% similar`,
          matchRow: rowNumber
        };
      }
    }

    // ═══════════════════════════════════════════════════════════
    // POTENTIAL 4: Same victim name + date within 1 day
    // Catches same-incident duplicates where different outlets extracted
    // the crime date differently (e.g. CNC3 uses publish date, Express uses
    // event date), so CHECK 2's exact-date guard misses them.
    // Does NOT hard-skip — routes to Review Queue for human verification.
    // ═══════════════════════════════════════════════════════════
    const existingDateObjP4 = new Date(existingDate);
    const crimeDateObjP4    = new Date(crime.crime_date);
    const daysDiffP4 = Math.abs(Math.round((existingDateObjP4 - crimeDateObjP4) / (1000 * 60 * 60 * 24)));

    if (daysDiffP4 === 1) {
      const existingNamesP4 = extractNamesFromHeadline(existingHeadline);
      const newNamesP4      = extractNamesFromHeadline(crime.headline);
      for (const eName of existingNamesP4) {
        for (const nName of newNamesP4) {
          if (eName.length > 5 && nName.length > 5 &&
              (eName.includes(nName) || nName.includes(eName))) {
            return {
              isPotential: true,
              reason: `Same victim name "${eName}" in row ${rowNumber} with date 1 day apart (${existingDateStr} vs ${crime.crime_date}) — verify same incident`,
              matchRow: rowNumber
            };
          }
        }
      }
    }
  }

  return { isPotential: false, reason: '', matchRow: -1 };
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

/**
 * Extract potential victim names from headline
 * Looks for capitalized words in parentheses or after common patterns
 * @param {string} headline - Crime headline
 * @returns {Array<string>} Array of potential names
 */
function extractNamesFromHeadline(headline) {
  const names = [];

  // Pattern 1: Names in parentheses (most common in our format)
  const parenMatches = headline.match(/\(([^)]+)\)/g);
  if (parenMatches) {
    parenMatches.forEach(match => {
      // Remove parentheses and extract names
      const content = match.replace(/[()]/g, '');
      // Split by comma or "and"
      const potentialNames = content.split(/,| and /);
      potentialNames.forEach(name => {
        const cleanName = name.trim().replace(/\d+/g, '').trim(); // Remove ages
        if (cleanName.length > 3) {
          names.push(cleanName.toLowerCase());
        }
      });
    });
  }

  // Pattern 2: Capitalized sequences (2+ words starting with capitals)
  const capitalizedMatches = headline.match(/\b[A-Z][a-z]+(?: [A-Z][a-z]+)+\b/g);
  if (capitalizedMatches) {
    capitalizedMatches.forEach(match => {
      // Filter out common non-name phrases
      const blacklist = ['Home Invasion', 'Port Of Spain', 'San Juan', 'Penal Rock Road', 'Grand Bazaar', 'New Grant'];
      if (!blacklist.includes(match) && match.length > 5) {
        names.push(match.toLowerCase());
      }
    });
  }

  return names;
}

// ============================================================================
// BACKLOG MONITORING
// ============================================================================

/**
 * Check backlog status and send email if queue is too large
 * Can be called by a daily trigger to monitor processing health
 */
function checkBacklogStatus() {
  Logger.log('=== CHECKING BACKLOG STATUS ===');

  const sheet = getActiveSheet(SHEET_NAMES.RAW_ARTICLES);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log('No articles in Raw Articles sheet');
    return;
  }

  const dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
  const data = dataRange.getValues();

  let readyCount = 0;
  let processingCount = 0;
  let failedCount = 0;
  let needsReviewCount = 0;
  let oldestReadyDate = null;

  data.forEach(row => {
    const timestamp = row[0];
    const status = row[6];

    if (status === 'ready_for_processing') {
      readyCount++;
      if (!oldestReadyDate || timestamp < oldestReadyDate) {
        oldestReadyDate = timestamp;
      }
    } else if (status === 'processing') {
      processingCount++;
    } else if (status === 'failed') {
      failedCount++;
    } else if (status === 'needs_review') {
      needsReviewCount++;
    }
  });

  Logger.log(`Backlog Summary:`);
  Logger.log(`  Ready for processing: ${readyCount}`);
  Logger.log(`  Currently processing: ${processingCount}`);
  Logger.log(`  Failed: ${failedCount}`);
  Logger.log(`  Needs review: ${needsReviewCount}`);

  // Alert if backlog is large
  const BACKLOG_ALERT_THRESHOLD = 50;
  if (readyCount > BACKLOG_ALERT_THRESHOLD) {
    const oldestAge = oldestReadyDate ? Math.round((new Date() - new Date(oldestReadyDate)) / (1000 * 60 * 60)) : 'unknown';

    const emailBody = `
⚠️ Large Processing Backlog Detected

Current Status:
- Ready for processing: ${readyCount} articles
- Oldest pending: ${oldestAge} hours old
- Currently processing: ${processingCount}
- Failed: ${failedCount}
- Needs review: ${needsReviewCount}

The backlog threshold is ${BACKLOG_ALERT_THRESHOLD} articles.

Recommendations:
1. Check if triggers are running on schedule
2. Review failed articles for common errors
3. Consider temporarily increasing MAX_ARTICLES_PER_RUN if all is well
4. Check API quota usage (Gemini free tier: 60 req/min)

View spreadsheet: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
    `.trim();

    GmailApp.sendEmail(
      NOTIFICATION_EMAIL,
      `⚠️ Crime Hotspots - Large Backlog (${readyCount} articles pending)`,
      emailBody
    );

    Logger.log('⚠️ Alert email sent - backlog exceeds threshold');
  } else {
    Logger.log('✅ Backlog is within normal range');
  }

  Logger.log('===========================');
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

/**
 * Archive old processed raw articles (7+ days old)
 * Schedule: Daily trigger (recommended 3am-4am Trinidad time / 7am-8am UTC)
 *
 * Archives articles that are:
 * - Older than 7 days AND
 * - Status is: completed, skipped, or filtered_out
 *
 * Does NOT archive: pending, text_fetched, ready_for_processing, processing, failed, needs_review
 * (These still need attention)
 */
function archiveProcessedArticles() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   RAW ARTICLES ARCHIVE (Daily)                ');
  Logger.log('═══════════════════════════════════════════════');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
  const archiveSheet = getOrCreateArchiveSheet();

  // Archive articles older than 7 days
  const DAYS_TO_KEEP = 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);

  Logger.log(`Cutoff date: ${cutoffDate.toLocaleDateString()}`);
  Logger.log(`Archiving articles older than ${DAYS_TO_KEEP} days with finished status`);

  const data = sheet.getDataRange().getValues();
  const toArchive = [];
  const toKeep = [data[0]]; // Headers

  // Statuses that are safe to archive (processing is complete)
  const archivableStatuses = ['completed', 'skipped', 'filtered_out'];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const timestamp = new Date(row[0]);
    const status = row[6]; // Column G: Status

    // Archive if: old AND has a finished status
    const isOld = timestamp < cutoffDate;
    const isFinished = archivableStatuses.includes(status);

    if (isOld && isFinished) {
      toArchive.push(row);
    } else {
      toKeep.push(row);
    }
  }

  // Get the number of columns dynamically
  const numColumns = data[0].length;

  // Append to archive
  if (toArchive.length > 0) {
    archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, toArchive.length, numColumns)
      .setValues(toArchive);
  }

  // Rewrite main sheet
  sheet.clear();
  sheet.getRange(1, 1, toKeep.length, numColumns).setValues(toKeep);

  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log(`✅ Archived: ${toArchive.length} articles (>${DAYS_TO_KEEP} days, finished)`);
  Logger.log(`✅ Kept: ${toKeep.length - 1} articles (recent or still processing)`);
  Logger.log('═══════════════════════════════════════════════');

  // Only send email if something was archived
  if (toArchive.length > 0) {
    GmailApp.sendEmail(
      NOTIFICATION_EMAIL,
      `📦 Crime Hotspots - Archived ${toArchive.length} Raw Articles`,
      `Daily archive complete.\n\nArchived: ${toArchive.length} articles (older than ${DAYS_TO_KEEP} days)\nKept: ${toKeep.length - 1} articles (recent or pending)\n\nView spreadsheet: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`
    );
  }
}