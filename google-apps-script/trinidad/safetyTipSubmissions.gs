/**
 * Safety Tip Community Submissions Web App
 *
 * Receives JSON POST from the /safety-tips/submit/ page and appends to
 * the "Safety Tip Submissions" tab in the pipeline spreadsheet.
 *
 * Deploy as:
 *   Execute as: Me
 *   Access: Anyone
 *
 * Store the deployed web app URL in Astro as: PUBLIC_SAFETY_TIPS_GAS_URL
 *
 * Sheet columns (Safety Tip Submissions tab):
 *   A: Timestamp
 *   B: Title
 *   C: Description
 *   D: Category
 *   E: Context
 *   F: Area
 *   G: SubmitterName
 *   H: SubmitterEmail
 *   I: Status  (default: pending-review)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

var SUBMISSIONS_SHEET_NAME = 'Safety Tip Submissions';
var NOTIFICATION_EMAIL_PROPERTY = 'NOTIFICATION_EMAIL';

// ============================================================================
// WEB APP ENTRY POINT
// ============================================================================

/**
 * doPost — receives tip submissions AND tip votes
 *   action: 'vote'  → recordTipVote()
 *   (no action)     → tip submission (original behaviour)
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // Route vote requests
    if (body.action === 'vote') {
      return handleVote(body);
    }

    // Basic validation
    if (!body.title || !body.title.trim()) {
      return jsonResponse({ success: false, error: 'Title is required' }, 400);
    }
    if (!body.description || body.description.trim().length < 20) {
      return jsonResponse({ success: false, error: 'Description must be at least 20 characters' }, 400);
    }
    if (!body.category) {
      return jsonResponse({ success: false, error: 'Category is required' }, 400);
    }
    if (!body.context) {
      return jsonResponse({ success: false, error: 'Context is required' }, 400);
    }

    // Append to sheet
    appendSubmission(body);

    // Send notification email
    sendNotificationEmail(body);

    return jsonResponse({ success: true });

  } catch (err) {
    Logger.log('❌ safetyTipSubmissions.doPost error: ' + err.message);
    return jsonResponse({ success: false, error: 'Internal error. Please try again.' }, 500);
  }
}

// ============================================================================
// VOTE HANDLERS
// ============================================================================

/**
 * Handle a tip vote POST { action:'vote', tip_id, vote:'helpful'|'not_helpful' }
 */
function handleVote(body) {
  if (!body.tip_id || !body.vote) {
    return jsonResponse({ success: false, error: 'tip_id and vote are required' }, 400);
  }
  var validVotes = ['helpful', 'not_helpful'];
  if (validVotes.indexOf(body.vote) === -1) {
    return jsonResponse({ success: false, error: 'Invalid vote value' }, 400);
  }
  appendVote(body.tip_id, body.vote);
  return jsonResponse({ success: true });
}

function appendVote(tipId, vote) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tip Votes');

  if (!sheet) {
    sheet = ss.insertSheet('Tip Votes');
    sheet.appendRow(['Timestamp', 'Tip ID', 'Vote']);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([new Date(), tipId, vote]);
}

/**
 * doGet — health check endpoint
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', service: 'safety-tip-submissions' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// HELPERS
// ============================================================================

function appendSubmission(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SUBMISSIONS_SHEET_NAME);

  if (!sheet) {
    // Create the sheet if it doesn't exist
    sheet = ss.insertSheet(SUBMISSIONS_SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'Title', 'Description', 'Category', 'Context',
      'Area', 'SubmitterName', 'SubmitterEmail', 'Status'
    ]);
    // Freeze header row
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    new Date(),                               // A: Timestamp
    body.title.trim(),                        // B: Title
    body.description.trim(),                  // C: Description
    body.category,                            // D: Category
    body.context,                             // E: Context
    body.area ? body.area.trim() : '',        // F: Area
    body.submitterName ? body.submitterName.trim() : '', // G: SubmitterName
    body.submitterEmail ? body.submitterEmail.trim() : '', // H: SubmitterEmail
    'pending-review'                          // I: Status
  ]);
}

function sendNotificationEmail(body) {
  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty(NOTIFICATION_EMAIL_PROPERTY);

  if (!email) {
    Logger.log('⚠️ NOTIFICATION_EMAIL not set — skipping email notification');
    return;
  }

  var subject = '🛡️ New Safety Tip Submission: ' + body.title.trim();
  var htmlBody = '<p><strong>Category:</strong> ' + escapeHtml(body.category) + '</p>' +
    '<p><strong>Context:</strong> ' + escapeHtml(body.context) + '</p>' +
    (body.area ? '<p><strong>Area:</strong> ' + escapeHtml(body.area) + '</p>' : '') +
    '<p><strong>Description:</strong></p>' +
    '<blockquote>' + escapeHtml(body.description).replace(/\n/g, '<br>') + '</blockquote>' +
    (body.submitterName ? '<p><strong>Submitted by:</strong> ' + escapeHtml(body.submitterName) + '</p>' : '') +
    (body.submitterEmail ? '<p><strong>Contact:</strong> ' + escapeHtml(body.submitterEmail) + '</p>' : '') +
    '<hr><p>Review in the Safety Tip Submissions sheet.</p>';

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

function jsonResponse(data, statusCode) {
  // GAS doPost can only return 200; include status in body for non-200 cases
  if (statusCode && statusCode !== 200) {
    data.statusCode = statusCode;
  }
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Escape HTML to prevent injection in email templates
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// SETUP / TEST HELPERS
// ============================================================================

/**
 * Run this once to set the notification email address.
 * Change the value below to your email, then run this function.
 */
function setupNotificationEmail() {
  var email = 'kavell@crimehotspots.com'; // ← Change to your email
  PropertiesService.getScriptProperties().setProperty(NOTIFICATION_EMAIL_PROPERTY, email);
  Logger.log('✅ Notification email set to: ' + email);
}

/**
 * Test the submission handler locally (without HTTP)
 */
function testAppendSubmission() {
  appendSubmission({
    title: 'Test Tip: ATM safety',
    description: 'Always be aware of your surroundings when withdrawing cash from an ATM. Check for suspicious persons before and after.',
    category: 'ATM Crime',
    context: 'At the ATM',
    area: 'Port of Spain',
    submitterName: 'Test User',
    submitterEmail: 'test@example.com'
  });
  Logger.log('✅ Test submission appended');
}
