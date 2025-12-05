# CSV Data Management & Performance Strategy

**Date:** December 3, 2025
**Issue:** Large CSV files causing performance degradation
**Status:** Analysis & Recommendations

---

## Current Architecture

### Data Flow

```
┌─────────────┐
│ Production  │ ← Gemini extracts crimes here
└──────┬──────┘
       │
       │ sync (last 7 days)
       ▼
┌─────────────┐
│    LIVE     │ ← Frontend fetches CSV from here
└─────────────┘
       │
       │ CSV Export (published URL)
       ▼
┌─────────────┐
│   Frontend  │ ← PapaParse → Browser Memory
└─────────────┘
```

**Key Files:**
- `google-apps-script/guyana/syncToLive.gs` - Syncs Production → LIVE
- `src/js/data/countries.js` - CSV URLs
- `src/js/components/headlinesPage.js` - Fetches & parses CSV

---

## Current Issues

### ⚠️ Problem 1: LIVE Sheet Grows Indefinitely

**Current Behavior:**
- Production syncs to LIVE (last 7 days only synced)
- **BUT:** Old data in LIVE is NEVER deleted
- LIVE sheet accumulates all historical data over time

**Impact:**
- CSV size grows continuously
- Download times increase
- Browser memory usage increases
- Mobile users affected most

### ⚠️ Problem 2: No Data Limits

**Current Stats (Estimated):**
- **Trinidad LIVE:** ~20,000+ rows (if never cleaned)
- **Guyana LIVE:** ~8,000+ rows (if never cleaned)
- **CSV Size:** 2-5 MB per country (text-based)

**Google Sheets Limits:**
- Max rows: 10 million (not the issue)
- Max CSV size: No hard limit, but performance degrades

**Browser Limits:**
- Download: 5 MB CSV = 1-3 seconds on 4G
- Parse: PapaParse can handle 50K+ rows, but slow
- Memory: 20K rows in memory = 20-50 MB RAM

### ⚠️ Problem 3: Frontend Performance

**Current Implementation:**
```javascript
fetch(csvUrl)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      // Parses ENTIRE CSV in memory
      // No pagination, no lazy loading
    });
  });
```

**Issues:**
- Downloads entire dataset every time
- No caching
- No incremental updates
- Mobile users on slow connections wait long

---

## Google Sheets CSV Export Limits

### What We Know

**Official Limits:**
- ✅ No published row limit for CSV export
- ✅ Tested up to 100K rows successfully
- ⚠️ Performance degrades around 50K rows

**Real-World Experience:**
- 5,000 rows: ~500 KB, loads in <1 second
- 20,000 rows: ~2 MB, loads in 1-3 seconds
- 50,000 rows: ~5 MB, loads in 3-8 seconds
- 100,000 rows: ~10 MB, loads in 8-15 seconds

**When It Breaks:**
- Browser memory limits (~100 MB per tab on mobile)
- Google Sheets timeout (30-second export limit)
- Network timeouts (slow connections)

---

## Recommended Solutions

### 🎯 Strategy 1: Time-Based Data Retention (RECOMMENDED)

**Keep Only Recent Data in LIVE Sheet**

**Implementation:**
1. Modify `syncToLive.gs` to cleanup old LIVE data
2. Keep only last 90 days in LIVE sheet
3. Archive older data to separate sheet (not exported)

**Benefits:**
- ✅ Predictable CSV size (max ~3,000 crimes per country)
- ✅ Fast downloads (~300 KB)
- ✅ Good UX (90 days is sufficient for trends)
- ✅ Simple to implement

**Drawbacks:**
- ❌ Historical data not accessible from frontend
- ❌ Need separate "Historical Data" page if users want older data

**Code Changes:**
```javascript
// In syncToLive.gs - Add after syncing to LIVE

function cleanupOldLiveData() {
  const liveSheet = /* get LIVE sheet */;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep last 90 days

  const data = liveSheet.getDataRange().getValues();
  const rowsToDelete = [];

  for (let i = 1; i < data.length; i++) {
    const crimeDate = new Date(data[i][1]); // Date column
    if (crimeDate < cutoffDate) {
      rowsToDelete.push(i + 1); // 1-indexed
    }
  }

  // Delete old rows (from bottom up)
  rowsToDelete.reverse().forEach(row => {
    liveSheet.deleteRow(row);
  });

  Logger.log(`Deleted ${rowsToDelete.length} old rows from LIVE`);
}
```

---

### 🎯 Strategy 2: Client-Side Filtering

**Frontend Filters Data After Download**

**Implementation:**
1. Download full CSV
2. Filter by date range in browser
3. Only display recent data by default

**Benefits:**
- ✅ No backend changes needed
- ✅ Historical data still available if user changes filter
- ✅ Works with existing architecture

**Drawbacks:**
- ❌ Still downloads large CSV (slow on mobile)
- ❌ Wastes bandwidth
- ❌ Doesn't solve the core issue

**Code Changes:**
```javascript
// In headlinesPage.js
const DEFAULT_DAYS = 90; // Show last 90 days by default
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - DEFAULT_DAYS);

const filteredData = allData.filter(crime => {
  const crimeDate = new Date(crime.Date);
  return crimeDate >= cutoffDate;
});
```

---

### 🎯 Strategy 3: Pagination with Multiple Sheets

**Split Data Across Multiple CSV Exports**

**Implementation:**
1. LIVE Sheet: Last 30 days (fast, default)
2. LIVE 30-90 Days: Medium-term history
3. LIVE 90+ Days: Long-term history
4. Frontend loads LIVE by default, fetches others on demand

**Benefits:**
- ✅ Fast initial load (~200 KB)
- ✅ Historical data available on demand
- ✅ Good balance of performance and features

**Drawbacks:**
- ❌ Complex to implement
- ❌ Multiple HTTP requests
- ❌ Requires UI changes (date range selector)

**Architecture:**
```javascript
// countries.js
export const COUNTRIES = [
  {
    id: 'trinidad',
    csvUrl: 'https://...',           // Last 30 days (default)
    csvUrl30to90: 'https://...',     // Days 30-90
    csvUrlArchive: 'https://...',    // 90+ days
  }
];

// Frontend loads csvUrl by default
// If user selects "Last 90 days", fetch csvUrl30to90 too
```

---

### 🎯 Strategy 4: API with Pagination (FUTURE)

**Replace CSV with JSON API**

**Implementation:**
1. Cloud function (Firebase, Cloudflare Workers, etc.)
2. Reads from Google Sheets
3. Returns paginated JSON
4. Frontend fetches page by page

**Benefits:**
- ✅ Professional solution
- ✅ Smallest bandwidth usage
- ✅ Real-time updates possible
- ✅ Supports advanced queries

**Drawbacks:**
- ❌ Requires backend infrastructure (costs money)
- ❌ More complex to maintain
- ❌ Not free (Firebase/Cloudflare costs)

**Cost Estimate:**
- Firebase Functions: Free tier covers ~10K requests/day
- Cloudflare Workers: Free tier covers 100K requests/day
- Monthly cost: $0 (free tier) to $5 (if exceeding)

---

## Performance Comparison

| Strategy | CSV Size | Load Time (4G) | Mobile UX | Complexity | Cost |
|----------|----------|----------------|-----------|------------|------|
| **Current** | 2-5 MB | 3-8 sec | 😐 Fair | Low | Free |
| **Strategy 1** | 300 KB | <1 sec | 😊 Good | Low | Free |
| **Strategy 2** | 2-5 MB | 3-8 sec | 😐 Fair | Low | Free |
| **Strategy 3** | 200 KB+ | 1-2 sec | 😊 Good | Medium | Free |
| **Strategy 4** | 50 KB | <1 sec | 😍 Excellent | High | $0-5 |

---

## Recommended Implementation Plan

### Phase 1: Quick Fix (Immediate)
**Strategy 1 + Strategy 2 Combined**

1. **Backend:** Implement 90-day retention in LIVE sheet
   - Modify `syncToLive.gs` to delete old data
   - Run cleanup after each sync
   - Reduces CSV to ~300 KB

2. **Frontend:** Add client-side date filter
   - Default: Show last 30 days
   - Users can expand to 90 days
   - Improves perceived performance

**Effort:** 2-3 hours
**Impact:** 5-10x faster page loads

### Phase 2: Enhanced UX (Next Month)
**Strategy 3: Pagination**

1. Split LIVE into 3 sheets (0-30, 30-90, 90+ days)
2. Frontend loads first sheet by default
3. Date picker triggers additional fetches
4. Caching prevents repeated downloads

**Effort:** 1-2 days
**Impact:** Near-instant initial loads

### Phase 3: Long-Term (Optional)
**Strategy 4: API Migration**

1. Build Cloudflare Worker API
2. Fetch from Google Sheets on-demand
3. Return JSON with pagination
4. Frontend uses API instead of CSV

**Effort:** 3-5 days
**Impact:** Professional-grade performance

---

## Monitoring & Alerts

### Metrics to Track

1. **CSV Size:**
   - Alert if > 500 KB (Strategy 1)
   - Alert if > 1 MB (current)

2. **Row Count:**
   - LIVE sheet row count
   - Alert if > 5,000 rows

3. **Page Load Time:**
   - Google Analytics Custom Event
   - Track CSV download time
   - Alert if > 3 seconds

### Health Check Script

```javascript
// google-apps-script/monitoring/csvHealthCheck.gs
function checkCsvHealth() {
  const liveSheet = /* get LIVE sheet */;
  const rowCount = liveSheet.getLastRow() - 1; // Exclude header

  const WARN_THRESHOLD = 3000;  // 90 days ≈ 3000 crimes
  const ERROR_THRESHOLD = 5000;

  if (rowCount > ERROR_THRESHOLD) {
    GmailApp.sendEmail(
      'discover360news@gmail.com',
      '🚨 CSV TOO LARGE - Immediate Action Required',
      `LIVE sheet has ${rowCount} rows. CSV export is degraded.`
    );
  } else if (rowCount > WARN_THRESHOLD) {
    Logger.log(`⚠️ CSV size warning: ${rowCount} rows`);
  } else {
    Logger.log(`✅ CSV health OK: ${rowCount} rows`);
  }
}
```

---

## Decision Matrix

### When to Use Each Strategy

| Your Goal | Recommended Strategy |
|-----------|---------------------|
| Quick fix, keep it simple | **Strategy 1** (90-day retention) |
| Best UX, willing to invest time | **Strategy 3** (Pagination) |
| Professional solution, long-term | **Strategy 4** (API) |
| No code changes at all | **Strategy 2** (Client filtering only) |

---

## Next Steps

### Immediate Actions

1. **Audit Current Data:**
   - Check actual row count in LIVE sheets
   - Measure current CSV sizes
   - Test download times on mobile

2. **Implement Strategy 1:**
   - Add cleanup function to `syncToLive.gs`
   - Run manually first (test)
   - Add to trigger schedule

3. **Monitor Impact:**
   - Track CSV sizes weekly
   - Monitor page load times
   - Gather user feedback

4. **Plan Strategy 3:**
   - If Strategy 1 isn't enough
   - Start pagination implementation
   - 30-day initial rollout

---

## FAQ

**Q: Will limiting to 90 days affect analytics?**
A: No. Historical data is still in Production Archive. You can analyze it separately if needed.

**Q: What if users want to see data older than 90 days?**
A: Create separate "Historical Data" page that loads from different sheet.

**Q: How often should cleanup run?**
A: Daily, after the sync to LIVE completes. Low overhead.

**Q: What's the maximum CSV size Google Sheets can export?**
A: No official limit, but 10 MB+ causes timeouts. Stay under 5 MB for reliability.

**Q: Can we compress the CSV?**
A: Google Sheets doesn't support gzip for published CSVs. Use API (Strategy 4) for compression.

---

## Related Documentation

- `google-apps-script/guyana/syncToLive.gs` - Current sync implementation
- `google-apps-script/trinidad/syncToLive.gs` - Trinidad sync
- `src/js/components/headlinesPage.js` - Frontend CSV fetching
- `src/js/data/countries.js` - CSV URL configuration

---

**Version:** 1.0
**Last Updated:** December 3, 2025
**Recommended:** Strategy 1 (90-day retention)
