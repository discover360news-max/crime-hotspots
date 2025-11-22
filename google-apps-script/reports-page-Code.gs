// Crime Hotspots - Email Submission Handler
  // Sends crime reports via email (no Google Sheets needed)

  // === CONFIGURATION ===
  const RECIPIENT_EMAIL = "discover360news@gmail.com"; // REPLACE WITH YOUR 
  EMAIL
  const TURNSTILE_SECRET = "0x4AAAAAAB_ThJuP2rMpgWbkkvhEbLPN8Ms"; // Your Turnstile secret key

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
      // Parse payload
      let payload;
      if (e.postData && e.postData.contents) {
        payload = JSON.parse(e.postData.contents);
      } else if (e.parameter) {
        payload = e.parameter;
      } else {
        return createResponse({ success: false, message: 'No data received'
  }, 400);
      }

      // Validate Turnstile (optional - comment out if causing issues)
      const turnstileToken = payload['cf-token'];
      if (turnstileToken) {
        const turnstileValid = validateTurnstile(turnstileToken);
        if (!turnstileValid) {
          Logger.log('Turnstile validation failed');
          // Continue anyway - you can make this stricter if needed
        }
      }

      // Send email
      sendCrimeReportEmail(payload);

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
    const subject = `🚨 Crime Report: ${data.crimeType} in ${data.area || 
  data.countryName}`;

    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; 
  margin: 0 auto;">
          <h2 style="color: #e11d48;">New Crime Report Submitted</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; 
  font-weight: bold;">Report ID</td>
              <td style="padding: 10px; border: 1px solid 
  #dee2e6;">${data.id}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; 
  font-weight: bold;">Date of Incident</td>
              <td style="padding: 10px; border: 1px solid 
  #dee2e6;">${data.date}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; 
  font-weight: bold;">Crime Type</td>
              <td style="padding: 10px; border: 1px solid 
  #dee2e6;">${data.crimeType}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; 
  font-weight: bold;">Country</td>
              <td style="padding: 10px; border: 1px solid 
  #dee2e6;">${data.countryName}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; 
  font-weight: bold;">Area</td>
              <td style="padding: 10px; border: 1px solid 
  #dee2e6;">${data.area || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; 
  font-weight: bold;">Street/Location</td>
              <td style="padding: 10px; border: 1px solid 
  #dee2e6;">${data.street || 'Not specified'}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; 
  font-weight: bold;">Headline</td>
              <td style="padding: 10px; border: 1px solid 
  #dee2e6;">${data.headline}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; 
  font-weight: bold; vertical-align: top;">Details</td>
              <td style="padding: 10px; border: 1px solid 
  #dee2e6;">${data.details}</td>
            </tr>
          </table>
          
          <p style="margin-top: 20px; font-size: 12px; color: #6c757d;">
            <strong>Submitted:</strong> ${new Date().toLocaleString()}<br>
            <strong>User Agent:</strong> ${data.ua || 'Unknown'}
          </p>
        </body>
      </html>
    `;

    const textBody = `
  NEW CRIME REPORT SUBMITTED

  Report ID: ${data.id}
  Date of Incident: ${data.date}
  Crime Type: ${data.crimeType}
  Country: ${data.countryName}
  Area: ${data.area || 'Not specified'}
  Street/Location: ${data.street || 'Not specified'}

  Headline: ${data.headline}

  Details:
  ${data.details}

  ---
  Submitted: ${new Date().toLocaleString()}
  User Agent: ${data.ua || 'Unknown'}
    `;

    MailApp.sendEmail({
      to: RECIPIENT_EMAIL,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody
    });
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

  // === CREATE RESPONSE WITH CORS ===
  function createResponse(data, statusCode = 200) {
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      });
  }
