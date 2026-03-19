/**
 * Facebook Post Submitter - Web App — JAMAICA
 * Quick-entry tool for manually submitting crime posts from Facebook pages that have no RSS.
 *
 * Priority sources to submit from (see docs/guides/JAMAICA-INTEGRATION-PLAN.md):
 *   1. JCF (facebook.com/JamaicaConstabularyForce) — police-confirmed
 *   2. TVJ (facebook.com/televisionjamaica) — national broadcaster
 *   3. CVM Television (facebook.com/cvmtv)
 *   4. Nationwide 90FM (facebook.com/nationwideradiojm)
 *   5. RJR News
 *
 * Flow: paste FB post text → Claude Haiku extraction → Production sheet (confidence ≥ 7)
 *       or Review Queue (confidence < 7)
 *
 * Deploy: Extensions → Apps Script → Deploy → Web app (Execute as: Me, Access: Only myself)
 *
 * Adapted from: google-apps-script/trinidad/facebookSubmitter.gs
 * Created: 2026-03-17
 */

// ============================================================================
// WEB APP ENDPOINTS
// ============================================================================

/**
 * Serve the HTML form
 */
function doGet() {
  return HtmlService.createHtmlOutput(getFacebookSubmitterHtml())
    .setTitle('Crime Hotspots - Facebook Submitter')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handle form submission
 * @param {Object} e - Form submission event
 * @returns {Object} JSON response with results
 */
function submitFacebookPost(postText, sourceUrl, targetYear) {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log(`   FACEBOOK POST SUBMISSION (${targetYear || '2026'})   `);
  Logger.log('═══════════════════════════════════════════════');

  try {
    // Validate inputs
    if (!postText || postText.trim().length < 20) {
      return {
        success: false,
        error: 'Post text is too short. Please paste the full Facebook post (minimum 20 characters).'
      };
    }

    const cleanUrl = (sourceUrl && sourceUrl.trim()) ? sourceUrl.trim() : 'https://facebook.com/manual-entry';
    const cleanText = postText.trim();

    Logger.log(`Post text length: ${cleanText.length} chars`);
    Logger.log(`Source URL: ${cleanUrl}`);

    // Use today's date as the published date (user ensures date is in the post text)
    const publishedDate = new Date();

    // Extract first line or first 80 chars as a pseudo-title for Claude
    const firstLine = cleanText.split('\n')[0].substring(0, 80);
    Logger.log(`Pseudo-title: ${firstLine}`);

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Extract crime data using Claude Haiku
    // (Reuses existing extractCrimeData from claudeClient.gs)
    // ═══════════════════════════════════════════════════════════
    Logger.log('Calling Claude Haiku for extraction...');
    const extracted = extractCrimeData(cleanText, firstLine, cleanUrl, publishedDate, { skipExclusions: true });

    if (!extracted.crimes || extracted.crimes.length === 0) {
      Logger.log('No crimes extracted from post');
      return {
        success: false,
        error: 'No crime incidents detected in this post. Claude confidence: ' + (extracted.confidence || 0) +
               (extracted.ambiguities && extracted.ambiguities.length > 0
                 ? '\nReason: ' + extracted.ambiguities.join(', ')
                 : '')
      };
    }

    Logger.log(`Extracted ${extracted.crimes.length} crime(s), confidence: ${extracted.confidence}`);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Route each crime to Production or Review Queue
    // (Reuses existing appendToProduction/appendToReviewQueue from processor.gs)
    // ═══════════════════════════════════════════════════════════
    const results = [];

    extracted.crimes.forEach((crime, index) => {
      Logger.log(`Processing crime ${index + 1}/${extracted.crimes.length}: ${crime.headline}`);

      // Process crime types (converts all_crime_types → primary/related)
      const crimeTypes = processLegacyCrimeType(crime);

      // Filter out non-Jamaica crimes
      const validLocations = ['Jamaica'];
      if (crime.location_country && !validLocations.includes(crime.location_country)) {
        Logger.log(`  Skipped: Crime in ${crime.location_country}`);
        results.push({
          headline: crime.headline,
          status: 'skipped',
          reason: `Crime in ${crime.location_country}, not Jamaica`
        });
        return;
      }

      // Filter out invalid crime types
      if (crimeTypes.primary === 'Other' || !crimeTypes.primary || crimeTypes.primary === 'Unknown') {
        Logger.log(`  Skipped: Invalid crime type "${crimeTypes.primary}"`);
        results.push({
          headline: crime.headline,
          status: 'skipped',
          reason: `Invalid crime type: ${crimeTypes.primary}`
        });
        return;
      }

      // Ensure source URL is on each crime
      crime.source_url = cleanUrl;

      // Route based on target year
      if (targetYear === '2025') {
        appendTo2025Sheet(crime, publishedDate, crimeTypes);
        results.push({
          headline: crime.headline,
          status: 'production',
          destination: 'FR1 (2025)',
          crimeType: crimeTypes.primary,
          date: crime.crime_date,
          area: crime.area
        });
        Logger.log(`  ✅ Added to FR1 2025 sheet`);
      } else {
        appendToProduction(crime, publishedDate, crimeTypes);
        results.push({
          headline: crime.headline,
          status: 'production',
          destination: 'Production (2026)',
          crimeType: crimeTypes.primary,
          date: crime.crime_date,
          area: crime.area
        });
        Logger.log(`  ✅ Added to Production 2026`);
      }
    });

    Logger.log('═══════════════════════════════════════════════');
    Logger.log(`✅ Submission complete: ${results.length} crime(s) processed`);
    Logger.log('═══════════════════════════════════════════════');

    // Build sheet URL for quick verification
    var sheetUrl = '';
    if (targetYear === '2025') {
      sheetUrl = 'https://docs.google.com/spreadsheets/d/' + FR1_SPREADSHEET_ID + '/edit';
    } else {
      sheetUrl = 'https://docs.google.com/spreadsheets/d/' + SpreadsheetApp.getActiveSpreadsheet().getId() + '/edit';
    }

    return {
      success: true,
      crimesProcessed: results.length,
      confidence: extracted.confidence,
      results: results,
      sheetUrl: sheetUrl
    };

  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    Logger.log(`Stack: ${error.stack}`);
    return {
      success: false,
      error: `Processing error: ${error.message}`
    };
  }
}

// ============================================================================
// 2025 SHEET WRITER
// ============================================================================

/**
 * Append crime data to the 2025 Form Responses 1 sheet
 * Column order: Date, Headline, primaryCrimeType, relatedCrimeTypes, victimCount, Street Address, Location, Area, Region, Island, URL, Source, Latitude, Longitude, Summary
 *
 * @param {Object} crime - Extracted crime data
 * @param {Date} publishedDate - Fallback date
 * @param {Object} crimeTypes - {primary, related}
 */
function appendTo2025Sheet(crime, publishedDate, crimeTypes) {
  const ss = SpreadsheetApp.openById(FR1_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(FR1_SHEET_NAME);

  if (!sheet) {
    throw new Error(`Sheet "${FR1_SHEET_NAME}" not found in spreadsheet ${FR1_SPREADSHEET_ID}`);
  }

  // Geocode the address
  const fullAddress = `${crime.street || ''}, ${crime.area || ''}, Jamaica`;
  const geocoded = geocodeAddress(fullAddress);

  // Format date as MM/DD/YYYY (matching existing sheet format)
  const validatedDate = validateAndFormatDate(crime.crime_date, publishedDate || new Date());

  const victimCount = crime.victimCount ||
                      (crime.victims && Array.isArray(crime.victims) ? crime.victims.length : 1);

  appendRowByHeaders(sheet, {
    'Timestamp':          new Date(),
    'Date':               validatedDate,
    'Headline':           crime.headline || 'No headline',
    'primaryCrimeType':   crimeTypes.primary,
    'relatedCrimeTypes':  crimeTypes.related || '',
    'victimCount':        victimCount,
    'Street Address':     crime.street || '',
    'Location':           geocoded.plus_code || '',
    'Area':               crime.area || '',
    'URL':                crime.source_url || '',
    'Source':             '',
    'Latitude':           geocoded.lat || '',
    'Longitude':          geocoded.lng || '',
    'Summary':            crime.details || '',
  });

  Logger.log(`✅ Added to 2025 FR1: ${crime.headline}`);
}

