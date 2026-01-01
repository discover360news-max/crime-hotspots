# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Crime Hotspots is a web-based data visualization platform for Caribbean crime statistics. The application displays crime data dashboards, headlines, and provides anonymous crime reporting functionality.

**Current Status:** ✅ Production - Trinidad & Tobago LIVE (Astro-powered)
**Live Site:** https://crimehotspots.com
**Framework:** Astro 5.16.5 (migrated from Vite, December 16, 2025)
**Focus:** Trinidad-only implementation (Other islands expansion deferred)
**Last Updated:** January 1, 2026

---

## Recent Accomplishments

### January 1, 2026 - Social Media Stats Triple-Mode System

**Problem Solved:**
Social media stats generation had critical bugs: (1) date range calculations were off by 1 day (using midnight instead of end-of-day), (2) timezone issues caused wrong date boundaries, (3) no support for monthly reviews or custom date ranges, (4) manual fiddling with `lagDays` required to get correct dates.

**Accomplishments:**
1. **Fixed Date Range Calculation Bug** ✅
   - **Root cause:** End dates set to `00:00:00` (midnight) instead of `23:59:59` (end-of-day)
   - **Impact:** Missing last day's crimes (e.g., Dec 21-27 only counted through midnight of Dec 27)
   - **Fix:** Changed all date boundaries to use **noon (12:00:00)** to avoid timezone edge cases
   - **Result:** Weekly stats now accurately capture full 7-day periods

2. **Fixed Timezone Boundary Issues** ✅
   - **Root cause:** JavaScript `Date` objects created at midnight UTC → off-by-1-day in Trinidad timezone (UTC-4)
   - **Example:** `new Date(2025, 11, 1)` = Dec 1 00:00 UTC → Nov 30 20:00 Trinidad time
   - **Fix:** All dates now created at noon instead of midnight
   - **Result:** Logs show correct dates (Dec 1 - Dec 31, not Nov 30 - Dec 31)

3. **Triple-Mode Stats System** ✅
   - **MODE 1: Daily Weekly Stats (Automated with 3-day lag)**
     - Function: `generateDailyStats()`
     - Uses fixed 3-day lag to ensure complete data
     - On Dec 31: Compares Dec 21-27 vs Dec 14-20
     - Optional automation: `setupDailyTrigger()` (runs 3 PM daily)

   - **MODE 2: Monthly Stats (Automated, no lag)**
     - Function: `generateMonthlyStats(year, month)` or `generateMonthlyStatsWithPrompt()` (with UI)
     - Compares full months (e.g., December vs November)
     - Run on 5th of month to ensure previous month is complete
     - Optional automation: `setupMonthlyTrigger()` (runs 5th at 9 AM)

   - **MODE 3: Custom Stats (Manual, no lag)**
     - Function: `generateCustomStats(startDate, endDate)` or `generateCustomStatsWithPrompt()` (with UI)
     - Analyze ANY date range specified
     - Compares against previous period of same duration
     - Perfect for ad-hoc analysis

4. **User-Friendly Popup Functions** ✅
   - `generateMonthlyStatsWithPrompt()` - Prompts for year/month with validation
   - `generateCustomStatsWithPrompt()` - Prompts for start/end dates with validation
   - Built-in validation:
     - Year range: 2020-2030
     - Month range: 1-12
     - Date format: YYYY-MM-DD
     - End date must be after start date
   - Confirmation dialogs before execution
   - Success messages with results location

5. **Comprehensive Documentation Update** ✅
   - Updated file header with complete 3-mode usage guide
   - Clear examples for each mode
   - Setup instructions for automation triggers
   - Parameter validation with helpful error messages

**Key Learnings:**
- **Midnight boundaries cause timezone bugs** - Using noon (12:00) instead of midnight (00:00) prevents off-by-1-day errors when timezone conversions occur
- **End-of-day means 23:59:59, not 00:00:00** - Critical distinction that caused missing data
- **Reporting lag needs to account for COMPLETE days** - Formula: `today - lagDays - 1` ensures full data availability
- **Multi-mode systems need clear documentation** - Different use cases (daily/monthly/custom) require different approaches
- **UI prompts improve usability** - Popup dialogs with validation prevent parameter errors

**Files Modified:**
- `google-apps-script/trinidad/socialMediaStats.gs` (complete rewrite of date logic, added 2 new modes, added UI prompt functions, added automation triggers)

**Functions Added:**
- `generateMonthlyStats(year, month)` - Monthly comparison stats
- `generateMonthlyStatsWithPrompt()` - UI-driven monthly stats
- `generateCustomStats(startDate, endDate)` - Custom date range stats
- `generateCustomStatsWithPrompt()` - UI-driven custom stats
- `generateMonthlyPostTexts()` - Monthly post formatting
- `setupMonthlyTrigger()` - Automation setup for monthly stats
- `generateMonthlyStatsAuto()` - Auto-triggered monthly stats

**Status:**
- ✅ Daily stats: Fixed and working with correct 3-day lag
- ✅ Monthly stats: Complete with automation option
- ✅ Custom stats: Complete for ad-hoc analysis
- ✅ Timezone issues: Resolved across all modes
- ✅ UI prompts: Complete with validation

---

### December 28, 2025 - Site Notification Banner & 2026 Crime Type System

**Problem Solved:**
Need to notify users about ongoing 2025 data updates, and need better crime type tracking for 2026 (currently submitting duplicate rows for multi-crime incidents).

**Accomplishments:**
1. **Site Notification Banner System** ✅
   - Created toggle-based notification system (`src/config/siteNotifications.ts`)
   - Built dismissible banner component (`src/components/SiteNotificationBanner.astro`)
   - Persists dismiss state in localStorage
   - Added to Dashboard, Headlines, Archives, Crime detail pages
   - Simple on/off toggle: `enabled: true/false`
   - Current message: "2025 crime data is currently being updated"

2. **2026 Primary + Related Crime Types** ✅ (Complete - Ready for Jan 1)
   - **Goal:** One incident = one row, but track ALL crime types involved
   - **Example:** Murder by shooting = 1 row with primary="Murder", related="Shooting" (no duplicates!)
   - **Backend (Apps Script):**
     - Created implementation guide: `docs/implementation/2026-PRIMARY-RELATED-CRIME-TYPES.md`
     - Created crime type processor: `google-apps-script/trinidad/crimeTypeProcessor.gs`
     - Updated Gemini prompt to extract `all_crime_types` array
     - Updated `processor.gs` to use new crime type logic (both `appendToProduction` and `appendToReviewQueue`)
   - **Frontend (Astro):**
     - Implemented column header mapping (resilient to column reordering)
     - Created `countCrimeType()` helper that counts across both `primaryCrimeType` and `relatedCrimeTypes`
     - Updated Dashboard StatCards to use new counting logic
     - Updated all filtering/trend calculations in `dashboardUpdates.ts`
     - **Result:** Incidents counted once, crime types counted accurately across primary + related fields
   - **Google Form:** Updated with dual dropdowns (Primary Crime Type + Related Crime Types)
   - **Next:** User tests pipeline on Dec 31, goes live Jan 1, 2026

**Key Learnings:**
- **Toggle-based notifications are user-friendly** - Single config change controls site-wide messaging
- **Backward compatibility is critical** - Keeping old `crimeType` column means frontend works immediately
- **2025 data stays untouched** - No manual cleanup needed, focus on getting 2026 right
- **Column header mapping prevents breakage** - Parsing CSV by column name (not index) makes system resilient to column reordering
- **Counting logic must handle multiple sources** - Crime types appear in primary, related, AND legacy fields during transition

**Files Created:**
- `src/config/siteNotifications.ts` (notification config)
- `src/components/SiteNotificationBanner.astro` (dismissible banner component)
- `docs/implementation/2026-PRIMARY-RELATED-CRIME-TYPES.md` (complete implementation guide)
- `google-apps-script/trinidad/crimeTypeProcessor.gs` (crime type processor with severity ranking)

**Files Modified:**
- `src/pages/trinidad/dashboard.astro` (added notification banner, column header mapping, countCrimeType helper)
- `src/pages/trinidad/headlines.astro` (added notification banner)
- `src/pages/trinidad/archive/[year]/[month].astro` (added notification banner)
- `src/pages/trinidad/archive/index.astro` (added notification banner)
- `src/pages/trinidad/crime/[slug].astro` (added notification banner)
- `src/lib/crimeData.ts` (column header mapping, primaryCrimeType/relatedCrimeTypes fields)
- `src/scripts/dashboardUpdates.ts` (countCrimeType helper, updated filtering/trend logic)
- `google-apps-script/trinidad/geminiClient.gs` (updated prompt for all_crime_types array)
- `google-apps-script/trinidad/processor.gs` (updated appendToProduction & appendToReviewQueue)

**Status:**
- ✅ Notification banner: Deployed and ready to use
- ✅ 2026 crime types: Complete (backend + frontend), ready for Jan 1 launch

---

### December 27, 2025 - Search Index Cleanup & Pagefind Production Fix

**Problem Solved:**
Site-wide search was showing unwanted UI content (modals, footers, headers) in results, and Pagefind wasn't generating search index files in production (404 errors on `/pagefind/*` files).

**Accomplishments:**
1. **Search Index Cleanup** ✅
   - Added `data-pagefind-ignore` to all modal components (Dashboard, Headlines, Archives, Search)
   - Added `data-pagefind-ignore` to header subscribe tray and mobile menu
   - Added `data-pagefind-ignore` to footer in Layout.astro
   - Added `data-pagefind-ignore` to crime detail page metadata sections (crime type badges, location details, metadata grids, Related Crimes, Report Issue sections)
   - Search results now show ONLY crime headlines and summaries (clean, focused results)

2. **Pagefind Production Fix** ✅
   - **Root Cause:** `astro-pagefind` integration wasn't running on Cloudflare Pages during build
   - **Solution:** Switched from integration-based to manual CLI approach
   - Added `data-pagefind-body` attribute to `<main>` tag in Layout.astro (tells Pagefind what to index)
   - Removed `astro-pagefind` integration from astro.config.mjs
   - Updated Cloudflare build command: `npm ci && npm run build && npx pagefind --site dist`
   - **Result:** Successfully indexing **1,581 pages** with **4,967 words** in production

3. **TextInfoPopup Component** 🔄 (Created but not deployed)
   - Built reusable component for clickable text with dashed underlines that opens info popups
   - Encountered DOM nesting issue when used inside SearchModal (popup content visible in parent modal)
   - Component saved in `src/components/TextInfoPopup.astro` for future use with different approach

**Key Learnings:**
- **Astro integrations may not run on all hosting platforms** - Cloudflare Pages doesn't execute all Astro build hooks reliably
- **Manual CLI approach is more reliable** - Running `npx pagefind --site dist` ensures indexing happens regardless of platform
- **`data-pagefind-body` is required** - Pagefind needs an explicit marker to know which content to index
- **DOM nesting affects portal-style components** - Fixed positioning doesn't prevent content from rendering within parent containers; need to use HTML `<template>` tags or append directly to `document.body`

**Files Modified:**
- `src/components/DashboardModal.astro` (added `data-pagefind-ignore`)
- `src/components/HeadlinesModal.astro` (added `data-pagefind-ignore`)
- `src/components/ArchivesModal.astro` (added `data-pagefind-ignore`)
- `src/components/SearchModal.astro` (added `data-pagefind-ignore`, removed TextInfoPopup usage)
- `src/components/Header.astro` (added `data-pagefind-ignore` to subscribe tray and mobile menu)
- `src/layouts/Layout.astro` (added `data-pagefind-ignore` to footer, added `data-pagefind-body` to main)
- `src/pages/trinidad/crime/[slug].astro` (added `data-pagefind-ignore` to metadata sections)
- `astro.config.mjs` (removed pagefind integration)
- `src/components/TextInfoPopup.astro` (created, not deployed)

**Commits:**
- `0889528` - Clean up search index and add modal navigation system
- `c92d731` - Fix Pagefind search indexing for production

---

## Owner Guidance

**Kavell Forde - Owner**
My thoughts are just my thought process and are always open to criticism and can be urged to be modified for the success of the project.

**MAIN GOAL:**
To find a way to get goals accomplished efficiently and by using the least tokens possible by:
- Employing Kavell to do some tasks manually (with guidance)
- Have Kavell use Gemini for content where necessary (Provide prompt)
- Always ask probing questions to clear up ambiguities in requests
- Focus and implement once, so no bugs show up unnecessarily

---

## Tech Stack

**Frontend:**
- **Astro 5.16.5** - Static site generator with file-based routing
- **Tailwind CSS 4.1.18** - Via Vite plugin (@tailwindcss/vite)
- **TypeScript** - Type safety for components and content
- **Astro Content Collections** - Type-safe blog system
- **Pagefind** - Site-wide static search
- Cloudflare Turnstile for CAPTCHA
- Leaflet.js for interactive maps
- OpenStreetMap tiles

**Backend/Automation:**
- Google Apps Script (serverless)
- Google Gemini AI (crime data extraction)
- Google Sheets (data storage + CSV export)
- GitHub Actions (CI/CD)

**Hosting:**
- Cloudflare Pages (auto-deploy from GitHub)
- Custom domain: crimehotspots.com

**Working Directory:** `astro-poc/`

---

## Critical Rules

### COMPONENT-FIRST PRINCIPLE ⭐⭐⭐

Before adding any feature, ask: "Should this be a reusable component?" Create components for reusable UI patterns (filters, cards, modals, forms) before writing inline code. Store in `src/components/` or `src/scripts/` for TypeScript utilities.

### DESIGN SYSTEM ⭐

**Check `docs/guides/DESIGN-TOKENS.md` BEFORE making any UI/styling changes**

- Follow established button patterns (`px-4 py-1.5`, `min-h-[22px]`)
- Use `rounded-lg` (not `rounded-md`)
- Always add explicit text colors (`text-slate-700`, `text-slate-400`)
- Use colors only from Rose + Slate palette
- No emojis unless requested

### When Working on Astro Frontend

**DO:**
- Work in `astro-poc/` directory (NOT root)
- Use Read, Edit, Write tools (not bash)
- Prefer editing existing files
- Test with `npm run dev` (port 4321)
- Build successfully before committing: `npm run build`
- Keep page files under 500 lines - extract to components/scripts if larger

**DON'T:**
- Create markdown files unless required
- Modify `astro.config.mjs` without understanding
- Create new button variants (use existing patterns from DESIGN-TOKENS.md)
- Work in root directory (Vite version is deprecated)

### When Working on Automation

**NEVER:**
- Change `maxOutputTokens` from 4096
- Remove multi-crime detection
- Hardcode API keys

**ALWAYS:**
- Read automation README first
- Test with `testRSSCollection()` functions
- Verify Script Properties are set

### CSV URL Synchronization (CRITICAL)

**⚠️ IMPORTANT:** CSV URLs must be synchronized across multiple files:

**Files That Must Match:**
1. `astro-poc/src/lib/crimeData.ts` (lines 27-34)
2. `astro-poc/src/pages/trinidad/dashboard.astro` (lines 400-405)

**Rules:**
- **ALWAYS update BOTH files** when changing CSV URLs
- Both files must point `current` to the same year sheet
- When `current` points to 2025 sheet, don't also load explicit 2025 sheet

**Why:** Dashboard uses client-side CSV fetching, Headlines/archive use server-side fetching. Mismatch causes "flash" effect and duplicate loading.

See `docs/claude-context/development-workflow.md` for details.

---

## Git/GitHub

**Only commit when user requests.**

**Never:**
- Force push to main
- Skip hooks
- Commit secrets

**Commit format:**
```bash
git commit -m "Short title

- Change details

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Quick Reference Documentation

**📂 Claude Context (Detailed Information)**
- `docs/claude-context/architecture.md` - Astro routing, file structure, SSG examples
- `docs/claude-context/automation.md` - Google Apps Script details, data collection
- `docs/claude-context/development-workflow.md` - Commands, deployment, CSV URL sync
- `docs/claude-context/recent-features.md` - December 2025 feature implementations
- `docs/claude-context/status-and-roadmap.md` - Completed features, next To-Do, vision

**🎨 Design & SEO**
- `docs/guides/DESIGN-TOKENS.md` - **Official Design System (v1.0)** ⭐ CHECK THIS FIRST
  - Button variants, frosted glass, typography, color palette, copy-paste templates
- `docs/guides/DESIGN-Guidelines.md` - Complete design framework (v2.0)
- `docs/guides/SEO-Framework.md` - Complete SEO strategy, phased roadmap

**🤖 Automation**
- `google-apps-script/trinidad/README.md` - Trinidad automation
- `docs/FACEBOOK-DATA-COLLECTION.md` - Facebook sources
- `docs/automation/WEEKLY-REPORT-SAFEGUARDS.md` - Blog automation
- `docs/automation/DUPLICATE-DETECTION-ARCHIVE.md` - Enhanced duplicate detection
- `docs/automation/SEIZURES-CRIME-TYPE.md` - Seizures crime type

**📦 Architecture**
- `docs/architecture/CSV-DATA-MANAGEMENT.md` - Phased implementation plan

**📜 Archive**
- `docs/archive/Development Progress/` - Historical development logs

---

## Current Status (Brief)

### ✅ Production Ready
- Astro 5.16.5 framework (1,300+ static pages)
- Trinidad & Tobago automation (100% functional)
- Dashboard with Leaflet maps, year filtering, trend comparisons
- Site-wide search (Pagefind, 1,584 pages indexed)
- SEO Phase 1 complete (sitemap, structured data, breadcrumbs)
- Google Analytics 4, cookie consent, user reporting

### 🔄 In Progress
- None - Approaching 2026 with intentional, focused development

### 📋 Priority Queue (2026)
1. Division/Area filter enhancement (hierarchical filtering)
2. Complete breadcrumb navigation
3. **SEO Phase 2: Social Media Dominance** (HIGH PRIORITY)
   - Open Graph preview images
   - Auto-post to Facebook/X APIs
   - Social sharing buttons

See `docs/claude-context/status-and-roadmap.md` for complete details.

---

## Development Commands

```bash
cd astro-poc
npm run dev      # Start dev server (port 4321)
npm run build    # Build for production
npm run preview  # Preview production build
```

**Deployment:**
- Push to `main` → GitHub Actions builds → Cloudflare Pages deploys
- Daily rebuild at 6 AM UTC (2 AM Trinidad time)
- Manual trigger: GitHub Actions UI → "Build and Validate" → "Run workflow"

---

**For comprehensive details on any topic, see the reference docs in `docs/claude-context/`**
