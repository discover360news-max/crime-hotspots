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
// PROMPT ENGINEERING (Split for Caching)
// ============================================================================

/**
 * Build SYSTEM prompt - Static instructions (cached for 5 min)
 * This contains all rules and examples that don't change per article.
 * Caching reduces input token costs by ~90% for repeated calls.
 *
 * STRUCTURE (foundational rules first, so later sections can reference them):
 *   Schema → Hierarchy → Hard Implications → Classification → Special Combos
 *   → Multi-crime Logic → Victim Count → Police + Exclusions → Confidence → Dates
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
      "details": "3-5 sentences using ONLY facts stated in the article — do NOT infer. Separate logical paragraphs with || delimiter (omitting || is an error). Prioritise: (1) what happened + when/where, (2) victim details, (3) police response. Use fewer sentences if article is thin.",
      "victims": [{"name": "Name or null", "age": number_or_null, "aliases": []}],
      "victimCount": number,
      "location_country": "Trinidad|Tobago|Trinidad and Tobago|Venezuela|Guyana|Other",
      "confidence": 1-10,
      "ambiguities": ["reason if confidence < 7, else empty array []"],
      "safety_tip_flag": "Yes or No",
      "safety_tip_category": ["If flagged: all applicable — ${SAFETY_TIP_CATEGORIES.join('|')}. Empty [] if not flagged."],
      "safety_tip_context": ["If flagged: all applicable — ${SAFETY_TIP_CONTEXTS.join('|')}. Empty [] if not flagged."],
      "tactic_noted": "If flagged: one sentence describing the specific tactic used. Blank if not flagged."
    }
  ]
}

location_country: Use "Trinidad" for mainland crimes, "Tobago" for Tobago crimes, "Trinidad and Tobago" only when the article is explicitly national in scope (e.g., a country-wide statistic or announcement).

details format: Must include || paragraph breaks between logical sections.
Good: "Labourer Gary Griffith, 45, was shot in a drive-by on Nelson Street.||Griffith was pronounced dead at the scene.||Police are investigating; no arrests made."
Bad (no || breaks): same content run together as one block — this is an error.

Safety tip guidance: Flag "Yes" ONLY when the incident reveals a tactic residents could counter by changing their behaviour.
- Worth flagging: victim withdrew ATM cash and was followed home (preventable tactic)
- Not worth flagging: man shot in front of home (no actionable tactic)
- If flagged: list ALL applicable categories and contexts, ordered most-specific first (e.g. "ATM Crime" before "Robbery"). safety_tip_category and safety_tip_context must be [] if not flagged.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
CRIME TYPE HIERARCHY (Foundation \u2014 read before all other rules)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

Order all_crime_types by severity, highest first:
${buildCrimeHierarchyString()}

The FIRST entry in all_crime_types is the PRIMARY crime.
Context types marked [context] describe setting or relationship \u2014 they ALWAYS appear AFTER harm types, regardless of severity score.

MULTIPLE VICTIMS OVERRIDE (same continuous event, same location, same time):
If a lower-severity crime affects more victims than a higher one, it becomes primary.
Example: "3 people shot, 1 dies" \u2192 one crime object (one event), all_crime_types: ["Shooting", "Murder"], victimCount: 3
(Shooting is primary \u2014 3 victims vs Murder's 1. victimCount counts all affected by the primary crime.)
This override applies ONLY within a single event. Different events \u2192 separate crime objects.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
HARD IMPLICATION RULES \u2014 ALWAYS APPLY, NO CONFIRMATION NEEDED
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

Certain crime types definitionally imply others. Always include implied types even if the article does not name them:
${buildHardImplicationsBlock()}

\u2705 "Man carjacked in Maraval" \u2192 ["Carjacking", "Robbery"]
\u2705 "Family robbed during home invasion" \u2192 ["Robbery", "Home Invasion", "Burglary"]
\u274c WRONG: ["Carjacking"] alone \u2014 Robbery always required
\u274c WRONG: ["Robbery", "Home Invasion"] \u2014 Burglary always required with Home Invasion

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
CLASSIFICATION RULES
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

Use ONLY these crime types (listed highest to lowest severity):
${buildCrimeTypesList()}

Per-type rules:
${buildClassificationRulesBlock()}

Note \u2014 Seizures vs Theft:
- Seizures = police recovering contraband (guns, drugs, cash)
- Theft = criminals taking property from victims without force or threat
- Never use Theft when Robbery applies (force or threat was involved)

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
ASSAULT + ROBBERY COMBINATIONS
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

Add "Assault" whenever the victim is physically struck or beaten \u2014 even when Robbery is also present.
\u2705 "Man beaten and robbed" \u2192 ["Robbery", "Assault"]
\u2705 "Woman punched, phone snatched" \u2192 ["Robbery", "Assault"]
\u2705 "Victim pistol-whipped during robbery" \u2192 ["Robbery", "Assault"]
\u274c "Robbed at gunpoint" \u2192 ["Robbery"] only \u2014 threat, no physical strike
\u274c "Armed men held family at gunpoint" \u2192 ["Home Invasion", "Robbery"] \u2014 threat only, no Assault

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
CONTEXT TYPES \u2014 ORDERING RULE
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

Home Invasion and Domestic Violence describe SETTING or RELATIONSHIP, not the primary harm.
They always appear AFTER harm types in all_crime_types, regardless of severity.

\u2705 "Family robbed during home invasion" \u2192 ["Robbery", "Home Invasion"]
\u2705 "Man assaulted wife" \u2192 ["Assault", "Domestic Violence"]
\u2705 "Man shot wife" \u2192 ["Murder", "Shooting", "Domestic Violence"]
\u274c WRONG: ["Domestic Violence", "Assault"] \u2014 harm type must come first

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
SHOOTING CLASSIFICATION
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

\u26a0\ufe0f Gun Present \u2260 Shooting. "Shooting" means a firearm was DISCHARGED \u2014 a bullet was fired at a person.
"At gunpoint" / "armed with a gun" / "brandished firearm" = gun used as THREAT only, NOT a Shooting.

FATAL SHOOTINGS \u2014 always pair Murder and Shooting:
\u2705 "Shot dead" / "shot and killed" / "gunned down" \u2192 ["Murder", "Shooting"]
\u2705 "Stabbed to death" \u2192 ["Murder"] only (no stabbing crime type)
\u274c WRONG: "Man shot dead" \u2192 ["Murder"] alone \u2014 Shooting is always required when shot

NON-FATAL SHOOTINGS \u2014 person directly targeted:
Default: if a person was directly targeted and shot (or shot at), use Attempted Murder as primary + Shooting as related.
Use Shooting as primary ONLY when the victim was an unintended bystander (stray bullet, crossfire not aimed at them) OR no person was directly targeted (shots at property, into the air, warning shots).
Drive-bys targeting a group of people \u2192 Attempted Murder (the group was deliberately targeted).
\u2705 "Man shot in leg, rushed to hospital" \u2192 ["Attempted Murder", "Shooting"] (directly targeted)
\u2705 "Three shot during drive-by, all survived" \u2192 ["Attempted Murder", "Shooting"] (group was the target)
\u2705 "Stray bullet strikes bystander at Carnival" \u2192 ["Shooting"] (unintended victim \u2014 not the target)
\u2705 "Shots fired at house, no one inside" \u2192 ["Shooting"] (no person targeted)
\u2705 "Gunman fired repeatedly at man's head, victim survived" \u2192 ["Attempted Murder", "Shooting"] (directly targeted)
\u274c WRONG: "Man shot, survived" \u2192 ["Shooting"] (person was directly shot \u2014 use Attempted Murder)

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
MULTI-CRIME LOGIC + ISOLATION RULE
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

\u2705 Create SEPARATE crime objects: different victims OR different dates OR different locations
\u274c Do NOT separate: same victim with multiple crime types \u2014 use all_crime_types array

ISOLATION RULE \u2014 multi-incident articles:
When one article reports crimes at different locations or times, each crime object is FULLY INDEPENDENT:
- "area" and "street" MUST come ONLY from sentences describing THAT incident
- "crime_date" MUST come ONLY from THAT incident's time reference
- "victims" MUST include ONLY people harmed in THAT incident
- "victimCount" is per crime object \u2014 NOT the article total
- NEVER carry over area, date, or victims from one incident to another

Example \u2014 "Kyle Alexander and Curtis Pierre shot dead in El Dorado. In a separate incident, a man was killed in Valsayn."
\u2705 Crime 1: area="El Dorado", victims=[Kyle Alexander, Curtis Pierre], victimCount=2
\u2705 Crime 2: area="Valsayn", victims=[that victim], victimCount=1
\u274c WRONG: Crime 1 victimCount=3 (article total, not this incident's count)

BRIEF MENTION EXCLUSION:
Apply only to incidents described in 1 sentence with no victim, date, or location detail.
- Multi-incident articles (e.g., "3 murders in 4 hours"): extract EACH as a full crime object \u2014 all are main subjects
- Context references ("This follows last week's murder of..."): do NOT extract the old crime

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
VICTIM COUNT RULES
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

Count EVERY person affected by the crime:
- "children" / "teens" / "family members" (plural, no number) = minimum 2
- "two children", "three people" = use the exact number stated
- Include ALL affected: beaten, held at gunpoint, tied up, robbed, threatened

Example: "Father beaten, children held at gunpoint during home invasion"
\u2192 victimCount: 3 (father=1 + children=minimum 2)
\u2192 victims: [{"name": null, "age": null, "aliases": []}, {"name": null, "age": null, "aliases": []}, {"name": null, "age": null, "aliases": []}]

victimCount MUST equal victims array length \u2014 add unnamed objects to fill the gap:
"Four people were shot, including John Smith" \u2192 victimCount: 4, victims: [{"name": "John Smith", ...}, {"name": null, "age": null, "aliases": []}, {"name": null, "age": null, "aliases": []}, {"name": null, "age": null, "aliases": []}]
NEVER have victimCount: 4 with only 1 object in victims \u2014 they must always match.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
POLICE DIRECTIONALITY \u2014 READ BEFORE APPLYING EXCLUSIONS
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

\u26a0\ufe0f Before applying any police exclusion, determine WHO WAS SHOT:
\u2192 Criminal shoots AT police = \u2705 EXTRACT (officer is the victim)
\u2192 Police shoots suspect = \u274c EXCLUDE

POLICE AS VICTIM (overrides all exclusions):
- "Gunman opened fire on police" \u2192 \u2705 Shooting, victim = officer(s)
- "Constable killed by gunman" \u2192 \u2705 Murder + Shooting, victim = constable
- If officer AND civilian wounded in same attack, count all as victims

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
EXCLUSIONS \u2014 Return {"crimes": [], "confidence": 0}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

\u274c POLICE AS SHOOTER: "shot by police", "killed by officers", "officer-involved shooting"
   \u2192 Exclude when police shoot/kill a suspect during operations
   \u2192 Exception: extract the underlying crime (robbery, kidnapping) with the original victim
   \u2192 "Robber shot by police after store holdup" \u2192 Extract: Robbery, victim = store owner
   \u2192 Never apply when police are the ones being shot at

\u274c TRAFFIC ACCIDENTS: crash, runaway vehicle, lost control, collision, hit-and-run, vehicular accident

\u274c ACCIDENTAL DEATHS: drownings, falls, workplace accidents, electrocution, non-arson fire, fireworks

\u274c MEDICAL DEATHS: heart attacks, cardiac arrest, natural causes, "attributed to"

\u274c SUICIDE/SELF-HARM: "took his own life", "suicide", "hanged himself", "jumped from"

\u274c WHITE-COLLAR: fraud, counterfeit cheques, embezzlement, financial scams

\u274c STATISTICAL/COMMENTARY: crime trend reports, commissioner statements, "decline in murders"

\u274c FOLLOW-UP ARTICLES: "family calls for justice", funerals, memorials, reactions to previous crimes
   Exception: arrest and charge reports ARE valid \u2014 extract the underlying crime with the original victim and original date

\u274c PHOTO CAPTIONS: short text with "\u2014Photo:" or image credit lines

\u274c BRIEF MENTIONS: < 2 sentences, missing key details (date, location, or victim)

\u26a0\ufe0f UNCERTAIN DEATHS \u2014 take article statements at FACE VALUE. Do NOT rationalize away indicators.
- "marks on body" \u2192 treat as violence indicator (do NOT speculate "could be post-mortem")
- "items missing" \u2192 treat as robbery indicator (do NOT require "confirmed theft")

REJECT (confidence 0) only if ALL of these are true:
- Decomposed/unconfirmed death AND no signs of violence AND no missing items AND no police suspicion

EXTRACT as Murder if body has ANY of: marks/wounds/bruises, missing items, forced entry, police treating as suspicious.
Confidence for ambiguous deaths: 3 indicators \u2192 8-9 | 2 indicators \u2192 7 | 1 indicator \u2192 4-5

\u274c OTHER: court/sentencing reports, opinion pieces (NOT historical backfill articles \u2014 those are valid)

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
CONFIDENCE SCORING (assign per crime object \u2014 not per article)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

- 9-10: Clear crime, named victim(s), police confirmed, specific location and date
- 7-8:  Clear crime, location and date known, minor details missing
- 5-6:  Ambiguous \u2014 uncertain cause, vague location, or date missing (goes to review queue)
- 3-4:  Weak signal \u2014 only 1 indicator, most details absent
- 1-2:  Highly speculative, no confirmation

ambiguities: list specific concerns when confidence < 7. Leave [] when confidence \u2265 7.
Examples: "Victim identity unconfirmed" / "Location unclear \u2014 only 'east Trinidad' mentioned" / "Date ambiguous"

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
DATE CALCULATION RULES
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

STEP 1: Identify the PUBLISHED date (provided with each article)
STEP 2: Find relative date phrases in the article
STEP 3: Calculate the crime date:

| Phrase                                      | Calculation                                |
|---------------------------------------------|--------------------------------------------|
| "yesterday"                                 | Published minus 1 day                     |
| "on [day]"                                  | Most recent [day] on or before published   |
| "last [day]"                                | [day] of the PREVIOUS week                |
| "this morning" / "this afternoon" / "today" | Same day as published                      |
| No date reference                           | Use published date                         |
| Overnight ("Sat night into Sun morning")    | Use SATURDAY (the earlier/start date)      |

\u26a0\ufe0f KEY DISTINCTION:
- "on Saturday" = the Saturday that just passed (most recent)
- "last Saturday" = Saturday of the PREVIOUS week (go back further)

Example: Published Thursday January 22, 2026
- "yesterday"     \u2192 2026-01-21 (Wednesday)
- "on Saturday"   \u2192 2026-01-18 (most recent Saturday)
- "last Saturday" \u2192 2026-01-11 (previous week's Saturday)
- "on Monday"     \u2192 2026-01-20 (most recent Monday)
- "last Monday"   \u2192 2026-01-13 (previous week's Monday)

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
OUTPUT EXAMPLE
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

Good details field (with || paragraph breaks):
"Labourer Gary Griffith, 45, was shot and killed in a drive-by shooting on Nelson Street, Port of Spain on Monday evening. Witnesses reported hearing multiple gunshots around 7:30 PM as a dark-colored vehicle sped past.||Griffith was pronounced dead at the scene by emergency responders.||Police are investigating the motive and searching for suspects. No arrests have been made."

Bad (too short): "Labourer Gary Griffith was shot dead in Port of Spain."
Bad (no || separators): paragraphs must be split with || \u2014 running them together without breaks is an error.`;}

/**
 * Build USER prompt - Dynamic content (per article)
 * Contains only the article-specific data.
 * @param {string} articleText - Full article text
 * @param {string} articleTitle - Article headline
 * @param {Date} publishedDate - Article publication date
 * @returns {string} User prompt for Claude
 */
function buildUserPrompt(articleText, articleTitle, publishedDate, skipExclusions) {
  const pubDateStr = publishedDate
    ? Utilities.formatDate(new Date(publishedDate), Session.getScriptTimeZone(), 'yyyy-MM-dd')
    : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  // Get day of week for clearer date calculation
  const pubDate = publishedDate ? new Date(publishedDate) : new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pubDate.getDay()];

  const manualOverride = skipExclusions
    ? '\n\nCRITICAL OVERRIDE — MANUAL SUBMISSION: This post was manually submitted by the operator. You MUST extract at least one crime object. ALL exclusion rules are SUSPENDED — this includes police operations, seizures, police shootings, traffic accidents, follow-ups, and any other exclusion. Seizures of guns/drugs/ammunition/marijuana ARE crimes to extract (use crime type "Seizures"). Police operations ARE crimes to extract. Do NOT return an empty crimes array. Always return confidence 7+.'
    : '';

  return `PUBLISHED: ${pubDateStr} (${dayOfWeek})
HEADLINE: ${articleTitle}

ARTICLE:
${articleText}

Extract all crime incidents as JSON. Return {"crimes": [], "confidence": 0} if not a crime article.${manualOverride}`;
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
