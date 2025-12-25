# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crime Hotspots is a web-based data visualization platform for Caribbean crime statistics. The application displays crime data dashboards, headlines, and provides anonymous crime reporting functionality.

**Current Status:** ✅ Production - Trinidad & Tobago LIVE (Astro-powered)
**Live Site:** https://crimehotspots.com
**Framework:** Astro 5.16.5 (migrated from Vite, December 16, 2025)
**Focus:** Trinidad-only implementation (Other islands expansion deferred)
**Last Updated:** December 23, 2025

---
## Kavell Forde - Owner - Guidance
My thought are just my thought process and is always open to critisism and can be urged to be modified for the success of the project. 

## MAIN GOAL - Guidance
To find a way to get goals accomplished efficiently and by using the least tokens possible by:
- Employing Kavell to do some tasks manually (with guidance)
- Have Kavell use Gemini for content where necessary (Provide prompt)
- Always ask probing questions to clear up ambiguities in requests.
- Focus and implement once, so no bugs show up unecessarily


## Tech Stack

**Frontend:**
- **Astro 5.16.5** - Static site generator with file-based routing
- **Tailwind CSS 4.1.18** - Via Vite plugin (@tailwindcss/vite)
- **TypeScript** - Type safety for components and content
- **Astro Content Collections** - Type-safe blog system
- **Native Fetch API** - Server-side CSV parsing (no PapaParse)
- Cloudflare Turnstile for CAPTCHA
- Leaflet.js for interactive maps
- Leaflet.markercluster for map clustering
- OpenStreetMap tiles for base maps

**Backend/Automation:**
- Google Apps Script (serverless)
- Google Gemini AI (crime data extraction)
- Google Sheets (data storage + CSV export)
- GitHub Actions (CI/CD)

**Hosting:**
- Cloudflare Pages (auto-deploy from GitHub)
- Custom domain: crimehotspots.com

**Legacy (Deprecated):**
- ~~Vite~~ - Replaced by Astro (December 2025)
- ~~PapaParse~~ - Replaced by native Fetch API
- ~~DOMPurify~~ - Astro handles XSS protection

---

## Development Commands

**Working Directory:** `astro-poc/`

```bash
cd astro-poc
npm run dev      # Start dev server (port 4321, not 5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

**Deployment:**
- **Manual:** Push to `main` → GitHub Actions builds from `astro-poc/` → Cloudflare Pages deploys automatically
- **Automatic:** Daily rebuild at 6 AM UTC (2 AM Trinidad time) via GitHub Actions schedule
- **Manual Trigger:** GitHub Actions UI → "Build and Validate" workflow → "Run workflow" button

**Build Output:** `astro-poc/dist/` (1,300+ static HTML pages)

---

## Architecture

### Astro File-Based Routing

**All pages are in `astro-poc/src/pages/` with automatic routing:**

- `index.astro` → `/` (homepage)
- `trinidad/dashboard.astro` → `/trinidad/dashboard`
- `trinidad/headlines.astro` → `/trinidad/headlines`
- `trinidad/crime/[slug].astro` → `/trinidad/crime/murder-port-of-spain-2025-12-15` (1,300+ pages)
- `trinidad/archive/[year]/[month].astro` → `/trinidad/archive/2025/12`
- `blog/[slug].astro` → `/blog/trinidad-weekly-2025-11-10`

**No `countries.js` file** - Configuration moved directly into pages.

### Key Files

```
astro-poc/
├── src/
│   ├── components/           # Reusable Astro components
│   │   ├── Header.astro      # Navigation with mobile menu + subscribe tray
│   │   ├── Breadcrumbs.astro # SEO breadcrumb navigation
│   │   ├── InfoPopup.astro   # Click-based help tooltips (modal)
│   │   ├── LoadingShimmer.astro # Facebook-style shimmer loading
│   │   ├── ReportIssueModal.astro # Crime issue reporting modal
│   │   ├── FiltersTray.astro # Dashboard slide-out filters
│   │   ├── StatCard.astro    # Dashboard stat cards
│   │   ├── QuickInsightsCard.astro # Dashboard insights
│   │   └── TopRegionsCard.astro # Top areas ranking
│   ├── content/              # Astro Content Collections
│   │   ├── config.ts         # Blog schema (TypeScript validation)
│   │   └── blog/             # Markdown blog posts
│   ├── layouts/              # Base templates
│   │   └── Layout.astro      # Main layout (SEO, header, footer)
│   ├── lib/                  # Utilities & data fetching
│   │   ├── crimeData.ts      # Trinidad CSV fetcher + processors
│   │   └── crimeColors.ts    # Crime type color mappings
│   ├── pages/                # File-based routing (auto-generates URLs)
│   │   ├── index.astro       # Homepage
│   │   ├── trinidad/
│   │   │   ├── dashboard.astro      # Dashboard (Leaflet map)
│   │   │   ├── headlines.astro      # Headlines page
│   │   │   ├── crime/[slug].astro   # 1,300+ crime pages
│   │   │   └── archive/             # Monthly archives
│   │   ├── blog/
│   │   │   ├── index.astro          # Blog listing
│   │   │   └── [slug].astro         # Individual posts
│   │   ├── about.astro
│   │   ├── faq.astro
│   │   ├── methodology.astro
│   │   └── 404.astro
│   └── styles/               # Global CSS
│       └── global.css        # Tailwind imports
├── public/                   # Static assets
│   ├── assets/
│   │   ├── images/           # Country cards, backgrounds
│   │   └── Trinidad-Map.svg  # Regional SVG map
│   └── favicon files
├── astro.config.mjs          # Astro configuration
├── tailwind.config.mjs       # Tailwind CSS config
└── package.json

google-apps-script/          # (Unchanged - same automation)
├── trinidad/                # Trinidad automation
├── guyana/                  # Guyana automation (deferred)
└── weekly-reports/          # Blog post generation
```

---

## Automated Data Collection

**Location:** `google-apps-script/trinidad/` and `google-apps-script/guyana/`

**How it works:**

### Trinidad & Tobago
1. **RSS feeds** collected every 2 hours (Trinidad Express, Guardian, Newsday)
2. **Facebook sources** (manual collection): Ian Alleyne Network, DJ Sherrif
   - These Facebook pages post verified info that doesn't make mainstream media
   - Currently collected manually (automation pending)
3. Full article text fetched every 8 hours
4. Gemini AI extracts crime data every hour
5. Data published to duplicated Production sheet (public CSV)
6. **Update frequency:** Live Data refreshed every 24 hours

**Critical Configuration (NEVER change):**
- `maxOutputTokens: 4096` - Must stay at 4096 to prevent truncation
- Multi-crime detection - crimes must be an array
- API keys stored in Script Properties, never hardcoded

**Documentation:**
- `google-apps-script/trinidad/README.md`
- `docs/FACEBOOK-DATA-COLLECTION.md` (Facebook sources)

---

## Weekly Blog Reports

**Needs to be updated and fixed (future To-Do)

**Documentation:** `docs/automation/WEEKLY-REPORT-SAFEGUARDS.md`

---

## Recent Features (Nov-Dec 2025)

### Dashboard UX & Loading States (Dec 23, 2025)
**Status:** 🚧 In Progress (not yet deployed)
**Location:** Dashboard, Crime Detail Pages

**New Components Created:**
- **InfoPopup.astro** - Click-based help tooltips with modal overlay
  - Top-center positioning, mobile-responsive
  - Fade in/out animations
  - Used on dashboard map info icon
- **LoadingShimmer.astro** - Facebook-style shimmer loading animation
  - Configurable height, width, border radius
  - 1.5s gradient wave animation
- **ReportIssueModal.astro** - Crime data issue reporting system
  - Pre-fills crime metadata (slug, headline, date, area, etc.)
  - Issue type checkboxes (Incorrect headline, Wrong date, Duplicate)
  - Information source dropdown (Eye-witness, News article, etc.)
  - Form validation and submission to existing Google Apps Script endpoint

**Dashboard Improvements:**
- **Loading States:** Added shimmer effects to stats cards, map, and insight cards
  - 500ms minimum display time prevents flash on fast loads
  - Shimmers appear on initial load AND year filter changes
  - Smooth opacity transitions (300ms)
- **Area vs Region:** Changed all dashboard stats from "regions" to "areas"
  - More culturally accurate for Trinidad (Port of Spain vs Cova-Tabaquite-Talparo)
  - Updated TopRegionsCard → shows actual areas now
  - Updated QuickInsightsCard "Top 3" stat
- **Map Touch Controls:** Fixed one-finger scroll issue
  - Vertical swipe = page scroll (works normally)
  - Horizontal swipe on map = hint appears ("Use two fingers")
  - Fixed z-index: hint stays below header (z-10 instead of z-1000)
- **Button Layout:** Headlines + Filters buttons stack vertically (better spacing)

**Crime Detail Page Improvements:**
- **Report Issue Feature:** Button appears after Related Crimes section
  - Opens modal with pre-filled crime data
  - Users select issue types, provide source, describe problem
  - Optional contact email field
- **Location Display:** Header now shows "Street, Area" instead of "Area, Region"
  - Removed redundant fields from details section (Street, Area)
  - Kept only Region and Source
- **Clickable Source:** Source name now links to original article
  - Dotted underline styling (border-dotted)
  - Removed redundant "Read original article" button
- **Fixed Related Crimes Links:**
  - "All crimes in December 2025" → Monthly archive
  - "View [Region] on interactive map" → Dashboard
  - "Browse recent [CrimeType] incidents" → Headlines

**Technical Notes:**
- Extracted `leafletMap.ts` for reusable map functionality
- Added `onMapReady` callback to hide shimmer when map initializes
- Year filter no longer triggers callbacks on init (prevents shimmer flash)
- All components follow DESIGN-TOKENS.md (Rose + Slate palette, rounded-lg, px-4 py-1.5 buttons)

**Files Modified:**
- `astro-poc/src/components/InfoPopup.astro` (new)
- `astro-poc/src/components/LoadingShimmer.astro` (new)
- `astro-poc/src/components/ReportIssueModal.astro` (new)
- `astro-poc/src/components/TopRegionsCard.astro` (region → area)
- `astro-poc/src/components/QuickInsightsCard.astro` (region → area)
- `astro-poc/src/pages/trinidad/dashboard.astro` (shimmers, button layout)
- `astro-poc/src/pages/trinidad/crime/[slug].astro` (Report Issue, location display, source link)
- `astro-poc/src/scripts/leafletMap.ts` (onMapReady callback, touch controls)
- `astro-poc/src/scripts/yearFilter.ts` (removed initial callbacks)

### Year Filter System (Dec 18, 2025)
**Status:** ✅ LIVE in Production
**Location:** `dashboard.astro`, `headlines.astro`, `crimeData.ts`

**Problem Solved:** Dashboard and headlines were loading all years of data simultaneously, causing performance issues and confusing year detection.

**Features Implemented:**
- **Default to Current Year:** Dashboard and headlines show only current year data on load
- **Year Filter Dropdown:** Users can select specific years or "All Years" via filter tray
- **Automatic Year Detection:** System detects current year from highest year in dataset
- **Smart Data Loading:** Avoids duplicate fetching when URLs point to same sheet
- **Filter Tray for Headlines:** Moved all headline filters into slide-out tray (matching dashboard UX)

**Technical Implementation:**
- Synchronized CSV URLs across `crimeData.ts` (server-side) and `dashboard.astro` (client-side)
- Added duplicate prevention logic: don't fetch explicit 2025 if `current` points to 2025
- Updated all dashboard widgets (Stats, Quick Insights, Top Regions, Leaflet Map) to update on year change
- Headlines filters moved to frosted glass slide-in tray (`bg-white/60`, `rounded-l-2xl`)

**Files Modified:**
- `astro-poc/src/lib/crimeData.ts` (lines 27-34, 110-129)
- `astro-poc/src/pages/trinidad/dashboard.astro` (lines 400-405, 513-548)
- `astro-poc/src/pages/trinidad/headlines.astro` (filter tray implementation)

**Key Lesson Learned:**
CSV URLs **must** be synchronized between `crimeData.ts` and `dashboard.astro` to prevent:
- Duplicate data loading (wastes bandwidth)
- Wrong year showing on page load
- "Flash" effect (shows 2025 then jumps to 2026)

See **Critical Rules > CSV URL Synchronization** for detailed guidelines.

---

### Enhanced Duplicate Detection (Dec 3, 2025)
**Location:** `google-apps-script/guyana/processor.gs`, `google-apps-script/trinidad/processor.gs`

**Problem:** Duplicates slipping through when older crimes have been archived from Production to Production Archive

**Documentation:** `docs/automation/DUPLICATE-DETECTION-ARCHIVE.md`

### Seizures Crime Type (Dec 3, 2025)
**Location:** `google-apps-script/guyana/geminiClient.gs`, `google-apps-script/trinidad/geminiClient.gs`

**Problem:** Gun/ammunition seizure stories were incorrectly classified as "Theft"

**Documentation:** `docs/automation/SEIZURES-CRIME-TYPE.md`

### Dashboard UI Enhancements (Dec 2, 2025)


### Working with CSV Data (Server-Side)

**Location:** `astro-poc/src/lib/crimeData.ts`

- Sheets must be published with `single=true&output=csv`
- Use native `fetch()` API (no PapaParse)
- Data fetched at BUILD TIME (server-side only)
- Sort/filter happens during build
- All processed data is baked into static HTML

**Example:**
```typescript
import { getTrinidadCrimes } from '../lib/crimeData';

const crimes = await getTrinidadCrimes(); // Server-side only
```

### Creating Dynamic Pages (SSG)

**Example:** Auto-generate page for each crime

```astro
---
// src/pages/trinidad/crime/[slug].astro
import { getTrinidadCrimes } from '../../../lib/crimeData';

export async function getStaticPaths() {
  const crimes = await getTrinidadCrimes();
  return crimes.map((crime) => ({
    params: { slug: crime.slug },
    props: { crime },
  }));
}

const { crime } = Astro.props;
---

<Layout title={crime.headline}>
  <h1>{crime.headline}</h1>
  <p>{crime.summary}</p>
</Layout>
```

This generates 1,300+ static HTML pages at build time.

### Styling

**IMPORTANT:** Before making ANY UI changes, consult `docs/guides/DESIGN-TOKENS.md` for the official design system.

- Tailwind utilities for layout
- Rose palette (`rose-600`, `rose-700`) for primary actions
- Custom animations in `src/css/styles.css`
- See `docs/guides/DESIGN-TOKENS.md` for **component patterns, button variants, colors, typography** (v1.0, Dec 2025)
- See `docs/guides/DESIGN-Guidelines.md` for complete framework (v2.0)

---

## Critical Rules

### When Working on Automation

**NEVER:**
- Change `maxOutputTokens` from 4096
- Remove multi-crime detection
- Hardcode API keys

**ALWAYS:**
- Read automation README first
- Test with `testRSSCollection()` functions
- Verify Script Properties are set

### When Working on Astro Frontend

**DO:**
- **COMPONENT-FIRST PRINCIPLE:** Before adding any feature, ask: "Should this be a reusable component?" Create components for reusable UI patterns (filters, cards, modals, forms) before writing inline code. Store in `src/components/` or `src/scripts/` for TypeScript utilities. ⭐⭐⭐
- **Check `docs/guides/DESIGN-TOKENS.md` BEFORE making any UI/styling changes** ⭐
- Work in `astro-poc/` directory (NOT root)
- Use Read, Edit, Write tools (not bash)
- Prefer editing existing files
- Test with `cd astro-poc && npm run dev` (port 4321)
- Build successfully before committing: `cd astro-poc && npm run build`
- Follow established button patterns (`px-4 py-1.5`, `min-h-[22px]`)
- Use `rounded-lg` (not `rounded-md`)
- Always add explicit text colors (`text-slate-700`, `text-slate-400`)
- Use Astro components (`.astro` files) for reusable UI
- Put pages in `src/pages/` for auto-routing
- Keep page files under 500 lines - extract to components/scripts if larger

**DON'T:**
- Use emojis unless requested
- Create markdown files unless required
- Modify `astro.config.mjs` without understanding
- Create new button variants (use existing patterns from DESIGN-TOKENS.md)
- Use colors outside the Rose + Slate palette
- Work in root directory (Vite version is deprecated)

### CSV URL Synchronization (CRITICAL)

**⚠️ IMPORTANT:** CSV URLs must be synchronized across multiple files to prevent duplicate data loading and year detection issues.

**Files That Must Match:**
1. `astro-poc/src/lib/crimeData.ts` (lines 27-34)
2. `astro-poc/src/pages/trinidad/dashboard.astro` (lines 400-405)

**Rules:**
- **ALWAYS update BOTH files** when changing CSV URLs
- Both files must point `current` to the same year sheet
- Both files must use the same duplicate prevention logic
- When `current` points to 2025 sheet, don't also load explicit 2025 sheet

**Current Configuration (December 2025):**
```typescript
const TRINIDAD_CSV_URLS = {
  2025: 'https://...gid=1749261532...',  // 2025 sheet
  current: 'https://...gid=1749261532...' // Currently pointing to 2025
  // Test 2026: 'https://...gid=1963637925...' (commented out)
};
```

**When Archiving to 2026 (Future):**
1. Update `current` URL in BOTH files to point to 2026 sheet
2. Keep 2025 as explicit year for historical access
3. Update year filter dropdowns will automatically detect new year
4. Test dashboard and headlines show correct current year

**Why This Matters:**
- Dashboard uses client-side CSV fetching (dashboard.astro)
- Headlines/archive use server-side fetching (crimeData.ts)
- Mismatch causes "flash" effect (shows 2025 then jumps to 2026)
- Duplicate loading wastes bandwidth and slows page load

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

## Project Status

### ✅ Completed
- **Astro Migration (Dec 16, 2025)** 🎉
  - Complete framework migration from Vite to Astro 5.16.5
  - 1,300+ auto-generated crime pages with SEO
  - File-based routing with TypeScript
  - Content Collections for type-safe blog system
  - LIVE in production at crimehotspots.com
- Trinidad & Tobago automation (100% functional)
- ~~Guyana automation~~ (deferred - Trinidad-only focus)
- Automated deployment (GitHub Actions → Cloudflare Pages)
- Blog system with Content Collections
- Weekly report generator with safeguards
- User issue reporting system (Web3Forms integration)
- Site-wide typography framework (responsive, consistent)
- **Trinidad Dashboard** (Leaflet map functional)
  - Replaced Google Looker Studio with Leaflet.js maps
  - Regional filtering, date range selection, crime heatmaps
  - Mobile-optimized with slide-up tray
  - Minor bugs acceptable for now
- **Dashboard UI enhancements (Dec 2, 2025)**
  - Navigation dropdown system (auto-populates from countries.js)
  - Horizontal scrollable widgets with animated visual hints
  - Visual hierarchy improvements (gradient separators)
  - Site-wide button standardization (px-4 py-1.5)
  - Date picker labels and accessibility improvements
  - Auto-closing region tray on filter apply
  - Z-index layering fixes (header, tray, maps)
- **Leaflet Map UX Overhaul (Dec 2, 2025)**
  - Two-finger pan requirement (one finger scrolls page)
  - Smart hint system (only shows when actually panning with one finger)
  - Reset View button to return to original position
  - Date filter integration (map updates with filtered data)
  - Touch movement detection (10px threshold)
  - Prevents hint from blocking marker popups
- Google Analytics 4 integration (GA4: G-JMQ8B4DYEG)
- Cookie consent system
- **Seizures Crime Type (Dec 3, 2025)**
  - New crime type for police enforcement actions
  - Fixes gun/drug seizures misclassified as "Theft"
  - Blue color for visual distinction
  - Applied to both Trinidad and Guyana
- **Enhanced Duplicate Detection (Dec 3, 2025)**
  - Checks both Production and Production Archive sheets
  - Prevents duplicates from archived crimes
  - Smart performance with early exit
  - Applied to both Trinidad and Guyana
- **Phase 1 SEO Implementation (Dec 25, 2025)** ✅
  - **Technical SEO Foundation:** Sitemap.xml (auto-generated, 1,300+ pages), robots.txt, breadcrumbs on ALL pages, Google Analytics 4 (GA4: G-JMQ8B4DYEG), cookie consent system, meta descriptions, Open Graph tags (WhatsApp optimized), Twitter Cards, canonical URLs, geo tags, Content Security Policy (CSP)
  - **Structured Data (Schema.org):** Dataset Schema (headlines), BreadcrumbList Schema, FAQPage Schema (13 Q&As), Organization Schema with social links
  - **Content & Trust (E-E-A-T):** FAQ page (13 questions), Methodology page (data verification process), About page (mission statement), Weekly automated blog posts (Mondays), Interactive Leaflet dashboards
  - **Performance:** Astro static site (excellent Core Web Vitals), daily auto-rebuild (6 AM UTC), 1,300+ auto-generated crime detail pages
  - **Documentation:** See `docs/guides/SEO-Framework.md` for Phase 2-5 roadmap (Social Media, Authority Building, Content Expansion, Advanced Optimization)
- **Official Design System Documentation (Dec 9, 2025)**
  - DESIGN-TOKENS.md created as single source of truth
  - Documented button system (5 variants with copy-paste templates)
  - Frosted glass opacity scale (25/50/70/80)
  - Typography usage rules with examples
  - Color palette formalized (Rose-600 + Slate grays)
  - Common mistakes section for consistency
  - Integrated into CLAUDE.md as required reading
- **Dashboard Trend Comparisons (Dec 16, 2025)**
  - Added trend indicators to Trinidad dashboard statistics cards
  - Last 7 days vs previous 7 days comparison
  - Last 30 days vs previous 30 days comparison
  - Color coded: red for crime increase, green for crime decrease
  - Calculates from current date (not filtered data range)
  - Real-time calculations in browser
- **Daily Auto-Rebuild & Manual Trigger (Dec 16, 2025)**
  - GitHub Actions workflow runs daily at 6 AM UTC (2 AM Trinidad time)
  - Generates new crime detail pages for crimes added to CSV
  - Manual trigger available via GitHub Actions UI
  - Ensures static site stays updated with latest crime data
- **Year Filter Implementation (Dec 17, 2025)**
  - Dashboard defaults to current year (highest year number) on page load
  - Filter tray allows switching between individual years or "All Years"
  - Dynamic dropdown population based on available years in data
  - All dashboard components update when year changes (stats, map, insights)
  - Fixed "Map container already initialized" error via global map reference
  - Proper separation of concerns: map created once, markers updated on filter
- **Dashboard Refactoring (Dec 19, 2025)**
  - Reduced dashboard.astro from 1,011 lines to 579 lines (43% reduction)
  - Extracted reusable scripts:
    - `yearFilter.ts` - Year filtering logic with callbacks (159 lines)
    - `leafletMap.ts` - Map initialization and updates (287 lines)
    - `statsScroll.ts` - Horizontal scroll behavior (33 lines)
  - Created `FiltersTray.astro` component for slide-out filters (87 lines)
  - All scripts and components fully reusable across dashboards
  - Fixed ES6 import syntax issues in Astro script tags
  - Improved code maintainability and consistency
- **Dashboard UX & Loading States (Dec 23, 2025)**
  - Created `InfoPopup.astro` - Click-based help tooltips for mobile
  - Created `LoadingShimmer.astro` - Facebook-style loading animations with 500ms minimum display
  - Created `ReportIssueModal.astro` - Crime data issue reporting system
  - Changed dashboard from "Regions" to "Areas" for cultural accuracy
  - Fixed map touch controls (one-finger scroll, horizontal-only hint)
  - Added Report Issue feature to all 1,300+ crime detail pages
  - Improved crime detail page layout (Street/Area display, clickable sources, fixed Related Crimes links)
  - Applied loading shimmers to stats cards, map, and insight cards
  - Fixed shimmer flash bug by removing initial yearFilter callbacks
- **Dashboard Refactoring & Zero Layout Shift (Dec 23, 2025)**
  - Reduced dashboard from 876 lines → 592 lines (32% reduction)
  - Created `statCardFiltering.ts` (200+ lines) - Clickable stat card logic with tray sync
  - Created `dashboardUpdates.ts` (160+ lines) - All dashboard update functions
  - Implemented zero CLS (Cumulative Layout Shift) using absolute positioning overlays
  - Fixed-height containers prevent jarring shifts: Stats (140px), Map (600px), Insights/Top Regions (400px each)
  - Changed shimmer control from display:none → opacity:0 (no layout reflows)
  - All scripts reusable for future Guyana/Barbados dashboards
- **Clickable Stat Cards (Dec 23, 2025)**
  - One-click crime type filtering (Murders, Robberies, etc.)
  - Toggle on/off behavior with heavy shadow hover effect
  - Active filter: rose-600 border + auto-scroll to center
  - Auto-return after 3 seconds if user scrolls away
  - Perfect sync with filter tray checkboxes
  - Works alongside year filter (combined filtering)
- **Homepage Improvements (Dec 23, 2025)**
  - Added InfoPopup component for "What is Crime Hotspots" (progressive disclosure)
  - Removed duplicate feature section below country cards
  - Cleaner landing page with reduced scroll depth

### 🔄 In Progress
- None - Approaching 2026 with intentional, focused development

### 🐛 Known Issues
- Minor: Some pages missing breadcrumb navigation (low priority)

### 📋 Next To-Do (2026)

**Development Philosophy:**
From 2026 forward, we're adopting a **slow, intentional development approach**. Each feature will be carefully planned, fully tested, and deployed only when ready. Quality over velocity.

**Priority Queue:**
1. **Division/Area Filter Enhancement**
   - Problem: 159 areas in Trinidad = long scrolling list in filter tray
   - Solution: Hierarchical filtering via 11 divisions (Northern, Central, Eastern, etc.)
   - Recommended approach: Search box + accordion of divisions
   - Mobile-optimized for narrow tray width

2. **Complete Breadcrumb Navigation**
   - Add breadcrumbs to remaining pages for better navigation hierarchy

3. **SEO Phase 2: Social Media Dominance** (HIGH PRIORITY - Direct traffic driver)
   - Open Graph preview images with branded templates (auto-generate for blog posts and crime pages)
   - Auto-post to Facebook API (new crimes alerts)
   - Auto-post to X/Twitter API (breaking news)
   - Social sharing buttons on crime detail pages and blog posts
   - **Owner Tasks Needed:** Branding assets (logo, color palette), create Facebook Page + X account, set up Meta Developer account for API keys
   - **Documentation:** See `docs/guides/SEO-Framework.md` for full Phase 2-5 implementation plan

**Future Expansion (When Ready):**
- Guyana expansion (mirror Trinidad structure)
- Barbados automation
- Public API for researchers (Phase 3)

**Vision:** Build Crime Hotspots as the authoritative data hub for Caribbean crime analytics - serving students, policymakers, researchers, news outlets, and the general public.

**Phased Implementation Plan:**

**Phase 1: Current Architecture (Years 1-3, 2025-2028)**
- Status: ✅ Active
- Approach: Multiple CSV export per country
- Trigger: Monitor mulitiple sheet to keep row count from growing beyond the necessary needed to store crime incidents for the year
- Action: None needed, system scales well

**Phase 2: Smart Pagination (Years 3-5, 2028-2030)**
- Approach: Split data by year (Recent + Historical sheets)
- Benefit: Fast initial loads, historical data on demand
- Cost: Free (additional Google Sheets tabs being implemented NOW)
- Features: Year-over-year comparisons

**Phase 3: API + Advanced Analytics (Years 5+, 2030+)**
- Trigger: When building advanced analytics features
- Approach: Cloudflare Workers + R2 Storage
- Cost: Free (100K requests/day, 10 GB storage)
- Features:
  - Year-over-year trend analysis
  - Crime pattern detection (ML/AI)
  - Heatmap time-lapse animations
  - Statistical dashboards (crime clock, seasonal trends)
  - Crime forecasting/predictions
  - Public API for researchers
  - Historical lookup by street/area
  - Neighborhood comparison tools
  - Correlation analysis (weather, holidays, etc.)

**Monitoring Strategy:**
- Monthly check: LIVE sheet row count and CSV size
- Alert triggers:
  - Code files for pages surpases 500 lines (Refactor)
  - CSV >500 KB → Consider optimization
  - Load time >3 seconds → User impact detected

**Documentation:** `docs/architecture/CSV-DATA-MANAGEMENT.md`

---

## Documentation

**For Developers:**
- README.md - Project overview
- This file (CLAUDE.md) - Architecture & current status
- google-apps-script/trinidad/README.md - Trinidad automation

**For Design & SEO:**
- docs/guides/DESIGN-TOKENS.md - **Official Design System (v1.0, Dec 2025)** ⭐ CHECK THIS FIRST
  - Button variants (Primary, Secondary, Large, Subtle, Neutral)
  - Frosted glass containers (opacity scale: 25/50/70/80)
  - Typography system with usage rules
  - Color palette (Rose + Slate)
  - Form inputs, active states, spacing
  - Copy-paste component templates
  - Common mistakes to avoid
- docs/guides/DESIGN-Guidelines.md - Complete design framework (v2.0)
  - High-Density Glass philosophy
  - Typography system, color palette, components
  - Animations, layout patterns, mobile principles
  - Implementation checklist
- docs/guides/SEO-Framework.md - Complete SEO strategy (v2.0)
  - Meta tags, structured data (Schema.org)
  - Social media optimization (WhatsApp priority)
  - E-E-A-T trust building, local SEO
  - Phased implementation roadmap

**For Growth:**
- docs/automation/WEEKLY-REPORT-SAFEGUARDS.md - Blog automation safeguards

**Archived:**
- docs/archive/Development Progress/ - Historical development logs

---



### December 16, 2025 - Dashboard Trend Comparisons & Auto-Rebuild

**Major Accomplishments:**
- ✅ Added daily automatic rebuilds at 6 AM UTC
- ✅ Added manual workflow trigger via GitHub UI

**Commit:**
- `78b5e5c` - Add dashboard trend comparisons and daily auto-rebuild

**Feature Details:**

**Auto-Rebuild System:**
- GitHub Actions workflow updated with `schedule` trigger
- Runs daily at 6 AM UTC (2 AM Trinidad time)
- Also added `workflow_dispatch` for manual triggering
- Ensures new crime detail pages are generated daily
- No code changes needed - just triggers existing build

**Implementation Notes:**
- Trend calculation logic in `astro-poc/src/pages/trinidad/dashboard.astro` (lines 298-356)
- Workflow configuration in `.github/workflows/deploy.yml`
- Comprehensive documentation in `docs/archive/Development Progress/December-16-2025-Trend-Comparisons.md`

**Status:** Production ready, deployed to main branch

---

### December 17, 2025 - Year Filter Implementation

**Major Accomplishments:**
- ✅ Implemented year filter for Trinidad dashboard
- ✅ Fixed "Map container already initialized" error
- ✅ Dynamic dropdown population with available years

**Problem Solved:**
Dashboard was showing ALL years combined (2025 + 2026 data) on page load. User wanted only current year data to display by default, with ability to filter to other years.

**Solution Implemented:**

1. **Default to Current Year** (dashboard.astro:541-548)
   - Detects current year as highest year number in dataset
   - Filters crimes array to current year before passing to map
   - Console logging shows filtered data: `📊 Showing X crimes from YYYY`

2. **Dynamic Dropdown** (dashboard.astro:785-810)
   - Populates year filter dropdown based on available years in data
   - Current year selected by default
   - Adds "All Years" option for viewing combined data

3. **Fixed Map Re-initialization Bug** (dashboard.astro:592, 726, 977-1068)
   - **Root Cause:** Year filter was trying to create new map instance instead of referencing existing one
   - **Solution:** Store map and markers in global variables when first created
   - `window.__leafletMapInstance` - stores map reference
   - `window.__leafletMarkersGroup` - stores markers group
   - `updateLeafletMap()` uses global references instead of recreating map
   - Map created ONCE, markers cleared and re-added on filter change

**Technical Details:**
- Client-side data loading with dual-sheet fetching (2025 + current)
- All dashboard widgets update synchronously on year change
- No server rebuild needed when years change

**Key Files Modified:**
- `astro-poc/src/pages/trinidad/dashboard.astro` (lines 538-548, 592, 726, 756-810, 977-1068)

**Console Logging Added:**
- 🎯 Current year detection
- 📊 Filtered data counts
- ✅ Dropdown population confirmation
- 🔄 Year filter change detection

**Version:** 2.0.0 (Astro)
**Last Updated:** December 19, 2025

---

### December 23, 2025 - Dashboard UX & Loading States

**Major Accomplishments:**
- ✅ Created InfoPopup component for mobile-friendly help tooltips
- ✅ Implemented Facebook-style loading shimmer animations
- ✅ Changed dashboard from "Regions" to "Areas" for cultural accuracy
- ✅ Fixed map touch controls for better mobile UX
- ✅ Added Report Issue feature to crime detail pages
- ✅ Improved crime detail page layout and navigation

**Components Created:**

1. **InfoPopup.astro** - Reusable click-based help tooltip component
   - Replaces broken hover-based tooltips
   - Modal overlay with backdrop blur
   - Top-center positioning on all screen sizes
   - Global state management (only one popup open at a time)
   - Fade in/out animations
   - Close button + click-outside-to-close
   - Mobile-responsive (full-width on mobile, fixed width on desktop)

2. **LoadingShimmer.astro** - Facebook-style loading animation
   - Prevents jarring blank screens during data loading
   - Animated gradient wave effect
   - Configurable height/width
   - 500ms minimum display time to prevent UI flashing
   - Applied to: Stats cards, map, insight cards

3. **ReportIssueModal.astro** - Crime data issue reporting system
   - Integrated into individual crime detail pages
   - Pre-fills crime metadata (slug, headline, date, type, area, region, etc.)
   - Issue type checkboxes (Incorrect headline, Wrong date, Duplicate)
   - Information source dropdown (Eye-witness, News article, Social media, Local knowledge, Other)
   - Form validation (minimum 20 characters, at least one issue selected)
   - Optional contact email field
   - Submits to existing Google Apps Script endpoint
   - Success/error feedback with auto-close

**Dashboard Improvements:**

1. **Loading States**
   - Shimmer animations for stats cards, map, and insights
   - Minimum 500ms display time prevents flashing
   - Smooth fade transitions between shimmer and content
   - Fixed shimmer flash bug by removing initial callbacks from yearFilter.ts

2. **Data Display Changes**
   - Top Regions Card → Top Areas Card (using crime.area instead of crime.region)
   - Quick Insights: "Top 3 regions" → "Top 3 areas"
   - Updated both server-side calculations and client-side year filter updates

3. **Button Layout**
   - Headlines/Filters buttons changed from horizontal to vertical stacking
   - Prevents button stretching on desktop
   - Better mobile responsiveness

4. **Map Touch Controls**
   - Fixed one-finger scroll blocking issue
   - Hint only shows when user attempts horizontal map panning (not vertical page scrolling)
   - Uses deltaX > deltaY detection to distinguish map pan from page scroll
   - Fixed z-index issue (changed from z-1000 to z-10)
   - Allows normal page scrolling with one finger even when map fills screen

**Crime Detail Page Improvements:**

1. **Report Issue Integration**
   - Added "Report Issue" section after Related Crimes
   - Frosted glass container with CTA text
   - Opens ReportIssueModal with pre-filled crime data
   - Helps maintain data accuracy through user feedback

2. **Location Display**
   - Header now shows: Street, Area (was showing Area, Region)
   - Removed redundant Street/Area fields from details section
   - Kept only essential info: Region and Source

3. **Clickable Source**
   - Source name is now a clickable link with dotted underline
   - Removed redundant "Read original article" button
   - Better visual hierarchy

4. **Fixed Related Crimes Links**
   - "All crimes in [month/year]" → Points to actual monthly archive
   - "View [region] on interactive map" → Points to dashboard
   - "Browse recent [crime type] incidents" → Points to headlines
   - Previous implementation had all links going to generic /trinidad/archive

**Files Modified:**
- `astro-poc/src/components/InfoPopup.astro` (NEW)
- `astro-poc/src/components/LoadingShimmer.astro` (NEW)
- `astro-poc/src/components/ReportIssueModal.astro` (NEW)
- `astro-poc/src/components/TopRegionsCard.astro` (changed to use areas)
- `astro-poc/src/components/QuickInsightsCard.astro` (text updates)
- `astro-poc/src/pages/trinidad/dashboard.astro` (loading states, button layout)
- `astro-poc/src/pages/trinidad/crime/[slug].astro` (Report Issue, layout improvements)
- `astro-poc/src/scripts/yearFilter.ts` (removed initial callbacks causing shimmer flash)
- `astro-poc/src/scripts/leafletMap.ts` (onMapReady callback, touch controls fix)

**Technical Notes:**
- Global window functions used for shimmer control (`window.hideShimmerWithMinTime`)
- Minimum shimmer display time prevents UI flashing (500ms)
- InfoPopup uses global state to ensure only one popup open at a time
- Map touch detection distinguishes horizontal (pan map) from vertical (scroll page) gestures
- ReportIssueModal reuses existing Google Apps Script backend endpoint

**Bug Fixes:**
- ✅ Fixed shimmer flash after map loads (removed yearFilter initial callbacks)
- ✅ Fixed map hint appearing above header (z-index z-1000 → z-10)
- ✅ Fixed one-finger scroll blocking (deltaX > deltaY detection)
- ✅ Fixed missing components in Cloudflare build (added StatCard, FiltersTray, etc.)

**Status:** ✅ Implemented and tested locally, ready for production deployment
