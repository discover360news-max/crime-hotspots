// Crime Hotspots - Email Submission Handler + Google Sheets Storage
// IMPORTANT: Deploy with "Who has access: Anyone" for CORS to work

// === CONFIGURATION ===
const RECIPIENT_EMAIL = "discover360news@gmail.com";
const TURNSTILE_SECRET = "0x4AAAAAAB_ThJuP2rMpgWbkkvhEbLPN8Ms";
const SHEET_ID = "1MLWKHu5TJoWp2_IzdHdH6eZxROglEQ8t0G9qo-kQei4"; // Replace with your Google Sheet ID
const SHEET_NAME = "Reports"; // Name of the sheet tab

// === HANDLE ALL REQUESTS ===
function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function doOptions(e) {
  return createResponse({ success: true });
}

// === MAIN HANDLER ===
function handleRequest(e) {
  try {
    let payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    } else {
      return createResponse({ success: false, message: 'No data received' }, 400);
    }

    const turnstileToken = payload['cf-token'];
    if (!turnstileToken) {
      Logger.log('No Turnstile token provided');
      return createResponse({
        success: false,
        message: 'Security validation required. Please refresh the page.'
      }, 400);
    }

    const turnstileValid = validateTurnstile(turnstileToken);
    if (!turnstileValid) {
      Logger.log('Turnstile validation failed');
      return createResponse({
        success: false,
        message: 'Security check failed. Please try again.'
      }, 403);
    }

    // Handle different report types
    if (payload.reportType === 'crime-issue') {
      sendIssueReportEmail(payload);
      saveIssueToSheet(payload);
    } else {
      sendCrimeReportEmail(payload);
      saveToSheet(payload);
    }

    return createResponse({
      success: true,
      message: 'Report submitted successfully',
      reportId: payload.id
    });

  } catch (error) {
    Logger.log('ERROR in handleRequest: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    Logger.log('Error name: ' + error.name);
    Logger.log('Error message: ' + error.message);
    return createResponse({
      success: false,
      message: 'Submission failed. ' + error.message
    }, 500);
  }
}

// === SEND EMAIL ===
function sendCrimeReportEmail(data) {
  const subject = 'Crime Report: ' + data.crimeType + ' in ' + (data.area || data.countryName);

  const htmlBody = '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #e11d48;">New Crime Report Submitted</h2><table style="width: 100%; border-collapse: collapse;"><tr style="background-color: #f8f9fa;"><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Report ID</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + data.id + '</td></tr><tr><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Date of Incident</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + data.date + '</td></tr><tr style="background-color: #f8f9fa;"><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Crime Type</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + data.crimeType + '</td></tr><tr><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Country</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + data.countryName + '</td></tr><tr style="background-color: #f8f9fa;"><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Area</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + (data.area || 'Not specified') + '</td></tr><tr><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Street/Location</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + (data.street || 'Not specified') + '</td></tr><tr style="background-color: #f8f9fa;"><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Headline</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + data.headline + '</td></tr><tr><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold; vertical-align: top;">Details</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + data.details + '</td></tr></table><p style="margin-top: 20px; font-size: 12px; color: #6c757d;"><strong>Submitted:</strong> ' + new Date().toLocaleString() + '<br><strong>User Agent:</strong> ' + (data.ua || 'Unknown') + '</p></body></html>';

  const textBody = 'NEW CRIME REPORT SUBMITTED\n\nReport ID: ' + data.id + '\nDate of Incident: ' + data.date + '\nCrime Type: ' + data.crimeType + '\nCountry: ' + data.countryName + '\nArea: ' + (data.area || 'Not specified') + '\nStreet/Location: ' + (data.street || 'Not specified') + '\n\nHeadline: ' + data.headline + '\n\nDetails:\n' + data.details + '\n\n---\nSubmitted: ' + new Date().toLocaleString() + '\nUser Agent: ' + (data.ua || 'Unknown');

  MailApp.sendEmail({
    to: RECIPIENT_EMAIL,
    subject: subject,
    body: textBody,
    htmlBody: htmlBody
  });
}

// === SAVE TO GOOGLE SHEET ===
function saveToSheet(data) {
  try {
    if (!data) {
      Logger.log('Error: data is undefined');
      return;
    }

    Logger.log('Attempting to save report: ' + JSON.stringify(data));

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      Logger.log('Sheet not found: ' + SHEET_NAME);
      return;
    }

    const timestamp = new Date();

    sheet.appendRow([
      timestamp,
      data.id || 'N/A',
      data.date || 'N/A',
      data.crimeType || 'N/A',
      data.countryName || 'N/A',
      data.area || '',
      data.street || '',
      data.headline || 'N/A',
      data.details || 'N/A',
      data.ua || 'Unknown'
    ]);

    Logger.log('Report saved to sheet: ' + data.id);
  } catch (error) {
    Logger.log('Error saving to sheet: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
  }
}

// === SEND ISSUE REPORT EMAIL ===
function sendIssueReportEmail(data) {
  const subject = 'Crime Report Issue: ' + data.crimeType + ' in ' + (data.crimeArea || data.crimeRegion);

  const issueTypes = Array.isArray(data.issueTypes) ? data.issueTypes.join(', ') : 'Not specified';

  const htmlBody = '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #e11d48;">Crime Report Issue Submitted</h2><table style="width: 100%; border-collapse: collapse;"><tr style="background-color: #f8f9fa;"><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Crime Slug</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + (data.crimeSlug || 'Not specified') + '</td></tr><tr><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Crime Headline</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + (data.crimeHeadline || 'Not specified') + '</td></tr><tr style="background-color: #f8f9fa;"><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Date of Incident</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + (data.crimeDate || 'Not specified') + '</td></tr><tr><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Crime Type</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + (data.crimeType || 'Not specified') + '</td></tr><tr style="background-color: #f8f9fa;"><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Region</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + (data.crimeRegion || 'Not specified') + '</td></tr><tr><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Area</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + (data.crimeArea || 'Not specified') + '</td></tr><tr style="background-color: #f8f9fa;"><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Street</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + (data.crimeStreet || 'Not specified') + '</td></tr><tr><td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Source URL</td><td style="padding: 10px; border: 1px solid #dee2e6;">' + (data.crimeUrl || 'Not specified') + '</td></tr><tr style="background-color: #fffbeb;"><td colspan="2" style="padding: 15px; border: 1px solid #f59e0b;"><h3 style="margin: 0 0 10px 0; color: #92400e;">Issue Details</h3><p style="margin: 5px 0;"><strong>Issue Types:</strong> ' + issueTypes + '</p><p style="margin: 5px 0;"><strong>Information Source:</strong> ' + (data.informationSource || 'Not specified') + '</p><p style="margin: 5px 0;"><strong>Description:</strong></p><p style="margin: 5px 0; white-space: pre-wrap;">' + (data.description || 'No description provided') + '</p><p style="margin: 5px 0;"><strong>Contact Email:</strong> ' + (data.contactEmail || 'Not provided') + '</p></td></tr></table><p style="margin-top: 20px; font-size: 12px; color: #6c757d;"><strong>Submitted:</strong> ' + (data.timestamp || new Date().toLocaleString()) + '<br><strong>User Agent:</strong> ' + (data.userAgent || 'Unknown') + '</p></body></html>';

  const textBody = 'CRIME REPORT ISSUE SUBMITTED\n\nCrime Slug: ' + (data.crimeSlug || 'Not specified') + '\nHeadline: ' + (data.crimeHeadline || 'Not specified') + '\nDate: ' + (data.crimeDate || 'Not specified') + '\nType: ' + (data.crimeType || 'Not specified') + '\nRegion: ' + (data.crimeRegion || 'Not specified') + '\nArea: ' + (data.crimeArea || 'Not specified') + '\nStreet: ' + (data.crimeStreet || 'Not specified') + '\nSource: ' + (data.crimeUrl || 'Not specified') + '\n\n--- ISSUE DETAILS ---\nIssue Types: ' + issueTypes + '\nInformation Source: ' + (data.informationSource || 'Not specified') + '\n\nDescription:\n' + (data.description || 'No description provided') + '\n\nContact Email: ' + (data.contactEmail || 'Not provided') + '\n\n---\nSubmitted: ' + (data.timestamp || new Date().toLocaleString()) + '\nUser Agent: ' + (data.userAgent || 'Unknown');

  MailApp.sendEmail({
    to: RECIPIENT_EMAIL,
    subject: subject,
    body: textBody,
    htmlBody: htmlBody
  });
}

// === SAVE ISSUE REPORT TO SHEET ===
function saveIssueToSheet(data) {
  try {
    Logger.log('Attempting to save issue report: ' + JSON.stringify(data));

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Issue Reports');

    // Create sheet if it doesn't exist
    if (!sheet) {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const newSheet = ss.insertSheet('Issue Reports');
      newSheet.appendRow([
        'Timestamp',
        'Crime Slug',
        'Crime Headline',
        'Crime Date',
        'Crime Type',
        'Region',
        'Area',
        'Street',
        'Source URL',
        'Issue Types',
        'Information Source',
        'Description',
        'Contact Email',
        'User Agent'
      ]);
    }

    const issueSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Issue Reports');
    const timestamp = new Date();
    const issueTypes = Array.isArray(data.issueTypes) ? data.issueTypes.join(', ') : '';

    issueSheet.appendRow([
      timestamp,
      data.crimeSlug || '',
      data.crimeHeadline || '',
      data.crimeDate || '',
      data.crimeType || '',
      data.crimeRegion || '',
      data.crimeArea || '',
      data.crimeStreet || '',
      data.crimeUrl || '',
      issueTypes,
      data.informationSource || '',
      data.description || '',
      data.contactEmail || '',
      data.userAgent || 'Unknown'
    ]);

    Logger.log('Issue report saved to sheet');
  } catch (error) {
    Logger.log('Error saving issue to sheet: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
  }
}

// === VALIDATE TURNSTILE ===
function validateTurnstile(token) {
  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const payload = {
    secret: TURNSTILE_SECRET,
    response: token
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    return result.success === true;
  } catch (error) {
    Logger.log('Turnstile validation error: ' + error.toString());
    return false;
  }
}

// === CREATE RESPONSE ===
function createResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// === TEST FUNCTIONS ===
/**
 * Test issue report submission
 * Run this from Apps Script editor to test
 */
function testIssueReport() {
  const testPayload = {
    reportType: 'crime-issue',
    issueTypes: ['Incorrect Headline/Summary', 'Wrong Date/Location'],
    informationSource: 'News Article',
    description: 'This is a test issue report. The location is incorrect - it should be Port of Spain, not Arima.',
    contactEmail: 'test@example.com',
    crimeSlug: 'test-crime-slug-2026-01-09',
    crimeHeadline: 'Test Crime Headline',
    crimeDate: '1/9/2026',
    crimeType: 'Robbery',
    crimeArea: 'Port of Spain',
    crimeRegion: 'Port of Spain',
    crimeStreet: 'Test Street',
    crimeSummary: 'Test summary of the crime',
    crimeSource: 'Test Source',
    crimeUrl: 'https://example.com/test',
    'cf-token': 'SKIP_FOR_TEST',
    timestamp: new Date().toISOString(),
    userAgent: 'Test Agent'
  };

  Logger.log('Testing issue report submission...');

  // Skip Turnstile validation for testing
  try {
    sendIssueReportEmail(testPayload);
    Logger.log('✅ Email sent successfully');

    saveIssueToSheet(testPayload);
    Logger.log('✅ Saved to sheet successfully');

    Logger.log('✅ Test passed!');
  } catch (error) {
    Logger.log('❌ Test failed: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
  }
}

/**
 * Test regular crime report submission
 * Run this from Apps Script editor to test
 */
function testCrimeReport() {
  const testPayload = {
    id: 'TEST-' + Date.now(),
    date: '2026-01-09',
    crimeType: 'Theft',
    countryName: 'Trinidad and Tobago',
    area: 'Port of Spain',
    street: 'Independence Square',
    headline: 'Test Crime Report Headline',
    details: 'This is a test crime report with detailed information about the incident.',
    ua: 'Test User Agent',
    'cf-token': 'SKIP_FOR_TEST',
    timestamp: new Date().toISOString()
  };

  Logger.log('Testing crime report submission...');

  try {
    sendCrimeReportEmail(testPayload);
    Logger.log('✅ Email sent successfully');

    saveToSheet(testPayload);
    Logger.log('✅ Saved to sheet successfully');

    Logger.log('✅ Test passed!');
  } catch (error) {
    Logger.log('❌ Test failed: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
  }
}
