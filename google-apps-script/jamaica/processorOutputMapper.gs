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
      const fullAddress = `${crime.street || ''}, ${crime.area || ''}, Jamaica`;
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
          'URL':                 crime.source_url || '',
          'Source':              '',
          'Confidence':          6,  // Lowered due to potential duplicate
          'Ambiguities':         `POTENTIAL DUPLICATE: ${potentialDupe.reason}`,
          'Status':              'pending',
          'Notes':               '',
          'Date_Published':      Utilities.formatDate(new Date(), 'America/Jamaica', 'M/d/yyyy'),
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
        'URL':                  crime.source_url || '',
        'Source':               '',
        'Safety_Tip_Flag':      crime.safety_tip_flag || '',
        'Safety_Tip_Category':  Array.isArray(crime.safety_tip_category) ? crime.safety_tip_category.join(', ') : (crime.safety_tip_category || ''),
        'Safety_Tip_Context':   Array.isArray(crime.safety_tip_context) ? crime.safety_tip_context.join(', ') : (crime.safety_tip_context || ''),
        'Tactic_Noted':         crime.tactic_noted || '',
        'Date_Published':       Utilities.formatDate(new Date(), 'America/Jamaica', 'M/d/yyyy'),
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

    const fullAddress = `${crime.street || ''}, ${crime.area || ''}, Jamaica`;
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
      'URL':                  crime.source_url || '',
      'Source':               '',
      'Confidence':           confidence,
      'Ambiguities':          (ambiguities || []).join('; '),
      'Status':               'pending',
      'Notes':                '',
      'Date_Published':       Utilities.formatDate(new Date(), 'America/Jamaica', 'M/d/yyyy'),
      'Date_Updated':         ''
    });

    Logger.log(`⚠️ Added to review queue: ${crime.headline}`);
  }

