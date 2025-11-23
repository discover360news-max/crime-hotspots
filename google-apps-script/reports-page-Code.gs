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

    sendCrimeReportEmail(payload);
    saveToSheet(payload);

    return createResponse({
      success: true,
      message: 'Report submitted successfully',
      reportId: payload.id
    });

  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createResponse({
      success: false,
      message: 'Submission failed. Please try again.'
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
