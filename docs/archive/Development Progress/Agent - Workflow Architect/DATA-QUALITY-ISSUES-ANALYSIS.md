# Data Quality Issues - Root Cause Analysis & Fix Plan

**Date:** November 9, 2025
**Status:** CRITICAL - Production data quality below acceptable threshold
**Severity:** High - Public-facing data source

---

## 🚨 Critical Issues Identified

Based on your sample data, here are the systemic problems:

### Issue #1: Wrong URLs (CRITICAL)
**Severity:** HIGH

**Example:**
```
Row 1: Crime about "Williamsville man killed"
URL: "president-un-youth-programme-promotes-pathways-of-peace" ❌

Row 2: Crime about "Labourer shot"
URL: "president-un-youth-programme-promotes-pathways-of-peace" ❌ (SAME WRONG URL)

Row 3: Crime about "Labourer shot dead at Gonzales Village"
URL: "eu-funds-solar-power-project-at-office-of-prime-minister" ❌
```

**Root Causes (Most Likely → Least Likely):**

1. **Gemini AI is returning source_url in its JSON response**
   - Despite us setting it in code, Gemini might be hallucinating URLs
   - Solution: Remove source_url from the extraction prompt

2. **Raw Articles sheet has wrong URLs to begin with**
   - RSS feed collection is grabbing wrong URLs
   - Solution: Check rssCollector.gs and RSS feed structure

3. **Code version mismatch**
   - The code in Google Apps Script doesn't match these files
   - Solution: Verify and sync code

---

### Issue #2: Duplicates
**Severity:** HIGH

**Examples:**
- "Vendor injured crossing highway" appears 3 times (rows 6, 8, 12)
- "Labourer, 27, shot" appears 2 times (rows 2, 3)

**Root Causes:**

1. **Duplicate detection is failing**
   - Same crime with slightly different headlines isn't being caught
   - Headlines like "Labourer, 27, shot" vs "Labourer, 27, shot dead" aren't matching

2. **Multi-crime articles being re-processed**
   - Article marked "completed" but re-runs are extracting again
   - Status column not being updated properly

**Fix:**
- Strengthen duplicate detection to check date + area + victim age
- Add URL to duplicate check (if same URL + same crime date = likely duplicate)

---

### Issue #3: Non-Crime Articles Getting Through
**Severity:** MEDIUM

**Examples:**
- "Vendor injured crossing highway" - Traffic accident ❌
- "US kill three more in Caribbean airstrike" - Military/foreign news ❌
- "Woman arrested with 0.26g ecstasy" - Drug possession (debatable) ⚠️

**Root Causes:**

1. **Gemini is too permissive**
   - Current prompt accepts anything vaguely crime-related
   - Need stronger filtering in prompt

2. **No crime type validation**
   - "Other" being used for non-crimes
   - Need whitelist of acceptable crime types

**Fix:**
- Update Gemini prompt with explicit exclusions
- Add post-extraction validation in processor.gs
- Reject "Other" type crimes if confidence < 8

---

### Issue #4: Missing Data
**Severity:** MEDIUM

**Examples:**
- Victim names in article but not extracted
- Street addresses present but missing from entry
- Plus Codes not generated despite having coordinates

**Root Causes:**

1. **Gemini extraction incomplete**
   - Not following the JSON schema properly
   - Missing fields being returned as null/empty

2. **Geocoding failures**
   - Plus Code generation is failing
   - Check geocoder.gs and Google Geocoding API

**Fix:**
- Strengthen Gemini prompt with required fields
- Add data completeness check before adding to Production
- Debug geocoding function for Plus Code generation

---

### Issue #5: Wrong Dates (Some Cases)
**Severity:** LOW-MEDIUM

**Example:**
- Row 2: Crime date shows 2025-11-08 but article says crime was earlier

**Root Cause:**
- Publication date being used instead of calculated crime date
- Gemini not properly calculating relative dates

**Fix:**
- Already addressed in code (publication date passed to prompt)
- Verify this is actually running in deployed version

---

## 🔧 Immediate Action Plan

### STEP 1: Run Diagnostics (5 minutes)

Add the `diagnostics.gs` file to your Google Apps Script and run:

```javascript
runAllDiagnostics()
```

This will tell us:
- Are URLs wrong in Raw Articles or only in Production?
- How many non-crime articles are in Production?
- Are there URL mismatches?
- Which source articles are causing issues?

---

### STEP 2: Verify Code Sync (10 minutes)

**Check if your deployed code matches these files:**

1. Open Google Apps Script editor
2. Compare these files line-by-line:
   - `geminiClient.gs` - Line 257: Does it set source_url?
   - `processor.gs` - Line 148: Does it use crime.source_url?

**If code doesn't match:**
- Copy latest versions from these files
- Deploy to Google Apps Script
- Test with sample article

---

### STEP 3: Fix Gemini Prompt (HIGH PRIORITY)

**Issue:** Gemini might be hallucinating source_url or including non-crimes

**Fix geminiClient.gs - buildExtractionPrompt():**

```javascript
function buildExtractionPrompt(articleText, articleTitle, publishedDate) {
  const pubDateStr = publishedDate ? Utilities.formatDate(new Date(publishedDate),
    Session.getScriptTimeZone(), 'yyyy-MM-dd') :
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  return `Extract crime data from this Trinidad & Tobago news article.

PUBLISHED: ${pubDateStr}
HEADLINE: ${articleTitle}

ARTICLE:
${articleText}

Extract ALL distinct crime incidents as JSON array. Each incident = different date/location/victim.

{
  "crimes": [
    {
      "crime_date": "YYYY-MM-DD (calculate from publication date if relative)",
      "crime_type": "Murder|Shooting|Robbery|Assault|Burglary|Theft|Home Invasion|Sexual Assault|Kidnapping|Domestic Violence|Arson",
      "area": "Neighborhood (e.g., Maraval, Port of Spain, San Fernando)",
      "street": "Street address if mentioned (or empty string)",
      "headline": "Brief headline with victim name/age in parentheses if known",
      "details": "2-3 sentence summary",
      "victims": [{"name": "Full name or null", "age": number or null, "aliases": []}]
    }
  ],
  "confidence": 1-10,
  "ambiguities": []
}

CRITICAL RULES:
- Published ${pubDateStr}. Calculate crime dates from this reference:
  * "yesterday" = ${pubDateStr} minus 1 day
  * "Monday" = calculate Monday before ${pubDateStr}
  * "last week" = 7 days before ${pubDateStr}
  * If no date mentioned, use ${pubDateStr}

- DO NOT include source_url in crimes array (system adds this automatically)

- EXCLUDE these from extraction:
  * Traffic accidents (unless criminal act like DUI, hit-and-run with intent)
  * Natural disasters, weather events
  * Government announcements, policies, budgets
  * Foreign/international crimes not in Trinidad & Tobago
  * Military actions, airstrikes
  * Drug possession <1g (unless part of larger crime)
  * Simple traffic violations

- ONLY extract if:
  * Crime occurred in Trinidad & Tobago
  * Involves violence, property crime, or serious offense
  * Identifiable victim or property damage

- Crime type must be from allowed list (Murder, Shooting, Robbery, etc.)
- If article is NOT about crime, return: {"crimes": [], "confidence": 0, "ambiguities": ["Not a crime article"]}
- One article describing multiple separate crimes? Create separate crime objects

Response format: JSON only, no markdown backticks.`;
}
```

**Key changes:**
1. ✅ Explicit instruction: "DO NOT include source_url"
2. ✅ Expanded exclusion list (traffic, weather, government, foreign)
3. ✅ Stricter crime type whitelist
4. ✅ Clear inclusion criteria

---

### STEP 4: Add Data Validation Layer (MEDIUM PRIORITY)

**Add to processor.gs before appendToProduction():**

```javascript
/**
 * Validate crime data before adding to Production
 * @param {Object} crime - Crime object to validate
 * @returns {Object} {valid: boolean, issues: string[]}
 */
function validateCrimeData(crime) {
  const issues = [];

  // Valid crime types
  const validTypes = [
    'Murder', 'Shooting', 'Robbery', 'Assault', 'Burglary', 'Theft',
    'Home Invasion', 'Sexual Assault', 'Kidnapping', 'Domestic Violence', 'Arson'
  ];

  // Check required fields
  if (!crime.crime_date) issues.push('Missing crime date');
  if (!crime.crime_type) issues.push('Missing crime type');
  if (!crime.area || crime.area === 'Unknown') issues.push('Missing or vague area');
  if (!crime.headline || crime.headline.length < 10) issues.push('Missing or too-short headline');
  if (!crime.source_url || !crime.source_url.startsWith('http')) issues.push('Invalid source URL');

  // Check valid crime type
  if (crime.crime_type && !validTypes.includes(crime.crime_type)) {
    issues.push(`Invalid crime type: ${crime.crime_type}`);
  }

  // Check "Other" with low confidence
  if (crime.crime_type === 'Other') {
    issues.push('Crime type is "Other" - needs review');
  }

  // Check for non-crime keywords in headline
  const nonCrimeKeywords = ['announce', 'policy', 'budget', 'crossing highway', 'airstrike', 'solar power'];
  const headlineLower = crime.headline.toLowerCase();
  for (const keyword of nonCrimeKeywords) {
    if (headlineLower.includes(keyword)) {
      issues.push(`Headline contains non-crime keyword: "${keyword}"`);
    }
  }

  return {
    valid: issues.length === 0,
    issues: issues
  };
}

/**
 * Modified appendToProduction with validation
 */
function appendToProduction(crime) {
  const prodSheet = getActiveSheet(SHEET_NAMES.PRODUCTION);

  // VALIDATE FIRST
  const validation = validateCrimeData(crime);
  if (!validation.valid) {
    Logger.log(`⚠️ Validation failed for: ${crime.headline}`);
    Logger.log(`  Issues: ${validation.issues.join(', ')}`);
    Logger.log(`  Routing to Review Queue instead`);

    // Send to review queue instead
    appendToReviewQueue(crime, 2, validation.issues);
    return;
  }

  // Check for duplicate before appending
  if (isDuplicateCrime(prodSheet, crime)) {
    Logger.log(`⚠️ Duplicate detected, skipping: ${crime.headline}`);
    return;
  }

  const fullAddress = `${crime.street || ''}, ${crime.area || ''}, Trinidad and Tobago`;
  const geocoded = geocodeAddress(fullAddress);

  prodSheet.appendRow([
    crime.crime_date || '',
    crime.headline || 'No headline',
    crime.crime_type || 'Other',
    crime.street || '',
    geocoded.plus_code || '',
    crime.area || '',
    'Trinidad',
    crime.source_url || '',
    geocoded.lat || '',
    geocoded.lng || ''
  ]);

  Logger.log(`✅ Added to production: ${crime.headline} [${geocoded.plus_code || 'No Plus Code'}]`);
}
```

---

### STEP 5: Improve Duplicate Detection (HIGH PRIORITY)

**Modify processor.gs - isDuplicateCrime():**

```javascript
function isDuplicateCrime(sheet, crime) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return false; // Empty sheet
  }

  const dataRange = sheet.getRange(2, 1, lastRow - 1, 10);
  const data = dataRange.getValues();

  for (let row of data) {
    const existingDate = row[0];
    const existingHeadline = row[1];
    const existingArea = row[5];
    const existingUrl = row[7];

    // CHECK 1: Exact URL + headline match (multi-crime safe)
    if (existingUrl === crime.source_url && existingHeadline === crime.headline) {
      Logger.log('Duplicate found: Exact URL + headline match');
      return true;
    }

    // CHECK 2: Same URL + very similar headline (multi-crime safe)
    if (existingUrl === crime.source_url) {
      const similarity = calculateSimilarity(existingHeadline, crime.headline);
      if (similarity > 0.9) {
        Logger.log(`Duplicate found: Same URL + ${(similarity * 100).toFixed(0)}% similar headline`);
        return true;
      }
    }

    // CHECK 3: Same date + same area + very similar headline (different URL - same crime, different source)
    if (existingDate && crime.crime_date && existingArea && crime.area) {
      const existingDateStr = Utilities.formatDate(new Date(existingDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');

      if (existingDateStr === crime.crime_date && existingArea === crime.area) {
        const similarity = calculateSimilarity(existingHeadline, crime.headline);
        if (similarity > 0.75) {
          Logger.log(`Duplicate found: Same date + area + ${(similarity * 100).toFixed(0)}% similar headline (different source)`);
          return true;
        }
      }
    }

    // CHECK 4: Extract victim age from headline and match
    const ageMatch1 = existingHeadline.match(/\((\d+)\)/);
    const ageMatch2 = crime.headline.match(/\((\d+)\)/);

    if (ageMatch1 && ageMatch2 && ageMatch1[1] === ageMatch2[1]) {
      // Same victim age mentioned
      const existingDateStr = existingDate ? Utilities.formatDate(new Date(existingDate), Session.getScriptTimeZone(), 'yyyy-MM-dd') : null;

      if (existingDateStr === crime.crime_date) {
        Logger.log(`Duplicate found: Same date + victim age (${ageMatch1[1]})`);
        return true;
      }
    }
  }

  return false;
}
```

---

## 🧪 Testing Plan

### Test 1: Verify URL Fix
1. Pick a Raw Articles entry with known correct URL
2. Run `testExtractionForArticle(rowNumber)`
3. Verify extracted crime has correct source_url

### Test 2: Verify Non-Crime Filtering
1. Find article about government announcement in Raw Articles
2. Extract with updated prompt
3. Should return `{"crimes": [], "confidence": 0}`

### Test 3: Verify Duplicate Detection
1. Manually add same crime twice to Production (different rows)
2. Try to add again via `appendToProduction()`
3. Should log "Duplicate detected, skipping"

### Test 4: End-to-End Test
1. Mark 5 articles as "ready_for_processing"
2. Include mix: real crimes, duplicates, non-crime
3. Run `processReadyArticles()`
4. Verify Production has only valid, unique crimes

---

## 📊 Success Metrics

**After fixes, expect:**
- ✅ 95%+ URLs match article content
- ✅ <2% duplicates in Production
- ✅ 0 non-crime articles in Production
- ✅ 90%+ entries have victim name when mentioned in article
- ✅ 85%+ entries have street address when mentioned
- ✅ 80%+ entries have Plus Code

---

## 🚀 Deployment Checklist

Before deploying fixes:

- [ ] Run `runAllDiagnostics()` to baseline current issues
- [ ] Backup Production sheet (copy to new tab)
- [ ] Update geminiClient.gs with new prompt
- [ ] Update processor.gs with validation layer
- [ ] Update processor.gs with improved duplicate detection
- [ ] Test all changes with `testGeminiExtraction()`
- [ ] Test with 5 real articles using `processReadyArticles()` (limit to 5)
- [ ] Manually verify Production entries are correct
- [ ] Deploy to triggers
- [ ] Monitor first 24 hours closely
- [ ] Run `dailyHealthCheck()` from validationHelpers.gs

---

## 📞 Next Steps

1. **Immediate (Today):**
   - Add diagnostics.gs to Google Apps Script
   - Run `runAllDiagnostics()`
   - Send me the log output so I can see exact issues

2. **Short-term (This Week):**
   - Apply fixes from Step 3-5
   - Test thoroughly
   - Deploy updated code

3. **Ongoing:**
   - Daily spot-checks using validationHelpers.gs
   - Weekly deep dive
   - Continuous prompt refinement based on Review Queue patterns

---

**Last Updated:** November 9, 2025
**Status:** Ready for diagnostics and fixes
**Priority:** CRITICAL
