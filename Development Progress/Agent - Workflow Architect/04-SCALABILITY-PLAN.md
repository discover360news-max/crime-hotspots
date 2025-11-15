# Multi-Country Scalability Plan
## Expanding Crime Hotspots to Caribbean Region

**Last Updated:** 2025-11-07
**Current:** Trinidad & Tobago
**Planned:** Guyana, Barbados, Jamaica, and other Caribbean nations

---

## Architecture for Multi-Country Support

### Design Principles

1. **Country-Agnostic Core:** Processing pipeline works for any Caribbean country
2. **Configuration-Driven:** Add new countries via config, not code changes
3. **Shared Infrastructure:** One Google Apps Script project serves all countries
4. **Isolated Data:** Separate sheets per country for data integrity
5. **Unified Dashboard:** Central monitoring for all countries

---

## Current Single-Country Architecture

```
Trinidad & Tobago Pipeline:
┌──────────────┐
│ RSS Feeds    │ → [Raw Articles] → [AI Processing] → [Production Sheet] → [Looker Studio]
└──────────────┘
```

## Proposed Multi-Country Architecture

```
                    ┌─────────────────────────────────────┐
                    │   CENTRAL ORCHESTRATOR              │
                    │   (Google Apps Script)              │
                    └─────────────┬───────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
         ┌──────────▼──────┐  ┌──▼──────┐  ┌──▼──────────┐
         │ TRINIDAD CONFIG │  │ GUYANA  │  │ BARBADOS    │
         │ - RSS feeds     │  │ CONFIG  │  │ CONFIG      │
         │ - Keywords      │  │         │  │             │
         │ - Geocoding     │  │         │  │             │
         └──────────┬──────┘  └──┬──────┘  └──┬──────────┘
                    │             │             │
         ┌──────────▼──────┐  ┌──▼──────┐  ┌──▼──────────┐
         │ T&T Raw Data    │  │ GUY Raw │  │ BAR Raw     │
         └──────────┬──────┘  └──┬──────┘  └──┬──────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  SHARED AI PROCESSOR        │
                    │  (Gemini API)               │
                    │  - Country-aware prompts    │
                    │  - Location validation      │
                    └─────────────┬───────────────┘
                                  │
         ┌──────────────────────────────────────────┐
         │                      │                    │
    ┌────▼─────┐          ┌────▼─────┐        ┌────▼─────┐
    │ T&T Prod │          │ GUY Prod │        │ BAR Prod │
    │ Sheet    │          │ Sheet    │        │ Sheet    │
    └────┬─────┘          └────┬─────┘        └────┬─────┘
         │                     │                    │
         └────────────┬────────┴────────────────────┘
                      │
           ┌──────────▼──────────┐
           │  UNIFIED DASHBOARD  │
           │  (Looker Studio)    │
           │  - Country filters  │
           │  - Regional stats   │
           └─────────────────────┘
```

---

## Country Configuration System

### Step 1: Create Country Registry

Create new file in Apps Script: `countryConfig.gs`

```javascript
/**
 * Multi-country configuration registry
 * Add new countries here without changing core code
 */

const COUNTRIES = {
  'trinidad': {
    id: 'trinidad',
    name: 'Trinidad & Tobago',
    abbreviation: 'T&T',
    enabled: true,
    rssFeeds: [
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
    ],
    googleAlerts: [
      'Trinidad murder',
      'Tobago crime',
      'Trinidad shooting',
      'Trinidad robbery'
    ],
    sheets: {
      raw: 'Raw Articles - Trinidad',
      production: 'Production - Trinidad',
      reviewQueue: 'Review Queue - Trinidad'
    },
    geocoding: {
      countryCode: 'TT',
      bounds: {
        north: 11.5,
        south: 10.0,
        east: -60.5,
        west: -61.9
      }
    },
    timezone: 'America/Port_of_Spain',
    notificationEmail: 'your-email@example.com'
  },

  'guyana': {
    id: 'guyana',
    name: 'Guyana',
    abbreviation: 'GUY',
    enabled: false, // Set to true when ready to activate
    rssFeeds: [
      {
        name: 'Stabroek News',
        url: 'https://stabroeknews.com/feed/',
        keywords: ['murder', 'kill', 'shot', 'shooting', 'robbery', 'assault', 'crime', 'bandit']
      },
      {
        name: 'Kaieteur News',
        url: 'https://www.kaieteurnewsonline.com/feed/',
        keywords: ['murder', 'kill', 'shot', 'shooting', 'robbery', 'assault', 'crime', 'bandit']
      },
      {
        name: 'Loop Guyana',
        url: 'https://guyana.loopnews.com/rss',
        keywords: ['murder', 'kill', 'shot', 'shooting', 'robbery', 'assault', 'crime']
      }
    ],
    googleAlerts: [
      'Guyana murder',
      'Georgetown crime',
      'Guyana shooting',
      'Guyana robbery'
    ],
    sheets: {
      raw: 'Raw Articles - Guyana',
      production: 'Production - Guyana',
      reviewQueue: 'Review Queue - Guyana'
    },
    geocoding: {
      countryCode: 'GY',
      bounds: {
        north: 8.6,
        south: 1.2,
        east: -56.5,
        west: -61.4
      }
    },
    timezone: 'America/Guyana',
    notificationEmail: 'your-email@example.com'
  },

  'barbados': {
    id: 'barbados',
    name: 'Barbados',
    abbreviation: 'BAR',
    enabled: false,
    rssFeeds: [
      {
        name: 'Barbados Today',
        url: 'https://barbadostoday.bb/feed/',
        keywords: ['murder', 'kill', 'shot', 'shooting', 'robbery', 'assault', 'crime']
      },
      {
        name: 'Nation News',
        url: 'https://www.nationnews.com/feed/',
        keywords: ['murder', 'kill', 'shot', 'shooting', 'robbery', 'assault', 'crime']
      },
      {
        name: 'Loop Barbados',
        url: 'https://loopnewsbarbados.com/rss',
        keywords: ['murder', 'kill', 'shot', 'shooting', 'robbery', 'assault', 'crime']
      }
    ],
    googleAlerts: [
      'Barbados murder',
      'Bridgetown crime',
      'Barbados shooting'
    ],
    sheets: {
      raw: 'Raw Articles - Barbados',
      production: 'Production - Barbados',
      reviewQueue: 'Review Queue - Barbados'
    },
    geocoding: {
      countryCode: 'BB',
      bounds: {
        north: 13.4,
        south: 13.0,
        east: -59.4,
        west: -59.7
      }
    },
    timezone: 'America/Barbados',
    notificationEmail: 'your-email@example.com'
  }
};

/**
 * Get all enabled countries
 */
function getEnabledCountries() {
  return Object.values(COUNTRIES).filter(country => country.enabled);
}

/**
 * Get country config by ID
 */
function getCountryConfig(countryId) {
  return COUNTRIES[countryId];
}
```

---

## Modified Collection Script (Multi-Country)

Update `rssCollector.gs`:

```javascript
/**
 * Multi-country RSS collector
 * Processes all enabled countries automatically
 */

function collectAllCountryFeeds() {
  const enabledCountries = getEnabledCountries();
  let totalCollected = 0;

  enabledCountries.forEach(country => {
    try {
      Logger.log(`Collecting feeds for ${country.name}...`);
      const count = collectFeedsForCountry(country);
      totalCollected += count;
      Logger.log(`${country.name}: ${count} articles collected`);
    } catch (error) {
      Logger.log(`Error collecting ${country.name}: ${error.message}`);
      sendErrorAlert(country, error);
    }
  });

  Logger.log(`Total articles collected: ${totalCollected}`);
  return totalCollected;
}

function collectFeedsForCountry(country) {
  const sheet = getOrCreateSheet(country.sheets.raw);
  let articleCount = 0;

  country.rssFeeds.forEach(feed => {
    try {
      const articles = fetchAndParseFeed(feed);
      articles.forEach(article => {
        if (shouldCollectArticle(article, feed.keywords) && !isDuplicate(sheet, article.url)) {
          appendArticle(sheet, article, feed.name, country.id);
          articleCount++;
        }
      });
    } catch (error) {
      Logger.log(`Error processing ${feed.name} (${country.name}): ${error.message}`);
    }
  });

  return articleCount;
}

/**
 * Get or create sheet for country
 */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // Add headers
    sheet.appendRow(['Timestamp', 'Source', 'Title', 'URL', 'Full Text', 'Published Date', 'Status', 'Notes']);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Modified append to include country ID
 */
function appendArticle(sheet, article, sourceName, countryId) {
  sheet.appendRow([
    new Date(),
    sourceName,
    article.title,
    article.url,
    article.description,
    article.pubDate,
    'pending',
    `Country: ${countryId}`
  ]);
}
```

---

## Country-Aware AI Extraction

Update `geminiClient.gs` to include country context:

```javascript
/**
 * Country-aware extraction
 */
function extractCrimeDataForCountry(articleText, articleTitle, articleUrl, countryConfig) {
  const prompt = buildCountryAwarePrompt(articleText, articleTitle, countryConfig);
  // ... rest of extraction logic
}

function buildCountryAwarePrompt(articleText, articleTitle, countryConfig) {
  return `You are a data extraction specialist for ${countryConfig.name} crime news.

Extract structured crime information from this article:

TITLE: ${articleTitle}

ARTICLE TEXT:
${articleText}

IMPORTANT CONTEXT:
- This article is about crime in ${countryConfig.name}
- All locations should be within ${countryConfig.name}
- Use timezone: ${countryConfig.timezone} for date calculations
- Country code: ${countryConfig.abbreviation}

Extract the following information and respond ONLY with valid JSON:

{
  "crime_date": "YYYY-MM-DD format",
  "crime_type": "One of: Murder|Shooting|Robbery|Assault|Theft|Home Invasion|Sexual Assault|Kidnapping|Domestic Violence|Other",
  "area": "Neighborhood or district in ${countryConfig.name}",
  "street": "Specific street address",
  "headline": "Concise headline under 100 characters",
  "details": "2-3 sentence summary",
  "victims": [...],
  "country": "${countryConfig.abbreviation}",
  "confidence": 1-10,
  "ambiguities": []
}

LOCATION VALIDATION:
- Verify location is actually in ${countryConfig.name}
- Flag if location seems outside country bounds
- Common areas in ${countryConfig.name}: [List major cities/regions]

Respond with ONLY the JSON object.`;
}
```

---

## Geocoding with Country Bounds Validation

Update `geocoder.gs`:

```javascript
/**
 * Geocode with country validation
 */
function geocodeAddressForCountry(address, countryConfig) {
  const result = geocodeAddress(address + ', ' + countryConfig.name);

  // Validate coordinates are within country bounds
  if (result.lat && result.lng) {
    const bounds = countryConfig.geocoding.bounds;
    const isValid = (
      result.lat >= bounds.south &&
      result.lat <= bounds.north &&
      result.lng >= bounds.west &&
      result.lng <= bounds.east
    );

    if (!isValid) {
      Logger.log(`WARNING: Coordinates outside ${countryConfig.name} bounds: ${result.lat}, ${result.lng}`);
      result.validation_warning = 'Coordinates outside expected country bounds';
    }
  }

  return result;
}
```

---

## Phased Rollout Plan

### Phase 1: Trinidad & Tobago (Current)
**Timeline:** Weeks 1-4
**Status:** In development
**Goal:** Achieve 75%+ automation with 95%+ accuracy

**Milestones:**
- Week 1: RSS collection operational
- Week 2: AI extraction live, confidence threshold tuned
- Week 3: Review queue workflow established
- Week 4: Daily processing running smoothly

**Success Criteria:**
- Processing 30+ articles/day automatically
- < 10 items/day requiring manual review
- Zero duplicate entries
- 90%+ geocoding accuracy

### Phase 2: Guyana Addition
**Timeline:** Weeks 5-6 (after T&T stable)
**Effort:** 4 hours setup time

**Steps:**
1. Research Guyana news sources (RSS feeds confirmed working)
2. Set `enabled: true` in COUNTRIES config
3. Run `collectAllCountryFeeds()` manually to test
4. Create separate Looker Studio dashboard for Guyana
5. Update frontend to show Guyana data
6. Monitor for 2 weeks alongside T&T

**Expected Volume:**
- Guyana: 15-25 crime articles/day
- Combined: 45-55 articles/day
- Well within Gemini free tier (1,500/day)

### Phase 3: Barbados Addition
**Timeline:** Weeks 7-8
**Effort:** 4 hours setup time

**Steps:** (Same as Phase 2)

**Expected Volume:**
- Barbados: 10-20 articles/day
- Combined: 55-75 articles/day

### Phase 4: Jamaica Addition (Optional)
**Timeline:** Weeks 9-10
**Effort:** 4 hours setup time

**Expected Volume:**
- Jamaica: 30-50 articles/day (higher crime rate)
- Combined: 85-125 articles/day
- May need to review API quotas at this scale

---

## Scaling Considerations

### Free Tier Limits by Country Count

| Countries | Articles/Day | Gemini API Calls | Geocoding API | Status |
|-----------|--------------|------------------|---------------|---------|
| 1 (T&T) | 30 | 30/day | 30/day | ✅ Well within limits |
| 2 (T&T + GUY) | 50 | 50/day | 50/day | ✅ Well within limits |
| 3 (+BAR) | 70 | 70/day | 70/day | ✅ Well within limits |
| 4 (+JAM) | 120 | 120/day | 120/day | ✅ Within limits (8% of quota) |
| 5 (+more) | 150+ | 150+/day | 150+/day | ✅ Still within free tier |
| 10 countries | 300+ | 300+/day | 300+/day | ✅ 20% of free tier |

**Conclusion:** Free tiers support 10+ Caribbean countries easily.

### When to Consider Paid Tiers

**Gemini API:**
- Free tier: 1,500 requests/day
- Threshold: ~15 countries (450 articles/day = 30% utilization)
- Cost if exceeded: $0.00015/request (1000 req = $0.15/day = $4.50/month)

**Geocoding API:**
- Free tier: $200/month = ~40,000 requests
- With caching: Each address geocoded once, then cached
- Threshold: Not reached even with 20 countries (max ~300 unique addresses/day)

**Google Apps Script:**
- Free tier: Unlimited executions (6-min timeout per execution)
- Threshold: Never reached with current architecture

---

## Multi-Country Sheet Organization

### Option 1: Single Spreadsheet (Recommended for <5 countries)

```
Crime Hotspots Master Sheet
├── Raw Articles - Trinidad
├── Raw Articles - Guyana
├── Raw Articles - Barbados
├── Production - Trinidad
├── Production - Guyana
├── Production - Barbados
├── Review Queue - Trinidad
├── Review Queue - Guyana
├── Review Queue - Barbados
└── Dashboard (Combined Stats)
```

**Pros:** Easy central management, one Apps Script project
**Cons:** Gets unwieldy after 5+ countries

### Option 2: Separate Spreadsheets (For 5+ countries)

```
Crime Hotspots - Trinidad & Tobago (Original)
Crime Hotspots - Guyana
Crime Hotspots - Barbados
Crime Hotspots - Master Control (Apps Script runs here)
```

**Pros:** Scales infinitely, cleaner separation
**Cons:** Requires SpreadsheetApp.openById() for cross-sheet access

---

## Frontend Integration (countries.js)

Update `/src/js/data/countries.js`:

```javascript
export const COUNTRIES = [
  {
    id: 'trinidad',
    name: 'Trinidad & Tobago',
    flag: '🇹🇹',
    dashboard: 'https://lookerstudio.google.com/embed/...',
    csvUrl: 'https://docs.google.com/spreadsheets/.../Production-Trinidad...',
    available: true,
    image: '/images/trinidad-header.jpg',
    headlinesSlug: 'headlines-trinidad'
  },
  {
    id: 'guyana',
    name: 'Guyana',
    flag: '🇬🇾',
    dashboard: 'https://lookerstudio.google.com/embed/...',
    csvUrl: 'https://docs.google.com/spreadsheets/.../Production-Guyana...',
    available: true, // Set to true when ready
    image: '/images/guyana-header.jpg',
    headlinesSlug: 'headlines-guyana'
  },
  {
    id: 'barbados',
    name: 'Barbados',
    flag: '🇧🇧',
    dashboard: 'https://lookerstudio.google.com/embed/...',
    csvUrl: 'https://docs.google.com/spreadsheets/.../Production-Barbados...',
    available: false, // Coming soon
    image: '/images/barbados-header.jpg',
    headlinesSlug: 'headlines-barbados'
  }
];
```

Create duplicate headlines pages:
- `headlines-guyana.html` (copy structure from `headlines-trinidad.html`)
- `headlines-guyana.js` (use same logic, different CSV URL)

---

## Unified Regional Dashboard

### Looker Studio Combined View

Create a new Looker Studio report that pulls from all country sheets:

1. Data source: Add all "Production - [Country]" sheets
2. Add "Country" dimension for filtering
3. Create views:
   - **Regional Overview:** Combined crime stats for all Caribbean
   - **Country Comparison:** Side-by-side metrics
   - **Heatmap:** Regional crime density
   - **Trends:** Time-series by country

### Regional Crime Statistics

Add new page to Crime Hotspots app:
- `/regional-overview.html`
- Shows combined Caribbean crime statistics
- Filterable by country
- Comparative analysis (crimes per capita, trends, etc.)

---

## Country Addition Checklist

Use this when adding each new country:

### Pre-Launch (1 hour)
- [ ] Research news sources (verify RSS feeds active)
- [ ] Add country to `countryConfig.gs`
- [ ] Test RSS feeds manually
- [ ] Create country-specific sheets
- [ ] Set `enabled: false` initially

### Testing Phase (1 week)
- [ ] Enable country (`enabled: true`)
- [ ] Run `collectFeedsForCountry()` manually
- [ ] Review first 20 AI extractions for accuracy
- [ ] Adjust prompts if needed
- [ ] Validate geocoding (check coordinates are in-country)

### Production Launch (30 minutes)
- [ ] Create Looker Studio dashboard for country
- [ ] Add country to frontend `countries.js`
- [ ] Create headlines page (`headlines-[country].html`)
- [ ] Update navigation header
- [ ] Deploy frontend changes
- [ ] Announce new country availability

### Post-Launch Monitoring (2 weeks)
- [ ] Daily review of auto-processed articles
- [ ] Adjust confidence thresholds
- [ ] Monitor API usage
- [ ] Gather user feedback

---

## Cost Projection by Scale

### 5 Countries (Trinidad, Guyana, Barbados, Jamaica, Grenada)
**Daily Volume:** ~150 articles
**Monthly Costs:**
- Gemini API: $0 (10% of free tier)
- Geocoding API: $0 (cached addresses)
- Apps Script: $0 (unlimited)
- Google Sheets: $0 (well under 10M cell limit)
- Hosting (Cloudflare Pages): $0
**Total: $0/month**

### 10 Countries (All Caribbean)
**Daily Volume:** ~300 articles
**Monthly Costs:**
- Gemini API: $0 (20% of free tier)
- Geocoding API: $0 (caching prevents re-geocoding)
- Apps Script: $0
- Google Sheets: $0
- Hosting: $0
**Total: $0/month**

### 20 Countries (Caribbean + Latin America)
**Daily Volume:** ~600 articles
**Monthly Costs:**
- Gemini API: $0 (40% of free tier)
- Geocoding API: $0
- Apps Script: $0
- Google Sheets: May need multiple spreadsheets (organizational, not technical limit)
- Hosting: $0
**Total: $0/month**

**Conclusion:** Architecture supports regional expansion at zero cost.

---

## Long-Term Vision: Latin America Expansion

### Potential Countries (After Caribbean mastered)
1. **Central America:** Belize, Costa Rica, Panama
2. **South America:** Colombia, Venezuela, Brazil (Portuguese - needs translation layer)

### Translation Layer (If needed for non-English countries)
- Google Cloud Translation API
- Free tier: 500,000 characters/month
- Integrate before AI extraction: Translate → Extract → Store in English

---

## Monitoring & Alerts

### Country-Specific Health Checks

Add to `notifications.gs`:

```javascript
function checkCountryHealth() {
  const countries = getEnabledCountries();

  countries.forEach(country => {
    const health = {
      country: country.name,
      lastCollection: getLastCollectionTime(country),
      articlesLast24h: getArticleCount(country, 24),
      failedExtractions: getFailedCount(country),
      reviewQueueSize: getReviewQueueSize(country)
    };

    // Alert if no articles collected in 12 hours
    if (health.lastCollection > 12) {
      sendAlert(`⚠️ ${country.name}: No articles collected in ${health.lastCollection} hours`);
    }

    // Alert if review queue growing too large
    if (health.reviewQueueSize > 50) {
      sendAlert(`⚠️ ${country.name}: Review queue has ${health.reviewQueueSize} items`);
    }
  });
}
```

---

## Next Steps

1. **Complete Trinidad & Tobago pipeline** (current priority)
2. **Stabilize for 2 weeks** before adding Guyana
3. **Add countries incrementally** (1 per 2 weeks)
4. **Monitor API usage** as scale increases
5. **Build unified regional dashboard** once 3+ countries live

---

## Summary: Why This Scales

1. **Zero Marginal Cost:** Adding countries doesn't increase expenses
2. **Configuration-Driven:** No code changes needed for new countries
3. **Shared Infrastructure:** One Apps Script project serves all
4. **Generous Free Tiers:** Google services support 10+ countries easily
5. **Parallel Processing:** Countries processed independently (no blocking)
6. **Gradual Rollout:** Add countries one at a time, validate quality

**Bottom Line:** This architecture supports **10+ Caribbean countries at $0/month** with minimal maintenance (30 min/week per country).
