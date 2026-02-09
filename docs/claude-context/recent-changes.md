# Recent Changes (Rolling 30 Days)

**Purpose:** What changed recently, so I don't re-do work or miss context. Slim entries only.

**Older entries:** Archived to `docs/archive/features/`

---

## February 2026

### UX Foundation Improvements (Feb 9)

- **Data freshness indicator** on dashboard — "Data as of [date]" below subtitle, updates with year filter
- **Share buttons on area pages** — X, Facebook, WhatsApp (same pattern as crime detail pages)
- **RSS feed** (`/rss.xml`) — blog posts + latest 20 crime headlines, pre-rendered, `<category>` tags per crime type
- **RSS autodiscovery** `<link>` in Layout `<head>`, visible RSS icon in footer + blog index
- **Empty state for headlines filters** — friendly message when filters return zero results
- **Crime type tooltips on dashboard** — InfoPopup explaining all 9 crime type definitions
- **Dataset license field** — CC BY 4.0 added to murder count structured data (GSC fix)
- **Files created:** `src/pages/rss.xml.ts`
- **Files modified:** `dashboard.astro`, `area/[slug].astro`, `Layout.astro`, `headlines.astro`, `blog/index.astro`, `murder-count.astro`
- **Installed:** `@astrojs/rss`

### Trending Hotspots Component (Feb 8)
- "Hot Areas This Week" (top 5 by crime count, 7-day window, server-rendered) + "Your Recent Views" (localStorage, client-side)
- Placed on crime detail pages + CrimeDetailModal
- **Files created:** `src/lib/trendingHelpers.ts`, `src/components/TrendingHotspots.astro`
- **Files modified:** `safetyHelpers.ts` (exported `toDate()`), `modalHtmlGenerators.ts` (`generateTrendingHotspotsHTML()`)

### Link Checker Automation (Feb 7)
- Bi-weekly dead link detection for news article source URLs in Trinidad CSVs
- HEAD-then-GET retry, trigger chaining for GAS 5-min limit, email reports
- **Files created:** `google-apps-script/trinidad/linkChecker.gs`

### Weekly Blog Automation (Feb 6)
- Fully automatic: Monday 10 AM trigger → CSV stats → Claude Haiku writes blog → GitHub commit → Cloudflare deploys
- 4-layer validation (min crimes, freshness, backlog, duplicate)
- **Gotcha:** Must use CSV-based `fetchCrimeData()`, not sheet `.getDataRange()` (GAS timezone mismatch)
- **Files created:** `google-apps-script/trinidad/weeklyBlogAutomation.gs`

### Blog Internal Linking (Feb 6)
- "More Weekly Reports" on blog post pages (3 recent same-country posts)
- **Files modified:** `src/pages/blog/[slug].astro`

### CrimeDetailModal Refactoring (Feb 6)
- 918 → 261 lines. Thin orchestrator importing 5 modules from `src/scripts/modal*.ts`
- Eliminated duplicated utilities (now imports from `src/lib/`)
- **Gotcha:** Area detail pages use `areaCrimes` only in `window.__crimesData`

### UX Navigation Overhaul (Feb 5)
- BottomNav.astro (mobile tab bar), RelatedCrimes.astro (actual crime cards)
- Header: direct links on Trinidad pages, active section indicator
- Footer: added "Browse" column with primary nav
- **Config:** `countries.ts` — `showInBottomNav`, `icon` fields
- **Gotcha:** `getActiveSection(path)` detects current section for highlighting

### Routes Centralization (Feb 4)
- `src/config/routes.ts` — single source of truth for all internal routes
- Static: `routes.trinidad.dashboard`, dynamic: `buildRoute.crime(slug)`
- **Gotcha:** Inline scripts (`<script is:inline>`) can't import modules — have "keep in sync with routes.ts" comments

### Section Picker Modal (Feb 2)
- Homepage island click opens section picker instead of navigating to dashboard
- Sections driven from `countries.ts` config
- **Files created:** `src/components/SectionPickerModal.astro`

### Facebook Post Submitter (Feb 2)
- GAS web app for manual Facebook crime post entry → Claude Haiku extraction → Production sheet
- Year toggle: 2026 → pipeline, 2025 → FR1 sheet
- **Files created:** `google-apps-script/trinidad/facebookSubmitter.gs`

### Modal Pageview Tracking (Feb 2)
- `pushState` on modal open → Cloudflare + GA4 both detect it as pageview
- `popstate` listener closes modal on browser back button
- **Files modified:** `CrimeDetailModal.astro`

---

## January 2026

### Dynamic OG Image (Jan 28)
- Build-time OG image for murder count page (satori + sharp → 1200x630 PNG)
- **Files created:** `src/lib/generateOgImage.ts`

### Murder Count Performance (Jan 28)
- Turnstile made opt-in (`includeTurnstile` prop, defaults false)
- Pagefind disabled on murder count page
- **3 fewer requests, ~60-80KB saved**

### Security Audit (Jan 27)
- Removed stale Google Fonts from CSP, added Secure cookie flag, GAS email escaping
- **Grade: A-**

### LCP Font Optimization (Jan 27)
- Self-hosted Inter font (woff2), removed Google Fonts external requests
- Hero compact variant + slot support

### Safety Context System (Jan 26)
- Area crime scoring (1-10), contextual tips (high/neutral/low risk)
- **Files created:** `src/lib/safetyHelpers.ts`, `src/components/SafetyContext.astro`
- **Gotcha:** Modal needs `window.__crimesData` populated; scoring uses 90-day rolling window

### Hybrid → Full SSR Switch (Jan 26 → Feb 4)
- Crime pages switched from 90-day prerender to full SSR + CDN cache
- **Reason:** Old pages 404'd silently, GSC reported 446+ pages as canonical issues
- **Never:** Add `prerender = true` back to `[slug].astro`

### SEO Phase 1 (Jan 23)
- Statistics three-tier system, murder count title optimization, internal linking network
- Dynamic year handling (auto-calculates currentYear/previousYear)

### Murder Count Page (Jan 22)
- iOS flip counter, share buttons, responsive scaling
- **Files:** `murder-count.astro`, `FlipCounter.astro`, `flip-counter.css`, `flipCounter.ts`

### Related Crime Pills (Jan 10)
- Visual pills for related crime types (gray) next to primary (rose)
- CSV parsing fix for quoted comma fields in area aliases

### Report Page Refactoring (Jan 9)
- Extracted `formHelpers.ts` + `reportValidation.ts`, 22% line reduction
- Report Issue button added to CrimeDetailModal
- **Gotcha:** Turnstile explicit mode — use EITHER data attributes OR render() config, not both
- **Gotcha:** Components on same page need `idPrefix` for unique IDs
