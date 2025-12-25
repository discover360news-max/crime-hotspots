# Local Tools - Archive Scrapers

Quick reference for archive scraping tools.

**⚠️ CRITICAL:** Scraped URLs require manual review before adding to Raw Articles sheet.

---

## Quick Start

### Python Scraper (Recommended for Backfill)

```bash
# Install dependencies
pip install requests beautifulsoup4 pandas lxml

# Scrape all sources with scoring
python archive-scraper.py --source all --score --output archive_review.csv

# Cross-reference with existing data
python archive-scraper.py \
  --source all \
  --cross-reference existing_urls.csv \
  --score \
  --output missing_urls.csv
```

### Playwright Scraper (For JavaScript-Heavy Sites)

```bash
# Install dependencies
npm install playwright csv-writer commander
npx playwright install chromium

# Scrape with visual browser (for debugging)
node archive-scraper-playwright.js --source all --headless false --output archive_review.csv

# Scrape in headless mode with scoring
node archive-scraper-playwright.js --source all --score --output archive_review.csv
```

### Google Apps Script (For Ongoing Monitoring)

1. Copy `google-apps-script/trinidad/archiveScraper.gs` to Apps Script
2. Run `scrapeAllArchives()`
3. Review "Archive Review" sheet in Google Sheets
4. Approve/reject URLs
5. Run `processApprovedArchiveUrls()`

---

## File Descriptions

- **archive-scraper.py** - Python/BeautifulSoup scraper (fast, efficient)
- **archive-scraper-playwright.js** - Playwright scraper (handles JavaScript)
- **README.md** - This file

---

## Output Format

All scrapers create CSV files with these columns:

```
URL | Source | Date Found | Status | Pre-filter Score | Title | Notes
```

**Manual Review Required:** Set Status to "Approved" or "Rejected" before processing.

---

## Full Documentation

See `/docs/automation/ARCHIVE-SCRAPING-GUIDE.md` for:
- Complete usage examples
- Command-line options
- Pre-filter scoring details
- Troubleshooting guide
- Workflow recommendations
- Performance benchmarks

---

## Quick Examples

**Trinidad Express only (50 pages):**
```bash
python archive-scraper.py --source express --max-pages 50 --output express.csv
```

**Guardian TT for 2025:**
```bash
python archive-scraper.py \
  --source guardian \
  --start-date 2025-01-01 \
  --end-date 2025-12-13 \
  --output guardian_2025.csv
```

**All sources with scoring:**
```bash
python archive-scraper.py --source all --score --output scored.csv
```

**Playwright with visual browser:**
```bash
node archive-scraper-playwright.js --source all --headless false
```

---

**Tip:** Start with 10-20 pages to test before running full scrapes.
