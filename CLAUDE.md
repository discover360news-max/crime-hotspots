# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Crime Hotspots is a web-based data visualization platform for Caribbean crime statistics. The application displays crime data dashboards, headlines, and provides anonymous crime reporting functionality.

**Current Status:** ✅ Production - Trinidad & Tobago LIVE (Astro-powered)
**Live Site:** https://crimehotspots.com
**Framework:** Astro 5.16.5 (migrated from Vite, December 16, 2025)
**Traffic:** ~4 real visitors/day, Google Search Console active (1,728 pages indexed)
**Last Updated:** February 6, 2026

---

## Recent Work (Last 30 Days)

**February 2026:**
- **WEEKLY BLOG AUTOMATION** (Feb 6) - **Fully Automatic Blog Pipeline**
  - Created `weeklyBlogAutomation.gs` — end-to-end automated weekly blog generation
  - Claude Haiku 4.5 writes blog posts from CSV crime statistics (~$0.01-0.03/post)
  - 4-layer validation: minimum crimes (10), data freshness, backlog check, duplicate detection
  - Auto-commits markdown to GitHub → Cloudflare auto-deploys
  - Monday 10 AM Trinidad time trigger via Google Apps Script
  - Email notifications on success/skip/error
  - Uses CSV-based data fetching (avoids GAS sheet timezone mismatches)
  - Test functions: `testBlogGeneration()`, `testClaudeBlogOnly()`, `forceGenerateWeeklyBlog()`
- **BLOG INTERNAL LINKING** (Feb 6)
  - Added "More Weekly Reports" section to blog post pages (`[slug].astro`)
  - Shows 3 most recent posts from same country, excluding current post
  - Cards with date, title, read time; links to blog index ("View all reports")
  - Uses `buildRoute.blogPost()` from centralized routes
- **CRIMEDETAILMODAL REFACTORING** (Feb 6)
  - Refactored from 918 → 261 lines — thin orchestrator importing 5 focused modules
  - Modules: `modalHtmlGenerators.ts`, `modalFeedbackHandler.ts`, `modalShareHandlers.ts`, `modalReportHandler.ts`, `modalLifecycle.ts`
  - Eliminated duplicated utilities — now imports from shared `src/lib/` modules
  - Area detail pages: `window.__crimesData` populated with area-specific crimes only
- **📱 UX NAVIGATION OVERHAUL** (Feb 5) - **50% Mobile Discoverability Fix**
  - Created `BottomNav.astro` — persistent mobile tab bar (Dashboard, Headlines, Areas, Report, More)
  - Created `RelatedCrimes.astro` — actual crime cards instead of generic text links
  - Header.astro: Direct links on Trinidad pages (reduces modal friction from 2+ taps to 1)
  - Header.astro: Active section indicator (underline on current section)
  - Footer: Added "Browse" column with primary navigation (Dashboard, Headlines, Areas, Archive)
  - Removed redundant horizontal pills (replaced by bottom nav)
  - Countries.ts: Added `showInBottomNav`, `icon` fields for dynamic bottom nav config
  - Full audit: `docs/guides/UX-NAVIGATION-AUDIT.md`
- **SECTION PICKER MODAL** (Feb 2)
  - Homepage island click now opens a section picker modal instead of navigating directly to dashboard
  - Shows all available sections: Dashboard, Headlines, Archive, Areas, Compare, Statistics, Regions, Murder Count
  - Sections driven dynamically from `countries.ts` config — adding a new section is just adding an entry
  - Follows existing HeadlinesModal pattern (frosted glass, backdrop blur, escape/overlay close)
  - Coming-soon islands unchanged (no modal)
  - Created `src/components/SectionPickerModal.astro`, updated `src/data/countries.ts` with `sections` array
- **FACEBOOK POST SUBMITTER WEB APP** (Feb 2)
  - Google Apps Script web app for quick Facebook crime post entry
  - Paste text + URL → Claude Haiku extracts → Production sheet (bypasses confidence check)
  - Year toggle: 2026 → pipeline Production, 2025 → FR1 sheet (different spreadsheet/column format)
  - Replaces manual Gemini + Google Forms workflow; used daily
  - Also serves as primary Guardian source (Guardian has no RSS feed, site is fully JS-rendered)
  - Created `google-apps-script/trinidad/facebookSubmitter.gs`

**January 2026:**
- **🖼️ DYNAMIC OG IMAGE FOR MURDER COUNT** (Jan 28)
  - Build-time OG image generation using satori + sharp
  - Shows live murder count, YoY change, murder rate, branding
  - 1200x630 PNG regenerates daily with GitHub Actions rebuild
  - Created `src/lib/generateOgImage.ts` — reusable OG generator
  - Added Inter OTF fonts for satori (`public/fonts/Inter-Regular.otf`, `Inter-Bold.otf`)
  - Added `og:image:width`/`og:image:height` meta tags to Layout.astro
- **⚡ DASHBOARD CLS FIX** (Feb 1)
  - Fixed Cumulative Layout Shift (CLS) on dashboard — was scoring "Poor" in Cloudflare Speed
  - Converted Top Regions shimmer from sequential `display:none` toggle to absolute overlay with opacity transitions
  - Added `pointer-events: none` to hidden shimmers so clicks pass through to content
  - Removed blanket `underline` from all Top Areas names; only known_as areas show dotted underline via AreaNameTooltip
  - Unified dotted underline convention on Quick Insights (Highest/Lowest Crimes) for consistency
  - Re-enabled pointer events on shimmer show during year filter changes
- **⚡ MURDER COUNT PAGE PERFORMANCE FIX** (Jan 28)
  - Made Turnstile CAPTCHA script opt-in via `includeTurnstile` prop (defaults to `false`)
  - Added `includePagefind={false}` to murder-count page
  - Eliminates 3 unnecessary requests (~60-80KB unused JS)
  - Addresses Cloudflare Speed "poor" scores
- **🔒 SECURITY HARDENING AUDIT** (Jan 27)
  - Removed stale Google Fonts domains from CSP (`fonts.googleapis.com`, `fonts.gstatic.com`) — fonts now self-hosted
  - Added `Secure` flag to consent cookie (`cookieConsent.ts`)
  - Added `escapeHtml()` to Google Apps Script email templates (`reports-page-Code.gs`) — prevents HTML injection in admin emails
  - Updated `@astrojs/cloudflare` to 12.6.12 (SSRF fix). Remaining moderate `undici` CVE is upstream/unpatched.
  - **Audit grade: A-** — No critical vulnerabilities. See `docs/claude-context/recent-features.md` for full findings.
- **⚡ LCP FONT OPTIMIZATION + HERO COMPACT** (Jan 27)
  - Self-hosted Inter font (woff2) — eliminated Google Fonts external request chain (~200-500ms LCP saving)
  - Removed `dns-prefetch`/`preconnect` for `fonts.googleapis.com`/`fonts.gstatic.com`
  - Updated CSP to remove external font domains
  - Added `compact` variant to `Hero.astro` — smaller padding, left-aligned, compact CTA sizing
  - Added `<slot>` support to `Hero.astro` for custom actions (e.g., JS buttons)
  - Refactored Headlines page to use compact Hero with Dashboard CTA + Filters button
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
- **Astro 5.16.5** - Server mode: Crime pages are SSR with Cloudflare CDN caching (24h), other pages pre-rendered
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

**CRITICAL TWO-STEP PROCESS** - Follow this order EVERY TIME:

**STEP 1: Check Existing Components First**
- Before writing ANY UI code, search `src/components/` for existing components
- Use `Glob` tool: `pattern: "*.astro", path: "src/components/"`
- Check if Hero.astro, StatCards.astro, DataTable.astro, SafetyContext.astro, or any other component can be used
- Even if component needs slight modification, prefer editing the component over writing inline code

**STEP 2: Should This Be a New Component?**
- If no existing component fits, ask: "Is this a reusable UI pattern?"
- Cards, modals, forms, buttons, grids, tooltips → Component
- One-off content, page-specific text → Inline is OK
- When in doubt: Create a component (future pages will thank you)

**Store In:**
- UI components → `src/components/`
- TypeScript utilities → `src/scripts/` or `src/lib/`

**Why This Matters:**
- As the site grows (1,889+ pages), duplicated inline code becomes unmaintainable
- Changing a button style should update everywhere, not require 50 file edits
- Consistency across the site improves UX and SEO

### DESIGN SYSTEM ⭐

**Check `docs/guides/DESIGN-TOKENS.md` BEFORE making any UI/styling changes**

- Follow established button patterns (`px-4 py-1.5`, `min-h-[22px]`)
- Use `rounded-lg` (not `rounded-md`)
- Always add explicit text colors (`text-slate-700`, `text-slate-400`)
- Use colors only from Rose + Slate palette
- No emojis unless requested

### SECURITY RULES ⭐⭐

**Audit Grade: A-** (January 27, 2026)

**ALWAYS:**
- Use `escapeHtml()` from `src/lib/escapeHtml.ts` when rendering user/crime data via `innerHTML` or `set:html`
- Use `sanitizeUrl()` for any external URLs rendered in HTML
- Keep CSP in `public/_headers` tight — only add domains actually needed
- Set `Secure;SameSite=Lax` on all cookies
- Run `npm audit` periodically and update dependencies
- Escape user input in Google Apps Script email templates (`escapeHtml()` in `reports-page-Code.gs`)

**NEVER:**
- Render user-submitted data without escaping (XSS risk)
- Add new external domains to CSP without justification
- Hardcode API keys or secrets in source files
- Remove Turnstile CAPTCHA, honeypot, or rate limiting from report forms

**Known Accepted Risk:**
- `'unsafe-inline'` and `'unsafe-eval'` in CSP `script-src` — required by Leaflet.js and Astro inline scripts. Mitigated by `escapeHtml()`.
- Moderate `undici` CVE in transitive dependency (wrangler) — upstream unpatched, server-side only.

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

### CRIME PAGE RENDERING ⭐⭐⭐ (Full SSR + CDN Cache)

**✅ UPDATED February 4, 2026** — Switched from hybrid (90-day prerender) to full SSR

**Why the change:** The previous hybrid approach with `prerender = true` caused old crime pages (>90 days) to 404 silently. Cloudflare served the homepage as SPA fallback, causing Google Search Console to report 446+ pages as "Alternate page with proper canonical tag" — effectively de-indexing old crime pages.

**How It Works Now:**
- ALL crime pages are server-rendered (SSR) on request
- `CDN-Cache-Control: max-age=86400` — Cloudflare edge caches for 24h after first visit
- `Cache-Control: public, max-age=3600` — Browser caches for 1h
- Unknown slugs return proper HTTP 404 (not homepage redirect)
- Build time: ~4.5 min (no crime pages pre-rendered, faster than before)

**Implementation:**
- `astro.config.mjs`: `output: 'server'`
- `[slug].astro`: No `prerender`, no `getStaticPaths()` — pure SSR
- `Astro.response.headers` sets CDN + browser cache headers

**NEVER:**
- Add `prerender = true` back to `[slug].astro` — this breaks old crime pages (GSC canonical issue)
- Use `Astro.redirect('/404')` for missing crimes — return `new Response(null, { status: 404 })` instead
- Remove CDN cache headers — SSR without caching degrades LCP

**ALWAYS:**
- Test build time after changes (`npm run build` must complete under 15 minutes)
- Monitor LCP metrics after deployment (SSR pages should be <5,000ms first load, <2,500ms cached)
- Verify old crime URLs return real content (not homepage)

### When Working on Automation

**NEVER:**
- Change `maxOutputTokens` from 4096
- Remove multi-crime detection
- Hardcode API keys

**ALWAYS:**
- Read automation README first
- Test with `testRSSCollection()` functions
- Verify Script Properties are set

### Weekly Blog Automation (Feb 2026)

**✅ IMPLEMENTED February 6, 2026** - Fully automatic weekly blog pipeline

**How It Works:**
1. Monday 10 AM Trinidad time → GAS trigger fires `generateWeeklyBlog()`
2. Validates data readiness (4 safeguards: min crimes, freshness, backlog, duplicate)
3. Fetches crime stats via CSV (`fetchCrimeData()` + `filterCrimesByDateRange()` from `socialMediaStats.gs`)
4. Sends stats to Claude Haiku 4.5 → receives markdown blog post
5. Wraps in Astro frontmatter → commits to GitHub via Contents API
6. Cloudflare auto-deploys from GitHub push

**Implementation:**
- `google-apps-script/trinidad/weeklyBlogAutomation.gs` - Main automation script
- Dependencies: `config.gs`, `socialMediaStats.gs`, `blogDataGenerator.gs`
- Script Properties required: `CLAUDE_API_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO`, `TRINIDAD_CSV_URL`

**Key Functions:**
- `generateWeeklyBlog()` — Main entry point (trigger calls this)
- `testBlogGeneration()` — Full test without GitHub commit
- `testClaudeBlogOnly()` — Tests Claude API with sample data
- `forceGenerateWeeklyBlog()` — Bypasses all validation
- `setupWeeklyBlogTrigger()` — Creates Monday 10 AM trigger

**Cost:** ~$0.01-0.03 per blog post (Claude Haiku 4.5)

**IMPORTANT:**
- Uses CSV-based data fetching (NOT sheet `.getDataRange()`) to avoid GAS timezone mismatches
- `SOCIAL_CONFIG.lagDays = 3` — crimes dated by incident date, 3-day reporting lag
- Blog file path: `astro-poc/src/content/blog/trinidad-weekly-YYYY-MM-DD.md`

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
- `docs/guides/UX-NAVIGATION-AUDIT.md` - **Mobile Navigation Best Practices** ⭐
  - Nielsen Norman, Material Design, Apple HIG research
  - Priority matrix for navigation improvements
  - Bottom nav, direct links, active indicators, related content patterns

**🧱 Reusable Components** (COMPONENT-FIRST Architecture)
- `src/components/Hero.astro` - Full-width gradient hero with CTAs (landing pages) + compact variant + slot for custom actions
- `src/components/StatCards.astro` - Statistics grid with YoY comparisons
- `src/components/DataTable.astro` - Responsive table wrapper with consistent styling
- `src/components/SafetyContext.astro` - Color-coded area safety tips (high/neutral/low)
- `src/components/SectionPickerModal.astro` - Homepage section picker (dynamic from countries.ts)
- `src/components/BottomNav.astro` - Mobile bottom tab bar (persistent, config-driven from countries.ts)
- `src/components/RelatedCrimes.astro` - Actual crime cards for related content (same area/type priority)
- `src/lib/safetyHelpers.ts` - Crime scoring & safety context calculation
- `src/lib/generateOgImage.ts` - Dynamic OG image generator (satori + sharp)

**🤖 Automation**
- `google-apps-script/trinidad/README.md` - Trinidad automation
- `google-apps-script/trinidad/weeklyBlogAutomation.gs` - **Weekly blog auto-generation (Claude Haiku)** ⭐
- `google-apps-script/trinidad/facebookSubmitter.gs` - Facebook Post Submitter web app (daily use)
- `google-apps-script/trinidad/socialMediaStats.gs` - Social media stats (daily/monthly/custom)
- `google-apps-script/trinidad/claudeClient.gs` - Claude API client for crime extraction
- `google-apps-script/trinidad/config.gs` - API keys, model config, sheet/source config
- `docs/FACEBOOK-DATA-COLLECTION.md` - Facebook sources
- `docs/automation/WEEKLY-REPORT-SAFEGUARDS.md` - Blog validation safeguards
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
- **Weekly blog automation** - Claude Haiku writes + auto-publishes every Monday
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
