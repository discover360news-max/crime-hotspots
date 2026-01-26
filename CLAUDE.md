# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Crime Hotspots is a web-based data visualization platform for Caribbean crime statistics. The application displays crime data dashboards, headlines, and provides anonymous crime reporting functionality.

**Current Status:** ✅ Production - Trinidad & Tobago LIVE (Astro-powered)
**Live Site:** https://crimehotspots.com
**Framework:** Astro 5.16.5 (migrated from Vite, December 16, 2025)
**Traffic:** ~4 real visitors/day, Google Search Console active (1,728 pages indexed)
**Last Updated:** January 26, 2026

---

## Recent Work (Last 30 Days)

**January 2026:**
- **🛡️ SAFETY CONTEXT SYSTEM** (Jan 26) - **"The Safety Strength Engine"**
  - Created `safetyHelpers.ts` - Calculate area-based crime scores (1-10 scale)
  - Created `SafetyContext.astro` - Color-coded contextual safety tips component
  - Integrated into crime detail pages AND CrimeDetailModal
  - High-risk areas (>7): Actionable prevention tips (amber background)
  - Neutral areas (4-6): Maintenance tips (slate background)
  - Low-risk areas (<4): Positive reinforcement (emerald background)
  - SEO benefits: Balanced messaging, positive keywords ("safest neighborhoods", "low crime areas")
  - Fixed modal data availability across all pages (headlines, archive, dashboard)
- **🎨 COMPONENT REFACTORING** (Jan 26) - **COMPONENT-FIRST PRINCIPLE**
  - Created `Hero.astro` (102 lines) - Reusable gradient hero for landing pages
  - Created `StatCards.astro` (48 lines) - Statistics grid with YoY comparisons
  - Created `DataTable.astro` (32 lines) - Responsive table wrapper
  - Refactored `/trinidad/statistics` page using new components
  - Improved code maintainability and reusability
- **🚀 HYBRID RENDERING IMPLEMENTATION** (Jan 26) - **CRITICAL LCP FIX**
  - 90-day rolling window: Pre-render last 795 crimes (static, fast LCP)
  - Older crimes: SSR on-demand (low traffic, acceptable degradation)
  - Build time: 10:58 (well under 20-min Cloudflare limit)
  - **Expected LCP improvement: 60-80% (8,500ms → 1,000-2,000ms)**
  - Scales infinitely (always builds same ~90-day window)
  - Protects Google SEO rankings from Core Web Vitals penalties
- **Murder Count 2026 page** - iOS-style flip counter, share buttons, SEO-optimized (Jan 22)
- **Claude API migration** - Replaced Gemini/Groq with Claude Haiku 4.5 for crime extraction (Jan 2026)
- **XSS security fixes** - `escapeHtml.ts` utility, secured CrimeDetailModal + headlines (Jan 18)
- **LCP optimization** - Astro Image component, 96% image size reduction (Jan 18)
- **CSP completion** - Fixed googleusercontent.com for forms (Jan 18)
- **Comprehensive audit** (Security, SEO, UX/UI, Code Quality) - see `docs/Website-Audits/`
- **CSV consolidation** - Single source of truth (`csvUrls.ts`, `csvParser.ts`)
- **Security hardening** - CSP headers, npm audit fix, Turnstile documentation
- **SEO improvements** - BlogPosting schema, breadcrumbs on blog posts
- Traffic analysis & SEO foundation (Google Search Console verified, social growth strategy)
- Blog rotating banner + Headlines timeline UX (mobile-optimized)
- Area tooltips with viewport detection (Dashboard Top Areas integration)
- Headlines date accordion + victim count display
- Victim count system + 2026 crime type format (primary + related crimes)
- Social media stats triple-mode system (daily/monthly/custom)

**December 2025:**
- Site notification banner + 2026 crime type system launch
- Search index cleanup + Pagefind production fix (1,584 pages indexed)
- Dashboard trend indicators + modal navigation (30-day comparisons)
- Year filter system (CSV URL synchronization)

**📄 Full Details:** See `docs/claude-context/recent-features.md`

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
- **Astro 5.16.5** - Hybrid rendering: Recent crimes (90 days) pre-rendered, older crimes SSR on-demand
- **Tailwind CSS 4.1.18** - Via Vite plugin (@tailwindcss/vite)
- **TypeScript** - Type safety for components and content
- **Astro Content Collections** - Type-safe blog system
- **Pagefind** - Site-wide static search (1,584 pages indexed)
- Cloudflare Turnstile for CAPTCHA
- Leaflet.js for interactive maps
- OpenStreetMap tiles

**Backend/Automation:**
- Google Apps Script (serverless)
- **Claude Haiku 4.5** (crime data extraction) - Migrated from Gemini/Groq in January 2026
  - Model: `claude-3-5-haiku-20241022`
  - Prompt caching enabled (~90% input token savings)
  - Cost: ~$2.70/month for 20 articles/day
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

### HYBRID RENDERING SYSTEM ⭐⭐⭐ (CRITICAL FOR LCP)

**✅ IMPLEMENTED January 26, 2026** - Fixes catastrophic LCP degradation (8,500ms → 1,000-2,000ms expected)

**How It Works:**
- Crime pages use **90-day rolling window** pre-rendering
- Last 90 days (795 pages): **Static** → Fast LCP (500-1,500ms)
- Older crimes (1,139 pages): **SSR on-demand** → Slower but acceptable (low traffic)
- Build time: **10:58** (well under 20-minute Cloudflare limit)
- Scales infinitely (always builds same ~90-day window)

**Implementation:**
- `astro.config.mjs`: `output: 'server'`
- `[slug].astro`: `export const prerender = true;` + `getStaticPaths()` with 90-day filter
- SSR fallback code handles older crimes not in `getStaticPaths()`

**NEVER:**
- Remove `getStaticPaths()` function from crime detail pages
- Change the 90-day window without understanding build time impact
- Switch back to full SSR (`prerender = false` only) - this kills LCP
- Switch to full static (`getStaticPaths()` returning all crimes) - this breaks Cloudflare 20-min limit

**ALWAYS:**
- Test build time after changes (`npm run build` must complete under 15 minutes for safety)
- Verify recent crimes are pre-rendering (check build logs for "Building X recent crime pages")
- Monitor LCP metrics after deployment (should be <2,500ms for "Good" rating)

**Why This Matters:**
- Full SSR: 8,500ms P99 LCP (32% poor ratings) ❌
- Full Static: 29-35 minute builds (exceeds Cloudflare 20-min limit) ❌
- Hybrid: Fast LCP + Fast builds ✅

### When Working on Automation

**NEVER:**
- Change `maxOutputTokens` from 4096
- Remove multi-crime detection
- Hardcode API keys

**ALWAYS:**
- Read automation README first
- Test with `testRSSCollection()` functions
- Verify Script Properties are set

### CSV URL Configuration (SINGLE SOURCE OF TRUTH)

**✅ UPDATED January 2026:** CSV URLs are now centralized.

**Single Source of Truth:**
- `astro-poc/src/config/csvUrls.ts` - All CSV URLs defined here

**Files That Import From Config:**
- `src/lib/crimeData.ts` - Server-side SSG
- `src/scripts/dashboardDataLoader.ts` - Client-side dashboard
- `src/lib/areaAliases.ts` - Area name mapping

**Rules:**
- **ONLY update `csvUrls.ts`** when changing CSV URLs
- All other files import from this config
- When `current` points to 2026 sheet, don't also load explicit 2026 sheet

See `docs/claude-context/development-workflow.md` for details.

### Victim Count System (2026+)

**Critical Rule:** Victim count ONLY applies to PRIMARY crime type. Related crimes always count as +1.

**Example:**
- Row: Primary = Murder (victimCount=3), Related = [Shooting]
- Result: Murder +3, Shooting +1 (prevents double-counting)

**Configuration:** `astro-poc/src/config/crimeTypeConfig.ts`

### Safety Context System (2026+)

**✅ IMPLEMENTED January 26, 2026** - "The Safety Strength Engine"

**What It Does:**
- Calculates area-based crime scores (1-10 scale) using 90-day crime density
- Provides contextual safety tips based on risk level
- Displays in crime detail pages AND CrimeDetailModal
- Balanced messaging for SEO and user experience (avoid "doom scrolling")

**Implementation:**
- `src/lib/safetyHelpers.ts` - Server-side & client-side scoring algorithms
- `src/components/SafetyContext.astro` - Display component with color coding
- `src/pages/trinidad/crime/[slug].astro` - Integrated on crime pages
- `src/components/CrimeDetailModal.astro` - Client-side calculation for modal

**Risk Levels:**
- **High (>7)**: Amber background, actionable prevention tips (e.g., "Empty Seat Protocol")
- **Neutral (4-6)**: Slate background, maintenance tips (e.g., "9 PM Routine")
- **Low (<4)**: Emerald background, positive reinforcement (e.g., "Safe Haven Status")

**CRITICAL:**
- Modal requires `window.__crimesData` to be populated (headlines, archive, dashboard pages)
- Scoring algorithm uses 90-day rolling window (matches hybrid rendering)
- Client-side calculation must use `dateObj` field (not just `date` string)

**DO:**
- Add more safety tips to `getSafetyTip()` in `safetyHelpers.ts` as needed
- Keep tips actionable, specific, and non-alarmist
- Use positive notes for low-crime areas to improve SEO

**DON'T:**
- Remove safety context from modal (improves UX by keeping users on site)
- Change scoring algorithm without understanding SEO impact
- Use alarmist language that causes users to leave immediately

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
- `docs/claude-context/recent-features.md` - December 2025 - January 2026 implementations
- `docs/claude-context/status-and-roadmap.md` - Completed features, next To-Do, vision
- `docs/claude-context/MAINTENANCE-RULES.md` - **Rules for keeping project memory slim**

**📊 Audits & Technical Debt**
- `docs/Website-Audits/January-Audit-2026.md` - **Comprehensive audit with prioritized fixes** ⭐
  - Security, SEO, UX/UI, Code Quality findings
  - Priority matrix with timelines and seriousness levels
  - Track completed vs pending items

**🎨 Design & SEO**
- `docs/guides/DESIGN-TOKENS.md` - **Official Design System (v1.0)** ⭐ CHECK THIS FIRST
  - Button variants, frosted glass, typography, color palette, copy-paste templates
- `docs/guides/DESIGN-Guidelines.md` - Complete design framework (v2.0)
- `docs/guides/SEO-Framework.md` - Complete SEO strategy, phased roadmap

**🧩 UI Patterns**
- `docs/guides/ACCORDION-PATTERN.md` - Date accordion component pattern
- `docs/guides/INFO-ICON-PATTERN.md` - Info icon hover pattern
- `docs/guides/The-Safety-Strength-Engine.md` - **Safety Context System** ⭐
  - Area-based crime scoring algorithm (1-10 scale)
  - Contextual safety tips (high/neutral/low risk levels)
  - Balanced messaging for SEO and user experience

**🧱 Reusable Components** (COMPONENT-FIRST Architecture)
- `src/components/Hero.astro` - Full-width gradient hero with CTAs (landing pages)
- `src/components/StatCards.astro` - Statistics grid with YoY comparisons
- `src/components/DataTable.astro` - Responsive table wrapper with consistent styling
- `src/components/SafetyContext.astro` - Color-coded area safety tips (high/neutral/low)
- `src/lib/safetyHelpers.ts` - Crime scoring & safety context calculation

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
- Astro 5.16.5 framework (1,889 static pages)
- Trinidad & Tobago manual entry workflow (100% functional)
- Dashboard with Leaflet maps, year filtering, trend comparisons
- Site-wide search (Pagefind, 1,584 pages indexed)
- SEO Phase 1 complete (sitemap, structured data, breadcrumbs, Google Search Console verified)
- **Security Grade: A** - XSS fixed, CSP complete, npm vulnerabilities resolved
- Google Analytics 4, cookie consent, user reporting
- Social media accounts active (Facebook, X, Instagram) with content automation

### 🔄 In Progress
- **Traffic Growth Strategy (Week of Jan 6-12)** - Launching zero-budget social media distribution plan
  - Reddit launch: r/TrinidadandTobago
  - Facebook groups: Join 3-5 Trinidad crime/community groups
  - X/Twitter: Tag Trinidad news outlets
  - Goal: 50-100 real visitors/day by March 2026

### 📋 Priority Queue (2026)
1. **SEO Phase 2: Social Media Dominance** (ACTIVE - Week of Jan 6-12)
   - ✅ Social accounts ready (Facebook, X, Instagram)
   - ✅ Content automation (Google Apps Script + image generator)
   - 🔜 Reddit launch
   - 🔜 Facebook groups distribution
   - 🔜 News outlet tagging strategy
2. Division/Area filter enhancement (hierarchical filtering)
3. Complete breadcrumb navigation
4. Open Graph preview images (once traffic is established)
5. Auto-post to Facebook/X APIs (future enhancement)

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
