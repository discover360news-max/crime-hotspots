/**
 * Claude API client for crime data extraction
 * Model: Claude Haiku 4.5 (claude-3-5-haiku-20241022)
 * Cost: ~$2.70/month for 20 articles/day
 *
 * MIGRATED FROM: Groq llama-3.1-8b-instant (free tier, unreliable)
 * MIGRATION DATE: January 2026
 *
 * Why Claude?: Better instruction-following, fewer hallucinations, minimal cost
 */

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract structured crime data from article text using Claude
 * @param {string} articleText - Full article text
 * @param {string} articleTitle - Article headline
 * @param {string} articleUrl - Source URL
 * @param {Date} publishedDate - Article publication date
 * @returns {Object} Extracted crime data as JSON
 */
function extractCrimeData(articleText, articleTitle, articleUrl, publishedDate, options) {
  options = options || {};
  const apiKey = getClaudeApiKey();

  if (!apiKey) {
    throw new Error('Claude API key not configured. Run setClaudeApiKey() first.');
  }

  // Validate inputs
  if (!articleText || articleText.trim().length < 50) {
    const textLength = articleText ? articleText.length : 0;
    Logger.log(`⚠️ Article text too short (${textLength} chars), skipping`);
    return {
      crimes: [],
      confidence: 0,
      ambiguities: ['Article text too short or empty'],
      source_url: articleUrl
    };
  }

  // Build system prompt (static - cached) and user prompt (dynamic - per article)
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(articleText, articleTitle, publishedDate, options.skipExclusions);

  // Claude API with system parameter for prompt caching
  const payload = {
    model: CLAUDE_CONFIG.model,
    max_tokens: CLAUDE_CONFIG.max_tokens,
    temperature: CLAUDE_CONFIG.temperature,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }  // Enable prompt caching (5 min TTL)
      }
    ],
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ]
  };

  const fetchOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31'  // Enable prompt caching
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    // Retry logic for rate limiting
    let retries = 3;
    let response;
    let responseData;

    for (let attempt = 1; attempt <= retries; attempt++) {
      response = UrlFetchApp.fetch(CLAUDE_API_ENDPOINT, fetchOptions);
      const statusCode = response.getResponseCode();
      responseData = JSON.parse(response.getContentText());

      // Handle API errors
      if (responseData.error || statusCode !== 200) {
        // Log the FULL error response for debugging
        Logger.log('❌ Full error response:');
        Logger.log(JSON.stringify(responseData, null, 2));
        Logger.log(`Status code: ${statusCode}`);

        const errorMsg = responseData.error ?
          (responseData.error.message || JSON.stringify(responseData.error)) :
          `HTTP ${statusCode}: ${response.getContentText().substring(0, 500)}`;

        // Check if it's a rate limit error
        if (statusCode === 429 || (errorMsg && errorMsg.includes('rate limit'))) {
          if (attempt < retries) {
            const waitSeconds = 30;
            Logger.log(`⏳ Rate limit hit (attempt ${attempt}/${retries}). Waiting ${waitSeconds} seconds...`);
            Utilities.sleep(waitSeconds * 1000);
            continue; // Retry
          }
        }

        Logger.log(`❌ Claude API error: ${errorMsg}`);
        throw new Error(`Claude API error: ${errorMsg}`);
      }

      // Success! Break out of retry loop
      break;
    }

    // Handle missing content (safety filtering or error)
    if (!responseData.content || responseData.content.length === 0) {
      Logger.log('⚠️ Claude returned no content (possible error or safety filter)');
      return {
        crimes: [],
        confidence: 0,
        ambiguities: ['AI returned no response - article may contain sensitive content or API error'],
        source_url: articleUrl
      };
    }

    // Check for truncated responses
    if (responseData.stop_reason === 'max_tokens') {
      Logger.log('⚠️ Response was truncated - flagging for manual review');

      // Try to parse what we got anyway
      const generatedText = responseData.content[0].text;
      const partial = parseClaudeResponse(generatedText, articleUrl);

      // If we got some crimes, use them but lower confidence
      if (partial.crimes && partial.crimes.length > 0) {
        partial.crimes.forEach(crime => {
          crime.confidence = Math.min(crime.confidence || 5, 3);
          crime.ambiguities = crime.ambiguities || [];
          crime.ambiguities.push('TRUNCATED: Response incomplete, may be missing crimes');
        });
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
    const generatedText = responseData.content[0].text;
    Logger.log(`✅ Claude response received (${generatedText.length} chars)`);

    // Parse and return
    return parseClaudeResponse(generatedText, articleUrl);

  } catch (error) {
    Logger.log(`❌ Error calling Claude API: ${error.message}`);
    throw error;
  }
}


// ============================================================================
// RESPONSE PARSING
// ============================================================================

/**
 * Parse Claude response and handle malformed JSON
 * @param {string} responseText - Raw text from Claude
 * @param {string} articleUrl - Source URL for logging
 * @returns {Object} Parsed crime data
 */
function parseClaudeResponse(responseText, articleUrl) {
  try {
    let cleanJson = responseText.trim();

    // Remove markdown code blocks if present (even though we told it not to)
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/```\n?/g, '');
    }

    // Strip trailing text after JSON (Claude sometimes adds notes after the closing brace)
    var lastBrace = cleanJson.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < cleanJson.length - 1) {
      cleanJson = cleanJson.substring(0, lastBrace + 1);
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
        source_url: articleUrl
      };
      extracted.crimes = [singleCrime];
    }

    // Validate new format
    if (!Array.isArray(extracted.crimes)) {
      extracted.crimes = [];
      extracted.ambiguities = extracted.ambiguities || [];
      extracted.ambiguities.push('Invalid response format - crimes is not an array');
    }

    // CRITICAL: Add source URL to EACH crime + ensure || paragraph breaks in details
    extracted.crimes.forEach(crime => {
      crime.source_url = articleUrl;

      // Normalize safety tip fields — default to 'No' if Claude omitted them.
      // This ensures every crime object has an explicit value in the sheet,
      // making it clear the field was evaluated (not just skipped by the pipeline).
      if (!crime.safety_tip_flag || (crime.safety_tip_flag !== 'Yes' && crime.safety_tip_flag !== 'No')) {
        crime.safety_tip_flag = 'No';
        crime.safety_tip_category = [];
        crime.safety_tip_context = [];
        crime.tactic_noted = crime.tactic_noted || '';
      } else {
        // Normalise arrays — Claude may return a string if only one value
        if (!Array.isArray(crime.safety_tip_category)) {
          crime.safety_tip_category = crime.safety_tip_category ? [crime.safety_tip_category] : [];
        }
        if (!Array.isArray(crime.safety_tip_context)) {
          crime.safety_tip_context = crime.safety_tip_context ? [crime.safety_tip_context] : [];
        }
      }

      // Note: || paragraph breaks are enforced in the system prompt.
      // Auto-insertion was removed — it broke on abbreviations like "Cpl.", "St.", "approx."
    });

    extracted.source_url = articleUrl;

    // Normalise per-crime confidence — new format has confidence on each crime object.
    // Fall back to top-level confidence for backward compat (cached prompt responses).
    const articleLevelConfidence = extracted.hasOwnProperty('confidence') ? extracted.confidence : 5;
    extracted.crimes.forEach(crime => {
      if (!crime.hasOwnProperty('confidence') || crime.confidence === null || crime.confidence === undefined) {
        crime.confidence = articleLevelConfidence;
        crime.ambiguities = crime.ambiguities || [];
        if (articleLevelConfidence === 5) {
          crime.ambiguities.push('Confidence score missing from AI response — defaulted to 5');
        }
      }
      if (!Array.isArray(crime.ambiguities)) {
        crime.ambiguities = [];
      }
    });

    Logger.log(`✅ Successfully parsed extraction: ${extracted.crimes.length} crime(s) found, confidence: ${extracted.confidence}`);
    return extracted;

  } catch (error) {
    Logger.log(`❌ Failed to parse Claude response: ${error.message}`);
    Logger.log(`Response text: ${responseText.substring(0, 500)}...`);
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
 * Run this manually to verify Claude integration
 */
function testClaudeExtraction() {
  Logger.log('=== TESTING CLAUDE EXTRACTION ===');

  // Verify API key first
  if (!verifyClaudeApiKey()) {
    return;
  }

  const sampleText = `A 58-year-old bar owner was shot and killed outside his vehicle at Pool Village, Rio Claro on Saturday night. Police identified the victim as Sylvan Boodan, also known as 'Lawa', who operated a bar on San Pedro Road. The incident occurred around 11:45 p.m. on November 2, 2024. Witnesses reported hearing multiple gunshots before seeing a vehicle speed away from the scene. Police are investigating the motive and searching for suspects.`;

  const sampleTitle = 'Bar owner killed in Rio Claro shooting';
  const sampleUrl = 'https://example.com/test-article';

  try {
    Logger.log('Calling Claude API...');
    const result = extractCrimeData(sampleText, sampleTitle, sampleUrl, new Date());

    Logger.log('=== EXTRACTION RESULT ===');
    Logger.log(JSON.stringify(result, null, 2));
    Logger.log('=========================');

    // Validate result — confidence is per-crime (not article-level) in new format
    const checkConf = result.crimes && result.crimes.length > 0
      ? (result.crimes[0].confidence || 0) : 0;
    if (checkConf >= 7) {
      Logger.log('✅ HIGH CONFIDENCE - Would go to Production');
    } else if (checkConf > 0) {
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
 * Test extraction with REAL data from Raw Articles sheet
 */
function testClaudeWithSheetData() {
  Logger.log('═════════════════════════════');
  Logger.log('Testing Claude with Sheet Data');
  Logger.log('═════════════════════════════');

  // Verify API key
  if (!verifyClaudeApiKey()) {
    return;
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');

  if (!sheet) {
    Logger.log('ERROR: "Raw Articles" sheet not found');
    return;
  }

  // Find first article with full text
  const data = sheet.getDataRange().getValues();
  let testRow = null;
  let rowNumber = -1;

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
  const publishedDate = testRow[5];  // Column F
  const currentStatus = testRow[6];  // Column G

  Logger.log('');
  Logger.log(`Testing with Row ${rowNumber}:`);
  Logger.log(`  Title: ${articleTitle.substring(0, 60)}...`);
  Logger.log(`  URL: ${articleUrl.substring(0, 60)}...`);
  Logger.log(`  Text Length: ${articleText.length} characters`);
  Logger.log(`  Current Status: ${currentStatus}`);
  Logger.log('');

  try {
    Logger.log('Calling Claude API with real sheet data...');
    Logger.log('');

    const result = extractCrimeData(articleText, articleTitle, articleUrl, publishedDate);

    Logger.log('═══════════════════════════════');
    Logger.log('EXTRACTION RESULT');
    Logger.log('═══════════════════════════════');
    Logger.log(JSON.stringify(result, null, 2));
    Logger.log('═══════════════════════════════');
    Logger.log('');

    // Validate result — confidence is per-crime (not article-level) in new format
    const firstCrime = result.crimes && result.crimes[0];
    const checkConf2 = firstCrime ? (firstCrime.confidence || 0) : 0;
    if (checkConf2 >= 7) {
      Logger.log('✅ HIGH CONFIDENCE - Would go to Production');
    } else if (checkConf2 > 0) {
      Logger.log('⚠️ LOW CONFIDENCE - Would go to Review Queue');
      Logger.log(`Ambiguities: ${(firstCrime.ambiguities || []).join(', ')}`);
    } else {
      Logger.log('❌ ZERO CONFIDENCE - Not a crime article');
      Logger.log(`Reason: ${(result.ambiguities || []).join(', ')}`);
    }

    Logger.log('');
    Logger.log('Test complete!');

  } catch (error) {
    Logger.log('');
    Logger.log(`❌ Test failed: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
  }
}
