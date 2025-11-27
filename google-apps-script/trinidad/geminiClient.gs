/**
 * Google Gemini API client for crime data extraction
 * Model: gemini-flash-latest (CORRECTED from gemini-1.5-flash)
 */

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
   * Check if Gemini response was truncated
   */
  function isResponseTruncated(responseData) {
    if (!responseData.candidates || responseData.candidates.length === 0) {
      return false;
    }

    const candidate = responseData.candidates[0];

    if (candidate.finishReason === 'MAX_TOKENS') {
      Logger.log('⚠️ Response truncated: Hit token limit');
      return true;
    }

    const text = candidate.content.parts[0].text;
    const trimmed = text.trim();

    if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
      Logger.log('⚠️ Response truncated: Incomplete JSON (no closing brace)');
      return true;
    }

    return false;
  }

/**
 * Extract structured crime data from article text using Gemini
 * @param {string} articleText - Full article text
 * @param {string} articleTitle - Article headline
 * @param {string} articleUrl - Source URL
 * @returns {Object} Extracted crime data as JSON
 */
function extractCrimeData(articleText, articleTitle, articleUrl, 
  publishedDate) {
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      throw new Error('Gemini API key not configured. Run setGeminiApiKey() first.');
    }

    // Validate inputs
    if (!articleText || articleText.trim().length < 50) {
      const textLength = articleText ? articleText.length : 0;
      Logger.log(`⚠️ Article text too short (${textLength} chars), 
  skipping`);
      return {
        crimes: [],
        confidence: 0,
        ambiguities: ['Article text too short or empty'],
        source_url: articleUrl
      };
    }

    const prompt = buildExtractionPrompt(articleText, articleTitle,
  publishedDate);

    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: GEMINI_CONFIG
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      const response =
  UrlFetchApp.fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, options);
      const responseData = JSON.parse(response.getContentText());

      // Handle API errors
      if (responseData.error) {
        Logger.log(`❌ Gemini API error: ${responseData.error.message}`);
        throw new Error(`Gemini API error: ${responseData.error.message}`);
      }

      // Handle missing candidates (safety filtering)
      if (!responseData.candidates || responseData.candidates.length === 0)
  {
        Logger.log('⚠️ Gemini returned no candidates (possible safety filter)');
        return {
          crimes: [],
          confidence: 0,
          ambiguities: ['AI safety filter triggered - article may contain sensitive content'],
          source_url: articleUrl
        };
      }

      // Check for truncated responses
      if (isResponseTruncated(responseData)) {
        Logger.log('⚠️ Response was truncated - flagging for manual review');

        // Try to parse what we got anyway
        const generatedText =responseData.candidates[0].content.parts[0].text;
        const partial = parseGeminiResponse(generatedText, articleUrl);

        // If we got some crimes, use them but lower confidence
        if (partial.crimes && partial.crimes.length > 0) {
          partial.confidence = Math.min(partial.confidence, 3);
          partial.ambiguities = partial.ambiguities || [];
          partial.ambiguities.push('TRUNCATED: Response incomplete, may be missing crimes');
          Logger.log(`⚠️ Partial extraction: ${partial.crimes.length} crime(s) found, but response was truncated`);
          return partial;
        }

        // If no crimes found, flag for manual review
        return {
          crimes: [{
            crime_date: null,
            crime_type: 'Unknown',
            area: 'Unknown',
            street: '',
            headline: 'MANUAL REVIEW NEEDED: Response truncated',
            details: `Original article: ${articleTitle}`,
            victims: [],
            source_url: articleUrl
          }],
          confidence: 1,
          ambiguities: ['Response truncated - article needs manual extraction'],
          requires_manual_review: true
        };
      }

      // Extract generated text
      const generatedText = responseData.candidates[0].content.parts[0].text;
      Logger.log(`✅ Gemini response received (${generatedText.length} chars)`);

      // Parse and return
      return parseGeminiResponse(generatedText, articleUrl);

    } catch (error) {
      Logger.log(`❌ Error calling Gemini API: ${error.message}`);
      throw error;
    }
  }

// ============================================================================
// PROMPT ENGINEERING
// ============================================================================

/**
 * Build extraction prompt with detailed instructions
 * @param {string} articleText - Full article text
 * @param {string} articleTitle - Article headline
 * @returns {string} Complete prompt for Gemini
 */
function buildExtractionPrompt(articleText, articleTitle, publishedDate) {
    const pubDateStr = publishedDate ? Utilities.formatDate(new
  Date(publishedDate), Session.getScriptTimeZone(), 'yyyy-MM-dd') :
  Utilities.formatDate(new Date(), Session.getScriptTimeZone(),
  'yyyy-MM-dd');

    return `Extract crime data from this Trinidad & Tobago news article.

  PUBLISHED: ${pubDateStr}
  HEADLINE: ${articleTitle}

  ARTICLE:
  ${articleText}

  Extract ALL distinct crime incidents as JSON array. Each incident =
  different date/location/victim.

  {
    "crimes": [
      {
        "crime_date": "YYYY-MM-DD (calculate from article, NOT published date)",
        "crime_type": "Murder|Shooting|Robbery|Assault|Theft|Home Invasion|Sexual Assault|Kidnapping|Police-Involved Shooting",
        "area": "Neighborhood (e.g., Maraval, Port of Spain)",
        "street": "Street address INCLUDING business names/landmarks (e.g., 'KFC Arima', 'Grand Bazaar, Churchill Roosevelt Highway')",
        "headline": "Brief headline with victim name/age in parentheses if known",
        "details": "2-3 sentence summary. Include crime type, location, and key details. Make it informative and engaging for readers. Use proper grammar and complete sentences.",
        "victims": [{"name": "Name or null", "age": number, "aliases": []}],
        "location_country": "Trinidad|Venezuela|Guyana|Other"
      }
    ],
    "confidence": 1-10,
    "ambiguities": []
  }

  CRITICAL RULES:

  1. CRIME DATE: Extract ACTUAL crime date from article text, NOT ${pubDateStr}.
     - Published: ${pubDateStr}
     - Calculate relative dates from published date:
       * "yesterday" = ${pubDateStr} minus 1 day
       * "today" = ${pubDateStr}
       * "on Monday" = find the most recent Monday before/on ${pubDateStr}
       * "Monday night" = same Monday calculation
       * "last Saturday" = find Saturday in the week before ${pubDateStr}
       * "on the weekend" = use the most recent weekend day mentioned
     - Examples:
       * Article published Monday Nov 18, says "found on Monday" = Nov 18 (same day)
       * Article published Tuesday Nov 19, says "on Monday" = Nov 18 (yesterday)
       * Article published Monday, says "on Saturday" = most recent Saturday
     - If no date mentioned at all, use ${pubDateStr} as fallback

  2. ARTICLE TYPE FILTER: Only extract from actual crime report articles
     - ✅ INCLUDE: Breaking news about recent violent crimes (murder, shooting, robbery, assault)
     - ✅ INCLUDE: Police reports of crimes affecting public safety
     - ✅ INCLUDE: Property crimes affecting individuals (home invasion, burglary, car theft)
     - ❌ EXCLUDE: Court/trial/verdict articles (found guilty, convicted, sentenced, liable, ruling)
     - ❌ EXCLUDE: Court appearances/arraignments unless reporting NEW details of the original crime
     - ❌ EXCLUDE: White-collar/corporate crime (bank fraud, embezzlement, tax evasion, securities violations)
     - ❌ EXCLUDE: Fraud involving banks/corporations (unless physical robbery of bank)
     - ❌ EXCLUDE: Historical crimes (>1 month old) mentioned in context
     - ❌ EXCLUDE: Business launch articles mentioning crime as motivation
     - ❌ EXCLUDE: Opinion pieces, editorials, crime analysis articles
     - ❌ EXCLUDE: Crime prevention tips using example crimes
     - ❌ EXCLUDE: Academic/educational articles mentioning crimes as examples
     - ❌ EXCLUDE: Articles about OTHER topics that mention crimes in passing
     - ❌ EXCLUDE: Social commentary articles that reference past crimes
     - If article is primarily about court proceedings, verdict, or corporate fraud, return {"crimes": [], "confidence": 0}
     - If article mentions crimes as EXAMPLES or CONTEXT (not the main subject), return {"crimes": [], "confidence": 0}
     - Examples to EXCLUDE:
       * "Former bank officer found liable for fraud" → Court verdict, NOT crime report
       * "Man convicted in 2023 murder case" → Court verdict, NOT new crime
       * "Company employee embezzled $30M over 5 years" → Corporate fraud, NOT public safety crime
       * "New app helps victims sell safely" with past examples → Product launch, NOT crime report
       * "New frontiers...in academia" mentioning pastor incident → Academic article, NOT crime report
       * "Crime wave analysis: Why violence is rising" with example crimes → Analysis, NOT crime report
     - CRITICAL: Check if crime is MAIN SUBJECT or just mentioned as CONTEXT/EXAMPLE
       * Main subject: "Pastor attacks man with cutlass over parking dispute" → INCLUDE
       * Context/example: "New academic programs aim to reduce crime. Recently, a pastor attacked..." → EXCLUDE

  3. EXCLUDE UNCERTAIN DEATHS: DO NOT classify as "Murder" if:
     - "No visible signs of violence"
     - "Cause of death unknown"
     - "Decomposed body" without confirmed foul play
     - "Unidentified body" without clear evidence of homicide
     - "Autopsy pending" or "Police investigating"
     - Deaths under investigation where no crime is confirmed
     - Return {"crimes": [], "confidence": 0} for these cases

  4. MURDER vs POLICE-INVOLVED SHOOTING:
     - Use "Police-Involved Shooting" when:
       * Police killed someone
       * Officers shot someone
       * Death occurred during police operation/confrontation
       * Article states "killed by police/cops/officers"
       * Person died in police custody with signs of violence
     - Use "Murder" ONLY when:
       * Civilian killed another civilian
       * Article explicitly states murder/slain/homicide (by non-police)
       * Clear evidence of criminal violence by non-law enforcement
       * Victim was shot/stabbed/attacked by civilians and died
     - CRITICAL: "killed by police" = "Police-Involved Shooting" NOT "Murder"

  5. NO "Other" CRIME TYPE: Only use listed crime types. If article doesn't match any, return {"crimes": [], "confidence": 0}

  6. LOCATION DETAILS: Capture complete location information
     - ALWAYS include business names (e.g., "KFC", "Grand Bazaar", "Movie Towne")
     - Include landmarks (e.g., "near Queen's Park Savannah")
     - street field should have: "Business/Landmark Name, Street Name" format
     - Examples:
       * "KFC Arima" → street: "KFC, Arima Main Road", area: "Arima"
       * "Grand Bazaar shooting" → street: "Grand Bazaar, Churchill Roosevelt Highway", area: "Valsayn"
       * "Queen's Park Savannah" → street: "Queen's Park Savannah", area: "Port of Spain"

  7. LOCATION FILTER: Set "location_country" for each crime
     - ✅ INCLUDE: Crimes in Trinidad (Port of Spain, San Fernando, Arima, etc.)
     - ✅ INCLUDE: Crimes in Tobago (Scarborough, Crown Point, etc.) → mark as "Trinidad" (Tobago is part of Trinidad & Tobago)
     - ❌ EXCLUDE: Crimes in Guyana, Venezuela, Barbados, Jamaica, other countries → mark as "Other"
     - If article is from Demerara Waves / INews Guyana → very likely NOT Trinidad
     - Only mark as "Trinidad" if crime occurred in Trinidad or Tobago islands

  8. MULTI-CRIME INCIDENTS: Handle overlapping crimes correctly
     - Home Invasion + Robbery = ONE "Home Invasion" (robbery is implied)
     - Home Invasion + Murder = TWO separate crimes
     - Shooting + Murder = ONE "Murder" (shooting is the method)
     - Robbery + Assault = ONE "Robbery" (assault during robbery)

  9. MULTI-VICTIM MURDERS: Extract EACH victim as SEPARATE crime entry
     - Double murder = TWO "Murder" entries (one per victim)
     - Triple murder = THREE "Murder" entries (one per victim)
     - Each entry: same date/location, different victim name
     - Example: "Husband and wife killed" = 2 Murder entries
     - CRITICAL: This ensures accurate murder statistics

  10. CRIME TYPE PRIORITY: When same incident has multiple crime labels
     - If murder occurred, use "Murder" (not "Home Invasion" or "Shooting")
     - Murder is the PRIMARY crime type when someone dies
     - Exception: If victims include both dead and alive, split into separate crimes

  11. DUPLICATE DETECTION: Include victim details for deduplication
      - Always include victim name, age, aliases if mentioned
      - Include specific location details (street + area)

  12. Not a crime article? Return {"crimes": [], "confidence": 0}

  JSON only, no markdown.`;
  }

// ============================================================================
// RESPONSE PARSING
// ============================================================================

/**
 * Parse Gemini response and handle malformed JSON
 * @param {string} responseText - Raw text from Gemini
 * @param {string} articleUrl - Source URL for logging
 * @returns {Object} Parsed crime data
 */
function parseGeminiResponse(responseText, articleUrl) {
    try {
      let cleanJson = responseText.trim();

      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g,
  '');
      }
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/```\n?/g, '');
      }

      const extracted = JSON.parse(cleanJson);

      // BACKWARD COMPATIBILITY: Handle old single-crime format
      if (!extracted.crimes && extracted.crime_date) {
        Logger.log('⚠️ Converting old single-crime format to new multi-crime format');
        const singleCrime = {
          crime_date: extracted.crime_date,
          crime_type: extracted.crime_type,
          area: extracted.area,
          street: extracted.street,
          headline: extracted.headline,
          details: extracted.details,
          victims: extracted.victims,
          source_url: articleUrl // ← SET IT HERE
        };
        extracted.crimes = [singleCrime];
      }

      // Validate new format
      if (!Array.isArray(extracted.crimes)) {
        extracted.crimes = [];
        extracted.ambiguities = extracted.ambiguities || [];
        extracted.ambiguities.push('Invalid response format - crimes is not an array');
      }

      // ← CRITICAL: Add source URL to EACH crime
      extracted.crimes.forEach(crime => {
        crime.source_url = articleUrl; // ← Ensure every crime has the correct URL
      });

      extracted.source_url = articleUrl;

      if (!extracted.hasOwnProperty('confidence')) {
        extracted.confidence = 5;
        extracted.ambiguities = extracted.ambiguities || [];
        extracted.ambiguities.push('Confidence score missing from AI response');
      }

      if (!Array.isArray(extracted.ambiguities)) {
        extracted.ambiguities = [];
      }

      Logger.log(`✅ Successfully parsed extraction: ${extracted.crimes.length} crime(s) found, confidence: ${extracted.confidence}`);
      return extracted;

    } catch (error) {
      Logger.log(`❌ Failed to parse Gemini response: ${error.message}`);
      return {
        crimes: [],
        confidence: 0,
        ambiguities: [`JSON parse error: ${error.message}`],
        source_url: articleUrl
      };
    }
  }

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test extraction with sample crime article
 * Run this manually to verify Gemini integration
 */
function testGeminiExtraction() {
  Logger.log('=== TESTING GEMINI EXTRACTION ===');

  // Verify API key first
  if (!verifyApiKey()) {
    return;
  }

  const sampleText = `A 58-year-old bar owner was shot and killed outside his vehicle at Pool Village, Rio Claro on Saturday night. Police identified the victim as Sylvan Boodan, also known as 'Lawa', who operated a bar on San Pedro Road. The incident occurred around 11:45 p.m. on November 2, 2024. Witnesses reported hearing multiple gunshots before seeing a vehicle speed away from the scene. Police are investigating the motive and searching for suspects.`;

  const sampleTitle = 'Bar owner killed in Rio Claro shooting';
  const sampleUrl = 'https://example.com/test-article';

  try {
    Logger.log('Calling Gemini API...');
    const result = extractCrimeData(sampleText, sampleTitle, sampleUrl);

    Logger.log('=== EXTRACTION RESULT ===');
    Logger.log(JSON.stringify(result, null, 2));
    Logger.log('=========================');

    // Validate result
    if (result.confidence >= 7) {
      Logger.log('✅ HIGH CONFIDENCE - Would go to Production');
    } else if (result.confidence > 0) {
      Logger.log('⚠️ LOW CONFIDENCE - Would go to Review Queue');
    } else {
      Logger.log('❌ ZERO CONFIDENCE - Processing failed');
    }

  } catch (error) {
    Logger.log(`❌ Test failed: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
  }
}

/**
 * Test extraction with multiple sample articles
 * Run this to test various edge cases
 */
function testMultipleSamples() {
  const samples = [
    {
      title: 'Man shot dead in Laventille',
      text: 'A man was shot and killed in Laventille on Tuesday evening. The victim, identified as Marcus Thompson, 32, was found with multiple gunshot wounds on George Street around 6:30 p.m.'
    },
    {
      title: 'Robbery at grocery store',
      text: 'Two armed men robbed a grocery store on Main Road, Chaguanas yesterday morning. The suspects made off with approximately $15,000 in cash. No one was injured.'
    },
    {
      title: 'Government announces new policy',
      text: 'The government today announced a new economic policy aimed at reducing inflation and supporting small businesses. The Prime Minister outlined the key measures during a press conference.'
    }
  ];

  Logger.log('=== TESTING MULTIPLE SAMPLES ===');

  samples.forEach((sample, index) => {
    Logger.log(`\n--- Sample ${index + 1}: ${sample.title} ---`);

    try {
      const result = extractCrimeData(sample.text, sample.title, `https://test.com/article${index + 1}`);
      Logger.log(`Confidence: ${result.confidence}`);
      Logger.log(`Crime Type: ${result.crime_type || 'N/A'}`);
      Logger.log(`Area: ${result.area || 'N/A'}`);
    } catch (error) {
      Logger.log(`Error: ${error.message}`);
    }

    // Rate limiting between tests
    Utilities.sleep(2000);
  });

  Logger.log('\n=== TEST COMPLETE ===');
}

function testMultiCrimeExtraction() {
    Logger.log('=== TESTING MULTI-CRIME EXTRACTION ===');

    if (!verifyApiKey()) {
      return;
    }

    const multiCrimeSample = `Police are investigating three separate violent incidents that occurred over the weekend in Trinidad. On Friday night around 11:45 p.m., a 58-year-old bar owner identified as Sylvan Boodan was shot and killed outside his vehicle at Pool Village, RioClaro. Witnesses reported hearing multiple gunshots.

    On Saturday morning, two armed men robbed a grocery store on Main Road, 
    Chaguanas. The suspects escaped with approximately $15,000 in cash. No 
    injuries were reported.

    On Sunday evening, a 34-year-old woman was assaulted during a home 
    invasion in San Fernando. Police are searching for the suspects.

    All three incidents are being investigated separately.`;

    const sampleTitle = 'Weekend crime wave: Three separate incidents reported';
    const sampleUrl = 'https://example.com/multi-crime-test';

    try {
      Logger.log('Calling Gemini API with multi-crime article...');
      const result = extractCrimeData(multiCrimeSample, sampleTitle,sampleUrl);

      Logger.log('=== EXTRACTION RESULT ===');
      Logger.log(JSON.stringify(result, null, 2));
      Logger.log('=========================');

      Logger.log(`\n✅ Detected ${result.crimes.length} separate crime incidents`);
      Logger.log(`Confidence: ${result.confidence}`);

      result.crimes.forEach((crime, index) => {
        Logger.log(`\nCrime ${index + 1}:`);
        Logger.log(`  Date: ${crime.crime_date}`);
        Logger.log(`  Type: ${crime.crime_type}`);
        Logger.log(`  Area: ${crime.area}`);
        Logger.log(`  Headline: ${crime.headline}`);
      });

    } catch (error) {
      Logger.log(`❌ Test failed: ${error.message}`);
    }
  }

/**
   * Debug: Check what's actually in your Raw Articles sheet
   */
  function debugRawArticles() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
    const data = sheet.getDataRange().getValues();

    Logger.log('=== RAW ARTICLES DEBUG ===');
    Logger.log(`Total rows: ${data.length}`);
    Logger.log('');

    // Check first 5 data rows
    for (let i = 1; i < Math.min(6, data.length); i++) {
      const row = data[i];
      Logger.log(`Row ${i + 1}:`);
      Logger.log(`  Title: ${row[2] ? row[2].substring(0, 50) : 'EMPTY'}`);
      Logger.log(`  URL: ${row[3] ? row[3].substring(0, 50) : 'EMPTY'}`);
      Logger.log(`  Full Text Length: ${row[4] ? row[4].length : 0} chars`);
      Logger.log(`  Status: ${row[6]}`);
      Logger.log('');
    }
  }

  /**
   * Test extraction with REAL data from Raw Articles sheet
   * This reads from your actual sheet instead of using sample data
   */
  function testGeminiWithSheetData() {
    Logger.log('═════════════════════════════');
    Logger.log('Testing Gemini with Sheet Data');
    Logger.log('═════════════════════════════');

    // Verify API key
    if (!verifyApiKey()) {
      return;
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');

    if (!sheet) {
      Logger.log('ERROR: "Raw Articles" sheet not found');
      return;
    }

    // Find first article (any status is fine for testing)
    const data = sheet.getDataRange().getValues();
    let testRow = null;
    let rowNumber = -1;

    // Look for any article with full text
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const fullText = row[4]; // Column E

      if (fullText && fullText.length > 100) {
        testRow = row;
        rowNumber = i + 1;
        break;
      }
    }

    if (!testRow) {
      Logger.log('');
      Logger.log('No articles with full text found.');
      Logger.log('Run fetchPendingArticleText() first to populate Column E.');
      Logger.log('');
      return;
    }

    // Extract data from sheet columns
    const articleTitle = testRow[2];   // Column C
    const articleUrl = testRow[3];     // Column D
    const articleText = testRow[4];    // Column E
    const currentStatus = testRow[6];  // Column G

    Logger.log('');
    Logger.log(`Testing with Row ${rowNumber}:`);
    Logger.log(`  Title: ${articleTitle.substring(0, 60)}...`);
    Logger.log(`  URL: ${articleUrl.substring(0, 60)}...`);
    Logger.log(`  Text Length: ${articleText.length} characters`);
    Logger.log(`  Current Status: ${currentStatus}`);
    Logger.log('');

    try {
      Logger.log('Calling Gemini API with real sheet data...');
      Logger.log('');

      const result = extractCrimeData(articleText, articleTitle,
  articleUrl);

      Logger.log('═══════════════════════════════');
      Logger.log('EXTRACTION RESULT');
      Logger.log('═══════════════════════════════');
      Logger.log(JSON.stringify(result, null, 2));
      Logger.log('═══════════════════════════════');
      Logger.log('');

      // Validate result
      if (result.confidence >= 7) {
        Logger.log('✅ HIGH CONFIDENCE - Would go to Production');
      } else if (result.confidence > 0) {
        Logger.log('⚠️ LOW CONFIDENCE - Would go to Review Queue');
        Logger.log(`Ambiguities: ${result.ambiguities.join(', ')}`);
      } else {
        Logger.log('❌ ZERO CONFIDENCE - Not a crime article');
        Logger.log(`Reason: ${result.ambiguities.join(', ')}`);
      }

      Logger.log('');
      Logger.log('Test complete!');

    } catch (error) {
      Logger.log('');
      Logger.log(`❌ Test failed: ${error.message}`);
      Logger.log(`Stack trace: ${error.stack}`);
    }
  }