# Project Memory - Crime Hotspots Trinidad Pre-Filter System

**Last Updated:** December 9, 2025
**Status:** Building pre-filter to reduce Gemini API calls from 130/day → 20/day

---

## 🎯 Current Focus

**Goal:** Implement keyword-based pre-filtering system to stay within Gemini free tier (20 requests/day)

**What We're Building:**
- Pre-filter stage checks articles BEFORE Gemini calls
- Keyword scoring system (configurable via Google Sheets)
- 4-sheet duplicate detection (Raw, Raw Archive, Production, Production Archive)
- Manual review system to catch false negatives

**Expected Impact:** 82% API call reduction (141 calls → 26 calls per day)

---

## 📋 Active Tasks (MAX 10)

### Claude's Tasks (0/5)

### Kavell's Tasks - URGENT FIX (0/5)



---

## ✅ Recently Completed (Last 5)

1. ✅ Fixed orchestrator stage independence bug (Kavell spotted, Claude fixed)
   - Problem: If RSS finds 0 new articles, entire pipeline exits
   - Root cause: Stages checked previous results instead of status
   - Solution: Each stage now checks for articles with ITS OWN status
   - Impact: Pipeline resumes from any point, processes backlog
   - Example: RSS finds 0 new, but fetches/filters/processes articles from previous runs

2. ✅ Created master orchestrator for production (Claude)
   - Single function runs entire 4-stage pipeline
   - Each stage checks status independently (resume-able)
   - Comprehensive logging and error handling
   - Created TRIGGER-SETUP.md guide for go-live

3. ✅ Enhanced RSS duplicate detection (Kavell spotted, Claude fixed)
   - Problem: Same story with different URLs both collected (e.g., url-2/ vs url/)
   - Root cause: isDuplicate() only checked exact URL match
   - Solution: Added headline similarity check (80%+ = duplicate)
   - Impact: Catches same story republished with slight URL variations
   - Function: Levenshtein distance algorithm for string similarity

4. ✅ Pre-filter system tested successfully with fresh data (Kavell)
   - collectAllFeeds() ran successfully with fresh RSS
   - fetchPendingArticlesImproved() fetched article text
   - preFilterArticles() marked articles as ready_for_processing or filtered_out
   - System working end-to-end!

5. ✅ Fixed critical self-duplicate detection bug (Kavell spotted, Claude fixed)
   - Problem: Articles in Raw Articles were matching themselves → 100% flagged as duplicates
   - Root cause: checkForRawArticleDuplicate was checking urlIndex.rawArticles.includes(url)
   - Solution: Skip Raw Articles check, only check Archive/Production/Production Archive
   - Impact: System now correctly identifies only TRUE duplicates

---

## 💡 Lessons Learned

### Technical Discoveries

1. **CacheService has 100 KB limit per key**
   - Problem: Combined URL index (1990 URLs) = ~150 KB
   - Solution: Cache only small sheets, read large ones on-demand
   - Future-proof: Production Archive will grow, so don't cache it

2. **Google Sheets exact names matter (no fuzzy matching)**
   - "Raw Articles Archive" ≠ "Raw Articles - Archive"
   - Always verify sheet names with `debugRawArchiveSheet()` function

3. **Gemini rewrites headlines (breaks similarity matching)**
   - Original headline: "Businesswoman duped into giving $28,000..."
   - Gemini headline: "Fraud: Woman loses $28,000 in counterfeit scheme"
   - Solution: Use URL matching primarily, headline similarity as backup

4. **Keyword scoring needs fraud-specific terms**
   - "business" keyword (-10) filtered out business-related crimes
   - Need specific keywords: fraud, scam, duped, counterfeit, etc.
   - Broad excludes (business, court, sports) can cause false negatives

5. **Multi-sheet duplicate detection is essential**
   - Articles can be duplicates in:
     - Raw Articles Archive (historical batches)
     - Production (already processed)
     - Production Archive (processed & archived)
   - Check all 3 sheets to prevent duplicates slipping through

6. **CRITICAL: Don't check a sheet against itself for duplicates!**
   - Bug: Articles in Raw Articles were matching themselves → 100% flagged as duplicates
   - Spotted by Kavell: "None was sent to production because duplicates filtered first"
   - Root cause: `urlIndex.rawArticles.includes(url)` finds the article's own URL
   - Solution: Skip checking Raw Articles, only check Archive/Production sheets
   - Rule: When checking articles IN sheet X, don't check sheet X for duplicates!

7. **CRITICAL: Pipeline stages must be independent (check status, not previous results)**
   - Bug: If RSS finds 0 new articles → exits entire pipeline
   - Spotted by Kavell: "Each step has its own criteria for running"
   - Root cause: Stages depended on previous stage results instead of status
   - Problem: Articles from previous runs (status "pending", "text_fetched") were ignored
   - Solution: Each stage checks for articles with ITS OWN status:
     - Stage 2: Count status "pending" (not RSS results)
     - Stage 3: Count status "text_fetched" (not fetch results)
     - Stage 4: Count status "ready_for_processing" (not pre-filter results)
   - Rule: Pipeline stages should be independent and resume-able!

8. **CRITICAL: MAX_ARTICLES_PER_RUN must respect daily API limits!**
   - Bug: MAX_ARTICLES_PER_RUN was set to 30, tried to process all at once
   - Spotted by Kavell: "It tried to send all ready articles to Gemini causing limit to be exceeded"
   - Root cause: 30 articles/run × 3 runs/day = 90 API calls (Gemini limit: 20 RPD)
   - Problem: First run hits limit after 20 articles, marks remaining 10 as "failed"
   - Impact: Failed articles won't retry automatically (stuck permanently)
   - Solution:
     - Set MAX_ARTICLES_PER_RUN = 6 (3 runs × 6 = 18 API calls/day ✅)
     - Created resetFailedArticles.gs helper to manually reset failed → ready_for_processing
   - Rule: **Daily limit ÷ runs per day = max per run**
   - Formula: 20 RPD ÷ 3 runs = 6.67 → Use 6 for safety margin

### Performance Insights

- URL index build time: ~2.6 seconds (cold)
- Cached reads: ~100ms (warm)
- Reading 1516-row sheet on-demand: ~1-2 seconds (acceptable)
- Pre-filter processing: ~3-5 seconds for 141 articles

### Design Decisions

1. **Why keyword-based pre-filter?**
   - Gemini free tier: 20 requests/day
   - Currently making 130+ requests/day
   - Keyword filter reduces to ~20-30/day (within limit)
   - Configurable via Google Sheets (no code changes)

2. **Why 4-sheet duplicate detection?**
   - Prevents re-processing old articles
   - Handles archived data (Raw Archive has 1516 articles)
   - Catches duplicates from different news sources

3. **Why separate pre-Gemini and post-Gemini checks?**
   - Pre-Gemini: Fast URL matching (skip API call entirely)
   - Post-Gemini: Crime-level matching (same victim/date/location from different sources)

4. **Future scalability: Year-based archive sheets**
   - Current: Single "Raw Articles Archive" sheet (1516 rows)
   - Problem: Will eventually hit Google Sheets 10M cell limit
   - Solution: Split by year when needed (Raw Archive 2025, Raw Archive 2026, etc.)
   - Check logic: Search only the year matching the article's published date
   - Trigger: When any archive sheet hits ~2000-3000 rows
   - Benefit: Keeps checks fast, scales indefinitely

---

## 🚨 Critical Gotchas

1. **Never cache sheets over ~100 rows** (approaching 100 KB limit)
   - Safe to cache: Raw Articles, Production
   - Never cache: Raw Archive, Production Archive

2. **Always check Production Archive for duplicates**
   - Old mistake: Only checked Production sheet
   - Duplicates slipped through from archived crimes

3. **MIN_SCORE_TO_PROCESS threshold requires tuning**
   - Currently: 10 points
   - Too low: More false positives (wastes API calls)
   - Too high: More false negatives (misses crimes)
   - Monitor "Filtered Out Articles" sheet weekly

4. **Broad exclude keywords are dangerous**
   - "business" (-10) filtered fraud/scam crimes involving businesses
   - "court" (-10) might filter courthouse shooting or kidnapping outside court
   - Use specific context: "convicted", "sentenced", "trial concludes"

---

## 📊 Key Metrics to Track

- **API calls per day:** Target < 20 (free tier limit)
- **Pre-filter pass rate:** Currently 18% (26/141 articles)
- **False negative rate:** Check "Filtered Out Articles" weekly
- **Duplicate detection accuracy:** Should be 100% (URL matching)

---

## 🔄 Next Session Preparation

**When we resume:**
1. Check if user completed their 3 tasks (keywords, upload, test)
2. If tests pass, create monitoring sheets
3. If tests fail, debug and fix issues
4. Once stable, integrate into main automation workflow

**Questions to Ask:**
- Did fraud keywords fix the false negative?
- Is Raw Archive now showing 1516 URLs?
- Any new errors or unexpected behavior?

---

## 📝 Notes & Context

**Why Trinidad only (not Guyana/Barbados)?**
- User wants to focus resources on one country
- Trinidad has more data and better monitoring
- Easier to maintain quality with manual review
- Can expand later once system is proven

**Token-saving strategy:**
- User handles simple tasks (sheet setup, testing)
- Claude handles complex code (algorithms, debugging)
- User can use Gemini for data analysis tasks
- Keep this file under 5 tasks total to stay focused

**Work split philosophy:**
- If task is repetitive/manual → User with Gemini
- If task requires code logic → Claude
- If task requires judgment → Discuss together

---

**File Purpose:** Single source of truth for project state, lessons, and coordination
**Update Frequency:** Every session or when significant progress/learning occurs
**Max Outstanding Tasks:** 5 total (Claude + User combined)
