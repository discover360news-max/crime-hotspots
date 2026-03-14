/**
 * 2025 Duplicate Row Reviewer & Merger
 *
 * A standalone GAS web app (separate project — avoids doGet() collision in
 * the main trinidad pipeline). Identifies 2025 sheet rows where the same
 * incident was entered multiple times with different crimeType values, and
 * lets you review + selectively merge them via a browser UI.
 *
 * Setup:
 *   1. Create a new GAS project (separate from the main pipeline)
 *   2. Copy dedup.gs and index.html into it
 *   3. Fill in SPREADSHEET_ID and SHEET_NAME below
 *   4. Deploy → New Deployment → Web App
 *      Execute as: Me | Who has access: Only myself
 *   5. Open the web app URL
 */

// ============================================================================
// CONFIG — fill in before deploying
// ============================================================================

const CFG = {
  SPREADSHEET_ID: '1ornc_adllfJeA9V984qFCDdwfrEEX2H6rNH6nNQUHCQ', // from edit URL: /spreadsheets/d/THIS_PART/edit
  SHEET_NAME:     'Form Responses 1',          // the editable source sheet (NOT Production (2025))
  SHEET_GID:      '1749261532',  // gid= for Form Responses 1 tab (used for row links)
  THRESHOLD:      0.70,                        // headline similarity floor (0–1)
};

// ============================================================================
// SEVERITY MAP — mirrors crimeSchema.ts / schema.gs
// ============================================================================

const SEVERITY = {
  'Murder':           10,
  'Attempted Murder': 9,
  'Kidnapping':       8,
  'Sexual Assault':   7,
  'Shooting':         6,
  'Assault':          5,
  'Home Invasion':    5,
  'Carjacking':       5,
  'Arson':            4,
  'Robbery':          4,
  'Domestic Violence':4,
  'Extortion':        3,
  'Burglary':         3,
  'Theft':            2,
  'Seizures':         1,
};

// ============================================================================
// WEB APP ENTRY POINT
// ============================================================================

function doGet() {
  const template = HtmlService.createTemplateFromFile('index');
  template.spreadsheetId = CFG.SPREADSHEET_ID;
  template.sheetGid      = CFG.SHEET_GID;
  return template.evaluate()
    .setTitle('2025 Dedup Review')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================================
// SERVER — getDiagnostics()  (run this first to verify the sheet is readable)
// ============================================================================

/**
 * Returns what the script actually sees in the sheet.
 * Call this from the browser console via:
 *   google.script.run.withSuccessHandler(console.log).getDiagnostics()
 *
 * Or run it directly in the GAS editor (Run → getDiagnostics) and check Logs.
 */
function getDiagnostics() {
  const ss    = SpreadsheetApp.openById(CFG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CFG.SHEET_NAME);

  if (!sheet) {
    return {
      error: 'Sheet "' + CFG.SHEET_NAME + '" not found.',
      availableTabs: ss.getSheets().map(s => s.getName()),
    };
  }

  const data   = sheet.getDataRange().getValues();
  const colMap = _buildColMap(data[0]);

  // Collect a sample of rows to show what's being parsed
  const sample = [];
  for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
    const r = data[i];
    sample.push({
      row:       i + 1,
      date:      _getCol(r, colMap, 'Date'),
      headline:  _getCol(r, colMap, 'Headline').substring(0, 60),
      crimeType: _getCol(r, colMap, 'Crime Type'),
      area:      _getCol(r, colMap, 'Area'),
      secondary: _getCol(r, colMap, 'Secondary Crime Types'),
      dupCheck:  _getCol(r, colMap, 'DUP: CHECK'),
    });
  }

  // Find the closest non-matching pairs (to diagnose why threshold is killing them)
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const headline = _getCol(r, colMap, 'Headline');
    const date     = _getCol(r, colMap, 'Date');
    if (!headline || !date) continue;
    rows.push({
      dataIndex: i,
      headline,
      date,
      areaLower:  _getCol(r, colMap, 'Area').toLowerCase().trim(),
      crimeType:  _getCol(r, colMap, 'Crime Type'),
    });
  }

  // Find top-10 closest pairs regardless of threshold
  const candidates = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i], b = rows[j];
      if (a.areaLower !== b.areaLower) continue;
      if (!_isSameDate(a.date, b.date))  continue;
      if (a.crimeType === b.crimeType)   continue;
      const sim = _calcSimilarity(a.headline, b.headline);
      if (sim >= 0.50) { // low floor just to surface anything close
        candidates.push({
          sim:       Math.round(sim * 100),
          date:      a.date,
          area:      a.areaLower,
          crimeA:    a.crimeType,
          crimeB:    b.crimeType,
          headlineA: a.headline.substring(0, 60),
          headlineB: b.headline.substring(0, 60),
        });
      }
    }
  }
  candidates.sort((a, b) => b.sim - a.sim);

  return {
    sheetFound:    true,
    sheetName:     CFG.SHEET_NAME,
    totalRows:     data.length - 1,
    headers:       data[0].filter(Boolean),
    sample,
    topCandidates: candidates.slice(0, 10), // closest pairs even below 70% threshold
    threshold:     CFG.THRESHOLD,
  };
}

// ============================================================================
// SERVER — getSheetData()  (analysis moved to browser — no GAS timeout risk)
// ============================================================================

/**
 * Read the 2025 sheet and return raw row data for client-side analysis.
 *
 * All URL matching, headline-similarity scoring, and connected-component
 * grouping run in the browser instead of here — browsers are orders of
 * magnitude faster than GAS V8 for CPU-heavy loops and have no execution
 * time limit.  This function just does a single sheet read and returns.
 *
 * @returns {{ rows: Object[], threshold: number, spreadsheetId: string, sheetGid: string }}
 */
function getSheetData() {
  const ss    = SpreadsheetApp.openById(CFG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CFG.SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + CFG.SHEET_NAME + '" not found. Check CFG.SHEET_NAME.');
  }

  // getDisplayValues() returns dates as "M/D/YYYY" display strings instead of
  // JS Date objects — avoids the GAS timezone-mismatch bug (see B004).
  const data   = sheet.getDataRange().getDisplayValues();
  const colMap = _buildColMap(data[0]);
  const rows   = [];

  for (let i = 1; i < data.length; i++) {
    const r         = data[i];
    const headline  = _getCol(r, colMap, 'Headline');
    const date      = _getCol(r, colMap, 'Date');
    const crimeType = _getCol(r, colMap, 'Crime Type');

    if (!headline || !date || !crimeType) continue;

    rows.push({
      sheetRow:  i + 1,       // 1-indexed for Sheets API
      headline,
      date,
      area:      _getCol(r, colMap, 'Area'),
      crimeType,
      secondary: _getCol(r, colMap, 'Secondary Crime Types'),
      storyId:   _getCol(r, colMap, 'Story_ID'),
      dupCheck:  _getCol(r, colMap, 'DUP: CHECK'),
      url:       _getCol(r, colMap, 'URL'),
    });
  }

  return {
    rows,
    threshold:     CFG.THRESHOLD,
    spreadsheetId: CFG.SPREADSHEET_ID,
    sheetGid:      CFG.SHEET_GID,
  };
}

// ============================================================================
// SERVER — applyMerges()
// ============================================================================

/**
 * Apply selected merges to the sheet.
 *
 * For each selected group:
 *   1. Updates the keeper row's "Secondary Crime Types" cell
 *   2. Writes victimCount to the keeper row (creates the column if absent)
 *   3. Deletes all merger rows (bottom-up to avoid index shifting)
 *
 * victimCount is added at the END of the sheet to avoid disrupting any
 * position-based formulas in Production (2025).
 *
 * @param {string[]} selectedIds     - IDs of groups to apply
 * @param {Object[]} allGroups       - Full group array built by client-side buildGroups()
 * @param {Object}   victimCounts    - Map of groupId → victimCount (from UI inputs)
 * @param {Object}   headlines       - Map of groupId → chosen headline (from UI picker)
 * @returns {{ applied: number, deleted: number, log: string[] }}
 */
function applyMerges(selectedIds, allGroups, victimCounts, headlines) {
  const ss    = SpreadsheetApp.openById(CFG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CFG.SHEET_NAME);

  if (!sheet) throw new Error('Sheet "' + CFG.SHEET_NAME + '" not found.');

  const data      = sheet.getDataRange().getValues();
  const colMap    = _buildColMap(data[0]);
  const secColIdx = colMap.get('secondary crime types');

  if (secColIdx === undefined) {
    throw new Error('"Secondary Crime Types" column not found. Check that the sheet header matches exactly.');
  }

  // ── Ensure victimCount column exists (appended to avoid disrupting formulas) ─
  let vcColIdx = colMap.get('victimcount');
  if (vcColIdx === undefined) {
    const lastCol = sheet.getLastColumn();
    vcColIdx      = lastCol; // 0-based: new col is at index lastCol (after existing)
    sheet.getRange(1, lastCol + 1).setValue('victimCount');
    Logger.log('Created victimCount column at position ' + (lastCol + 1));
  }

  // ── Headline column index ─────────────────────────────────────────────────
  const hlColIdx = colMap.get('headline');

  const selectedGroups = allGroups.filter(g => selectedIds.indexOf(g.id) !== -1);
  const rowsToDelete   = [];
  const log            = [];

  // ── Update keeper rows ────────────────────────────────────────────────────
  for (const group of selectedGroups) {
    const vc             = (victimCounts && victimCounts[group.id]) ? Number(victimCounts[group.id]) : group.suggestedVictimCount;
    const chosenHeadline = (headlines && headlines[group.id]) ? headlines[group.id] : null;

    // Secondary Crime Types (secColIdx is 0-based; Sheets range() uses 1-based)
    sheet.getRange(group.keeper.sheetRow, secColIdx + 1).setValue(group.resultSecondary);

    // victimCount
    sheet.getRange(group.keeper.sheetRow, vcColIdx + 1).setValue(vc);

    // Headline override (only write if user chose a different headline)
    if (chosenHeadline && chosenHeadline !== group.keeper.headline && hlColIdx !== undefined) {
      sheet.getRange(group.keeper.sheetRow, hlColIdx + 1).setValue(chosenHeadline);
      log.push('✏️  Row ' + group.keeper.sheetRow + ': Headline → "' + chosenHeadline.substring(0, 60) + '"');
    }

    log.push(
      '✅ Row ' + group.keeper.sheetRow + ' (' + group.keeper.crimeType + '): ' +
      'Secondary → "' + group.resultSecondary + '" | victimCount → ' + vc +
      ' [' + group.mergeType + ' / ' + group.detectedBy + ']'
    );

    for (const m of group.mergers) {
      rowsToDelete.push(m.sheetRow);
      log.push('🗑️  Row ' + m.sheetRow + ' (' + m.crimeType + ') queued for deletion');
    }
  }

  // ── Delete merger rows (bottom-up to avoid row-index shifting) ────────────
  rowsToDelete.sort((a, b) => b - a);

  for (const rowNum of rowsToDelete) {
    sheet.deleteRow(rowNum);
    log.push('✅ Deleted row ' + rowNum);
  }

  const summary = [
    '',
    '──────────────────────────────',
    '✅ Done.',
    '   Groups merged: ' + selectedGroups.length,
    '   Rows deleted:  ' + rowsToDelete.length,
    '',
    '⚠️  Re-sync D1 when ready:',
    '   POST https://crime-sync.discover360news.workers.dev/sync',
  ];

  log.push(...summary);

  return {
    applied: selectedGroups.length,
    deleted: rowsToDelete.length,
    log,
  };
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/** Build a lowercase header-name → 0-based column index map. */
function _buildColMap(headerRow) {
  const map = new Map();
  headerRow.forEach((h, i) => {
    if (h) map.set(h.toString().toLowerCase().trim(), i);
  });
  return map;
}

/** Get column value by header name (case-insensitive). Returns '' if missing. */
function _getCol(row, colMap, name) {
  const idx = colMap.get(name.toLowerCase().trim());
  return idx !== undefined ? (row[idx] || '').toString().trim() : '';
}

/** Parse a date string in M/D/YYYY format (as stored in the 2025 sheet). */
function _parseDate(dateStr) {
  if (!dateStr) return null;
  const s = dateStr.toString().trim();
  const parts = s.split('/');
  if (parts.length === 3) {
    const m = parseInt(parts[0], 10) - 1;
    const d = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

/** Return true if two date strings fall on the same calendar day. */
function _isSameDate(dateStrA, dateStrB) {
  const a = _parseDate(dateStrA);
  const b = _parseDate(dateStrB);
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

/** 0–1 similarity score between two strings (Levenshtein ratio). */
function _calcSimilarity(strA, strB) {
  const a = strA.toLowerCase().trim();
  const b = strB.toLowerCase().trim();
  const longer  = a.length >= b.length ? a : b;
  const shorter = a.length < b.length  ? a : b;
  if (longer.length === 0) return 1.0;
  const dist = _levenshtein(longer, shorter);
  return (longer.length - dist) / longer.length;
}

/** Levenshtein edit distance. */
function _levenshtein(s, t) {
  const m = s.length;
  const n = t.length;
  const dp = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
    for (let j = 1; j <= n; j++) dp[i][j] = 0;
  }
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = s[i - 1] === t[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
