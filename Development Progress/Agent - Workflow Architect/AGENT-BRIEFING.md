# Agent Briefing - Crime Hotspots Automation

**For:** All Claude Code Agents
**Project:** Automated Crime Data Collection System
**Status:** Production Ready (v1.1 - Editorial Filtering)
**Date:** November 9, 2025  

---

## Quick Context (Read This First!)

You're working on an **automated crime data collection system** for Caribbean news. The system:

1. **Monitors** 3 Trinidad & Tobago news RSS feeds
2. **Filters** out editorial/opinion content (Commentary, Opinion pieces, Letters)
3. **Extracts** structured crime data using Google Gemini AI
4. **Geocodes** locations with Plus Codes
5. **Routes** entries based on confidence: Production (auto) or Review Queue (manual)

**Current Status:** ✅ Production ready (v1.1), all critical bugs fixed, multi-crime detection working, editorial filtering active

---

## ⚠️ CRITICAL: What You MUST Know

### 1. Multi-Crime Detection is THE Key Feature

**DO NOT assume articles contain only 1 crime!**

Caribbean news articles often describe **multiple crimes in one article**:
- "Three shootings over the weekend..."
- "Police investigate robberies in Maraval, Trincity, and St Augustine"

**The extraction must return a crimes ARRAY:**
```javascript
{
  "crimes": [
    {crime_date, crime_type, area, headline, ...},
    {crime_date, crime_type, area, headline, ...},
    {crime_date, crime_type, area, headline, ...}
  ],
  "confidence": 9
}
```

**Critical files:**
- `geminiClient.gs` - `buildExtractionPrompt()` must request crimes array
- `processor.gs` - `processReadyArticles()` must loop through crimes array

---

### 2. Token Limit: 4096 (NOT 2048)

**DO NOT decrease `maxOutputTokens` below 4096!**

**Why:**
- Single crime extraction: ~400 tokens
- Multi-crime (3 crimes): ~1,200 tokens
- Multi-crime (5 crimes): ~2,000 tokens

At 2048, responses get truncated when extracting 3+ crimes.

**Location:** `config.gs` line ~65:
```javascript
const GEMINI_CONFIG = {
  maxOutputTokens: 4096  // ← MUST be 4096
}
```

---

### 3. Publication Date ≠ Crime Date

**DO NOT use publication date as crime date!**

**Example:**
- Article published: November 8, 2025 (Friday)
- Article says: "A man was shot on Monday night"
- Crime date should be: **November 4, 2025** (Monday)

**Solution:** Pass publication date to Gemini as reference:
```javascript
function extractCrimeData(articleText, articleTitle, articleUrl, publishedDate)
```

Gemini calculates:
- "yesterday" = publishedDate - 1 day
- "Monday" = calculate Monday before publishedDate
- "last week" = 7 days before publishedDate

**Only use publishedDate if article mentions NO date at all.**

---

### 4. Duplicate Detection: URL + Headline (NOT just URL)

**DO NOT flag crimes as duplicates based on URL alone!**

**Problem:** Multi-crime articles share the same URL:
- Crime 1: URL = newsday.co.tt/article123 ✅ Added
- Crime 2: URL = newsday.co.tt/article123 ❌ Blocked as "duplicate" (WRONG!)
- Crime 3: URL = newsday.co.tt/article123 ❌ Blocked as "duplicate" (WRONG!)

**Solution in `processor.gs` - `isDuplicateCrime()`:**
```javascript
// Duplicate if BOTH conditions true:
1. Same URL AND
2. 90%+ similar headline

// NOT duplicate if:
- Same URL but different headlines (multi-crime article)
```

---

### 5. Editorial Content Filtering (NEW in v1.1)

**DO NOT remove the editorial content filter!**

**Problem:** Opinion pieces, commentary, and letters to the editor often discuss crime statistics but aren't actual crime reports.

**Example:**
- ❌ "Commentary: Crime is rising in Trinidad" (discusses crime, not a crime report)
- ✅ "Man shot in Port of Spain" (actual crime report)

**Solution in `rssCollector.gs` - `isEditorialContent()`:**
Filters out articles with these markers:
- **Title keywords:** "Commentary", "Opinion", "Editorial", "Letter to Editor", "Op-Ed", "Viewpoint", "My View"
- **URL patterns:** `/opinion/`, `/commentary/`, `/editorial/`, `/letters/`
- **Description markers:** "commentary by", "opinion by", "editorial by"

**Impact:**
- Reduces unnecessary Gemini API calls by 5-10%
- Improves data quality (only actual crime reports)
- Saves quota for real crime content

**Testing:**
Run `testEditorialFilter()` to verify filter works correctly.

---

### 6. API Key Security

**NEVER hardcode API keys in source files!**

**Correct approach:**
1. Store in Script Properties: `PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey)`
2. Retrieve securely: `PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')`

**In config.gs:**
```javascript
// BAD ❌
const apiKey = 'AIzaSy...actual-key...';

// GOOD ✅
const apiKey = 'YOUR_API_KEY_HERE'; // Placeholder only
```

---

## File Structure & Responsibilities

### Core Implementation Files

| File | Lines | Purpose | Critical Functions |
|------|-------|---------|-------------------|
| **config.gs** | 215 | Configuration & API management | `getGeminiApiKey()`, `setGeminiApiKey()` |
| **rssCollector.gs** | ~285 | RSS feed collection & filtering | `collectAllFeeds()`, `isEditorialContent()`, `isDuplicate()` |
| **articleFetcher.gs** | 196 | Article text fetching | `fetchPendingArticleText()` |
| **geminiClient.gs** | 612 | AI extraction | `extractCrimeData()`, `buildExtractionPrompt()`, `parseGeminiResponse()` |
| **processor.gs** | 361 | Main orchestrator | `processReadyArticles()`, `isDuplicateCrime()` |
| **geocoder.gs** | 113 | Geocoding service | `geocodeAddress()` |

---

## Common Agent Tasks & How to Handle Them

### Task: "Add a new RSS feed source"

**Files to modify:**
1. `config.gs` - Add to NEWS_SOURCES array
2. Test with `testRSSCollection()`

**Example:**
```javascript
{
  name: "Jamaica Observer",
  country: "JM",
  rssUrl: "https://jamaicaobserver.com/feed",
  enabled: true,
  priority: 1
}
```

**Don't forget:** Verify feed works before enabling!

---

### Task: "Improve extraction accuracy"

**Files to review:**
1. `geminiClient.gs` - `buildExtractionPrompt()`
2. Review ambiguities in Review Queue
3. Adjust confidence threshold in `config.gs`

**Common fixes:**
- Add more crime type examples
- Clarify date calculation rules
- Improve victim extraction logic

**DO NOT:** Remove multi-crime detection to "simplify"

---

### Task: "Fix geocoding errors"

**Files to check:**
1. `geocoder.gs` - `geocodeAddress()`
2. Verify Geocoding API enabled
3. Check API key restrictions

**Common issues:**
- Address too vague ("Port of Spain" vs "Queen Street, Port of Spain")
- API not enabled
- Quota exceeded

---

### Task: "Scale to new country"

**Files to modify:**
1. `config.gs` - Add NEWS_SOURCES for new country
2. Update COUNTRIES array if needed
3. Test with small batch first

**Considerations:**
- Quota impact (100 articles/day per country)
- New crime type classifications
- Different date formats
- Language (if not English)

---

## Testing Requirements

### Before ANY code changes:

**1. Run baseline tests:**
```javascript
testRSSCollection()
testGeminiExtraction()
testMultiCrimeExtraction()  // ← CRITICAL
testGeocoding()
```

**2. Verify multi-crime still works:**
```javascript
// Must extract 3 crimes from test article
testMultiCrimeExtraction()

// Expected output:
// ✅ Detected 3 separate crime incidents
// Crime 1: [headline]
// Crime 2: [headline]
// Crime 3: [headline]
```

**3. Test with real data:**
```javascript
// Mark a multi-crime article for reprocessing
// Run processReadyArticles()
// Verify all crimes added to Production
```

---

## What NOT to Do

### ❌ DON'T:
1. **Remove multi-crime detection** - "simplifying" to single crime breaks 60% of extractions
2. **Decrease token limit** - causes truncation
3. **Add keyword filtering** - unless processing >800 articles/day
4. **Hardcode API keys** - security violation
5. **Skip publication date** - dates will be wrong
6. **Use URL-only duplicate detection** - blocks multi-crime articles

### ✅ DO:
1. **Test multi-crime extraction** after any changes
2. **Pass publication date** to Gemini
3. **Use crimes array** in all extraction logic
4. **Check duplicate detection** doesn't block multi-crime
5. **Verify token limit** is 4096
6. **Test with real articles** not just samples

---

## Quick Reference: Data Flow

```
collectAllFeeds() (every 2 hours)
  ↓
Raw Articles: status = "pending"
  ↓
fetchPendingArticleText() (every 1 hour)
  ↓
Raw Articles: status = "ready_for_processing", Column E filled
  ↓
processReadyArticles() (every 1 hour)
  ↓
extractCrimeData(text, title, url, publishedDate)
  ↓
Gemini returns: {"crimes": [{}, {}, {}], "confidence": 9}
  ↓
For EACH crime in crimes array:
  ├─ Confidence ≥7 → appendToProduction()
  ├─ Confidence 1-6 → appendToReviewQueue()
  └─ Confidence 0 → Skip
```

---

## Quota Limits (Free Tier)

| Service | Daily Limit | Current Usage | Safe Zone |
|---------|-------------|---------------|-----------|
| Apps Script | 90 min/day | 34 min (38%) | <70 min |
| Gemini API | 1,500 calls/day | 100 (6.7%) | <1,200 |
| Geocoding | ~1,333/day | 20 (1.5%) | <1,000 |

**When to worry:**
- Apps Script >80 min/day
- Gemini >1,200 calls/day
- Any service >90% of quota

---

## Emergency Procedures

### If triggers fail:
1. Check Apps Script → Executions for errors
2. Verify API key still set: `verifyApiKey()`
3. Check quota usage
4. Re-create triggers if corrupted

### If extraction quality drops:
1. Review last 20 extractions manually
2. Check Review Queue ambiguities
3. Test with `testMultiCrimeExtraction()`
4. Verify prompt hasn't changed

### If duplicates appear:
1. Test `isDuplicateCrime()` logic
2. Verify using URL + headline matching
3. Check for false positives in logs

---

## Success Indicators

**You'll know it's working when:**
- ✅ Multi-crime articles extract all crimes (not just 1)
- ✅ Dates match article content (not publication date)
- ✅ All crimes share same source URL (multi-crime)
- ✅ Duplicate detection doesn't block multi-crime
- ✅ Production has 15-25 crimes/day
- ✅ Review Queue <50 items
- ✅ No truncation errors in logs

---

## Documentation Links

**Essential Reading:**
- `PROJECT-CONTEXT.md` - Complete project history and decisions
- `GO-LIVE-CHECKLIST.md` - Deployment checklist
- `CHANGELOG.md` - What changed and why
- `README.md` - Quick start guide

**Google Apps Script Location:**
`/Users/kavellforde/Documents/Side Projects/Crime Hotspots/Development Progress/Agent - Workflow Architect/Kavell Automation Live Code/`

---

## Quick Wins for New Agents

**Want to add value quickly?**

### Easy (30 min):
- Add email notifications on errors
- Create daily summary email
- Add more crime type classifications

### Medium (2 hours):
- Implement quarterly archive function
- Add batch processing for Gemini
- Create monitoring dashboard

### Advanced (1 day):
- Add new country (Guyana)
- Implement keyword pre-filtering (for scaling)
- Create retry mechanism for failed articles

---

## Common Questions

### Q: Why "collect all" articles instead of filtering?
**A:** Only using 6.7% of Gemini quota. Keyword filtering misses 20-30% of crime articles. AI is better at identifying crime content. Exception: Editorial/opinion content is filtered out early since it's never relevant crime reporting.

### Q: Why filter out editorial content but not other non-crime articles?
**A:** Editorial filtering is specific and safe (keywords like "Commentary", "Opinion"). General crime keyword filtering is too risky - misses articles like "Three arrested" or "Investigation ongoing". Let AI handle the nuanced crime detection.

### Q: Why 4096 tokens?
**A:** Multi-crime articles with 3-5 crimes need ~2,000 tokens. 4096 gives headroom. At 2048, responses truncate.

### Q: Why pass publication date to Gemini?
**A:** Gemini needs reference to calculate "yesterday", "Monday", "last week". Without it, dates are wrong.

### Q: Why URL + headline for duplicate detection?
**A:** Multi-crime articles share URLs. Need headline to differentiate crime 1, 2, 3 from same article.

### Q: Can I simplify the multi-crime logic?
**A:** No. 60% of extractions are multi-crime articles. Removing this breaks the system.

---

## Version Control

**Current Version:** 1.1.0
**Last Major Update:** November 9, 2025
**Status:** Production Ready (Editorial Filtering)  

**When updating this briefing:**
- Increment version
- Update "Last Major Update" date
- Add to CHANGELOG.md
- Notify project owner

---

## Contact

**Project Owner:** Kavell Forde  
**Email:** discover360news@gmail.com  

**For Agent-to-Agent Handoff:**
- Read this briefing
- Read PROJECT-CONTEXT.md
- Run all test functions
- Ask questions before changing code

---

**Remember:** This system processes real crime data that may be used for public safety decisions. Test thoroughly, maintain quality, and document all changes.

---

**Last Updated:** November 8, 2025  
**For Agents:** workflow-architect, general-purpose, test-and-fix-agent  
**Status:** ✅ Active Production System
