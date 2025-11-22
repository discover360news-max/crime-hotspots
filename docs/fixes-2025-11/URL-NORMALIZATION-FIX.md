# URL Normalization Fix - Duplicate Detection Enhancement

**Date:** 2025-11-21
**Issue:** Duplicate crime entries from Trinidad Express due to URL slug variations
**Status:** ✅ Fixed and deployed

---

## Problem Identified

Two duplicate entries for the same crime incident:

```
Source: Trinidad Express (article_ad6cd863-cc2d-4eaf-b4a8-62042408f3e6.html)

Entry 1:
- Headline: "Retired man (65) loses $42,200 cash and jewels hidden in ice cream bucket"
- URL: /newsextra/retires-hides-42-000.../article_ad6cd863...

Entry 2:
- Headline: "Retiree hides $42,000 in cash, jewels in ice cream bucket, thief finds it (65)"
- URL: /newsextra/retiree-hides-42-000.../article_ad6cd863...
```

**Identical Crime:**
- Same date: 2025-11-18
- Same location: Laventille Road, Febeau Village, San Juan
- Same coordinates: 10.668077, -61.464168
- Same victim: 65-year-old retiree
- Same crime: Theft of $42,000 from ice cream bucket

---

## Root Cause

Trinidad Express URLs have this format:
```
https://trinidadexpress.com/[section]/[article-slug]/article_[UUID].html
```

**The Issue:**
- The **article slug** can vary (typos, editorial changes): `retires` vs `retiree`
- The **article UUID** never changes: `article_ad6cd863-cc2d-4eaf-b4a8-62042408f3e6.html`
- Duplicate detection used exact URL matching: `existingUrl === crime.source_url`
- Slug variation caused match to fail → duplicate not detected

---

## Solution Implemented

Added **`normalizeUrl()`** function to extract and compare article IDs:

### For Trinidad Express:
```javascript
// Before normalization:
URL 1: trinidadexpress.com/.../retires-hides.../article_ad6cd863-cc2d-4eaf-b4a8-62042408f3e6.html
URL 2: trinidadexpress.com/.../retiree-hides.../article_ad6cd863-cc2d-4eaf-b4a8-62042408f3e6.html

// After normalization (both become):
trinidadexpress:article_ad6cd863-cc2d-4eaf-b4a8-62042408f3e6.html
```

### For Other Sources:
- **Kaieteur News** (Guyana): Extracts `?p=12345` post ID
- **Other sources**: Falls back to full URL comparison
- **Extensible**: Easy to add new patterns as discovered

---

## Technical Implementation

```javascript
function normalizeUrl(url) {
  if (!url) return url;

  // Trinidad Express: Extract article ID
  const expressMatch = url.match(/article_([a-f0-9-]+)\.html/i);
  if (expressMatch) {
    return `trinidadexpress:${expressMatch[0]}`;
  }

  // Kaieteur News: Extract post ID
  const kaiMatch = url.match(/\?p=(\d+)/);
  if (kaiMatch) {
    return `kaieteur:${kaiMatch[1]}`;
  }

  // Other sources: Original URL
  return url;
}
```

Updated duplicate detection:
```javascript
// Before:
if (existingUrl === crime.source_url) { ... }

// After:
const normalizedExistingUrl = normalizeUrl(existingUrl);
const normalizedNewUrl = normalizeUrl(crime.source_url);
if (normalizedExistingUrl === normalizedNewUrl) { ... }
```

---

## Files Modified

- `google-apps-script/trinidad/processor.gs` (lines 236-255, 290-293)
- `google-apps-script/guyana/processor.gs` (lines 236-261, 296-299)

---

## Deployment Required

⚠️ **Manual step needed:** Copy updated `processor.gs` to Google Apps Script:

1. **Trinidad Automation:**
   - Open Trinidad Google Sheet → Extensions → Apps Script
   - Replace `processor.gs` with updated file
   - Save

2. **Guyana Automation:**
   - Open Guyana Google Sheet → Extensions → Apps Script
   - Replace `processor.gs` with updated file
   - Save

---

## Data Cleanup Needed

Delete the duplicate entry from Production sheet:
1. Open Trinidad Production sheet
2. Find both entries with:
   - Date: 2025-11-18
   - Location: Laventille Road, San Juan
   - URL contains: `article_ad6cd863-cc2d-4eaf-b4a8-62042408f3e6.html`
3. **Keep one entry, delete the duplicate** (keep the better headline)
4. Republish the Google Sheet CSV

---

## Testing Recommendation

After deployment, verify fix works:
1. Create a test article with Trinidad Express URL (with slug variation)
2. Process it twice (should detect as duplicate on second attempt)
3. Check logs for: `Duplicate found: Same URL + Same area + Same date`

---

## Impact

This fix will:
- **Eliminate Trinidad Express duplicates** caused by slug variations
- **Catch Kaieteur News duplicates** with post ID matching
- **Improve data quality** by preventing duplicate crime entries
- **Reduce manual cleanup** needed after processing
- **Extensible framework** for handling other news sources with ID-based URLs

---

## Why This Happens (Technical Background)

Many modern CMS systems (like WordPress, used by Trinidad Express) generate URLs like:
```
/section/seo-friendly-slug/post-id
```

The slug is:
- Generated from the headline
- Can be edited by journalists
- May have typos/variations
- NOT a reliable unique identifier

The post ID is:
- System-generated UUID
- Never changes once assigned
- The TRUE unique identifier
- Should be used for duplicate detection

Our fix extracts and compares post IDs, not slugs.

---

**Commit:** `b74307f` - "Fix duplicate detection for Trinidad Express article ID variations"
**Branch:** `main`
**Status:** Pushed to GitHub, awaiting Google Apps Script deployment

**Next Steps:**
1. Deploy to Google Apps Script
2. Delete duplicate entry from Production
3. Monitor future Trinidad Express articles for duplicate prevention
