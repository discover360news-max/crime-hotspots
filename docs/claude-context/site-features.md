# Site Features Registry

**Purpose:** Holistic view of every active feature on crimehotspots.com. Check this to understand what the site does before making changes.

**Last Updated:** March 13, 2026 (crime schema overhaul — 3 new types + isContextType)

---

## Pages & Routes (28 pages)

### Marketing & Static
| Page | Route | Purpose |
|------|-------|---------|
| Homepage | `/` | Country cards (direct link to dashboard), HomepagePulse live stats, Explore 3-tile section (Areas / Murder Count / Blog), QuickAnswers FAQ section |
| About | `/about/` | Project background |
| Contact | `/contact/` | Contact information |
| Methodology | `/methodology/` | Data collection process |
| FAQ | `/faq/` | Frequently asked questions |
| Privacy | `/privacy/` | Privacy policy, cookie consent |
| Business Solutions | `/business-solutions/` | B2B offerings — links to capability sheet |
| Data Capability Sheet | `/data-capability-sheet/` | Institutional document (insurers, researchers, grant committees). Content driven by `src/config/capabilitySheetConfig.ts`. Month count is dynamic from `health-data.json`. Placeholders: set `contact.email`, `contact.entity`, `contact.dataEthicsPath` to non-null when ready. |
| Report | `/report/` | Anonymous crime reporting form (Turnstile CAPTCHA) |
| 404 | `/404` | Custom error page |

### Trinidad Crime Data
| Page | Route | Rendering | Purpose |
|------|-------|-----------|---------|
| Dashboard | `/trinidad/` | Pre-rendered | DashboardStory (two-column: live weekly narrative + latest blog post), sticky year filter bar, stat cards, Leaflet map, Filters drawer (crime type/region/area), Quick Insights card, Top Regions, trend indicators |
| Headlines | `/trinidad/headlines/` | Pre-rendered | Latest crimes, date accordion, victim counts, empty state for filters |
| Crime Detail | `/trinidad/crime/[slug]` | **SSR + CDN cache** | Individual crime page, safety context, related crimes, trending hotspots |
| Areas Index | `/trinidad/areas/` | Pre-rendered | Browse all crime areas |
| Area Detail | `/trinidad/area/[slug]` | Pre-rendered | AreaNarrative summary (text-body weight), "New Since" badge, compare prompt, stat cards (Risk Level card: larger number + level color — amber=high, emerald=low), share buttons, crime type breakdown table, related areas (sorted by crime count) |
| Statistics | `/trinidad/statistics/` | Pre-rendered | Three-tier crime rates (previous year / YTD / projected) |
| Regions | `/trinidad/regions/` | Pre-rendered | Browse by region |
| Region Detail | `/trinidad/region/[slug]` | Pre-rendered | Region-specific crimes. Includes "Members of Parliament" card (filters mps.json by regionSlugs, shows photo/name/party/constituency, links to MP profile). |
| MP Index | `/trinidad/mp/` | Pre-rendered | Directory of all 41 MPs grouped by region. Each card: photo, honorific name, party badge, constituency. |
| MP Profile | `/trinidad/mp/[nameSlug]` | Pre-rendered | Individual MP profile. 2-col card: photo left, identity+contact right. Crime stat cards per region (reuses region page pattern). JSON-LD Person schema. Ambiguous MPs show boundary note + two region sections. Data: `src/data/mps.json`. |
| Compare | `/trinidad/compare/` | Pre-rendered | Side-by-side area comparison. Pre-loads Port of Spain vs San Juan by default. Rose gradient hero + sticky selector bar (matches dashboard pattern). |
| Murder Count | `/trinidad/murder-count/` | Pre-rendered | `max-w-5xl` sidebar layout. Left: flip counter, YoY comparison, rate cards, blog post. Right sidebar: share buttons (`.sb-share-btn` pattern), latest 10 murder incidents, newsletter. Header (h1/year) above grid. |
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
| Blog Index | `/blog/` | All blog posts, weekly reports, RSS link |
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

## Components (34 active)

### Core Layout (`src/layouts/`)
| File | Purpose | Key Props |
|------|---------|-----------|
| Layout.astro | Root layout wrapper — `<head>`, fonts, CSP, GA4, Pagefind, Turnstile, footer | `ogType` (default `"website"`, pass `"article"` on crime/blog pages), `includePagefind` (default `true`), `includeTurnstile` (default `false`). **`<slot name="head" />`** at line 137 — DO NOT REMOVE (crime pages inject JSON-LD here). |

### Navigation & Layout
| Component | Purpose |
|-----------|---------|
| Header.astro | Top nav, direct links on Trinidad pages, active section indicator. Mobile: `logo-icon.png` (36px square). Ghost Subscribe buttons. ♥ Support → Ko-fi (desktop + hamburger). Mobile menu + subscribe tray are native `<dialog>` elements. |
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
| HomepagePulse.astro | Live Trinidad stats below country card (incidents, top area, murders, latest headline) |
| DashboardStory.astro | Narrative summary at top of dashboard (week-over-week incidents, top area, murder trend) |
| AreaNarrative.astro | "This Week in [Area]" prose + contextual CTAs (compare, archive) + "New Since" badge slot |
| QuickAnswers.astro | FAQPage schema + H3 questions targeting Google "People Also Ask" boxes. 40-50 word answers with internal deep-dive links. Used on homepage. |

### Dashboard & Stats
| Component | Purpose |
|-----------|---------|
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
| NewsletterSignup.astro | Buttondown email signup — 3 variants: `card` (area pages), `inline` (statistics), `footer` (Layout footer, subscribe tray, crime modal). POSTs directly to Buttondown embed endpoint (browser-side). |

---

## Client-Side Scripts (`src/scripts/`)

| Script | Purpose |
|--------|---------|
| dashboardDataLoader.ts | Primary path: fetches `/api/dashboard/` + `/api/crimes/` in parallel; sets `window.__crimesData`; dispatches `crimesDataReady` event; applies pre-computed stats via `applyPrecomputed*`. CSV fallback via `initializeDashboardDataFromCSV()` if API fails. |
| dashboardUpdates.ts | Updates dashboard on filter change. Also exports `applyPrecomputedStats`, `applyPrecomputedInsights`, `applyPrecomputedTopRegions` (used by API path) + `updateCardWithTrend` (shared helper). |
| statCardFiltering.ts | Stat card click-to-filter |
| statsScroll.ts | Smooth scroll to stats section |
| leafletMap.ts | Interactive Leaflet map with crime markers |
| yearFilter.ts | Year selection filter control |
| flipCounter.ts | Flip counter animation logic |
| modalHtmlGenerators.ts | Generates HTML for modal (trending, related, safety) |
| modalFeedbackHandler.ts | Helpful/not helpful feedback |
| modalShareHandlers.ts | Social sharing (WhatsApp, Facebook, X, copy link) |
| modalReportHandler.ts | Issue reporting form submission |
| modalLifecycle.ts | Modal open/close, pushState URL updates, popstate |

---

## Build Integrations (`src/integrations/`)

| File | Purpose |
|------|---------|
| csvBuildPlugin.ts | Vite plugin — fetches CSV at build:start with retry (2s/4s/8s), validates rows, writes `csv-cache.json` + `health-data.json` + `area-aliases.json` (116 area→known_as mappings from RegionData CSV). **NEVER use `await import()` inside hook — causes Vite runner error (B012). Pagefind indexer removed (Mar 2026) — no longer writes pagefind index.** |
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
| generateCrimeTypeThumbnails.ts | Build-time crime type thumbnail images | Used during build |

---

## Configuration (`src/config/` + `src/data/`)

| File | Purpose | Notes |
|------|---------|-------|
| csvUrls.ts | CSV data source URLs | **Single source of truth** for all CSV URLs |
| routes.ts | All internal routes + builders | `routes.*` for static, `buildRoute.*` for dynamic. Includes `routes.trinidad.mps` + `buildRoute.mp(nameSlug)`. |
| mps.json | 41 MP records | Schema: nameSlug, fullName, honorific, constituency, constituencySlug, party, partyFull, electionYear, regionSlugs, regionConfidence, contact, socials, photo. Photos in `public/images/mps/` (placeholder.svg always present). |
| crimeTypeConfig.ts | Crime type definitions + victim count rules | Victim count applies to PRIMARY crime only. 15 types: Murder/Attempted Murder/Kidnapping/Sexual Assault/Shooting/Assault/Home Invasion/Carjacking/Arson/Robbery/Domestic Violence/Extortion/Burglary/Theft/Seizures. |
| siteNotifications.ts | Site notification banner content | Toggle-based enable/disable |
| riskWeights.ts | Crime severity weights | Used by `TopRegionsCard.astro`, `dashboardUpdates.ts` (Top Regions card), and `safetyHelpers.ts` (SafetyContext). Full methodology: `docs/guides/RISK-SCORING-METHODOLOGY.md` |
| countries.ts | Country config (sections, icons, nav settings) | Imports from `routes.ts` and `csvUrls.ts` |

---

## Google Apps Script Automation (`google-apps-script/trinidad/`)

### Data Collection Pipeline
| Script | Purpose |
|--------|---------|
| rssCollector.gs | Fetches news articles from RSS feeds |
| articleFetcherImproved.gs | Retrieves & parses article content |
| preFilter.gs | Pre-filters articles before AI processing |
| orchestrator.gs | Main automation flow controller |
| processor.gs | Processes articles, routes to Production/Archive sheets |
| claudeClient.gs | Claude Haiku 4.5 for crime extraction. System prompt includes: Assault+Robbery combination rule (add Assault when victim physically struck), context type ordering rule (Home Invasion/Domestic Violence always after harm types), Carjacking/Domestic Violence/Extortion classification rules. |
| geminiClient.gs | Gemini API client (legacy backup) |
| groqClient.gs | Groq API client (legacy backup) |
| crimeTypeProcessor.gs | Determines primary + related crime types. After severity sort, partitions harm types first, context types (Home Invasion, Domestic Violence) last — context types can never be primary when a harm type is present. Calls `getContextTypeLabels()` from schema.gs. |

### Data Management
| Script | Purpose |
|--------|---------|
| validationHelpers.gs | Data validation utilities |
| geocoder.gs | Location name → coordinates |
| plusCodeConverter.gs | Plus Codes → coordinates |
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
| facebookSubmitter.gs | Web app for manual Facebook post entry (Guardian source) |
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
- **Structured Data:** JSON-LD (WebPage, BreadcrumbList, Dataset, BlogPosting)
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
