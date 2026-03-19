// ============================================================================
// URL INDEX CACHE (Performance Optimization)
// ============================================================================

/**
 * Build URL index from multiple sheets for fast duplicate checking
 * Caches individual sheets separately (Raw Archive not cached - too large)
 * @returns {Object} URL index by sheet name
 */
function buildUrlIndex() {
  const cache = CacheService.getScriptCache();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('📥 Building URL index from sheets...');
  const startTime = Date.now();

  const urlIndex = {
    rawArticles: [],
    rawArchive: [],
    production: [],
    productionArchive: []
  };

  // Try to get Raw Articles from cache
  const cachedRaw = cache.get('url_index_raw');
  if (cachedRaw) {
    urlIndex.rawArticles = JSON.parse(cachedRaw);
    Logger.log('   ✓ Raw Articles from cache');
  } else {
    try {
      const rawSheet = ss.getSheetByName(SHEET_NAMES.RAW_ARTICLES);
      if (rawSheet && rawSheet.getLastRow() > 1) {
        const urls = rawSheet.getRange(2, 4, rawSheet.getLastRow() - 1, 1).getValues();
        urlIndex.rawArticles = urls.flat().filter(url => url);
        cache.put('url_index_raw', JSON.stringify(urlIndex.rawArticles), 3600);
      }
    } catch (e) {
      Logger.log(`⚠️ Error indexing Raw Articles: ${e.message}`);
    }
  }

  // Raw Archive - DON'T CACHE (1516 URLs = ~121 KB, exceeds 100 KB limit)
  // Build on demand each time - acceptable since only checked once per article
  try {
    const archiveSheet = ss.getSheetByName('Raw Articles Archive');
    if (archiveSheet && archiveSheet.getLastRow() > 1) {
      const urls = archiveSheet.getRange(2, 4, archiveSheet.getLastRow() - 1, 1).getValues();
      urlIndex.rawArchive = urls.flat().filter(url => url);
    }
  } catch (e) {
    Logger.log(`⚠️ Error indexing Raw Articles Archive: ${e.message}`);
  }

  // Try to get Production from cache
  const cachedProd = cache.get('url_index_production');
  if (cachedProd) {
    urlIndex.production = JSON.parse(cachedProd);
    Logger.log('   ✓ Production from cache');
  } else {
    try {
      const prodSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTION);
      if (prodSheet && prodSheet.getLastRow() > 1) {
        const urls = prodSheet.getRange(2, 8, prodSheet.getLastRow() - 1, 1).getValues();
        urlIndex.production = urls.flat().filter(url => url);
        cache.put('url_index_production', JSON.stringify(urlIndex.production), 3600);
      }
    } catch (e) {
      Logger.log(`⚠️ Error indexing Production: ${e.message}`);
    }
  }

  // Production Archive - DON'T CACHE (will grow large over time)
  // Read on-demand like Raw Archive
  try {
    const prodArchiveSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTION_ARCHIVE);
    if (prodArchiveSheet && prodArchiveSheet.getLastRow() > 1) {
      const urls = prodArchiveSheet.getRange(2, 8, prodArchiveSheet.getLastRow() - 1, 1).getValues();
      urlIndex.productionArchive = urls.flat().filter(url => url);
    }
  } catch (e) {
    Logger.log(`⚠️ Error indexing Production Archive: ${e.message}`);
  }

  const elapsed = Date.now() - startTime;
  Logger.log(`✅ URL index built in ${elapsed}ms`);
  Logger.log(`   - Raw Articles: ${urlIndex.rawArticles.length} URLs (cached)`);
  Logger.log(`   - Raw Archive: ${urlIndex.rawArchive.length} URLs (not cached - too large)`);
  Logger.log(`   - Production: ${urlIndex.production.length} URLs (cached)`);
  Logger.log(`   - Production Archive: ${urlIndex.productionArchive.length} URLs (not cached - will grow)`);

  return urlIndex;
}

/**
 * Force refresh URL index cache
 * Run this after bulk operations or when cache seems stale
 */
function refreshUrlIndexCache() {
  const cache = CacheService.getScriptCache();

  // Remove cached keys only (Raw Archive & Production Archive not cached)
  cache.remove('url_index_raw');
  cache.remove('url_index_production');

  Logger.log('🗑️ URL index cache cleared (small sheets only)');

  const index = buildUrlIndex();
  Logger.log('✅ URL index cache refreshed');
  return index;
}

/**
 * Debug: Diagnose Raw Articles - Archive sheet structure
 * Run this to figure out why 0 URLs are being found
 */
function debugRawArchiveSheet() {
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('   DEBUGGING RAW ARTICLES - ARCHIVE SHEET');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetNames = ss.getSheets().map(sheet => sheet.getName());

  Logger.log('All sheet names in spreadsheet:');
  sheetNames.forEach((name, index) => {
    Logger.log(`  ${index + 1}. "${name}"`);
  });
  Logger.log('');

  // Try different possible names
  const possibleNames = [
    'Raw Articles - Archive',
    'Raw Articles-Archive',
    'Raw Articles Archive',
    'RawArticles-Archive',
    'Raw_Articles_Archive'
  ];

  Logger.log('Trying different sheet name variations:');
  Logger.log('');

  possibleNames.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      Logger.log(`✅ FOUND: "${name}"`);
      Logger.log(`   Total rows: ${sheet.getLastRow()}`);
      Logger.log(`   Total columns: ${sheet.getLastColumn()}`);

      // Check first few rows
      if (sheet.getLastRow() > 0) {
        const headers = sheet.getRange(1, 1, 1, Math.min(8, sheet.getLastColumn())).getValues()[0];
        Logger.log(`   Headers: ${headers.join(' | ')}`);

        if (sheet.getLastRow() > 1) {
          // Check column D (URL column - 0-indexed = 3)
          const firstDataRow = sheet.getRange(2, 1, 1, Math.min(8, sheet.getLastColumn())).getValues()[0];
          Logger.log(`   First data row:`);
          firstDataRow.forEach((val, idx) => {
            Logger.log(`     Col ${String.fromCharCode(65 + idx)}: ${val ? val.toString().substring(0, 50) : '(empty)'}`);
          });

          // Count non-empty URLs in column D
          if (sheet.getLastColumn() >= 4) {
            const urlColumn = sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).getValues();
            const nonEmptyUrls = urlColumn.filter(row => row[0] && row[0].toString().trim().length > 0).length;
            Logger.log(`   URLs in Column D: ${nonEmptyUrls} non-empty out of ${sheet.getLastRow() - 1} rows`);
          }
        }
      }
      Logger.log('');
    } else {
      Logger.log(`❌ NOT FOUND: "${name}"`);
    }
  });

  Logger.log('═══════════════════════════════════════════════');
  Logger.log('DIAGNOSIS:');
  Logger.log('');
  Logger.log('If no sheet was found:');
  Logger.log('  → Copy the EXACT sheet name from your spreadsheet tab');
  Logger.log('  → Share it with me');
  Logger.log('');
  Logger.log('If sheet was found but 0 URLs:');
  Logger.log('  → Check if URLs are in Column D');
  Logger.log('  → Check if Column D has data');
  Logger.log('═══════════════════════════════════════════════');
}
