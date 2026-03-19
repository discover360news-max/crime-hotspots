/**
 * Facebook Post Submitter - Web App
 * Quick-entry tool for manually submitting crime posts from Facebook
 *
 * Reuses existing pipeline: Claude Haiku extraction → Production sheet
 * Supports 2025 (FR1 sheet, different spreadsheet) and 2026 (Production sheet, pipeline spreadsheet)
 * Deploy: Extensions → Apps Script → Deploy → Web app (Execute as: Me, Access: Only myself)
 *
 * Created: February 2026
 */

// 2025 Form Responses 1 sheet (different spreadsheet)
const FR1_SPREADSHEET_ID = '1ornc_adllfJeA9V984qFCDdwfrEEX2H6rNH6nNQUHCQ';
const FR1_SHEET_NAME = 'Form Responses 1';

// Jamaica pipeline spreadsheet (NOT the LIVE sheet — the sheet with Production, Review Queue, etc.)
// To find: open the Jamaica Crime Hotspots Google Sheet → copy the ID from the URL bar
// URL format: https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
const JAMAICA_PIPELINE_SHEET_ID = 'YOUR_JAMAICA_SHEET_ID_HERE';
const JAMAICA_PRODUCTION_SHEET_NAME = 'Production';

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
function submitFacebookPost(postText, sourceUrl, targetYear, targetCountry) {
  const country = targetCountry || 'TT';
  Logger.log('═══════════════════════════════════════════════');
  Logger.log(`   FACEBOOK POST SUBMISSION (${targetYear || '2026'} | ${country})   `);
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
    // For Jamaica: prepend country context so Claude uses Jamaican parish/area names
    const enrichedText = country === 'JM'
      ? '[LOCATION CONTEXT: Jamaica — extract Jamaican parish and community names for the area field. Set location_country to "Jamaica".]\n\n' + cleanText
      : cleanText;
    const extracted = extractCrimeData(enrichedText, firstLine, cleanUrl, publishedDate, { skipExclusions: true });

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

      // Filter: verify crime is in the expected country
      if (country === 'JM') {
        // For Jamaica: accept 'Jamaica' or null/empty (Claude may not always set it explicitly)
        if (crime.location_country && crime.location_country !== 'Jamaica') {
          Logger.log(`  Skipped: Crime in ${crime.location_country}, expected Jamaica`);
          results.push({
            headline: crime.headline,
            status: 'skipped',
            reason: `Crime in ${crime.location_country}, expected Jamaica`
          });
          return;
        }
      } else {
        // For T&T: strict location check
        const validTTLocations = ['Trinidad', 'Trinidad and Tobago', 'Trinidad & Tobago', 'Tobago'];
        if (crime.location_country && !validTTLocations.includes(crime.location_country)) {
          Logger.log(`  Skipped: Crime in ${crime.location_country}`);
          results.push({
            headline: crime.headline,
            status: 'skipped',
            reason: `Crime in ${crime.location_country}, not Trinidad`
          });
          return;
        }
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

      // Route: Jamaica → Jamaica Production; T&T → year-based T&T routing
      if (country === 'JM') {
        appendToJamaicaProduction(crime, publishedDate, crimeTypes);
        results.push({
          headline: crime.headline,
          status: 'production',
          destination: 'Jamaica Production',
          crimeType: crimeTypes.primary,
          date: crime.crime_date,
          area: crime.area,
          country: 'JM'
        });
        Logger.log(`  ✅ Added to Jamaica Production`);
      } else if (targetYear === '2025') {
        appendTo2025Sheet(crime, publishedDate, crimeTypes);
        results.push({
          headline: crime.headline,
          status: 'production',
          destination: 'T&T FR1 (2025)',
          crimeType: crimeTypes.primary,
          date: crime.crime_date,
          area: crime.area,
          country: 'TT'
        });
        Logger.log(`  ✅ Added to T&T FR1 2025 sheet`);
      } else {
        appendToProduction(crime, publishedDate, crimeTypes);
        results.push({
          headline: crime.headline,
          status: 'production',
          destination: 'T&T Production (2026)',
          crimeType: crimeTypes.primary,
          date: crime.crime_date,
          area: crime.area,
          country: 'TT'
        });
        Logger.log(`  ✅ Added to T&T Production 2026`);
      }
    });

    Logger.log('═══════════════════════════════════════════════');
    Logger.log(`✅ Submission complete: ${results.length} crime(s) processed`);
    Logger.log('═══════════════════════════════════════════════');

    // Build sheet URL for quick verification
    var sheetUrl = '';
    if (country === 'JM') {
      sheetUrl = 'https://docs.google.com/spreadsheets/d/' + JAMAICA_PIPELINE_SHEET_ID + '/edit';
    } else if (targetYear === '2025') {
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
  const fullAddress = `${crime.street || ''}, ${crime.area || ''}, Trinidad and Tobago`;
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
    'Region':             '',
    'Island':             'Trinidad',
    'URL':                crime.source_url || '',
    'Source':             '',
    'Latitude':           geocoded.lat || '',
    'Longitude':          geocoded.lng || '',
    'Summary':            crime.details || '',
  });

  Logger.log(`✅ Added to 2025 FR1: ${crime.headline}`);
}

// ============================================================================
// JAMAICA PRODUCTION SHEET WRITER
// ============================================================================

/**
 * Append crime data to the Jamaica Production sheet.
 * Opens the Jamaica pipeline spreadsheet by ID (this runs from the T&T GAS project).
 * Column schema mirrors T&T Production sheet — shared schema across countries.
 *
 * IMPORTANT: Set JAMAICA_PIPELINE_SHEET_ID at the top of this file before use.
 * Get the ID from the Jamaica spreadsheet URL bar.
 *
 * NOTE: Claude extracts with T&T context (this GAS project's claudeClient.gs).
 * The '[LOCATION CONTEXT: Jamaica]' prepend improves area extraction but is not perfect.
 * A Jamaica-specific extraction context is deferred to Phase A4.
 *
 * @param {Object} crime - Extracted crime data
 * @param {Date} publishedDate - Fallback date
 * @param {Object} crimeTypes - {primary, related}
 */
function appendToJamaicaProduction(crime, publishedDate, crimeTypes) {
  if (!JAMAICA_PIPELINE_SHEET_ID || JAMAICA_PIPELINE_SHEET_ID === 'YOUR_JAMAICA_SHEET_ID_HERE') {
    throw new Error(
      'JAMAICA_PIPELINE_SHEET_ID is not configured. Open facebookSubmitter.gs and set the const at the top of the file with the Jamaica spreadsheet ID.'
    );
  }

  const ss = SpreadsheetApp.openById(JAMAICA_PIPELINE_SHEET_ID);
  const sheet = ss.getSheetByName(JAMAICA_PRODUCTION_SHEET_NAME);

  if (!sheet) {
    throw new Error(
      `Sheet "${JAMAICA_PRODUCTION_SHEET_NAME}" not found in Jamaica spreadsheet ${JAMAICA_PIPELINE_SHEET_ID}`
    );
  }

  // Geocode using Jamaica address format
  const fullAddress = `${crime.street || ''}, ${crime.area || ''}, Jamaica`;
  const geocoded = geocodeAddress(fullAddress);

  // Format date as MM/DD/YYYY (matching Production sheet format)
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
    'Region':             crime.region || '',
    'Island':             'Jamaica',
    'URL':                crime.source_url || '',
    'Source':             '',
    'Latitude':           geocoded.lat || '',
    'Longitude':          geocoded.lng || '',
    'Summary':            crime.details || '',
  });

  Logger.log(`✅ Added to Jamaica Production: ${crime.headline}`);
}

// ============================================================================
// HTML TEMPLATE
// ============================================================================
