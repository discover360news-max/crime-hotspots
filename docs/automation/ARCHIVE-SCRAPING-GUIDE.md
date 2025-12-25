# Archive Scraping Guide - Trinidad News Sources

**Last Updated:** December 13, 2025
**Purpose:** Backfill missing crime articles from Trinidad Express, Guardian TT, and Newsday archives

---

## ⚠️ CRITICAL: Manual Review Required

**DO NOT auto-add scraped URLs to Raw Articles sheet.**

### Why Manual Review?

1. **Facebook Sources:** We also collect news from Facebook (Ian Alleyne Network, DJ Sherrif)
2. **False Positives:** Archive scraping finds ALL articles, not just crime incidents
3. **Non-Crime Content:** Political statements, court cases, international news, etc.
4. **Quality Control:** Backfill data requires higher verification standards

### Workflow

```
1. Run scraper → 2. Review CSV/Sheet → 3. Approve URLs → 4. Add to Raw Articles
```

---

## Three Scraping Solutions

We provide **three different scraping tools** to handle different scenarios:

| Tool | Best For | Pros | Cons |
|------|----------|------|------|
| **Google Apps Script** | Running directly in Google Sheets | No local setup, auto-writes to sheet, scheduled execution | 6-min runtime limit, slower |
| **Python** | Large-scale scraping, data analysis | Fast, powerful, CSV export, cross-referencing | Requires Python installed |
| **Playwright** | JavaScript-heavy sites, verification | Handles dynamic content, screenshots, visual debugging | Slowest, requires Node.js |

**Recommendation:** Start with Python for initial backfill, then use Google Apps Script for ongoing monitoring.

---

## Solution 1: Google Apps Script

### Location
`google-apps-script/trinidad/archiveScraper.gs`

### Setup

1. **Copy to Google Apps Script:**
   - Open your Trinidad Google Sheet
   - Extensions → Apps Script
   - Create new file: `archiveScraper.gs`
   - Paste code
   - Save

2. **First Run:**
   ```javascript
   // Run this in Apps Script Editor
   scrapeAllArchives()
   ```

3. **Review Results:**
   - New sheet created: "Archive Review"
   - Columns: URL | Source | Date Found | Status | Pre-filter Score | Notes
   - Status = "Pending Review" (yellow background)

4. **Manual Review Process:**
   - Review each URL
   - Set status to "Approved" (green) or "Rejected" (red)
   - Add notes if needed

5. **Process Approved URLs:**
   ```javascript
   // Run this after approving URLs
   processApprovedArchiveUrls()
   ```
   - Adds approved URLs to Raw Articles sheet
   - Updates Archive Review status to "Processed"

### Functions Reference

```javascript
// Main scraping function
scrapeAllArchives()
// Returns: { totalScraped, uniqueUrls, missingUrls }

// Scrape individual sources
scrapeTrinidadExpress()
scrapeGuardian()
scrapeNewsday()

// Score URLs with pre-filter logic
scoreArchiveUrls()

// Process approved URLs
processApprovedArchiveUrls()

// Utility: Scrape specific date range
scrapeGuardianDateRange('2025-01-01', '2025-12-13')
```

### Configuration

Edit `ARCHIVE_CONFIG` to adjust:
```javascript
const ARCHIVE_CONFIG = {
  TRINIDAD_EXPRESS: {
    maxPages: 50  // Increase for deeper scraping
  },
  NEWSDAY: {
    maxPages: 50  // Increase for deeper scraping
  }
};
```

### Limitations

- **6-minute runtime limit** - May not complete all sources in one run
- **Solution:** Run each source separately:
  ```javascript
  scrapeTrinidadExpress()
  scrapeGuardian()
  scrapeNewsday()
  ```

---

## Solution 2: Python (BeautifulSoup)

### Location
`local-tools/archive-scraper.py`

### Setup

1. **Install Dependencies:**
   ```bash
   cd "/Users/kavellforde/Documents/Side Projects/Crime Hotspots/local-tools"
   pip install requests beautifulsoup4 pandas lxml
   ```

2. **Make Executable:**
   ```bash
   chmod +x archive-scraper.py
   ```

### Usage Examples

**Scrape All Sources:**
```bash
python archive-scraper.py --source all --output archive_review.csv
```

**Scrape Trinidad Express Only (100 pages):**
```bash
python archive-scraper.py --source express --max-pages 100 --output express_urls.csv
```

**Scrape Guardian TT for 2025:**
```bash
python archive-scraper.py \
  --source guardian \
  --start-date 2025-01-01 \
  --end-date 2025-12-13 \
  --output guardian_2025.csv
```

**Scrape Newsday with Pre-filter Scoring:**
```bash
python archive-scraper.py \
  --source newsday \
  --max-pages 50 \
  --score \
  --output newsday_scored.csv
```

**Cross-reference with Existing Data:**
```bash
# First, export existing URLs from Production sheet to CSV
# Then run:
python archive-scraper.py \
  --source all \
  --cross-reference existing_urls.csv \
  --output missing_urls.csv
```

### Command-Line Options

```
--source <express|guardian|newsday|all>  # News source to scrape
--max-pages <number>                     # Max pages for pagination sources (default: 50)
--start-date <YYYY-MM-DD>                # Start date for Guardian scraping
--end-date <YYYY-MM-DD>                  # End date for Guardian scraping
--output <file.csv>                      # Output CSV file (default: archive_review.csv)
--cross-reference <file.csv>             # Cross-reference with existing URLs
--score                                  # Fetch titles and calculate scores (slower)
--delay <seconds>                        # Delay between requests (default: 1.0)
```

### Output CSV Format

```csv
URL,Source,Date Found,Status,Pre-filter Score,Title,Notes
https://trinidadexpress.com/.../article_abc.html,Trinidad Express,2025-12-13,Pending Review,15,Man shot in Laventille,
https://guardian.co.tt/.../article-xyz,Guardian TT,2025-12-13,Pending Review,-5,Rowley speaks about crime,False positive
```

### Manual Review Process

1. Open `archive_review.csv` in Excel/Google Sheets
2. Review URLs with high pre-filter scores first (>10 = likely crime)
3. Set Status to "Approved" or "Rejected"
4. Add notes for rejected URLs (helps improve pre-filter)
5. Export approved URLs to separate CSV
6. Manually add to Raw Articles sheet

---

## Solution 3: Playwright (JavaScript)

### Location
`local-tools/archive-scraper-playwright.js`

### Setup

1. **Install Dependencies:**
   ```bash
   cd "/Users/kavellforde/Documents/Side Projects/Crime Hotspots/local-tools"
   npm install playwright csv-writer commander
   npx playwright install chromium
   ```

2. **Make Executable:**
   ```bash
   chmod +x archive-scraper-playwright.js
   ```

### Usage Examples

**Scrape All Sources (Headless Mode):**
```bash
node archive-scraper-playwright.js --source all --output archive_review.csv
```

**Scrape with Visual Browser (Non-Headless):**
```bash
node archive-scraper-playwright.js \
  --source all \
  --headless false \
  --output archive_review.csv
```

**Scrape Trinidad Express with Scoring:**
```bash
node archive-scraper-playwright.js \
  --source express \
  --max-pages 50 \
  --score \
  --output express_scored.csv
```

**Scrape Guardian for Specific Date Range:**
```bash
node archive-scraper-playwright.js \
  --source guardian \
  --start-date 2024-01-01 \
  --end-date 2025-12-13 \
  --output guardian_backfill.csv
```

**Cross-reference and Score:**
```bash
node archive-scraper-playwright.js \
  --source all \
  --cross-reference existing_urls.csv \
  --score \
  --delay 2000 \
  --output missing_scored.csv
```

### Command-Line Options

```
-s, --source <express|guardian|newsday|all>  # News source to scrape
-m, --max-pages <number>                     # Max pages (default: 50)
--start-date <YYYY-MM-DD>                    # Start date for Guardian
--end-date <YYYY-MM-DD>                      # End date for Guardian
-o, --output <file.csv>                      # Output CSV file
-c, --cross-reference <file.csv>             # Cross-reference with existing URLs
--score                                      # Fetch titles and calculate scores
--headless <true|false>                      # Headless mode (default: true)
-d, --delay <ms>                             # Delay between requests (default: 1000)
```

### Advantages Over Other Methods

1. **JavaScript Rendering:** Handles dynamic content that Python can't
2. **Visual Debugging:** Run with `--headless false` to see browser actions
3. **Screenshots:** Can capture screenshots for verification (modify code)
4. **Better Anti-Bot Detection:** More human-like behavior

---

## Pre-filter Scoring System

All three tools support **optional pre-filter scoring** to help prioritize manual review.

### How Scoring Works

**Positive Keywords (+5 points each):**
- murder, kill, shot, robbery, rape, assault, kidnap, theft, burglary, shooting, stabbing, crime, police, victim, arrested

**Negative Keywords (-5 points each):**
- minister, rowley, court, case collapse, venezuela, election, parliament, festival, carnival, sports, cricket

### Score Interpretation

| Score | Likelihood | Review Priority |
|-------|------------|-----------------|
| **15+** | Very likely crime | Review first ✅ |
| **10-14** | Likely crime | Review second |
| **5-9** | Possibly crime | Review third |
| **0-4** | Unlikely crime | Review last |
| **<0** | Non-crime | Probably reject ❌ |

### Example Scores

```
+20: "Man shot dead in Laventille robbery" → APPROVED
+15: "Police arrest murder suspect" → APPROVED
+5:  "Shooting reported near school" → Review needed
-5:  "Minister speaks about crime" → REJECTED (political)
-10: "Court case collapses" → REJECTED (legal proceedings)
```

---

## Recommended Workflow

### Phase 1: Initial Backfill (One-Time)

**Goal:** Find all missing URLs from 2025 and 2024

1. **Export existing URLs from Production sheet:**
   - Download Production sheet as CSV
   - Save as `existing_urls.csv`

2. **Run Python scraper with cross-referencing:**
   ```bash
   python archive-scraper.py \
     --source all \
     --cross-reference existing_urls.csv \
     --score \
     --output backfill_2025.csv
   ```

3. **Manual review:**
   - Open `backfill_2025.csv` in Google Sheets
   - Sort by Pre-filter Score (highest first)
   - Review URLs, set Status to Approved/Rejected
   - Add notes for pattern recognition

4. **Process approved URLs:**
   - Filter Status = "Approved"
   - Copy URLs to new sheet
   - Manually add to Raw Articles with source = "Archive Backfill"
   - Let automation process as normal

### Phase 2: Historical Archives (Optional)

**Goal:** Scrape 2023, 2022, earlier years

1. **Guardian TT (date-based):**
   ```bash
   python archive-scraper.py \
     --source guardian \
     --start-date 2023-01-01 \
     --end-date 2023-12-31 \
     --cross-reference existing_urls.csv \
     --output guardian_2023.csv
   ```

2. **Trinidad Express & Newsday (pagination):**
   ```bash
   # Increase max-pages to go deeper
   python archive-scraper.py \
     --source express \
     --max-pages 200 \
     --cross-reference existing_urls.csv \
     --output express_deep.csv
   ```

3. **Manual review and processing** (same as Phase 1)

### Phase 3: Ongoing Monitoring (Monthly)

**Goal:** Catch any missed articles from current month

1. **Use Google Apps Script for automation:**
   - Add time-based trigger (monthly)
   - Run `scrapeAllArchives()`
   - Review Archive Review sheet
   - Process approved URLs

2. **Quick monthly check:**
   ```bash
   # Check last 30 days for Guardian
   python archive-scraper.py \
     --source guardian \
     --start-date 2025-11-13 \
     --end-date 2025-12-13 \
     --cross-reference existing_urls.csv \
     --output monthly_check.csv
   ```

---

## Troubleshooting

### Google Apps Script

**Error: "Exceeded maximum execution time"**
- **Cause:** 6-minute runtime limit
- **Solution:** Run sources separately
  ```javascript
  scrapeTrinidadExpress()  // Run 1
  scrapeGuardian()         // Run 2
  scrapeNewsday()          // Run 3
  ```

**Error: "Service invoked too many times"**
- **Cause:** Too many UrlFetchApp calls
- **Solution:** Reduce `maxPages` in config or run during off-peak hours

**No URLs found**
- **Cause:** URL pattern changed or site structure updated
- **Solution:** Update `urlPattern` regex in `ARCHIVE_CONFIG`

### Python

**Error: "ModuleNotFoundError"**
- **Cause:** Missing dependencies
- **Solution:**
  ```bash
  pip install requests beautifulsoup4 pandas lxml
  ```

**Error: "Connection timeout"**
- **Cause:** Network issues or rate limiting
- **Solution:** Increase `--delay` to 2-3 seconds

**Empty CSV output**
- **Cause:** Incorrect selectors or changed site structure
- **Solution:** Update `url_pattern` regex in `CONFIG`

### Playwright

**Error: "Browser not installed"**
- **Cause:** Chromium not installed
- **Solution:**
  ```bash
  npx playwright install chromium
  ```

**Error: "Timeout waiting for selector"**
- **Cause:** Page structure changed or slow loading
- **Solution:** Run with `--headless false` to see what's happening

**Slow performance**
- **Cause:** Waiting for full page loads
- **Solution:** Increase `--delay` or modify code to use faster `waitUntil` options

---

## Pre-filter Enhancement for Non-News

Based on your request to improve non-news filtering, here's how to enhance the pre-filter:

### For Google Apps Script

Edit `google-apps-script/trinidad/preFilter.gs`:

```javascript
// Add to negative keywords section
const NEGATIVE_KEYWORDS = {
  // Existing keywords...

  // Political/Government (weight: -10)
  'minister': -10,
  'rowley': -10,
  'prime minister': -10,
  'parliament': -10,
  'election': -8,
  'political': -8,

  // Court/Legal (weight: -8)
  'court': -8,
  'case collapse': -10,
  'case dismissed': -10,
  'acquitted': -8,
  'judgment': -8,

  // International (weight: -10)
  'venezuela': -10,
  'us seizes': -10,
  'foreign': -8,

  // Cultural/Entertainment (weight: -8)
  'carnival': -8,
  'festival': -8,
  'christmas': -6,
  'celebration': -6,

  // Sports (weight: -10)
  'cricket': -10,
  'football': -10,
  'match': -8,
  'tournament': -8
};

// Add pattern exclusions
const TITLE_EXCLUSIONS = [
  /minister.*speak/i,
  /rowley.*say/i,
  /court.*dismiss/i,
  /case.*collapse/i,
  /belong.*venezuela/i,
  /us seize/i,
  /^christmas/i,
  /carnival/i,
  /cricket|football|sports/i
];

// In scoring function, add:
function calculatePrefilterScore(title, content) {
  // ... existing logic ...

  // Check title exclusions
  for (const pattern of TITLE_EXCLUSIONS) {
    if (pattern.test(title)) {
      return -100; // Auto-reject
    }
  }

  // ... rest of scoring ...
}
```

### For Python & Playwright

Edit the `NON_CRIME_KEYWORDS` list:

```python
NON_CRIME_KEYWORDS = [
    # Political/Government
    'minister', 'rowley', 'prime minister', 'parliament', 'election', 'political',

    # Court/Legal
    'court', 'case collapse', 'case dismissed', 'acquitted', 'judgment',

    # International
    'venezuela', 'us seizes', 'foreign',

    # Cultural/Entertainment
    'carnival', 'festival', 'christmas', 'celebration',

    # Sports
    'cricket', 'football', 'match', 'tournament', 'sports'
]

# Add title pattern exclusions
TITLE_EXCLUSIONS = [
    r'minister.*speak',
    r'rowley.*say',
    r'court.*dismiss',
    r'case.*collapse',
    r'belong.*venezuela',
    r'us seize',
    r'^christmas',
    r'carnival',
    r'cricket|football|sports'
]
```

---

## Performance Benchmarks

Based on typical Trinidad news archives:

| Tool | Source | URLs/Hour | Cost | Best For |
|------|--------|-----------|------|----------|
| **Google Apps Script** | All 3 | ~300-500 | Free | Ongoing monitoring |
| **Python** | All 3 | ~1,000-2,000 | Free | Large-scale backfill |
| **Playwright** | All 3 | ~500-800 | Free | JavaScript-heavy sites |

**Estimated backfill times:**

- **2025 Articles (Jan-Dec):** 1-2 hours (Python recommended)
- **2024 Articles:** 2-3 hours (Python recommended)
- **2023 Articles:** 2-3 hours (Python recommended)
- **Total 3-year backfill:** 6-8 hours spread across multiple runs

---

## Next Steps

1. **Choose your tool:**
   - Quick test: Google Apps Script
   - Large backfill: Python
   - JavaScript sites: Playwright

2. **Start small:**
   - Test with 10 pages first
   - Verify CSV output
   - Adjust scoring thresholds

3. **Scale up:**
   - Increase page limits
   - Add cross-referencing
   - Enable scoring

4. **Establish workflow:**
   - Regular monthly checks
   - Improve pre-filter based on rejections
   - Track approval rates

---

**Questions?** Review the code comments in each scraper file for detailed implementation notes.
