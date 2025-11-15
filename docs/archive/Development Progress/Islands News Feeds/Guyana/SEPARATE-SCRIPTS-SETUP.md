# Guyana Setup Guide - Separate Scripts Approach

## ✅ Architecture Overview

```
Trinidad Sheet                    Guyana Sheet
└── Apps Script                   └── Apps Script
    ├── config.gs (TT only)           ├── config.gs (GY only)
    ├── rssCollector.gs               ├── rssCollector.gs
    ├── geminiClient.gs               ├── geminiClient.gs
    ├── processor.gs                  ├── processor.gs
    ├── articleFetcher.gs             ├── articleFetcher.gs
    └── ... (all other files)         └── ... (all other files)

    Hourly Trigger                    Hourly Trigger
    (Collects TT feeds only)          (Collects GY feeds only)
```

**Benefits:**
- Trinidad stays UNTOUCHED (zero risk to working system)
- Complete isolation (Guyana issues don't affect Trinidad)
- Independent Gemini quotas (60 RPM each = 120 RPM total!)
- Simpler debugging (clear which country has issues)
- Can disable Guyana without affecting Trinidad

---

## 📋 Setup Steps

### **Step 1: Create Guyana Google Sheet**

1. Go to Google Drive
2. Create new Google Sheet
3. Name it: **"Crime Hotspots - Guyana Data"**
4. Create these sheets (tabs):
   - **Raw Articles**
   - **Production**
   - **Review Queue**
   - **Processing Queue**
   - **Archive**

5. **Add headers to "Raw Articles":**
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

6. **Add headers to "Production":**
   ```
   A: Date
   B: Headline
   C: Crime Type
   D: Street Address
   E: Area
   F: URL
   G: Source
   H: Confidence
   I: Extracted Data
   J: Processing Notes
   ```

---

### **Step 2: Open Guyana Apps Script**

1. In the Guyana sheet, click **Extensions → Apps Script**
2. You'll see a blank `Code.gs` file
3. Delete the default code

---

### **Step 3: Copy ALL Trinidad Script Files**

**IMPORTANT:** Copy ALL files from Trinidad Apps Script to Guyana Apps Script

**Files to copy:**
1. ✅ geminiClient.gs (no changes needed)
2. ✅ processor.gs (no changes needed)
3. ✅ articleFetcher.gs (no changes needed)
4. ✅ geocoder.gs (no changes needed - or update with Guyana locations)
5. ✅ validationHelpers.gs (no changes needed)
6. ✅ diagnostics.gs (no changes needed)
7. ✅ Any other `.gs` files you have

**Files to REPLACE:**
1. ❌ config.gs → Use `GUYANA-ONLY-config.gs` instead
2. ❌ rssCollector.gs → Use `GUYANA-ONLY-rssCollector.gs` instead

---

### **Step 4: Update Guyana-Specific Files**

#### **4a. Replace config.gs**

Delete the existing config.gs and paste content from:
**`GUYANA-ONLY-config.gs`**

This contains:
- 5 Guyana RSS feeds (Demerara Waves, INews, Kaieteur News, News Room, Guyana Times)
- Same Gemini API settings
- Same processing config

#### **4b. Replace rssCollector.gs**

Delete the existing rssCollector.gs and paste content from:
**`GUYANA-ONLY-rssCollector.gs`**

This is identical to Trinidad's collector, just references Guyana feeds.

---

### **Step 5: Set Up Gemini API Key**

1. In Guyana Apps Script, run: `setGeminiApiKey()`
2. First, edit the function and replace `YOUR_API_KEY_HERE` with your actual key
3. Click Run
4. Grant permissions when prompted
5. Verify with: `verifyApiKey()`

**Note:** You can use the SAME API key as Trinidad (they share quota) or create a separate one.

---

### **Step 6: Test Collection**

Run this in Apps Script:

```javascript
testRSSCollection()
```

**Expected Output:**
```
========== Starting Guyana RSS Collection Test ==========
✓ Demerara Waves: 12 articles found, 4 new collected, 0 filtered
✓ INews Guyana: 8 articles found, 3 new collected, 1 filtered
✓ Kaieteur News: 10 articles found, 5 new collected, 0 filtered
✓ News Room Guyana: 6 articles found, 2 new collected, 0 filtered
✓ Guyana Times: 5 articles found, 1 new collected, 0 filtered
─────────────────────────────
Summary: 41 total articles, 15 new articles collected
─────────────────────────────
✓ Test Complete: 15 articles collected
```

**Check:** Go to "Raw Articles" sheet and verify data appears.

---

### **Step 7: Set Up Hourly Trigger**

1. In Guyana Apps Script, click **Triggers** (clock icon)
2. Click **+ Add Trigger**
3. Settings:
   - Function: `collectAllFeeds`
   - Event source: **Time-driven**
   - Type: **Hour timer**
   - Interval: **Every hour**
4. Click **Save**

---

### **Step 8: Monitor Both Systems**

**Trinidad (unchanged):**
- Collects from: Newsday, CNC3, Express
- Writes to: Crime Hotspots - Automation Pipeline
- CSV: Already published

**Guyana (new):**
- Collects from: Demerara Waves, INews, Kaieteur, News Room, Guyana Times
- Writes to: Crime Hotspots - Guyana Data
- CSV: Publish Production sheet after 24-48 hours

---

## 🔧 Optional: Update Geocoder for Guyana

If you want location extraction, update `geocoder.gs`:

```javascript
// Add after Trinidad areas
const GUYANA_AREAS = [
  // Regions
  "Region 1", "Region 2", "Region 3", "Region 4", "Region 5",
  "Region 6", "Region 7", "Region 8", "Region 9", "Region 10",

  // Major Cities/Towns
  "Georgetown",
  "Linden",
  "New Amsterdam",
  "Anna Regina",
  "Bartica",
  "Lethem",

  // Geographic Areas
  "Berbice",
  "Demerara",
  "Essequibo",
  "East Coast Demerara",
  "West Coast Demerara",
  "East Bank Demerara",
  "West Bank Demerara",
  "Corentyne",
  "Upper Demerara-Berbice"
];

// Then update extractLocation to detect country
function extractLocation(text) {
  // Try Guyana areas first (since this script is Guyana-specific)
  for (const area of GUYANA_AREAS) {
    if (text.toLowerCase().includes(area.toLowerCase())) {
      return area;
    }
  }

  return '';
}
```

---

## 📊 Publishing Guyana CSV

After 24-48 hours of data collection:

1. Open "Crime Hotspots - Guyana Data"
2. Go to **Production** sheet
3. Click **File → Share → Publish to web**
4. Choose: **Production** sheet, **CSV** format
5. Click **Publish**
6. Copy the published URL
7. Update `src/js/data/countries.js` (already done! ✅)

---

## ✅ Verification Checklist

- [ ] Guyana sheet created with all 5 tabs
- [ ] Headers added to Raw Articles and Production
- [ ] All Trinidad script files copied to Guyana
- [ ] `GUYANA-ONLY-config.gs` replaces config.gs
- [ ] `GUYANA-ONLY-rssCollector.gs` replaces rssCollector.gs
- [ ] Gemini API key set with `setGeminiApiKey()`
- [ ] `testRSSCollection()` runs successfully
- [ ] Data appears in Raw Articles sheet
- [ ] Hourly trigger created
- [ ] Trinidad system still working (unchanged!)

---

## 🚨 Troubleshooting

**Issue: "Sheet 'Raw Articles' not found"**
- Solution: Create the sheet in Guyana spreadsheet

**Issue: "API key not set"**
- Solution: Run `setGeminiApiKey()` with your actual key

**Issue: "HTTP 403" on feeds**
- Solution: Some Guyana sites may block automated requests. Try again in 1 hour.

**Issue: Trinidad stopped working**
- Solution: You didn't touch Trinidad! Check if trigger is still active.

---

## 📈 Expected Performance

**Collection Rate:**
- 5 Guyana sources × ~10 articles/hour = ~50 articles/day
- After editorial filtering: ~40-45 articles/day
- After Gemini processing: ~30-35 crime-related articles/day

**API Usage:**
- Collection: Minimal (just RSS fetching)
- Processing: ~15 Gemini calls per run (4 runs/day = 60 calls/day)
- Well within free tier: 1,500 requests/day

---

## 🎯 Next Steps After Setup

1. Let it run for 24-48 hours
2. Check Production sheet for extracted crimes
3. Publish Production sheet as CSV
4. Frontend already configured for Guyana! ✅

Your site will automatically show Guyana data once the CSV is published.

---

**Files You Need:**
- ✅ `GUYANA-ONLY-config.gs` (for config.gs)
- ✅ `GUYANA-ONLY-rssCollector.gs` (for rssCollector.gs)
- ✅ All other files from Trinidad (unchanged)

**Trinidad Files to Copy (No Changes):**
- geminiClient.gs
- processor.gs
- articleFetcher.gs
- geocoder.gs (optional: add Guyana areas)
- validationHelpers.gs
- diagnostics.gs
- Any other `.gs` files

---

🇬🇾 **Guyana automation ready to go!**
