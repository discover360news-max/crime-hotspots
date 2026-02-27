# Site Features Registry

**Purpose:** Holistic view of every active feature on crimehotspots.com. Check this to understand what the site does before making changes.

**Last Updated:** February 26, 2026

---

## Pages & Routes (25 pages)

### Marketing & Static
| Page | Route | Purpose |
|------|-------|---------|
| Homepage | `/` | Country cards (direct link to dashboard), HomepagePulse live stats, InfoPopup |
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
| Dashboard | `/trinidad/` | Pre-rendered | DashboardStory narrative, stats, Leaflet map, filters, trend indicators, data freshness, crime type tooltips |
| Headlines | `/trinidad/headlines/` | Pre-rendered | Latest crimes, date accordion, victim counts, empty state for filters |
| Crime Detail | `/trinidad/crime/[slug]` | **SSR + CDN cache** | Individual crime page, safety context, related crimes, trending hotspots |
| Areas Index | `/trinidad/areas/` | Pre-rendered | Browse all crime areas |
| Area Detail | `/trinidad/area/[slug]` | Pre-rendered | AreaNarrative summary, "New Since" badge, compare prompt, stats, share buttons |
| Statistics | `/trinidad/statistics/` | Pre-rendered | Three-tier crime rates (previous year / YTD / projected) |
| Regions | `/trinidad/regions/` | Pre-rendered | Browse by region |
| Region Detail | `/trinidad/region/[slug]` | Pre-rendered | Region-specific crimes |
| Compare | `/trinidad/compare/` | Pre-rendered | Side-by-side area comparison |
| Murder Count | `/trinidad/murder-count/` | Pre-rendered | Live counter with flip animation, YoY comparison, share buttons |
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

---

## Components (34 active)

### Core Layout (`src/layouts/`)
| File | Purpose | Key Props |
|------|---------|-----------|
| Layout.astro | Root layout wrapper — `<head>`, fonts, CSP, GA4, Pagefind, Turnstile, footer | `ogType` (default `"website"`, pass `"article"` on crime/blog pages), `includePagefind` (default `true`), `includeTurnstile` (default `false`). **`<slot name="head" />`** at line 137 — DO NOT REMOVE (crime pages inject JSON-LD here). |

### Navigation & Layout
| Component | Purpose |
|-----------|---------|
| Header.astro | Top nav, direct links on Trinidad pages, active section indicator |
| BottomNav.astro | Mobile bottom tab bar (Dashboard, Headlines, Areas, Report, More). Config-driven from `countries.ts` |
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
| StatCards.astro | Grid of stat cards with YoY comparisons |
| TopRegionsCard.astro | Top regions visualization + shimmer loading |
| QuickInsightsCard.astro | Highest/lowest crime area insights |
| FiltersTray.astro | Year/date filter controls |
| DataTable.astro | Responsive table wrapper |

### Modals
| Component | Purpose |
|-----------|---------|
| IslandSelectorModal.astro | Unified island picker (dashboard/headlines/archives/areas). Exposes `window.openIslandModal(section)`. Backward-compat aliases: `openDashboardModal()`, `openHeadlinesModal()`, etc. Replaced 4 separate modal files. |
| SearchModal.astro | Site-wide Pagefind search (Ctrl+K) |
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
| dashboardDataLoader.ts | Loads crime CSV data on client |
| dashboardUpdates.ts | Updates dashboard on filter change |
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
| csvBuildPlugin.ts | Vite plugin — fetches CSV at build:start with retry (2s/4s/8s), validates rows, writes `csv-cache.json` + `health-data.json`. **NEVER use `await import()` inside hook — causes Vite runner error.** |
| redirectGenerator.ts | Build-time redirect map generator — writes `src/data/redirect-map.json` (~1,984 old→new slug mappings). Static top-level imports only. |

---

## Server & Shared Utilities (`src/lib/`)

| Utility | Purpose | Key Exports |
|---------|---------|-------------|
| crimeData.ts | Fetches/parses crime CSV (server-side). Runtime fallback via bundled `csv-cache.json`. | `getTrinidadCrimes()`, `getCrimesByArea()`, `getCrimesByMonth()`, `getCrimesByRegion()`, `getAvailableYears()`, `generateNameSlug()` |
| csvParser.ts | Raw CSV parsing utilities. Slug generation lives here. | `parseCSVLine()`, `parseDate()`, `generateSlug()` (legacy, headline+date), `generateSlugWithId()` (current, StoryID+6 words), `createColumnMap()`, `stripQuotes()` |
| safetyHelpers.ts | Area crime scoring + safety tip engine | `calculateAreaCrimeScore()` (1-10 scale, 90-day window), `getSafetyContext()` (returns tip + risk level), `getPrimaryCrimeType()`, `toDate()` (shared date normalizer) |
| safetyTipsHelpers.ts | Curated safety tips utilities | `normalizedCrimeType()` (CSV type → tip category), `sortTipsByAreaRelevance()` (area-specific first), `slugifyCategory()` (category → URL slug) |
| dashboardHelpers.ts | Dashboard stat calculations | `countCrimeType()`, `calculateInsights()` (highest/lowest crime areas) |
| statisticsHelpers.ts | Statistics page calculations | `calculatePercentChange()`, `compareYearToDate()`, `getCrimeTypeBreakdown()`, `getTopRegions()`, `filterToSamePeriod()`, `formatPercentChange()` |
| trendingHelpers.ts | Trending areas + recent views (localStorage) | `getHotAreas()` (top 5 areas, last 7 days), `trackRecentView()`, `getRecentViews()` |
| escapeHtml.ts | XSS protection utilities | `escapeHtml()` (innerHTML), `sanitizeUrl()` (anchor hrefs), `validateUrl()` (DOM hrefs) |
| crimeColors.ts | Crime type → color hex mapping | Default export: color map object |
| areaAliases.ts | Area name aliases (handles quoted CSV fields) | Used by tooltip + area pages |
| generateOgImage.ts | Dynamic OG image generation (satori + sharp) | Used by murder-count page (1200×630 PNG) |
| generateCrimeTypeThumbnails.ts | Build-time crime type thumbnail images | Used during build |

---

## Configuration (`src/config/` + `src/data/`)

| File | Purpose | Notes |
|------|---------|-------|
| csvUrls.ts | CSV data source URLs | **Single source of truth** for all CSV URLs |
| routes.ts | All internal routes + builders | `routes.*` for static, `buildRoute.*` for dynamic |
| crimeTypeConfig.ts | Crime type definitions + victim count rules | Victim count applies to PRIMARY crime only |
| siteNotifications.ts | Site notification banner content | Toggle-based enable/disable |
| riskWeights.ts | Risk weighting for safety scoring | Used by `safetyHelpers.ts` |
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
| claudeClient.gs | Claude Haiku 4.5 for crime extraction (primary) |
| geminiClient.gs | Gemini API client (legacy backup) |
| groqClient.gs | Groq API client (legacy backup) |
| crimeTypeProcessor.gs | Validates and processes crime types |

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
| blogDataGenerator.gs | Prepares crime stats for blog generation |
| socialMediaStats.gs | Daily/monthly/custom social media stats |
| facebookSubmitter.gs | Web app for manual Facebook post entry (Guardian source) |
| linkChecker.gs | Bi-weekly dead link detection + email reports |

### Infrastructure
| Script | Purpose |
|--------|---------|
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
- **Search:** Pagefind static search (auto-indexed at build time)

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
| Risk weights per crime type | `src/config/riskWeights.ts` | Imported by `safetyHelpers.ts` |
| Slug generation (legacy) | `src/lib/csvParser.ts` → `generateSlug()` | headline + date format |
| Slug generation (current) | `src/lib/csvParser.ts` → `generateSlugWithId()` | StoryID + 6 words |
| Area name → route slug | `src/lib/crimeData.ts` → `generateNameSlug()` | Used for area pages |
| Trending hot areas (7-day) | `src/lib/trendingHelpers.ts` → `getHotAreas()` | Top 5 by crime count |
| Recent views tracking | `src/lib/trendingHelpers.ts` → `trackRecentView()` / `getRecentViews()` | localStorage, 20-entry rolling buffer |
| Dashboard insights | `src/lib/dashboardHelpers.ts` → `calculateInsights()` | Highest/lowest crime areas |
| YoY % comparison | `src/lib/statisticsHelpers.ts` → `compareYearToDate()` | Same-period prior year |
| Top regions | `src/lib/statisticsHelpers.ts` → `getTopRegions()` | Used by dashboard + stats page |
| Crime type breakdown | `src/lib/statisticsHelpers.ts` → `getCrimeTypeBreakdown()` | Returns Map<type, count> |
| Victim count rules | `src/config/crimeTypeConfig.ts` | PRIMARY crime only gets victim count; related always +1 |
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
