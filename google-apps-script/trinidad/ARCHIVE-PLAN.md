# Gemini Automation Archive Plan

**Date:** January 1, 2026
**Purpose:** Archive Gemini-related automation files (moving to manual workflow)
**Status:** `orchestrator.gs` MODIFIED (not archived) - Stages 1-3 kept, Stage 4 removed

---

## Files to KEEP (Core Filtering System)

### ✅ Modified Filtering Pipeline
- `orchestrator.gs` - **MODIFIED** (Stages 1-3 only, Stage 4 removed)
- `rssCollector.gs` - Collects headlines from news sites
- `articleFetcherImproved.gs` - Fetches article text (removes sidebars/ads)
- `preFilter.gs` - Keyword scoring + duplicate detection (saves ~80% manual review time!)
- `config.gs` - Configuration for RSS sources

### ✅ Social Media Stats (No Gemini)
- `socialMediaStats.gs` - Generates weekly/monthly stats for social media

### ✅ Blog Generation (Optional, uses existing data)
- `blogDataGenerator.gs` - Generates blog posts from existing crime data

### ✅ Utilities (General purpose)
- `geocoder.gs` - Geocoding utilities
- `plusCodeConverter.gs` - Plus code conversion
- `syncToLive.gs` - Sync data to production sheet
- `setupApiKey.gs` - API key setup (if still needed)

---

## Files to ARCHIVE (Gemini-dependent)

Create folder: `google-apps-script/trinidad/archive-gemini-2026-01-01/`

### 🗄️ Core Gemini Files
- `geminiClient.gs` - Gemini API client
- `processor.gs` - Crime data processor (uses Gemini for extraction)
- `crimeTypeProcessor.gs` - Crime type detection (uses Gemini)

### 🗄️ Test & Diagnostic Files
- `testSingleArticle.gs` - Test Gemini extraction on single article
- `diagnostics.gs` - Gemini diagnostics
- `deepDiagnostics.gs` - Gemini deep diagnostics
- `debugStatus.gs` - Debug status (Gemini-related)
- `clearTestData.gs` - Clear test data
- `resetFailedArticles.gs` - Reset failed Gemini processing
- `testPreFilter.gs` - Test pre-filter (Gemini-related)

### 🗄️ Throttling & Tracking (Gemini-specific)
- `throttlingManager.gs` - Gemini API throttling
- `apiUsageTracker.gs` - Gemini API usage tracking

### 🗄️ Pre-filtering (Gemini-related)
- `preFilter.gs` - Pre-filter articles before Gemini processing

### 🗄️ Validation Helpers (Gemini-related)
- `validationHelpers.gs` - Validation helpers for Gemini output

### 🗄️ Archive Scraper (Gemini-related)
- `archiveScraper.gs` - Archive scraping with Gemini processing

---

## Manual Archiving Steps

1. **Create archive folder:**
   ```
   google-apps-script/trinidad/archive-gemini-2026-01-01/
   ```

2. **Move files listed above** to the archive folder

3. **Create README in archive folder** documenting:
   - Date archived: January 1, 2026
   - Reason: Switched to manual data entry
   - How to restore: Copy files back to parent folder

4. **Keep these files in main folder:**
   - rssCollector.gs
   - config.gs
   - socialMediaStats.gs
   - blogDataGenerator.gs
   - geocoder.gs
   - plusCodeConverter.gs
   - syncToLive.gs
   - setupApiKey.gs

---

## New Manual Workflow (2026)

### Automated Filtering Pipeline (Runs Every 8 Hours)
**Function:** `runFullPipeline()` - **MODIFIED to skip Gemini Stage 4**

**Workflow:**
1. **Stage 1:** RSS Collection - Collects headlines from Trinidad news sites
2. **Stage 2:** Article Text Fetching - Fetches full article text (removes sidebars/ads)
3. **Stage 3:** Pre-Filtering - Keyword scoring + duplicate detection
   - Scores articles 0-100 based on crime keywords
   - Auto-filters non-crime articles (court cases, sports)
   - Checks for duplicates (80%+ similarity threshold)
   - Marks high-scoring articles (10+) as "ready_for_processing"
4. **Stage 4: MANUAL REVIEW (Replaces Gemini)**
   - Open "Raw Articles" sheet
   - Filter by status = "ready_for_processing"
   - Review high-scoring articles
   - Submit crimes via Google Form

**Time Savings:** Pre-filtering removes ~80% of non-crime articles automatically!

### Manual Data Entry
1. Review articles marked "ready_for_processing" in Raw Articles sheet
2. Fill out Google Form for confirmed crime incidents
3. Form submits → Google Sheet → CSV export → Site updates

---

## Recommendation (IMPLEMENTED)

**✅ Keep Intelligent Filtering Pipeline**
- Archive ONLY Gemini files (geminiClient.gs, processor.gs, crimeTypeProcessor.gs, etc.)
- Keep modified `orchestrator.gs` (Stages 1-3 only)
- Keep filtering system (rssCollector.gs, articleFetcherImproved.gs, preFilter.gs)
- Keep utilities (socialMediaStats.gs, blogDataGenerator.gs, geocoder.gs, etc.)

**Result:**
- Existing triggers keep working (same function name)
- ~80% of non-crime articles auto-filtered
- Manual review only for high-scoring likely crimes
- Full control over data accuracy

---

## Next Steps

1. Create archive folder
2. Move files (do this manually in Google Apps Script editor)
3. Update CLAUDE.md to document new manual workflow
4. Test manual form submission
5. Verify CSV export includes victimCount column

---

**Note:** Files are NOT deleted, just moved to archive. You can restore them anytime if needed.
