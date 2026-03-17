/**
 * VALIDATION HELPERS - Spot Checking Automation
 *
 * These functions help verify data quality and identify issues
 * Run these manually from Apps Script editor to check accuracy
 *
 * @version 1.0
 * @date 2025-11-09
 */

/**
 * Spot check last N production entries for common issues
 *
 * @param {number} numToCheck - Number of recent entries to validate (default: 10)
 * @returns {Array} Array of issue descriptions
 */
function spotCheckProduction(numToCheck = 10) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Production');

  if (!sheet) {
    console.log('❌ Production sheet not found');
    return ['Production sheet not found'];
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices (using actual column names from your sheet)
  const colIndex = {
    crimeDate: headers.indexOf('Date'),
    crimeType: headers.indexOf('Crime Type'),
    area: headers.indexOf('Area'),
    headline: headers.indexOf('Headline'),
    victim: headers.indexOf('Victim'),
    lat: headers.indexOf('Lat'),
    lng: headers.indexOf('Long'),
    plusCode: headers.indexOf('Plus Code'),
    sourceUrl: headers.indexOf('URL'),
    confidence: headers.indexOf('Confidence'),
    street: headers.indexOf('Street'),
    island: headers.indexOf('Island')
  };

  // Verify required columns exist
  const missingColumns = [];
  const requiredColumns = ['Date', 'Crime Type', 'Area', 'Headline', 'URL'];
  requiredColumns.forEach(col => {
    if (headers.indexOf(col) === -1) {
      missingColumns.push(col);
    }
  });

  if (missingColumns.length > 0) {
    console.log(`❌ Missing required columns: ${missingColumns.join(', ')}`);
    console.log(`Available columns: ${headers.join(', ')}`);
    return [`Missing columns: ${missingColumns.join(', ')}`];
  }

  console.log(`Checking last ${numToCheck} entries from Production sheet...`);
  console.log(`Total entries: ${data.length - 1}`);

  const issues = [];
  const startRow = Math.max(1, data.length - numToCheck);

  let perfectCount = 0;
  let minorIssueCount = 0;
  let majorIssueCount = 0;

  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 1;
    const rowIssues = [];

    // Get field values (with safe access)
    const crimeDateValue = row[colIndex.crimeDate];
    const crimeDate = crimeDateValue ? new Date(crimeDateValue) : null;
    const crimeType = row[colIndex.crimeType];
    const area = row[colIndex.area];
    const headline = row[colIndex.headline];
    const lat = row[colIndex.lat];
    const lng = row[colIndex.lng];
    const plusCode = row[colIndex.plusCode];
    const sourceUrl = row[colIndex.sourceUrl];

    // CHECK 1: Date validation
    if (!crimeDate || isNaN(crimeDate.getTime())) {
      rowIssues.push(`❌ MAJOR: Invalid or missing date`);
    } else {
      const year = crimeDate.getFullYear();
      if (year < 2024 || year > 2027) {
        rowIssues.push(`❌ MAJOR: Date is ${year}, expected 2024-2027`);
      } else if (year !== 2026) {
        rowIssues.push(`⚠️ Minor: Date is ${year}, verify if correct`);
      }
    }

    // CHECK 2: Crime type validation
    if (!crimeType || crimeType.trim() === '') {
      rowIssues.push(`❌ MAJOR: Missing crime type`);
    } else if (crimeType.length < 3) {
      rowIssues.push(`⚠️ Minor: Crime type suspiciously short: "${crimeType}"`);
    }

    // CHECK 3: Area validation
    if (!area || area.trim() === '') {
      rowIssues.push(`❌ MAJOR: Missing area`);
    } else if (area === 'Trinidad' || area === 'Trinidad and Tobago') {
      rowIssues.push(`⚠️ Minor: Area too vague: "${area}"`);
    }

    // CHECK 4: Headline validation
    if (!headline || headline.trim() === '') {
      rowIssues.push(`❌ MAJOR: Missing headline`);
    } else if (headline.length < 10) {
      rowIssues.push(`⚠️ Minor: Headline suspiciously short: "${headline}"`);
    }

    // CHECK 5: Geocoding validation
    if (!lat || !lng) {
      rowIssues.push(`⚠️ Minor: Missing coordinates (area: ${area})`);
    } else {
      // Trinidad bounds: lat 10-11, lng -62 to -60
      if (lat < 10 || lat > 11.5 || lng < -62 || lng > -60) {
        rowIssues.push(`❌ MAJOR: Coordinates outside Trinidad bounds (${lat}, ${lng})`);
      }
    }

    // CHECK 6: Plus Code validation
    if (lat && lng && (!plusCode || plusCode.trim() === '')) {
      rowIssues.push(`⚠️ Minor: Has coordinates but missing Plus Code`);
    }

    // CHECK 7: Source URL validation
    if (!sourceUrl || sourceUrl.trim() === '') {
      rowIssues.push(`❌ MAJOR: Missing source URL`);
    } else if (!sourceUrl.startsWith('http')) {
      rowIssues.push(`❌ MAJOR: Invalid source URL: "${sourceUrl}"`);
    }

    // Categorize row
    const majorCount = rowIssues.filter(i => i.includes('MAJOR')).length;
    const minorCount = rowIssues.filter(i => i.includes('Minor')).length;

    if (rowIssues.length === 0) {
      perfectCount++;
    } else if (majorCount > 0) {
      majorIssueCount++;
      const headlinePreview = headline ? headline.substring(0, 40) : '[No headline]';
      issues.push(`Row ${rowNum} (${headlinePreview}...):`);
      rowIssues.forEach(issue => issues.push(`  ${issue}`));
    } else {
      minorIssueCount++;
      const headlinePreview = headline ? headline.substring(0, 40) : '[No headline]';
      issues.push(`Row ${rowNum} (${headlinePreview}...):`);
      rowIssues.forEach(issue => issues.push(`  ${issue}`));
    }
  }

  // Print summary
  console.log('\n========== SPOT CHECK SUMMARY ==========');
  console.log(`✅ Perfect: ${perfectCount} (${Math.round(perfectCount/numToCheck*100)}%)`);
  console.log(`⚠️ Minor Issues: ${minorIssueCount} (${Math.round(minorIssueCount/numToCheck*100)}%)`);
  console.log(`❌ Major Issues: ${majorIssueCount} (${Math.round(majorIssueCount/numToCheck*100)}%)`);
  console.log(`\nTarget: 85%+ perfect, <5% major issues`);
  console.log('========================================\n');

  if (issues.length === 0) {
    console.log('🎉 All checks passed! No issues found.');
  } else {
    console.log(`Found issues in ${minorIssueCount + majorIssueCount} entries:\n`);
    issues.forEach(issue => console.log(issue));
  }

  // Alert if accuracy too low
  const perfectRate = perfectCount / numToCheck;
  if (perfectRate < 0.70) {
    console.log('\n⚠️⚠️⚠️ WARNING: Accuracy below 70%! Investigation required. ⚠️⚠️⚠️');
  }

  return issues;
}

/**
 * Check for duplicate crimes in Production
 * Identifies entries with same URL and very similar headlines
 *
 * @param {number} lookbackRows - Number of recent rows to check (default: 100)
 * @returns {Array} Array of potential duplicates
 */
function checkForDuplicates(lookbackRows = 100) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Production');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const urlCol = headers.indexOf('URL');
  const headlineCol = headers.indexOf('Headline');

  console.log(`Checking for duplicates in last ${lookbackRows} entries...`);

  const duplicates = [];
  const startRow = Math.max(1, data.length - lookbackRows);

  for (let i = startRow; i < data.length; i++) {
    const currentUrl = data[i][urlCol];
    const currentHeadline = data[i][headlineCol];

    // Check against all previous rows
    for (let j = startRow; j < i; j++) {
      const compareUrl = data[j][urlCol];
      const compareHeadline = data[j][headlineCol];

      if (currentUrl === compareUrl) {
        const similarity = calculateStringSimilarity(currentHeadline, compareHeadline);

        if (similarity > 0.9) {
          duplicates.push({
            row1: j + 1,
            row2: i + 1,
            url: currentUrl,
            headline1: compareHeadline,
            headline2: currentHeadline,
            similarity: Math.round(similarity * 100)
          });
        }
      }
    }
  }

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
  } else {
    console.log(`⚠️ Found ${duplicates.length} potential duplicates:\n`);
    duplicates.forEach(dup => {
      console.log(`Rows ${dup.row1} and ${dup.row2} (${dup.similarity}% similar):`);
      console.log(`  URL: ${dup.url}`);
      console.log(`  Headline 1: ${dup.headline1}`);
      console.log(`  Headline 2: ${dup.headline2}\n`);
    });
  }

  return duplicates;
}

/**
 * Verify multi-crime extraction is working
 * Checks for articles with same URL in Production (should indicate multi-crime)
 *
 * @param {number} lookbackRows - Number of recent rows to analyze (default: 100)
 * @returns {Object} Statistics on multi-crime articles
 */
function checkMultiCrimeExtraction(lookbackRows = 100) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Production');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const urlCol = headers.indexOf('URL');
  const headlineCol = headers.indexOf('Headline');

  console.log('Analyzing multi-crime extraction patterns...');

  const urlCounts = {};
  const startRow = Math.max(1, data.length - lookbackRows);

  for (let i = startRow; i < data.length; i++) {
    const url = data[i][urlCol];
    if (!urlCounts[url]) {
      urlCounts[url] = [];
    }
    urlCounts[url].push({
      row: i + 1,
      headline: data[i][headlineCol]
    });
  }

  // Find multi-crime articles
  const multiCrimeArticles = Object.entries(urlCounts).filter(([url, crimes]) => crimes.length > 1);

  console.log(`\n========== MULTI-CRIME ANALYSIS ==========`);
  console.log(`Total entries checked: ${lookbackRows}`);
  console.log(`Unique articles: ${Object.keys(urlCounts).length}`);
  console.log(`Multi-crime articles: ${multiCrimeArticles.length}`);

  if (multiCrimeArticles.length > 0) {
    console.log(`\nMulti-crime article breakdown:`);
    multiCrimeArticles.forEach(([url, crimes]) => {
      console.log(`\n${crimes.length} crimes from: ${url}`);
      crimes.forEach(crime => {
        console.log(`  Row ${crime.row}: ${crime.headline}`);
      });
    });

    const totalMultiCrimes = multiCrimeArticles.reduce((sum, [url, crimes]) => sum + crimes.length, 0);
    const multiCrimeRate = (totalMultiCrimes / lookbackRows * 100).toFixed(1);
    console.log(`\n✅ Multi-crime detection appears to be working!`);
    console.log(`${multiCrimeRate}% of entries are from multi-crime articles`);
  } else {
    console.log(`\n⚠️ No multi-crime articles detected in last ${lookbackRows} entries`);
    console.log(`This might indicate multi-crime extraction is not working properly.`);
  }

  console.log('==========================================\n');

  return {
    totalChecked: lookbackRows,
    uniqueArticles: Object.keys(urlCounts).length,
    multiCrimeArticles: multiCrimeArticles.length,
    multiCrimeArticlesList: multiCrimeArticles
  };
}

/**
 * Check geocoding success rate
 *
 * @param {number} lookbackRows - Number of recent rows to check (default: 50)
 * @returns {Object} Geocoding statistics
 */
function checkGeocodingQuality(lookbackRows = 50) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Production');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const latCol = headers.indexOf('Lat');
  const lngCol = headers.indexOf('Long');
  const plusCodeCol = headers.indexOf('Plus Code');
  const areaCol = headers.indexOf('Area');

  console.log(`Analyzing geocoding quality for last ${lookbackRows} entries...`);

  const startRow = Math.max(1, data.length - lookbackRows);

  let hasCoordinates = 0;
  let hasPlusCode = 0;
  let missingGeocode = [];

  for (let i = startRow; i < data.length; i++) {
    const lat = data[i][latCol];
    const lng = data[i][lngCol];
    const plusCode = data[i][plusCodeCol];
    const area = data[i][areaCol];

    if (lat && lng) {
      hasCoordinates++;
      if (plusCode && plusCode.trim() !== '') {
        hasPlusCode++;
      }
    } else {
      missingGeocode.push({
        row: i + 1,
        area: area
      });
    }
  }

  const coordRate = (hasCoordinates / lookbackRows * 100).toFixed(1);
  const plusCodeRate = (hasPlusCode / lookbackRows * 100).toFixed(1);

  console.log(`\n========== GEOCODING QUALITY ==========`);
  console.log(`Entries with coordinates: ${hasCoordinates}/${lookbackRows} (${coordRate}%)`);
  console.log(`Entries with Plus Codes: ${hasPlusCode}/${lookbackRows} (${plusCodeRate}%)`);

  if (missingGeocode.length > 0) {
    console.log(`\n⚠️ Missing geocoding (${missingGeocode.length} entries):`);
    missingGeocode.forEach(item => {
      console.log(`  Row ${item.row}: ${item.area}`);
    });
  } else {
    console.log('\n✅ All entries geocoded successfully!');
  }

  console.log('=======================================\n');

  return {
    totalChecked: lookbackRows,
    hasCoordinates: hasCoordinates,
    hasPlusCode: hasPlusCode,
    coordSuccessRate: coordRate,
    plusCodeSuccessRate: plusCodeRate,
    missingGeocode: missingGeocode
  };
}

/**
 * Calculate string similarity using Levenshtein distance
 * Used for duplicate detection
 *
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  str1 = str1.toLowerCase().trim();
  str2 = str2.toLowerCase().trim();

  if (str1 === str2) return 1;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  // Levenshtein distance
  const matrix = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - (distance / maxLen);
}

/**
 * Run all validation checks at once
 * Comprehensive health check of the system
 *
 * @param {number} lookbackRows - Number of rows to check (default: 50)
 */
function runFullValidation(lookbackRows = 50) {
  console.log('========================================');
  console.log('RUNNING FULL VALIDATION SUITE');
  console.log('========================================\n');

  console.log('1️⃣ Spot Checking Production Data...\n');
  spotCheckProduction(lookbackRows);

  console.log('\n\n2️⃣ Checking for Duplicates...\n');
  checkForDuplicates(lookbackRows);

  console.log('\n\n3️⃣ Analyzing Multi-Crime Extraction...\n');
  checkMultiCrimeExtraction(lookbackRows);

  console.log('\n\n4️⃣ Checking Geocoding Quality...\n');
  checkGeocodingQuality(lookbackRows);

  console.log('\n========================================');
  console.log('VALIDATION COMPLETE');
  console.log('========================================');
}

/**
 * Quick daily check - run this every morning
 */
function dailyHealthCheck() {
  console.log('Running daily health check...\n');
  runFullValidation(20);  // Check last 20 entries
}

/**
 * Weekly deep dive - run this every Monday
 */
function weeklyDeepDive() {
  console.log('Running weekly deep dive...\n');
  runFullValidation(100);  // Check last 100 entries
}
