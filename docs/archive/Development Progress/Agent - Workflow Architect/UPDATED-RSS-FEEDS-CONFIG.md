# UPDATED RSS FEEDS CONFIGURATION

**Date:** November 8, 2025
**Status:** Verified Working Feeds Only
**Sources:** 3 Active Trinidad & Tobago News Feeds

---

## ✅ CONFIRMED WORKING RSS FEEDS

### 1. Trinidad and Tobago Newsday
- **RSS URL:** `https://newsday.co.tt/feed`
- **Status:** ✅ WORKING
- **Update Frequency:** Active (last updated Nov 7, 2025)
- **Items per fetch:** 12 articles
- **Content Type:** General news (crime, government, business, culture, commentary)
- **Crime Coverage:** Yes - includes police reports, violence, shootings, robberies
- **Priority:** HIGH

**Sample Headlines:**
- "State agrees to disclose documents in police promotion lawsuits"
- "Tribunal rejects claims of delay in reviewing SoE detentions"
- Various local crime and law enforcement stories

---

### 2. CNC3 Television News
- **RSS URL:** `https://cnc3.co.tt/feed`
- **Status:** ✅ WORKING
- **Update Frequency:** Active (last updated Nov 8, 2025 02:48 UTC)
- **Items per fetch:** 10 articles
- **Content Type:** Breaking news, politics, crime, infrastructure, environment
- **Crime Coverage:** Yes - includes shootings, protests, investigations
- **Priority:** HIGH

**Sample Headlines:**
- "US kill three more in Caribbean airstrike" (drug trafficking)
- "Mt Hope nurses protest understaffing" (public safety)
- State of Emergency reviews and justice system coverage

---

### 3. Wired868 (Sports & Opinion)
- **RSS URL:** `https://wired868.com/feed`
- **Status:** ✅ WORKING
- **Update Frequency:** Active (last updated Nov 7, 2025)
- **Items per fetch:** 12 articles
- **Content Type:** Primarily sports news and political opinion
- **Crime Coverage:** Limited - focuses on sports, but includes some crime-related opinion pieces
- **Priority:** MEDIUM (supplementary source)

**Note:** Wired868 is strong for sports news and political commentary but less focused on daily crime reporting. Use as supplementary source only.

---

## ❌ NON-WORKING / UNAVAILABLE SOURCES

### Trinidad Express
- **URL:** https://trinidadexpress.com
- **RSS Status:** ❌ NO RSS FEED AVAILABLE
- **Alternative:** Use RSS generator service (RSS.app) or monitor manually
- **Recommendation:** Contact Trinidad Express to request RSS feed implementation

### Trinidad Guardian
- **URL:** https://www.guardian.co.tt
- **RSS URLs Tested:**
  - `https://www.guardian.co.tt/feed` - 404
  - `https://www.guardian.co.tt/rss` - 404
  - `https://www.guardian.co.tt/neo/NeoProxy.dll?app=NeoDirect&com=6/43/caa0c3d2e9` - HTML page (not XML)
- **Status:** ❌ NO VALID RSS FEED
- **Alternative:** Consider web scraping or monitor manually

### Loop TT
- **URL:** https://loop.tt
- **Status:** ❌ SITE SHUT DOWN
- **Note:** Loop has closed operations in the Caribbean

### Trinidad and Tobago News
- **URL:** https://trinidadandtobagonews.com
- **RSS Status:** ❌ 404 ERROR
- **Status:** Likely inactive or discontinued

---

## 📝 UPDATED GOOGLE APPS SCRIPT CONFIGURATION

Replace the `NEWS_SOURCES` configuration in your `config.gs` file with this:

```javascript
// config.gs - UPDATED WITH WORKING FEEDS ONLY

const NEWS_SOURCES = [
  {
    name: "Trinidad Newsday",
    country: "TT",
    rssUrl: "https://newsday.co.tt/feed",
    enabled: true,
    priority: 1, // Highest priority
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang"]
  },
  {
    name: "CNC3 News",
    country: "TT",
    rssUrl: "https://cnc3.co.tt/feed",
    enabled: true,
    priority: 1, // Highest priority
    crimeKeywords: ["murder", "shoot", "rob", "assault", "kill", "crime", "police", "victim", "attack", "gang", "arrest"]
  },
  {
    name: "Wired868",
    country: "TT",
    rssUrl: "https://wired868.com/feed",
    enabled: true,
    priority: 3, // Lower priority (supplementary)
    crimeKeywords: ["crime", "violence", "police", "corruption", "murder"]
  }
];
```

---

## 🔧 CONFIGURATION PARAMETERS EXPLAINED

### Priority Levels
- **1 = Highest** - Check every 2 hours, always process crime-related articles
- **2 = High** - Check every 4 hours, process most crime articles
- **3 = Medium** - Check every 6 hours, selective processing
- **4 = Low** - Check daily, minimal processing

### Crime Keywords
These trigger article processing. Articles matching keywords get:
- Higher priority in processing queue
- Immediate AI extraction attempt
- Flagged for quality review

**Current keyword set:**
- `murder`, `shoot`, `rob`, `assault`, `kill`
- `crime`, `police`, `victim`, `attack`, `gang`
- `arrest`, `violence`, `corruption`

---

## 📊 EXPECTED PERFORMANCE

### Daily Article Volume (Estimated)

| Source | Articles/Day | Crime Stories/Day | Processing Time |
|--------|--------------|-------------------|-----------------|
| Newsday | 10-15 | 3-5 | 15-25 min |
| CNC3 | 8-12 | 2-4 | 12-18 min |
| Wired868 | 5-8 | 0-2 | 5-10 min |
| **TOTAL** | **23-35** | **5-11** | **32-53 min/day** |

### Resource Usage

**Google Apps Script Runtime:**
- Estimated: 32-53 minutes/day
- Quota: 90 minutes/day
- Headroom: 37-58 minutes (41-64%)

**Gemini API Calls:**
- Estimated: 5-11 extractions/day
- Quota: 1,500 requests/day
- Usage: 0.33-0.73%

---

## 🚀 NEXT STEPS

### 1. Update Your Apps Script
1. Open your Google Apps Script project
2. Open `config.gs`
3. Replace `NEWS_SOURCES` array with the updated config above
4. Save and deploy

### 2. Test the Updated Feeds
```javascript
// Run this in Apps Script to test
function testUpdatedFeeds() {
  Logger.log("Testing updated RSS feeds...");

  NEWS_SOURCES.forEach(source => {
    if (source.enabled) {
      try {
        const xml = UrlFetchApp.fetch(source.rssUrl);
        const doc = XmlService.parse(xml.getContentText());
        const items = doc.getRootElement().getChild('channel').getChildren('item');

        Logger.log(`✅ ${source.name}: ${items.length} items found`);
      } catch (error) {
        Logger.log(`❌ ${source.name}: ERROR - ${error}`);
      }
    }
  });
}
```

### 3. Monitor First 24 Hours
- Check "Raw Articles" sheet for incoming articles
- Verify crime keyword matching is working
- Review AI extraction accuracy
- Adjust keywords if needed

---

## 🔄 FUTURE EXPANSION OPTIONS

### Option 1: Add RSS Generator for Trinidad Express
- Use RSS.app or similar service to create custom feed
- Cost: Free tier available
- URL: https://rss.app/en/rss-feed/trinidad-express-newspapers-rss-feed

### Option 2: Web Scraping for Guardian
- Use Google Apps Script UrlFetchApp to fetch HTML
- Parse HTML with XmlService or regex
- Extract article links and titles
- More complex but doable

### Option 3: Monitor Other Caribbean Sources
Once Trinidad & Tobago is stable, add:
- Jamaica: RJR News, Jamaica Observer, Jamaica Gleaner
- Barbados: Barbados Today, Nation News
- Guyana: Stabroek News, Kaieteur News

---

## ⚠️ IMPORTANT NOTES

1. **Feed Reliability:** All 3 feeds were tested and confirmed working on Nov 8, 2025
2. **Update Frequency:** News sites may change RSS URLs without notice - monitor for errors
3. **Keyword Tuning:** Current keywords are broad - refine based on actual results
4. **Crime Coverage:** Newsday and CNC3 provide best daily crime coverage
5. **Wired868 Role:** Use for opinion pieces and analytical content, not breaking crime news

---

## 📞 TROUBLESHOOTING

### If a feed stops working:
1. Check if URL is still accessible in browser
2. Test with `testUpdatedFeeds()` function
3. Check Apps Script execution logs
4. Try clearing UrlFetchApp cache
5. Contact news source if feed permanently removed

### If no articles are being collected:
1. Verify triggers are running (Apps Script → Triggers)
2. Check quota usage hasn't exceeded limits
3. Review execution logs for errors
4. Test each feed individually

### If AI extraction is poor:
1. Review prompt in `geminiClient.gs`
2. Adjust confidence threshold in `processor.gs`
3. Add more training examples to prompt
4. Consider using Gemini 1.5 Pro instead of Flash

---

## 📈 SUCCESS METRICS

After 1 week of operation, you should see:

- ✅ 35-75 crime articles collected automatically
- ✅ 5-11 high-confidence extractions per day
- ✅ 75-85% automation rate
- ✅ Less than 2 hours/week manual work
- ✅ Zero API costs

If you're not hitting these metrics, review the troubleshooting section or adjust configuration.

---

**Last Updated:** November 8, 2025
**Verified By:** Claude (Workflow Architect Agent)
**Next Review:** December 8, 2025 (or when feeds change)
