/**
 * Groq API client for crime data extraction
 * Model: llama-3.1-8b-instant
 * Free tier: 14,400 requests/day, 30 requests/minute
 *
 * MIGRATED FROM: Gemini Flash (20 requests/day limit)
 * MIGRATION DATE: January 2026
 */

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Check if Groq response was truncated or incomplete
 */
function isResponseTruncated(responseData) {
  if (!responseData.choices || responseData.choices.length === 0) {
    return false;
  }

  const choice = responseData.choices[0];

  // Groq uses "finish_reason" field (OpenAI-compatible)
  if (choice.finish_reason === 'length') {
    Logger.log('⚠️ Response truncated: Hit token limit');
    return true;
  }

  const text = choice.message.content;
  const trimmed = text.trim();

  if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
    Logger.log('⚠️ Response truncated: Incomplete JSON (no closing brace)');
    return true;
  }

  return false;
}

/**
 * Extract structured crime data from article text using Groq
 * @param {string} articleText - Full article text
 * @param {string} articleTitle - Article headline
 * @param {string} articleUrl - Source URL
 * @param {Date} publishedDate - Article publication date
 * @returns {Object} Extracted crime data as JSON
 */
function extractCrimeData(articleText, articleTitle, articleUrl, publishedDate) {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    throw new Error('Groq API key not configured. Run setGroqApiKey() first.');
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

  const prompt = buildExtractionPrompt(articleText, articleTitle, publishedDate);

  // Groq uses OpenAI-compatible Chat Completions format
  const payload = {
    model: GROQ_CONFIG.model,
    messages: [
      {
        role: 'system',
        content: 'You are a precise crime data extraction assistant. Extract structured crime data from Trinidad & Tobago news articles. Return ONLY valid JSON, no markdown formatting.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: GROQ_CONFIG.temperature,
    max_tokens: GROQ_CONFIG.max_tokens,
    top_p: GROQ_CONFIG.top_p
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${apiKey}`
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
      response = UrlFetchApp.fetch(GROQ_API_ENDPOINT, options);
      responseData = JSON.parse(response.getContentText());

      // Handle API errors
      if (responseData.error) {
        const errorMsg = responseData.error.message;

        // Check if it's a rate limit error
        if (errorMsg.includes('Rate limit reached')) {
          if (attempt < retries) {
            // Extract wait time from error message (e.g., "Please try again in 14.61s")
            const waitMatch = errorMsg.match(/try again in ([\d.]+)s/);
            const waitSeconds = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) + 2 : 30;

            Logger.log(`⏳ Rate limit hit (attempt ${attempt}/${retries}). Waiting ${waitSeconds} seconds...`);
            Utilities.sleep(waitSeconds * 1000);
            continue; // Retry
          }
        }

        Logger.log(`❌ Groq API error: ${errorMsg}`);
        throw new Error(`Groq API error: ${errorMsg}`);
      }

      // Success! Break out of retry loop
      break;
    }

    // Handle missing choices (safety filtering or error)
    if (!responseData.choices || responseData.choices.length === 0) {
      Logger.log('⚠️ Groq returned no choices (possible error or safety filter)');
      return {
        crimes: [],
        confidence: 0,
        ambiguities: ['AI returned no response - article may contain sensitive content or API error'],
        source_url: articleUrl
      };
    }

    // Check for truncated responses
    if (isResponseTruncated(responseData)) {
      Logger.log('⚠️ Response was truncated - flagging for manual review');

      // Try to parse what we got anyway
      const generatedText = responseData.choices[0].message.content;
      const partial = parseGroqResponse(generatedText, articleUrl);

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
    const generatedText = responseData.choices[0].message.content;
    Logger.log(`✅ Groq response received (${generatedText.length} chars)`);

    // Parse and return
    return parseGroqResponse(generatedText, articleUrl);

  } catch (error) {
    Logger.log(`❌ Error calling Groq API: ${error.message}`);
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
 * @param {Date} publishedDate - Article publication date
 * @returns {string} Complete prompt for Groq
 */
function buildExtractionPrompt(articleText, articleTitle, publishedDate) {
  const pubDateStr = publishedDate
    ? Utilities.formatDate(new Date(publishedDate), Session.getScriptTimeZone(), 'yyyy-MM-dd')
    : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  return `Extract crime data from this Trinidad & Tobago news article.

PUBLISHED: ${pubDateStr}
HEADLINE: ${articleTitle}

ARTICLE:
${articleText}

Extract ALL distinct crime incidents as JSON array.

CRITICAL: Each crime object = ONE incident (same victim + date + location). Use all_crime_types array for multiple types in same incident.

{
  "crimes": [
    {
      "crime_date": "YYYY-MM-DD (calculate from article, NOT published date)",
      "all_crime_types": ["Murder", "Kidnapping"], // ← ALL types in THIS incident
      "area": "Neighborhood (e.g., Maraval, Port of Spain)",
      "street": "Street address INCLUDING business names/landmarks",
      "headline": "Brief headline with victim name/age in parentheses if known",
      "details": "IMPORTANT: Write 4-5 complete sentences (minimum 60 words). Include: (1) what happened, (2) when/where it occurred, (3) victim details if known, (4) circumstances/motive if mentioned, (5) police response/investigation status. Make it informative, engaging, and SEO-friendly.",
      "victims": [{"name": "Name or null", "age": number, "aliases": []}],
      "location_country": "Trinidad|Venezuela|Guyana|Other"
    }
  ],
  "confidence": 1-10,
  "ambiguities": []
}

MULTI-CRIME LOGIC (CRITICAL):
✅ SEPARATE objects when: Different victims OR different dates OR different locations
❌ DO NOT create separate objects for: Same victim with multiple crime types (use all_crime_types array instead)

Examples:
✅ CORRECT: "Man kidnapped, then murdered" → ONE object with all_crime_types: ["Murder", "Kidnapping"]
❌ WRONG: "Man kidnapped, then murdered" → TWO separate objects (one Murder, one Kidnapping)

✅ CORRECT: "Store robbed, owner shot during robbery" → ONE object with all_crime_types: ["Robbery", "Shooting"]
❌ WRONG: "Store robbed, owner shot" → TWO separate objects

CRITICAL RULES:

Role: Expert Crime Data Analyst. Input: Article Text and ${pubDateStr}. Output: Raw JSON only. No markdown, no preamble. If non-crime, return {"crimes": [], "confidence": 0}.

1. Extraction Logic (The "What")

Inclusion: Only T&T-based INTENTIONAL violent crimes (Murder, Shooting, Robbery, Assault), property crimes (Home Invasion, Burglary, Theft), and police Seizures. Article must describe THE INCIDENT ITSELF (what happened, when, where). Exclude reactions/follow-ups to previous incidents.

CRITICAL EXCLUSIONS - Return {"crimes": [], "confidence": 0} for:
❌ TRAFFIC ACCIDENTS: "crash", "crash victim", "runaway truck/vehicle", "lost control", "veered off road", "car crash", "collision", "hit-and-run", "vehicular accident"
❌ ACCIDENTAL DEATHS: Drownings, falls, pool deaths, workplace accidents, electrocution, fire (unless arson), fireworks injuries
❌ MEDICAL DEATHS: Heart attacks, cardiac arrest, medical complications, natural causes, "attributed to" (indirect medical causation)
❌ SUICIDE/SELF-HARM: "Took his own life", "take his own life", "suicide", "hanged himself", "jumped from", mental illness + death context
❌ WHITE-COLLAR CRIME: Fraud, counterfeit cheques/money, embezzlement, tax evasion, financial scams, business warnings
❌ STATISTICAL/COMMENTARY: Articles ABOUT crime trends, commissioner statements, "decline in murders", "increase in crime", statistics, analysis
❌ FOLLOW-UP/REACTION ARTICLES: "Family calls for", "relatives demand", "victim's family", articles about funerals/memorials/reactions to previous crimes
❌ OTHER: Court/sentencing, opinion pieces, historical (>1 month), brief mentions (<2 sentences)

CRITICAL: If article says "accident", "crash", "crash victim", "lost control", "crashed", "drowned", "fell", "suicide", "took his own life", "mental illness", "heart attack", "attributed to", "decline in", "commissioner reports", "statistics show", "family calls for", "relatives demand", "funeral held" → NOT A CRIME → return zero crimes.

Exclusion Examples (DO NOT extract as crimes):
- "Baby found dead in pool" → Accidental drowning → {"crimes": [], "confidence": 0}
- "Runaway truck kills child" → Traffic accident → {"crimes": [], "confidence": 0}
- "Car crash kills 2 on highway" → Traffic accident → {"crimes": [], "confidence": 0}
- "Man falls from building" → Accidental death → {"crimes": [], "confidence": 0}
- "Driver loses control, hits pedestrian" → Traffic accident → {"crimes": [], "confidence": 0}
- "Man dies in fire at home, police believe he tried to take his own life" → Suicide → {"crimes": [], "confidence": 0}
- "Person hanged himself" → Suicide → {"crimes": [], "confidence": 0}
- "Man with mental illness found dead" → Medical/Natural → {"crimes": [], "confidence": 0}
- "Newborn baby dies after heart attack attributed to fireworks" → Medical death (indirect causation) → {"crimes": [], "confidence": 0}
- "Man suffers cardiac arrest during robbery" → If robbery is the crime, extract robbery only (heart attack is medical consequence, not a crime)
- "Ministry warns businesses of counterfeit cheques in circulation" → White-collar fraud → {"crimes": [], "confidence": 0}
- "Company charged with tax evasion" → White-collar fraud → {"crimes": [], "confidence": 0}
- "Commissioner reports decline in murders for 2025" → Statistical commentary (no specific incident) → {"crimes": [], "confidence": 0}
- "Police chief says crime down 15% this year" → Statistical commentary → {"crimes": [], "confidence": 0}
- "Family of Charlieville crash victim call for justice" → Traffic accident + follow-up article → {"crimes": [], "confidence": 0}
- "Relatives demand answers after son's murder" → Follow-up/reaction article (not the incident itself) → {"crimes": [], "confidence": 0}
- "Funeral held for shooting victim" → Follow-up article (not the incident) → {"crimes": [], "confidence": 0}

2. Classification Rules

Murder Definition: ONLY use "Murder" when:
- Civilian INTENTIONALLY killed another civilian (shooting, stabbing, beating)
- Article uses words: "murder", "slain", "executed", "assassination", "killed by gunman"
- NEVER use for: accidents, medical deaths, traffic deaths, police killings

Police-Involved Shooting: ONLY when law enforcement killed someone.

Seizures vs. Theft: "Seizures" = police recovering items (guns/drugs). "Theft" = criminals taking property from victims.

Multi-Type (SAME victim/incident): Use all_crime_types array (e.g., ["Murder", "Kidnapping"]). DO NOT create separate objects.

Multi-Victim (DIFFERENT people): Create separate crime object for each victim.

3. Data Formatting

Crime Date: Calculate relative to ${pubDateStr}. "Yesterday" = -1 day; "Monday" = most recent Monday. Default to ${pubDateStr} if unspecified.

Location: Format street as "Business/Landmark, Street Name". Set location_country to "Trinidad and Tobago" or "Other".

Identity: Include victim name, age, and aliases for deduplication detection.

Summary Examples:
❌ BAD (too short): "Labourer Gary Griffith was shot dead in a drive-by shooting in Port of Spain."
✅ GOOD (4-5 sentences): "Labourer Gary Griffith, 45, was shot and killed in a drive-by shooting on Nelson Street, Port of Spain on Monday evening. Witnesses reported hearing multiple gunshots around 7:30 PM as a dark-colored vehicle sped past Griffith, who was standing outside his home. Griffith was pronounced dead at the scene by emergency responders. Police are investigating the motive for the attack and searching for suspects. No arrests have been made at this time."

Multi-Crime Format Examples:
✅ CORRECT: Firefighter kidnapped then murdered → ONE crime object
{
  "crimes": [{
    "crime_date": "2025-12-27",
    "all_crime_types": ["Murder", "Kidnapping"],
    "headline": "Missing firefighter found murdered (John Doe, 35)",
    "victims": [{"name": "John Doe", "age": 35}]
  }],
  "confidence": 9
}

❌ WRONG: Same incident split into 6 separate crimes with duplicate dates/types

4. Crime Type Schema Use only: Murder, Shooting, Kidnapping, Robbery, Assault, Sexual Assault, Home Invasion, Burglary, Theft, Seizures. No "Other".

Return ONLY the JSON object. NO markdown code blocks, NO \`\`\`json tags, NO explanatory text. Just the raw JSON.`;
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

/**
 * Parse Groq response and handle malformed JSON
 * @param {string} responseText - Raw text from Groq
 * @param {string} articleUrl - Source URL for logging
 * @returns {Object} Parsed crime data
 */
function parseGroqResponse(responseText, articleUrl) {
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
    Logger.log(`❌ Failed to parse Groq response: ${error.message}`);
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
 * Run this manually to verify Groq integration
 */
function testGroqExtraction() {
  Logger.log('=== TESTING GROQ EXTRACTION ===');

  // Verify API key first
  if (!verifyGroqApiKey()) {
    return;
  }

  const sampleText = `A 58-year-old bar owner was shot and killed outside his vehicle at Pool Village, Rio Claro on Saturday night. Police identified the victim as Sylvan Boodan, also known as 'Lawa', who operated a bar on San Pedro Road. The incident occurred around 11:45 p.m. on November 2, 2024. Witnesses reported hearing multiple gunshots before seeing a vehicle speed away from the scene. Police are investigating the motive and searching for suspects.`;

  const sampleTitle = 'Bar owner killed in Rio Claro shooting';
  const sampleUrl = 'https://example.com/test-article';

  try {
    Logger.log('Calling Groq API...');
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
 * This reads from your actual sheet instead of using sample data
 */
function testGroqWithSheetData() {
  Logger.log('═════════════════════════════');
  Logger.log('Testing Groq with Sheet Data');
  Logger.log('═════════════════════════════');

  // Verify API key
  if (!verifyGroqApiKey()) {
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
    Logger.log('Calling Groq API with real sheet data...');
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

/**
 * Test multi-crime extraction
 */
function testMultiCrimeExtraction() {
  Logger.log('=== TESTING MULTI-CRIME EXTRACTION ===');

  if (!verifyGroqApiKey()) {
    return;
  }

  const multiCrimeSample = `Police are investigating three separate violent incidents that occurred over the weekend in Trinidad. On Friday night around 11:45 p.m., a 58-year-old bar owner identified as Sylvan Boodan was shot and killed outside his vehicle at Pool Village, Rio Claro. Witnesses reported hearing multiple gunshots.

  On Saturday morning, two armed men robbed a grocery store on Main Road, Chaguanas. The suspects escaped with approximately $15,000 in cash. No injuries were reported.

  On Sunday evening, a 34-year-old woman was assaulted during a home invasion in San Fernando. Police are searching for the suspects.

  All three incidents are being investigated separately.`;

  const sampleTitle = 'Weekend crime wave: Three separate incidents reported';
  const sampleUrl = 'https://example.com/multi-crime-test';

  try {
    Logger.log('Calling Groq API with multi-crime article...');
    const result = extractCrimeData(multiCrimeSample, sampleTitle, sampleUrl, new Date());

    Logger.log('=== EXTRACTION RESULT ===');
    Logger.log(JSON.stringify(result, null, 2));
    Logger.log('=========================');

    Logger.log(`\n✅ Detected ${result.crimes.length} separate crime incidents`);
    Logger.log(`Confidence: ${result.confidence}`);

    result.crimes.forEach((crime, index) => {
      Logger.log(`\nCrime ${index + 1}:`);
      Logger.log(`  Date: ${crime.crime_date}`);
      Logger.log(`  Type: ${crime.all_crime_types ? crime.all_crime_types.join(', ') : 'N/A'}`);
      Logger.log(`  Area: ${crime.area}`);
      Logger.log(`  Headline: ${crime.headline}`);
    });

  } catch (error) {
    Logger.log(`❌ Test failed: ${error.message}`);
  }
}
