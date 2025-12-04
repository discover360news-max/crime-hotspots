# Crime Hotspots - Barbados Automation

**Status:** Ready for Setup
**Created:** December 4, 2025
**Country:** Barbados
**RSS Feeds:** 3 verified sources

---

## Overview

This directory contains Google Apps Script automation for collecting, processing, and publishing Barbados crime data from news sources. The pipeline follows the proven Trinidad & Tobago architecture.

### Data Pipeline

```
RSS Feeds → Raw Articles → Article Fetcher → Gemini AI Extraction
    ↓              ↓                ↓                    ↓
Hourly     Raw Articles Sheet   Full Text Added    Crime Data Extracted
           (pending status)     (ready status)      (confidence score)
                                                           ↓
                                                    High Confidence (≥7)
                                                           ↓
                                                    Production Sheet
                                                           ↓
                                                      LIVE Sheet (CSV)
                                                           ↓
                                                    Frontend Dashboard
```

---

## News Sources

### Verified RSS Feeds

1. **Barbados Today** (Priority 1)
   - URL: https://barbadostoday.bb/feed/
   - Status: ✅ Active
   - Type: Mainstream news outlet
   - Coverage: National crime reporting

2. **Nation News** (Priority 1)
   - URL: https://nationnews.com/feed/
   - Status: ✅ Active
   - Type: Established newspaper
   - Coverage: Comprehensive crime coverage

3. **Barbados Underground** (Priority 2)
   - URL: https://barbadosunderground.net/feed/
   - Status: ✅ Active
   - Type: Community blog
   - Coverage: Local incidents and commentary

---

## Setup Instructions

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet: **"Crime Hotspots - Barbados"**
3. Create **7 sheets** with these exact names:
   - Raw Articles
   - Processing Queue
   - Review Queue
   - Production
   - Production Archive
   - LIVE
   - Archive

### Step 2: Configure Sheet Headers

#### Raw Articles Sheet
```
A: Timestamp | B: Source | C: Title | D: URL | E: Full Text | F: Published Date | G: Status | H: Notes
```

#### Production Sheet
```
A: Date | B: Headline | C: Crime Type | D: Street | E: Plus Code | F: Area | G: Island | H: URL | I: Lat | J: Long | K: Status
```

#### LIVE Sheet
```
A: Timestamp | B: Date | C: Headline | D: Crime Type | E: Street Address | F: Location | G: Area | H: Island | I: URL | J-Z: (Extra form fields - leave empty)
```

### Step 3: Publish LIVE Sheet as CSV

1. Click on **LIVE sheet** tab
2. File → Share → Publish to web
3. Select **LIVE sheet** (not entire document)
4. Choose **Comma-separated values (.csv)**
5. Check "Automatically republish when changes are made"
6. Click **Publish**
7. **Copy the CSV URL** (you'll need this for the frontend)

Format: `https://docs.google.com/spreadsheets/d/e/{PUBLISHED_ID}/pub?gid={SHEET_ID}&single=true&output=csv`

### Step 4: Create Apps Script Project

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete the default `Code.gs` file
3. Create **7 new script files** (click + button):
   - `config.gs`
   - `rssCollector.gs`
   - `articleFetcherImproved.gs`
   - `geminiClient.gs`
   - `processor.gs`
   - `geocoder.gs`
   - `syncToLive.gs`

4. Copy the code from this directory's `.gs` files into each script file

### Step 5: Configure API Keys

1. In Apps Script Editor, click **Run → Run function → setGeminiApiKey**
2. First time: Authorize the script (Review Permissions → Advanced → Go to Project)
3. Edit `setGeminiApiKey()` function:
   ```javascript
   const apiKey = 'YOUR_ACTUAL_GEMINI_API_KEY_HERE';
   ```
4. Run the function again to save the key
5. Verify: Run `verifyApiKey()` - should see "✅ API key is set"

**Note:** Gemini API key also works for Geocoding API (Google Maps) if both services are enabled for the same key.

### Step 6: Test RSS Collection

1. Run function: `testRSSCollection()`
2. Check execution log:
   - Should see "Barbados Today: X articles found, Y new collected"
   - Should see "Nation News: X articles found, Y new collected"
   - Should see "Barbados Underground: X articles found, Y new collected"
3. Check **Raw Articles** sheet - should have new rows with status "pending"

### Step 7: Set Up Triggers

Go to **Triggers** (clock icon in sidebar) and create:

#### Trigger 1: RSS Collection (Hourly)
- Function: `collectAllFeeds`
- Event source: Time-driven
- Type: Hour timer
- Hour interval: Every hour
- Failure notification: Daily

#### Trigger 2: Article Text Fetching (Hourly)
- Function: `fetchPendingArticlesImproved`
- Event source: Time-driven
- Type: Hour timer
- Hour interval: Every hour
- Failure notification: Daily

#### Trigger 3: Crime Data Processing (Hourly)
- Function: `processReadyArticles`
- Event source: Time-driven
- Type: Hour timer
- Hour interval: Every hour
- Failure notification: Daily

#### Trigger 4: Sync to LIVE (Every 24 hours)
- Function: `syncProductionToLive`
- Event source: Time-driven
- Type: Day timer
- Time: 2am - 3am (choose your timezone)
- Failure notification: Daily

---

## Barbados Geographic Configuration

### Parishes (11 total)
1. Christ Church
2. St. Andrew
3. St. George
4. St. James
5. St. John
6. St. Joseph
7. St. Lucy
8. St. Michael
9. St. Peter
10. St. Philip
11. St. Thomas

### Major Areas & Landmarks
- **Capital:** Bridgetown (13.1939°N, -59.5432°W)
- **Major Towns:** Speightstown, Oistins, Holetown
- **Popular Areas:** Black Rock, Six Cross Roads, Haggatt Hall, Warrens, Wildey, Pine
- **Coastal Regions:** South Coast, West Coast (Platinum Coast), East Coast
- **Popular Locations:** St. Lawrence Gap, Worthing, Hastings, Rockley

### Bounding Box
- North: 13.35°N
- South: 13.04°N
- East: -59.42°W
- West: -59.65°W

**Size:** 166 square miles (smaller than Trinidad, easier to geocode)

---

## Testing & Validation

### Manual Testing Functions

Run these in Apps Script to verify everything works:

#### 1. Test RSS Feeds
```javascript
testRSSCollection()
```
Expected: New articles in Raw Articles sheet with "pending" status

#### 2. Test Article Fetching
```javascript
fetchPendingArticlesImproved()
```
Expected: Pending articles updated to "ready_for_processing" with full text

#### 3. Test Gemini Extraction
```javascript
testGeminiWithSheetData()
```
Expected: Crime data extracted with confidence score

#### 4. Test Geocoding
```javascript
testGeocoding()
```
Expected: Coordinates for Barbados locations

#### 5. Test Full Pipeline
```javascript
// Step 1: Collect feeds
collectAllFeeds()

// Step 2: Fetch article text
fetchPendingArticlesImproved()

// Step 3: Extract crime data
processReadyArticles()

// Step 4: Sync to LIVE
syncProductionToLive()
```

### Validation Checklist

- [ ] All 3 RSS feeds collecting articles
- [ ] Articles fetched with full text (200+ chars)
- [ ] Gemini extracting crime data (confidence ≥ 7)
- [ ] Geocoding producing valid coordinates
- [ ] Crimes appearing in Production sheet
- [ ] LIVE sheet updating automatically
- [ ] CSV URL accessible from browser
- [ ] No duplicate entries in LIVE sheet

---

## Key Configuration Values

### API Limits
- **Gemini:** 60 requests per minute (free tier)
- **Rate Limiting:** 1000ms between API calls
- **Max Articles Per Run:** 30
- **Execution Time Limit:** 4.5 minutes (270 seconds)

### Confidence Thresholds
- **High Confidence (≥7):** Auto-publish to Production
- **Low Confidence (3-6):** Send to Review Queue
- **Zero Confidence (0):** Not a crime article, discard

### Crime Types Supported
- Murder
- Shooting
- Robbery
- Assault
- Theft
- Home Invasion
- Sexual Assault
- Kidnapping
- Police-Involved Shooting
- Seizures (NEW: Added Nov 2025)

---

## Troubleshooting

### Problem: No articles collecting
**Solution:**
1. Check RSS feed URLs are correct
2. Verify `NEWS_SOURCES` in `config.gs` has `enabled: true`
3. Run `testRSSCollection()` manually to see errors

### Problem: Article text fetching fails
**Solution:**
1. Check execution log for HTTP errors
2. Verify URLs are accessible (try opening in browser)
3. Some news sites block automated requests - these will skip

### Problem: Gemini returning "API key not configured"
**Solution:**
1. Run `verifyApiKey()` - should return true
2. If false, run `setGeminiApiKey()` with your actual API key
3. Check Script Properties (Project Settings → Script Properties)

### Problem: Geocoding not finding locations
**Solution:**
1. Verify Geocoding API key is set
2. Check bounding box coordinates in `config.gs`
3. Review `BARBADOS_PARISHES` and `BARBADOS_AREAS` arrays
4. Some locations may be too vague (will use Bridgetown center as fallback)

### Problem: Duplicate crimes in LIVE sheet
**Solution:**
1. Duplicate detection runs during `syncProductionToLive()`
2. Check Production Archive - synced crimes should move there
3. Run `testSyncDryRun()` to preview what would sync

---

## Maintenance

### Weekly Tasks
- Review **Review Queue** sheet for low-confidence crimes
- Manually approve/edit crimes that need clarification
- Move approved crimes to Production sheet

### Monthly Tasks
- Check trigger execution logs for failures
- Review "fetch_failed" articles in Raw Articles
- Archive old crimes (>90 days) from Production to Production Archive

### API Usage Monitoring
- Monitor Gemini API quota (60 req/min)
- Check Geocoding API usage (free tier: 28,500 requests/month)
- Review execution logs for rate limit errors

---

## Security Notes

### API Keys
- **NEVER** commit API keys to version control
- Keys stored in Script Properties (encrypted by Google)
- Use separate keys for development vs production if possible

### Permissions
- Script requires: Sheets access, External URL access
- Authorization prompt appears first time running
- Review permissions before approving

### Data Privacy
- RSS feeds are public data sources
- Crime data extracted from published news articles
- LIVE sheet CSV is publicly accessible (by design)

---

## Next Steps

After completing setup:

1. **Monitor for 24 hours**
   - Let triggers run automatically
   - Check each sheet for new data
   - Verify no errors in execution logs

2. **Add to Frontend**
   - Update `src/js/data/countries.js` with Barbados entry
   - Add CSV URL from LIVE sheet
   - Create dashboard and headlines pages

3. **Test End-to-End**
   - Verify CSV data appears on website
   - Check crime statistics are accurate
   - Test date filtering and regional filtering

---

## Support & Documentation

### Related Files
- `config.gs` - All configuration settings
- `rssCollector.gs` - RSS feed collection
- `articleFetcherImproved.gs` - Article text extraction
- `geminiClient.gs` - AI crime data extraction
- `processor.gs` - Main processing pipeline
- `geocoder.gs` - Location geocoding
- `syncToLive.gs` - Production → LIVE sync

### Trinidad & Tobago Reference
- See `google-apps-script/trinidad/README.md` for detailed documentation
- Barbados automation follows same architecture
- Key differences: RSS feeds, geographic areas, bounding box

### Contact
For issues or questions: discover360news@gmail.com

---

**Last Updated:** December 4, 2025
**Version:** 1.0
**Status:** ✅ Ready for Deployment
