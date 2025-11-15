# Crime Hotspots Automated Pipeline
## Production Version 1.0

**Last Updated:** 2025-11-08
**Status:** Production-Ready
**Platform:** Google Apps Script
**Free Tier:** Yes (100% free services)

---

## Overview

Automated crime data collection pipeline for Trinidad & Tobago news sources. Uses AI to extract structured crime data from news articles and geocode locations for mapping in Google Looker Studio.

**What It Does:**
1. Collects articles from RSS feeds (hourly)
2. Fetches full article text (every 2 hours)
3. Extracts crime data using Gemini AI (every 4 hours)
4. Geocodes locations to Plus Codes (on-demand)
5. Routes high-confidence crimes to Production, low-confidence to Review Queue

**Tech Stack:**
- Google Apps Script (serverless backend)
- Google Sheets (database)
- Google Gemini AI (data extraction)
- Google Geocoding API (location mapping)
- 3 Trinidad news RSS feeds

**Cost:** $0/month (all free tiers)

---

## Quick Start (5 Steps)

### 1. Create Google Sheet
Create a new Google Sheet with these tabs:
- Raw Articles
- Production
- Review Queue
- Archive (optional - created automatically if needed)

**Required Headers:**

**Raw Articles Sheet:**
```
A: Timestamp | B: Source | C: Title | D: URL | E: Full Text | F: Published Date | G: Status | H: Notes
```

**Production Sheet:**
```
A: Crime Date | B: Headline | C: Crime Type | D: Street | E: Plus Code | F: Area | G: Island | H: Source URL | I: Latitude | J: Longitude
```

**Review Queue Sheet:**
```
A: Crime Date | B: Headline | C: Crime Type | D: Street | E: Plus Code | F: Area | G: Island | H: Source URL | I: Latitude | J: Longitude | K: Confidence | L: Ambiguities | M: Review Status | N: Notes
```

### 2. Open Apps Script
1. In your Google Sheet: Extensions → Apps Script
2. Delete default Code.gs content
3. Copy/paste all .md files from this folder (see File Guide below)

### 3. Configure API Key
1. Get free Gemini API key: https://aistudio.google.com/apikey
2. In Apps Script, open `config.md`
3. Find `setGeminiApiKey()` function
4. Replace `'YOUR_API_KEY_HERE'` with your actual key
5. Run `setGeminiApiKey()` (one-time setup)
6. Run `verifyApiKey()` to confirm

### 4. Enable Google APIs
1. Go to Google Cloud Console: https://console.cloud.google.com
2. Select your Apps Script project
3. Enable these APIs:
   - Generative Language API (Gemini)
   - Geocoding API
4. Both have generous free tiers (no credit card required)

### 5. Set Up Triggers
1. In Apps Script: Click clock icon (Triggers)
2. Add these time-based triggers:

| Function | Frequency | Purpose |
|----------|-----------|---------|
| `collectAllFeeds()` | Every hour | Collect RSS articles |
| `fetchPendingArticleText()` | Every 2 hours | Fetch full article text |
| `processReadyArticles()` | Every 4 hours | Extract crime data with AI |
| `archiveProcessedArticles()` | Monthly | Archive old articles (>90 days) |

**Done!** The pipeline will start automatically.

---

## File Guide

### Core Implementation Files (Copy to Apps Script)

| File | Purpose | Functions |
|------|---------|-----------|
| `config.md` | Configuration & API setup | `getGeminiApiKey()`, `setGeminiApiKey()`, `verifyApiKey()` |
| `rssCollector.md` | RSS feed collection | `collectAllFeeds()`, `isDuplicate()` |
| `articleFetcher.md` | Article text fetching | `fetchPendingArticleText()` |
| `geminiClient.md` | AI extraction with Gemini | `extractCrimeData()`, `parseGeminiResponse()` |
| `processor.md` | Main orchestrator | `processReadyArticles()`, `appendToProduction()` |
| `geocoder.md` | Geocoding with Plus Codes | `geocodeAddress()` |
| `maintenance.md` | Archive & health checks | `archiveProcessedArticles()`, `getPipelineHealthStats()` |

### Documentation Files (Reference Only)

| File | Purpose |
|------|---------|
| `README.md` | This file - Quick start guide |
| `CHANGELOG.md` | Version history & changes |
| `PRODUCTION-CHECKLIST.md` | Pre-launch verification steps |
| `TROUBLESHOOTING-GUIDE.md` | Common errors & solutions |
| `WORKFLOW-OVERVIEW.md` | Visual workflow diagram |
| `MAINTENANCE-SCHEDULE.md` | Daily/weekly/monthly tasks |
| `FUTURE-ENHANCEMENTS.md` | Roadmap for v2.0 |

---

## Testing Guide

Before setting up triggers, test each component:

### Test 1: RSS Collection
```javascript
testRSSCollection()
```
**Expected:** New articles appear in Raw Articles sheet with status "pending"

### Test 2: Article Fetching
```javascript
testArticleFetching()
```
**Expected:** Column E populated with article text, status → "ready_for_processing"

### Test 3: Gemini Extraction
```javascript
testGeminiWithSheetData()
```
**Expected:** Crime data extracted and logged with confidence score

### Test 4: Multi-Crime Detection
```javascript
testMultiCrimeExtraction()
```
**Expected:** Multiple crimes detected from single article

### Test 5: Full Pipeline
```javascript
testProcessingPipeline()
```
**Expected:** Crimes routed to Production or Review Queue based on confidence

---

## Data Flow

```
RSS Feeds
   ↓
Raw Articles (status: pending)
   ↓
Article Text Fetcher
   ↓
Raw Articles (status: ready_for_processing)
   ↓
Gemini AI Extraction
   ↓
   ├─→ High Confidence (≥7) → Production Sheet
   └─→ Low Confidence (<7) → Review Queue
```

**Status Transitions:**
```
pending → ready_for_processing → processing → completed/needs_review/skipped
```

---

## Quota Limits (Free Tier)

| Service | Free Tier | Estimated Usage | Safe? |
|---------|-----------|-----------------|-------|
| Gemini API | 60 requests/min | ~50/day (1,500/month) | ✅ Yes |
| Geocoding API | 40,000/month | ~900/month (with caching) | ✅ Yes |
| Apps Script Runtime | 6 min/execution | ~30 sec/execution | ✅ Yes |
| Apps Script Triggers | 20/user/script | 4 triggers total | ✅ Yes |

---

## Maintenance

### Daily (5 minutes)
- Check execution logs for errors
- Verify Production sheet receiving data
- Review Review Queue for patterns

### Weekly (15 minutes)
- Review confidence threshold accuracy
- Clear any failed articles
- Check API quota usage

### Monthly (30 minutes)
- Run `archiveProcessedArticles()`
- Run `getPipelineHealthStats()`
- Review and improve extraction prompts

### Quarterly
- Archive old processed articles
- Review geocoding cache efficiency
- Update news sources if needed

See `MAINTENANCE-SCHEDULE.md` for detailed checklists.

---

## Troubleshooting

**Common Issues:**

| Error | Solution |
|-------|----------|
| "API key not configured" | Run `setGeminiApiKey()` |
| "Sheet not found" | Create required sheets with proper headers |
| "REQUEST_DENIED" | Enable Geocoding API in Google Cloud Console |
| No articles collected | Check RSS feeds still active |
| Low extraction quality | Adjust `CONFIDENCE_THRESHOLD` in config.md |

See `TROUBLESHOOTING-GUIDE.md` for comprehensive error guide.

---

## Security Checklist

Before deploying to production:

- [ ] Replace `'YOUR_API_KEY_HERE'` in config.md
- [ ] Run `setGeminiApiKey()` to store securely
- [ ] Delete hardcoded API key from code
- [ ] Verify Script Properties contains GEMINI_API_KEY
- [ ] Do not commit actual API keys to version control
- [ ] Restrict Google Sheet sharing to authorized users only

---

## Multi-Crime Detection

**NEW in v1.0:** Automatically detects multiple crime incidents in single articles.

**Example Input:**
> "Police are investigating three separate shootings over the weekend. On Friday night, a man was killed in Arima. On Saturday, another shooting occurred in San Juan, and on Sunday morning, a teen was shot in Marabella."

**Output:**
- Crime 1: Murder in Arima (Friday)
- Crime 2: Shooting in San Juan (Saturday)
- Crime 3: Shooting in Marabella (Sunday)

Each crime gets its own row in Production/Review Queue with distinct dates, locations, and details.

---

## Support

**For Issues:**
1. Check `TROUBLESHOOTING-GUIDE.md`
2. Review Apps Script execution logs
3. Test individual components
4. Verify API quotas

**For Enhancements:**
See `FUTURE-ENHANCEMENTS.md` for roadmap

---

## Credits

**Developer:** Kavell Forde
**AI Assistant:** Claude (Anthropic)
**Platform:** Google Apps Script
**Version:** 1.0 (Production Release)
**License:** Proprietary (Crime Hotspots Project)

---

## Next Steps

1. ✅ Complete Quick Start (above)
2. ✅ Run all test functions
3. ✅ Set up triggers
4. ✅ Monitor for 1 week
5. ✅ Review `PRODUCTION-CHECKLIST.md`
6. ✅ Schedule maintenance tasks
7. ✅ Plan v2.0 enhancements

**Ready to Deploy?** See `PRODUCTION-CHECKLIST.md` for final verification steps.

---

**Last Updated:** 2025-11-08
**Status:** ✅ PRODUCTION-READY
