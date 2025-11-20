# Gemini Prompt Improvements - November 20, 2025

## Issues Addressed

### 1. False Murder Classification
**Problem:** Articles about decomposed bodies with "no visible signs of violence" were being classified as murders.

**Example:**
- Article: "Decomposed body of unidentified man found in abandoned ministry building"
- Article states: "Investigators reported no visible signs of violence"
- **Incorrectly classified as:** Murder
- **Should have been:** Skipped (not confirmed crime)

**Fix:** Added new exclusion criteria (Rule #2 and #3):

```
2. EXCLUDE UNCERTAIN DEATHS: DO NOT classify as "Murder" if:
   - "No visible signs of violence"
   - "Cause of death unknown"
   - "Decomposed body" without confirmed foul play
   - "Unidentified body" without clear evidence of homicide
   - "Autopsy pending" or "Police investigating"
   - Deaths under investigation where no crime is confirmed
   - Return {"crimes": [], "confidence": 0} for these cases

3. MURDER CLASSIFICATION: ONLY use "Murder" when:
   - Article explicitly states murder/killed/slain/homicide
   - Clear evidence of violence (gunshot wounds, stabbing, beating)
   - Police confirm foul play or criminal investigation
   - Victim was shot/stabbed/attacked and died
```

---

### 2. Date Calculation Errors
**Problem:** Articles saying "found on Monday" were being logged with incorrect dates.

**Example:**
- Article published: Tuesday, November 19, 2025
- Article says: "found on Monday"
- **Incorrectly logged as:** 2025-11-18 (wrong date)
- **Should have been:** 2025-11-17 (the Monday before publication)

**Fix:** Enhanced date calculation rules (Rule #1) with explicit examples:

```
1. CRIME DATE: Extract ACTUAL crime date from article text, NOT published date.
   - Published: ${pubDateStr}
   - Calculate relative dates from published date:
     * "yesterday" = published date minus 1 day
     * "today" = published date
     * "on Monday" = find the most recent Monday before/on published date
     * "Monday night" = same Monday calculation
     * "last Saturday" = find Saturday in the week before published date
     * "on the weekend" = use the most recent weekend day mentioned

   - Examples:
     * Article published Monday Nov 18, says "found on Monday" = Nov 18 (same day)
     * Article published Tuesday Nov 19, says "on Monday" = Nov 18 (yesterday)
     * Article published Monday, says "on Saturday" = most recent Saturday

   - If no date mentioned at all, use published date as fallback
```

---

### 3. Missing Landmark/Business Names in Locations
**Problem:** Crimes at notable locations like "KFC Arima" or "Grand Bazaar" were not capturing the business/landmark name in the address field.

**Example:**
- Article: "Shooting at KFC Arima"
- **Previously:** street: "Arima Main Road", area: "Arima"
- **Now:** street: "KFC, Arima Main Road", area: "Arima"

**Fix:** Added explicit location detail instructions (Rule #5):

```
5. LOCATION DETAILS: Capture complete location information
   - ALWAYS include business names (e.g., "KFC", "Grand Bazaar", "Movie Towne")
   - Include landmarks (e.g., "near Queen's Park Savannah")
   - street field should have: "Business/Landmark Name, Street Name" format

   - Examples (Trinidad):
     * "KFC Arima" → street: "KFC, Arima Main Road", area: "Arima"
     * "Grand Bazaar shooting" → street: "Grand Bazaar, Churchill Roosevelt Highway", area: "Valsayn"
     * "Queen's Park Savannah" → street: "Queen's Park Savannah", area: "Port of Spain"

   - Examples (Guyana):
     * "Stabroek Market" → street: "Stabroek Market, Water Street", area: "Georgetown"
     * "Giftland Mall shooting" → street: "Giftland Mall, Turkeyen", area: "East Coast Demerara"
     * "Sheriff Street" → street: "Sheriff Street", area: "Campbellville"
```

---

## Files Modified

### Trinidad Automation
- `google-apps-script/trinidad/geminiClient.gs` (lines 164-271)
  - Updated `buildExtractionPrompt()` function

### Guyana Automation
- `google-apps-script/guyana/geminiClient.gs` (lines 164-271)
  - Updated `buildExtractionPrompt()` function
  - Applied same improvements for consistency

---

## Testing Recommendations

### 1. Test False Murder Classification Fix
Find articles in your Raw Articles sheet that mention:
- "Decomposed body"
- "No visible signs of violence"
- "Cause of death unknown"
- "Under investigation"

**Expected Result:** These should now return `{"crimes": [], "confidence": 0}` and be marked as "skipped" instead of being classified as murders.

**Test Function:**
```javascript
// In Google Apps Script
function testUncertainDeathHandling() {
  const sampleText = `A decomposed body of an unidentified man was found in an abandoned ministry building on Wrightson Road, Port of Spain on Monday. Investigators reported no visible signs of violence. The body has been taken for autopsy. Police are investigating.`;

  const result = extractCrimeData(sampleText, "Decomposed body found", "https://test.com/article", "2025-11-18");

  Logger.log(JSON.stringify(result, null, 2));
  // Should return: {"crimes": [], "confidence": 0}
}
```

---

### 2. Test Date Calculation Fix
Find articles that use relative date references:
- "yesterday"
- "on Monday"
- "last weekend"
- "on Saturday night"

**Expected Result:** Dates should be calculated correctly relative to the published date.

**Test Function:**
```javascript
function testDateCalculation() {
  const publishedDate = "2025-11-18"; // Monday
  const sampleText = `A man was shot and killed on Saturday night in Laventille. Police responded to reports of gunfire around 11:45 p.m.`;

  const result = extractCrimeData(sampleText, "Man shot in Laventille", "https://test.com/article", publishedDate);

  Logger.log(JSON.stringify(result, null, 2));
  // crime_date should be 2025-11-16 (the Saturday before Monday Nov 18)
}
```

---

### 3. Test Location Enhancement
Find articles mentioning:
- Business names (KFC, Movie Towne, Grand Bazaar, etc.)
- Landmarks (Queen's Park Savannah, Stabroek Market, etc.)

**Expected Result:** The `street` field should include the business/landmark name.

**Test Function:**
```javascript
function testLocationExtraction() {
  const sampleText = `Two armed men robbed a KFC restaurant in Arima on Tuesday evening. The suspects escaped with cash and fled the scene. No injuries were reported.`;

  const result = extractCrimeData(sampleText, "KFC robbery in Arima", "https://test.com/article", "2025-11-18");

  Logger.log(JSON.stringify(result, null, 2));
  // street should be: "KFC, Arima Main Road" or similar
}
```

---

## Deployment Steps

1. **Copy Updated Code to Google Apps Script:**
   - Open Trinidad Google Sheet → Extensions → Apps Script
   - Replace `geminiClient.gs` with updated version
   - Save and deploy

2. **Repeat for Guyana:**
   - Open Guyana Google Sheet → Extensions → Apps Script
   - Replace `geminiClient.gs` with updated version
   - Save and deploy

3. **Monitor Results:**
   - Check the next batch of processed articles
   - Review Production sheet for:
     - Fewer false murder classifications
     - Correct crime dates
     - Business/landmark names in addresses

4. **Review Queue Check:**
   - Articles that were previously going to Production with low confidence may now be skipped
   - This is expected and correct behavior

---

## Expected Impact

### Positive Changes
✅ **Reduced false positives** - Uncertain deaths no longer classified as murders
✅ **Accurate dates** - Crime dates correctly calculated from relative references
✅ **Better location data** - Landmarks and business names captured for better mapping
✅ **Improved data quality** - Higher confidence in published statistics

### Potential Side Effects
⚠️ **Fewer auto-processed articles** - More articles may go to Review Queue initially
⚠️ **Manual review needed** - Articles with uncertain circumstances will need human review

**Note:** This is intentional and improves data quality. It's better to manually review uncertain cases than to publish incorrect data.

---

## Version History

**Version:** 2.0
**Date:** November 20, 2025
**Changes:**
- Added murder classification safeguards
- Improved date calculation logic with examples
- Enhanced location extraction for landmarks/businesses

**Previous Version:** 1.0
**Issues:** False murders, incorrect dates, missing location context
