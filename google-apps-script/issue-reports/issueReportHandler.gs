/**
 * Issue Report Handler for Crime Hotspots
 *
 * Handles user-submitted issue reports about crime data
 * - Saves to Google Sheet
 * - Sends daily email digest
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your existing "Crime Reports" Google Sheet
 * 2. Create a new tab called "Issue Reports"
 * 3. Add headers: Timestamp | Issue Type | Details | Headline | Crime Type | Date | Location | Area | Country | URL | Plus Code | Page URL
 * 4. Deploy this script as a Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the Web App URL and paste it in headlineSummaryModal.js (line 454)
 * 6. Set up daily trigger for sendDailyDigest() function
 */

// Configuration
const CONFIG = {
  SHEET_ID: '1MLWKHu5TJoWp2_IzdHdH6eZxROglEQ8t0G9qo-kQei4', // Replace with your Crime Reports sheet ID
  TAB_NAME: 'Issue Reports',
  EMAIL: 'discover360news@gmail.com', // Your email for daily digest
  DIGEST_TIME_HOUR: 9 // Hour to send daily digest (9 = 9 AM)
};

/**
 * Handle incoming POST requests
 * IMPORTANT: Web App must be deployed with "Anyone" access for CORS to work
 */
function doPost(e) {
  try {
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);

    // Validate required fields
    if (!data.issueType || !data.crime || !data.timestamp) {
      return createResponse(400, 'Missing required fields');
    }

    // Additional validation
    if (data.details && data.details.length > 500) {
      return createResponse(400, 'Details too long');
    }

    // Save to sheet
    saveToSheet(data);

    return createResponse(200, 'Report submitted successfully');

  } catch (error) {
    Logger.log('Error processing report: ' + error.message);
    return createResponse(500, 'Internal server error');
  }
}

/**
 * Save issue report to Google Sheet
 */
function saveToSheet(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.TAB_NAME);

  if (!sheet) {
    throw new Error('Issue Reports tab not found. Please create it first.');
  }

  // Prepare row data
  const row = [
    new Date(data.timestamp),
    data.issueType,
    data.details || '',
    data.crime.headline || '',
    data.crime.crimeType || '',
    data.crime.date || '',
    data.crime.location || '',
    data.crime.area || '',
    data.crime.country || '',
    data.crime.url || '',
    data.crime.plusCode || '',
    data.pageUrl || ''
  ];

  // Append to sheet
  sheet.appendRow(row);

  console.log('Issue report saved:', data.issueType);
}

/**
 * Send daily email digest of all reports
 * Set up a time-based trigger to run this daily at your preferred time
 */
function sendDailyDigest() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.TAB_NAME);

  if (!sheet) {
    console.error('Issue Reports tab not found');
    return;
  }

  // Get yesterday's date range
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date(yesterday);
  today.setDate(today.getDate() + 1);

  // Get all data
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  // Filter yesterday's reports
  const yesterdayReports = rows.filter(row => {
    const timestamp = new Date(row[0]);
    return timestamp >= yesterday && timestamp < today;
  });

  if (yesterdayReports.length === 0) {
    console.log('No issue reports from yesterday');
    return;
  }

  // Build email content
  const subject = `Crime Hotspots: ${yesterdayReports.length} Issue Report${yesterdayReports.length > 1 ? 's' : ''} - ${formatDate(yesterday)}`;

  let htmlBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h2 { color: #e11d48; }
          .report {
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 20px;
            border-left: 4px solid #e11d48;
            border-radius: 4px;
          }
          .meta { color: #666; font-size: 14px; }
          .details { margin-top: 10px; padding: 10px; background: white; border-radius: 4px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h2>📊 Daily Issue Reports</h2>
        <p><strong>${yesterdayReports.length}</strong> issue report${yesterdayReports.length > 1 ? 's' : ''} submitted on ${formatDate(yesterday)}</p>
  `;

  yesterdayReports.forEach((report, index) => {
    const [timestamp, issueType, details, headline, crimeType, date, location, area, country, url, plusCode, pageUrl] = report;

    htmlBody += `
      <div class="report">
        <h3>Report ${index + 1}: ${formatIssueType(issueType)}</h3>
        <div class="meta">
          <strong>Submitted:</strong> ${formatDateTime(timestamp)}<br>
          <strong>Crime:</strong> ${headline}<br>
          <strong>Type:</strong> ${crimeType} | <strong>Date:</strong> ${date}<br>
          <strong>Location:</strong> ${location || area}, ${country}
        </div>
        ${details ? `<div class="details"><strong>User Details:</strong><br>${details}</div>` : ''}
        <div class="meta" style="margin-top: 10px;">
          <a href="${url}" target="_blank">View Source Article</a> |
          <a href="${pageUrl}" target="_blank">View Report Page</a>
        </div>
      </div>
    `;
  });

  htmlBody += `
        <div class="footer">
          <p>This is an automated daily digest from Crime Hotspots.</p>
          <p>View all reports: <a href="https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/edit#gid=${sheet.getSheetId()}">Open Sheet</a></p>
        </div>
      </body>
    </html>
  `;

  // Send email
  MailApp.sendEmail({
    to: CONFIG.EMAIL,
    subject: subject,
    htmlBody: htmlBody
  });

  console.log(`Daily digest sent: ${yesterdayReports.length} reports`);
}

/**
 * Helper: Format date
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMMM d, yyyy');
}

/**
 * Helper: Format date and time
 */
function formatDateTime(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'MMM d, yyyy h:mm a');
}

/**
 * Helper: Format issue type for display
 */
function formatIssueType(type) {
  const types = {
    'incorrect-location': '📍 Incorrect Location',
    'wrong-crime-type': '🏷️ Wrong Crime Type',
    'duplicate': '📋 Duplicate Entry',
    'inaccurate-info': '⚠️ Inaccurate Information',
    'other': '💬 Other Issue'
  };
  return types[type] || type;
}

/**
 * Helper: Create JSON response
 * Note: Google Apps Script automatically handles CORS when deployed with "Anyone" access
 */
function createResponse(status, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ status, message }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle GET requests
 */
function doGet(e) {
  return createResponse(200, 'Issue reporting endpoint active');
}

/**
 * Test function - run this to verify setup
 */
function testSetup() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.TAB_NAME);

    if (!sheet) {
      Logger.log('❌ ERROR: Tab "' + CONFIG.TAB_NAME + '" not found');
      Logger.log('Please create the tab and add headers');
      return;
    }

    Logger.log('✅ Sheet found: ' + sheet.getName());
    Logger.log('✅ Email configured: ' + CONFIG.EMAIL);
    Logger.log('✅ Setup looks good!');

    // Test saving a dummy report
    const testData = {
      issueType: 'other',
      details: 'Test report from setup',
      timestamp: new Date().toISOString(),
      crime: {
        headline: 'Test Headline',
        crimeType: 'Test',
        date: '2025-01-01',
        location: 'Test Location',
        area: 'Test Area',
        country: 'Test Country',
        url: 'https://example.com',
        plusCode: '8FVC9G8F+6X'
      },
      pageUrl: 'https://crimehotspots.com/headlines-trinidad.html'
    };

    saveToSheet(testData);
    Logger.log('✅ Test report saved successfully');

  } catch (error) {
    Logger.log('❌ ERROR: ' + error.message);
  }
}
