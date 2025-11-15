# Google Apps Script Automation

This folder contains all automation scripts for the Crime Hotspots platform.

## Structure

```
google-apps-script/
├── trinidad/          # Trinidad & Tobago automation
├── guyana/            # Guyana automation  
└── weekly-reports/    # Weekly blog post generation
```

## Trinidad & Tobago

**Status:** ✅ Production (100-120 articles/day)
**Sheet:** Crime Hotspots - Automation Pipeline
**Triggers:** RSS (2hr), Fetcher (1hr), Processor (1hr)

**Files:** See `trinidad/README.md` for complete documentation

## Guyana

**Status:** ✅ Production (launched Nov 15, 2025)
**Sheet:** Crime Hotspots - Guyana Data
**Triggers:** RSS (2hr), Fetcher (1hr), Processor (1hr)

**Setup:** See `guyana/SEPARATE-SCRIPTS-SETUP.md`

## Weekly Reports

**Status:** ✅ Ready (first run Nov 18, 2025)
**Trigger:** Every Monday at 10 AM
**Output:** Markdown blog posts committed to GitHub

**Documentation:** `weekly-reports/WEEKLY-REPORT-SAFEGUARDS.md`

## Adding a New Country

1. Create new folder: `google-apps-script/barbados/`
2. Copy scripts from `trinidad/`
3. Update `config.gs` with Barbados RSS feeds
4. Set up Google Sheet with required tabs
5. Configure 3 triggers
6. Add API key to Script Properties

See `trinidad/README.md` for detailed setup instructions.
