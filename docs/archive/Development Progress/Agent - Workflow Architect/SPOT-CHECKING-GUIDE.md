# Spot-Checking Guide - Crime Data Accuracy Verification

**Purpose:** Verify accuracy of automated crime data extraction and identify patterns requiring system adjustments
**Frequency:** Daily (first 2 weeks), then weekly after stabilization
**Time Required:** 15-30 minutes per session

---

## Quick Start: Where to Find Your Data

### Google Sheets Location
Your automation system writes to these sheets:

1. **Production Sheet** - High confidence crimes (≥7/10)
   - These crimes are automatically added without review
   - Should contain 15-25 new crimes daily

2. **Review Queue** - Lower confidence crimes (1-6/10)
   - Requires manual review before adding
   - Should contain 3-6 items daily
   - Check "ambiguities" column for extraction concerns

3. **Raw Articles** - All collected articles
   - Status column shows processing stage
   - Use to trace back from Production to source

---

## Spot-Checking Protocol

### Step 1: Sample Selection (5-10 crimes daily)

**Random Sampling Method:**
```
Day 1: Check rows 2-6 (first 5 from today)
Day 2: Check rows 7-11 (next 5)
Day 3: Check random 5 from last 3 days
```

**Targeted Sampling (when issues suspected):**
- All crimes from specific news source
- All crimes of specific type (e.g., "Shooting")
- All crimes with low confidence (7-8 range)
- All multi-crime articles (same source_url)

### Step 2: Verification Checklist

For each crime entry, verify these 8 fields:

| # | Field | What to Check | Common Errors |
|---|-------|---------------|---------------|
| 1 | **Crime Date** | Matches article description | Wrong year, publication date used instead |
| 2 | **Crime Type** | Accurately categorized | Too generic, misclassified |
| 3 | **Area** | Specific location mentioned | Too vague, wrong district |
| 4 | **Headline** | Clear, distinct for multi-crimes | Identical headlines for different crimes |
| 5 | **Victim** | Correct name/description | Confused victim with suspect |
| 6 | **Latitude/Longitude** | In Trinidad & Tobago bounds | Wrong country, null values |
| 7 | **Source URL** | Links to correct article | Broken link, wrong article |
| 8 | **Plus Code** | Valid format (8 chars) | Null, invalid format |

### Step 3: Accuracy Rating

Rate each checked crime:

- ✅ **Perfect** - All 8 fields correct
- ⚠️ **Minor Issues** - 1-2 fields need tweaks (e.g., area too vague)
- ❌ **Major Issues** - 3+ fields wrong OR critical field wrong (date, type, victim)
- 🗑️ **False Positive** - Not actually a crime

**Target Accuracy:**
- Week 1: 80%+ Perfect, <10% Major Issues
- Week 2: 85%+ Perfect, <5% Major Issues
- Month 1: 90%+ Perfect, <3% Major Issues

---

## Common Error Patterns & How to Fix

### Error Type 1: Wrong Dates

**Symptoms:**
- Dates from 2023 or 2024 (should be 2025)
- All crimes on same date (publication date)
- Future dates

**Root Cause:**
- Gemini not using publication date reference
- Article lacks specific date mention

**How to Fix:**

**Individual Fix (in Google Sheets):**
1. Open the article URL (column: source_url)
2. Find actual date mentioned in article
3. Update crime_date column manually
4. Add note in ambiguities: "Date corrected from [old] to [new]"

**Systemic Fix (if pattern across 5+ articles):**
```javascript
// In geminiClient.gs - buildExtractionPrompt()
// Verify this text is included:
"REFERENCE DATE: Article published on ${publishedDate}. Use this to calculate relative dates like 'yesterday', 'Monday', 'last week'."
```

**Test Fix:**
```javascript
testGeminiExtraction()  // Run in Apps Script
// Check output dates match article content
```

---

### Error Type 2: Multi-Crime Articles - Only 1 Crime Extracted

**Symptoms:**
- Article mentions "three shootings" but only 1 in Production
- Headline says "double murder" but only 1 victim recorded

**Root Cause:**
- Multi-crime detection not working
- Response truncated
- Crimes not properly looped in processor

**How to Fix:**

**Individual Fix:**
1. Find article in Raw Articles sheet (match by URL)
2. Change status from "processed" to "ready_for_processing"
3. Wait 1 hour for next trigger OR manually run `processReadyArticles()`
4. Check if all crimes now extracted

**Systemic Fix:**
1. Check token limit in config.gs:
```javascript
// Must be 4096, not 2048
maxOutputTokens: 4096
```

2. Verify multi-crime loop in processor.gs:
```javascript
// Should loop through crimes array:
for (const crime of result.crimes) {
  // process each crime
}
```

3. Run test:
```javascript
testMultiCrimeExtraction()
// Should output: "✅ Detected 3 separate crime incidents"
```

---

### Error Type 3: Wrong Crime Type Classification

**Symptoms:**
- "Robbery" classified as "Theft"
- "Domestic Violence" showing as "Assault"
- Too generic: "Violent Crime" instead of "Shooting"

**Root Cause:**
- Gemini prompt needs better crime type examples
- Ambiguous article wording

**How to Fix:**

**Individual Fix (in Google Sheets):**
1. Update crime_type column to correct classification
2. Note in ambiguities: "Reclassified from X to Y"

**Systemic Fix (if pattern across 10+ articles):**
1. Edit geminiClient.gs - `buildExtractionPrompt()`
2. Add more examples for confused types:
```javascript
"Crime type examples:
- Robbery: Taking property with force/threat
- Burglary: Breaking into building to steal
- Theft: Taking property without force
- Shooting: Firearm discharged at person
- Assault: Physical attack (no firearm)
- Domestic Violence: Violence in household/relationship"
```

3. Test with past problematic articles

---

### Error Type 4: Victim vs Suspect Confusion

**Symptoms:**
- Victim column has suspect's name
- "Man arrested" listed as victim

**Root Cause:**
- Gemini confusing roles in article
- Passive voice: "Man, 25, shot" (victim) vs "Man, 25, arrested" (suspect)

**How to Fix:**

**Individual Fix:**
1. Clear victim field (set to null or "Unknown")
2. Add to ambiguities: "Removed incorrect victim name - was suspect"

**Systemic Fix:**
1. Enhance prompt in geminiClient.gs:
```javascript
"Victim: Person harmed/killed. NOT the arrested person, NOT the suspect.
If article says 'man arrested' - he is NOT the victim.
If unclear, leave victim as null."
```

---

### Error Type 5: Area Too Vague or Missing

**Symptoms:**
- Area = "Trinidad" (too broad)
- Area = null (missing)
- Area = "Port of Spain" (city-level, not district)

**Root Cause:**
- Article lacks specific location
- Geocoding fails due to vague location

**How to Fix:**

**Individual Fix:**
1. Read article for any location clues
2. Update area to most specific mentioned (district > city > region)
3. If truly no location: area = "Unknown"
4. Re-geocode if needed (manual Geocoding API call)

**Systemic Fix:**
1. Accept this will happen ~10-20% of time
2. Looker Studio filters can exclude "Unknown" areas
3. Not critical if date, type, victim are correct

---

### Error Type 6: Duplicate Crimes in Production

**Symptoms:**
- Same headline, same URL, same date appearing 2-3 times

**Root Cause:**
- Duplicate detection logic broken
- Multi-crime false positive

**How to Fix:**

**Individual Fix:**
1. Identify the duplicates (compare headline + URL)
2. Keep the first entry, delete others
3. Note in ambiguities: "Duplicate removed"

**Systemic Fix:**
1. Check processor.gs - `isDuplicateCrime()`:
```javascript
// Should check BOTH URL and headline similarity:
if (crime.source_url === existingCrime.source_url &&
    calculateSimilarity(crime.headline, existingCrime.headline) > 0.9) {
  return true;  // Is duplicate
}
```

2. Test with known multi-crime article:
```javascript
// Should NOT flag as duplicates if headlines differ
```

---

### Error Type 7: Geocoding Failures

**Symptoms:**
- latitude/longitude = null
- plus_code = null
- Even though area is specified

**Root Cause:**
- Geocoding API not enabled
- Area too vague for API
- API quota exceeded
- Rural/informal area not in Google Maps

**How to Fix:**

**Individual Fix:**
1. Try manual geocoding:
   - Google Maps → Search "Area, Trinidad and Tobago"
   - Right-click location → Copy coordinates
   - Paste into lat/lng columns
   - Get Plus Code from Maps (click coordinates)

**Systemic Fix:**
1. Check geocoding quota usage (Script dashboard)
2. Verify API enabled in Google Cloud Console
3. Test with known address:
```javascript
testGeocoding()  // Should return valid lat/lng and Plus Code
```

4. If consistently failing for specific areas, add fallback coordinates:
```javascript
// In geocoder.gs - add district-level fallbacks
const FALLBACK_COORDS = {
  "Port of Spain": {lat: 10.6549, lng: -61.5019},
  "San Fernando": {lat: 10.2799, lng: -61.4587}
}
```

---

## Tracking Issues: Create Error Log

**Create a simple tracking sheet to monitor patterns:**

| Date Checked | Crimes Checked | Perfect | Minor Issues | Major Issues | Pattern Identified |
|--------------|----------------|---------|--------------|--------------|-------------------|
| 2025-11-09 | 10 | 7 | 2 | 1 | Wrong dates (2024) |
| 2025-11-10 | 10 | 8 | 2 | 0 | Area too vague |
| 2025-11-11 | 10 | 9 | 1 | 0 | - |

**When to Take Action:**
- **1 major issue in 10 checked** → Investigate individual case
- **3+ major issues in 10 checked** → Systemic problem, fix code
- **Same error type 5+ times** → Update Gemini prompt
- **<70% perfect accuracy** → Pause automation, debug

---

## Quick Fixes Cheat Sheet

### Fix in Google Sheets (Individual Issues)
✅ **When:** 1-2 isolated errors, not a pattern
✅ **How:** Edit cells directly, note in ambiguities
✅ **Time:** 1-2 minutes per crime

### Fix in Apps Script Code (Systemic Issues)
✅ **When:** Same error across 5+ crimes
✅ **Files:** geminiClient.gs (prompt), processor.gs (logic), config.gs (settings)
✅ **Process:**
1. Edit code in Apps Script editor
2. Save (Ctrl/Cmd + S)
3. Run test function to verify fix
4. Monitor next batch of extractions
5. Spot-check again after 24 hours

### Reprocess Articles (Extraction Failed)
✅ **When:** Multi-crime article only extracted 1 crime
✅ **How:**
1. Find article in Raw Articles sheet
2. Change status: "processed" → "ready_for_processing"
3. Clear the extracted_data column (Column F)
4. Wait for next trigger OR manually run processReadyArticles()

---

## Validation Helpers (Optional Scripts)

### Quick Validation Script
Create this function in Apps Script to automate checks:

```javascript
/**
 * Spot check last N production entries
 */
function spotCheckProduction(numToCheck = 10) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Production');
  const data = sheet.getDataRange().getValues();

  console.log(`Checking last ${numToCheck} entries...`);

  const issues = [];
  const startRow = Math.max(1, data.length - numToCheck);

  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    const crimeDate = new Date(row[0]);  // Assuming column A
    const crimeType = row[1];
    const area = row[2];
    const lat = row[5];
    const lng = row[6];

    // Check 1: Date in 2025
    if (crimeDate.getFullYear() !== 2025) {
      issues.push(`Row ${i+1}: Date is ${crimeDate.getFullYear()}, expected 2025`);
    }

    // Check 2: Has crime type
    if (!crimeType || crimeType.trim() === '') {
      issues.push(`Row ${i+1}: Missing crime type`);
    }

    // Check 3: Has area
    if (!area || area.trim() === '') {
      issues.push(`Row ${i+1}: Missing area`);
    }

    // Check 4: Has coordinates
    if (!lat || !lng) {
      issues.push(`Row ${i+1}: Missing geocoding (area: ${area})`);
    }

    // Check 5: Coordinates in Trinidad bounds
    if (lat && (lat < 10 || lat > 11 || lng < -62 || lng > -60)) {
      issues.push(`Row ${i+1}: Coordinates outside Trinidad (${lat}, ${lng})`);
    }
  }

  if (issues.length === 0) {
    console.log('✅ All checks passed!');
  } else {
    console.log(`⚠️ Found ${issues.length} issues:`);
    issues.forEach(issue => console.log(issue));
  }

  return issues;
}
```

**How to use:**
1. Apps Script → Add this function
2. Run: `spotCheckProduction(10)`
3. Check Execution log for results

---

## Weekly Review Process

### Every Monday (15 minutes)

1. **Run validation script** on last 50 entries
2. **Review Review Queue** - Check ambiguities patterns
3. **Check quota usage** - Ensure within limits
4. **Calculate accuracy rate** from spot checks
5. **Document any systemic fixes** in CHANGELOG.md

### Monthly Deep Dive (1 hour)

1. **Random sample 50 crimes** from entire month
2. **Full 8-field verification** on all 50
3. **Calculate statistics:**
   - Overall accuracy rate
   - Accuracy by crime type
   - Accuracy by news source
   - Geocoding success rate
4. **Identify improvement opportunities**
5. **Update Gemini prompt** if needed
6. **Archive old Raw Articles** (>90 days)

---

## When to Pause Automation

**Stop triggers and investigate if:**
- ❌ Accuracy drops below 70% for 2 consecutive days
- ❌ Same systemic error affecting 50%+ of extractions
- ❌ Duplicate crimes flooding Production
- ❌ Quota exceeded (Apps Script or Gemini)
- ❌ Critical API key or authentication issues

**How to pause:**
1. Apps Script → Triggers → Delete all 3 triggers
2. Fix the issue
3. Test thoroughly with `testMultiCrimeExtraction()`
4. Recreate triggers: `createTriggers()`

---

## Contact for Complex Issues

**If you encounter:**
- Persistent multi-crime extraction failures
- Gemini API errors
- Systemic date calculation problems
- Geocoding API issues

**Review these files:**
- `Development Progress/Agent - Workflow Architect/AGENT-BRIEFING.md`
- `Development Progress/Agent - Workflow Architect/PROJECT-CONTEXT.md`

**Or ask Claude Code workflow-architect agent for help.**

---

**Last Updated:** November 9, 2025
**Version:** 1.0
**Maintained By:** Kavell Forde
