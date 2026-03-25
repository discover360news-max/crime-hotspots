# Site Features Registry

**Purpose:** Holistic view of every active feature on crimehotspots.com. Check this to understand what the site does before making changes.

**Last Updated:** March 25, 2026 (murder-count JNews redesign + year filter + MonthlyBreakdownChart component)

---

## Pages & Routes (31 pages)

### Marketing & Static
| Page | Route | Purpose |
|------|-------|---------|
| Homepage | `/` | **SSR + CDN cache (Mar 25 2026). JNews WOW layout:** Dark hero (H1 = "Live Crime Statistics for the Caribbean", subtitle, live pulse = "X crimes in Trinidad this week · Y murders", CTAs: Dashboard/Murder Count) → T&T section (section label + 2-col: island card left / 3 latest headline cards right + Explore 3-tile row below) → dark separator ("More Countries") → coming-soon islands row (Jamaica countdown / Guyana / Barbados) → QuickAnswers. Headline cards: rose crime-type pill + headline (line-clamp-2) + area + date, each links to crime detail page. T&T card: `aspect-square` island image + inline stats (crimes/top area/murders this week). Render mode changed from pre-rendered to SSR + `Cache-Control: public, max-age=3600, s-maxage=82800`. `HomepagePulse` component no longer imported (inline D1 data). Jamaica countdown: same JS as before, D:HH:MM to 2026-07-04T00:00:00. |
| About | `/about/` | Project background |
| Contact | `/contact/` | Contact information |
| Methodology | `/methodology/` | Data collection process |
| FAQ | `/faq/` | Frequently asked questions |
| Privacy | `/privacy/` | Privacy policy, cookie consent |
| Business Solutions | `/business-solutions/` | B2B offerings — links to capability sheet |
| Data Capability Sheet | `/data-capability-sheet/` | Institutional document (insurers, researchers, grant committees). Content driven by `src/config/capabilitySheetConfig.ts`. Month count is dynamic from `health-data.json`. Placeholders: set `contact.email`, `contact.entity`, `contact.dataEthicsPath` to non-null when ready. |
| Support | `/support/` | Ko-fi CTA page — primary button to ko-fi.com/crimehotspots, 3 "what support covers" cards (Hosting & Infrastructure, AI Data Pipeline, Development), ghost CTAs to /report + /help. Newsletter CTA destination. Header ♥ Support + footer button both route here (not directly to Ko-fi). |
| Report | `/report/` | Anonymous crime reporting form (Turnstile CAPTCHA) |
| Help Centre Index | `/help/` | Pre-rendered. Search bar (client-side, `define:vars` helpIndex) + 6 section cards + footer CTA row (FAQ, Methodology, Contact). `CollectionPage` JSON-LD. Sitemap: `priority 0.7, changefreq monthly`. |
| Help Article | `/help/[slug]` | Pre-rendered. 14 articles across 6 sections (Getting Started, Understanding the Data, Using the Dashboard, Safety Tips, Crime Reports, For Researchers). Sidebar: section nav + cross-section related + Ko-fi card. Related articles panel before prev/next. `Article` JSON-LD (`headline`, `description`, `articleSection`, `dateModified`, `author`/`publisher`). BreadcrumbList via Breadcrumbs component. `related` frontmatter field drives cross-links. Sitemap: `priority 0.6`, `lastmod` from `date_updated`. **Update relevant articles whenever features change — see SESSION.md checklist.** |
| 404 | `/404` | Custom error page |

### Jamaica Crime Data
| Page | Route | Rendering | Purpose |
|------|-------|-----------|---------|
| Dashboard | `/jamaica/` | Pre-rendered | Jamaica crime dashboard (data pipeline pending) |
| Headlines | `/jamaica/headlines/` | Pre-rendered | Jamaica headlines |
| Parishes | `/jamaica/parishes/` | Pre-rendered | Browse by parish |
| Statistics | `/jamaica/statistics/` | **SSR + CDN cache** | Full statistics page (T&T parity). Dataset + FAQPage (4 Q&As) + BreadcrumbList JSON-LD. Population 2.8M, "parishes" language. Dynamic years. `allCrimes: Crime[] = []` stub until Jamaica D1 live (one TODO comment to uncomment). |
| Murder Count | `/jamaica/murder-count/` | **SSR + CDN cache** | Full murder count page (T&T parity). FlipCounter, YoY comparison, 3 rate cards (YTD / **Annualized** / Previous Final). WebPage + Dataset + BreadcrumbList JSON-LD. Population 2.8M. Latest incidents sidebar hidden until data live. `allCrimes: Crime[] = []` stub until Jamaica D1 live. |
| Archive Index | `/jamaica/archive/` | Pre-rendered | Browse by year |
| MP Index | `/jamaica/mp/` | Pre-rendered | Directory of all 63 MPs grouped by parish. Each card: photo, name, party badge, constituency. |
| MP Profile | `/jamaica/mp/[nameSlug]` | Pre-rendered | Individual MP profile. 2-col card: photo left (`min-h-[500px]`), identity+contact right. Social links rendered as brand SVG icons (Facebook, Instagram, X, YouTube, TikTok). JSON-LD Person schema. Data: `src/data/mps-jamaica.json`. Crime stats placeholder until Jamaica D1 pipeline is live. |

---

### Trinidad Crime Data
| Page | Route | Rendering | Purpose |
|------|-------|-----------|---------|
| Dashboard | `/trinidad/` | **SSR + CDN cache** | **JNews-style hierarchy (Mar 24 2026):** dark hero band → 4 gradient `GradientStatCard` vitals (Total Incidents / Murders / Victims / Crimes/Day) → `DashboardStory` narrative → crime breakdown scroll → sticky year filter bar → 2-col section (Leaflet map left / Top Areas `TopRegionsCard` right) → Quick Insights card. Stat cards (11: All Crimes + 10 crime types) below. Filters drawer (crime type/region/area). Trend indicators. Initial render has real D1 data — shimmers only appear on year filter changes. `onYearChange` wrapped in try/catch — prevents shimmer freeze if API fails. |
| Headlines | `/trinidad/headlines/` | Pre-rendered | **JNews full redesign (Mar 25 2026):** Dark hero (H1 = "Latest Crime Headlines", live pulse = "{N} crimes in the last 30 days", CTA row: Dashboard / Murder Count / Filters). Type filter chips row (horizontal scroll, frequency-ordered, syncs with filter tray select). Two-column layout `lg:grid-cols-[1fr_272px]`. Main: crime list grouped by date — dark slate separator bands (`bg-slate-800`) as accordion headers (weekday + date + crime count + victim count), top 3 days expanded. Crime cards: colored left bar (rose/amber/slate hex via inline style) + type pill + area + headline (line-clamp-2) + chevron arrow. Flat list when any filter is active. Load More pagination (30/page). Sidebar: YTD murders dark gradient card + hot areas top 3 (links to area pages) + `NewsletterSignup variant="card"`. Filter tray (right drawer): date range + crime type + region + area cascading. JS extracted to `headlinesPage.ts`. |
| Crime Detail | `/trinidad/crime/[slug]` | **SSR + CDN cache** | **JNews article layout (Mar 25 2026):** category pill (crime type, rose) + related type pills above H1 → `font-black` H1 (headline) → byline row (date · area · source) → featured crime type thumbnail image (`h-40 sm:h-52 object-cover rounded-xl`) → slim nav row (Dashboard/Headlines/Safety Tips) → `SiteNotificationBanner` → `lg:grid-cols-[1fr_256px]` main+sidebar. Main: summary text → report issue card → `SafetyContext` → `CompactTipCard` (max 3, matched by type+area) → `FeedbackToggle` → `TrendingHotspots` → prev/next nav. Sidebar: share card (X/Facebook/WhatsApp) → `RelatedCrimes` → support card. `max-w-4xl` container. Share script uses `DOMContentLoaded`. `image` field added to NewsArticle JSON-LD schema. |
| Areas Index | `/trinidad/areas/` | Pre-rendered | Browse all crime areas |
| Area Detail | `/trinidad/area/[slug]` | **SSR + CDN cache** | **JNews hierarchy (Mar 24 2026):** dark hero (H1 = "{areaName}", live pulse = risk score + 90d incident count, freshness line) → 4-card GradientStatCard vitals (Risk Score/amber, Incidents 90d/slate, Murders YTD/crimson, Top Crime Type/violet) → 2-col layout (1fr/256px). Main: AreaNarrative summary, expandable extra stats tray (Shootings/Home Invasions/etc.), SafetyContext, FeedbackToggle, compare prompt, newsletter, crime type breakdown table, recent headlines accordion, related areas. MPSidebar (showAll=false). |
| Statistics | `/trinidad/statistics/` | **SSR + CDN cache** | Two-tier crime rates: previous year final (official) + current year annualized at current pace. All displayed rates are annualized for apples-to-apples comparison. Raw YTD rates removed Mar 2026. FAQPage JSON-LD (4 Q&As) + Dataset + BreadcrumbList. |
| Regions | `/trinidad/regions/` | Pre-rendered | **JNews dark hero (Mar 25 2026):** compact dark hero (H1 = "Crime by Region", pulse = "{N} regions tracked. Sorted by crime volume.") + rose/ghost CTAs → `max-w-5xl` card grid. No vitals row (directory page). Cards: 2-col grid, each showing Incidents (90d) / Murders (YTD) / Areas count. |
| Region Detail | `/trinidad/region/[slug]` | **SSR + CDN cache** | JNews hierarchy (Mar 24 2026): dark hero (H1 = "{regionName} Region", live pulse = 90d incident count), 4-card GradientStatCard vitals (Incidents 90d/slate, Murders YTD/crimson, Avg Risk Score/amber, Most Active Area/violet), expandable extra stats tray, dark separator band ("Regional Breakdown"), area ranking grid, crime breakdown YoY table, recent headlines accordion. MPSidebar (showAll=true). |
| MP Index | `/trinidad/mp/` | Pre-rendered | Directory of all 41 MPs grouped by region. Each card: photo, honorific name, party badge, constituency. |
| MP Profile | `/trinidad/mp/[nameSlug]` | Pre-rendered | Individual MP profile. 2-col card: photo left, identity+contact right. Crime stat cards per region (reuses region page pattern). JSON-LD Person schema. Ambiguous MPs show boundary note + two region sections. Data: `src/data/mps.json`. |
| Compare | `/trinidad/compare/` | **SSR + CDN cache** | Side-by-side area comparison. Pre-loads Port of Spain vs San Juan by default. **Dark slate hero (Mar 25 2026):** from-slate-900 to-slate-800, H1 font-black text-white, inline breadcrumb nav. Sticky selector bar (Area A / Area B dropdowns). All containers `max-w-5xl`. Area list + per-area stats derived from D1 at request time; 90-day window always current. |
| Murder Count | `/trinidad/murder-count/` | **SSR + CDN cache** | **JNews redesign (Mar 25 2026).** `?year=` URL param for historical views (validated: 2024–currentYear, falls back to currentYear). Dark hero: H1 + bigger flip counter (`.hero-counter-wrap` CSS override: 96/130/180px at sm/default/md+) + live pulse + YoY indicator + CTAs. GradientStatCard vitals row overlapping hero (4 cards). **Current year:** YTD Rate (crimson) / Annualized Rate (slate) / Previous Year Final (slate) / Days Between Murders (amber). **Past year:** Final Rate / Total Murders / vs previousYear % / Daily Average. Year pill selector always rendered (rose = active, slate = inactive). `MonthlyBreakdownChart` for monthly breakdown (currentMonthIdx=12 on closed years = all bars rendered as past). YoY comparison card hidden if no previous year data. Sidebar: share buttons + latest incidents scoped to selected year + newsletter. FAQPage JSON-LD (3 Q&As) + WebPage + Dataset (dateModified) + BreadcrumbList. **Note:** year selector shows only years present in `allCrimes` — if D1 only has current year loaded, only one pill appears. |
| Murders List | `/trinidad/murders/` | **SSR + CDN cache** | **JNews hierarchy (Mar 25 2026):** dark hero (H1 = murder count as large number, subtitle = "Murders in Trinidad & Tobago · {year}", live pulse = YoY same-period comparison sentence) → 4-card GradientStatCard vitals (Murders YTD/crimson, Projected Annual/amber, vs Last Year %/violet, Days with Murders/slate) → "All Murders" section label → date-grouped list. YoY computed against same calendar date in previous year (not full-year total). `max-w-5xl`. Load more: 14 groups initially, +14 per click. Schema: `WebPage` + `Dataset` (`slot="head"`). |
| Archive Index | `/trinidad/archive/` | Pre-rendered | Browse by year |
| Archive Month | `/trinidad/archive/[year]/[month]` | Pre-rendered | Crimes for specific month |

### Safety Tips
| Page | Route | Rendering | Purpose |
|------|-------|-----------|---------|
| Safety Tips Index | `/trinidad/safety-tips/` | Pre-rendered | Category accordion (sorted by tip count), 25 launch tips |
| Tip Detail | `/trinidad/safety-tips/[slug]` | **SSR + CDN cache** | Full tip with body, related incidents, related tips, back link |
| Category | `/trinidad/safety-tips/category/[cat]/` | Pre-rendered | All tips for one category |
| Context | `/trinidad/safety-tips/context/[ctx]/` | Pre-rendered | Tips by situation context |
| Area | `/trinidad/safety-tips/area/[area]/` | Pre-rendered | Area-specific tips (min 3 to render) |
| Submit | `/trinidad/safety-tips/submit/` | Pre-rendered | Community submission form → GAS → "Safety Tip Submissions" sheet |

### Blog & Tools
| Page | Route | Purpose |
|------|-------|---------|
| Blog Index | `/blog/` | All blog posts, weekly reports, RSS link. Country filter (All / Trinidad & Tobago). Load more: 8 posts initially (hidden server-side to prevent flash), +8 per click. Button label shows `Load N more (X remaining)`. Filter change resets visible count to 8 for the filtered set. Both controls share a single `render()` — no state conflicts. |
| Blog Post | `/blog/[slug]` | Individual post, "More Weekly Reports" section |
| RSS Feed | `/rss.xml` | Blog posts + latest 20 crime headlines (pre-rendered) |
| Social Image Generator | `/tools/social-image-generator/` | Create shareable crime stat images |

### API Endpoints (SSR, D1-backed, CDN-cached)
| Endpoint | Route | Purpose |
|----------|-------|---------|
| Dashboard API | `/api/dashboard/?year=2026\|2025\|all` | Pre-computed stats, trends, insights, topRegions from D1. Cache: 1h browser / ~23h CDN edge. |
| Crimes API | `/api/crimes/?year=2026\|2025\|all` | Full Crime objects from D1 (Date fields stripped; client reconstructs `dateObj` from year/month/day). Same cache headers. |
| Search API | `/api/search/?q=...` | D1 FTS5 search for crimes + LIKE for areas + static filter for MPs. Returns typed `SearchResult[]`. No CDN cache. Min 2 chars. |
| Health | `/api/health.json` | Build health status (pre-rendered static) |
| Latest Crimes | `/api/latest-crimes.json` | Latest 20 crimes for SearchModal suggestions (pre-rendered static) |

---

## Components (35 active)

### Core Layout (`src/layouts/`)
| File | Purpose | Key Props |
|------|---------|-----------|
| Layout.astro | Root layout wrapper — `<head>`, fonts, CSP, GA4, Pagefind, Turnstile, utility bar, footer | `ogType` (default `"website"`, pass `"article"` on crime/blog pages), `includePagefind` (default `true`), `includeTurnstile` (default `false`). **`<slot name="head" />`** at line 137 — DO NOT REMOVE (crime pages inject JSON-LD here). **Utility bar** (Mar 25 2026): `bg-slate-900`, `hidden md:block`, non-sticky (scrolls away), 4 links (Statistics · Regions · Compare Areas · Safety Tips), active state via `Astro.url.pathname`, tagline right (`hidden lg:block`). Rendered above `<Header />`. |

### Navigation & Layout
| Component | Purpose |
|-----------|---------|
| Header.astro | Sticky `top-0 z-40` top nav. Sits below the non-sticky utility bar in Layout.astro. Direct links on Trinidad pages, active section indicator. Mobile: `logo-icon.png` (36px square). Ghost Subscribe buttons. ♥ Support → Ko-fi (desktop + hamburger). Mobile menu + subscribe tray are native `<dialog>` elements. **`top-16` references on filter/control bars remain correct** — utility bar is non-sticky so header height is still 64px. |
| BottomNav.astro | Mobile bottom tab bar (Dashboard, Headlines, Areas, Report, More). Config-driven from `countries.ts`. More menu is a native `<dialog>` bottom sheet. Country indicator strip always visible. |
| MPSidebar.astro | Sticky right-column sidebar for area + region pages. Sections: share buttons (`.sb-share-btn` pattern), MPs card, Ko-fi card. `showAll=false` (area): 2 MPs + chevron toggle. `showAll=true` (region): all on desktop, mobile toggle. Design rules: `.memory/entries/C004-mpsidebar-design-rules.md`. |
| Breadcrumbs.astro | Breadcrumb navigation for SEO |
| SectionPickerModal.astro | Homepage island click → section chooser. Sections driven from `countries.ts` |
| Hero.astro | Full-width gradient hero with CTAs, compact variant, `<slot>` support |

### Crime Display
| Component | Purpose |
|-----------|---------|
| CrimeCard.astro | Individual crime summary card |
| CrimeDetailModal.astro | Full crime detail in modal (thin orchestrator → 5 modules) |
| DateAccordion.astro | Date-grouped crime list (expandable) |
| RelatedCrimes.astro | Related crime cards (same area priority, then same type) |
| TrendingHotspots.astro | "Hot Areas This Week" (server) + "Your Recent Views" (localStorage) |
| SafetyContext.astro | Color-coded area safety tips (high/neutral/low risk) |
| FlipCounter.astro | iOS-style split-flap counter (murder count page) |

### Narrative & Engagement
| Component | Purpose |
|-----------|---------|
| HomepagePulse.astro | Live Trinidad stats below country card (incidents, top area, murders, latest headline). Always renders card bottom — shows "No incidents reported this week." if no recent data (CTA always visible) |
| DashboardStory.astro | Narrative summary at top of dashboard (week-over-week incidents, top area, murder trend) |
| AreaNarrative.astro | "This Week in [Area]" prose + contextual CTAs (compare, archive) + "New Since" badge slot |
| QuickAnswers.astro | FAQPage schema + H3 questions targeting Google "People Also Ask" boxes. 40-50 word answers with internal deep-dive links. Used on homepage. |

### Dashboard & Stats
| Component | Purpose |
|-----------|---------|
| GradientStatCard.astro | Dashboard hero vitals card (Mar 24 2026). Props: `variant` (slate/crimson/amber/violet — controls gradient colour), `label`, `value`, `sublabel`, `trend`, `trendLabel`. Trend arrows use `.trend-indicator.hidden` pattern — JS populates via `updateCardWithTrend()` in `dashboardUpdates.ts`, same as `StatCard`. Variant class names are in a lookup object inside the component. |
| MonthlyBreakdownChart.astro | Generic 12-bar monthly breakdown chart (Mar 25 2026). Props: `values: number[]` (12 monthly counts Jan–Dec), `currentMonthIdx: number` (0-indexed boundary — past months slate, current month accent, future months muted; pass `12` for closed years to render all as past), `label?: string`, `footnote?: string`, `accentColor?: 'rose'|'amber'|'slate'` (default `'rose'`). Caller computes the 12 values. Reusable on any crime or stats page. |
| DashboardInfoCards.astro | Crime summary cards |
| StatCard.astro | Individual stat card |
| StatCards.astro | Grid of stat cards with YoY comparisons. Optional `size: 'large'` (bumps number to text-3xl/4xl) and `riskColor: 'high'|'neutral'|'low'` (amber/slate/emerald) props — used on Risk Level card on area pages. |
| TopRegionsCard.astro | Top regions visualization + shimmer loading |
| QuickInsightsCard.astro | Daily avg (crimes/day + victims/day, left column), Peak Day + Busiest Month + Highest/Lowest Crime Area (2×2 right grid). Padding p-5, gap-y-4, daily avg text-base/xl. |
| FiltersTray.astro | Year/date filter controls |
| DataTable.astro | Responsive table wrapper |

### Modals
| Component | Purpose |
|-----------|---------|
| IslandSelectorModal.astro | Unified island picker (dashboard/headlines/archives/areas). Exposes `window.openIslandModal(section)`. Backward-compat aliases: `openDashboardModal()`, `openHeadlinesModal()`, etc. Replaced 4 separate modal files. |
| SearchModal.astro | Site-wide search (Ctrl+K). Powered by `/api/search` (D1 FTS5 crimes, mps.json MPs, D1 LIKE areas). Dark mode. Custom debounced input (300ms). Typed result cards (Crime/MP/Area badges). Suggestions panel (empty state): recent searches (localStorage `ch_search_history`, max 5), 2 latest crimes (fetched from `/api/latest-crimes.json`), static crime-type chips. |
| ReportIssueModal.astro | Report crime data issues |

### Safety Tips
| Component | Purpose |
|-----------|---------|
| TipCard.astro | Full tip card for index/category/context/area pages. Badge reads "Category while Context" (muted slate). |
| CompactTipCard.astro | Inline tip card on crime detail pages (max 3, matched by crime type + area) |
| CategoryAccordion.astro | Collapsible category section for safety tips index. Sorted by tip count, first expanded. Own class names (`cat-*`) — does not conflict with DateAccordion. |

### Utility & Engagement
| Component | Purpose |
|-----------|---------|
| AreaNameTooltip.astro | Area alias tooltip (dotted underline) |
| InfoPopup.astro | Click-based help tooltips |
| LoadingShimmer.astro | Facebook-style skeleton loading |
| BlogRotatingBanner.astro | Auto-rotating blog promotion (5s, country-filtered) |
| SiteNotificationBanner.astro | Dismissible site-wide notification |
| FeedbackToggle.astro | Helpful/not helpful toggle on crime pages |
| NewsletterSignup.astro | Buttondown email signup — 3 variants: `card` (area pages, headlines sidebar), `inline` (statistics), `footer` (Layout footer, subscribe tray, crime modal). POSTs directly to Buttondown embed endpoint (browser-side). **`card` variant:** `flex-1 min-w-0` on both the content wrapper div and email input — required to prevent overflow in narrow containers (272px sidebar). See B028. |

---

## Client-Side Scripts (`src/scripts/`)

| Script | Purpose |
|--------|---------|
| dashboardDataLoader.ts | Primary path: fetches `/api/dashboard/` + `/api/crimes/` in parallel; sets `window.__crimesData`; dispatches `crimesDataReady` event; applies pre-computed stats via `applyPrecomputed*`. CSV fallback via `initializeDashboardDataFromCSV()` if API fails. |
| dashboardUpdates.ts | Updates dashboard on filter change. Also exports `applyPrecomputedStats`, `applyPrecomputedInsights`, `applyPrecomputedTopRegions` (used by API path) + `updateCardWithTrend` (shared helper). Stat card lookups use `data-crime-type` attribute (not positional index) — adding/reordering cards requires only new count vars here + a new StatCard in dashboard.astro. `DashboardStats` interface must match `buildStats()` in `/api/dashboard.ts`. |
| statCardFiltering.ts | Stat card click-to-filter. `pluralMap` covers all 15 crime types — add new entries here when adding a new stat card. |
| statsScroll.ts | Smooth scroll to stats section |
| leafletMap.ts | Interactive Leaflet map with crime markers |
| yearFilter.ts | Year selection filter control |
| flipCounter.ts | Flip counter animation logic |
| modalHtmlGenerators.ts | Generates HTML for modal (trending, related, safety) |
| modalFeedbackHandler.ts | Helpful/not helpful feedback |
| modalShareHandlers.ts | Social sharing (WhatsApp, Facebook, X, copy link) |
| modalReportHandler.ts | Issue reporting form submission |
| modalLifecycle.ts | Modal open/close, pushState URL updates, popstate |
| headlinesPage.ts | Headlines page filter/chip/render logic. Reads `window.__hlData` set by `define:vars` in headlines.astro. Key functions: `getTypeStyle()` (must stay in sync with same function in headlines.astro frontmatter), `createCrimeCardHTML()`, `createSeparatorAccordionHTML()`, `syncChips()`, `applyFilters()`, `renderCrimes()`, `clearAllFilters()`. Top 3 date groups expanded by default (`index < 3`). |

---

## Build Integrations (`src/integrations/`)

| File | Purpose |
|------|---------|
| csvBuildPlugin.ts | Vite plugin — fetches CSVs at build:start with retry (2s/4s/8s), writes `health-data.json` + `area-aliases.json` (T&T; ~116 area→known_as) + `area-aliases-jamaica.json` (Jamaica; ~12 known_as aliases from `JAMAICA_REGION_DATA_CSV_URL`). **NEVER use `await import()` inside hook — causes Vite runner error (B012).** |
| redirectGenerator.ts | Build-time redirect map generator — writes `src/data/redirect-map.json` (~1,984 old→new slug mappings). Static top-level imports only. |

---

## Server & Shared Utilities (`src/lib/`)

| Utility | Purpose | Key Exports |
|---------|---------|-------------|
| crimeData.ts | Fetches/parses crime CSV (server-side). Runtime fallback via bundled `csv-cache.json`. D1 query functions for SSR routes. | `getTrinidadCrimes()`, `getCrimesByArea()`, `getCrimesByMonth()`, `getCrimesByRegion()`, `getAvailableYears()`, `generateNameSlug()`, `getAllCrimesFromD1()`, `getCrimesByAreaFromD1()`, `getCrimesByRegionFromD1()`, `getCrimesByYearFromD1()`, `getCrimesByDateRangeFromD1()` |
| csvParser.ts | Raw CSV parsing utilities. Slug generation lives here. | `parseCSVLine()`, `parseDate()`, `generateSlug()` (legacy, headline+date), `generateSlugWithId()` (current, StoryID+6 words), `createColumnMap()`, `stripQuotes()` |
| safetyHelpers.ts | Area crime scoring + safety tip engine | `calculateAreaCrimeScore()` (1-10 scale, 90-day window), `getSafetyContext()` (returns tip + risk level), `getPrimaryCrimeType()`, `toDate()` (shared date normalizer) |
| safetyTipsHelpers.ts | Curated safety tips utilities | `normalizedCrimeType()` (CSV type → tip category), `sortTipsByAreaRelevance()` (area-specific first), `slugifyCategory()` (category → URL slug) |
| dashboardHelpers.ts | Dashboard stat calculations | `countCrimeType()`, `calculateInsights()` (highest/lowest crime areas) |
| statisticsHelpers.ts | Statistics page calculations | `calculatePercentChange()`, `compareYearToDate()`, `getCrimeTypeBreakdown()`, `getTopRegions()` (crime-count based, not row count), `filterToSamePeriod()`, `formatPercentChange()`, `getTotalCrimeCount()` |
| trendingHelpers.ts | Trending areas + recent views (localStorage) | `getHotAreas()` (top 5 areas, last 7 days), `trackRecentView()`, `getRecentViews()` |
| escapeHtml.ts | XSS protection utilities | `escapeHtml()` (innerHTML), `sanitizeUrl()` (anchor hrefs), `validateUrl()` (DOM hrefs) |
| crimeColors.ts | Crime type → color hex mapping | 15 types (no Vehicle Theft). Exports `getCrimeTailwindColor()`, `getCrimeHexColor()`. Must stay in sync with crimeSchema.ts. |
| areaAliases.ts | Area name aliases (handles quoted CSV fields) | Used by tooltip + area pages |
| generateOgImage.ts | Dynamic OG image generation (satori + sharp) | Used by murder-count page (1200×630 PNG) |
| generateCrimeTypeThumbnails.ts | Crime type thumbnail URL resolver | `getCrimeTypeThumbnailUrl()` returns `/images/crime-types/{slug}.webp` (or `generic.webp`). Images are manually curated WebP files in `public/images/crime-types/`. Build-time PNG generator (`generateAllCrimeTypeThumbnails`) was retired Mar 25 2026 — stripped from file; manual curation is the intended workflow going forward. |

---

## Configuration (`src/config/` + `src/data/`)

| File | Purpose | Notes |
|------|---------|-------|
| csvUrls.ts | CSV data source URLs | **Single source of truth** for all CSV URLs. Exports: `TRINIDAD_CSV_URLS` (year-keyed), `REGION_DATA_CSV_URL`, `REGION_POPULATION_CSV_URL`, `JAMAICA_CSV_URL`, `JAMAICA_REGION_DATA_CSV_URL` (area aliases; gid=910363151 on Jamaica sheet). |
| routes.ts | All internal routes + builders | `routes.*` for static, `buildRoute.*` for dynamic. Includes `routes.trinidad.mps` + `buildRoute.mp(nameSlug)`. |
| mps.json | 41 T&T MP records | Schema: nameSlug, fullName, honorific, constituency, constituencySlug, party, partyFull, electionYear, regionSlugs, regionConfidence, contact{email,emailAlt,phone,whatsapp,office,parliamentProfile}, socials{facebook,instagram,x,youtube}, photo. Photos in `public/images/mps/` (placeholder.svg always present). Social links render as brand SVG icons. |
| mps-jamaica.json | 63 Jamaica MP records | Schema mirrors mps.json but: `parishSlugs` (not regionSlugs), socials adds `tiktok` field. Photos in `public/images/mps/jamaica/` subfolder — set `photo` as `"jamaica/filename.jpg"`. |
| crimeTypeConfig.ts | Crime type definitions + victim count rules | Victim count applies to PRIMARY crime only. 15 types: Murder/Attempted Murder/Kidnapping/Sexual Assault/Shooting/Assault/Home Invasion/Carjacking/Arson/Robbery/Domestic Violence/Extortion/Burglary/Theft/Seizures. |
| siteNotifications.ts | Site notification banner content | Toggle-based enable/disable |
| riskWeights.ts | Crime severity weights | Used by `TopRegionsCard.astro`, `dashboardUpdates.ts` (Top Regions card), and `safetyHelpers.ts` (SafetyContext). Full methodology: `docs/guides/RISK-SCORING-METHODOLOGY.md` |
| countries.ts | Country config (sections, icons, nav settings) | Imports from `routes.ts` and `csvUrls.ts` |

---

## Google Apps Script Automation (`google-apps-script/trinidad/`)

Same structure applies to `google-apps-script/jamaica/` (identical split). Full file inventory + line counts in `.memory/entries/F002-gas-automation-pipeline.md`.

### Data Collection Pipeline
| Script | Purpose |
|--------|---------|
| rssCollector.gs | Fetches RSS feeds. 3-step pubDate fallback: pubDate → dc:date → collection timestamp + 🚨 log (B023). |
| articleFetcherImproved.gs | Retrieves + parses article content |
| orchestrator.gs | Main automation flow controller |
| crimeTypeProcessor.gs | Validates/processes crime types; partitions harm types before context types (Home Invasion/Domestic Violence always last). Reads from schema.gs. |
| **preFilterCore.gs** | PREFILTER_CONFIG + preFilterArticles orchestrator + promoteFilteredArticle |
| **preFilterKeywords.gs** | loadKeywords + scoreArticle + logFilteredArticle + API tracker helpers |
| **preFilterUrlIndex.gs** | buildUrlIndex + refreshUrlIndexCache |
| **preFilterDuplicates.gs** | All checkFor* duplicate functions. Similarity helpers (calculateSimilarity, levenshteinDistance) removed — canonical defs in processorDuplicates.gs (global GAS scope). |
| **preFilterArchive.gs** | autoArchiveProcessedArticles + previewArchivableArticles |
| **processorCore.gs** | Shared helpers + main loop + date utilities (absorbed plusCodeConverter logic) |
| **processorOutputMapper.gs** | appendToProduction + appendToReviewQueue |
| **processorDuplicates.gs** | isDuplicateCrime, checkSemanticDuplicate, similarity helpers (canonical defs for preFilter too) |
| **processorMaintenance.gs** | Backlog monitoring + archiving |
| **claudeClientCore.gs** | extractCrimeData + parseClaudeResponse + test functions (Claude Haiku 4.5, prompt caching) |
| **claudePrompts.gs** | buildSystemPrompt + buildUserPrompt. Prompt includes: Assault+Robbery combination rule, context type ordering, Carjacking/DV/Extortion rules, date cross-reference rules ("a day after"), ongoing crimes rule (B023). |

### Data Management
| Script | Purpose |
|--------|---------|
| validationHelpers.gs | Data validation utilities |
| geocoder.gs | Location name → coordinates |
| syncToLive.gs | Staging → production sheet sync |
| archiveScraper.gs | Historical crime data scraping |

### Safety Tips
| Script | Purpose |
|--------|---------|
| safetyTipSubmissions.gs | Web app — receives POST from `/safety-tips/submit/`, appends to "Safety Tip Submissions" sheet tab, sends notification email. Deploy as: Execute as Me, Access: Anyone. Script Property: `NOTIFICATION_EMAIL`. Env var needed: `PUBLIC_SAFETY_TIPS_GAS_URL` in Cloudflare Pages. |

### Content & Distribution
| Script | Purpose |
|--------|---------|
| weeklyBlogAutomation.gs | Auto weekly blog (Claude Haiku → GitHub → Cloudflare) |
| blogDataGenerator.gs | Prepares crime stats for blog generation. `BLOG_CRIME_TYPE_CONFIG` mirrors `crimeTypeConfig.ts` — keep in sync when adding crime types. |
| socialMediaStats.gs | Daily/monthly/custom social media stats |
| **facebookSubmitterCore.gs** | Web app doGet + submitFacebookPost + sheet writer. Country selector: T&T vs Jamaica toggle, 3-way sheet routing (Jamaica prod / T&T 2025 FR1 / T&T 2026 prod). |
| **facebookSubmitterHtml.gs** | All HTML/CSS/JS for the facebookSubmitter web app UI |
| linkChecker.gs | Bi-weekly dead link detection + email reports |

### Infrastructure
| Script | Purpose |
|--------|---------|
| schema.gs | **Single source of truth** for crime types (15 types, severity, isContextType, promptDescription), safety tip enums, confidence tiers. Exports: `getCrimeSeverityMap()`, `getCrimeSchemaOrderMap()`, `getContextTypeLabels()`, `buildCrimeHierarchyString()`, `buildCrimeTypesList()`, `buildClassificationRulesBlock()`. Mirror: `src/config/crimeSchema.ts`. |
| config.gs | API keys, model config, sheet/source config |
| setupApiKey.gs | Initial API key setup |
| throttlingManager.gs | API rate limiting |
| apiUsageTracker.gs | API usage & cost tracking |
| diagnostics.gs | Diagnostic functions |
| deepDiagnostics.gs | Advanced diagnostics |

---

## Cross-Cutting Features

### Security
- **XSS Protection:** `escapeHtml()` on all user/crime data rendered via innerHTML
- **CSP Headers:** `public/_headers` — tight policy, `unsafe-inline`/`unsafe-eval` required by Leaflet
- **CAPTCHA:** Cloudflare Turnstile on report forms (opt-in via `includeTurnstile` prop)
- **Cookie Consent:** GDPR-compliant with `Secure;SameSite=Lax` flags
- **Rate Limiting:** Honeypot fields + RateLimiter class on report forms

### SEO
- **Structured Data:** JSON-LD (WebPage, BreadcrumbList, Dataset, BlogPosting, Article, CollectionPage)
- **Sitemap:** Auto-generated, submitted to Google Search Console
- **OG Images:** Dynamic murder count OG image (satori + sharp, regenerates daily)
- **Search:** D1 FTS5 via `/api/search` (crimes, MPs, areas). Dark mode. Suggestions on empty state. No build-time indexing.

### Analytics
- **Google Analytics 4:** With cookie consent gate
- **Cloudflare Web Analytics:** Cookieless, always-on
- **Modal Pageview Tracking:** `pushState` on modal open for both GA4 + Cloudflare

### Performance
- **Crime pages:** SSR + Cloudflare CDN cache (24h edge, 1h browser)
- **Other pages:** Pre-rendered static
- **Turnstile:** Opt-in (only loaded on pages with forms)
- **Pagefind:** Opt-out available (`includePagefind={false}`)
- **Leaflet:** Conditional loading (only on map pages)
- **Fonts:** Self-hosted Inter woff2 (no external Google Fonts)

### Deployment
- **CI/CD:** GitHub Actions → Cloudflare Pages
- **Daily Rebuild:** 6 AM UTC (2 AM Trinidad)
- **Build Time:** ~31 seconds

---

## Key Algorithms Index

> Use this to find where specific logic lives without grepping.

| Algorithm / Logic | Location | Notes |
|-------------------|----------|-------|
| Area crime scoring (1-10) | `src/lib/safetyHelpers.ts` → `calculateAreaCrimeScore()` | 90-day rolling window |
| Safety tip selection | `src/lib/safetyHelpers.ts` → `getSafetyContext()` | Returns tip + risk level (high/neutral/low) |
| Top Regions risk scoring | `src/components/TopRegionsCard.astro` + `dashboardUpdates.ts` | Weighted score per region → share of national total → label. Self-calibrating. See `docs/guides/RISK-SCORING-METHODOLOGY.md` |
| Risk weights per crime type | `src/config/riskWeights.ts` | Used by Top Regions card AND `safetyHelpers.ts` |
| Slug generation (legacy) | `src/lib/csvParser.ts` → `generateSlug()` | headline + date format |
| Slug generation (current) | `src/lib/csvParser.ts` → `generateSlugWithId()` | StoryID + 6 words |
| Area name → route slug | `src/lib/crimeData.ts` → `generateNameSlug()` | Used for area pages |
| Trending hot areas (7-day) | `src/lib/trendingHelpers.ts` → `getHotAreas()` | Top 5 by crime count |
| Recent views tracking | `src/lib/trendingHelpers.ts` → `trackRecentView()` / `getRecentViews()` | localStorage, 20-entry rolling buffer |
| Dashboard insights | `src/lib/dashboardHelpers.ts` → `calculateInsights()` | Highest/lowest crime areas |
| YoY % comparison | `src/lib/statisticsHelpers.ts` → `compareYearToDate()` | Same-period prior year |
| Top regions | `src/lib/statisticsHelpers.ts` → `getTopRegions()` | Used by dashboard + stats page. Counts primary + related crime types (not raw rows) |
| Crime type breakdown | `src/lib/statisticsHelpers.ts` → `getCrimeTypeBreakdown()` | Returns Map<type, count> |
| Victim count rules | `src/config/crimeTypeConfig.ts` | PRIMARY crime only gets victim count; related always +1. Mirror also exists in `blogDataGenerator.gs` → `BLOG_CRIME_TYPE_CONFIG`. |
| Crime type schema | `src/config/crimeSchema.ts` ↔ `schema.gs` | 15 types with severity + isContextType. `CONTEXT_TYPE_LABELS` export lists context types (Home Invasion, Domestic Violence). `reportValidation.ts` + `report.astro` dropdown are schema-driven. |
| Date normalization | `src/lib/safetyHelpers.ts` → `toDate()` | Exported, used by trendingHelpers too |
| OG image generation | `src/lib/generateOgImage.ts` | satori + sharp, 1200×630 |
| XSS escaping | `src/lib/escapeHtml.ts` → `escapeHtml()` | Use on ALL innerHTML/set:html |
| URL sanitization | `src/lib/escapeHtml.ts` → `sanitizeUrl()` | Use on external URLs in anchor hrefs |

---

## Key Data Flows

> What reads/writes what — critical for avoiding breakage when editing.

### `window.__crimesData` (client-side crime array)
Set on these pages (area-specific crimes only on area pages, all crimes elsewhere):
- `src/pages/trinidad/dashboard.astro`
- `src/pages/trinidad/headlines.astro`
- `src/pages/trinidad/archive/[year]/[month].astro`
- `src/pages/trinidad/area/[slug].astro` ← area-scoped only
- `src/pages/trinidad/murder-count.astro`

Read by: `CrimeDetailModal.astro` (safety scoring, trending, related crimes)

### Files that must stay in sync with `routes.ts`
- Inline scripts (`<script is:inline>`) can't import modules — hardcoded paths must mirror `routes.ts`
- `BottomNav.astro` — nav links
- `Header.astro` — section links
- Any `<a href=...>` in inline scripts

### CSV URL change propagation
Only update `src/config/csvUrls.ts` — everything else imports from it:
- `src/lib/crimeData.ts` (SSR/build)
- `src/scripts/dashboardDataLoader.ts` (client)
- `src/lib/areaAliases.ts`

### Crime page slug resolution (SSR)
`[slug].astro` → try new StoryID slug → try `oldSlug` fallback → 301 redirect → 404
Old→new map: `src/data/redirect-map.json` (generated by `redirectGenerator.ts` at build)

### Slug-not-found redirects: always use 302, not 301
`region/[slug].astro`, `area/[slug].astro`, `archive/[year]/[month].astro`: use `Astro.redirect('/404/', 302)`.
**Never use 301 here.** 301s are cached permanently by browsers — if `loadFullAreaData()` temporarily fails, the browser caches the redirect forever and the URL appears broken even after the server recovers. `crime/[slug].astro` 301s are intentional permanent slug migrations and stay as 301. See B027.
