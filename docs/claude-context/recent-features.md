# Recent Features (November - December 2025)

**For:** Complete details of recently implemented features

**Last Updated:** December 27, 2025

---

## Dashboard Trend Indicators + Modal Navigation (Dec 26, 2025)

**Status:** ✅ LIVE in Production
**Commit:** `073952f`

### 1. Dashboard Stat Card Trends

- Added 30-day trend comparisons to all dashboard stat cards
- Shows full year totals (e.g., 1535 total incidents) + trend indicator below
- Trends compare last 30 days vs previous 30 days from entire database
- **3-day lag offset** accounts for processing delay (crimes posted with crime date, not report date)
- Color-coded: Red ↑ for increases, Green ↓ for decreases
- Format: "↑ 25 (8%) vs prev 30 days"

**Why 3-Day Lag Matters:**
- Crimes are posted with **crime date** (not report date)
- 3-day processing lag means recent days have incomplete data
- Without offset: Trends would compare incomplete vs complete data (misleading stats)
- With offset: Always compares complete 30-day periods (accurate trends)

**Example Calculation (Dec 26, 2025):**
- Last 30 days: Nov 23 - Dec 23 (ending 3 days ago)
- Previous 30 days: Oct 24 - Nov 22 (33-63 days ago)

### 2. Modal-First Navigation (Headlines + Archives)

- Created HeadlinesModal and ArchivesModal components
- Instant popups instead of page navigation (mobile-first UX)
- Island selector shows active islands (Trinidad) vs "Coming Soon" (Guyana, Barbados, Jamaica)
- Driven by `countries.ts` configuration
- Saves one page load per user journey

### 3. Monthly Archive Redesign

- Replaced static crime list with dashboard-style insights
- Horizontal scroll stat cards with trend arrows (month-over-month, year-over-year)
- Quick Insights section: Deadliest day, Trending crime type, Overall trend
- Value-driven data presentation (not just numbers)

### 4. Cloudflare Turnstile Integration

- Fixed ReportIssueModal and /report page CAPTCHA integration
- **Key Learning:** Invisible mode requires async token generation
- Added 1.5s wait time for token generation
- Backend expects `cf-token` field (not `cf-turnstile-response`)
- Callback tracking with `onReportTurnstileSuccess` for invisible mode

**Turnstile Best Practices:**
```javascript
// Wait for invisible widget to generate token
if (!token || token === '') {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const newFormData = new FormData(form);
  token = newFormData.get('cf-turnstile-response');
}

// Backend expects 'cf-token' field
const payload = {
  'cf-token': turnstileToken,
  // ... other fields
};
```

### 5. Report Confirmation Screen Redesign

- Added success checkmark icon (emerald green)
- "What's Next?" section with actionable buttons
- Browse Headlines + Submit Another buttons
- Full-width Copy ID button

**Technical Notes:**
- Trend calculations separated: Display value (filtered crimes) vs Trend data (30-day periods from all crimes)
- Helper function `updateCardWithTrend()` accepts 3 parameters: displayValue, last30Count, prev30Count
- Trends hide automatically if no previous period data available
- Modal state uses global window functions for cross-component communication
- Turnstile site key: `0x4AAAAAAB_ThEy2ACY1KEYQ`

---

## Site-Wide Search (Dec 27, 2025)

**Status:** ✅ LIVE in Production

### Features Implemented:

**Search Technology:**
- Pagefind - Static site search with WebAssembly
- 1,584 pages indexed (only crime detail pages)
- Auto-generated search index during build

**Search Modal:**
- Created `SearchModal.astro` component
- Frosted glass design matching site aesthetics
- Keyboard shortcut: Ctrl+K (Cmd+K on Mac)
- Focus management (auto-focus on open)
- Search across headlines, locations (streets, areas, regions), crime types

**Search Accessibility:**
- Header icon (desktop + mobile)
- Footer button with social icons
- Keyboard shortcut (Ctrl+K)

**Content Security Policy:**
- Added `'unsafe-eval'` to script-src for WebAssembly compilation
- Required for Pagefind's WASM execution

**Excluded from Search:**
- Archive listing pages (`data-pagefind-ignore` on `/trinidad/archive/[year]/[month]`)
- Headlines listing page (`data-pagefind-ignore` on `/trinidad/headlines`)
- Dashboard page (`data-pagefind-ignore` on `/trinidad/dashboard`)

**User Experience:**
- Searching "Kimo" returns individual crime page (not archive page)
- Instant results with highlighted matches
- Clean result cards with excerpts

---

## Dashboard UX & Loading States (Dec 23, 2025)

**Status:** ✅ LIVE in Production

### New Components Created:

**1. InfoPopup.astro** - Click-based help tooltips
- Top-center positioning, mobile-responsive
- Fade in/out animations
- Used on dashboard map info icon
- Modal overlay with backdrop blur
- Global state management (only one popup open at a time)

**2. LoadingShimmer.astro** - Facebook-style shimmer loading
- Configurable height, width, border radius
- 1.5s gradient wave animation
- 500ms minimum display time prevents flash on fast loads
- Applied to stats cards, map, and insight cards

**3. ReportIssueModal.astro** - Crime data issue reporting
- Pre-fills crime metadata (slug, headline, date, area, etc.)
- Issue type checkboxes (Incorrect headline, Wrong date, Duplicate)
- Information source dropdown (Eye-witness, News article, etc.)
- Form validation and submission to Google Apps Script endpoint

### Dashboard Improvements:

**Loading States:**
- Shimmer effects on initial load AND year filter changes
- Smooth opacity transitions (300ms)
- Fixed shimmer flash bug by removing initial yearFilter callbacks

**Area vs Region:**
- Changed dashboard from "regions" to "areas"
- More culturally accurate for Trinidad (Port of Spain vs Cova-Tabaquite-Talparo)
- Updated TopRegionsCard → TopAreasCard
- Updated QuickInsightsCard "Top 3" stat

**Map Touch Controls:**
- Vertical swipe = page scroll (works normally)
- Horizontal swipe on map = hint appears ("Use two fingers")
- Fixed z-index: hint stays below header (z-10 instead of z-1000)

**Button Layout:**
- Headlines + Filters buttons stack vertically (better spacing)

### Crime Detail Page Improvements:

**Report Issue Feature:**
- Button appears after Related Crimes section
- Opens modal with pre-filled crime data
- Users select issue types, provide source, describe problem
- Optional contact email field

**Location Display:**
- Header now shows "Street, Area" instead of "Area, Region"
- Removed redundant fields from details section (Street, Area)
- Kept only Region and Source

**Clickable Source:**
- Source name now links to original article
- Dotted underline styling (border-dotted)
- Removed redundant "Read original article" button

**Fixed Related Crimes Links:**
- "All crimes in December 2025" → Monthly archive
- "View [Region] on interactive map" → Dashboard
- "Browse recent [CrimeType] incidents" → Headlines

---

## Dashboard Refactoring & Zero Layout Shift (Dec 23, 2025)

**Status:** ✅ LIVE in Production

**Code Reduction:**
- Reduced dashboard from 876 lines → 592 lines (32% reduction)

**New Scripts Created:**
- `statCardFiltering.ts` (200+ lines) - Clickable stat card logic with tray sync
- `dashboardUpdates.ts` (160+ lines) - All dashboard update functions

**Zero CLS Implementation:**
- Fixed-height containers prevent jarring shifts
  - Stats: 140px
  - Map: 600px
  - Insights/Top Regions: 400px each
- Absolute positioning overlays
- Shimmer control from display:none → opacity:0 (no layout reflows)

**Clickable Stat Cards:**
- One-click crime type filtering (Murders, Robberies, etc.)
- Toggle on/off behavior with heavy shadow hover effect
- Active filter: rose-600 border + auto-scroll to center
- Auto-return after 3 seconds if user scrolls away
- Perfect sync with filter tray checkboxes
- Works alongside year filter (combined filtering)

---

## Year Filter System (Dec 18, 2025)

**Status:** ✅ LIVE in Production

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

**Key Lesson Learned:**
CSV URLs **must** be synchronized between `crimeData.ts` and `dashboard.astro` to prevent:
- Duplicate data loading (wastes bandwidth)
- Wrong year showing on page load
- "Flash" effect (shows 2025 then jumps to 2026)

---

## Dashboard Refactoring (Dec 19, 2025)

**Status:** ✅ LIVE in Production

**Code Reduction:**
- Reduced dashboard.astro from 1,011 lines to 579 lines (43% reduction)

**Extracted Reusable Scripts:**
- `yearFilter.ts` - Year filtering logic with callbacks (159 lines)
- `leafletMap.ts` - Map initialization and updates (287 lines)
- `statsScroll.ts` - Horizontal scroll behavior (33 lines)

**Created Components:**
- `FiltersTray.astro` - Slide-out filters (87 lines)

**Benefits:**
- All scripts and components fully reusable across dashboards
- Fixed ES6 import syntax issues in Astro script tags
- Improved code maintainability and consistency

---

## Enhanced Duplicate Detection (Dec 3, 2025)

**Location:** `google-apps-script/guyana/processor.gs`, `google-apps-script/trinidad/processor.gs`

**Problem:** Duplicates slipping through when older crimes have been archived from Production to Production Archive

**Documentation:** `docs/automation/DUPLICATE-DETECTION-ARCHIVE.md`

---

## Seizures Crime Type (Dec 3, 2025)

**Location:** `google-apps-script/guyana/geminiClient.gs`, `google-apps-script/trinidad/geminiClient.gs`

**Problem:** Gun/ammunition seizure stories were incorrectly classified as "Theft"

**Documentation:** `docs/automation/SEIZURES-CRIME-TYPE.md`

---

## Dashboard UI Enhancements (Dec 2, 2025)

**Status:** ✅ LIVE in Production

**Features:**
- Navigation dropdown system (auto-populates from countries.js)
- Horizontal scrollable widgets with animated visual hints
- Visual hierarchy improvements (gradient separators)
- Site-wide button standardization (px-4 py-1.5)
- Date picker labels and accessibility improvements
- Auto-closing region tray on filter apply
- Z-index layering fixes (header, tray, maps)

---

## Leaflet Map UX Overhaul (Dec 2, 2025)

**Status:** ✅ LIVE in Production

**Features:**
- Two-finger pan requirement (one finger scrolls page)
- Smart hint system (only shows when actually panning with one finger)
- Reset View button to return to original position
- Date filter integration (map updates with filtered data)
- Touch movement detection (10px threshold)
- Prevents hint from blocking marker popups
