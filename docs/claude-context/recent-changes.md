# Recent Changes (Rolling 30 Days)

**Purpose:** What changed recently, so I don't re-do work or miss context. Slim entries only.

**Older entries:** Archived to `docs/archive/features/`

---

## March 2026

### Muted UI Pass + SPA Script Fixes (Mar 1–2)

**Muted UI — resting-state rose removed across components:**
- `RelatedCrimes.astro` — lightning bolt icon + "View all" link: rose → slate at rest
- `TrendingHotspots.astro` — flame icon, clock icon, "View all areas" link: rose → slate at rest
- `CompactTipCard.astro` — "Read tip →" link: rose → slate at rest
- `CategoryAccordion.astro` — mobile "See all" link: rose → slate at rest
- `areas.astro` — "View Region" link: rose → slate at rest
- `blog/index.astro` — country badge: `bg-rose-50` fill → muted pill (border-only, no fill); Guyana filter button removed; thumbnail `w-20→w-24` to match "All Countries" button width (`w-24`); filter script fixed
- `faq.astro` — accordion `+` icon + hover: rose → slate/light-grey
- **Kept semantic colour:** SafetyContext fills, SiteNotificationBanner fills, QuickInsightsCard rose/emerald, Hero risk badge, Layout subscribe button

**Accordion CSS transitions — `height: auto` pattern applied to:**
- `area/[slug].astro` — date accordion + "More stats" tray (`more-stats-content` class)
- `region/[slug].astro` — date accordion
- `faq.astro` — replaced `max-height: 600px` hack with `height: auto`
- `DateAccordion.astro` — already used `height: auto`, confirmed correct

**SPA navigation bug fixed (`is:inline` → `<script>` + `astro:page-load`) on:**
- `areas.astro` — search + sort listeners
- `area/[slug].astro` — accordion, more-stats toggle, share buttons; `define:vars` → hidden `<div id="areaPageData">` data element; dead badge code removed
- `region/[slug].astro` — accordion + more-stats toggle
- `compare.astro` — `define:vars` data split to `window.__compareData`; all logic in `astro:page-load`
- `faq.astro` — tag change only (`is:inline` → `<script>`); logic already had `astro:page-load`
- `DateAccordion.astro` — fixed wrong comment ("is:inline re-runs" was incorrect)
- `blog/index.astro` — filter vars moved inside `astro:page-load`

---

## February 2026

### Institutional Data Capability Sheet (Feb 25)
- **New page:** `/data-capability-sheet/` — SSR, institutional document for insurers, risk consultancies, researchers, grant committees
- **Content config:** `src/config/capabilitySheetConfig.ts` — single source of truth for all copy, datasets, packages, roadmap
- **Placeholders:** `contact.email`, `contact.entity`, `contact.dataEthicsPath` are `null` → hidden from render. Set to real values when ready — no other files to touch.
- **Dynamic month count:** Reads `health-data.json` (`oldest_story` field) at render time → computes "X+ months" automatically. Token `{MONTHS}` in config is substituted in overview text and data asset table.
- **Print/PDF:** "Export PDF" button calls `window.print()`; `@media print` CSS hides site chrome, forces A4 layout, preserves brand colours.
- **Standalone HTML:** `docs/data-capability-sheet.html` — fully self-contained, no framework dependency, for sending directly to contacts.
- **Markdown:** `docs/data-capability-sheet.md` — internal reference version.
- **business-solutions.astro** — dark CTA banner added linking to capability sheet.

### Dashboard max-w-3xl + Collapsible Legend (Feb 23)
- Applied `max-w-3xl` standard to dashboard (was `max-w-6xl`) — hero and main content wrapper now match all other pages
- Map layout: removed `lg:grid-cols-3` side-by-side; map is full-width, legend moved to collapsible `<details>` below map
- Legend label: "View Legend" when closed, "Legend" when open (pure CSS, `group-open:hidden` / `group-open:block`)
- Spacing: Top Areas `mb-12` → `mb-6`, added missing `pt-4` to Top Areas heading to match Quick Insights + Map
- `docs/guides/DESIGN-TOKENS.md` updated: Dashboard added to standard pages list, exception note removed

### CSV Fetch Pipeline Resilience (Feb 23)
- **`csvBuildPlugin.ts`** (new Astro integration) — fetch with 3-retry exponential backoff (2s/4s/8s), row validation (missing fields, duplicate Story_IDs, >10% row count drop), writes `csv-cache.json` + `health-data.json` at build:start
- **`crimeData.ts`** — `fetchWithRetry()` + cache fallback at runtime (uses bundled `csv-cache.json`)
- **`/api/health.json`** — pre-rendered static endpoint (`prerender = true`), imports `health-data.json` written by csvBuildPlugin
- **Files created:** `src/integrations/csvBuildPlugin.ts`, `src/data/csv-cache.json`, `src/data/health-data.json`, `src/pages/api/health.json.ts`
- **CRITICAL GOTCHA:** Dynamic `await import()` inside Astro integration hooks causes "Vite module runner has been closed" — always use static top-level imports in integrations (`redirectGenerator.ts` also fixed)
- **Infrastructure:** Deleted `crime-hotspots-guyana` Cloudflare Pages project; fixed expired `CLOUDFLARE_API_TOKEN` in GitHub Actions secrets

### Story_ID-Based Slug Migration (Feb 23)

- **New URL format:** `/trinidad/crime/00842-missing-man-found-dead-princes-town/` (Story_ID prefix + 6 headline words)
- **Old URL format:** `/trinidad/crime/missing-man-found-dead-princes-town-2026-01-15/` — SSR 301-redirects to new URL (scales infinitely, no `_redirects` file needed)
- **Crimes with no Story_ID:** slug unchanged (old headline-date format stays)
- **`csvParser.ts`** — added `generateSlugWithId(storyId, headline)`
- **`Crime` interface** — new fields: `storyId: string | null`, `oldSlug: string`
- **`crimeData.ts` + `dashboardDataLoader.ts`** — read `story_id` column; compute conditional slug
- **`[slug].astro`** — SSR fallback: `oldSlug` match → `Astro.redirect(newSlug, 301)` before 404
- **`src/integrations/redirectGenerator.ts`** — new Astro integration: build-time CSV fetch, duplicate-slug validation (blocks build on collision), writes `src/data/redirect-map.json`
- **1,984 redirects** mapped at build time; missing Story_ID rows warn (non-blocking)

### UI Polish — Accent Discipline & FAQ (Feb 20)

- **QuickAnswers.astro** (created) — FAQ component on homepage bottom: 4 Q&As (40-50 words each), FAQPage JSON-LD schema, per-question deep-dive links, "Read full Methodology" CTA
- **StatCards.astro** — added `highlight?: boolean` prop; murder stat cards now render count in `text-rose-600` site-wide
- **`area/[slug].astro`, `region/[slug].astro`** — Murders (YTD) card passes `highlight: true`
- **`statistics.astro`** — previous year murder rate number fixed to rose-600 (YTD was already rose); all section headings muted to `text-body font-bold text-slate-500`; full dark mode pass
- **`statistics.astro`, `archive/index.astro`, `archive/[year]/[month].astro`** — nav buttons changed from rose outline → neutral grey border pattern
- **`archive/index.astro`** — "Trinidad & Tobago" subtitle muted to slate; crime count text on cards muted; arrow chevron only rose on hover; current month heading stays rose-600
- **`archive/[year]/[month].astro`** — scroll hint arrow muted (removed animate-pulse)
- **`FeedbackToggle.astro`** — background changed from `bg-white` → `bg-slate-50` for visual separation
- **Areas/regions/compare pages** — responsive padding fixed (`px-4` → `px-4 sm:px-6 lg:px-8`) to align with header
- **DESIGN-TOKENS.md** — v1.8: muted section heading rule codified, antipattern added, page-type distinction documented

### User Journey Overhaul — "Lead with the Story" (Feb 19)

- **HomepagePulse.astro** (created) — live Trinidad stats below country card: incidents this week (±%), top area, murders, latest headline, CTA to dashboard
- **DashboardStory.astro** (created) — narrative summary at top of dashboard: week-over-week incidents, top area, murder trend
- **AreaNarrative.astro** (created) — "This Week in [Area]" prose with contextual CTAs (compare, archive) and "New Since Last Visit" badge slot
- **Homepage** (`index.astro`) — Trinidad card now links directly to dashboard (skip modal), restructured layout: Trinidad + pulse grouped, Coming Soon cards below
- **Area detail** (`area/[slug].astro`) — added AreaNarrative, contextual compare prompt (suggests related area), "New since your last visit" badge (localStorage)
- **Dashboard** (`dashboard.astro`) — added DashboardStory after notification banner
- **DESIGN-TOKENS.md** — v1.7: Feature Index table, Live Pulse Indicator / Alert Badge / Contextual CTA Links patterns
- **Gotcha:** "New Since" badge uses localStorage key `crimehotspots_area_visit_{slug}`, client-side only

### Headlines Dark Mode & CSS Minimalism Polish (Feb 18)

- **CrimeCard.astro:** Muted badges (multi-color → neutral `bg-slate-200`/`text-slate-600`), unified grey tones, `font-medium` weight, View Details muted
- **CrimeDetailModal.astro:** Full dark mode — shell, header, headline, details grid, action buttons, share buttons, JS-generated metadata/summary/details
- **Headlines accordion:** Dark mode for server-rendered + JS-generated accordions, count pills match dashboard Top Areas style
- **Filter tray:** Dark mode bg fix (`/90` opacity syntax), custom select chevron SVG (light/dark), `overflow-y-auto`, `color-scheme: dark` for native date icons
- **Hero.astro:** Added `sm:px-6 lg:px-8` padding alignment with header
- **Layout.astro:** Added `--ch-pill-bg`/`--ch-pill-text` CSS vars, `color-scheme: dark` for native form controls
- **"Showing X of Y" text:** Muted to match "Data as of" and "View Archive" tone
- **DESIGN-TOKENS.md:** Updated with pill CSS vars

### Design System Audit — Full Token Pass (Feb 17)
- **Type scale:** 8 tokens → 4 strict levels: `text-display` (32px), `text-heading` (22px), `text-body` (18px), `text-caption` (12px)
- **Font weights:** Only `font-normal` and `font-bold` — `font-semibold` eliminated from headings
- **IslandSelectorModal.astro** created — replaces 4 near-identical modals (`HeadlinesModal`, `DashboardModal`, `ArchivesModal`, `AreasModal`). Backward-compat aliases: `window.openDashboardModal()` etc.
- **Card opacity standardized:** all `bg-white/70`, `bg-white/80`, `bg-white/90` → `bg-white/85`
- **`gray-*` → `slate-*`** audit (DashboardInfoCards)
- **`border-radius.lg`** changed from 8px → 12px in tailwind.config.mjs
- **`min-h-button`** named token added (22px)
- **`mt-30`** in footer → `mt-16` (8px grid fix)
- **Leaflet cluster hex colors** → rose palette CSS vars
- **Pages polished:** `crime/[slug].astro`, `blog/[slug].astro`, `headlines.astro`, `areas.astro`
- **`aria-hidden="true"`** on timeline dots in headlines (a11y)
- **Filter tray width** → `max-w-[min(20rem,calc(100vw-2rem))]` (375px phone fix)
- **Blog content:** `max-w-prose` (65ch) wrapping `<Content />`
- **Share buttons:** platform colors fixed (were `bg-slate-400`)
- **DESIGN-TOKENS.md:** Updated to v1.4 with new type scale
- **Files deleted:** `HeadlinesModal.astro`, `DashboardModal.astro`, `ArchivesModal.astro`, `AreasModal.astro`
- **Files created:** `IslandSelectorModal.astro`, `docs/claude-context/ux-audit-progress.md`

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
