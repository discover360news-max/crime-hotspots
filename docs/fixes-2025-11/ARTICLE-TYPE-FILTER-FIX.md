# Article Type Filter Fix - Data Quality Improvement

**Date:** 2025-11-21
**Issue:** Gemini extracting historical crime examples from non-crime articles
**Status:** ✅ Fixed and deployed

---

## Problem Identified

Two false crime entries were extracted from a business launch article:

```
Source: https://newsday.co.tt/2025/11/20/bamboo-gives-customers-a-safe-place-to-cell/

Bad Entry 1:
- Date: 2025-11-15
- Crime: "Couva man (29) robbed of car and device after Facebook lure"
- Location: Barataria, Trinidad

Bad Entry 2:
- Date: 2025-05-01 (6 months old!)
- Crime: "Man robbed of car and cell phone while selling security system"
- Location: Trinidad (incomplete)
```

**Root Cause:** Article was about a company/app launch ("Bamboo gives customers a safe place to sell"). The crimes mentioned were historical examples used to explain the app's motivation, not actual new crime reports.

---

## Solution Implemented

Added **Rule 2: ARTICLE TYPE FILTER** to Gemini prompts:

### What Gets INCLUDED ✅
- Breaking news about recent/ongoing crime incidents
- Police reports of specific crimes with victim details
- Court coverage of recent crimes (conviction/arraignment)

### What Gets EXCLUDED ❌
- Business/product launch articles (even if they mention crime as motivation)
- Opinion pieces, editorials, analysis that reference historical crimes
- Crime prevention articles using example crimes from the past
- Articles primarily about services/apps/companies where crime is mentioned in passing
- Historical crime examples (>1 month old) used for context

### Specific Examples Now Filtered
- "New app helps victims sell safely" + past crime examples → NOT extracted
- "Crime stats show increase" without specific new incidents → NOT extracted
- "Company launches security service" mentioning old robbery → NOT extracted

---

## Files Modified

- `google-apps-script/trinidad/geminiClient.gs` (lines 215-228)
- `google-apps-script/guyana/geminiClient.gs` (lines 215-228)

---

## Deployment Required

⚠️ **Manual step needed:** Copy the updated `geminiClient.gs` files to Google Apps Script:

1. **Trinidad Automation:**
   - Open Trinidad Google Sheet → Extensions → Apps Script
   - Replace `geminiClient.gs` content with updated file
   - Save

2. **Guyana Automation:**
   - Open Guyana Google Sheet → Extensions → Apps Script
   - Replace `geminiClient.gs` content with updated file
   - Save

---

## Data Cleanup Needed

The two false entries from the Bamboo article need to be manually deleted from the Production sheet:

1. Open Trinidad Production sheet
2. Find entries with source URL: `https://newsday.co.tt/2025/11/20/bamboo-gives-customers-a-safe-place-to-cell/`
3. Delete both rows
4. Republish the Google Sheet CSV

---

## Testing Recommendation

After deploying to Google Apps Script:

1. Mark a few already-processed articles as "ready_for_processing" again
2. Run `processReadyArticles()` manually
3. Verify these non-crime articles now return `{"crimes": [], "confidence": 0}`:
   - Product announcements mentioning crime
   - Opinion pieces about crime trends
   - Historical crime retrospectives

---

## Impact

This fix will:
- **Improve data accuracy** by eliminating false positives from non-crime articles
- **Reduce manual review burden** - fewer incorrect extractions to clean up
- **Prevent old crime examples** from appearing as recent incidents
- **Ensure date accuracy** by filtering out articles with >1 month old examples

---

**Commit:** `704f184` - "Add article type filter to prevent extraction from non-crime articles"
**Branch:** `main`
**Status:** Pushed to GitHub, awaiting Google Apps Script deployment
