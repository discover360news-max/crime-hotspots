# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crime Hotspots is a web-based data visualization platform for Caribbean crime statistics. The application displays crime data dashboards, headlines, and provides anonymous crime reporting functionality.

**Current Status:** ✅ Production - Trinidad & Tobago and Guyana live
**Live Site:** https://crimehotspots.com
**Last Updated:** November 29, 2025

---
## Kavell Forde - Owner - Guidance
My thought are just my thought process and is always open to critisism and can be urged to be modified for the success of the project. 


## Tech Stack

**Frontend:**
- Vanilla JavaScript (ES Modules) with Vite
- Tailwind CSS (via CDN)
- PapaParse for CSV parsing
- DOMPurify for XSS protection
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

---

## Development Commands

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

**Deployment:** Push to `main` → GitHub Actions builds → Cloudflare Pages deploys automatically

---

## Architecture

### Data-Driven Configuration

The entire application is driven by **`src/js/data/countries.js`**. To add a new country:

1. Add entry to `COUNTRIES` array
2. The header, country grid, and all UI elements automatically update

### Key Files

```
Pages:
├── index.html                 # Homepage with country cards
├── dashboard-trinidad.html    # Trinidad custom dashboard (Leaflet map + stats)
├── dashboard-guyana.html      # Guyana custom dashboard (Leaflet map + stats)
├── headlines-trinidad-and-tobago.html  # Trinidad crime headlines
├── headlines-guyana.html      # Guyana crime headlines
├── blog.html                  # Blog index
├── blog-post.html             # Individual blog posts (dynamic)
├── report.html                # Crime reporting form
└── about.html                 # About page

src/js/
├── components/
│   ├── header.js              # Navigation (dynamic from countries.js)
│   ├── dashboardPanel.js      # Legacy dashboard modal (deprecated)
│   ├── headlinesPage.js       # Shared headlines logic
│   ├── loadingStates.js       # Shimmer loaders
│   ├── trinidadMap.js         # Trinidad SVG regional map
│   └── guyanaMap.js           # Guyana SVG regional map
├── data/
│   └── countries.js           # Single source of truth (dashboard URLs, CSV URLs)
└── utils/
    └── dom.js                 # DOM utilities

google-apps-script/
├── trinidad/                  # Trinidad automation
├── guyana/                    # Guyana automation
└── weekly-reports/            # Blog post generation
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

## Recent Features (Nov 2025)

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
- Custom scrollbar styling for better UX

**Visual Hierarchy:**
- Added gradient separator lines between dashboard sections
- Clear separation: metrics → map → charts
- Improved visual flow and content organization

**Mobile Fixes:**
- Fixed Guyana SVG map scaling in mobile tray (was cut off)
- Compact "Select Region" button integrated in header
- Proper z-index layering (map, tray, overlay)

**Homepage Cleanup:**
- Removed flag emoji and "Nationwide Coverage" text from country cards
- Cleaner, more minimal card design

---

## Common Patterns

### Adding a New Page

1. Create HTML file in root
2. Import header component
3. Add to `vite.config.js` input configuration

### Working with CSV Data

- Sheets must be published with `single=true&output=csv`
- PapaParse handles parsing
- Sort/filter client-side

### Creating Dashboards

**Current Approach (Nov 2025):**
- Create standalone HTML page (e.g., `dashboard-trinidad.html`)
- Use Leaflet.js for interactive maps
- OpenStreetMap for tiles (no API key needed)
- Custom SVG regional maps for filtering
- Direct links in `countries.js`

**Deprecated:**
- `dashboardPanel.js` - Old modal approach with Google Looker Studio iframes
- Kept for reference but no longer used in production

### Styling

- Tailwind utilities for layout
- Rose palette (`rose-600`, `rose-700`) for primary actions
- Custom animations in `src/css/styles.css`
- See `docs/guides/DESIGN-Guidelines.md` for complete framework

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

### When Working on Frontend

**DO:**
- Use Read, Edit, Write tools (not bash)
- Prefer editing existing files
- Test with `npm run dev`
- Build successfully before committing

**DON'T:**
- Use emojis unless requested
- Create markdown files unless required
- Modify vite.config.js without understanding

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
- Trinidad & Tobago automation (100% functional)
- Guyana automation (launched Nov 15, 2025)
- Automated deployment (GitHub → Cloudflare)
- Blog system with visual components
- Weekly report generator with safeguards
- User issue reporting system (Web3Forms integration)
- Site-wide typography framework (responsive, consistent)
- **Custom interactive dashboards** (Trinidad & Guyana)
  - Replaced Google Looker Studio with Leaflet.js maps
  - Regional filtering, date range selection, crime heatmaps
  - Mobile-optimized with slide-up tray
  - Both dashboards fully synchronized (Dec 2, 2025)
- Dashboard UI enhancements (Dec 2, 2025)
  - Navigation dropdown system
  - Horizontal scrollable widgets with visual hints
  - Visual hierarchy improvements
  - Site-wide button standardization
- Google Analytics 4 integration (GA4: G-JMQ8B4DYEG)
- Cookie consent system

### 🔄 In Progress
- Guyana backfill processing (170 URLs)
- Facebook data collection automation (Ian Alleyne Network, DJ Sherrif)

### 🐛 Known Issues
- **Date parsing bug:** Some headlines show wrong month (day/month swap)
  - Example: 12/03/2025 showing as Dec 3 instead of Mar 12
  - Cause: Caribbean uses DD/MM/YYYY, script parsing as MM/DD/YYYY
  - Fix location: `google-apps-script/trinidad/processor.gs` and `guyana/processor.gs`
  - Status: Identified Nov 27, fix pending next session

### 📋 Planned
- Barbados automation
- Social media auto-posting (Facebook, X, WhatsApp)
- SEO optimization (meta tags, structured data, sitemap)
- Open Graph images for social sharing
- Methodology/About Data page (E-E-A-T compliance)

---

## Documentation

**For Developers:**
- README.md - Project overview
- This file (CLAUDE.md) - Architecture & current status
- google-apps-script/trinidad/README.md - Trinidad automation
- google-apps-script/guyana/README.md - Guyana automation
- docs/FACEBOOK-DATA-COLLECTION.md - Facebook sources documentation

**For Design & SEO:**
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

**Version:** 1.5.0
**Last Updated:** December 2, 2025
