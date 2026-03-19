
// ============================================================================
// DUPLICATE DETECTION ENHANCEMENT
// ============================================================================

/**
 * PRE-GEMINI: Check if raw article is duplicate (SAVE API CALLS)
 * Checks 3 sheets: Raw Articles, Raw Articles - Archive, Production (URL only)
 *
 * @param {string} title - Article title (RSS headline)
 * @param {string} url - Article URL
 * @param {Date} publishedDate - Article publication date
 * @returns {Object} {isDuplicate, matchedIn, matchedRow, similarity, reason}
 */
function checkForRawArticleDuplicate(title, url, publishedDate) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Build/get URL index for fast lookups
    const urlIndex = buildUrlIndex();

    // NOTE: We skip checking Raw Articles because the articles being tested
    // are IN Raw Articles, so they would all match themselves!
    // We only check historical/processed sheets below.

    // ═══════════════════════════════════════════════════════════
    // CHECK 1: Raw Articles Archive (Historical - 1517+ rows)
    // ═══════════════════════════════════════════════════════════
    if (urlIndex.rawArchive.includes(url)) {
      return {
        isDuplicate: true,
        matchedIn: 'Raw Articles - Archive',
        matchedRow: null,
        similarity: 100,
        reason: 'Exact URL match (historical)'
      };
    }

    // Also check headline similarity in Archive (slower, but necessary)
    const archiveSheet = ss.getSheetByName('Raw Articles Archive');
    if (archiveSheet) {
      const headlineCheck = checkSheetForHeadlineSimilarity(archiveSheet, title, 3); // Column C
      if (headlineCheck.isDuplicate) {
        return {
          ...headlineCheck,
          matchedIn: 'Raw Articles - Archive'
        };
      }
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 2: Production (URL ONLY - already processed)
    // ═══════════════════════════════════════════════════════════
    if (urlIndex.production.includes(url)) {
      return {
        isDuplicate: true,
        matchedIn: 'Production',
        matchedRow: null,
        similarity: 100,
        reason: 'Article already processed (URL in Production)'
      };
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 3: Production Archive (URL ONLY - processed & archived)
    // ═══════════════════════════════════════════════════════════
    if (urlIndex.productionArchive.includes(url)) {
      return {
        isDuplicate: true,
        matchedIn: 'Production Archive',
        matchedRow: null,
        similarity: 100,
        reason: 'Article already processed and archived (URL in Production Archive)'
      };
    }

    // Not a duplicate - safe to process
    return {
      isDuplicate: false,
      matchedIn: null,
      matchedRow: null,
      similarity: 0,
      reason: 'No duplicate found - safe to process'
    };

  } catch (error) {
    Logger.log(`⚠️ Error checking raw article duplicates: ${error.message}`);
    return {
      isDuplicate: false,
      matchedIn: null,
      matchedRow: null,
      similarity: 0,
      reason: `Error: ${error.message}`
    };
  }
}

/**
 * POST-GEMINI: Check if extracted crime is duplicate (PREVENT DUPLICATE CRIMES)
 * Checks 2 sheets: Production, Production Archive
 * Uses crime-level matching: Victim + Date + Location, Headline similarity
 *
 * @param {string} title - Crime headline (Gemini-generated)
 * @param {string} url - Article URL
 * @param {Object} crimeData - Extracted crime data (victim, date, location)
 * @returns {Object} {isDuplicate, matchedIn, matchedRow, similarity, reason}
 */
function checkForCrimeDuplicate(title, url, crimeData) {
  try {
    // Check Production first
    const prodSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PRODUCTION);
    if (prodSheet) {
      const prodCheck = checkSheetForCrimeDuplicate(prodSheet, title, url, crimeData);
      if (prodCheck.isDuplicate) {
        return {
          ...prodCheck,
          matchedIn: 'Production'
        };
      }
    }

    // Check Production Archive
    const archiveSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PRODUCTION_ARCHIVE);
    if (archiveSheet) {
      const archiveCheck = checkSheetForCrimeDuplicate(archiveSheet, title, url, crimeData);
      if (archiveCheck.isDuplicate) {
        return {
          ...archiveCheck,
          matchedIn: 'Production Archive'
        };
      }
    }

    // Not a duplicate
    return {
      isDuplicate: false,
      matchedIn: null,
      matchedRow: null,
      similarity: 0,
      reason: 'No crime duplicate found'
    };

  } catch (error) {
    Logger.log(`⚠️ Error checking crime duplicates: ${error.message}`);
    return {
      isDuplicate: false,
      matchedIn: null,
      matchedRow: null,
      similarity: 0,
      reason: `Error: ${error.message}`
    };
  }
}

/**
 * Check sheet for headline similarity (for Raw Articles sheets)
 * @param {Sheet} sheet - Sheet to check
 * @param {string} title - Article title to match
 * @param {number} titleColumn - Column number for title (0-indexed)
 * @returns {Object} Duplicate check result
 */
function checkSheetForHeadlineSimilarity(sheet, title, titleColumn) {
  if (!sheet || !title) {
    return { isDuplicate: false, matchedRow: null, similarity: 0, reason: 'Invalid input' };
  }

  try {
    const data = sheet.getDataRange().getValues();

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const existingTitle = data[i][titleColumn];

      if (existingTitle) {
        const similarity = calculateSimilarity(existingTitle.toString(), title.toString());

        if (similarity >= PREFILTER_CONFIG.DUPLICATE_SIMILARITY_THRESHOLD) {
          return {
            isDuplicate: true,
            matchedRow: i + 1,
            similarity: similarity,
            reason: `Headline ${similarity}% similar`
          };
        }
      }
    }

    return {
      isDuplicate: false,
      matchedRow: null,
      similarity: 0,
      reason: 'No similar headline found'
    };

  } catch (error) {
    Logger.log(`⚠️ Error checking headline similarity: ${error.message}`);
    return { isDuplicate: false, matchedRow: null, similarity: 0, reason: `Error: ${error.message}` };
  }
}

/**
 * Check sheet for crime-level duplicates (for Production sheets)
 * Uses victim name + date + location matching and headline similarity
 * @param {Sheet} sheet - Sheet to check
 * @param {string} title - Crime headline (Gemini-generated)
 * @param {string} url - Article URL
 * @param {Object} crimeData - {victimName, crimeDate, area, street}
 * @returns {Object} Duplicate check result
 */
function checkSheetForCrimeDuplicate(sheet, title, url, crimeData) {
  if (!sheet) {
    return { isDuplicate: false, matchedRow: null, similarity: 0, reason: 'Sheet not found' };
  }

  try {
    const data = sheet.getDataRange().getValues();

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const existingHeadline = row[1]; // Column B
      const existingArea = row[5];     // Column F
      const existingUrl = row[7];      // Column H

      // Exact URL match
      if (existingUrl && url && existingUrl.toString() === url.toString()) {
        return {
          isDuplicate: true,
          matchedRow: i + 1,
          similarity: 100,
          reason: 'Exact URL match'
        };
      }

      // Headline similarity check
      if (existingHeadline && title) {
        const similarity = calculateSimilarity(existingHeadline.toString(), title.toString());

        if (similarity >= PREFILTER_CONFIG.DUPLICATE_SIMILARITY_THRESHOLD) {
          return {
            isDuplicate: true,
            matchedRow: i + 1,
            similarity: similarity,
            reason: `Crime headline ${similarity}% similar`
          };
        }
      }

      // TODO: Future enhancement - Victim + Date + Location matching
      // This would require parsing victim names from headlines
      // and comparing crime dates + areas
    }

    return {
      isDuplicate: false,
      matchedRow: null,
      similarity: 0,
      reason: 'No crime duplicate found'
    };

  } catch (error) {
    Logger.log(`⚠️ Error checking crime duplicates: ${error.message}`);
    return { isDuplicate: false, matchedRow: null, similarity: 0, reason: `Error: ${error.message}` };
  }
}
