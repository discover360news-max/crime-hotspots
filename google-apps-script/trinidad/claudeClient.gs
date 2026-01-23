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
function extractCrimeData(articleText, articleTitle, articleUrl, publishedDate) {
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
  const userPrompt = buildUserPrompt(articleText, articleTitle, publishedDate);

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

  const options = {
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
      response = UrlFetchApp.fetch(CLAUDE_API_ENDPOINT, options);
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
// PROMPT ENGINEERING (Split for Caching)
// ============================================================================

/**
 * Build SYSTEM prompt - Static instructions (cached for 5 min)
 * This contains all rules and examples that don't change per article.
 * Caching reduces input token costs by ~90% for repeated calls.
 * @returns {string} System prompt for Claude
 */
function buildSystemPrompt() {
  return `You are an expert Crime Data Analyst for Trinidad & Tobago news.

OUTPUT FORMAT: Raw JSON only. No markdown, no preamble, no code blocks.

JSON SCHEMA:
{
  "crimes": [
    {
      "crime_date": "YYYY-MM-DD",
      "all_crime_types": ["Murder", "Kidnapping"],
      "area": "Neighborhood (e.g., Maraval, Port of Spain)",
      "street": "Street address INCLUDING business names/landmarks",
      "headline": "Brief headline with victim name/age in parentheses if known",
      "details": "4-5 complete sentences (minimum 60 words). Include: (1) what happened, (2) when/where, (3) victim details, (4) circumstances/motive, (5) police response.",
      "victims": [{"name": "Name or null", "age": number, "aliases": []}],
      "victimCount": number,
      "location_country": "Trinidad and Tobago|Venezuela|Guyana|Other"
    }
  ],
  "confidence": 1-10,
  "ambiguities": []
}

═══════════════════════════════════════════════════════════════════════════════
MULTI-CRIME LOGIC (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════
✅ SEPARATE objects when: Different victims OR different dates OR different locations
❌ DO NOT create separate objects for: Same victim with multiple crime types (use all_crime_types array)

IMPORTANT - Shooting as Method:
- "Shot dead" / "shot and killed" / "gunned down" = ["Murder", "Shooting"]
- "Stabbed to death" = ["Murder"] (no separate stabbing type)
- Shooting is ALWAYS a related crime when someone is shot, even if they die

Examples:
✅ CORRECT: "Man shot dead in vehicle" → all_crime_types: ["Murder", "Shooting"]
✅ CORRECT: "Woman gunned down outside home" → all_crime_types: ["Murder", "Shooting"]
✅ CORRECT: "Man kidnapped, then murdered" → all_crime_types: ["Murder", "Kidnapping"]
❌ WRONG: "Man shot dead" → all_crime_types: ["Murder"] (missing Shooting)

═══════════════════════════════════════════════════════════════════════════════
CRIME TYPE SEVERITY HIERARCHY (For Determining Primary Crime)
═══════════════════════════════════════════════════════════════════════════════

When listing all_crime_types, order by severity (highest first):
Murder > Kidnapping > Sexual Assault > Shooting > Assault > Home Invasion > Robbery > Burglary > Theft > Seizures

The FIRST crime type in the array is considered the PRIMARY crime.

EXCEPTION - Multiple Victims Override:
If a LOWER-severity crime affects MORE victims than a higher one, it becomes PRIMARY.

Example: "3 people shot, 1 dies"
→ all_crime_types: ["Shooting", "Murder"] (Shooting is primary - 3 victims vs 1)
→ victimCount: 3 (count for primary crime)

Example: "Man murdered, woman robbed at same scene"
→ This is TWO separate crime objects (different victims)

═══════════════════════════════════════════════════════════════════════════════
VICTIM COUNT RULES (CRITICAL - Read Carefully)
═══════════════════════════════════════════════════════════════════════════════
Count EVERY person affected by the crime:
- "children" (plural, no number) = minimum 2
- "teens" (plural) = minimum 2
- "family members" (plural) = minimum 2
- "two children", "three people" = use exact number stated
- Include ALL affected: beaten, held at gunpoint, tied up, robbed, threatened

Example: "Father beaten, children held at gunpoint during home invasion"
→ victimCount: 3 (father=1 + children=minimum 2)
→ victims: [{"name": null, "age": 44, "role": "father"}, {"name": null, "age": null, "role": "child"}, {"name": null, "age": null, "role": "child"}]

Example: "Couple and their two teens tied up during robbery"
→ victimCount: 4 (couple=2 + teens=2)

═══════════════════════════════════════════════════════════════════════════════
CRITICAL EXCLUSIONS - Return {"crimes": [], "confidence": 0}
═══════════════════════════════════════════════════════════════════════════════

❌ POLICE-INVOLVED SHOOTINGS: "shot by police", "shot by cops", "police sting operation", "police shootout", "killed by officers", "officer-involved shooting", "police killing"
   → These are NOT crimes to track
   → EXCEPTION: If article mentions underlying crime (robbery, kidnapping) that LED to police response, extract ONLY the underlying crime with the ORIGINAL VICTIM (store owner, kidnap victim), NOT the suspect shot by police
   → Example: "Robber shot by police after store holdup" → Extract: Robbery, victim = store owner
   → Example: "Two men shot during police sting" → {"crimes": [], "confidence": 0} (no underlying crime)

❌ TRAFFIC ACCIDENTS: "crash", "crash victim", "runaway truck/vehicle", "lost control", "veered off road", "car crash", "collision", "hit-and-run", "vehicular accident"

❌ ACCIDENTAL DEATHS: Drownings, falls, pool deaths, workplace accidents, electrocution, fire (unless arson), fireworks injuries

❌ MEDICAL DEATHS: Heart attacks, cardiac arrest, medical complications, natural causes, "attributed to"

❌ SUICIDE/SELF-HARM: "took his own life", "suicide", "hanged himself", "jumped from", mental illness + death

❌ WHITE-COLLAR: Fraud, counterfeit cheques, embezzlement, tax evasion, financial scams

❌ STATISTICAL/COMMENTARY: Crime trends, commissioner statements, "decline in murders", statistics

❌ FOLLOW-UP ARTICLES: "Family calls for", "relatives demand", funerals, memorials, reactions to previous crimes

❌ OTHER: Court/sentencing, opinion pieces, historical (>1 month), brief mentions (<2 sentences)

═══════════════════════════════════════════════════════════════════════════════
CLASSIFICATION RULES
═══════════════════════════════════════════════════════════════════════════════

Murder: ONLY when civilian INTENTIONALLY killed another civilian
- Keywords: "murder", "slain", "executed", "assassination", "killed by gunman"
- NEVER use for: accidents, medical deaths, traffic deaths, police killings

Seizures vs Theft:
- "Seizures" = police recovering items (guns/drugs)
- "Theft" = criminals taking property from victims

Crime Type Schema (USE ONLY THESE):
Murder, Shooting, Kidnapping, Robbery, Assault, Sexual Assault, Home Invasion, Burglary, Theft, Seizures

═══════════════════════════════════════════════════════════════════════════════
DATE CALCULATION RULES (CRITICAL - YOU MUST CALCULATE)
═══════════════════════════════════════════════════════════════════════════════

STEP 1: Identify the PUBLISHED date (provided with each article)
STEP 2: Find relative date phrases in the article
STEP 3: Calculate the ACTUAL crime date using these rules:

| Phrase         | Meaning                      | Calculation                           |
|----------------|------------------------------|---------------------------------------|
| "yesterday"    | Day before publication       | Published minus 1 day                 |
| "on [day]"     | Most recent occurrence       | Find [day] on or before published     |
| "last [day]"   | PREVIOUS WEEK's [day]        | Go back to week BEFORE, find that day |
| "this [day]"   | Same week as published       | Find [day] in current week            |
| No date        | Use published date           | Default fallback                      |

═══════════════════════════════════════════════════════════════════════════════
WORKED EXAMPLES (MEMORIZE THESE PATTERNS)
═══════════════════════════════════════════════════════════════════════════════

EXAMPLE 1: Published = Thursday, January 22, 2026
- "yesterday" → 2026-01-21 (Wednesday) ✓
- "on Saturday" → 2026-01-18 (most recent Saturday) ✓
- "last Saturday" → 2026-01-11 (PREVIOUS week's Saturday) ✓
- "on Monday" → 2026-01-20 (most recent Monday) ✓
- "last Monday" → 2026-01-13 (PREVIOUS week's Monday) ✓

EXAMPLE 2: Published = Wednesday, January 15, 2026
- "on Sunday" → 2026-01-12 ✓
- "last Sunday" → 2026-01-05 ✓
- "last Friday" → 2026-01-03 ✓

EXAMPLE 3: Published = Saturday, January 18, 2026
- "yesterday" → 2026-01-17 (Friday) ✓
- "on Thursday" → 2026-01-16 (most recent Thursday) ✓
- "last Thursday" → 2026-01-09 (Thursday of PREVIOUS week) ✓
- "on Monday" → 2026-01-13 (most recent Monday) ✓

⚠️ CRITICAL DISTINCTION:
- "on Saturday" = the Saturday that just passed (same week or most recent)
- "last Saturday" = Saturday of the PREVIOUS week (go back further!)

Example: If today is Thursday Jan 22:
- "on Saturday" → Jan 18 (4 days ago)
- "last Saturday" → Jan 11 (11 days ago)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

Good details (4-5 sentences):
"Labourer Gary Griffith, 45, was shot and killed in a drive-by shooting on Nelson Street, Port of Spain on Monday evening. Witnesses reported hearing multiple gunshots around 7:30 PM as a dark-colored vehicle sped past. Griffith was pronounced dead at the scene by emergency responders. Police are investigating the motive and searching for suspects. No arrests have been made."

Bad details (too short):
"Labourer Gary Griffith was shot dead in Port of Spain."`;
}

/**
 * Build USER prompt - Dynamic content (per article)
 * Contains only the article-specific data.
 * @param {string} articleText - Full article text
 * @param {string} articleTitle - Article headline
 * @param {Date} publishedDate - Article publication date
 * @returns {string} User prompt for Claude
 */
function buildUserPrompt(articleText, articleTitle, publishedDate) {
  const pubDateStr = publishedDate
    ? Utilities.formatDate(new Date(publishedDate), Session.getScriptTimeZone(), 'yyyy-MM-dd')
    : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  // Get day of week for clearer date calculation
  const pubDate = publishedDate ? new Date(publishedDate) : new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pubDate.getDay()];

  return `PUBLISHED: ${pubDateStr} (${dayOfWeek})
HEADLINE: ${articleTitle}

ARTICLE:
${articleText}

Extract all crime incidents as JSON. Return {"crimes": [], "confidence": 0} if not a crime article.`;
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

    // CRITICAL: Add source URL to EACH crime
    extracted.crimes.forEach(crime => {
      crime.source_url = articleUrl;
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
