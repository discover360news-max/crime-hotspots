# Implementation Guide: Automated Crime Data Pipeline
## Step-by-Step Setup Instructions

**Estimated Setup Time:** 4-6 hours
**Technical Level:** Intermediate (JavaScript/Google Sheets experience helpful)
**Cost:** $0

---

## Prerequisites

Before starting, ensure you have:
- [ ] Google account (for Apps Script, Sheets, Gmail)
- [ ] Google Cloud project (free - for Gemini API access)
- [ ] Basic understanding of Google Sheets
- [ ] Text editor for editing scripts

---

## Phase 1: Google Sheets Setup (30 minutes)

### Step 1.1: Create Raw Articles Collection Sheet

1. Open Google Sheets: https://sheets.google.com
2. Create new spreadsheet: "Crime Hotspots - Raw Articles"
3. Set up columns:

```
Column A: Timestamp (auto-generated)
Column B: Source (e.g., "Trinidad Express RSS")
Column C: Article Title
Column D: Article URL
Column E: Article Full Text
Column F: Published Date
Column G: Processed Status ("pending", "processing", "completed", "failed")
Column H: Processing Notes
```

4. Freeze header row (View → Freeze → 1 row)
5. Note the Sheet ID from URL: `https://docs.google.com/spreadsheets/d/[THIS-IS-SHEET-ID]/edit`

### Step 1.2: Create Processing Queue Sheet

In the same spreadsheet, add a new tab called "Processing Queue":

```
Column A: Raw Article Row Number (reference to Raw Articles sheet)
Column B: Article URL
Column C: Priority (1-5, based on keywords)
Column D: Retry Count
Column E: Last Attempt
Column F: Status
```

### Step 1.3: Create Production Sheet (Or Use Existing)

Option A: Use your existing production sheet
- URL: https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/edit

Option B: Create separate testing sheet first
- Duplicate your current sheet structure
- Test automation on duplicate before going live

### Step 1.4: Create Review Queue Sheet

Add another tab called "Review Queue":

```
Columns (same as production sheet, plus):
Column L: Confidence Score (1-10)
Column M: Ambiguities (what needs human review)
Column N: Review Status ("pending", "approved", "rejected")
Column O: Reviewer Notes
```

---

## Phase 2: Google Cloud & Gemini API Setup (15 minutes)

### Step 2.1: Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Click "Create Project"
3. Name it: "Crime Hotspots Automation"
4. Click "Create"

### Step 2.2: Enable Gemini API

1. In Google Cloud Console, go to "APIs & Services"
2. Click "Enable APIs and Services"
3. Search for "Generative Language API" (Gemini)
4. Click "Enable"

### Step 2.3: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key (starts with `AIza...`)
4. Click "Restrict Key":
   - API restrictions: Select "Generative Language API"
   - Save
5. Store key securely (you'll add to Apps Script later)

**Important:** Keep this key secret. Don't commit to GitHub or share publicly.

---

## Phase 3: RSS Feed Collection Setup (45 minutes)

### Step 3.1: Create Google Apps Script Project

1. Open your "Raw Articles" Google Sheet
2. Click Extensions → Apps Script
3. Name the project: "Crime Data Collector"

### Step 3.2: Add RSS Parser Script

Create a new file called `rssCollector.gs`:

```javascript
/**
 * RSS Feed Collector for Trinidad & Tobago Crime News
 * Runs hourly via time-based trigger
 */

// Configuration
const RSS_FEEDS = [
  {
    name: 'Trinidad Express',
    url: 'https://trinidadexpress.com/rss/',
    keywords: ['murder', 'kill', 'shot', 'shooting', 'robbery', 'assault', 'crime']
  },
  {
    name: 'Newsday',
    url: 'https://newsday.co.tt/feed/',
    keywords: ['murder', 'kill', 'shot', 'shooting', 'robbery', 'assault', 'crime']
  },
  {
    name: 'CNC3',
    url: 'https://www.cnc3.co.tt/feed/',
    keywords: ['murder', 'kill', 'shot', 'shooting', 'robbery', 'assault', 'crime']
  },
  {
    name: 'Guardian',
    url: 'https://guardian.co.tt/feed',
    keywords: ['murder', 'kill', 'shot', 'shooting', 'robbery', 'assault', 'crime']
  },
  {
    name: 'Loop TT',
    url: 'https://tt.loopnews.com/rss',
    keywords: ['murder', 'kill', 'shot', 'shooting', 'robbery', 'assault', 'crime']
  }
];

const SHEET_NAME = 'Raw Articles';

/**
 * Main function to collect from all RSS feeds
 */
function collectAllFeeds() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  let newArticlesCount = 0;

  RSS_FEEDS.forEach(feed => {
    try {
      const articles = fetchAndParseFeed(feed);
      articles.forEach(article => {
        if (shouldCollectArticle(article, feed.keywords) && !isDuplicate(sheet, article.url)) {
          appendArticle(sheet, article, feed.name);
          newArticlesCount++;
        }
      });
    } catch (error) {
      Logger.log(`Error processing ${feed.name}: ${error.message}`);
    }
  });

  Logger.log(`Collected ${newArticlesCount} new articles`);
  return newArticlesCount;
}

/**
 * Fetch and parse RSS feed
 */
function fetchAndParseFeed(feed) {
  const response = UrlFetchApp.fetch(feed.url, {muteHttpExceptions: true});

  if (response.getResponseCode() !== 200) {
    throw new Error(`HTTP ${response.getResponseCode()} from ${feed.name}`);
  }

  const xml = XmlService.parse(response.getContentText());
  const root = xml.getRootElement();

  // Handle both RSS and Atom formats
  const namespace = root.getNamespace();
  const items = root.getChild('channel', namespace).getChildren('item', namespace);

  return items.map(item => {
    return {
      title: getChildText(item, 'title', namespace),
      url: getChildText(item, 'link', namespace),
      description: getChildText(item, 'description', namespace) || '',
      pubDate: getChildText(item, 'pubDate', namespace),
      fullText: '' // Will be fetched later if needed
    };
  });
}

/**
 * Helper to safely get child element text
 */
function getChildText(element, childName, namespace) {
  const child = element.getChild(childName, namespace);
  return child ? child.getText() : '';
}

/**
 * Check if article matches crime keywords
 */
function shouldCollectArticle(article, keywords) {
  const searchText = (article.title + ' ' + article.description).toLowerCase();
  return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
}

/**
 * Check for duplicate URLs
 */
function isDuplicate(sheet, url) {
  const dataRange = sheet.getRange(2, 4, sheet.getLastRow() - 1, 1); // Column D (URLs)
  const urls = dataRange.getValues().flat();
  return urls.includes(url);
}

/**
 * Append article to sheet
 */
function appendArticle(sheet, article, sourceName) {
  sheet.appendRow([
    new Date(),                    // Timestamp
    sourceName,                    // Source
    article.title,                 // Title
    article.url,                   // URL
    article.description,           // Full Text (description for now)
    article.pubDate,               // Published Date
    'pending',                     // Status
    ''                             // Notes
  ]);
}

/**
 * Test function (run manually first to verify)
 */
function testRSSCollection() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  Logger.log('Starting test collection...');
  const count = collectAllFeeds();
  Logger.log(`Test complete: ${count} articles collected`);
}
```

### Step 3.3: Set Up Time-Based Trigger

1. In Apps Script, click Triggers icon (clock icon on left sidebar)
2. Click "Add Trigger"
3. Configure:
   - Function: `collectAllFeeds`
   - Event source: "Time-driven"
   - Type: "Hour timer"
   - Hour interval: "Every 2 hours"
4. Click "Save"
5. Authorize the script when prompted

### Step 3.4: Test RSS Collection

1. In Apps Script editor, select `testRSSCollection` from function dropdown
2. Click "Run"
3. Check Execution log (View → Logs)
4. Verify articles appear in "Raw Articles" sheet

**Expected Result:** 5-20 new articles collected (depending on recent crime news)

---

## Phase 4: Article Full Text Fetcher (30 minutes)

Many RSS feeds only provide summaries. We need full article text for AI extraction.

### Step 4.1: Add Full Text Fetcher

Create new file `articleFetcher.gs`:

```javascript
/**
 * Fetch full article text from URLs
 * Runs on articles with status="pending"
 */

const RAW_ARTICLES_SHEET = 'Raw Articles';

/**
 * Main function to fetch full text for pending articles
 */
function fetchPendingArticleText() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RAW_ARTICLES_SHEET);
  const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8);
  const data = dataRange.getValues();

  let fetchedCount = 0;
  const maxPerRun = 10; // Limit to avoid timeout

  for (let i = 0; i < data.length && fetchedCount < maxPerRun; i++) {
    const row = data[i];
    const status = row[6]; // Column G
    const url = row[3]; // Column D

    if (status === 'pending') {
      try {
        const fullText = fetchArticleContent(url);
        if (fullText) {
          // Update Column E (Full Text) and Column G (Status)
          sheet.getRange(i + 2, 5).setValue(fullText);
          sheet.getRange(i + 2, 7).setValue('ready_for_processing');
          fetchedCount++;
        }
      } catch (error) {
        Logger.log(`Error fetching ${url}: ${error.message}`);
        sheet.getRange(i + 2, 8).setValue(`Fetch error: ${error.message}`);
      }

      // Rate limiting: wait 2 seconds between requests
      Utilities.sleep(2000);
    }
  }

  Logger.log(`Fetched full text for ${fetchedCount} articles`);
}

/**
 * Fetch article content from URL
 * Uses simple HTML parsing (works for most news sites)
 */
function fetchArticleContent(url) {
  try {
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Crime Hotspots Data Collector (Educational Project)'
      }
    });

    if (response.getResponseCode() !== 200) {
      return null;
    }

    const html = response.getContentText();

    // Basic HTML cleaning (remove tags, keep text)
    // This is a simple approach - may need refinement per news site
    let text = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>.*?<\/style>/gi, '')   // Remove styles
      .replace(/<[^>]+>/g, ' ')                     // Remove HTML tags
      .replace(/\s+/g, ' ')                         // Collapse whitespace
      .trim();

    // Extract main content (heuristic: find largest text block)
    // For better results, use site-specific selectors
    return text.substring(0, 5000); // Limit to 5000 chars

  } catch (error) {
    Logger.log(`Failed to fetch ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Test function
 */
function testArticleFetch() {
  const testUrl = 'https://trinidadexpress.com/news/local/example-article';
  const content = fetchArticleContent(testUrl);
  Logger.log(`Fetched ${content ? content.length : 0} characters`);
}
```

### Step 4.2: Set Up Trigger for Article Fetcher

1. Add new trigger for `fetchPendingArticleText`
2. Event source: "Time-driven"
3. Type: "Hour timer"
4. Interval: "Every hour"
5. Save

**Note:** This runs separately from RSS collection to avoid timeout issues.

---

## Phase 5: AI Extraction Pipeline (90 minutes)

This is the core automation - using Google Gemini to extract structured crime data.

### Step 5.1: Add Gemini API Configuration

Create new file `config.gs`:

```javascript
/**
 * Configuration file
 * IMPORTANT: Keep this secure
 */

// Get API key from Script Properties (more secure than hardcoding)
function getGeminiApiKey() {
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
}

// Set API key (run once manually)
function setGeminiApiKey() {
  const apiKey = 'YOUR_API_KEY_HERE'; // Replace with your actual key
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
  Logger.log('API key saved securely');
}

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const GEMINI_CONFIG = {
  temperature: 0.1, // Low temperature for factual extraction
  maxOutputTokens: 2048,
  topK: 1,
  topP: 1
};
```

### Step 5.2: Add Gemini API Client

Create new file `geminiClient.gs`:

```javascript
/**
 * Google Gemini API client for crime data extraction
 */

/**
 * Extract crime data from article text using Gemini
 */
function extractCrimeData(articleText, articleTitle, articleUrl) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key not configured. Run setGeminiApiKey() first.');
  }

  const prompt = buildExtractionPrompt(articleText, articleTitle);

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: GEMINI_CONFIG
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, options);
  const responseData = JSON.parse(response.getContentText());

  if (responseData.error) {
    throw new Error(`Gemini API error: ${responseData.error.message}`);
  }

  // Extract JSON from response
  const generatedText = responseData.candidates[0].content.parts[0].text;
  return parseGeminiResponse(generatedText, articleUrl);
}

/**
 * Build extraction prompt
 */
function buildExtractionPrompt(articleText, articleTitle) {
  return `You are a data extraction specialist for Trinidad & Tobago crime news.

Extract structured crime information from this article:

TITLE: ${articleTitle}

ARTICLE TEXT:
${articleText}

Extract the following information and respond ONLY with valid JSON:

{
  "crime_date": "YYYY-MM-DD format - the actual date the crime occurred (NOT the article publication date)",
  "crime_type": "One of: Murder|Shooting|Robbery|Assault|Theft|Home Invasion|Sexual Assault|Kidnapping|Domestic Violence|Other",
  "area": "Neighborhood or district in Trinidad & Tobago (e.g., 'San Juan', 'Port of Spain')",
  "street": "Specific street address or location description",
  "headline": "Concise headline under 100 characters, include victim name and age in parentheses if available",
  "details": "2-3 sentence summary of the incident",
  "victims": [
    {
      "name": "Full name",
      "age": "Age as number or null",
      "aliases": ["Any known aliases"]
    }
  ],
  "confidence": 1-10 (how certain you are about the extracted data),
  "ambiguities": ["List anything unclear or missing that needs human review"]
}

EXTRACTION RULES:
1. Crime date: Look for phrases like "on Monday", "last Saturday", "November 2". Calculate actual date based on context.
2. If crime date is ambiguous, use article publication date and set confidence lower.
3. Crime type: Choose the MOST SERIOUS crime mentioned (e.g., if shooting led to murder, choose "Murder").
4. Area: Use the smallest specific location (neighborhood > district > city).
5. Victims: Include all named victims. Use null for unknown ages.
6. Confidence: 9-10 = all key data clear, 7-8 = minor ambiguities, 4-6 = significant gaps, 1-3 = very unclear.
7. If not a crime article, return {"confidence": 0, "ambiguities": ["Not a crime article"]}.

Respond with ONLY the JSON object, no additional text.`;
}

/**
 * Parse Gemini response and handle malformed JSON
 */
function parseGeminiResponse(responseText, articleUrl) {
  try {
    // Remove markdown code blocks if present
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const extracted = JSON.parse(cleanJson);
    extracted.source_url = articleUrl;
    return extracted;

  } catch (error) {
    Logger.log(`Failed to parse Gemini response: ${responseText}`);
    return {
      confidence: 0,
      ambiguities: [`JSON parse error: ${error.message}`],
      source_url: articleUrl,
      raw_response: responseText
    };
  }
}

/**
 * Test extraction with sample article
 */
function testGeminiExtraction() {
  const sampleText = `A 58-year-old bar owner was shot and killed outside his vehicle at Pool Village, Rio Claro on Saturday night. Police identified the victim as Sylvan Boodan, also known as 'Lawa', who operated a bar on San Pedro Road. The incident occurred around 11:45 p.m. on November 2.`;

  const result = extractCrimeData(sampleText, 'Bar owner killed in Rio Claro', 'https://example.com/test');
  Logger.log(JSON.stringify(result, null, 2));
}
```

### Step 5.3: Add Processing Orchestrator

Create new file `processor.gs`:

```javascript
/**
 * Main processing orchestrator
 * Runs hourly to process articles waiting in queue
 */

const PROD_SHEET_NAME = 'Production'; // Or your actual production sheet name
const REVIEW_QUEUE_SHEET = 'Review Queue';
const CONFIDENCE_THRESHOLD = 7; // Articles below this go to review queue

/**
 * Process articles ready for AI extraction
 */
function processReadyArticles() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RAW_ARTICLES_SHEET);
  const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8);
  const data = dataRange.getValues();

  let processedCount = 0;
  const maxPerRun = 15; // Gemini free tier: 60 RPM, so 15 per 15-min execution is safe

  for (let i = 0; i < data.length && processedCount < maxPerRun; i++) {
    const row = data[i];
    const status = row[6]; // Column G

    if (status === 'ready_for_processing') {
      const rowNumber = i + 2;

      try {
        // Mark as processing
        sheet.getRange(rowNumber, 7).setValue('processing');

        const articleTitle = row[2];
        const articleUrl = row[3];
        const articleText = row[4];

        // Extract data using Gemini
        const extracted = extractCrimeData(articleText, articleTitle, articleUrl);

        // Route to production or review queue based on confidence
        if (extracted.confidence >= CONFIDENCE_THRESHOLD) {
          appendToProduction(extracted);
          sheet.getRange(rowNumber, 7).setValue('completed');
          sheet.getRange(rowNumber, 8).setValue(`Auto-processed (confidence: ${extracted.confidence})`);
        } else {
          appendToReviewQueue(extracted);
          sheet.getRange(rowNumber, 7).setValue('needs_review');
          sheet.getRange(rowNumber, 8).setValue(`Low confidence: ${extracted.confidence} - ${extracted.ambiguities.join(', ')}`);
        }

        processedCount++;

        // Rate limiting (Gemini: 60 RPM free tier)
        Utilities.sleep(1000);

      } catch (error) {
        Logger.log(`Error processing row ${rowNumber}: ${error.message}`);
        sheet.getRange(rowNumber, 7).setValue('failed');
        sheet.getRange(rowNumber, 8).setValue(`Error: ${error.message}`);
      }
    }
  }

  Logger.log(`Processed ${processedCount} articles`);
  sendDailySummaryIfNeeded(processedCount);
}

/**
 * Append extracted data to production sheet
 */
function appendToProduction(extracted) {
  const prodSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PROD_SHEET_NAME);

  // Check for duplicate before appending
  if (isDuplicateCrime(prodSheet, extracted)) {
    Logger.log(`Duplicate detected: ${extracted.headline}`);
    return;
  }

  // Geocode address
  const geocoded = geocodeAddress(extracted.street + ', ' + extracted.area + ', Trinidad and Tobago');

  prodSheet.appendRow([
    extracted.crime_date,
    extracted.headline,
    extracted.crime_type,
    extracted.street,
    geocoded.formatted_address || `${extracted.street}, ${extracted.area}`,
    extracted.area,
    'Trinidad', // Island
    extracted.source_url,
    geocoded.lat || '',
    geocoded.lng || ''
  ]);
}

/**
 * Append to review queue for manual verification
 */
function appendToReviewQueue(extracted) {
  const reviewSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REVIEW_QUEUE_SHEET);

  const geocoded = geocodeAddress(extracted.street + ', ' + extracted.area + ', Trinidad and Tobago');

  reviewSheet.appendRow([
    extracted.crime_date || '',
    extracted.headline || 'Needs headline',
    extracted.crime_type || 'Unknown',
    extracted.street || '',
    geocoded.formatted_address || '',
    extracted.area || '',
    'Trinidad',
    extracted.source_url,
    geocoded.lat || '',
    geocoded.lng || '',
    extracted.confidence,
    extracted.ambiguities.join('; '),
    'pending',
    ''
  ]);
}

/**
 * Check for duplicate crimes (fuzzy matching)
 */
function isDuplicateCrime(sheet, extracted) {
  const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8);
  const data = dataRange.getValues();

  for (let row of data) {
    const existingDate = row[0];
    const existingHeadline = row[1];
    const existingUrl = row[7];

    // Check URL match (exact)
    if (existingUrl === extracted.source_url) {
      return true;
    }

    // Check fuzzy match on date + headline
    if (existingDate.toString() === extracted.crime_date) {
      const similarity = calculateSimilarity(existingHeadline, extracted.headline);
      if (similarity > 0.8) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Simple string similarity (Levenshtein-based)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
```

### Step 5.4: Set Up Processing Trigger

1. Add new trigger for `processReadyArticles`
2. Event source: "Time-driven"
3. Type: "Hour timer"
4. Interval: "Every hour"
5. Save

---

## Phase 6: Geocoding Integration (30 minutes)

### Step 6.1: Enable Google Maps Geocoding API

1. In Google Cloud Console, go to "APIs & Services"
2. Click "Enable APIs and Services"
3. Search for "Geocoding API"
4. Click "Enable"
5. No separate API key needed (uses same project)

### Step 6.2: Add Geocoding Function

Create new file `geocoder.gs`:

```javascript
/**
 * Geocoding service for addresses
 * Uses Google Maps Geocoding API (free tier: $200/month = ~40,000 requests)
 */

/**
 * Geocode an address to lat/lng
 */
function geocodeAddress(address) {
  // Check cache first to save API calls
  const cache = CacheService.getScriptCache();
  const cacheKey = 'geo_' + address.toLowerCase().replace(/\s+/g, '_');
  const cached = cache.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // Call Geocoding API
  const apiKey = getGeminiApiKey(); // Reuse same API key (works for all Google APIs)
  const endpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
  const url = `${endpoint}?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
    const data = JSON.parse(response.getContentText());

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const geocoded = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted_address: result.formatted_address
      };

      // Cache for 30 days
      cache.put(cacheKey, JSON.stringify(geocoded), 2592000);
      return geocoded;
    } else {
      Logger.log(`Geocoding failed for "${address}": ${data.status}`);
      return {lat: null, lng: null, formatted_address: null};
    }
  } catch (error) {
    Logger.log(`Geocoding error: ${error.message}`);
    return {lat: null, lng: null, formatted_address: null};
  }
}

/**
 * Test geocoding
 */
function testGeocoding() {
  const testAddress = 'San Pedro Road, Pool Village, Rio Claro, Trinidad and Tobago';
  const result = geocodeAddress(testAddress);
  Logger.log(JSON.stringify(result, null, 2));
}
```

---

## Phase 7: Notifications & Monitoring (30 minutes)

### Step 7.1: Add Email Notification System

Create new file `notifications.gs`:

```javascript
/**
 * Notification system for daily summaries and alerts
 */

const NOTIFICATION_EMAIL = 'your-email@example.com'; // Change this

/**
 * Send daily summary email
 */
function sendDailySummaryIfNeeded(processedCount) {
  const lastSent = PropertiesService.getScriptProperties().getProperty('last_summary_sent');
  const today = new Date().toDateString();

  // Send once per day
  if (lastSent !== today) {
    sendDailySummary();
    PropertiesService.getScriptProperties().setProperty('last_summary_sent', today);
  }
}

/**
 * Generate and send daily summary
 */
function sendDailySummary() {
  const stats = getDailyStats();

  const subject = `Crime Hotspots Daily Summary - ${stats.date}`;
  const body = `
Crime Hotspots Automated Pipeline - Daily Summary
Date: ${stats.date}

COLLECTION:
- New articles collected: ${stats.articlesCollected}
- Articles processed: ${stats.articlesProcessed}

DATA QUALITY:
- Added to production: ${stats.addedToProduction}
- Sent to review queue: ${stats.sentToReview}
- Failed processing: ${stats.failed}

REVIEW QUEUE:
- Items awaiting review: ${stats.reviewQueueCount}

ACTION NEEDED:
${stats.reviewQueueCount > 0 ? `Review ${stats.reviewQueueCount} items: [Link to review queue sheet]` : 'No action needed'}

---
Automated message from Crime Hotspots data pipeline
  `.trim();

  GmailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
  Logger.log('Daily summary sent');
}

/**
 * Get daily statistics
 */
function getDailyStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  // Count articles by status
  const rawSheet = ss.getSheetByName(RAW_ARTICLES_SHEET);
  const rawData = rawSheet.getRange(2, 1, rawSheet.getLastRow() - 1, 8).getValues();

  const stats = {
    date: today.toDateString(),
    articlesCollected: 0,
    articlesProcessed: 0,
    addedToProduction: 0,
    sentToReview: 0,
    failed: 0,
    reviewQueueCount: 0
  };

  rawData.forEach(row => {
    const timestamp = new Date(row[0]);
    if (timestamp >= yesterday) {
      stats.articlesCollected++;
      const status = row[6];
      if (status === 'completed') stats.addedToProduction++;
      if (status === 'needs_review') stats.sentToReview++;
      if (status === 'failed') stats.failed++;
      if (status === 'completed' || status === 'needs_review') stats.articlesProcessed++;
    }
  });

  // Count review queue items
  const reviewSheet = ss.getSheetByName(REVIEW_QUEUE_SHEET);
  if (reviewSheet) {
    const reviewData = reviewSheet.getRange(2, 13, reviewSheet.getLastRow() - 1, 1).getValues();
    stats.reviewQueueCount = reviewData.filter(row => row[0] === 'pending').length;
  }

  return stats;
}

/**
 * Manual function to test email
 */
function testDailySummary() {
  sendDailySummary();
}
```

### Step 7.2: Set Up Daily Summary Trigger

1. Add new trigger for `sendDailySummary`
2. Event source: "Time-driven"
3. Type: "Day timer"
4. Time: "8am to 9am" (or your preference)
5. Save

---

## Phase 8: Testing & Validation (60 minutes)

### Step 8.1: Initial Setup Checklist

Run these functions manually in order:

1. ✅ `setGeminiApiKey()` - Store API key securely
2. ✅ `testRSSCollection()` - Verify RSS feeds working
3. ✅ `testArticleFetch()` - Verify article text extraction
4. ✅ `testGeminiExtraction()` - Verify AI extraction
5. ✅ `testGeocoding()` - Verify geocoding
6. ✅ `testDailySummary()` - Verify email notifications

### Step 8.2: Monitor First 24 Hours

1. Check "Raw Articles" sheet after 2 hours
   - Should have 5-20 articles (depending on news volume)

2. Check "Raw Articles" sheet after 3 hours
   - Column E (Full Text) should be populated
   - Status should be "ready_for_processing"

3. Check after 4 hours
   - Production sheet should have new entries (confidence ≥ 7)
   - Review Queue should have flagged items (confidence < 7)

4. Review first 10 AI-extracted entries
   - Verify dates are correct (crime date, not article date)
   - Verify crime types are accurate
   - Verify locations match article content

### Step 8.3: Quality Calibration

Based on initial results, adjust:

1. **Confidence threshold** - If too many good articles go to review, lower from 7 to 6
2. **AI prompt** - If extractions are consistently wrong, refine prompt
3. **RSS keywords** - If too many non-crime articles, tighten keywords
4. **Geocoding** - Verify lat/lng are within Trinidad & Tobago bounds

---

## Troubleshooting

### Issue: No articles being collected
**Cause:** RSS feeds may be down or changed URLs
**Fix:**
1. Test each feed URL in browser
2. Check Apps Script execution logs (View → Executions)
3. Verify triggers are active

### Issue: Gemini API errors
**Cause:** API key not set or rate limit exceeded
**Fix:**
1. Check API key is saved: `Logger.log(getGeminiApiKey())`
2. Check Google Cloud Console → Generative Language API → Quotas
3. If rate limited, reduce `maxPerRun` in `processReadyArticles()`

### Issue: Poor extraction quality
**Cause:** AI prompt needs refinement
**Fix:**
1. Review failed extractions in logs
2. Add specific examples to prompt
3. Adjust temperature (lower = more deterministic)

### Issue: Script timeout (6-minute limit)
**Cause:** Processing too many articles per run
**Fix:**
1. Reduce `maxPerRun` constants
2. Split processing into smaller batches
3. Add more frequent triggers (e.g., every 30 min instead of hourly)

---

## Maintenance Schedule

### Daily (5 minutes)
- Review items in "Review Queue" sheet
- Approve/edit/reject flagged items
- Move approved items to production sheet

### Weekly (15 minutes)
- Check execution logs for errors
- Verify all RSS feeds still working
- Spot-check 5-10 random auto-processed articles for accuracy

### Monthly (30 minutes)
- Review overall statistics (emails collected, processed, accuracy)
- Adjust confidence thresholds if needed
- Update RSS feed list (add new sources, remove dead ones)
- Review API usage (Gemini, Geocoding) to stay within free tiers

---

## Next Steps

1. **Proceed to:** `04-AI-EXTRACTION-PROMPTS.md` for advanced prompt engineering
2. **Proceed to:** `05-SCALABILITY-PLAN.md` for multi-country expansion
3. **Proceed to:** `06-COST-ANALYSIS.md` for detailed free tier breakdowns

---

## Support Resources

### Google Apps Script Documentation
- Main docs: https://developers.google.com/apps-script
- UrlFetchApp: https://developers.google.com/apps-script/reference/url-fetch
- SpreadsheetApp: https://developers.google.com/apps-script/reference/spreadsheet

### Google Gemini API
- Docs: https://ai.google.dev/docs
- Pricing: https://ai.google.dev/pricing (Free tier: 60 RPM, 1,500 RPD)

### Google Maps Geocoding API
- Docs: https://developers.google.com/maps/documentation/geocoding
- Pricing: $200/month free credit

### Troubleshooting
- Apps Script Community: https://stackoverflow.com/questions/tagged/google-apps-script
- Rate limits: All Google APIs have quotas visible in Cloud Console
