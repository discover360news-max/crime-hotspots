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

      // Filter out non-Trinidad crimes
      const validLocations = ['Trinidad', 'Trinidad and Tobago', 'Trinidad & Tobago', 'Tobago'];
      if (crime.location_country && !validLocations.includes(crime.location_country)) {
        Logger.log(`  Skipped: Crime in ${crime.location_country}`);
        results.push({
          headline: crime.headline,
          status: 'skipped',
          reason: `Crime in ${crime.location_country}, not Trinidad`
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
 * Column order: Date, Headline, Crime Type, Street Address, Location, Area, Region, Island, URL, Source, Latitude, Longitude, Summary, Secondary Crime Types
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

  // 2025 column order (14 columns):
  // Date, Headline, Crime Type, Street Address, Location, Area, Region, Island, URL, Source, Latitude, Longitude, Summary, Secondary Crime Types
  sheet.appendRow([
    new Date(),                              // 1. Timestamp (Column A - hidden)
    validatedDate,                           // 1. Date
    crime.headline || 'No headline',         // 2. Headline
    crimeTypes.primary,                      // 3. Crime Type
    crime.street || '',                      // 4. Street Address
    geocoded.plus_code || '',                // 5. Location (Plus Code)
    crime.area || '',                        // 6. Area
    '',                                      // 7. Region (formula fills this)
    'Trinidad',                              // 8. Island
    crime.source_url || '',                  // 9. URL
    '',                                      // 10. Source (formula fills this)
    geocoded.lat || '',                      // 11. Latitude
    geocoded.lng || '',                      // 12. Longitude
    crime.details || '',                     // 13. Summary
    crimeTypes.related || ''                 // 14. Secondary Crime Types
  ]);

  Logger.log(`✅ Added to 2025 FR1: ${crime.headline}`);
}

// ============================================================================
// HTML TEMPLATE
// ============================================================================

function getFacebookSubmitterHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
    }
    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
    }
    .session-counter {
      font-size: 0.8rem;
      font-weight: 600;
      color: #0f172a;
      background: #86efac;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }
    .shortcut-hint {
      color: #64748b;
      font-size: 0.75rem;
    }
    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.375rem;
    }
    textarea {
      width: 100%;
      min-height: 200px;
      padding: 0.75rem;
      border: 1px solid #334155;
      border-radius: 8px;
      background: #1e293b;
      color: #e2e8f0;
      font-family: inherit;
      font-size: 0.9rem;
      line-height: 1.5;
      resize: vertical;
      margin-bottom: 1rem;
    }
    textarea:focus, input[type="url"]:focus {
      outline: none;
      border-color: #f43f5e;
      box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.2);
    }
    input[type="url"] {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid #334155;
      border-radius: 8px;
      background: #1e293b;
      color: #e2e8f0;
      font-family: inherit;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    input[type="url"]::placeholder, textarea::placeholder {
      color: #64748b;
    }
    button {
      width: 100%;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-submit {
      background: #f43f5e;
      color: white;
    }
    .btn-submit:hover { background: #e11d48; }
    .btn-submit:disabled {
      background: #475569;
      cursor: not-allowed;
    }
    .btn-clear {
      background: transparent;
      border: 1px solid #475569;
      color: #94a3b8;
      margin-top: 0.75rem;
    }
    .btn-clear:hover { border-color: #64748b; color: #cbd5e1; }
    .year-btn {
      flex: 1;
      padding: 0.5rem 1rem;
      border: 1px solid #475569;
      border-radius: 8px;
      background: #1e293b;
      color: #94a3b8;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .year-btn.active {
      background: #f43f5e;
      border-color: #f43f5e;
      color: white;
    }
    .year-btn:not(.active):hover { border-color: #64748b; color: #cbd5e1; }

    /* Duplicate warning */
    .duplicate-warning {
      display: none;
      background: #78350f;
      border: 1px solid #b45309;
      color: #fcd34d;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
      margin-bottom: 1rem;
    }

    /* Status area */
    .status {
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: 8px;
      display: none;
      font-size: 0.875rem;
      line-height: 1.6;
    }
    .status.loading {
      display: block;
      background: #1e293b;
      border: 1px solid #334155;
      color: #94a3b8;
    }
    .status.success {
      display: block;
      background: #052e16;
      border: 1px solid #166534;
      color: #86efac;
    }
    .status.error {
      display: block;
      background: #350a0a;
      border: 1px solid #991b1b;
      color: #fca5a5;
    }
    .crime-result {
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .crime-result:last-child { border-bottom: none; }
    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 0.5rem;
    }
    .badge-production { background: #166534; color: #86efac; }
    .badge-review { background: #78350f; color: #fcd34d; }
    .badge-skipped { background: #475569; color: #94a3b8; }

    /* Session history */
    .history-section {
      margin-top: 1.5rem;
      border-top: 1px solid #1e293b;
      padding-top: 1rem;
    }
    .history-toggle {
      width: 100%;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.375rem 0;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .history-toggle:hover { color: #cbd5e1; }
    .history-toggle .arrow { transition: transform 0.15s; display: inline-block; }
    .history-toggle .arrow.open { transform: rotate(90deg); }
    .history-list {
      display: none;
      margin-top: 0.5rem;
      max-height: 240px;
      overflow-y: auto;
    }
    .history-list.open { display: block; }
    .history-item {
      padding: 0.375rem 0.5rem;
      font-size: 0.75rem;
      color: #94a3b8;
      border-bottom: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .history-item:last-child { border-bottom: none; }
    .history-item .h-headline { color: #cbd5e1; flex: 1; }
    .history-item .h-meta { color: #64748b; white-space: nowrap; font-size: 0.7rem; }
    .history-item .h-badge {
      font-size: 0.65rem;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      font-weight: 600;
    }
    .h-badge-ok { background: #166534; color: #86efac; }
    .h-badge-skip { background: #475569; color: #94a3b8; }

    /* Calendar */
    .calendar-section {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #1e293b;
    }
    .calendar-label {
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.5rem;
      text-align: center;
    }
    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .calendar-header span {
      font-size: 0.875rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    .cal-nav {
      background: transparent;
      border: 1px solid #475569;
      color: #94a3b8;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .cal-nav:hover { border-color: #64748b; color: #cbd5e1; }
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      text-align: center;
      font-size: 0.8rem;
    }
    .calendar-grid .day-label {
      color: #64748b;
      font-weight: 600;
      padding: 0.25rem 0;
      font-size: 0.7rem;
    }
    .calendar-grid .day {
      padding: 0.35rem 0;
      border-radius: 4px;
      color: #94a3b8;
      cursor: pointer;
      transition: background 0.1s;
    }
    .calendar-grid .day:hover:not(.empty) {
      background: #334155;
      color: #e2e8f0;
    }
    .calendar-grid .day.today {
      background: #f43f5e;
      color: white;
      font-weight: 700;
    }
    .calendar-grid .day.today:hover {
      background: #e11d48;
    }
    .calendar-grid .day.selected {
      background: #7c3aed;
      color: white;
      font-weight: 700;
    }
    .calendar-grid .day.empty { visibility: hidden; cursor: default; }
    .date-inserted-toast {
      display: none;
      text-align: center;
      font-size: 0.75rem;
      color: #86efac;
      margin-top: 0.5rem;
      animation: fadeOut 2s forwards;
    }
    @keyframes fadeOut {
      0%, 60% { opacity: 1; }
      100% { opacity: 0; }
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #475569;
      border-top: 2px solid #f43f5e;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      vertical-align: middle;
      margin-right: 0.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-row">
      <h1>Facebook Post Submitter</h1>
      <span class="session-counter" id="sessionCounter" style="display:none;">0 submitted</span>
    </div>
    <p class="subtitle">Paste a Facebook crime post to extract and add to the Production sheet</p>

    <label>Target Year</label>
    <div style="display:flex;gap:0.5rem;margin-bottom:1rem;">
      <button type="button" class="year-btn" id="btn2026" onclick="setYear('2026')">2026</button>
      <button type="button" class="year-btn" id="btn2025" onclick="setYear('2025')">2025</button>
    </div>
    <input type="hidden" id="targetYear" value="2026">

    <label for="postText">Facebook Post Text <span class="shortcut-hint">(Ctrl+Enter to submit)</span></label>
    <textarea id="postText" placeholder="Paste the Facebook post here..."></textarea>

    <div class="duplicate-warning" id="dupWarning">This post looks like one you already submitted this session.</div>

    <label for="sourceUrl">Facebook Post URL</label>
    <input type="url" id="sourceUrl" placeholder="https://www.facebook.com/...">

    <button class="btn-submit" id="submitBtn" onclick="handleSubmit()">Submit to Pipeline</button>
    <button class="btn-clear" onclick="handleClear()">Clear</button>

    <div class="status" id="status"></div>

    <div class="history-section" id="historySection" style="display:none;">
      <button type="button" class="history-toggle" onclick="toggleHistory()">
        <span class="arrow" id="historyArrow">&#9656;</span> Session History (<span id="historyCount">0</span>)
      </button>
      <div class="history-list" id="historyList"></div>
    </div>

    <div class="calendar-section">
      <div class="calendar-label" id="calLabel">Click a date to insert it into the post</div>
      <div class="calendar-header">
        <button type="button" class="cal-nav" onclick="changeMonth(-1)">&lsaquo;</button>
        <span id="calTitle"></span>
        <button type="button" class="cal-nav" onclick="changeMonth(1)">&rsaquo;</button>
      </div>
      <div class="calendar-grid" id="calGrid"></div>
      <div class="date-inserted-toast" id="dateToast"></div>
    </div>
  </div>

  <script>
    // ═══════════════════════════════════════════════════════
    // SESSION STATE
    // ═══════════════════════════════════════════════════════
    var sessionCount = 0;
    var sessionHashes = [];   // duplicate detection
    var sessionHistory = [];  // submission log

    // ═══════════════════════════════════════════════════════
    // YEAR TOGGLE (with localStorage persistence + calendar sync)
    // ═══════════════════════════════════════════════════════
    function setYear(year) {
      document.getElementById('targetYear').value = year;
      document.getElementById('btn2025').className = year === '2025' ? 'year-btn active' : 'year-btn';
      document.getElementById('btn2026').className = year === '2026' ? 'year-btn active' : 'year-btn';
      try { localStorage.setItem('fb_submitter_year', year); } catch(e) {}

      // Sync calendar to January of target year if switching years
      var currentCalYear = calDate.getFullYear();
      if (String(currentCalYear) !== year) {
        calDate = new Date(parseInt(year), calDate.getMonth(), 1);
        renderCalendar();
      }
    }

    function loadStickyYear() {
      try {
        var saved = localStorage.getItem('fb_submitter_year');
        if (saved === '2025' || saved === '2026') {
          setYear(saved);
          return;
        }
      } catch(e) {}
      setYear('2026');
    }

    // ═══════════════════════════════════════════════════════
    // DUPLICATE DETECTION
    // ═══════════════════════════════════════════════════════
    function hashText(text) {
      // Simple hash of first 120 chars (enough to fingerprint a post)
      var s = text.trim().substring(0, 120).toLowerCase();
      var h = 0;
      for (var i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
      }
      return h;
    }

    function checkDuplicate() {
      var text = document.getElementById('postText').value;
      var warn = document.getElementById('dupWarning');
      if (text.trim().length < 20) { warn.style.display = 'none'; return false; }
      var h = hashText(text);
      var isDup = sessionHashes.indexOf(h) !== -1;
      warn.style.display = isDup ? 'block' : 'none';
      return isDup;
    }

    // ═══════════════════════════════════════════════════════
    // AUDIO PING
    // ═══════════════════════════════════════════════════════
    function playPing(success) {
      try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = success ? 880 : 330;
        osc.type = 'sine';
        gain.gain.value = 0.15;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════
    // SESSION COUNTER + HISTORY
    // ═══════════════════════════════════════════════════════
    function updateCounter() {
      var el = document.getElementById('sessionCounter');
      el.textContent = sessionCount + ' submitted';
      el.style.display = sessionCount > 0 ? 'inline-block' : 'none';
    }

    function addToHistory(results, year) {
      var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      results.forEach(function(r) {
        sessionHistory.unshift({
          headline: r.headline || 'Unknown',
          status: r.status,
          destination: r.destination || '',
          crimeType: r.crimeType || '',
          time: time
        });
      });
      renderHistory();
    }

    function renderHistory() {
      var section = document.getElementById('historySection');
      var list = document.getElementById('historyList');
      var countEl = document.getElementById('historyCount');

      if (sessionHistory.length === 0) { section.style.display = 'none'; return; }
      section.style.display = 'block';
      countEl.textContent = sessionHistory.length;

      var html = '';
      sessionHistory.forEach(function(h) {
        var badgeClass = h.status === 'skipped' ? 'h-badge-skip' : 'h-badge-ok';
        var badgeLabel = h.status === 'skipped' ? 'SKIP' : 'OK';
        html += '<div class="history-item">';
        html += '<span class="h-badge ' + badgeClass + '">' + badgeLabel + '</span> ';
        html += '<span class="h-headline">' + escapeHtml(h.headline) + '</span>';
        html += '<span class="h-meta">' + escapeHtml(h.crimeType) + ' ' + h.time + '</span>';
        html += '</div>';
      });
      list.innerHTML = html;
    }

    function toggleHistory() {
      var list = document.getElementById('historyList');
      var arrow = document.getElementById('historyArrow');
      var isOpen = list.classList.contains('open');
      list.classList.toggle('open');
      arrow.classList.toggle('open');
    }

    // ═══════════════════════════════════════════════════════
    // SUBMIT
    // ═══════════════════════════════════════════════════════
    function handleSubmit() {
      var postText = document.getElementById('postText').value.trim();
      var sourceUrl = document.getElementById('sourceUrl').value.trim();
      var targetYear = document.getElementById('targetYear').value;
      var statusEl = document.getElementById('status');
      var submitBtn = document.getElementById('submitBtn');

      if (!postText) {
        statusEl.className = 'status error';
        statusEl.innerHTML = 'Please paste the Facebook post text.';
        return;
      }

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
      statusEl.className = 'status loading';
      statusEl.innerHTML = '<span class="spinner"></span> Sending to Claude Haiku for extraction...';

      google.script.run
        .withSuccessHandler(function(response) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit to Pipeline';

          if (response.success) {
            playPing(true);

            // Track duplicate hash
            sessionHashes.push(hashText(postText));

            // Update session counter
            var added = response.results.filter(function(r) { return r.status !== 'skipped'; }).length;
            sessionCount += added;
            updateCounter();

            // Add to history
            addToHistory(response.results, targetYear);

            var html = '<strong>Extracted ' + response.crimesProcessed + ' crime(s)</strong>';
            html += ' (Confidence: ' + response.confidence + '/10)';
            if (response.sheetUrl) {
              html += ' &mdash; <a href="' + response.sheetUrl + '" target="_blank" style="color:#86efac;">View in Sheet</a>';
            }
            html += '<br><br>';

            response.results.forEach(function(r) {
              html += '<div class="crime-result">';
              if (r.status === 'production') {
                html += '<span class="badge badge-production">PRODUCTION</span>';
              } else if (r.status === 'review') {
                html += '<span class="badge badge-review">REVIEW</span>';
              } else {
                html += '<span class="badge badge-skipped">SKIPPED</span>';
              }
              html += '<strong>' + escapeHtml(r.headline || '') + '</strong><br>';
              if (r.destination) html += '<em>' + r.destination + '</em><br>';
              if (r.crimeType) html += r.crimeType + ' &middot; ';
              if (r.area) html += r.area + ' &middot; ';
              if (r.date) html += r.date;
              if (r.reason) html += '<br><em>' + escapeHtml(r.reason) + '</em>';
              if (r.confidence) html += '<br>Confidence: ' + r.confidence + '/10';
              html += '</div>';
            });

            statusEl.className = 'status success';
            statusEl.innerHTML = html;

            // Clear form and refocus for next entry
            document.getElementById('postText').value = '';
            document.getElementById('sourceUrl').value = '';
            document.getElementById('dupWarning').style.display = 'none';
            document.getElementById('postText').focus();
          } else {
            playPing(false);
            statusEl.className = 'status error';
            statusEl.innerHTML = '<strong>Not processed:</strong><br>' + escapeHtml(response.error || 'Unknown error');
            document.getElementById('postText').focus();
          }
        })
        .withFailureHandler(function(error) {
          playPing(false);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit to Pipeline';
          statusEl.className = 'status error';
          statusEl.innerHTML = '<strong>Error:</strong> ' + escapeHtml(error.message || 'Unknown error');
          document.getElementById('postText').focus();
        })
        .submitFacebookPost(postText, sourceUrl, targetYear);
    }

    function handleClear() {
      document.getElementById('postText').value = '';
      document.getElementById('sourceUrl').value = '';
      document.getElementById('status').className = 'status';
      document.getElementById('status').innerHTML = '';
      document.getElementById('dupWarning').style.display = 'none';
      document.getElementById('postText').focus();
    }

    function escapeHtml(text) {
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // ═══════════════════════════════════════════════════════
    // KEYBOARD SHORTCUT: Ctrl+Enter to submit
    // ═══════════════════════════════════════════════════════
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        var btn = document.getElementById('submitBtn');
        if (!btn.disabled) handleSubmit();
      }
    });

    // Check for duplicates on paste
    document.getElementById('postText').addEventListener('input', function() {
      checkDuplicate();
    });

    // ═══════════════════════════════════════════════════════
    // CALENDAR (synced to year toggle, clickable dates)
    // ═══════════════════════════════════════════════════════
    var calDate = new Date();
    var selectedCalDate = null;
    var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    function changeMonth(delta) {
      calDate.setMonth(calDate.getMonth() + delta);
      renderCalendar();
    }

    function selectDate(day) {
      var year = calDate.getFullYear();
      var month = calDate.getMonth();
      selectedCalDate = new Date(year, month, day);

      // Format: "January 15, 2025"
      var dateStr = MONTHS[month] + ' ' + day + ', ' + year;

      // Prepend to textarea so Claude picks it up
      var ta = document.getElementById('postText');
      var existing = ta.value;
      if (existing.trim()) {
        ta.value = '[Date: ' + dateStr + ']\\n\\n' + existing;
      } else {
        ta.value = '[Date: ' + dateStr + ']\\n\\n';
      }

      // Show toast
      var toast = document.getElementById('dateToast');
      toast.textContent = dateStr + ' inserted into post';
      toast.style.display = 'block';
      toast.style.animation = 'none';
      toast.offsetHeight; // trigger reflow
      toast.style.animation = 'fadeOut 2s forwards';

      renderCalendar();
      ta.focus();
    }

    function renderCalendar() {
      var year = calDate.getFullYear();
      var month = calDate.getMonth();
      var today = new Date();

      document.getElementById('calTitle').textContent = MONTHS[month] + ' ' + year;

      var firstDay = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();

      var html = '';
      DAYS.forEach(function(d) { html += '<div class="day-label">' + d + '</div>'; });

      for (var i = 0; i < firstDay; i++) {
        html += '<div class="day empty"></div>';
      }
      for (var d = 1; d <= daysInMonth; d++) {
        var isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        var isSelected = selectedCalDate && d === selectedCalDate.getDate() && month === selectedCalDate.getMonth() && year === selectedCalDate.getFullYear();
        var cls = 'day';
        if (isSelected) cls += ' selected';
        else if (isToday) cls += ' today';
        html += '<div class="' + cls + '" onclick="selectDate(' + d + ')">' + d + '</div>';
      }

      document.getElementById('calGrid').innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════
    loadStickyYear();
    renderCalendar();
    document.getElementById('postText').focus();
  </script>
</body>
</html>`;
}
