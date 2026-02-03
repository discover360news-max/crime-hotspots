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
    const extracted = extractCrimeData(cleanText, firstLine, cleanUrl, publishedDate);

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

    return {
      success: true,
      crimesProcessed: results.length,
      confidence: extracted.confidence,
      results: results
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
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      color: #f1f5f9;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
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

    /* Calendar */
    .calendar-section {
      margin-top: 2.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #1e293b;
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
    }
    .calendar-grid .day.today {
      background: #f43f5e;
      color: white;
      font-weight: 700;
    }
    .calendar-grid .day.empty { visibility: hidden; }

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
    <h1>Facebook Post Submitter</h1>
    <p class="subtitle">Paste a Facebook crime post to extract and add to the Production sheet</p>

    <label>Target Year</label>
    <div style="display:flex;gap:0.5rem;margin-bottom:1rem;">
      <button type="button" class="year-btn active" id="btn2026" onclick="setYear('2026')">2026</button>
      <button type="button" class="year-btn" id="btn2025" onclick="setYear('2025')">2025</button>
    </div>
    <input type="hidden" id="targetYear" value="2026">

    <label for="postText">Facebook Post Text</label>
    <textarea id="postText" placeholder="Paste the Facebook post here..."></textarea>

    <label for="sourceUrl">Facebook Post URL</label>
    <input type="url" id="sourceUrl" placeholder="https://www.facebook.com/...">

    <button class="btn-submit" id="submitBtn" onclick="handleSubmit()">Submit to Pipeline</button>
    <button class="btn-clear" onclick="handleClear()">Clear</button>

    <div class="status" id="status"></div>

    <div class="calendar-section">
      <div class="calendar-header">
        <button type="button" class="cal-nav" onclick="changeMonth(-1)">&lsaquo;</button>
        <span id="calTitle"></span>
        <button type="button" class="cal-nav" onclick="changeMonth(1)">&rsaquo;</button>
      </div>
      <div class="calendar-grid" id="calGrid"></div>
    </div>
  </div>

  <script>
    function setYear(year) {
      document.getElementById('targetYear').value = year;
      document.getElementById('btn2025').className = year === '2025' ? 'year-btn active' : 'year-btn';
      document.getElementById('btn2026').className = year === '2026' ? 'year-btn active' : 'year-btn';
    }

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
            var html = '<strong>Extracted ' + response.crimesProcessed + ' crime(s)</strong>';
            html += ' (Confidence: ' + response.confidence + '/10)<br><br>';

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

            // Clear form for next entry
            document.getElementById('postText').value = '';
            document.getElementById('sourceUrl').value = '';
          } else {
            statusEl.className = 'status error';
            statusEl.innerHTML = '<strong>Not processed:</strong><br>' + escapeHtml(response.error || 'Unknown error');
          }
        })
        .withFailureHandler(function(error) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit to Pipeline';
          statusEl.className = 'status error';
          statusEl.innerHTML = '<strong>Error:</strong> ' + escapeHtml(error.message || 'Unknown error');
        })
        .submitFacebookPost(postText, sourceUrl, targetYear);
    }

    function handleClear() {
      document.getElementById('postText').value = '';
      document.getElementById('sourceUrl').value = '';
      document.getElementById('status').className = 'status';
      document.getElementById('status').innerHTML = '';
    }

    function escapeHtml(text) {
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Calendar
    var calDate = new Date();
    var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    function changeMonth(delta) {
      calDate.setMonth(calDate.getMonth() + delta);
      renderCalendar();
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
        html += '<div class="day' + (isToday ? ' today' : '') + '">' + d + '</div>';
      }

      document.getElementById('calGrid').innerHTML = html;
    }

    renderCalendar();
  </script>
</body>
</html>`;
}
