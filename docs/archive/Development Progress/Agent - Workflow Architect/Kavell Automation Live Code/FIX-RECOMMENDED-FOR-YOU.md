# Fix: "RECOMMENDED FOR YOU" Contamination

**Date:** 2025-11-09
**Status:** ✅ Fixed, Ready for Testing

## Problem Identified

The "MP mourns murdered uncle" headline was appearing in multiple unrelated articles because Trinidad Express includes a "RECOMMENDED FOR YOU" section at the bottom of articles. The improved fetcher was capturing this recommendation content.

**Evidence from logs:**
- Row 34 (Man, 29, executed): `...RECOMMENDED FOR YOU MP mourns murdered uncle...`
- Row 70 ($80,000 stolen): `...RECOMMENDED FOR YOU MP mourns murdered uncle...`

## Root Cause

Trinidad Express articles include plain-text recommendation sections that looked like this:

```
[Article content...]

RECOMMENDED FOR YOU
MP mourns murdered uncle: 'Why does another family have to endure this kind of pain?'
[More recommendations...]
```

The improved fetcher's validation passed these through because:
1. HTML div filtering didn't catch plain-text markers
2. No text-based truncation at "RECOMMENDED FOR YOU"
3. Other recommendation patterns (MORE FROM, TRENDING) also slipped through

## Solution Implemented

**Three-layer defense in `articleFetcherImproved.gs`:**

### 1. CSS Class Filtering (Lines 66-68)
Added to `EXCLUDE_SELECTORS`:
```javascript
'.recommended-for-you',
'.recommended',
'.trending'
```

### 2. HTML Pattern Removal (Lines 277-278)
Added to `removeExcludedElements()`:
```javascript
cleaned = cleaned.replace(/<div[^>]*class="[^"]*recommended[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
cleaned = cleaned.replace(/<div[^>]*class="[^"]*trending[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
```

### 3. Text-Based Truncation (Lines 321-332)
Added to `cleanText()`:
```javascript
// Remove "RECOMMENDED FOR YOU" sections and everything after
const recommendedIndex = text.search(/RECOMMENDED FOR YOU/i);
if (recommendedIndex > 0) {
  if (recommendedIndex > VALIDATION.MIN_CONTENT_LENGTH) {
    text = text.substring(0, recommendedIndex).trim();
  }
}

// Also remove other recommendation markers
text = text.replace(/\s*(MORE FROM|TRENDING|YOU MAY ALSO LIKE|RELATED ARTICLES?|READ ALSO)[:\s].*/gi, '');
```

## Testing

### New Test Function Added
`testRecommendedForYouFix()` - Tests rows 34 and 70 specifically

**How to test:**
1. Open Google Apps Script editor
2. Select function: `testRecommendedForYouFix`
3. Click Run
4. Check execution log

**Expected results:**
- ✅ "RECOMMENDED FOR YOU" not present in extracted content
- ✅ "MP mourns" not present in unrelated articles
- ✅ Content length appropriate (not truncated too early)
- ✅ First 150 chars show actual article content

### Full Re-fetch Test
To re-fetch all affected articles with the fix:
```javascript
refetchContaminatedArticles()
```

This will re-process the 22 contaminated rows identified in previous diagnostics.

## Next Steps

1. **Test the fix:**
   ```
   testRecommendedForYouFix()
   ```

2. **If test passes, re-fetch contaminated articles:**
   ```
   refetchContaminatedArticles()
   ```

3. **Verify duplication is resolved:**
   ```
   investigateMPMournsStory()
   ```
   Should show ZERO matches after re-fetching

4. **Deploy to production triggers** (after verification)

## Files Modified

- ✅ `articleFetcherImproved.gs` - Added 3-layer recommendation filtering

## Prevention

This fix prevents future contamination by:
- Catching recommendations in HTML structure
- Catching recommendations in plain text
- Being pattern-agnostic (works with multiple recommendation formats)
- Only truncating after substantial content (> 200 chars)

## Success Metrics

**Before fix:**
- 22 articles contaminated with sidebar/recommendation content
- "MP mourns" appearing in 8+ unrelated articles

**Expected after fix:**
- 0 articles with recommendation contamination
- Each article contains only its own content
- "MP mourns" appears only in its original article

---

**Status:** Ready for testing with `testRecommendedForYouFix()`
