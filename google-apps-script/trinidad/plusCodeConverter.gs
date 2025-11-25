/**
 * Plus Code to Lat/Lng Batch Converter
 * Uses Google Maps Geocoding API to decode Plus Codes
 * For Trinidad & Tobago Production sheet
 */

// Trinidad center for context when needed
const TRINIDAD_LAT = 10.4515;
const TRINIDAD_LNG = -61.3123;

/**
 * Main function to convert all Plus Codes to Lat/Lng
 */
function convertAllPlusCodes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Production') || ss.getActiveSheet();

  Logger.log('=== STARTING PLUS CODE CONVERSION ===');
  Logger.log(`Sheet: ${sheet.getName()}`);

  const lastRow = sheet.getLastRow();
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 12);
  const data = dataRange.getValues();

  Logger.log(`Total rows to process: ${data.length}`);

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < data.length; i++) {
    const row = i + 2;
    const plusCode = data[i][5]; // Column F
    const existingLat = data[i][10]; // Column K
    const existingLng = data[i][11]; // Column L

    // Skip if no Plus Code or already has lat/lng
    if (!plusCode || plusCode.toString().trim() === '') {
      skipped++;
      continue;
    }

    if (existingLat && existingLng && existingLat !== '' && existingLng !== '') {
      skipped++;
      continue;
    }

    // Decode Plus Code using Google Geocoding API
    const result = decodePlusCodeWithGoogleAPI(plusCode.toString().trim());

    if (result.success) {
      sheet.getRange(row, 11).setValue(result.lat); // Column K
      sheet.getRange(row, 12).setValue(result.lng); // Column L
      converted++;

      if (converted % 50 === 0) {
        Logger.log(`Progress: ${converted} converted, ${skipped} skipped, ${failed} failed`);
        SpreadsheetApp.flush();
        Utilities.sleep(100); // Rate limiting
      }
    } else {
      failed++;
      Logger.log(`⚠️ Row ${row}: Failed - ${result.error}`);
    }
  }

  Logger.log('\n=== CONVERSION COMPLETE ===');
  Logger.log(`✓ Converted: ${converted}`);
  Logger.log(`⊘ Skipped: ${skipped}`);
  Logger.log(`✗ Failed: ${failed}`);

  SpreadsheetApp.getUi().alert(
    'Plus Code Conversion Complete',
    `✓ Converted: ${converted}\n⊘ Skipped: ${skipped}\n✗ Failed: ${failed}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Decode Plus Code using Google Maps Geocoding API
 * The API can handle both short codes (with location context) and full codes
 */
function decodePlusCodeWithGoogleAPI(plusCodeString) {
  try {
    // Get API key
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') ||
                   PropertiesService.getScriptProperties().getProperty('GEOCODING_API_KEY');

    if (!apiKey) {
      return { success: false, error: 'No API key configured' };
    }

    // Extract ONLY the Plus Code (remove location names like "Enterprise, Trinidad")
    // Plus Code format: XXXX+XXX or longer
    const plusCodeMatch = plusCodeString.match(/([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,})/i);

    if (!plusCodeMatch) {
      return { success: false, error: 'No valid Plus Code found' };
    }

    const plusCode = plusCodeMatch[1].toUpperCase();

    // Use Google Geocoding API with region biasing for Trinidad
    // The 'components' parameter restricts results to Trinidad and Tobago
    // For very short codes, the API may struggle, but country restriction helps
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(plusCode)}&components=country:TT&region=tt&key=${apiKey}`;

    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const data = JSON.parse(response.getContentText());

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;

      // Verify the result is actually in Trinidad (lat ~10, lng ~-61)
      if (Math.abs(location.lat - TRINIDAD_LAT) < 5 && Math.abs(location.lng - TRINIDAD_LNG) < 5) {
        return {
          success: true,
          lat: location.lat,
          lng: location.lng
        };
      } else {
        return {
          success: false,
          error: 'Result outside Trinidad area'
        };
      }
    } else if (data.status === 'ZERO_RESULTS') {
      return {
        success: false,
        error: 'Plus Code not found'
      };
    } else {
      return {
        success: false,
        error: `API error: ${data.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test function - convert first 5 Plus Codes
 */
function testConvertPlusCodes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Production') || ss.getActiveSheet();

  Logger.log('=== TESTING PLUS CODE CONVERSION (First 5 rows) ===');

  const dataRange = sheet.getRange(2, 6, 5, 1); // Column F, rows 2-6
  const plusCodes = dataRange.getValues();

  plusCodes.forEach((row, index) => {
    const plusCode = row[0];
    if (plusCode && plusCode.toString().trim() !== '') {
      Logger.log(`\nRow ${index + 2}: ${plusCode}`);
      const result = decodePlusCodeWithGoogleAPI(plusCode.toString().trim());

      if (result.success) {
        Logger.log(`✓ Lat: ${result.lat}, Lng: ${result.lng}`);
      } else {
        Logger.log(`✗ Error: ${result.error}`);
      }

      Utilities.sleep(200); // Rate limiting
    }
  });

  Logger.log('\n=== TEST COMPLETE ===');
}

/**
 * Get API key helper
 */
function getGeocodingApiKey() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('GEOCODING_API_KEY') || props.getProperty('GEMINI_API_KEY');
}
