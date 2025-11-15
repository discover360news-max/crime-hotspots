# Quick Start Guide
## Get Your Automated Pipeline Running in 2 Hours

**Goal:** Go from manual data entry to 75% automation in one afternoon
**Time Required:** 2-3 hours (basic setup)
**Technical Level:** Beginner-friendly (copy-paste scripts provided)

---

## Prerequisites (5 minutes)

Before starting, have these ready:

- [ ] Google account (Gmail)
- [ ] Your existing Google Sheets URL for crime data
- [ ] 2-3 hours of uninterrupted time
- [ ] Chrome or Firefox browser

**Optional but Recommended:**
- [ ] Second monitor (easier to follow instructions)
- [ ] Text editor (VS Code, Sublime, or even Notepad)

---

## Phase 1: Set Up Google Cloud & API Keys (20 minutes)

### Step 1: Create Google Cloud Project (5 min)

1. Go to: https://console.cloud.google.com/
2. Click **"Select a project"** → **"New Project"**
3. Name it: `Crime Hotspots Automation`
4. Click **"Create"**
5. Wait 30 seconds for project creation

### Step 2: Enable Gemini API (5 min)

1. In Cloud Console, search bar at top: type "Generative Language API"
2. Click the result
3. Click **"Enable"** button
4. Wait for confirmation (green checkmark)

### Step 3: Create API Key (5 min)

1. Left sidebar → **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the key (starts with `AIza...`)
4. Click **"Restrict Key"**
5. Under "API restrictions" → Select **"Generative Language API"**
6. Click **"Save"**

**IMPORTANT:** Save this key somewhere safe! You'll need it in 10 minutes.

### Step 4: Enable Geocoding API (5 min)

1. Search bar: type "Geocoding API"
2. Click result → Click **"Enable"**
3. Wait for confirmation
4. No new key needed (same key works for all Google APIs)

---

## Phase 2: Set Up Google Sheets (15 minutes)

### Step 1: Create Collection Sheet (5 min)

1. Go to: https://sheets.google.com
2. Click **"Blank"** to create new spreadsheet
3. Name it: `Crime Hotspots - Automation Pipeline`
4. Rename first tab to: `Raw Articles`
5. Add these headers in row 1:
   ```
   A: Timestamp
   B: Source
   C: Title
   D: URL
   E: Full Text
   F: Published Date
   G: Status
   H: Notes
   ```
6. Highlight row 1 → Right-click → **"Freeze"** → **"1 row"**

### Step 2: Create Additional Tabs (5 min)

**Tab 2: Production**
1. Click **+** at bottom to add new sheet
2. Name it: `Production`
3. Add headers:
   ```
   A: Date
   B: Headline
   C: Crime Type
   D: Street Address
   E: Location
   F: Area
   G: Island
   H: URL
   I: Latitude
   J: Longitude
   ```

**Tab 3: Review Queue**
1. Add another sheet
2. Name it: `Review Queue`
3. Copy headers from Production tab, plus add:
   ```
   K: Confidence Score
   L: Ambiguities
   M: Review Status
   N: Reviewer Notes
   ```

### Step 3: Note Sheet ID (5 min)

1. Look at your browser URL: `https://docs.google.com/spreadsheets/d/[SHEET-ID-HERE]/edit`
2. Copy the SHEET-ID part
3. Save it in a text file (you'll need it)

---

## Phase 3: Deploy Google Apps Script (45 minutes)

### Step 1: Open Script Editor (2 min)

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any code you see (it's just a placeholder)
3. Rename the project: `Crime Data Automation`

### Step 2: Create Configuration File (5 min)

1. In Apps Script editor, click **+** next to "Files"
2. Select "Script"
3. Name it: `config`
4. Paste this code:

```javascript
/**
 * Configuration - Store your API key here
 */

// Run this function ONCE after pasting your API key below
function setGeminiApiKey() {
  const apiKey = 'PASTE_YOUR_API_KEY_HERE'; // Replace with your actual key from earlier
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
  Logger.log('✅ API key saved securely');
}

function getGeminiApiKey() {
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
}

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const GEMINI_CONFIG = {
  temperature: 0.1,
  maxOutputTokens: 2048,
  topK: 1,
  topP: 1
};
```

5. Replace `PASTE_YOUR_API_KEY_HERE` with your actual API key from Phase 1
6. Click **Save** (disk icon)

### Step 3: Save API Key (3 min)

1. At top, select function: `setGeminiApiKey`
2. Click **Run** (play button)
3. First time: it will ask for permissions
   - Click **Review Permissions**
   - Choose your Google account
   - Click **Advanced** → **Go to Crime Data Automation (unsafe)**
   - Click **Allow**
4. Check **Execution log** (bottom): Should see "✅ API key saved securely"

### Step 4: Add RSS Collector (10 min)

1. Create new script file: `rssCollector`
2. Go to Implementation Guide (file `03-IMPLEMENTATION-GUIDE.md`)
3. Copy the entire `rssCollector.gs` code
4. Paste into your new file
5. Click **Save**

### Step 5: Add AI Extraction Code (10 min)

1. Create new script file: `geminiClient`
2. Copy `geminiClient.gs` code from Implementation Guide
3. Paste and **Save**

### Step 6: Add Processor Code (10 min)

1. Create new script file: `processor`
2. Copy `processor.gs` code from Implementation Guide
3. Paste and **Save**

### Step 7: Add Geocoder Code (5 min)

1. Create new script file: `geocoder`
2. Copy `geocoder.gs` code from Implementation Guide
3. Paste and **Save**

---

## Phase 4: Test Everything (30 minutes)

### Test 1: RSS Collection (5 min)

1. In Apps Script, select function: `testRSSCollection`
2. Click **Run**
3. Wait 10-30 seconds
4. Click **Execution log** → Should see "Collected X articles"
5. Go to your Google Sheet → Check "Raw Articles" tab
6. Should see 5-20 new rows with Trinidad Express, Newsday, etc.

**If it doesn't work:**
- Check RSS feed URLs are correct
- Check internet connection
- Try again (sometimes feeds are slow)

### Test 2: Article Text Fetching (5 min)

1. In Apps Script, select: `fetchPendingArticleText`
2. Click **Run**
3. Wait 20-60 seconds
4. Check "Raw Articles" sheet → Column E should have text
5. Column G (Status) should change from "pending" to "ready_for_processing"

### Test 3: AI Extraction (10 min)

1. Select function: `testGeminiExtraction`
2. Click **Run**
3. Wait 5-10 seconds
4. Check **Execution log** → Should see JSON output with extracted data

**Expected Output:**
```json
{
  "crime_date": "2025-11-02",
  "crime_type": "Murder",
  "area": "Brickfield",
  "headline": "Bar owner killed...",
  "confidence": 9
}
```

**If you see an error:**
- Check API key is saved: run `Logger.log(getGeminiApiKey())`
- Check Gemini API is enabled in Cloud Console
- Check API key restrictions allow "Generative Language API"

### Test 4: Full Processing Pipeline (10 min)

1. Select function: `processReadyArticles`
2. Click **Run**
3. Wait 1-2 minutes
4. Check **Production** sheet → Should have new rows!
5. Check **Review Queue** sheet → Low-confidence items go here

**Success Criteria:**
- At least 1 article in Production sheet
- Coordinates (lat/lng) populated
- Crime type looks correct
- Date is the crime date (not today's date)

---

## Phase 5: Automate with Triggers (20 minutes)

### Step 1: Create RSS Collection Trigger (5 min)

1. In Apps Script, click **Triggers** (clock icon on left)
2. Click **+ Add Trigger** (bottom right)
3. Configure:
   - Function: `collectAllFeeds`
   - Event source: **Time-driven**
   - Type: **Hour timer**
   - Hour interval: **Every 2 hours**
4. Click **Save**

### Step 2: Create Article Fetcher Trigger (5 min)

1. Click **+ Add Trigger** again
2. Configure:
   - Function: `fetchPendingArticleText`
   - Event source: **Time-driven**
   - Type: **Hour timer**
   - Hour interval: **Every hour**
3. Click **Save**

### Step 3: Create Processing Trigger (5 min)

1. Click **+ Add Trigger**
2. Configure:
   - Function: `processReadyArticles`
   - Event source: **Time-driven**
   - Type: **Hour timer**
   - Hour interval: **Every hour**
3. Click **Save**

### Step 4: Verify Triggers (5 min)

1. You should now see 3 triggers listed
2. All should show "Active" status
3. Check "Last run" in a few hours

**What happens now:**
- Every 2 hours: New articles collected from RSS feeds
- Every hour: Article full text fetched
- Every hour: AI processes articles and adds to your sheets

---

## Phase 6: Monitor First 24 Hours (Ongoing)

### Hour 2: Check Collection
- Open "Raw Articles" sheet
- Should have 5-20 articles
- All from Trinidad & Tobago sources

### Hour 3: Check Processing
- Column E (Full Text) should be populated
- Status changed to "ready_for_processing"

### Hour 4: Check Production
- "Production" sheet should have entries
- Verify dates, locations, crime types look correct

### Next Day: Review Quality
- Spot-check 5-10 articles
- Compare AI extraction to original article
- Adjust confidence threshold if needed (in `processor.gs`)

---

## Troubleshooting Common Issues

### Issue: No articles collected
**Possible causes:**
1. RSS feeds changed URLs
2. Internet connection issues
3. Script timeout

**Fix:**
1. Test each RSS feed in browser (paste URL, see if XML loads)
2. Run `testRSSCollection` manually
3. Check Execution log for errors

### Issue: API key error
**Error message:** "Gemini API key not configured"

**Fix:**
1. Run `setGeminiApiKey()` function again
2. Verify API key is correct (no extra spaces)
3. Check Gemini API is enabled in Cloud Console

### Issue: Geocoding not working
**Symptoms:** Latitude/Longitude columns empty

**Fix:**
1. Check Geocoding API is enabled
2. Test manually: run `testGeocoding()`
3. Verify address format includes "Trinidad and Tobago"

### Issue: Poor extraction quality
**Symptoms:** Wrong dates, incorrect crime types

**Fix:**
1. Review first 10 extractions
2. Identify patterns in errors
3. Adjust AI prompt in `geminiClient.gs`
4. Lower confidence threshold temporarily

---

## Next Steps After Setup

### Immediate (Today)
- [ ] Monitor first batch of articles
- [ ] Review "Review Queue" items
- [ ] Adjust confidence threshold if needed

### This Week
- [ ] Review 20+ auto-processed articles for accuracy
- [ ] Create list of common extraction errors
- [ ] Tune AI prompts based on errors
- [ ] Set up email notifications (optional)

### This Month
- [ ] Calculate time savings vs manual entry
- [ ] Document any edge cases found
- [ ] Consider adding Google Alerts (Tier 2 collection)
- [ ] Plan for second country (Guyana)

---

## Maintenance Schedule

### Daily (5 minutes)
- Check "Review Queue" for items needing manual review
- Approve/edit flagged items
- Move approved items to Production sheet

### Weekly (15 minutes)
- Spot-check 10 random articles for accuracy
- Review execution logs for errors
- Verify triggers are running

### Monthly (30 minutes)
- Review stats (articles collected, processed, accuracy %)
- Update RSS feed list (add/remove sources)
- Adjust confidence thresholds based on quality data

---

## Success Metrics

After 1 week, you should see:
- ✅ 200+ articles collected automatically
- ✅ 150+ articles auto-processed to production
- ✅ 50+ articles in review queue
- ✅ 90%+ accuracy on auto-processed items
- ✅ Time spent: ~2 hours/week vs 17 hours/week manual

After 1 month:
- ✅ 800+ articles in production sheet
- ✅ Consistent quality (95%+ accuracy)
- ✅ Time spent: ~30 min/week (just reviewing queue)
- ✅ Manual work reduced by 75-85%

---

## Getting Help

### Documentation
- Implementation Guide: `03-IMPLEMENTATION-GUIDE.md`
- Full workflow: `01-WORKFLOW-OVERVIEW.md`
- Multi-country scaling: `04-SCALABILITY-PLAN.md`

### Online Resources
- Google Apps Script docs: https://developers.google.com/apps-script
- Gemini API docs: https://ai.google.dev/docs
- Stack Overflow: Tag questions with `google-apps-script`

### Common Questions

**Q: Can I process more than Trinidad & Tobago?**
A: Yes! See `04-SCALABILITY-PLAN.md` for multi-country setup.

**Q: What if I hit API limits?**
A: Free tiers support 10+ countries easily. See `05-COST-ANALYSIS.md`.

**Q: How do I improve extraction accuracy?**
A: Adjust AI prompts in `geminiClient.gs` based on common errors.

**Q: Can I customize crime types?**
A: Yes! Edit the crime type list in the AI prompt.

**Q: How do I backup my data?**
A: Google Sheets auto-saves. Export CSV weekly for local backup.

---

## Congratulations!

You now have an automated crime data pipeline that:
- ✅ Monitors 5+ news sources 24/7
- ✅ Extracts structured data using AI
- ✅ Geocodes locations automatically
- ✅ Flags uncertain items for review
- ✅ Costs $0/month to operate
- ✅ Saves 15+ hours/week of manual work

**Next milestone:** Add a second country (Guyana) after this stabilizes!

---

## Quick Reference: Key Functions

Run these manually when needed:

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `testRSSCollection()` | Test RSS feed collection | Initial setup, troubleshooting |
| `testGeminiExtraction()` | Test AI extraction | Verify API working |
| `testGeocoding()` | Test geocoding | Verify Maps API working |
| `collectAllFeeds()` | Collect from all RSS feeds | Manual collection trigger |
| `processReadyArticles()` | Process pending articles | Force processing now |
| `fetchPendingArticleText()` | Fetch full article text | Get article bodies |

**Pro tip:** Bookmark these functions in Apps Script for quick access!
