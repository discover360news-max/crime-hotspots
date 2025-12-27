# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Crime Hotspots is a web-based data visualization platform for Caribbean crime statistics. The application displays crime data dashboards, headlines, and provides anonymous crime reporting functionality.

**Current Status:** ✅ Production - Trinidad & Tobago LIVE (Astro-powered)
**Live Site:** https://crimehotspots.com
**Framework:** Astro 5.16.5 (migrated from Vite, December 16, 2025)
**Focus:** Trinidad-only implementation (Other islands expansion deferred)
**Last Updated:** December 27, 2025

---

## Recent Accomplishments

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
