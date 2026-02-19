# Site Features Registry

**Purpose:** Holistic view of every active feature on crimehotspots.com. Check this to understand what the site does before making changes.

**Last Updated:** February 19, 2026

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
| Business Solutions | `/business-solutions/` | B2B offerings |
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

### Blog & Tools
| Page | Route | Purpose |
|------|-------|---------|
| Blog Index | `/blog/` | All blog posts, weekly reports, RSS link |
| Blog Post | `/blog/[slug]` | Individual post, "More Weekly Reports" section |
| RSS Feed | `/rss.xml` | Blog posts + latest 20 crime headlines (pre-rendered) |
| Social Image Generator | `/tools/social-image-generator/` | Create shareable crime stat images |

---

## Components (35 active)

### Navigation & Layout
| Component | Purpose | Key Files |
|-----------|---------|-----------|
| Header.astro | Top nav, direct links on Trinidad pages, active section indicator | `src/components/` |
| BottomNav.astro | Mobile bottom tab bar (Dashboard, Headlines, Areas, Report, More) | Config-driven from `countries.ts` |
| Breadcrumbs.astro | Breadcrumb navigation for SEO | |
| SectionPickerModal.astro | Homepage island click → section chooser | Sections from `countries.ts` |
| Hero.astro | Full-width gradient hero with CTAs, compact variant, slot support | |

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
| DashboardModal.astro | Dashboard section modal |
| HeadlinesModal.astro | Headlines section modal |
| ArchivesModal.astro | Archive section modal |
| AreasModal.astro | Areas section modal |
| SearchModal.astro | Site-wide Pagefind search (Ctrl+K) |
| ReportIssueModal.astro | Report crime data issues |

### Utility & Engagement
| Component | Purpose |
|-----------|---------|
| AreaNameTooltip.astro | Area alias tooltip (dotted underline) |
| InfoPopup.astro | Click-based help tooltips |
| LoadingShimmer.astro | Facebook-style skeleton loading |
| BlogRotatingBanner.astro | Auto-rotating blog promotion (5s, country-filtered) |
| SiteNotificationBanner.astro | Dismissible site-wide notification |
| FeedbackToggle.astro | Helpful/not helpful toggle on crime pages |
| MailchimpSignup.astro | Email newsletter signup |

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

## Server & Shared Utilities (`src/lib/`)

| Utility | Purpose |
|---------|---------|
| crimeData.ts | Fetches/parses crime CSV (server-side at build time) |
| csvParser.ts | CSV parsing utilities |
| crimeColors.ts | Crime type → color hex mapping |
| areaAliases.ts | Area name aliases (handles quoted CSV fields) |
| dashboardHelpers.ts | Dashboard calculation helpers |
| statisticsHelpers.ts | Statistics page calculations |
| safetyHelpers.ts | Area crime scoring (1-10), safety tips, `toDate()` helper |
| trendingHelpers.ts | `getHotAreas()` (7-day), `trackRecentView()`, `getRecentViews()` |
| escapeHtml.ts | `escapeHtml()` for XSS protection, `validateUrl()` for DOM hrefs |
| generateOgImage.ts | Dynamic OG image generation (satori + sharp) |

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
