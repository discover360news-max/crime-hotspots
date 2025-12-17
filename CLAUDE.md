# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crime Hotspots is a web-based data visualization platform for Caribbean crime statistics. The application displays crime data dashboards, headlines, and provides anonymous crime reporting functionality.

**Current Status:** ✅ Production - Trinidad & Tobago LIVE (Astro-powered)
**Live Site:** https://crimehotspots.com
**Framework:** Astro 5.16.5 (migrated from Vite, December 16, 2025)
**Focus:** Trinidad-only implementation (Guyana expansion deferred)
**Last Updated:** December 16, 2025

---
## Kavell Forde - Owner - Guidance
My thought are just my thought process and is always open to critisism and can be urged to be modified for the success of the project. 


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
│   │   ├── CrimeCard.astro   # Crime card component
│   │   └── Breadcrumbs.astro # SEO breadcrumb navigation
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
3. Full article text fetched every hour
4. Gemini AI extracts crime data every hour
5. Data published to Production sheet (public CSV)
6. **Update frequency:** Data refreshed every 24 hours

### Guyana
1. **RSS feeds** collected hourly (Stabroek News, Kaieteur News, Guyana Chronicle)
2. Full article text fetched every hour
3. Gemini AI extracts crime data every hour
4. Data published to Production sheet (public CSV)
5. **Update frequency:** Data refreshed every 24 hours

**Critical Configuration (NEVER change):**
- `maxOutputTokens: 4096` - Must stay at 4096 to prevent truncation
- Multi-crime detection - crimes must be an array
- API keys stored in Script Properties, never hardcoded

**Documentation:**
- `google-apps-script/trinidad/README.md`
- `google-apps-script/guyana/README.md`
- `docs/FACEBOOK-DATA-COLLECTION.md` (Facebook sources)

---

## Weekly Blog Reports

**Location:** `google-apps-script/weekly-reports/weeklyReportGenerator-IMPROVED.gs`

**Runs:** Every Monday at 10 AM

**Safeguards:**
- Minimum 10 crimes required
- Data freshness check (3+ recent crimes)
- Duplicate detection
- Backlog check (skips if > 50 pending)
- Email notifications when skipped

**Documentation:** `docs/automation/WEEKLY-REPORT-SAFEGUARDS.md`

---

## Recent Features (Nov-Dec 2025)

### Astro Migration (Dec 16, 2025)
**Status:** ✅ LIVE in Production
**Location:** `astro-poc/` directory

**What Changed:**
- **Complete framework migration** from Vite to Astro 5.16.5
- **1,300+ auto-generated crime pages** with SEO optimization
- **Static Site Generation (SSG)** - All pages pre-rendered at build time
- **File-based routing** - No more manual HTML files
- **Content Collections** - Type-safe blog system with Markdown

**Key Benefits:**
- **SEO Explosion:** 1,300+ indexed pages (was ~15 pages in Vite)
- **Unique URLs per crime:** `/trinidad/crime/murder-port-of-spain-2025-12-15`
- **Monthly archives:** `/trinidad/archive/2025/12` with statistics
- **Schema.org markup:** NewsArticle, BreadcrumbList, FAQPage
- **Lightning fast:** Static HTML = <1s load times

**Pages Implemented:**
- ✅ Homepage with country cards
- ✅ Trinidad Dashboard (Leaflet map functional, minor bugs acceptable)
- ✅ Trinidad Headlines (`/trinidad/headlines`)
- ✅ 1,300+ individual crime pages with related crimes sidebar
- ✅ Monthly archive pages with statistics
- ✅ Blog system (index + individual posts)
- ✅ Static pages (About, FAQ, Methodology, 404)

**Missing Features (To-Do):**
- ❌ **Breadcrumbs** - Missing on some pages
- ❌ **Report form** - Needs recreation from `report.html` to Astro
- ❌ **Report Issue feature** - Crime pages need "Report Issue" button
  - Should reuse pattern from `src/js/reportStandalone.js`
  - Allow users to flag incorrect crime data
  - Similar to existing issue reporting modal

**Technical Details:**
- **Build:** `cd astro-poc && npm run build`
- **Dev server:** Port 4321 (not 5173)
- **Build output:** `astro-poc/dist/`
- **Build time:** ~30-60 seconds (generates 1,300+ pages)
- **Deployment:** GitHub Actions → Cloudflare Pages
  - Build command: `cd astro-poc && npm ci && npm run build`
  - Output directory: `astro-poc/dist`

**Focus:** Trinidad-only implementation. Guyana expansion deferred until Trinidad is perfected.

**Vite Version:** Deprecated and no longer deployed.

---

### Enhanced Duplicate Detection (Dec 3, 2025)
**Location:** `google-apps-script/guyana/processor.gs`, `google-apps-script/trinidad/processor.gs`

**Problem:** Duplicates slipping through when older crimes have been archived from Production to Production Archive

**Solution:** Duplicate detection now checks BOTH sheets
- Checks Production sheet first (recent data, fast)
- Checks Production Archive second (historical data)
- Skips crime if duplicate found in either sheet
- Gracefully handles missing archive sheet

**Implementation:**
- Added `PRODUCTION_ARCHIVE` to `SHEET_NAMES` config
- Sequential duplicate checks with early exit
- Clear logging shows which sheet had the duplicate
- Both Trinidad and Guyana automation updated

**Documentation:** `docs/automation/DUPLICATE-DETECTION-ARCHIVE.md`

### Seizures Crime Type (Dec 3, 2025)
**Location:** `google-apps-script/guyana/geminiClient.gs`, `google-apps-script/trinidad/geminiClient.gs`

**Problem:** Gun/ammunition seizure stories were incorrectly classified as "Theft"

**Solution:** Added new "Seizures" crime type for police enforcement actions
- Police seizures of illegal items (guns, drugs, contraband)
- Recovery of stolen goods
- Distinct from actual thefts (crimes against victims)
- Blue color (#3b82f6) for visual association with law enforcement

**Implementation:**
- Updated Gemini prompts with clear "Seizures vs Theft" rules
- Added to crime color configuration (`src/js/config/crimeColors.js`)
- Both Trinidad and Guyana automation updated

**Documentation:** `docs/automation/SEIZURES-CRIME-TYPE.md`

### Custom Interactive Dashboards
**Completed Nov 22-24, 2025**
**Location:** `dashboard-trinidad.html`, `dashboard-guyana.html`

**What Changed:**
- **Replaced Google Looker Studio iframes** with custom-built dashboards
- Full control over design, performance, and user experience
- No more slow loading times or iframe restrictions

**Technology:**
- Leaflet.js for interactive maps
- OpenStreetMap tiles (free, no API keys)
- Leaflet.markercluster for crime density visualization
- Custom SVG regional maps (clickable regions)
- PapaParse for CSV data processing

**Features:**
- **Interactive regional maps:** Click regions to filter data
- **Date range filtering:** View specific time periods
- **Crime statistics widgets:** Total crimes, top areas, crime type breakdowns
- **Crime density heatmap:** Visual clustering on map
- **Mobile-optimized:** Slide-up tray for map on mobile
- **Direct link to headlines:** Seamless navigation between dashboard and headlines

**Trinidad Dashboard (dashboard-trinidad.html):**
- Regional map with 15 municipal districts
- Click region to filter statistics
- Compact "Select Region" button for mobile
- Outline-style "View Headlines" button
- Clean header without background color

**Guyana Dashboard (dashboard-guyana.html):**
- Administrative regions (Region 1-10)
- Identical layout to Trinidad (matched Dec 2, 2025)
- Mobile region selector
- All styling synchronized with Trinidad standard

### Issue Reporting System
**Location:** Headlines summary modal
**Implementation:** Web3Forms API (free, no CORS issues)
**Features:**
- Native OS dropdown for issue type selection
- Optional 500-char details textarea
- Session rate limiting (3 reports max)
- Text sanitization + honeypot protection
- Email notifications to discover360news@gmail.com

**Why Web3Forms (not Google Apps Script):**
- No CORS/CSP complications
- No deployment/authorization complexity
- Free unlimited submissions
- Instant email delivery

### Typography Framework
**Location:** `/src/css/styles.css`
**Implementation:** CSS custom properties with semantic classes
**Classes:** `.text-display`, `.text-h1`, `.text-h2`, `.text-h3`, `.text-body`, `.text-small`, `.text-tiny`, `.text-nav`
**Benefit:** Single-source-of-truth for all text sizing, mobile-first responsive

### Dashboard UI Enhancements (Dec 2, 2025)

**Navigation Improvements:**
- Added Dashboard dropdown to header (auto-populates from countries.js)
- Dropdown conditionally appears when NOT on homepage
- Mirrors Headlines dropdown pattern for consistency
- Fixed blog filter buttons - proper active/inactive state toggle

**Dashboard Standardization:**
- Completed comprehensive audit: Trinidad set as standard, Guyana matched exactly
- Unified all structural differences (13 fixes total)
- Standardized button sizing site-wide: `px-4 py-1.5` for all buttons
- Primary CTAs: solid rose-600 background
- Secondary CTAs: border-2 border-rose-600 outline

**Widget Improvements:**
- Transformed metrics cards from grid to horizontal scrollable layout
- Added smooth snap scrolling with visual hints
- Fade gradient indicator shows when more content is available
- Animated rose-colored chevron arrow hint (pulsing)
- Custom scrollbar styling for better UX

**Visual Hierarchy:**
- Added gradient separator lines between dashboard sections
- Separator above "Crime Statistics Dashboard" heading
- Clear separation: metrics → map → charts
- Improved visual flow and content organization

**Mobile Fixes:**
- Fixed Guyana SVG map scaling in mobile tray (was cut off)
- Compact "Select Region" button integrated in header
- Proper z-index layering: tray (z-50) > overlay (z-40) > header (z-30) > leaflet map (z-1)
- Fixed Leaflet incidents map scrolling over header

**Date Picker Improvements:**
- Added "From:" and "To:" labels for desktop date pickers
- Added "From Date:" and "To Date:" labels for mobile
- Title tooltips for accessibility
- Region tray auto-closes after applying date filter

**Homepage Cleanup:**
- Removed flag emoji and "Nationwide Coverage" text from country cards
- Cleaner, more minimal card design

### Leaflet Map UX Overhaul (Dec 2, 2025)

**Critical Mobile Scroll Fix:**
- **Problem:** Single-finger scroll over map would zoom/pan map instead of scrolling page
- **Solution:** Implemented two-finger pan requirement
  - ONE finger = scrolls page (map doesn't intercept touch)
  - TWO fingers = pans/drags map
  - Desktop mouse = normal dragging enabled
- Touch detection counts fingers and dynamically enables/disables map dragging
- Prevents frustrating map interaction when user just wants to scroll

**Smart Hint System:**
- Shows "Use two fingers to move map" overlay ONLY when user tries to pan with one finger
- Detects actual panning intent (movement > 10px)
- Does NOT show on:
  - Two-finger touches (correct behavior)
  - Quick taps to select markers
  - Any touch without significant drag movement
- Auto-dismisses after 2 seconds
- Prevents hint from blocking marker popups

**Reset View Button:**
- Returns map to original center coordinates and zoom level
- Icon button in map header with "Reset View" label
- Smooth transition animation

**Date Filter Integration:**
- Fixed critical bug: Leaflet map was showing ALL data regardless of date filter
- Now properly filters markers by selected date range
- Passes filtered data to map creation
- Console logging: "📍 Map filtered by date: X records"
- Synchronizes with other dashboard widgets

**Applied to Both Dashboards:**
- Trinidad Leaflet Map (src/js/components/trinidadLeafletMap.js)
- Guyana Leaflet Map (src/js/components/guyanaLeafletMap.js)

**Technical Implementation:**
```javascript
// Touch detection for smart panning
mapDiv.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    mapInstance.dragging.enable(); // Two fingers = pan
  } else if (e.touches.length === 1) {
    mapInstance.dragging.disable(); // One finger = scroll page
  }
});

// Movement detection for smart hints
mapDiv.addEventListener('touchmove', (e) => {
  const distance = calculateMovement(touchStart, currentPos);
  if (distance > 10 && touchCount === 1) {
    showHint(); // Only show if actually dragging with one finger
  }
});
```

### Header Navigation Enhancements (Dec 3, 2025)

**Major UX Improvement:**
- Added horizontal scrollable "quick access pills" below main header
- Added "Subscribe" button with slide-out tray for social media links
- Inspired by modern news apps (Ground News pattern)

**Quick Access Pills:**
- **Location:** Below main header, above page content
- **Horizontal scroll:** Touch-friendly, snap-to-grid behavior
- **No active states:** Pills remain static (no highlighting)
- **Pills included:**
  - Report a Crime (primary CTA - rose-600 background)
  - Trinidad Headlines
  - Guyana Headlines
  - Trinidad Dashboard
  - Guyana Dashboard
  - Blog
  - About

**Subscribe Tray:**
- **Trigger:** "Subscribe" button in desktop nav (outline style, rose-600 border)
- **Pattern:** Reuses mobile menu slide-in tray design
- **Social platforms:**
  - X (Twitter): @crimehotspots
  - Facebook: @crimehotspots
  - WhatsApp: Direct messaging link
- **UX:** Backdrop blur, smooth animations, Escape key closes

**Technical Details:**
- Pills use Tailwind snap scroll (`snap-x snap-mandatory`)
- Z-index hierarchy maintained: tray (z-50) > backdrop (z-40) > header (z-40)
- Custom scrollbar styling for pills container
- Subscribe tray shares code pattern with mobile menu

**File Modified:**
- `src/js/components/header.js` (lines 136-628)

**Why This Matters:**
- Surfaces "Report a Crime" feature (previously buried in footer)
- Quick navigation to key pages without dropdown hunting
- Social media engagement now one tap away
- Mobile-first design with horizontal scroll

---

## Common Patterns (Astro)

### Adding a New Page

1. Create `.astro` file in `astro-poc/src/pages/`
2. URL is auto-generated from file path:
   - `src/pages/about.astro` → `/about`
   - `src/pages/trinidad/headlines.astro` → `/trinidad/headlines`
3. Use `Layout.astro` for consistent header/footer
4. No configuration needed - Astro handles routing

**Example:**
```astro
---
import Layout from '../layouts/Layout.astro';
const title = "My New Page";
---

<Layout title={title}>
  <main>
    <h1>My New Page</h1>
  </main>
</Layout>
```

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

**DON'T:**
- Use emojis unless requested
- Create markdown files unless required
- Modify `astro.config.mjs` without understanding
- Create new button variants (use existing patterns from DESIGN-TOKENS.md)
- Use colors outside the Rose + Slate palette
- Work in root directory (Vite version is deprecated)

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
- **Phase 1 SEO Implementation (Dec 3, 2025)**
  - FAQ page with accordion UI and Schema.org markup
  - Methodology page for E-E-A-T compliance
  - robots.txt and sitemap.xml
  - Optimized meta descriptions and Open Graph tags
  - Navigation enhancements (FAQ, Methodology, Instagram links)
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

### 🔄 In Progress
- **Astro Missing Features:**
  - Breadcrumbs missing on some pages
  - Report form (needs Astro recreation from `report.html`)
  - Report Issue feature for crime pages (flag incorrect data)
- Facebook data collection automation (Ian Alleyne Network, DJ Sherrif)

### 🐛 Known Issues
- Minor dashboard bugs (acceptable for now)
- Some pages missing breadcrumb navigation

### 📋 Planned

**Near-Term (Astro Completion):**
- Complete breadcrumb navigation across all pages
- Recreate report form in Astro (`/report`)
- Add "Report Issue" button to crime pages
  - Reuse pattern from `src/js/reportStandalone.js`
  - Allow users to flag incorrect crime summaries
- Fix remaining dashboard bugs

**Long-Term:**
- Guyana expansion (mirror Trinidad structure)
- Barbados automation
- Social media auto-posting (Facebook, X, WhatsApp)
- Open Graph images for social sharing (social media cards)
- SEO Phase 2: Complete internal linking, sitemaps
- SEO Phase 3: Submit to search engines, local SEO

**Data Scalability & Analytics (Long-Term Vision)**

**Current Status (Dec 2025):**
- Trinidad LIVE: 1,201 rows ≈ 120 KB CSV ✅ Healthy
- Guyana LIVE: ~400-600 rows (estimated)
- Performance: Excellent, no issues
- Growth Rate: ~1,500 rows/year per country

**Vision:** Build Crime Hotspots as the authoritative data hub for Caribbean crime analytics - serving students, policymakers, researchers, news outlets, and the general public.

**Phased Implementation Plan:**

**Phase 1: Current Architecture (Years 1-3, 2025-2028)**
- Status: ✅ Active
- Approach: Single CSV export per country
- Trigger: Monitor until 5,000 rows
- Action: None needed, system scales well

**Phase 2: Smart Pagination (Years 3-5, 2028-2030)**
- Trigger: When LIVE sheet reaches 5,000 rows
- Approach: Split data by year (Recent + Historical sheets)
- Benefit: Fast initial loads, historical data on demand
- Cost: Free (additional Google Sheets tabs)
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
  - >5,000 rows → Plan Phase 2 implementation
  - CSV >500 KB → Consider optimization
  - Load time >3 seconds → User impact detected

**Documentation:** `docs/architecture/CSV-DATA-MANAGEMENT.md`

---

## Documentation

**For Developers:**
- README.md - Project overview
- This file (CLAUDE.md) - Architecture & current status
- google-apps-script/trinidad/README.md - Trinidad automation
- google-apps-script/guyana/README.md - Guyana automation
- docs/FACEBOOK-DATA-COLLECTION.md - Facebook sources documentation

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

## Development Sessions

### December 2, 2025 - Dashboard Polish & Leaflet Map UX

**Major Accomplishments:**
- ✅ Dashboard standardization complete (Trinidad as standard, Guyana matched)
- ✅ Leaflet map UX overhaul with smart touch detection
- ✅ Critical mobile scroll fix (two-finger pan requirement)
- ✅ Date filter integration for Leaflet maps

**Commits:**
1. `e46e88a` - Dashboard improvements and UI standardization
2. `31ec2bd` - Update CLAUDE.md with Dec 2 dashboard improvements
3. `8e730f1` - Urgent dashboard fixes (charts, widgets, z-index)
4. `dd08691` - Fix Leaflet incidents map z-index issue
5. `4e58dba` - UX improvements (tray auto-close, date labels, red scroll cue, separator)
6. `77515bb` - Major Leaflet map UX improvements (two-finger zoom, reset, alerts)
7. `4cabbc1` - CRITICAL FIX: Corrected map scrolling and date filter updates
8. `6e1891c` - Fix map hint to only show when actually panning with one finger

**Key Features Delivered:**
- Horizontal scrollable widgets with visual cues (rose chevron, fade gradient)
- Dashboard dropdown navigation (auto-populates from countries.js)
- Two-finger pan requirement for Leaflet maps (prevents scroll hijacking)
- Smart hint system (movement detection, 10px threshold)
- Date filter synchronization across all widgets including Leaflet map
- Reset View button for map navigation
- Z-index hierarchy fixes (tray > overlay > header > leaflet map)
- Date picker labels and accessibility improvements

**Bug Fixes:**
- Fixed 7-day trend chart duplicate dates (autoSkip with maxTicksLimit: 7)
- Fixed stacked bars visualization
- Fixed Leaflet map not updating when date filter applied
- Fixed hint appearing on every touch (now only on actual pan attempts)
- Fixed map hint blocking marker popups
- Fixed Guyana SVG map scaling in mobile tray

**UX Improvements:**
- Region tray auto-closes after applying filter
- Site-wide button standardization (px-4 py-1.5)
- Visual hierarchy with gradient separators
- Cleaner homepage cards (removed emoji and subtitle)

**Status:** Production ready, all features tested and deployed

---

### December 16, 2025 - Dashboard Trend Comparisons & Auto-Rebuild

**Major Accomplishments:**
- ✅ Implemented trend indicators for Trinidad dashboard
- ✅ Added daily automatic rebuilds at 6 AM UTC
- ✅ Added manual workflow trigger via GitHub UI

**Commit:**
- `78b5e5c` - Add dashboard trend comparisons and daily auto-rebuild

**Feature Details:**

**Trend Comparisons:**
- Displays "vs last week" and "vs last month" trends on Total Incidents card
- Compares last 7 days vs previous 7 days (from today)
- Compares last 30 days vs previous 30 days (from today)
- Color coding: Red arrow (↑) for crime increase, Green arrow (↓) for crime decrease
- JavaScript runs in browser using current date, no rebuild needed for daily updates
- Fixed Date validation bug preventing `toISOString is not a function` error

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

**Console Logging:**
- Added emoji-prefixed debugging: 🔍 (load), 🚀 (init), 📅 (dates), 📊 (data), ✅ (success)

**Status:** Production ready, deployed to main branch

---

**Version:** 2.0.0 (Astro)
**Last Updated:** December 16, 2025
