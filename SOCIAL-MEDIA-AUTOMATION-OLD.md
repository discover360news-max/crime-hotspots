# Social Media Automation - Zero Budget Solution

**Created:** December 12, 2025
**Status:** Ready for Implementation
**Budget:** $0/month

---

## 🎯 Goal

Automatically post crime statistics to social media (X/Twitter, Facebook, Instagram, WhatsApp) using data from Google Sheets. Generate visual stat cards and post daily without manual intervention.

---

## 📊 What Gets Posted

### Daily Posts (7 AM AST)
```
🚨 Trinidad Crime Update - Dec 12, 2025

📊 Last 24 Hours:
• Total Incidents: 12
• Murders: 2 ↓
• Robberies: 7 ↑
• Hotspot: Laventille

Full dashboard: https://crimehotspots.com/trinidad/dashboard

#TrinidadCrime #CaribbeanSafety #CrimeStats
```
**Includes:** Bar chart image with crime type breakdown

### Weekly Posts (Sunday 6 PM)
```
📈 Trinidad Weekly Crime Report

This Week vs Last Week:
• Total: 84 crimes (-5%)
• Murders: 12 (↔️ no change)
• Robberies: 31 (+15%)
• Top Area: Port of Spain

Read full analysis: [blog link]

#WeeklyCrimeStats #TrinidadSafety
```
**Includes:** Comparison chart image

### Monthly Posts (1st of Month)
```
🗓️ November 2025 Crime Summary

• Total Incidents: 342
• Deadliest Day: Nov 15 (8 murders)
• Safest Region: Tobago (12 total crimes)
• Crime Rate: -3% vs October

View trends: [dashboard link]
```
**Includes:** Multi-chart dashboard image

---

## 🛠️ Solution Options

### Option 1: Make.com (Recommended for Beginners)

**Pros:**
- ✅ Visual workflow builder (no coding)
- ✅ Built-in social media connectors
- ✅ Automatic OAuth handling
- ✅ Easy to modify and maintain
- ✅ Error handling and retry logic

**Cons:**
- ❌ Limited to 1,000 operations/month (still plenty)
- ❌ Less control than Apps Script

**Free Tier:**
- 1,000 operations/month = ~33/day
- Enough for 4-5 posts daily across platforms

**When to Use:** You want quick setup, visual workflows, easy maintenance

---

### Option 2: Google Apps Script (Recommended for Full Control)

**Pros:**
- ✅ 100% free, no limits
- ✅ Full control over logic
- ✅ Already integrated with your sheets
- ✅ Can reuse existing authentication
- ✅ Unlimited posts per month

**Cons:**
- ❌ Requires coding
- ❌ Manual OAuth setup for social platforms
- ❌ More setup time (8 hours vs 2 hours)

**When to Use:** You want full control, unlimited posts, all-in-one-place

---

## 🚀 Implementation Guide

### Make.com Approach

#### Step 1: Setup (30 minutes)

1. **Create Account**
   - Go to [make.com](https://www.make.com)
   - Sign up (free tier)
   - No credit card required

2. **Connect Google Sheets**
   - Dashboard → Connections → Add
   - Search "Google Sheets"
   - Authorize your Google account
   - Test connection

3. **Connect Social Platforms**
   - X (Twitter): Dashboard → Connections → Twitter → Authorize
   - Facebook: Dashboard → Connections → Facebook Pages → Authorize
   - Instagram: Dashboard → Connections → Instagram Business → Authorize

#### Step 2: Create Stats Sheet (15 minutes)

Create new sheet: **"Social Media Stats"**

| Date | Total Crimes | Murders | Robberies | Assaults | Top Area | Chart URL | Posted |
|------|-------------|---------|-----------|----------|----------|-----------|--------|
| 2025-12-12 | 12 | 2 | 7 | 3 | Laventille | [url] | ✅ |

**Auto-populate with Apps Script:**

```javascript
// Function to get the current date in the spreadsheet's timezone
function getDateInSpreadsheetTimezone(date) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const timezone = ss.getSpreadsheetTimeZone();
  return new Date(Utilities.formatDate(date, timezone, 'MM/dd/yyyy HH:mm:ss'));
}

function updateSocialStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodSheet = ss.getSheetByName('Source - Crime Data T_T (2025)');
  const statsSheet = ss.getSheetByName('Social Media Stats');

  const data = prodSheet.getDataRange().getValues();

  // Calculate stats for last 24 hours
  const today = getDateInSpreadsheetTimezone(new Date()); 
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const recentCrimes = data.filter(row => {
    const crimeDate = new Date(row[0]); // Column A = Date
    return crimeDate >= yesterday && crimeDate <= today;
  });

  const stats = {
    date: Utilities.formatDate(today, 'GMT-4', 'MM-dd-yyyy'),
    total: recentCrimes.length,
    murders: recentCrimes.filter(r => r[2] === 'Murder').length,
    robberies: recentCrimes.filter(r => r[2] === 'Robbery').length,
    burglaries: recentCrimes.filter(r => r[2] === 'Burglary').length,
    thefts: recentCrimes.filter(r => r[2] === 'Theft').length,
    homeInvasions: recentCrimes.filter(r => r[2] === 'Home Invasion').length,
    topArea: getMostFrequentArea(recentCrimes)
  };

  // Append to Social Media Stats sheet
  statsSheet.appendRow([
    stats.date,
    stats.total,
    stats.murders,
    stats.robberies,
    stats.burglaries,
    stats.thefts,
    stats.homeInvasions,
    stats.topArea,
    '', // Chart URL (generated by Make.com)
    'Pending'
  ]);
}

function getMostFrequentArea(crimes) {
  const areaCounts = {};
  crimes.forEach(crime => {
    const area = crime[5]; // Column F = Area
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });

  return Object.keys(areaCounts).reduce((a, b) =>
    areaCounts[a] > areaCounts[b] ? a : b
  );
}

// Run daily at 6 AM
function setupDailyTrigger() {
  ScriptApp.newTrigger('updateSocialStats')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
}
```

#### Step 3: Create Make.com Workflow (1 hour)

**Workflow Structure:**

```
1. Schedule (Daily 7 AM)
   ↓
2. Google Sheets: Get Latest Row (Social Media Stats)
   ↓
3. QuickChart: Generate Chart Image
   ↓
4. Text Formatter: Build Post Text
   ↓
5. Router (Split into 3 branches):
   ├─→ Twitter: Create Tweet with Media
   ├─→ Facebook: Create Page Post
   └─→ Instagram: Create Media Object
   ↓
6. Google Sheets: Update Row (mark as Posted)
```

**Module Configurations:**

**Module 1: Schedule**
- Type: Schedule
- Interval: Every day at 7:00 AM
- Timezone: America/Port_of_Spain (AST)

**Module 2: Google Sheets - Get Latest Row**
- Action: Search Rows
- Spreadsheet: Crime Hotspots Trinidad
- Sheet: Social Media Stats
- Filter: `Posted = "Pending"`
- Limit: 1
- Order: Date DESC

**Module 3: QuickChart - Generate Image**
- Action: HTTP Request
- URL: `https://quickchart.io/chart`
- Method: GET
- Query Parameters:
  ```
  c = {
    "type": "bar",
    "data": {
      "labels": ["Murders", "Robberies", "Assaults"],
      "datasets": [{
        "label": "Last 24 Hours",
        "data": [{{2.Murders}}, {{2.Robberies}}, {{2.Assaults}}],
        "backgroundColor": ["#e11d48", "#f97316", "#eab308"]
      }]
    },
    "options": {
      "title": {
        "display": true,
        "text": "Trinidad Crime Stats - {{2.Date}}",
        "fontSize": 20
      },
      "plugins": {
        "datalabels": {
          "display": true,
          "color": "white",
          "font": {"weight": "bold", "size": 16}
        }
      }
    }
  }
  width = 800
  height = 400
  backgroundColor = white
  ```

**Module 4: Text Formatter - Build Post**
- Action: Text
- Template:
  ```
  🚨 Trinidad Crime Update - {{formatDate(2.Date; "MMM DD, YYYY")}}

  📊 Last 24 Hours:
  • Total Incidents: {{2.Total Crimes}}
  • Murders: {{2.Murders}}
  • Robberies: {{2.Robberies}}
  • Hotspot: {{2.Top Area}}

  Full dashboard: https://crimehotspots.com/trinidad/dashboard

  #TrinidadCrime #CaribbeanSafety #CrimeStats
  ```

**Module 5a: Twitter - Create Tweet**
- Action: Create a Tweet
- Text: `{{4.output}}`
- Media: `{{3.url}}`

**Module 5b: Facebook - Create Post**
- Action: Create a Page Post
- Page: Crime Hotspots Caribbean
- Message: `{{4.output}}`
- Photo URL: `{{3.url}}`

**Module 5c: Instagram - Create Media**
- Action: Create Media Object
- Image URL: `{{3.url}}`
- Caption: `{{4.output}}`
- Publish: Yes

**Module 6: Google Sheets - Update Row**
- Action: Update a Row
- Row Number: `{{2.__rowNumber}}`
- Values:
  - Chart URL: `{{3.url}}`
  - Posted: `✅`

#### Step 4: Testing (30 minutes)

1. **Manual Test Run**
   - Make.com dashboard → Your scenario
   - Click "Run once"
   - Watch each module execute
   - Check for errors

2. **Verify Posts**
   - Check X/Twitter for post
   - Check Facebook page
   - Check Instagram feed

3. **Check Sheet Updates**
   - Verify "Posted" column marked ✅
   - Verify Chart URL saved

---

### Google Apps Script Approach

#### Complete Implementation

**File:** `socialMediaAutomation.gs`

```javascript
/**
 * Social Media Automation
 * Posts daily crime stats to X, Facebook, Instagram
 *
 * Setup:
 * 1. Set Script Properties (File → Project Properties → Script Properties):
 *    - TWITTER_API_KEY
 *    - TWITTER_API_SECRET
 *    - TWITTER_ACCESS_TOKEN
 *    - TWITTER_ACCESS_SECRET
 *    - FB_PAGE_ACCESS_TOKEN
 *    - FB_PAGE_ID
 *
 * 2. Create time-based trigger:
 *    - Function: dailySocialMediaPost
 *    - Time-based, Day timer, 7am-8am
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const SOCIAL_CONFIG = {
  QUICKCHART_URL: 'https://quickchart.io/chart',
  TWITTER_UPLOAD_URL: 'https://upload.twitter.com/1.1/media/upload.json',
  TWITTER_TWEET_URL: 'https://api.twitter.com/2/tweets',
  FB_GRAPH_URL: 'https://graph.facebook.com/v18.0',
  SHEET_NAME: 'Social Media Stats',
  TIMEZONE: 'GMT-4'
};

// ============================================================================
// MAIN POSTING FUNCTION
// ============================================================================

function dailySocialMediaPost() {
  Logger.log('=== STARTING DAILY SOCIAL MEDIA POST ===\n');

  try {
    // 1. Calculate stats
    const stats = calculateDailyStats();
    Logger.log(`Stats calculated: ${stats.total} crimes in last 24h`);

    // 2. Generate chart image
    const imageUrl = generateStatsChart(stats);
    Logger.log(`Chart generated: ${imageUrl.substring(0, 50)}...`);

    // 3. Build post text
    const postText = buildPostText(stats);
    Logger.log(`Post text: ${postText.substring(0, 100)}...`);

    // 4. Post to social platforms
    const results = {
      twitter: false,
      facebook: false
    };

    try {
      postToTwitter(postText, imageUrl);
      results.twitter = true;
      Logger.log('✅ Posted to Twitter');
    } catch (e) {
      Logger.log(`❌ Twitter failed: ${e.message}`);
    }

    try {
      postToFacebook(postText, imageUrl);
      results.facebook = true;
      Logger.log('✅ Posted to Facebook');
    } catch (e) {
      Logger.log(`❌ Facebook failed: ${e.message}`);
    }

    // 5. Log to sheet
    logToSheet(stats, imageUrl, results);
    Logger.log('✅ Logged to Social Media Stats sheet');

    Logger.log('\n=== SOCIAL MEDIA POST COMPLETE ===');

  } catch (error) {
    Logger.log(`❌ FATAL ERROR: ${error.message}`);
    sendErrorEmail(error);
  }
}

// ============================================================================
// STATS CALCULATION
// ============================================================================

function calculateDailyStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Production');
  const data = sheet.getDataRange().getValues();

  // Calculate for last 24 hours
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24*60*60*1000);

  const recentCrimes = data.slice(1).filter(row => {
    const crimeDate = new Date(row[0]); // Column A
    return crimeDate >= yesterday && crimeDate <= now;
  });

  return {
    date: Utilities.formatDate(now, SOCIAL_CONFIG.TIMEZONE, 'MMM dd, yyyy'),
    total: recentCrimes.length,
    murders: recentCrimes.filter(r => r[2] === 'Murder').length,
    robberies: recentCrimes.filter(r => r[2] === 'Robbery').length,
    assaults: recentCrimes.filter(r => r[2] === 'Assault').length,
    kidnapping: recentCrimes.filter(r => r[2] === 'Kidnapping').length,
    topArea: getMostFrequentArea(recentCrimes),
    trend: calculateTrend(recentCrimes, data)
  };
}

function getMostFrequentArea(crimes) {
  if (crimes.length === 0) return 'N/A';

  const areaCounts = {};
  crimes.forEach(crime => {
    const area = crime[5]; // Column F
    if (area) areaCounts[area] = (areaCounts[area] || 0) + 1;
  });

  return Object.keys(areaCounts).reduce((a, b) =>
    areaCounts[a] > areaCounts[b] ? a : b
  );
}

function calculateTrend(recentCrimes, allData) {
  // Compare last 24h to previous 24h
  const twoDaysAgo = new Date(Date.now() - 48*60*60*1000);
  const yesterday = new Date(Date.now() - 24*60*60*1000);

  const previousDayCrimes = allData.slice(1).filter(row => {
    const crimeDate = new Date(row[0]);
    return crimeDate >= twoDaysAgo && crimeDate < yesterday;
  });

  const currentCount = recentCrimes.length;
  const previousCount = previousDayCrimes.length;

  if (currentCount > previousCount) return '↑';
  if (currentCount < previousCount) return '↓';
  return '↔️';
}

// ============================================================================
// CHART GENERATION
// ============================================================================

function generateStatsChart(stats) {
  const chartConfig = {
    type: 'bar',
    data: {
      labels: ['Murders', 'Robberies', 'Assaults', 'Kidnapping'],
      datasets: [{
        label: 'Last 24 Hours',
        data: [stats.murders, stats.robberies, stats.assaults, stats.kidnapping],
        backgroundColor: ['#e11d48', '#f97316', '#eab308', '#06b6d4']
      }]
    },
    options: {
      title: {
        display: true,
        text: `Trinidad Crime Stats - ${stats.date}`,
        fontSize: 20,
        fontColor: '#1e293b',
        padding: 20
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true,
            stepSize: 1,
            fontSize: 14
          }
        }],
        xAxes: [{
          ticks: {
            fontSize: 14
          }
        }]
      },
      plugins: {
        datalabels: {
          display: true,
          color: 'white',
          font: {
            weight: 'bold',
            size: 16
          }
        }
      },
      legend: {
        display: false
      }
    }
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `${SOCIAL_CONFIG.QUICKCHART_URL}?c=${encodedConfig}&width=800&height=400&backgroundColor=white`;
}

// ============================================================================
// POST TEXT BUILDER
// ============================================================================

function buildPostText(stats) {
  return `🚨 Trinidad Crime Update - ${stats.date}

📊 Last 24 Hours:
• Total Incidents: ${stats.total} ${stats.trend}
• Murders: ${stats.murders}
• Robberies: ${stats.robberies}
• Assaults: ${stats.assaults}
• Hotspot: ${stats.topArea}

Full dashboard: https://crimehotspots.com/trinidad/dashboard

#TrinidadCrime #CaribbeanSafety #CrimeStats`;
}

// ============================================================================
// TWITTER POSTING
// ============================================================================

function postToTwitter(text, imageUrl) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('TWITTER_API_KEY');
  const apiSecret = PropertiesService.getScriptProperties().getProperty('TWITTER_API_SECRET');
  const accessToken = PropertiesService.getScriptProperties().getProperty('TWITTER_ACCESS_TOKEN');
  const accessSecret = PropertiesService.getScriptProperties().getProperty('TWITTER_ACCESS_SECRET');

  // Step 1: Download image
  const imageBlob = UrlFetchApp.fetch(imageUrl).getBlob();

  // Step 2: Upload media to Twitter
  const mediaId = uploadMediaToTwitter(imageBlob, apiKey, apiSecret, accessToken, accessSecret);

  // Step 3: Create tweet with media
  createTweetWithMedia(text, mediaId, accessToken);
}

function uploadMediaToTwitter(imageBlob, apiKey, apiSecret, accessToken, accessSecret) {
  const base64Image = Utilities.base64Encode(imageBlob.getBytes());

  const payload = {
    media_data: base64Image
  };

  const options = {
    method: 'post',
    payload: payload,
    headers: {
      'Authorization': getTwitterOAuthHeader(
        SOCIAL_CONFIG.TWITTER_UPLOAD_URL,
        'POST',
        apiKey,
        apiSecret,
        accessToken,
        accessSecret
      )
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(SOCIAL_CONFIG.TWITTER_UPLOAD_URL, options);
  const result = JSON.parse(response.getContentText());

  if (!result.media_id_string) {
    throw new Error(`Media upload failed: ${response.getContentText()}`);
  }

  return result.media_id_string;
}

function createTweetWithMedia(text, mediaId, accessToken) {
  const payload = {
    text: text,
    media: {
      media_ids: [mediaId]
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(SOCIAL_CONFIG.TWITTER_TWEET_URL, options);
  const result = JSON.parse(response.getContentText());

  if (result.errors) {
    throw new Error(`Tweet failed: ${JSON.stringify(result.errors)}`);
  }
}

function getTwitterOAuthHeader(url, method, apiKey, apiSecret, accessToken, accessSecret) {
  // OAuth 1.0a signature generation
  // This is a simplified version - use a proper OAuth library for production
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = Utilities.getUuid();

  const params = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0'
  };

  // Generate signature
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');

  const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;
  const signature = Utilities.base64Encode(
    Utilities.computeHmacSha1Signature(signatureBase, signingKey)
  );

  params.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(params)
    .sort()
    .map(key => `${key}="${encodeURIComponent(params[key])}"`)
    .join(', ');

  return authHeader;
}

// ============================================================================
// FACEBOOK POSTING
// ============================================================================

function postToFacebook(text, imageUrl) {
  const pageAccessToken = PropertiesService.getScriptProperties().getProperty('FB_PAGE_ACCESS_TOKEN');
  const pageId = PropertiesService.getScriptProperties().getProperty('FB_PAGE_ID');

  const fbUrl = `${SOCIAL_CONFIG.FB_GRAPH_URL}/${pageId}/photos`;

  const payload = {
    url: imageUrl,
    caption: text,
    access_token: pageAccessToken
  };

  const options = {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(fbUrl, options);
  const result = JSON.parse(response.getContentText());

  if (result.error) {
    throw new Error(`Facebook post failed: ${result.error.message}`);
  }
}

// ============================================================================
// LOGGING
// ============================================================================

function logToSheet(stats, imageUrl, results) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SOCIAL_CONFIG.SHEET_NAME);

  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const newSheet = ss.insertSheet(SOCIAL_CONFIG.SHEET_NAME);
    newSheet.appendRow([
      'Date',
      'Total Crimes',
      'Murders',
      'Robberies',
      'Assaults',
      'Top Area',
      'Chart URL',
      'Twitter',
      'Facebook',
      'Timestamp'
    ]);
    return logToSheet(stats, imageUrl, results);
  }

  sheet.appendRow([
    stats.date,
    stats.total,
    stats.murders,
    stats.robberies,
    stats.assaults,
    stats.topArea,
    imageUrl,
    results.twitter ? '✅' : '❌',
    results.facebook ? '✅' : '❌',
    new Date()
  ]);
}

function sendErrorEmail(error) {
  const recipient = 'your-email@example.com';
  const subject = '❌ Social Media Automation Failed';
  const body = `
    Social media posting failed at ${new Date().toLocaleString()}

    Error: ${error.message}
    Stack: ${error.stack}

    Please check the Apps Script logs for details.
  `;

  MailApp.sendEmail(recipient, subject, body);
}

// ============================================================================
// SETUP FUNCTIONS
// ============================================================================

function setupDailyTrigger() {
  // Delete existing triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'dailySocialMediaPost') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger for 7 AM daily
  ScriptApp.newTrigger('dailySocialMediaPost')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  Logger.log('✅ Daily trigger created for 7 AM');
}

function testSocialMediaPost() {
  Logger.log('Running test post...');
  dailySocialMediaPost();
}
```

#### Setup Instructions

**1. Get Twitter API Keys (Free)**
- Go to [developer.twitter.com](https://developer.twitter.com)
- Apply for Free Basic access
- Create app
- Generate API Key, API Secret, Access Token, Access Secret

**2. Get Facebook Page Access Token**
- Go to [developers.facebook.com](https://developers.facebook.com)
- Create app → Business Type
- Add "Pages" product
- Generate Page Access Token (never expires)

**3. Add Keys to Apps Script**
```
File → Project Properties → Script Properties → Add:

- TWITTER_API_KEY = [your key]
- TWITTER_API_SECRET = [your secret]
- TWITTER_ACCESS_TOKEN = [your token]
- TWITTER_ACCESS_SECRET = [your token secret]
- FB_PAGE_ACCESS_TOKEN = [your token]
- FB_PAGE_ID = [your page ID]
```

**4. Create Trigger**
```javascript
// Run this once
setupDailyTrigger();
```

**5. Test**
```javascript
// Run this to test
testSocialMediaPost();
```

---

## 📅 Recommended Posting Schedule

| Time | Post Type | Platforms | Content |
|------|-----------|-----------|---------|
| **7 AM** | Daily Stats | X, Facebook, Instagram | 24-hour crime summary with chart |
| **Sunday 6 PM** | Weekly Report | X, Facebook | Week-over-week comparison |
| **1st of Month** | Monthly Summary | All + WhatsApp | Full month statistics |
| **When Blog Posted** | Blog Promotion | All | New weekly report announcement |

---

## 🎨 Post Templates

### Template 1: Daily Stats (Mon-Sat)
```
🚨 Trinidad Crime Update - [Date]

📊 Last 24 Hours:
• Total Incidents: [X] [↑↓↔️]
• Murders: [X]
• Robberies: [X]
• Assaults: [X]
• Hotspot: [Area]

Full dashboard: https://crimehotspots.com/trinidad/dashboard

#TrinidadCrime #CaribbeanSafety #CrimeStats
```

### Template 2: Weekly Report (Sunday)
```
📈 Trinidad Weekly Crime Report

This Week vs Last Week:
• Total: [X] crimes ([+/- %])
• Murders: [X] ([↑↓↔️])
• Robberies: [X] ([↑↓↔️])
• Top Area: [Area]

Read full analysis: [blog link]

#WeeklyCrimeStats #TrinidadSafety #DataDriven
```

### Template 3: Monthly Summary (1st)
```
🗓️ [Month] 2025 Crime Summary

• Total Incidents: [X]
• Deadliest Day: [Date] ([X] murders)
• Safest Region: [Region] ([X] total)
• Crime Rate: [+/- %] vs [Previous Month]

View trends: https://crimehotspots.com/trinidad/dashboard

#MonthlyCrimeStats #Trinidad
```

---

## 🔍 Monitoring & Maintenance

### Daily Checks (2 minutes)
- [ ] Check if posts appeared on X/Twitter
- [ ] Check if posts appeared on Facebook
- [ ] Verify chart images loaded

### Weekly Review (10 minutes)
- [ ] Review Social Media Stats sheet
- [ ] Check for failed posts (❌ in columns)
- [ ] Verify engagement metrics
- [ ] Adjust posting times if needed

### Monthly Tasks (30 minutes)
- [ ] Review which posts performed best
- [ ] Update templates based on engagement
- [ ] Add new post types if desired
- [ ] Check API quotas/limits

---

## 📊 Success Metrics

**Track in Social Media Stats Sheet:**
- Posts per day: Target 1-2
- Success rate: >95%
- Failed posts: <5% (with auto-retry)

**Track on Social Platforms:**
- X engagement: likes, retweets, replies
- Facebook reach: impressions, shares
- Instagram: likes, saves, comments

---

## 🚨 Troubleshooting

### Common Issues

**"OAuth signature invalid" (Twitter)**
- Solution: Regenerate API keys
- Verify all 4 keys are correct
- Check system time is accurate

**"Page token expired" (Facebook)**
- Solution: Regenerate long-lived token
- Set it to never expire in settings

**"Chart not generating"**
- Solution: Check QuickChart URL length (<2000 chars)
- Verify data values are numbers, not text

**"Post text too long"**
- X limit: 280 characters
- Facebook: No limit
- Instagram: 2,200 characters
- Solution: Shorten main text, use link for details

---

## 💡 Future Enhancements

**Phase 2 (Month 2-3):**
- Instagram Stories automation
- WhatsApp Business API for channel posts
- Automatic hashtag generation based on content
- Post performance analytics dashboard

**Phase 3 (Month 4-6):**
- AI-generated post variations (test different copy)
- Auto-respond to common questions/comments
- Regional-specific posts (Port of Spain, San Fernando, etc.)
- Multi-language posts (English + Spanish)

**Phase 4 (Month 6+):**
- Video generation (animated charts)
- TikTok integration
- Cross-platform analytics dashboard
- Predictive posting (post when audience most active)

---

## 📞 Support Resources

**Make.com:**
- Help Center: [make.com/en/help](https://www.make.com/en/help)
- Community: [community.make.com](https://community.make.com)
- Templates: [make.com/en/templates](https://www.make.com/en/templates)

**Apps Script:**
- Documentation: [developers.google.com/apps-script](https://developers.google.com/apps-script)
- OAuth Guide: [developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)

**Social APIs:**
- Twitter API: [developer.twitter.com/docs](https://developer.twitter.com/en/docs)
- Facebook Graph: [developers.facebook.com/docs/graph-api](https://developers.facebook.com/docs/graph-api)
- Instagram API: [developers.facebook.com/docs/instagram-api](https://developers.facebook.com/docs/instagram-api)

---

## ✅ Pre-Launch Checklist

Before going live:

- [ ] Social Media Stats sheet created
- [ ] Daily stats calculation working
- [ ] QuickChart generating images correctly
- [ ] Test post to X/Twitter successful
- [ ] Test post to Facebook successful
- [ ] Triggers set up (7 AM daily)
- [ ] Error notifications configured
- [ ] Monitoring process established
- [ ] Backup plan if automation fails

---

**Next Steps:**
1. Choose approach (Make.com or Apps Script)
2. Set up accounts and credentials
3. Test with sample data
4. Go live with first post
5. Monitor and iterate

**Good luck!** 🚀
