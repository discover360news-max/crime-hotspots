# Guyana Automation Setup Guide

## Overview
This guide shows you how to add Guyana crime data collection to your existing Google Apps Script automation.

---

## Step 1: Update config.md

Add Guyana sources to the `NEWS_SOURCES` array (around line 100):

```javascript
const NEWS_SOURCES = [
  // ===== TRINIDAD & TOBAGO =====
  {
    name: "Trinidad Newsday",
    country: "TT",
    rssUrl: "https://newsday.co.tt/feed",
    enabled: true,
    priority: 1,
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "home invasion"]
  },
  {
    name: "CNC3 News",
    country: "TT",
    rssUrl: "https://cnc3.co.tt/feed",
    enabled: true,
    priority: 1,
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "home invasion"]
  },
  {
    name: "Trinidad Express",
    country: "TT",
    rssUrl: "http://www.trinidadexpress.com/search/?f=rss&t=article&c=news&l=50&s=start_time&sd=desc",
    enabled: true,
    priority: 1,
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "home invasion"]
  },

  // ===== GUYANA =====
  {
    name: "Demerara Waves",
    country: "GY",
    rssUrl: "http://demerarawaves.com/feed/",
    enabled: true,
    priority: 1,
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "bandit", "robbery"]
  },
  {
    name: "INews Guyana",
    country: "GY",
    rssUrl: "http://www.inewsguyana.com/feed/",
    enabled: true,
    priority: 1,
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "bandit", "robbery"]
  },
  {
    name: "Kaieteur News",
    country: "GY",
    rssUrl: "http://www.kaieteurnewsonline.com/feed/",
    enabled: true,
    priority: 1,
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "bandit", "robbery"]
  },
  {
    name: "News Room Guyana",
    country: "GY",
    rssUrl: "http://newsroom.gy/feed/",
    enabled: true,
    priority: 1,
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "bandit", "robbery"]
  },
  {
    name: "Guyana Times",
    country: "GY",
    rssUrl: "http://www.guyanatimesgy.com/?feed=rss2",
    enabled: true,
    priority: 1,
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest", "bandit", "robbery"]
  }
];
```

**Note:** Added "bandit" and "robbery" to Guyana keywords as these are common terms in Guyanese crime reporting.

---

## Step 2: Add Sheet ID Configuration

Add this section to config.md (after `SHEET_NAMES` around line 89):

```javascript
// ============================================================================
// COUNTRY-SPECIFIC SHEET IDS
// ============================================================================

/**
 * Google Sheet IDs for each country
 * Replace these with your actual Sheet IDs from Google Sheets URLs
 */
const COUNTRY_SHEETS = {
  TT: 'YOUR_TRINIDAD_SHEET_ID_HERE',  // Replace with actual ID
  GY: 'YOUR_GUYANA_SHEET_ID_HERE'     // Replace with actual ID
};

/**
 * Get spreadsheet for a specific country
 * @param {string} countryCode - Two-letter country code (TT, GY, etc.)
 * @returns {Spreadsheet} Google Spreadsheet object
 */
function getCountrySpreadsheet(countryCode) {
  const sheetId = COUNTRY_SHEETS[countryCode];

  if (!sheetId || sheetId.includes('YOUR_')) {
    throw new Error(`Sheet ID not configured for country: ${countryCode}`);
  }

  return SpreadsheetApp.openById(sheetId);
}
```

---

## Step 3: Update rssCollector.gs

Replace the `collectAllFeeds()` function (starting around line 26):

```javascript
/**
 * Main function to collect from all enabled RSS feeds
 * Routes articles to country-specific sheets
 *
 * @returns {Object} Count of new articles by country
 */
function collectAllFeeds() {
  const results = {
    TT: { new: 0, total: 0, filtered: 0 },
    GY: { new: 0, total: 0, filtered: 0 }
  };

  // Group feeds by country
  const feedsByCountry = {};
  NEWS_SOURCES.forEach(feed => {
    if (!feed.enabled) {
      Logger.log(`⊘ ${feed.name}: Disabled, skipping`);
      return;
    }

    if (!feedsByCountry[feed.country]) {
      feedsByCountry[feed.country] = [];
    }
    feedsByCountry[feed.country].push(feed);
  });

  // Process each country's feeds
  Object.keys(feedsByCountry).forEach(countryCode => {
    Logger.log(`\n========== ${countryCode} ==========`);

    try {
      const ss = getCountrySpreadsheet(countryCode);
      const sheet = ss.getSheetByName(SHEET_NAMES.RAW_ARTICLES);

      if (!sheet) {
        Logger.log(`ERROR: Sheet "Raw Articles" not found in ${countryCode} spreadsheet!`);
        return;
      }

      feedsByCountry[countryCode].forEach(feed => {
        try {
          const articles = fetchAndParseFeed(feed);
          results[countryCode].total += articles.length;

          let collected = 0;
          let filtered = 0;

          articles.forEach(article => {
            // Filter out editorial/opinion content
            if (isEditorialContent(article)) {
              filtered++;
              return;
            }

            if (!isDuplicate(sheet, article.url)) {
              appendArticle(sheet, article, feed.name);
              collected++;
            }
          });

          results[countryCode].new += collected;
          results[countryCode].filtered += filtered;

          Logger.log(`✓ ${feed.name}: ${articles.length} articles found, ${collected} new collected, ${filtered} filtered`);

        } catch (error) {
          Logger.log(`✗ Error processing ${feed.name}: ${error.message}`);
        }
      });

    } catch (error) {
      Logger.log(`ERROR: Could not access ${countryCode} spreadsheet: ${error.message}`);
    }
  });

  // Summary
  Logger.log('\n========== SUMMARY ==========');
  Object.keys(results).forEach(country => {
    const r = results[country];
    Logger.log(`${country}: ${r.total} total, ${r.new} new, ${r.filtered} filtered`);
  });
  Logger.log('=============================\n');

  return results;
}
```

---

## Step 4: Create Guyana Google Sheet

1. **Create new Google Sheet** named: `Crime Hotspots - Guyana Data`

2. **Create these sheets** (tabs) within the spreadsheet:
   - Raw Articles
   - Production
   - Review Queue
   - Processing Queue
   - Archive

3. **Add headers to "Raw Articles" sheet:**
   ```
   Timestamp | Source | Title | URL | Full Text | Published Date | Status | Notes
   ```

4. **Add headers to "Production" sheet:**
   ```
   Date | Headline | Crime Type | Street Address | Area | URL | Source | Confidence | Extracted Data | Processing Notes
   ```

5. **Copy the Sheet ID:**
   - Look at the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - Copy the long ID between `/d/` and `/edit`
   - Paste it into `COUNTRY_SHEETS.GY` in config.md

---

## Step 5: Update Geocoder (Optional)

If you want location extraction for Guyana, update `geocoder.gs`:

```javascript
// Add Guyana regions/areas
const GUYANA_AREAS = [
  "Georgetown",
  "Berbice",
  "Demerara",
  "Essequibo",
  "Linden",
  "New Amsterdam",
  "Anna Regina",
  "Bartica",
  "Lethem",
  "Region 1", "Region 2", "Region 3", "Region 4", "Region 5",
  "Region 6", "Region 7", "Region 8", "Region 9", "Region 10"
];

// Update extractLocation function to handle both countries
function extractLocation(text, countryCode) {
  const areas = countryCode === 'GY' ? GUYANA_AREAS : TRINIDAD_AREAS;

  // ... rest of function
}
```

---

## Step 6: Test the Setup

1. **Verify API key is set:**
   ```javascript
   verifyApiKey()
   ```

2. **Test Guyana feed collection:**
   ```javascript
   // In Google Apps Script editor
   function testGuyanaCollection() {
     const results = collectAllFeeds();
     Logger.log(results);
   }
   ```

3. **Check the Guyana sheet:**
   - Open "Crime Hotspots - Guyana Data"
   - Check "Raw Articles" tab for new entries
   - Verify sources are labeled correctly

---

## Step 7: Set Up Triggers

The existing hourly trigger will now collect from **both** countries automatically.

No changes needed to triggers!

---

## Expected Behavior

**Hourly Trigger Runs:**
```
========== TT ==========
✓ Trinidad Newsday: 12 articles found, 3 new collected, 1 filtered
✓ CNC3 News: 8 articles found, 2 new collected, 0 filtered
✓ Trinidad Express: 15 articles found, 5 new collected, 2 filtered

========== GY ==========
✓ Demerara Waves: 10 articles found, 4 new collected, 0 filtered
✓ INews Guyana: 6 articles found, 2 new collected, 1 filtered
✓ Kaieteur News: 9 articles found, 3 new collected, 0 filtered
✓ News Room Guyana: 7 articles found, 2 new collected, 0 filtered
✓ Guyana Times: 5 articles found, 1 new collected, 0 filtered

========== SUMMARY ==========
TT: 35 total, 10 new, 3 filtered
GY: 37 total, 12 new, 1 filtered
=============================
```

---

## Important Notes

✅ **Same Gemini API quota** - Both countries share the same free tier limits (60 RPM)

✅ **Independent processing** - Each country has its own Production sheet and workflow

✅ **Same automation code** - No need to duplicate scripts, just add feeds and sheet IDs

⚠️ **Rate limits** - With 8 total feeds, collection should complete in ~30 seconds

⚠️ **CSV URLs** - After data starts flowing to Guyana Production sheet, publish it as CSV and update `countries.js`

---

## Quick Checklist

- [ ] Copy updated `NEWS_SOURCES` to config.md
- [ ] Add `COUNTRY_SHEETS` section to config.md
- [ ] Create "Crime Hotspots - Guyana Data" Google Sheet
- [ ] Add Sheet ID to `COUNTRY_SHEETS.GY`
- [ ] Update `collectAllFeeds()` in rssCollector.gs
- [ ] Test with `testGuyanaCollection()`
- [ ] Verify data appears in Guyana sheet
- [ ] Let automation run for 24-48 hours
- [ ] Publish Production sheet as CSV
- [ ] Update frontend CSV URL (already done!)

---

**Ready to go live with Guyana!** 🇬🇾
