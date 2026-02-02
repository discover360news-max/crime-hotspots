# Recent Features (December 2025 - February 2026)

**For:** Complete details of recently implemented features

**Last Updated:** February 2, 2026

**Note:** Features older than 90 days are archived to `docs/archive/accomplishments/`

---

## February 2026 Features

### Section Picker Modal (Feb 2, 2026)

**Problem:** Clicking an island on the homepage navigated directly to the dashboard. Users had no visibility into other available sections (Headlines, Statistics, Compare, etc.) without first landing on the dashboard and discovering them through the header navigation.

**Solution:**
- New `SectionPickerModal` component opens when clicking an available island on the homepage
- Shows all available sections for that island as a list of clickable buttons (same style as HeadlinesModal)
- Sections are driven dynamically from `countries.ts` config via a `sections` array on each country
- Adding a new page/section only requires adding an entry to the config — no component changes needed
- Coming-soon islands remain unchanged (disabled, no modal)

**Sections (Trinidad):** Dashboard, Headlines, Archive, Areas, Compare, Statistics, Regions, Murder Count

**Files:**
- `src/components/SectionPickerModal.astro` — New component
- `src/data/countries.ts` — Added `CountrySection` interface and `sections` array to Trinidad
- `src/pages/index.astro` — Changed island `<a>` to `<button>` triggering modal, added "Explore" CTA text

**Status:** Complete

---

### Facebook Post Submitter Web App (Feb 2, 2026)

**Problem:** Manual workflow for Facebook crime stories was slow: copy post → paste into Gemini → copy fields line-by-line into Google Forms. Done daily.

**Solution:**
- Google Apps Script web app (`facebookSubmitter.gs`) with text box + URL field + year toggle
- Reuses existing Claude Haiku extraction (`claudeClient.gs`) and production routing (`processor.gs`)
- Year toggle: **2026** writes to pipeline Production sheet, **2025** writes to FR1 sheet (different spreadsheet)
- Confidence bypass: manual submissions skip confidence check, always route to Production
- Includes geocoding and duplicate detection (2026 path) via existing `appendToProduction()`

**Key Details:**
- 2025 FR1 sheet has different 14-column format (Date, Headline, Crime Type, Street Address, Location, Area, Region, Island, URL, Source, Latitude, Longitude, Summary, Secondary Crime Types)
- 2026 Production sheet uses 16-column format with victimCount and dual crime type fields
- Facebook URL field optional (defaults to `facebook.com/manual-entry`)
- Trinidad Guardian has no RSS feed (site is fully JS-rendered) — Facebook submitter is the primary way to capture Guardian stories

**Files:** `google-apps-script/trinidad/facebookSubmitter.gs`

**Status:** Complete

---

### Modal Pageview Tracking via pushState (Feb 2, 2026)

**Context:** CrimeDetailModal shows full crime page content (headline, metadata, safety context, share buttons) but neither GA4 nor Cloudflare Web Analytics tracked these views. This underreported total audience reach — critical for attracting sponsors.

**Problem:** Modals don't trigger real page navigations, so analytics platforms ignore them. GA4 custom events alone wouldn't fix Cloudflare (which has no event API). Needed a solution that works for both.

**Implementation:**
- **`history.pushState()`** on modal open — pushes `/trinidad/crime/{slug}` to browser URL
  - Cloudflare beacon detects pushState and records a pageview automatically
  - GA4 enhanced measurement also detects history changes
  - URL becomes shareable (copied URL points to actual crime page)
- **`history.back()`** on modal close (X button, backdrop click, Escape key)
  - Restores the original page URL
- **`popstate` listener** for browser back button
  - Closes modal visually without double-calling `history.back()`
  - `skipHistory` flag prevents race condition

**UX Improvements:**
- Back button now closes modal (expected mobile behavior, previously navigated away)
- URL updates to crime page path while modal is open (shareable)
- Zero impact if cookie consent not given (Cloudflare is cookieless, GA4 silently skips)

**Files Modified:**
- `src/components/CrimeDetailModal.astro` — Added `originalUrl` variable, `pushState` on open, `history.back()` on close, `popstate` event listener

**Status:** ✅ Complete

---

## January 2026 Features

### Dynamic OG Image for Murder Count (Jan 28, 2026)

**Context:** When users share `/trinidad/murder-count/` on WhatsApp, Facebook, or X, no preview image was shown. The `og-image.jpg` meta tag pointed to a non-existent file. Goal: Generate a branded OG image at build time showing the live murder count.

**Implementation:**
- **Satori + Sharp** — Build-time image generation
  - Satori renders JSX-like objects to SVG
  - Sharp converts SVG to PNG
  - Runs once during `npm run build`
- **OG Image Design (1200x630):**
  - Dark slate gradient background
  - "TRINIDAD & TOBAGO" header
  - Large murder count number (rose color)
  - "murders so far" subtitle
  - YoY change indicator (green ↓ or red ↑)
  - Murder rate per 100k
  - "crimehotspots.com" branding
- **Daily Updates** — Image regenerates with each GitHub Actions rebuild at 6 AM UTC

**Files Created/Modified:**
- `src/lib/generateOgImage.ts` — Reusable OG image generator
- `public/fonts/Inter-Regular.otf`, `Inter-Bold.otf` — Fonts for satori (OTF required, woff2 not supported)
- `public/og-images/murder-count.png` — Generated image (57KB)
- `src/pages/trinidad/murder-count.astro` — Calls generator, passes ogImage to Layout
- `src/layouts/Layout.astro` — Added `og:image:width` (1200) and `og:image:height` (630) meta tags

**Dependencies Added:**
- `satori` — JSX to SVG renderer
- `sharp` — Image processing (SVG to PNG)

**Verification:**
- Test with [opengraph.dev](https://opengraph.dev) or Facebook Sharing Debugger
- Check that og:image meta tag points to `https://crimehotspots.com/og-images/murder-count.png`

**Status:** ✅ Complete - Ready for production

---

### Murder Count Page Performance Optimization (Jan 28, 2026)

**Context:** Cloudflare Speed reported 16 requests with 2 poor + 1 needs-improvement scores on `/trinidad/murder-count/` (Chrome mobile). Root cause: Page loaded resources it doesn't use.

**Problem Resources:**
1. **Turnstile CAPTCHA script** — Hardcoded in Layout.astro, only needed on report forms
2. **Pagefind search JS + CSS** — Loaded by default, not needed on this page

**Implementation:**

**1. Turnstile Made Opt-In:**
- Added `includeTurnstile?: boolean` prop to Layout.astro (defaults to `false`)
- Wrapped Turnstile `<script>` in conditional: `{includeTurnstile && (...)}`
- Added `includeTurnstile={true}` to 5 pages that need it:
  - `src/pages/report.astro`
  - `src/pages/trinidad/headlines.astro`
  - `src/pages/trinidad/dashboard.astro`
  - `src/pages/trinidad/archive/[year]/[month].astro`
  - `src/pages/trinidad/crime/[slug].astro`

**2. Pagefind Disabled on Murder Count:**
- Added `includePagefind={false}` to murder-count.astro Layout call

**Impact:**
- Eliminates 3 unnecessary HTTP requests
- Removes ~60-80KB of unused JS (Turnstile + Pagefind)
- Should fix the 2 poor Cloudflare Speed scores
- Bonus: All other pages without crime modals (about, privacy, faq, etc.) no longer load Turnstile

**Files Modified:**
- `src/layouts/Layout.astro` — Added `includeTurnstile` prop
- `src/pages/trinidad/murder-count.astro` — Added `includePagefind={false}`
- 5 pages above — Added `includeTurnstile={true}`

**Status:** ✅ Complete - Ready for production

---

### Murder Count 2026 Page (Jan 22, 2026)

**Context:** Need a mobile-first, SEO-optimized page to rank for "how many murders in trinidad 2026" searches. Trinidad audience is 88% mobile.

**Implementation:**
- **URL:** `/trinidad/murder-count/`
- **iOS-style flip counter** with split-flap animation
  - Animates from 0 to current count on page load
  - Staggered digit flipping (80ms delay between digits)
  - 3D perspective transforms for depth effect
- **Responsive scaling** - Counter auto-shrinks for 3+ digits
  - 2 digits: 120×180px (mobile), 200×300px (desktop)
  - 3-4 digits: 80×120px (mobile), 140×210px (desktop)
- **Share buttons** - WhatsApp, Facebook, X/Twitter, Copy Link
  - Dynamic share text includes current count
  - "Link copied!" feedback on copy
- **Build-time "Updated" date** - Shows when data was fetched, not latest crime date

**SEO:**
- Title: "Trinidad Murder Count 2026 - Live Statistics | Crime Hotspots"
- JSON-LD structured data (WebPage + BreadcrumbList schema)
- Open Graph and Twitter Card meta tags (via Layout)

**Files Created:**
- `src/pages/trinidad/murder-count.astro` - Main page
- `src/components/FlipCounter.astro` - Reusable counter component
- `src/styles/flip-counter.css` - Split-flap animations
- `src/scripts/flipCounter.ts` - Animation logic (optional module)

**Key Technical Details:**
- Counter uses CSS `line-height` clipping for split-digit effect (top half shows top of number, bottom half shows bottom)
- `data-digits` attribute enables CSS-based responsive scaling
- Share URLs use `encodeURIComponent()` for proper encoding
- Build timestamp via `new Date()` at SSG time

**Status:** ✅ Complete - Ready for production

---

### Phase 1 SEO Optimizations: Statistics & Internal Linking (Jan 23, 2026)

**Context:** Google Search Console data (Jan 21-23) showed viral spike (263 clicks vs 2-14/day avg) driven by Isaiah Jules incident. Statistics pages ranking poorly (positions 55-88) for high-value queries like "trinidad crime statistics" and "trinidad crime rate". New pages created Jan 22 (Statistics, Murder Count) needed optimization BEFORE Google indexing.

**Viral Spike Data:**
- Jan 21: 263 clicks (10,800% increase), 29.06% CTR, position 4.7 avg
- Isaiah Jules page: 252 clicks, 44% CTR, position 2.85
- Proved strategy: Full names + specific locations + fast publishing = Top 3 rankings

**Implementation:**

**1. Statistics Page Three-Tier Crime Rate System**
- **Previous Year Final** (2025) - Official crime rates with complete data
  - Murder rate, robbery rate, assault rate per 100,000 population
  - Based on 1.5 million Trinidad population
- **Current Year Progress** (2026 YTD) - Current crime rates as of today
  - Live rates updated daily via GitHub Actions rebuild (6 AM UTC)
  - Shows partial-year progress without misleading projections
- **Current Year Projected** (2026 At Current Pace) - Annual projections
  - Calculation: `(currentCount / daysElapsed) * 365`
  - "If Current Pace Continues" disclaimer
  - Projects end-of-year totals based on YTD data

**2. Dynamic Year Handling (Future-Proofed)**
- All year references now use variables: `currentYear`, `previousYear`
- Auto-calculates from `new Date().getFullYear()`
- Will automatically work for 2027 vs 2026, 2028 vs 2027, etc.
- No manual year updates required after 2026→2027 transition

**3. Murder Count Page Exact Query Optimization**
- **Before:** "Trinidad Murder Count 2026 - Live Statistics"
- **After:** "How Many Murders in Trinidad 2026? Live Murder Count & Statistics"
- Targets exact query: "how many murders in trinidad for 2026" (position 10)
- Added 2025 comparison with YoY percentage change
- Share functionality with WhatsApp, Facebook, X, Copy Link

**4. Internal Linking Network**
- Dashboard → Statistics page ("Crime Statistics & Rate")
- Dashboard → Murder Count page ("Murder Count 2026")
- Statistics page → Dashboard (breadcrumbs)
- Murder Count page → Dashboard (breadcrumbs)
- Murder Count page → Statistics page (All Crime Statistics button)
- Creates discovery paths for Google and users

**5. Mobile Experience Audit (88% of Traffic)**
- Tested on 375x667px viewport (iPhone size) via Playwright
- ✅ Fast load times, smooth map interactions
- ✅ Readable text (16px+), appropriately sized touch targets
- ✅ Responsive layout, functional filters and modals
- ✅ Two-finger map instruction prevents scroll conflicts
- No critical issues found - site fully mobile-optimized

**SEO Optimizations:**
- Statistics page title: "Trinidad Crime Statistics 2026 - Murder, Robbery & Crime Rate"
- Statistics page description: Mentions "crime statistics", "crime rate", "per 100,000"
- Murder count meta updated with projection data
- Structured data (Dataset schema) on statistics page
- Breadcrumbs on all pages for crawlability

**Timing:** Pre-indexing optimization - pages created Jan 22, optimized Jan 23, BEFORE Google indexes (optimal window: 3-7 days)

**Expected Impact:**
- Statistics page: Position 63-72 → Target: Top 10-15 (within 14 days of indexing)
- Murder count page: Position 10 → Target: Top 3-5 (within 7 days of indexing)
- Dashboard: Improved link equity from statistics pages
- Better Google understanding of site authority (news + statistics)

**Key Technical Details:**
- Crime rate formula: `(crimeCount / 1500000) * 100000`
- Days elapsed: `Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24))`
- Projection: `Math.round((crimeCount / daysElapsed) * 365)`
- All calculations dynamic - no hardcoded dates or years
- SSG at build time - 100% static HTML for Google

**Key Learnings:**
- Optimize pages BEFORE Google indexes them (perfect timing window)
- Three-tier metrics address multiple search intents (official vs current vs projected)
- Exact query matching in titles improves rankings faster
- Internal linking creates discovery paths and distributes link equity
- Dynamic year handling eliminates future maintenance

**Files:**
- `src/pages/trinidad/statistics.astro` - Three-tier system, dynamic years
- `src/pages/trinidad/murder-count.astro` - Title optimization, 2025 comparison
- `src/pages/trinidad/dashboard.astro` - Related Resources section
- `docs/guides/BECOME-THE-HUB-Action-Plan.md` - Updated with viral spike data

**Status:** ✅ Complete - Built and deployed, awaiting Google indexing (3-7 days)

---

### Related Crime Pills Display & CSV Parsing Fix (Jan 10, 2026)

**Context:** 2026 victim count system tracks multi-crime incidents (primary + related crimes). Related crimes were stored in data but not displayed to users.

**Implementation:**
- **Crime Pages Display:** Added visual pills for related crimes next to primary crime type
  - Primary crime: Rose-600 pill (existing)
  - Related crimes: Gray (slate-300) pills
  - Only renders when `crime.relatedCrimeTypes` exists and isn't blank
  - Auto-parses comma-separated values
- **Modal Display:** Extended CrimeDetailModal to show same pill pattern
  - Modified metadata display logic (lines 134-148)
  - No changes to form/Turnstile functionality

**CSV Parsing Bug Fix:**
- **Problem:** Area aliases with commas (e.g., `"La Horquetta, Wallerfield"`) were split incorrectly
  - CSV splitting on commas broke quoted fields
  - Smart quotes (`"`) from Google Sheets displayed as `"name`
- **Solution:** Added proper CSV parser to `areaAliases.ts`
  - `parseCSVLine()` - Respects quoted fields containing commas
  - `stripQuotes()` - Removes both regular and smart quotes (Unicode \u201C, \u201D)
  - Preserves full multi-area names

**Critical Rules:**
- Related crimes display is automatic - no manual configuration needed
- CSV data must wrap comma-separated values in quotes: `"Area 1, Area 2"`
- Victim count applies ONLY to primary crime (related crimes always +1)

**Files:** `src/pages/trinidad/crime/[slug].astro`, `src/components/CrimeDetailModal.astro`, `src/lib/areaAliases.ts`, `src/components/AreaNameTooltip.astro`

**Status:** ✅ Complete - Ready for production

---

### Report Page Refactoring & Issue Reporting Fixes (Jan 9, 2026)

**Problem:** Report page was 672 lines with inline utilities. Issue reporting emails showed "undefined" for crime fields. Turnstile widget had explicit rendering errors.

**Solution:**
- **Code Organization:** Extracted utilities into reusable TypeScript modules
  - `src/utils/formHelpers.ts` (165 lines) - generateId(), cleanAreaName(), getValidatedLocalStorage(), validateHoneypot(), RateLimiter class
  - `src/utils/reportValidation.ts` (146 lines) - validateForm(), validateDate(), validateHeadline(), validateDetails(), validateCountry(), validateCrimeType()
  - Reduced report.astro from 672→522 lines (22% reduction)
- **Issue Reporting UX:** Added "Report Issue" button to CrimeDetailModal
  - Users can now report issues directly from headlines modal without navigation
  - Accessible from both individual crime pages and headlines modal
- **Backend Fixes:** Updated Google Apps Script to handle issue reports correctly
  - Fixed field mapping for crime-issue reportType
  - Issue reports save to separate "Issue Reports" sheet
  - Email formatting shows all crime details (no more "undefined" values)
- **Turnstile Fix:** Resolved explicit rendering mode error 600010
  - Cannot mix data attributes with render() function in explicit mode
  - Solution: Empty div + full render() config (no data attributes)

**Key Learnings:**
- Utility extraction improves code reusability and testability
- Report page utilities can now be used in other forms
- Explicit Turnstile rendering requires choosing ONE approach (data attributes OR render config, not both)
- Modal-based issue reporting improves UX by keeping users in context

**Benefits:**
- ✅ Cleaner code - report.astro 150 lines shorter
- ✅ Reusable - Utilities can be used in other forms
- ✅ Testable - Functions can be unit tested independently
- ✅ Maintainable - Validation logic centralized
- ✅ Type-safe - Full TypeScript support
- ✅ Better UX - Issue reporting accessible from headlines modal

**Files:** `src/utils/formHelpers.ts`, `src/utils/reportValidation.ts`, `report.astro`, `CrimeDetailModal.astro`, `ReportIssueModal.astro`, `google-apps-script/reports-page-Code.gs`

**Status:** ✅ Complete - Deployed to production

---

### Report Issue Modal Debugging & Fixes (Jan 9, 2026)

**Problem:** After refactoring, Report Issue buttons stopped working in all contexts:
- Individual crime pages: Button visible but clicking did nothing
- Headlines modal: "Report Issue with This Crime" button non-functional
- Unwanted buttons appearing on ALL pages (homepage, dashboard, blog)
- Console errors: "Unexpected identifier 'as'" (TypeScript syntax errors)
- Google Apps Script: "Cannot read properties of undefined (reading 'crimeType')"

**Root Causes:**
1. **Duplicate ID conflicts** - Component included twice on same page without unique IDs
2. **TypeScript syntax in browser JavaScript** - Type assertions (`as Type`) not allowed in `<script define:vars>`
3. **DOM not ready** - Event listeners attached before elements existed (missing DOMContentLoaded)
4. **Unconditional button rendering** - Component rendered button by default
5. **Multiple Apps Script deployments** - Old and new versions causing confusion
6. **Hardcoded URLs** - Apps Script URL duplicated in 3+ files

**Solutions Implemented:**
1. **ID Prefix System:**
   ```typescript
   interface Props {
     idPrefix?: string; // Unique prefix for IDs
     showButton?: boolean; // Control button rendering
   }
   ```
   - CrimeDetailModal: `idPrefix="modal"`, `showButton={false}`
   - Individual pages: `idPrefix=""`, `showButton={true}`
   - Result: `modalreportIssueBtn` vs `reportIssueBtn` (unique)

2. **Removed ALL TypeScript Syntax:**
   ```javascript
   // ❌ BEFORE: const form = document.getElementById('form') as HTMLFormElement;
   // ✅ AFTER: const form = document.getElementById('form');
   ```

3. **DOMContentLoaded Wrapper:**
   ```javascript
   document.addEventListener('DOMContentLoaded', () => {
     // All event listener code here
   });
   ```

4. **Conditional Button Rendering:**
   ```astro
   {showButton && <button>Report Issue</button>}
   ```

5. **Centralized Apps Script URL:**
   - Single source of truth: `src/data/countries.ts` exports `APPS_SCRIPT_URL`
   - All components import from there
   - Easy to update in one place

6. **Custom Event System for Turnstile:**
   - CrimeDetailModal dispatches `openReportIssueModal` event
   - ReportIssueModal listens and renders Turnstile widget
   - Avoids clicking non-existent buttons

7. **Added Error Handling & Logging:**
   - Validate form fields exist before setting values
   - Console logging at each step for debugging
   - Try-catch blocks around critical operations

8. **Google Apps Script Test Functions:**
   ```javascript
   function testIssueReport() { /* test data */ }
   function testCrimeReport() { /* test data */ }
   ```
   - Test backend without frontend/Turnstile

**Key Learnings:**
- **Component reusability requires planning** - Add `idPrefix` for any component with IDs
- **Astro script contexts matter** - TypeScript only in server-side `<script>` blocks
- **Always use DOMContentLoaded** - Never assume DOM is ready
- **Centralize configuration** - One source of truth for URLs/constants
- **Test each layer separately** - Backend, frontend, integration
- **Console logging is essential** - Strategic logging identifies failure points quickly
- **Validate assumptions** - Check elements exist before using them

**Best Practices Documented:**
- ✅ Component development patterns (props, IDs, conditional rendering)
- ✅ JavaScript in Astro rules (TypeScript vs plain JS)
- ✅ Configuration management (centralized exports)
- ✅ Google Apps Script integration patterns
- ✅ Debugging process checklist
- ✅ Testing checklist for report modals

**Files:** `ReportIssueModal.astro`, `CrimeDetailModal.astro`, `[slug].astro`, `countries.ts`, `reports-page-Code.gs`

**Documentation:** `docs/troubleshooting/REPORT-MODAL-DEBUGGING-2026-01.md` (comprehensive guide)

**Testing Results:**
- ✅ Individual crime pages - Report Issue button works
- ✅ Headlines modal - "Report Issue with This Crime" works
- ✅ Standalone report page - Form submissions succeed
- ✅ Buttons appear ONLY where intended
- ✅ Google Apps Script tests pass (testIssueReport, testCrimeReport)
- ✅ Email notifications received correctly
- ✅ Data saves to Google Sheets properly

**Status:** ✅ Complete - All three contexts working in production

---

### Component Audit & Cleanup (Jan 9, 2026)

**Problem:** Unused components creating maintenance overhead.

**Solution:**
- Audited all 21 components in codebase
- Archived TextInfoPopup.astro to `src/components/archive/` (replaced by InfoPopup.astro)
- Verified 20/21 components actively in use across the site

**Active Components:**
1. ArchivesModal, AreaNameTooltip, BlogRotatingBanner, Breadcrumbs, CrimeCard
2. CrimeDetailModal, DashboardInfoCards, DashboardModal, DateAccordion, FiltersTray
3. Header, HeadlinesModal, InfoPopup, LoadingShimmer, QuickInsightsCard
4. ReportIssueModal, SearchModal, SiteNotificationBanner, StatCard, TopRegionsCard

**Key Learnings:**
- Regular component audits prevent bloat
- Archive pattern preserves history without cluttering active codebase

**Files:** `src/components/archive/TextInfoPopup.astro`

**Status:** ✅ Complete

---

### Automated Cloudflare Pages Deployment (Jan 8, 2026)

**Problem:** Headlines not updating on live site despite local dev working correctly. Scheduled GitHub Actions builds ran daily but didn't trigger Cloudflare Pages deployments.

**Solution:**
- Integrated Cloudflare API deployment trigger into GitHub Actions workflow
- Deployment now triggered on: push to main, scheduled (6 AM UTC), manual workflow_dispatch
- Uses GitHub secrets for credentials (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_PROJECT_NAME)
- Ensures live site fetches fresh CSV data automatically

**Key Learnings:**
- Cloudflare Pages only rebuilds on git push by default - scheduled builds need explicit API trigger
- Three deployment methods ensure resilience: commit-based, scheduled, manual
- API deployment step only runs after successful build validation

**Files:** `.github/workflows/deploy.yml`

**Status:** ✅ Complete - Live site now updates automatically daily

---

### Traffic Analysis & SEO Foundation (Jan 5, 2026)

**Problem:** Cloudflare showed 524 "visitors/day" but GA4 showed only ~4 real humans. Needed organic growth foundation.

**Solution:**
- Analyzed traffic composition: 99% bots (search engines + malicious scrapers)
- Bot Fight Mode blocking 1,150 malicious requests/day automatically
- Google Search Console setup: 1,728 pages discovered, sitemap submitted
- Zero-budget social media growth strategy planned (Reddit, Facebook groups, X tagging)

**Key Learnings:**
- Bot traffic is normal for large sites - use GA4/Web Analytics for real human count
- Google Search Console is foundation for ALL organic traffic growth
- Expected SEO timeline: 2-3 weeks for first organic visitors, 2-3 months for 10-20/day

**Status:** ✅ Complete - Sitemap submitted, social strategy ready for execution

---

### Automation Scripts: 2026 Crime Format & Victim Count (Jan 5, 2026)

**Problem:** Google Apps Script automation using 2025 format. Needed updates for 2026 primaryCrimeType + relatedCrimeTypes + victim count multipliers.

**Solution:**
- Updated blogDataGenerator.gs and socialMediaStats.gs for 2026 format
- Added CRIME_TYPE_CONFIG for victim count multipliers
- Backward compatible with 2025 data (falls back to Crime Type field)
- Victim count for primary crimes only (related crimes always +1)

**Key Learnings:**
- Victim count prevents double-counting when applied to primary only
- Configuration-based approach allows easy enable/disable per crime type
- Incidents (rows) vs crime type counts (with multipliers) are different metrics

**Files:** `blogDataGenerator.gs`, `socialMediaStats.gs`

**Status:** ✅ Complete - Both scripts updated and tested

---

### LCP Performance Optimization & Map Modal UX (Jan 4, 2026)

**Problem:** LCP at 2035ms on homepage. Map marker popups navigated away from dashboard.

**Solution:**
- Conditional resource loading: Leaflet only loads on map pages (~150KB savings)
- Image optimization: Trinidad PNG→JPG (75KB→41KB, 45% reduction)
- Resource hints: dns-prefetch, preconnect for fonts
- Non-blocking CSS loading with media="print" onload trick
- Map modal UX: View Details opens modal instead of navigating

**Key Learnings:**
- Conditional loading saves massive bandwidth - props-based resource control is key
- Image format matters for LCP - fetchpriority="high" signals browser
- Modal UX keeps users in context - preserves dashboard state

**Performance Impact:** ~500-900ms reduction, ~184KB saved

**Files:** `Layout.astro`, `index.astro`, `methodology.astro`, `dashboard.astro`, `leafletMap.ts`, `CrimeDetailModal.astro`

**Status:** ✅ Complete - Deployed to production

---

### Area Tooltips: Dashboard Integration & Mobile Fix (Jan 3, 2026)

**Problem:** Dashboard Top Areas showed official names without local aliases. Mobile tooltips had viewport overflow and click flash bugs.

**Solution:**
- AreaNameTooltip component added to Top Areas card (server + client-side)
- Viewport boundary detection with 8px padding, dynamic arrow positioning
- Fixed duplicate event listeners with data-tooltip-initialized flag
- Simplified click logic: tap shows, tap outside hides (no toggle state)

**Key Learnings:**
- Portal pattern essential - append to document.body with position:fixed escapes overflow
- Prevent duplicate listeners with data attributes when functions run multiple times
- Simpler is better - complex toggle logic causes timing issues

**Files:** `TopRegionsCard.astro`, `dashboardUpdates.ts`, `AreaNameTooltip.astro`

**Status:** ✅ Complete

---

### Headlines Date Accordion & Victim Count Display (Jan 3, 2026)

**Problem:** Headlines showed flat crime list with no date grouping. Accordion headers emphasized incident count over human impact.

**Solution:**
- DateAccordion component groups crimes by date (chronological organization)
- Smart display modes: Accordions when no filters, flat grid when filtering
- Replaced "X crimes" with "X victims" in accordion headers
- Uses victimCount field (2026+), defaults to 1 for backward compatibility

**Key Learnings:**
- Accordion grouping improves UX for chronological scanning
- Context-aware UI modes - accordions for browsing, grid for searching
- Victim count emphasizes impact over incident statistics

**Files:** `DateAccordion.astro`, `headlines.astro`

**Status:** ✅ Complete

---

### Victim Count System & Manual Workflow Transition (Jan 1, 2026)

**Problem:** Double/triple murders counted as single incidents. Gemini AI automation quota limits and accuracy issues.

**Solution:**
- Added victimCount field to crime schema
- Configurable per crime type in crimeTypeConfig.ts
- Critical rule: Victim count ONLY applies to PRIMARY crime (related always +1)
- Retired Gemini automation, transitioned to manual Google Form entry
- Updated frontend CSV parser and dashboard counting logic

**Key Learnings:**
- Automation isn't always better - manual entry provides complete data control
- Primary vs related distinction prevents double-counting
- Configuration > hardcoding for crime type settings

**Files:** `crimeTypeConfig.ts`, `crimeData.ts`, `dashboardUpdates.ts`

**Status:** ✅ Complete - System active Jan 1, 2026

---

### Social Media Stats Triple-Mode System (Jan 1, 2026)

**Problem:** Date range calculations off by 1 day (midnight vs end-of-day), timezone issues, no monthly/custom stats support.

**Solution:**
- Fixed date boundaries to use noon (12:00) instead of midnight (prevents timezone edge cases)
- Three modes: Daily (3-day lag), Monthly (no lag), Custom (manual date range)
- Added UI prompt functions with validation
- Optional automation triggers for daily/monthly stats

**Key Learnings:**
- Midnight boundaries cause timezone bugs - noon prevents off-by-1-day errors
- End-of-day means 23:59:59, not 00:00:00
- Reporting lag must account for COMPLETE days in data

**Files:** `socialMediaStats.gs`

**Status:** ✅ Complete

---

### Site Notification Banner & 2026 Crime Type System (Dec 28, 2025)

**Problem:** Need user notifications for 2025 data updates. Need better crime tracking for 2026 (avoiding duplicate rows).

**Solution:**
- Toggle-based notification system (siteNotifications.ts)
- Dismissible banner with localStorage persistence
- 2026 primary + related crime types (one incident = one row)
- Column header mapping for CSV resilience
- Frontend countCrimeType helper counts across primary + related fields

**Key Learnings:**
- Toggle-based notifications user-friendly - single config controls site-wide
- Backward compatibility critical - keeping old crimeType column prevents breakage
- Column header mapping prevents breakage from reordering

**Files:** `siteNotifications.ts`, `SiteNotificationBanner.astro`, `crimeTypeProcessor.gs`, `crimeData.ts`, `dashboardUpdates.ts`

**Status:** ✅ Complete - Ready for Jan 1, 2026 launch

---

## December 2025 Features

### Dashboard Trend Indicators + Modal Navigation (Dec 26, 2025)

**Problem:** No trend context for crime statistics. Page navigation wasted user time.

**Solution:**
- 30-day trend comparisons on all stat cards (last 30 vs previous 30 days)
- 3-day lag offset prevents incomplete data comparison
- HeadlinesModal and ArchivesModal for instant island selection
- Monthly archive redesign with dashboard-style insights
- Cloudflare Turnstile CAPTCHA integration (invisible mode)

**Key Learnings:**
- 3-day lag critical - crimes posted with crime date, not report date
- Modal-first navigation saves page loads, improves mobile UX
- Invisible Turnstile requires 1.5s wait for async token generation

**Files:** Dashboard stat cards, HeadlinesModal, ArchivesModal, ReportIssueModal

**Status:** ✅ Complete

### Site-Wide Search (Dec 27, 2025)

**Problem:** No way to search 1,700+ pages. Search index showing unwanted UI content (modals, footers).

**Solution:**
- Pagefind static search with WebAssembly (1,584 crime pages indexed)
- SearchModal with Ctrl+K shortcut, frosted glass design
- data-pagefind-ignore on all modals, headers, footers
- Manual CLI approach (npx pagefind --site dist) for reliable production builds

**Key Learnings:**
- Astro integrations may not run on all platforms - manual CLI more reliable
- data-pagefind-body required to mark indexable content
- Clean search results require aggressive data-pagefind-ignore tagging

**Files:** `SearchModal.astro`, `Layout.astro`, `astro.config.mjs`

**Status:** ✅ Complete

---

### Dashboard UX & Loading States (Dec 23, 2025)

**Problem:** No loading feedback, jarring layout shifts, no user issue reporting.

**Solution:**
- InfoPopup component for click-based help tooltips (modal overlay)
- LoadingShimmer component (Facebook-style, 500ms minimum display)
- ReportIssueModal for user-submitted corrections
- Map touch controls (two-finger pan, smart hints)
- Changed "regions" to "areas" (culturally accurate)

**Key Learnings:**
- Fixed-height containers prevent CLS (Stats: 140px, Map: 600px, Insights: 400px)
- Shimmer display:none → opacity:0 prevents layout reflows
- Two-finger pan requirement improves mobile scrolling

**Files:** `InfoPopup.astro`, `LoadingShimmer.astro`, `ReportIssueModal.astro`, `TopAreasCard.astro`

**Status:** ✅ Complete

---

### Dashboard Refactoring & Clickable Stat Cards (Dec 23, 2025)

**Problem:** Dashboard at 876 lines, no quick crime type filtering.

**Solution:**
- Extracted scripts: statCardFiltering.ts (200 lines), dashboardUpdates.ts (160 lines)
- Reduced dashboard to 592 lines (32% reduction)
- Clickable stat cards for one-click filtering with tray sync
- Zero CLS with fixed-height containers and absolute positioning

**Key Learnings:**
- Reusable scripts improve maintainability across multiple dashboards
- Clickable cards + auto-scroll improves mobile UX significantly
- Fixed heights + opacity transitions = zero layout shift

**Files:** `dashboard.astro`, `statCardFiltering.ts`, `dashboardUpdates.ts`

**Status:** ✅ Complete

### Year Filter System (Dec 18, 2025)

**Problem:** Loading all years simultaneously caused performance issues and year detection confusion.

**Solution:**
- Default to current year on load (auto-detected from highest year in dataset)
- Year filter dropdown in filter tray (specific years or "All Years")
- Smart data loading prevents duplicate fetching when URLs point to same sheet
- Synchronized CSV URLs across crimeData.ts (server) and dashboard.astro (client)

**Key Learnings:**
- CSV URL sync critical - prevents duplicate loading, flash effect, wrong year display
- Must update both server and client-side fetchers when changing data sources

**Files:** `crimeData.ts`, `dashboard.astro`, `headlines.astro`, `yearFilter.ts`

**Status:** ✅ Complete

---

### Dashboard Refactoring (Dec 19, 2025)

**Problem:** Dashboard at 1,011 lines, code duplication across widgets.

**Solution:**
- Extracted reusable scripts: yearFilter.ts (159 lines), leafletMap.ts (287 lines), statsScroll.ts (33 lines)
- Created FiltersTray component (87 lines)
- Reduced dashboard to 579 lines (43% reduction)

**Key Learnings:**
- Reusable scripts enable consistent behavior across multiple dashboards
- ES6 imports in Astro require proper module structure

**Files:** `dashboard.astro`, `yearFilter.ts`, `leafletMap.ts`, `statsScroll.ts`, `FiltersTray.astro`

**Status:** ✅ Complete

---

### Enhanced Duplicate Detection & Seizures Crime Type (Dec 3, 2025)

**Problems:**
- Duplicates slipping through when crimes archived from Production to Production Archive
- Gun/ammunition seizures incorrectly classified as "Theft"

**Solutions:**
- Enhanced duplicate detection checks both Production + Archive sheets
- Added "Seizures" crime type for police enforcement actions

**Documentation:** `docs/automation/DUPLICATE-DETECTION-ARCHIVE.md`, `docs/automation/SEIZURES-CRIME-TYPE.md`

**Files:** `processor.gs`, `geminiClient.gs`

**Status:** ✅ Complete
