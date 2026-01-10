# Recent Features (December 2025 - January 2026)

**For:** Complete details of recently implemented features

**Last Updated:** January 10, 2026

**Note:** Features older than 90 days are archived to `docs/archive/accomplishments/`

---

## January 2026 Features

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
