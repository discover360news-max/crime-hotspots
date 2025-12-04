# Barbados Setup - Next Steps

**Created:** December 4, 2025
**Status:** Google Apps Script Files Ready (80% Complete)
**Time to Complete:** ~1-2 hours remaining

---

## ✅ Files Created (Ready to Use)

### Core Configuration
1. **config.gs** ✅
   - Barbados RSS feeds (3 sources)
   - 11 parishes defined
   - Major areas and landmarks
   - Bounding box coordinates (13.04-13.35°N, -59.42--59.65°W)
   - Bridgetown center point (13.1939°N, -59.5432°W)

2. **rssCollector.gs** ✅
   - Barbados Today, Nation News, Barbados Underground
   - Hourly collection
   - Editorial filtering
   - Duplicate detection

3. **articleFetcherImproved.gs** ✅
   - Copied from Trinidad (country-agnostic)
   - Intelligent content extraction
   - Sidebar filtering
   - No changes needed

4. **syncToLive.gs** ✅
   - Copied from Trinidad
   - Production → LIVE sync
   - Duplicate detection
   - Archiving logic

5. **README.md** ✅
   - Complete setup guide
   - Step-by-step instructions
   - Testing procedures
   - Troubleshooting tips

---

## ⏳ Files Needing Minor Adaptations (20% work)

### 6. geminiClient.gs
**Status:** Needs Barbados-specific prompt updates
**Changes Required:**
- Line 170: Change "Trinidad & Tobago" → "Barbados"
- Line 186: Change area examples to Barbados parishes
- Line 291: Update location examples
- Line 295: Change "Trinidad|Tobago" → "Barbados"

**Time:** 15 minutes (find & replace)

### 7. processor.gs
**Status:** Needs location filter update
**Changes Required:**
- Line 93: Change `!== 'Trinidad'` → `!== 'Barbados'`
- Comments referencing Trinidad

**Time:** 5 minutes

### 8. geocoder.gs
**Status:** Needs test address updates
**Changes Required:**
- Lines 86-90: Update test addresses to Barbados locations:
  ```javascript
  'Bridgetown, St. Michael, Barbados',
  'Holetown, St. James, Barbados',
  'Oistins, Christ Church, Barbados',
  'Speightstown, St. Peter, Barbados'
  ```

**Time:** 5 minutes

---

## 📝 Quick Adaptation Instructions

### Option 1: Manual Edit (Recommended)
1. Copy `trinidad/geminiClient.gs` to `barbados/geminiClient.gs`
2. Find and replace:
   - "Trinidad & Tobago" → "Barbados"
   - "Trinidad|Tobago" → "Barbados"
   - "Neighborhood (e.g., Maraval, Port of Spain)" → "Parish/Area (e.g., Bridgetown, St. Michael)"
   - Location examples to Barbados locations
3. Copy `trinidad/processor.gs` to `barbados/processor.gs`
4. Change line 93: `!== 'Trinidad'` → `!== 'Barbados'`
5. Copy `trinidad/geocoder.gs` to `barbados/geocoder.gs`
6. Update test addresses to Barbados locations

### Option 2: Automated (If you want me to do it)
I can create these 3 adapted files right now with all Barbados-specific changes applied.

---

## 🚀 After Scripts Are Complete

### Step 1: Create Google Sheet (30 minutes)
1. Go to [Google Sheets](https://sheets.google.com)
2. Create: "Crime Hotspots - Barbados"
3. Add 7 sheets:
   - Raw Articles
   - Processing Queue
   - Review Queue
   - Production
   - Production Archive
   - LIVE
   - Archive
4. Add headers (see README.md for exact format)
5. Publish LIVE sheet as CSV
6. Copy CSV URL

### Step 2: Deploy to Apps Script (20 minutes)
1. In Google Sheet: Extensions → Apps Script
2. Delete default Code.gs
3. Create 8 files:
   - config.gs
   - rssCollector.gs
   - articleFetcherImproved.gs
   - geminiClient.gs
   - processor.gs
   - geocoder.gs
   - syncToLive.gs
   - (optional) setupApiKey.gs
4. Paste code from each file
5. Save project

### Step 3: Configure API Key (5 minutes)
1. Edit `setGeminiApiKey()` function
2. Add your actual API key
3. Run function to save securely
4. Run `verifyApiKey()` to confirm

### Step 4: Test Automation (10 minutes)
1. Run `testRSSCollection()` - should collect articles
2. Run `fetchPendingArticlesImproved()` - should fetch full text
3. Run `testGeminiWithSheetData()` - should extract crime data
4. Check sheets for data

### Step 5: Create Triggers (10 minutes)
1. Click clock icon in Apps Script
2. Create 4 triggers:
   - `collectAllFeeds` - Hourly
   - `fetchPendingArticlesImproved` - Hourly
   - `processReadyArticles` - Hourly
   - `syncProductionToLive` - Daily at 2am

### Step 6: Monitor for 24 Hours
- Let automation run
- Check execution logs
- Verify data in sheets
- Should collect 20-30 articles

---

## Then: Frontend Integration

### Step 1: Update countries.js (5 minutes)
```javascript
{
  code: 'BB',
  name: 'Barbados',
  flag: '🇧🇧',
  csvUrl: 'YOUR_LIVE_SHEET_CSV_URL_HERE',
  dashboard: 'dashboard-barbados.html',
  headlines: 'headlines-barbados.html'
}
```

### Step 2: Create Dashboard Page (2 hours)
- Copy `dashboard-trinidad.html` → `dashboard-barbados.html`
- Update title, metadata
- Create `barbadosMap.js` (SVG regional map)
- Create `barbadosLeafletMap.js` (interactive map)
- Create `barbadosDataService.js`
- Create `dashboardBarbados.js`

### Step 3: Create Headlines Page (1 hour)
- Copy `headlines-trinidad.html` → `headlines-barbados.html`
- Update title, metadata
- Configure data source

### Step 4: Update Build Config (5 minutes)
```javascript
// vite.config.js
input: {
  // ... existing entries
  'dashboard-barbados': resolve(__dirname, 'dashboard-barbados.html'),
  'headlines-barbados': resolve(__dirname, 'headlines-barbados.html')
}
```

### Step 5: Build & Deploy (10 minutes)
```bash
npm run build
git add .
git commit -m "Add Barbados to Crime Hotspots platform"
git push origin main
```

Cloudflare Pages auto-deploys!

---

## Timeline Summary

### Automation (Remaining)
- ⏳ Adapt 3 script files: **25 minutes**
- ⏳ Create Google Sheet: **30 minutes**
- ⏳ Deploy to Apps Script: **20 minutes**
- ⏳ Configure & test: **25 minutes**
- ⏳ Monitor 24 hours: **passive**

**Total Backend:** ~1.5 hours active work

### Frontend
- ⏳ Update countries.js: **5 minutes**
- ⏳ Create dashboard page: **2 hours**
- ⏳ Create headlines page: **1 hour**
- ⏳ Update build config: **5 minutes**
- ⏳ Build & deploy: **10 minutes**

**Total Frontend:** ~3.5 hours

**Grand Total:** ~5 hours active work + 24 hours passive monitoring

---

## Current Status

```
✅ Research & Planning (Phase 1)         [████████████] 100%
✅ Core Google Apps Scripts (Phase 2)    [█████████░░░]  80%
⏳ Google Sheets Setup (Phase 3)         [░░░░░░░░░░░░]   0%
⏳ Frontend Integration (Phase 4-9)      [░░░░░░░░░░░░]   0%
⏳ Testing & Deployment (Phase 10-12)    [░░░░░░░░░░░░]   0%
```

**Overall Progress:** 30% Complete

---

## What Do You Want to Do Next?

### Option A: Finish Backend First ✅ RECOMMENDED
Complete all Google Apps Script files and get automation running before touching frontend.
- Advantage: Can collect 24 hours of real data before building dashboard
- Advantage: Verify data pipeline works end-to-end
- Time: 1.5 hours + 24 hour wait

### Option B: Finish Everything Now
Complete both backend and frontend in one session.
- Advantage: See full end-to-end result immediately
- Disadvantage: Dashboard will show empty data initially
- Time: 5 hours straight through

### Option C: Pause Here
Save current progress and continue later.
- Advantage: Break up work into smaller sessions
- Note: Easy resume point - just 3 files left to adapt

---

## Files Ready to Copy to Apps Script

When you create the Google Sheet and Apps Script project, you can copy these files directly:

1. ✅ config.gs (ready as-is)
2. ✅ rssCollector.gs (ready as-is)
3. ✅ articleFetcherImproved.gs (ready as-is)
4. ✅ syncToLive.gs (ready as-is, update LIVE_SHEET_ID after creating sheet)
5. ⏳ geminiClient.gs (needs Barbados adaptations)
6. ⏳ processor.gs (needs Barbados adaptations)
7. ⏳ geocoder.gs (needs Barbados adaptations)

---

**Need me to finish the last 3 files?** Just say "finish the remaining scripts" and I'll create the adapted versions right now.

**Ready to create the Google Sheet?** Follow the instructions in `README.md` - I've made it step-by-step.

**Want to pause?** All your work is saved and documented. Easy to pick up later.

---

**Last Updated:** December 4, 2025
**Next Session:** Complete geminiClient.gs, processor.gs, geocoder.gs adaptations (25 minutes)
