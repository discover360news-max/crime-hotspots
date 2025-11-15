# Testing the Improved Article Fetcher

**Status:** Ready for testing
**Priority:** CRITICAL - Must verify before deploying

---

## 🎯 What We're Testing

The improved article fetcher should:
- ✅ Extract ONLY the main article content
- ✅ EXCLUDE navigation, sidebars, related articles
- ✅ Validate that content matches the title
- ✅ Reject content with sidebar contamination

---

## 📝 Quick Test (5 minutes)

### STEP 1: Add the Improved Fetcher to Apps Script

1. Open Google Apps Script
2. Click ➕ to add new file
3. Name it: `articleFetcherImproved.gs`
4. Copy entire contents from the file I created
5. **Save** (Ctrl/Cmd + S)

### STEP 2: Test with Row 3 (Known Problematic Article)

Run this function:
```javascript
testRow3Fix()
```

**Expected Output:**
```
Testing Row 3 (President: UN youth programme)...

=== RESULT ===
Success: true
Method: Smart extraction
Content Length: ~1500-3000 chars

=== FIRST 500 CHARS ===
President Christine Kangaloo says the general caustic and corrosive tone...
[Should be about UN youth programme, NOT about crimes]

=== VALIDATION ===
✅ SUCCESS: Sidebar content excluded
✅ SUCCESS: Contains actual article content
```

**If you see:**
- ❌ "Still contains sidebar crime content" (Williamsville, labourer, shot) → Fetcher needs adjustment
- ✅ "Sidebar content excluded" + actual UN youth content → **SUCCESS!**

---

## 🧪 Full Test Suite (15 minutes)

### Test 1: Non-Crime Article (Should NOT have crime keywords)

```javascript
testImprovedFetcher(
  'https://newsday.co.tt/2025/11/08/president-un-youth-programme-promotes-pathways-of-peace/',
  'President: UN youth programme promotes pathways of peace'
)
```

**Expected:**
- ✅ success: true
- ✅ Content about youth programme, peace
- ✅ NO mentions of "Williamsville", "labourer", "shot"

---

### Test 2: Real Crime Article (Should have crime content)

Pick any actual crime article from Raw Articles, for example:

```javascript
// Find a row with actual crime article
const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw Articles');
const data = sheet.getDataRange().getValues();

// Look for a row with crime in title
for (let i = 1; i < data.length; i++) {
  const title = data[i][2];
  if (title.toLowerCase().includes('shot') || title.toLowerCase().includes('killed')) {
    const url = data[i][3];
    Logger.log(`Testing: ${title}`);
    testImprovedFetcher(url, title);
    break;
  }
}
```

**Expected:**
- ✅ success: true
- ✅ Content describes the actual crime
- ✅ Title keywords present in content

---

### Test 3: Government/Policy Article (Should NOT extract)

```javascript
testImprovedFetcher(
  'https://newsday.co.tt/2025/11/08/eu-funds-solar-power-project-at-office-of-prime-minister/',
  'EU funds solar-power project at Office of Prime Minister'
)
```

**Expected:**
- ✅ success: true
- ✅ Content about solar power project
- ✅ NO crime keywords (or ≤2 at most)

---

## 📊 Success Criteria

The improved fetcher PASSES if:
- ✅ Non-crime articles: 0-2 crime keywords in content
- ✅ Title keyword match: ≥40% for all articles
- ✅ No WordPress metadata in content ([cat_name], etc.)
- ✅ Content is sentences, not navigation menus
- ✅ 90%+ success rate on test articles

The improved fetcher FAILS if:
- ❌ Non-crime articles still have 3+ crime keywords
- ❌ Title keywords missing from content
- ❌ Contains "[cat_name]" or navigation text
- ❌ <60% success rate

---

## 🚀 Deploy Process (After Tests Pass)

### Option A: Re-fetch ALL Contaminated Articles (Recommended)

This will fix the 22 contaminated articles identified in diagnostics:

```javascript
refetchContaminatedArticles()
```

**What it does:**
- Re-fetches rows 3, 4, 15, 32, 33, 34, 37, 38, 43, 44, 46, 47, 50, 54, 58, 61, 62, 64, 65, 66, 69, 70
- Uses improved fetcher
- Updates Full Text column
- Marks as "ready_for_processing"
- Takes ~3-5 minutes (2 second delay between fetches)

**Monitor the output:**
- Should see: "✅ Success" for most articles
- Watch for: "❌ Failed" messages (investigate those)

---

### Option B: Process New Articles Only

Replace the old `fetchPendingArticleText()` with:

```javascript
fetchPendingArticlesImproved()
```

**What it does:**
- Only processes articles with status = "pending"
- Uses improved fetcher
- Batch size: 10 articles
- Logs success/failure for each

---

### Option C: Full Deployment (Update Trigger)

1. **Rename old function:**
   - In `articleFetcher.md`, rename `fetchPendingArticleText()` to `fetchPendingArticleTextOLD()`

2. **Rename new function:**
   - In `articleFetcherImproved.gs`, rename `fetchPendingArticlesImproved()` to `fetchPendingArticleText()`

3. **Trigger will automatically use new version**
   - No need to update triggers
   - Next run will use improved fetcher

---

## 🔍 Monitoring After Deployment

### Immediate (First Hour)

Run this after first batch processes:
```javascript
runDeepDiagnostics()
```

**Check:**
- Contamination rate should drop from 76% to <10%
- No "[cat_name]" in Full Text column
- Title keywords present in content

### Daily (First Week)

Run:
```javascript
scanForSidebarContamination()
```

**Target:**
- Contamination: <5%
- Success rate: >90%

If contamination >10%, run diagnostics and adjust VALIDATION thresholds.

---

## ⚙️ Tuning Parameters

If fetcher is too strict (rejecting valid articles):

**In `articleFetcherImproved.gs`, adjust:**
```javascript
const VALIDATION = {
  MIN_CONTENT_LENGTH: 200,        // Lower to 150 if too strict
  MIN_TITLE_MATCH_PCT: 40,        // Lower to 30 if too strict
  MAX_CRIME_KEYWORDS_NONCRIME: 2, // Raise to 3 if too strict
  MIN_SENTENCES: 3                // Lower to 2 if too strict
};
```

If fetcher is too permissive (allowing contaminated content):

**Increase thresholds:**
```javascript
const VALIDATION = {
  MIN_TITLE_MATCH_PCT: 50,        // Raise to 50-60
  MAX_CRIME_KEYWORDS_NONCRIME: 1, // Lower to 1
};
```

---

## 🐛 Troubleshooting

### Issue: "All extraction strategies failed validation"

**Cause:** Content validation too strict OR site structure changed

**Fix:**
1. Run `testImprovedFetcher(url, title)` on the problem article
2. Check log to see which validation failed
3. Adjust threshold or add new extraction strategy

---

### Issue: "Title match too low: 25%"

**Cause:** Fetcher grabbed wrong section OR title is generic

**Fix:**
1. Inspect content: Does it match title?
2. If yes: Lower `MIN_TITLE_MATCH_PCT` to 25-30
3. If no: Check which extraction strategy was used, improve targeting

---

### Issue: "Sidebar contamination detected"

**Cause:** Fetcher still grabbing related articles section

**Fix:**
1. Inspect HTML of problem site
2. Add more exclude selectors to `EXCLUDE_SELECTORS` array
3. Example: `.related-content`, `.latest-news-widget`

---

## 📈 Expected Improvements

### Before (Old Fetcher)
- Contamination: 76% (22/29 articles)
- Non-crime articles: Extracted 1-6 fake crimes each
- URL mismatches: 52/76 (68%)

### After (Improved Fetcher)
- Contamination: <5% (goal: 0-2/29)
- Non-crime articles: 0 crimes extracted (confidence: 0)
- URL mismatches: <5%

### Data Quality Impact
- Production accuracy: 95%+ (up from ~30%)
- False crimes: 0 (down from ~50)
- Duplicates: <3% (improved from ~10%)
- Review Queue: 10-15% (down from ~50%)

---

## ✅ Final Checklist Before Full Deployment

- [ ] Tested Row 3 - sidebar excluded ✅
- [ ] Tested real crime article - content correct ✅
- [ ] Tested government article - no contamination ✅
- [ ] Success rate >90% on 5+ test articles ✅
- [ ] Re-fetched contaminated articles (Option A) ✅
- [ ] Monitored first batch - contamination <10% ✅
- [ ] Updated triggers to use new fetcher (Option C) ✅
- [ ] Documented any tuning adjustments ✅

---

**Ready to test?** Start with `testRow3Fix()` and share the output!

**Last Updated:** November 9, 2025
**Status:** Ready for testing
**Next Action:** Run `testRow3Fix()` in Apps Script
