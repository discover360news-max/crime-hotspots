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

    const startTime = new Date().getTime();

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
    let timeoutReached = false;

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
      const status = row[6]; // Column G

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

              // ← NEW: Filter out crimes outside Trinidad
              if (crime.location_country && crime.location_country !== 'Trinidad') {
                Logger.log(`    ⏭️ Skipped: Crime occurred in ${crime.location_country}, not Trinidad`);
                return; // Skip this crime
              }

              // ← NEW: Filter out "Other" crime types (should be caught by prompt, but double-check)
              if (crime.crime_type === 'Other' || !crime.crime_type) {
                Logger.log(`    ⏭️ Skipped: Invalid crime type "${crime.crime_type}"`);
                return; // Skip this crime
              }

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
 * Normalize URLs for comparison (handles Trinidad Express article ID system)
 * Trinidad Express URLs have format: /article-slug/article_UUID.html
 * The slug can vary (typos, edits), but UUID is the unique identifier
 *
 * @param {string} url - Source URL
 * @returns {string} Normalized URL (article ID for Trinidad Express, original URL otherwise)
 */
function normalizeUrl(url) {
  if (!url) return url;

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
 * @returns {boolean} True if duplicate found
 */
function isDuplicateCrime(sheet, crime) {
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      return false; // Empty sheet
    }

    const dataRange = sheet.getRange(2, 1, lastRow - 1, 10);
    const data = dataRange.getValues();

    // Extract victim name from crime if available
    const victimName = (crime.victims && crime.victims.length > 0 && crime.victims[0].name)
                       ? crime.victims[0].name.toLowerCase()
                       : null;

    for (let row of data) {
      const existingDate = row[0];
      const existingHeadline = row[1];
      const existingCrimeType = row[2];
      const existingArea = row[5];
      const existingUrl = row[7];

      // ═══════════════════════════════════════════════════════════
      // CHECK 1: Same URL + Same location + Same date/type (same incident re-extracted)
      // Smart logic: Allows multi-crime articles with different incidents
      // Uses normalized URLs to handle Trinidad Express article ID variations
      // ═══════════════════════════════════════════════════════════
      const normalizedExistingUrl = normalizeUrl(existingUrl);
      const normalizedNewUrl = normalizeUrl(crime.source_url);

      if (normalizedExistingUrl === normalizedNewUrl && normalizedExistingUrl && normalizedNewUrl) {
        const existingStreet = row[6] || '';
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
          // Get all location text from both crimes
          const existingStreet = row[6] || '';
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