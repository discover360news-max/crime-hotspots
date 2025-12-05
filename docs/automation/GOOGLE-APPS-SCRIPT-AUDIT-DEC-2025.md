# Google Apps Script Automation Audit - December 5, 2025

**Status**: Critical issues identified - fixes required December 8, 2025
**Affected**: Trinidad, Guyana, Barbados automation pipelines
**Priority**: HIGH - Barbados blocked, Gemini rate limits exceeded

---

## 🚨 CRITICAL ISSUES

### 1. Barbados Gemini Prompt Error (BLOCKING ISSUE)

**Location**: `google-apps-script/barbados/geminiClient.gs:170`

**Problem**:
- Line 170 incorrectly says "Barbados & Tobago" instead of "Barbados"
- Lines 293-297 reference Trinidad-specific locations (Port of Spain, KFC Arima, Grand Bazaar) in Barbados code

```javascript
// INCORRECT (Line 170):
return `Extract crime data from this Barbados & Tobago news article.

// CORRECT:
return `Extract crime data from this Barbados news article.
```

**Impact**:
- Gemini AI gets confused about which country it's processing
- Leads to incorrect or rejected extractions
- May cause location filtering to fail

**Fix Required**:
```javascript
// Line 170: Change country name
return `Extract crime data from this Barbados news article.

// Lines 287-291: Update location examples
  7. LOCATION DETAILS: Capture complete location information
     - ALWAYS include business names (e.g., "Speightstown Market", "Bridgetown Port")
     - Include landmarks (e.g., "near St. Michael's Cathedral")
     - street field should have: "Business/Landmark Name, Street Name" format
     - Examples:
       * "Swan Street" → street: "Swan Street", area: "Bridgetown"
       * "Oistins shooting" → street: "Oistins Bay Garden", area: "Christ Church"
       * "Holetown Plaza" → street: "Holetown Plaza, Highway 1", area: "St. James"
```

---

### 2. Barbados Production Sheet Column Mismatch (BLOCKING ISSUE)

**Location**: `google-apps-script/barbados/processor.gs:280-292`

**Problem**:
`appendToProduction()` writes **11 columns** but Production sheet expects **14 columns** according to config.gs

**Expected columns** (from config.gs COLUMN_MAPPINGS.PRODUCTION):
1. Date
2. Headline
3. Crime Type
4. Street
5. Plus Code
6. Area
7. **Region** (parish - e.g., "Christ Church", "St. Michael")
8. **Island** (always "Barbados")
9. URL
10. **Source** (article source name - e.g., "Barbados Today")
11. Lat
12. Long
13. Summary
14. Forward (manual column, not populated by automation)

**Currently writing** (11 columns):
```javascript
prodSheet.appendRow([
  validatedDate,                  // 1. Date
  crime.headline || 'No headline', // 2. Headline
  crime.crime_type || 'Other',    // 3. Crime Type
  crime.street || '',             // 4. Street
  geocoded.plus_code || '',       // 5. Plus Code
  crime.area || '',               // 6. Area
  'Barbados',                     // 7. ❌ WRONG COLUMN (should be Region, this is Island)
  crime.source_url || '',         // 8. ❌ WRONG COLUMN (should be Island, this is URL)
  geocoded.lat || '',             // 9. ❌ WRONG COLUMN (should be URL, this is Lat)
  geocoded.lng || '',             // 10. ❌ WRONG COLUMN (should be Source, this is Long)
  crime.details || ''             // 11. ❌ WRONG COLUMN (should be Lat, this is Summary)
  // Missing: Long, Summary
]);
```

**Impact**:
- Data writes to wrong columns causing data corruption
- CSV export produces incorrect data
- Dashboard displays incorrect information
- **This is why Barbados is not processing after articles are fetched**

**Fix Required**:
```javascript
function appendToProduction(crime, publishedDate, sourceName) {
  // ... existing code ...

  // Extract parish from area or geocoded address
  const parish = extractParish(crime.area, geocoded.formatted_address);

  prodSheet.appendRow([
    validatedDate,                  // 1. Date
    crime.headline || 'No headline', // 2. Headline
    crime.crime_type || 'Other',    // 3. Crime Type
    crime.street || '',             // 4. Street
    geocoded.plus_code || '',       // 5. Plus Code
    crime.area || '',               // 6. Area
    parish || '',                   // 7. Region (NEW)
    'Barbados',                     // 8. Island (NEW)
    crime.source_url || '',         // 9. URL
    sourceName || '',               // 10. Source (NEW - pass from Raw Articles)
    geocoded.lat || '',             // 11. Lat
    geocoded.lng || '',             // 12. Long
    crime.details || ''             // 13. Summary
    // 14. Forward (manual column, not populated)
  ]);
}

/**
 * Extract parish from area or geocoded address
 * @param {string} area - Area from crime data
 * @param {string} formattedAddress - Formatted address from geocoding
 * @returns {string} Parish name or empty string
 */
function extractParish(area, formattedAddress) {
  const locationText = `${area || ''} ${formattedAddress || ''}`.toLowerCase();

  // Check for each Barbados parish
  for (const parish of BARBADOS_PARISHES) {
    if (locationText.includes(parish.toLowerCase())) {
      return parish;
    }
  }

  // Fallback: try to infer from major area names
  const areaToParish = {
    'bridgetown': 'St. Michael',
    'speightstown': 'St. Peter',
    'oistins': 'Christ Church',
    'holetown': 'St. James',
    'bathsheba': 'St. Joseph',
    'six cross roads': 'St. Philip'
    // Add more mappings as needed
  };

  for (const [areaName, parishName] of Object.entries(areaToParish)) {
    if (locationText.includes(areaName)) {
      return parishName;
    }
  }

  return ''; // Unknown parish
}
```

**Also update processor.gs line 70-79** to pass source name:
```javascript
// Get source name from Raw Articles
const sourceName = getRowValue(row, columnMap, 'SOURCE');

// ... later in appendToProduction call ...
appendToProduction(crime, publishedDate, sourceName);

// And in appendToReviewQueue:
appendToReviewQueue(crime, extracted.confidence, extracted.ambiguities, publishedDate, sourceName);
```

---

### 3. Gemini API Rate Limit Overload (CRITICAL)

**Location**: All three countries (Trinidad, Guyana, Barbados)

**Problem**:
- All countries share the same Gemini API key from Script Properties
- Gemini free tier limit: **60 requests per minute** maximum
- Each country processes up to 30 articles per run
- `RATE_LIMIT_DELAY` is only 1000ms (1 second) between calls
- If all 3 countries process simultaneously: 3 × 30 = **90 requests**, exceeding limit by 50%
- Causes "Gemini overload" errors

**Current Trigger Schedule** (All countries):
- RSS Collection: Every hour at :00
- Article Fetching: Every hour at :00
- Processing: Every hour at :00

**Impact**:
- Processing fails with API quota errors
- Articles stuck in "ready_for_processing" status
- Backlog grows over time
- User sees "Gemini overload" errors

**Fix Required** - **Option A: Sequential Processing** (RECOMMENDED)

Stagger triggers so countries process at different times:

```javascript
// TRINIDAD TRIGGERS:
- RSS Collection: Every hour at :00 (12:00, 1:00, 2:00, etc.)
- Article Fetching: Every hour at :05 (12:05, 1:05, 2:05, etc.)
- Processing: Every hour at :10 (12:10, 1:10, 2:10, etc.)

// GUYANA TRIGGERS:
- RSS Collection: Every hour at :20 (12:20, 1:20, 2:20, etc.)
- Article Fetching: Every hour at :25 (12:25, 1:25, 2:25, etc.)
- Processing: Every hour at :30 (12:30, 1:30, 2:30, etc.)

// BARBADOS TRIGGERS:
- RSS Collection: Every hour at :40 (12:40, 1:40, 2:40, etc.)
- Article Fetching: Every hour at :45 (12:45, 1:45, 2:45, etc.)
- Processing: Every hour at :50 (12:50, 1:50, 2:50, etc.)
```

**Benefits**:
- Keeps well under 60 requests/minute limit
- Each country gets full 30 articles/run capacity
- No code changes needed, only trigger adjustments
- Simple to implement

**Alternative - Option B: Reduce Batch Size**

If staggering isn't possible:
```javascript
// In config.gs for ALL countries:
const PROCESSING_CONFIG = {
  CONFIDENCE_THRESHOLD: 7,
  MAX_ARTICLES_PER_RUN: 15,      // Reduced from 30
  MAX_EXECUTION_TIME_MS: 270000,
  MAX_FETCH_PER_RUN: 10,
  RATE_LIMIT_DELAY: 2000,        // Increased from 1000ms to 2000ms
  FETCH_DELAY: 2000
};
```

**Benefits**:
- Reduces concurrent requests
- Safer for API limits

**Drawbacks**:
- Slower processing (articles take 2 runs instead of 1)
- Backlog may grow during high-volume periods

**Alternative - Option C: Separate API Keys** (BEST FOR SCALE)

Get 3 separate Gemini API keys (all free tier):
1. Trinidad: `GEMINI_API_KEY_TRINIDAD`
2. Guyana: `GEMINI_API_KEY_GUYANA`
3. Barbados: `GEMINI_API_KEY_BARBADOS`

Update `getGeminiApiKey()` in each config.gs:
```javascript
// Trinidad config.gs:
function getGeminiApiKey() {
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY_TRINIDAD');
}

// Guyana config.gs:
function getGeminiApiKey() {
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY_GUYANA');
}

// Barbados config.gs:
function getGeminiApiKey() {
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY_BARBADOS');
}
```

**Benefits**:
- Each country gets full 60 req/min quota
- Can process 30+ articles per run per country
- Scales to 4th, 5th countries easily
- No trigger coordination needed

**Drawbacks**:
- Requires managing 3 API keys
- Need 3 Google Cloud projects (or same project, 3 keys)

**RECOMMENDATION**: Implement Option A (Sequential Processing) immediately for quick fix, then migrate to Option C (Separate Keys) for long-term scalability.

---

### 4. Barbados Dynamic vs Static Column Access (MEDIUM PRIORITY)

**Location**: `google-apps-script/barbados/processor.gs`

**Problem**:
- Code uses dynamic column mapping for RAW_ARTICLES (line 28: `getColumnMap(sheet, 'RAW_ARTICLES')`)
- But uses hardcoded array indexes for PRODUCTION (line 280-292)
- Inconsistent approach creates maintenance risk

**Impact**:
- If Production sheet columns are reordered, data goes to wrong columns
- Dynamic mapping works for Raw Articles but not Production
- Harder to maintain as schemas evolve

**Fix Required** (Choose ONE):

**Option A: Full Dynamic Mapping** (Recommended):
```javascript
function appendToProduction(crime, publishedDate, sourceName) {
  const prodSheet = getActiveSheet(SHEET_NAMES.PRODUCTION);
  const columnMap = getColumnMap(prodSheet, 'PRODUCTION');

  // Build row data using column map
  const rowData = [];
  rowData[columnMap.DATE - 1] = validatedDate;
  rowData[columnMap.HEADLINE - 1] = crime.headline || 'No headline';
  rowData[columnMap.CRIME_TYPE - 1] = crime.crime_type || 'Other';
  rowData[columnMap.STREET - 1] = crime.street || '';
  rowData[columnMap.PLUS_CODE - 1] = geocoded.plus_code || '';
  rowData[columnMap.AREA - 1] = crime.area || '';
  rowData[columnMap.REGION - 1] = parish || '';
  rowData[columnMap.ISLAND - 1] = 'Barbados';
  rowData[columnMap.URL - 1] = crime.source_url || '';
  rowData[columnMap.SOURCE - 1] = sourceName || '';
  rowData[columnMap.LAT - 1] = geocoded.lat || '';
  rowData[columnMap.LONG - 1] = geocoded.lng || '';
  rowData[columnMap.SUMMARY - 1] = crime.details || '';

  prodSheet.appendRow(rowData);
}
```

**Option B: Lock Column Order**:
- Document that Production sheet column order is FIXED and must not be changed
- Add comment in code warning about hardcoded indexes
- Simpler but less flexible

---

### 5. RSS Collection vs Article Fetching Pipeline

**Problem**: "Not pulling stories" could mean:
1. RSS feeds not being collected, OR
2. Article text not being fetched, OR
3. Articles stuck in "pending" status

**Diagnosis Steps**:

1. **Check Raw Articles Sheet**:
   - Are new rows appearing with status "pending"?
   - If YES: RSS collection works, problem is in article fetching
   - If NO: RSS collection not running

2. **Check Trigger Status**:
   ```javascript
   // Run this in Apps Script to check triggers:
   function listAllTriggers() {
     const triggers = ScriptApp.getProjectTriggers();
     triggers.forEach(trigger => {
       Logger.log(`Function: ${trigger.getHandlerFunction()}`);
       Logger.log(`Event: ${trigger.getEventType()}`);
       if (trigger.getEventType() === ScriptApp.EventType.CLOCK) {
         Logger.log(`Frequency: ${trigger.getTriggerSource()}`);
       }
       Logger.log('---');
     });
   }
   ```

3. **Check Article Fetcher**:
   - Is there an `articleFetcherImproved.gs` file?
   - Does it have a trigger?
   - Run `fetchPendingArticleText()` manually and check logs

4. **Check Processing Queue**:
   - Articles with status "ready_for_processing"?
   - If YES: Processing function not running or failing
   - Run `processReadyArticles()` manually and check logs

**Common Issues**:
- Trigger not created after deploying new script
- Function renamed but trigger still calls old name
- Execution time limit exceeded (6 minutes)
- API quota exceeded (Gemini rate limits)

---

## 📋 RECOMMENDED FIXES FOR DECEMBER 8TH

### **Phase 1: Critical Fixes (Unblocks Barbados)**

**Priority**: IMMEDIATE
**Time Required**: 30 minutes

1. **Fix Barbados Gemini Prompt**
   - File: `google-apps-script/barbados/geminiClient.gs`
   - Line 170: Change "Barbados & Tobago" to "Barbados"
   - Lines 287-291: Update location examples to Barbados-specific

2. **Fix Barbados Production Column Mapping**
   - File: `google-apps-script/barbados/processor.gs`
   - Update `appendToProduction()` to write all 14 columns
   - Add `extractParish()` helper function
   - Pass `sourceName` from Raw Articles to Production

3. **Fix Gemini Rate Limiting**
   - Implement **Option A: Sequential Processing**
   - Update trigger schedules in Apps Script:
     - Trinidad: :00, :05, :10
     - Guyana: :20, :25, :30
     - Barbados: :40, :45, :50

---

### **Phase 2: Verification (Ensures Fixes Work)**

**Priority**: HIGH
**Time Required**: 20 minutes

1. **Test RSS Collection**
   ```javascript
   // Run in Apps Script for each country:
   testRSSCollection()
   ```
   - Verify articles appear in Raw Articles sheet
   - Check Status = "pending"
   - Verify 3 Barbados sources working

2. **Test Article Fetching**
   ```javascript
   // Run in Apps Script for each country:
   fetchPendingArticleText()
   ```
   - Verify Full Text column populated
   - Check Status changes to "ready_for_processing"

3. **Test Gemini Extraction**
   ```javascript
   // Run in Apps Script for each country:
   testGeminiWithSheetData()
   ```
   - Verify JSON response is valid
   - Check crimes array has items
   - Verify confidence scores

4. **Test Production Writing**
   ```javascript
   // Run in Apps Script for Barbados:
   processReadyArticles()
   ```
   - Verify data appears in Production sheet
   - Check all 14 columns have correct data
   - Verify parish (Region) is populated
   - Verify Source name is correct

---

### **Phase 3: Monitoring (Prevents Future Issues)**

**Priority**: MEDIUM
**Time Required**: 15 minutes

1. **Set Up Daily Backlog Alerts**
   ```javascript
   // Create daily trigger for each country:
   function setupBacklogMonitoring() {
     ScriptApp.newTrigger('checkBacklogStatus')
       .timeBased()
       .everyDays(1)
       .atHour(8) // 8 AM daily
       .create();
   }
   ```

2. **Monitor API Quota Usage**
   - Check Google Cloud Console → APIs & Services → Gemini API
   - Set up quota alerts at 80% usage
   - Review daily during first week after fix

3. **Document Trigger Schedule**
   - Add comment block to each country's config.gs
   - Include trigger schedule and rationale
   - Update CLAUDE.md with new trigger schedule

---

## 🔍 VERIFICATION CHECKLIST

**Before deploying fixes on December 8th**:

### Configuration
- [ ] Barbados geminiClient.gs says "Barbados" (not "Barbados & Tobago")
- [ ] Barbados location examples use Barbados places (not Trinidad)
- [ ] Barbados processor.gs writes 14 columns to Production
- [ ] `extractParish()` function added to Barbados processor.gs
- [ ] `sourceName` passed from Raw Articles to Production

### Triggers
- [ ] Trinidad RSS: Every hour at :00
- [ ] Trinidad Fetching: Every hour at :05
- [ ] Trinidad Processing: Every hour at :10
- [ ] Guyana RSS: Every hour at :20
- [ ] Guyana Fetching: Every hour at :25
- [ ] Guyana Processing: Every hour at :30
- [ ] Barbados RSS: Every hour at :40
- [ ] Barbados Fetching: Every hour at :45
- [ ] Barbados Processing: Every hour at :50

### Testing
- [ ] Test RSS collection on 1 article per country
- [ ] Verify Raw Articles sheet populated correctly
- [ ] Test article fetching on 1 article per country
- [ ] Verify Full Text column populated
- [ ] Test Gemini extraction on 1 article per country
- [ ] Verify JSON response valid with crimes array
- [ ] Test Production writing on 1 article per country
- [ ] Verify all 14 columns correct in Production sheet
- [ ] Check API quota usage (should be under 60/min)

### Production Sheet Verification (Barbados)
- [ ] Column 1 (Date): MM/DD/YYYY format
- [ ] Column 2 (Headline): Crime headline present
- [ ] Column 3 (Crime Type): Valid type from list
- [ ] Column 4 (Street): Street/landmark name
- [ ] Column 5 (Plus Code): Google Plus Code or empty
- [ ] Column 6 (Area): Neighborhood/town name
- [ ] Column 7 (Region): Parish name (Christ Church, St. Michael, etc.)
- [ ] Column 8 (Island): "Barbados"
- [ ] Column 9 (URL): Source article URL
- [ ] Column 10 (Source): News source name (Barbados Today, Nation News, etc.)
- [ ] Column 11 (Lat): Latitude coordinate
- [ ] Column 12 (Long): Longitude coordinate
- [ ] Column 13 (Summary): 2-3 sentence crime details
- [ ] Column 14 (Forward): Empty (manual column)

---

## 🚀 SCALING STRATEGY

**Current State** (Dec 2025):
- 3 countries: Trinidad, Guyana, Barbados
- 1 shared Gemini API key (60 req/min limit)
- Sequential processing prevents rate limit issues

**Near-Term Growth** (Add 4th country - Jamaica):
- Option 1: Add Jamaica to stagger schedule (process at :55)
- Option 2: Migrate to separate API keys (Option C)
- **Recommendation**: Migrate to Option C before adding 4th country

**Long-Term Growth** (5+ countries):
- **MUST** use separate API keys per country
- Each country gets dedicated 60 req/min quota
- Can process 30+ articles per country per hour
- Scales to 10+ countries without coordination

**API Key Strategy**:
```javascript
// Recommended: One Google Cloud project, multiple API keys
Project: crime-hotspots-caribbean
├── API Key 1: Trinidad (GEMINI_API_KEY_TRINIDAD)
├── API Key 2: Guyana (GEMINI_API_KEY_GUYANA)
├── API Key 3: Barbados (GEMINI_API_KEY_BARBADOS)
└── API Key 4: Jamaica (GEMINI_API_KEY_JAMAICA)
```

**Cost Considerations**:
- Gemini free tier: 60 req/min, 1500 req/day per key
- Current usage: ~30 articles/day per country = well within free tier
- At 5 countries: 150 articles/day total = still free
- Paid tier needed only if >10 countries or >300 articles/day

---

## 📊 MONITORING DASHBOARD

**Key Metrics to Track**:
1. **Backlog Size**: Articles in "ready_for_processing" status
2. **Processing Rate**: Articles/hour successfully processed
3. **Error Rate**: Failed articles / Total articles
4. **API Quota Usage**: Requests/minute to Gemini API
5. **Duplicate Rate**: Duplicates detected / Total crimes extracted

**Recommended Alert Thresholds**:
- Backlog > 50 articles: Email alert
- Error rate > 10%: Email alert
- API quota > 80%: Warning
- API quota > 95%: Critical alert

**Daily Summary Email**:
```javascript
function sendDailySummary() {
  // Run at 9 AM daily
  const summary = {
    trinidad: getCountrySummary('Trinidad'),
    guyana: getCountrySummary('Guyana'),
    barbados: getCountrySummary('Barbados')
  };

  const emailBody = `
Crime Hotspots Automation - Daily Summary

TRINIDAD:
- Articles processed: ${summary.trinidad.processed}
- Crimes extracted: ${summary.trinidad.crimes}
- Backlog: ${summary.trinidad.backlog}

GUYANA:
- Articles processed: ${summary.guyana.processed}
- Crimes extracted: ${summary.guyana.crimes}
- Backlog: ${summary.guyana.backlog}

BARBADOS:
- Articles processed: ${summary.barbados.processed}
- Crimes extracted: ${summary.barbados.crimes}
- Backlog: ${summary.barbados.backlog}

View spreadsheets:
- Trinidad: [URL]
- Guyana: [URL]
- Barbados: [URL]
  `;

  GmailApp.sendEmail(NOTIFICATION_EMAIL, 'Crime Hotspots - Daily Summary', emailBody);
}
```

---

## 📝 NOTES

**Updated**: December 5, 2025
**Next Review**: December 8, 2025 (after fixes deployed)
**Owner**: Kavell Forde
**Contact**: discover360news@gmail.com

**Related Documentation**:
- Trinidad: `google-apps-script/trinidad/README.md`
- Guyana: `google-apps-script/guyana/README.md`
- Barbados: `google-apps-script/barbados/README.md` (needs creation)
- Duplicate Detection: `docs/automation/DUPLICATE-DETECTION-ARCHIVE.md`
- Seizures Crime Type: `docs/automation/SEIZURES-CRIME-TYPE.md`

**Token Budget**: This audit consumed ~75K tokens. Full implementation plan will require additional tokens on December 8th.
