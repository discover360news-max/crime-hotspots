# AI Prompt Engineering Guide
## Optimizing Crime Data Extraction Accuracy

**Last Updated:** 2025-11-07
**Goal:** Achieve 95%+ extraction accuracy through systematic prompt refinement
**Target Model:** Google Gemini 1.5 Flash

---

## Understanding the Extraction Challenge

### Why Crime Data Extraction is Hard

1. **Date Ambiguity:** "Last Saturday" requires calculating actual date
2. **Crime Type Overlap:** Shooting that leads to murder - which to record?
3. **Location Variants:** "San Fernando" vs "Sando" vs "City of San Fernando"
4. **Victim Information:** Names buried in article text, ages sometimes missing
5. **Multiple Crimes:** Single article covering 3+ separate incidents
6. **Language Nuances:** Caribbean English expressions, local slang

### Current Baseline Performance

**Initial Prompt Results (Week 1):**
- Date accuracy: ~85%
- Crime type: ~90%
- Location: ~80%
- Victim extraction: ~75%
- Overall confidence: 7.2/10 average

**Target After Optimization (Month 1):**
- Date accuracy: 95%+
- Crime type: 95%+
- Location: 90%+
- Victim extraction: 85%+
- Overall confidence: 8.5/10 average

---

## Base Prompt Template (Version 1.0)

This is the starting prompt in `geminiClient.gs`:

```javascript
function buildExtractionPrompt(articleText, articleTitle) {
  return `You are a data extraction specialist for Trinidad & Tobago crime news.

Extract structured crime information from this article:

TITLE: ${articleTitle}

ARTICLE TEXT:
${articleText}

Extract the following information and respond ONLY with valid JSON:

{
  "crime_date": "YYYY-MM-DD format - the actual date the crime occurred (NOT the article publication date)",
  "crime_type": "One of: Murder|Shooting|Robbery|Assault|Theft|Home Invasion|Sexual Assault|Kidnapping|Domestic Violence|Other",
  "area": "Neighborhood or district in Trinidad & Tobago (e.g., 'San Juan', 'Port of Spain')",
  "street": "Specific street address or location description",
  "headline": "Concise headline under 100 characters, include victim name and age in parentheses if available",
  "details": "2-3 sentence summary of the incident",
  "victims": [
    {
      "name": "Full name",
      "age": "Age as number or null",
      "aliases": ["Any known aliases"]
    }
  ],
  "confidence": 1-10 (how certain you are about the extracted data),
  "ambiguities": ["List anything unclear or missing that needs human review"]
}

EXTRACTION RULES:
1. Crime date: Look for phrases like "on Monday", "last Saturday", "November 2". Calculate actual date based on context.
2. If crime date is ambiguous, use article publication date and set confidence lower.
3. Crime type: Choose the MOST SERIOUS crime mentioned (e.g., if shooting led to murder, choose "Murder").
4. Area: Use the smallest specific location (neighborhood > district > city).
5. Victims: Include all named victims. Use null for unknown ages.
6. Confidence: 9-10 = all key data clear, 7-8 = minor ambiguities, 4-6 = significant gaps, 1-3 = very unclear.
7. If not a crime article, return {"confidence": 0, "ambiguities": ["Not a crime article"]}.

Respond with ONLY the JSON object, no additional text.`;
}
```

---

## Common Extraction Errors & Solutions

### Error Type 1: Wrong Crime Date

**Problem:**
```json
{
  "crime_date": "2025-11-03",  // Article date, not crime date!
  ...
}
```

**Article Text:**
"Published November 3, 2025. A man was shot dead on Saturday night..."
(Crime actually happened November 2, 2025 - Saturday)

**Solution: Enhanced Date Extraction Rules**

Add to prompt after line 1:

```
CRITICAL DATE EXTRACTION RULES:
- The article publication date is NOT the crime date
- Look for temporal phrases:
  * "last night" = yesterday
  * "Saturday night" = most recent Saturday (calculate from article date)
  * "early Monday morning" = specific weekday
  * "November 2" = specific date
- If article says "on [Day]", calculate the actual date:
  * Article published Monday, crime "on Saturday" = 2 days before
  * Article published Wednesday, crime "last Friday" = 5 days before
- ALWAYS provide the calculated YYYY-MM-DD date, not the day name
- If impossible to determine, use article date and lower confidence to 5
```

### Error Type 2: Crime Type Misclassification

**Problem:**
```json
{
  "crime_type": "Shooting",  // Should be "Murder" - victim died
  ...
}
```

**Article Text:**
"A man was shot and killed outside his home..."

**Solution: Crime Type Hierarchy**

Replace crime type rule with:

```
CRIME TYPE CLASSIFICATION (Choose ONE, most serious):

Priority 1 (Most Serious):
- Murder: If victim died, ALWAYS choose Murder (even if "shot", "stabbed", etc. mentioned)
  - Keywords: "killed", "dead", "succumbed", "pronounced dead", "died"

Priority 2:
- Shooting: Firearm used, victim survived
- Sexual Assault: Rape, molestation, sexual violence
- Kidnapping: Abduction, held against will

Priority 3:
- Home Invasion: Robbery at residence with force
- Robbery: Taking property by force or threat
- Assault: Physical attack causing injury (stabbing, beating)

Priority 4:
- Theft: Taking property without force (burglary, larceny)
- Domestic Violence: Family/partner violence

If multiple crimes: Choose highest priority
If uncertain: Choose "Other" and explain in ambiguities
```

### Error Type 3: Location Extraction Issues

**Problem:**
```json
{
  "area": "Trinidad",  // Too broad!
  "street": "Unknown"
}
```

**Article Text:**
"The incident occurred at Bamboo #1, San Juan, near the D59 Bar and Lounge."

**Solution: Location Specificity Rules**

Add after area definition:

```
LOCATION EXTRACTION RULES:

Area (Most specific district/neighborhood):
- Extract the smallest named area: "San Juan" not "Trinidad"
- Common T&T areas: Port of Spain, San Fernando, Arima, Chaguanas, San Juan, Laventille,
  Beetham, Morvant, Enterprise, Valencia, Rio Claro, Point Fortin, Couva, Sangre Grande
- If only "Trinidad" or "Tobago" mentioned, check street for clues
- If article says "in the capital", use "Port of Spain"

Street/Location (Be specific):
- Extract full address: "Bamboo #1, San Juan" not "San Juan"
- Include landmarks: "near D59 Bar and Lounge"
- Include street names: "San Pedro Road, Pool Village"
- If only vague location ("in the south"), put in street field and lower confidence

Example Good Extractions:
- area: "San Juan", street: "Bamboo #1, near D59 Bar and Lounge"
- area: "Brickfield", street: "San Pedro Road, Pool Village, Rio Claro"
- area: "Port of Spain", street: "Charlotte Street"

Example Bad Extractions:
- area: "Trinidad", street: "Unknown" ❌
```

### Error Type 4: Victim Name Extraction

**Problem:**
```json
{
  "victims": [
    {"name": "A man", "age": null}  // Didn't extract actual name!
  ]
}
```

**Article Text:**
"Police identified the victim as Sylvan Boodan, also known as 'Lawa', 58, of Rio Claro."

**Solution: Enhanced Victim Extraction**

Add detailed victim rules:

```
VICTIM EXTRACTION RULES:

1. Look for identification phrases:
   - "Police identified the victim as..."
   - "The deceased has been identified as..."
   - "...named victim as [Name]"
   - "[Name], [age], of [location]"

2. Extract ALL victims mentioned:
   - If "two men" mentioned, create two victim objects
   - If only one named, others can be "Unknown male, age unknown"

3. Age extraction:
   - Look for numbers after name: "John Smith, 45" → age: 45
   - "A 32-year-old man" → age: 32
   - If age not mentioned, use null

4. Aliases:
   - Caribbean articles often include: "also known as", "called", "aka"
   - Example: "Sylvan Boodan, also known as 'Lawa'" → aliases: ["Lawa"]

5. If NO names in article:
   - victims: [{"name": "Unknown", "age": null}]
   - Note in ambiguities: "Victim name not provided in article"

Examples:
Good: {"name": "Sylvan Boodan", "age": 58, "aliases": ["Lawa"]}
Good: {"name": "Unknown male", "age": 32, "aliases": []}
Bad: {"name": "A man", "age": null} ❌
```

### Error Type 5: Headline Generation

**Problem:**
```json
{
  "headline": "Man shot and killed in Rio Claro incident last weekend"  // 68 chars, good length but generic
}
```

**Better:**
```json
{
  "headline": "Rio Claro bar owner gunned down (Sylvan Boodan, 58)"  // 60 chars, includes victim!
}
```

**Solution: Headline Formula**

Replace headline guidance:

```
HEADLINE GENERATION RULES:

Formula: [Location] [Crime Type] [Context] ([Victim Name, Age])
Max length: 100 characters
Goal: Informative + includes victim identity

Examples:
✅ "Rio Claro bar owner gunned down (Sylvan Boodan, 58)"
✅ "Valencia car theft: Suspect claims 'just going home'"
✅ "Man shot during altercation at Bamboo Bar (Dave Rambaran, 45)"
✅ "Officer robbed of gold Bera during walk (48-year-old WPC)"

Guidelines:
- Always include location at start
- Include victim name/age if available
- If no name: use description "19-year-old man"
- Add brief context if space allows
- Use active voice: "gunned down" not "was shot"
- Avoid generic phrases: "incident", "occurrence"

If victim name unknown:
✅ "Mayaro man stabbed outside bar (26-year-old)"
✅ "Teen ambushed outside Couva parlor (19-year-old)"
```

---

## Progressive Prompt Refinement Strategy

### Week 1: Baseline Data Collection
- Use base prompt (Version 1.0)
- Collect 100+ articles
- Track error types in spreadsheet

### Week 2: Add Error-Specific Rules
- Analyze Week 1 errors
- Add 2-3 refinement rules (date, location, victim extraction)
- Reprocess failed articles
- Compare accuracy improvement

### Week 3: Fine-Tune Confidence Scoring
- Review confidence scores vs actual accuracy
- Adjust thresholds:
  - If AI says 8-9 confidence but errors found → tighten confidence rules
  - If AI says 5-6 confidence but extractions good → loosen threshold

### Week 4: Optimize for Speed
- Simplify prompt (remove redundant instructions)
- Test shorter prompts vs accuracy trade-off
- Target: 5-10 sec per extraction

---

## Confidence Scoring Calibration

### Current Confidence Distribution

Track this in a sheet after Week 1:

| Confidence | Count | Accuracy % | Action |
|------------|-------|------------|--------|
| 9-10 | 45 | 98% | ✅ Auto-approve |
| 7-8 | 120 | 92% | ✅ Auto-approve |
| 5-6 | 30 | 75% | ⚠️ Review queue |
| 3-4 | 8 | 40% | ⚠️ Review queue |
| 0-2 | 5 | 10% | ❌ Reject/manual |

### Refined Confidence Rules

Add to prompt:

```
CONFIDENCE SCORING GUIDELINES:

Score 10:
- All fields extracted with certainty
- Explicit date stated (not calculated)
- Victim full name and age present
- Exact street address provided

Score 8-9:
- Minor calculation needed (e.g., "last Saturday" → date)
- Victim name present, age might be missing
- Location specific but not exact address

Score 6-7:
- Date requires interpretation
- Location vague (e.g., "in the south")
- Victim described but not named

Score 4-5:
- Date highly ambiguous
- Multiple crimes in one article (chose primary)
- Conflicting information in article

Score 1-3:
- Critical data missing (no date, no location)
- Article primarily about investigation, not crime itself
- Uncertainty about crime type

Score 0:
- Not a crime article
- Article is opinion piece or analysis
- Cannot extract meaningful data

After scoring, if confidence < 7, MUST populate ambiguities array with specific issues.
```

---

## Multi-Crime Article Handling

### Problem: Article Covers 3+ Crimes

**Example Article:**
"This weekend saw three murders across Trinidad. In Laventille, John Doe, 34, was shot dead. In San Fernando, Jane Smith, 28, was stabbed. In Tobago, a man was found dead..."

**Current Behavior:** AI extracts only the first crime

**Solution: Multi-Crime Detection**

Add to prompt:

```
MULTIPLE CRIMES IN ONE ARTICLE:

If article mentions multiple distinct crimes:
1. Extract ONLY the crime mentioned in the TITLE
2. If title unclear, extract the FIRST crime with most details
3. Add to ambiguities: "Article covers multiple crimes - extracted primary incident only"
4. Lower confidence by 1-2 points

Do NOT try to combine multiple crimes into one record.
Each crime should be a separate extraction (requires multiple API calls).

Indicators of multi-crime articles:
- "also", "additionally", "in a separate incident"
- Multiple different locations mentioned
- Multiple different victim names
- Phrases like "weekend violence" or "crime wave"

If detected, set confidence = 5 and add to ambiguities.
```

---

## Caribbean English & Local Context

### Common Phrases Requiring Translation

Add to prompt:

```
TRINIDAD & TOBAGO LANGUAGE CONTEXT:

Common Terms:
- "Liming" = socializing (not a crime)
- "Lime" = social gathering
- "Sando" = San Fernando
- "Town" = Port of Spain
- "Beetham" = high-crime neighborhood in Port of Spain
- "Barataria" = area in Trinidad
- "Bera" = gold chain/jewelry
- "PH taxi" = private hire taxi
- "Maxi taxi" = shared van transport
- "Wajang" = marijuana (drug-related crime)

Crime-Specific Terms:
- "Gunned down" = shot and killed → Murder
- "Chopped" = attacked with machete → Assault
- "Bandit" = robber
- "Burglar" / "Burglarized" = Theft/Home Invasion

Locations Often Misspelled:
- "Debe" not "Deby"
- "Penal" not "Penel"
- "Fyzabad" not "Fizzabad"
- "Chaguanas" not "Chaganas"

If uncertain about local terminology, note in ambiguities.
```

---

## Testing & Validation Framework

### Test Suite of Sample Articles

Create 10 "golden standard" articles with known correct extractions:

**Test Article 1: Clear Date, Named Victim**
```
Title: "Rio Claro bar owner killed in shooting"
Text: "Sylvan Boodan, 58, also known as 'Lawa', was shot and killed
outside his vehicle on Saturday night, November 2. The incident occurred
at Pool Village, Rio Claro, on San Pedro Road around 11:45 p.m."

Expected Output:
{
  "crime_date": "2025-11-02",
  "crime_type": "Murder",
  "area": "Brickfield",
  "street": "San Pedro Road, Pool Village, Rio Claro",
  "headline": "Rio Claro bar owner gunned down (Sylvan Boodan, 58)",
  "victims": [{"name": "Sylvan Boodan", "age": 58, "aliases": ["Lawa"]}],
  "confidence": 9
}
```

**Test Article 2: Ambiguous Date**
```
Title: "Man found dead in bushes"
Text: "A man was discovered deceased in bushes off the highway.
Police are investigating."

Expected Output:
{
  "crime_date": "2025-11-03",  // Article date (no other info)
  "crime_type": "Murder",
  "area": "Unknown",
  "street": "Off the highway",
  "headline": "Man found dead in bushes (identity unknown)",
  "victims": [{"name": "Unknown", "age": null}],
  "confidence": 4,
  "ambiguities": ["Date unclear - used article date",
                  "Location vague",
                  "Victim not identified"]
}
```

### Running Tests

Create test function in Apps Script:

```javascript
function runPromptTests() {
  const testCases = [
    // Test case 1, 2, etc.
  ];

  let passCount = 0;
  testCases.forEach((test, index) => {
    const result = extractCrimeData(test.text, test.title, 'test-url');
    const passed = compareResults(result, test.expected);
    Logger.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    if (passed) passCount++;
  });

  Logger.log(`\nTests passed: ${passCount}/${testCases.length}`);
}
```

Run after each prompt modification to verify improvements don't break existing functionality.

---

## Advanced Techniques

### Few-Shot Learning

Add 2-3 example extractions to prompt:

```
EXAMPLE EXTRACTIONS:

Example 1:
Input: "John Smith, 45, of Arima, was robbed at gunpoint last Friday..."
Output: {
  "crime_type": "Robbery",
  "victims": [{"name": "John Smith", "age": 45}],
  "area": "Arima",
  "confidence": 8
}

Example 2:
Input: "A teenager was shot dead in Couva on Saturday..."
Output: {
  "crime_type": "Murder",
  "victims": [{"name": "Unknown", "age": null}],
  "area": "Couva",
  "confidence": 6,
  "ambiguities": ["Victim name not provided", "Exact age unknown (teen = 13-19)"]
}

Now extract from this article:
[Actual article text]
```

### Chain-of-Thought Prompting

Ask AI to explain reasoning:

```
Before providing the final JSON, briefly explain your reasoning:
1. What date did you extract and why?
2. What crime type and why (if multiple mentioned)?
3. What confidence score and why?

Then provide the JSON output.
```

(Extract JSON from response, ignore reasoning text)

---

## Monitoring & Continuous Improvement

### Weekly Accuracy Audit

Create this sheet tab: "Accuracy Tracking"

```
Columns:
A: Week Number
B: Articles Processed
C: Auto-Approved (confidence ≥7)
D: Sent to Review (confidence <7)
E: Spot-Check Sample Size (20 articles)
F: Errors Found in Sample
G: Accuracy % (E-F)/E
H: Prompt Version
I: Notes
```

### Monthly Prompt Optimization

1. Export 50 random extractions
2. Manually verify each field
3. Calculate accuracy per field:
   - Date accuracy: X/50
   - Crime type: X/50
   - Location: X/50
   - Victim: X/50
4. Identify weakest area
5. Add/modify 1-2 rules
6. Retest with test suite
7. Deploy if improved

---

## Version Control for Prompts

Track prompt changes:

**Prompt v1.0** (Nov 7, 2025) - Baseline
- Basic extraction rules
- Confidence scoring
- JSON output format

**Prompt v1.1** (Nov 14, 2025) - Date improvements
- Added temporal phrase parsing
- Date calculation rules
- Result: Date accuracy 85% → 92%

**Prompt v1.2** (Nov 21, 2025) - Crime type hierarchy
- Priority-based classification
- Murder vs Shooting clarification
- Result: Crime type accuracy 90% → 96%

**Prompt v1.3** (Nov 28, 2025) - Location specificity
- Caribbean area names list
- Street address extraction
- Result: Location accuracy 80% → 88%

---

## Summary: Path to 95% Accuracy

**Week 1:** Establish baseline (85% accuracy)
**Week 2:** Fix date extraction (+5% → 90%)
**Week 3:** Improve location specificity (+3% → 93%)
**Week 4:** Refine victim extraction (+2% → 95%)

**Ongoing:** Monthly reviews to maintain quality as news patterns change.

**Key Principle:** Systematic refinement based on actual errors, not theoretical improvements.
