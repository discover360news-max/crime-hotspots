# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Crime Hotspots is a web-based data visualization platform for Caribbean crime statistics. The application displays crime data dashboards, headlines, and provides anonymous crime reporting functionality.

**Current Status:** ✅ Production - Trinidad & Tobago LIVE (Astro-powered)
**Live Site:** https://crimehotspots.com
**Framework:** Astro 5.16.5 (migrated from Vite, December 16, 2025)
**Focus:** Trinidad-only implementation (Other islands expansion deferred)
**Last Updated:** January 5, 2026 (Blog banner & headlines timeline UX improvements)

---

## Recent Accomplishments

### January 5, 2026 - Blog Banner & Headlines Timeline UX

**Problem Solved:**
Need to drive traffic to blog content and improve visual hierarchy on Headlines page to show relationship between dates and crime incidents.

**Accomplishments:**
1. **Blog Rotating Banner Component** ✅
   - Created reusable `BlogRotatingBanner.astro` component
   - Auto-rotates through latest 3 blog posts (5-second intervals)
   - Smooth slide-up animation with fade effect
   - Country-filtered (shows only Trinidad blog posts on Trinidad pages)
   - Links to main blog page on click
   - **Design:** Horn/megaphone icon, red text (rose-600), 1px rose border, frosted glass background
   - **Mobile optimized:** Half height on mobile (`py-1` vs `py-2`, smaller icons/text)
   - Added to Trinidad Headlines page above accordion section

2. **Headlines Timeline Visual** ✅
   - Added vertical timeline to mobile accordion view (hidden on desktop grid)
   - **Visual design:** Subtle dotted line (slate-300) with small filled red dots (rose-600, 6px)
   - **Positioning:** Dots centered on line, positioned at top of each crime card
   - **Smart display modes:**
     - Mobile/tablet: Single column with timeline when accordion expanded
     - Desktop: Multi-column grid view (no timeline)
   - Shows hierarchical relationship between date header and crime incidents

**Key Learnings:**
- **Auto-rotation enhances discoverability** - Cycling blog titles increases visibility without user interaction
- **Timeline improves visual hierarchy** - Dotted line + dots clearly connect date header to child crimes
- **Mobile-first timeline works** - Desktop grid layout doesn't need timeline (visual hierarchy is clear)
- **Component reusability** - BlogRotatingBanner can be added to Dashboard, Archive pages if needed
- **Subtle design wins** - Small dots (6px) + gray line (slate-300) provide structure without overwhelming content

**Design Decisions:**
- **Timeline on mobile only** - Desktop grid layout has clear visual grouping already
- **Dots at card top vs. center** - Top positioning emphasizes chronological ordering
- **Gray line vs. red** - Slate-300 is subtle; red dots provide accent without competing with crime type badges
- **Banner height** - Half height on mobile prevents banner from dominating screen space

**Files Created:**
- `astro-poc/src/components/BlogRotatingBanner.astro` (rotating blog banner component)

**Files Modified:**
- `astro-poc/src/pages/trinidad/headlines.astro` (added banner, timeline view for mobile, dual-mode accordion rendering)

**Status:**
- ✅ Blog rotating banner: Complete and deployed
- ✅ Headlines timeline: Complete on mobile/tablet
- ✅ Mobile optimization: Banner height reduced
- 🔜 Potential expansion: Add banner to Dashboard, Archive pages

---

### January 5, 2026 - Traffic Analysis & SEO Foundation Complete

**Problem Solved:**
Cloudflare Analytics showed 524 "unique visitors" per day, but GA4/Web Analytics showed only ~4 real visitors. Need to understand traffic composition and establish Google Search Console foundation for organic growth.

**Accomplishments:**
1. **Traffic Composition Analysis** ✅
   - **Cloudflare Analytics:** 524 visitors/day (includes ALL traffic - humans + bots)
   - **Cloudflare Web Analytics + GA4:** ~4 real human visitors/day
   - **Bot Fight Mode Analysis:** 1,150 malicious bot requests blocked in 24 hours
   - **Conclusion:** 99% of Cloudflare traffic is bots (search engines + malicious scrapers)
   - Bot Fight Mode working perfectly - protecting site from automated attacks

2. **Google Search Console Setup** ✅
   - Domain verification: Automatic (DNS already configured)
   - Sitemap submission: `https://crimehotspots.com/sitemap-index.xml` + `sitemap-0.xml`
   - **Status:** Success - 1,728 pages discovered by Google (Jan 5, 2026)
   - Includes: 1,300+ crime detail pages, blog posts, dashboard, archives, static pages
   - Expected indexing timeline: 3-5 days for initial crawling, 2-4 weeks for organic traffic to start

3. **Social Media Growth Strategy Planned** ✅
   - **Current state:** Facebook, X (Twitter), Instagram accounts active, posting regularly
   - **Content creation:** Already have `socialMediaStats.gs` automation + branded image generator
   - **Posting stats:** Generating professional 1080x1080px images + text posts weekly
   - **Zero-budget growth plan:** Reddit launch, Facebook groups, X news outlet tagging
   - **Week 1 action plan:** Reddit post (r/TrinidadandTobago), join 3-5 Facebook groups, tag Trinidad news outlets on X

4. **Performance Validation** ✅
   - **Cloudflare Web Analytics:** LCP 534ms (73% improvement from 2035ms)
   - **Core Web Vitals:** 100% Good scores
   - **Page load time:** Avg 534ms (down from 2035ms pre-optimization)
   - Site ready for traffic influx

**Key Learnings:**
- **Bot traffic is normal for large sites** - 1,728 pages attract search engine crawlers (Google, Bing) + malicious scrapers
- **Cloudflare Analytics counts everything** - Use GA4/Web Analytics for real human visitor count
- **Bot Fight Mode is essential** - Blocking 1,150 malicious requests/day automatically
- **Google Search Console is critical** - Foundation for ALL organic traffic growth
- **Content creation infrastructure exists** - Already have automation, just need distribution
- **Zero budget growth is possible** - Reddit, Facebook groups, news outlet tagging all free

**Traffic Analysis Breakdown:**
- **Total requests (24h):** 3,680
- **Verified search engine crawlers:** 166 (Google, Bing, etc.)
- **Malicious bots blocked:** 1,150 (AWS/Azure/datacenter IPs)
- **Real human visitors:** ~4 per day
- **Bot Fight Mode success rate:** 100% mitigation

**SEO Timeline (Expected):**
- **Week 1 (Jan 6-12):** Google crawlers start visiting pages
- **Week 2-3 (Jan 13-24):** First pages appear in search results, 1-5 organic visitors/day
- **Month 2-3 (Feb-Mar):** Google traffic grows to 10-20 organic visitors/day
- **Goal by March:** 50-100 real visitors/day (combined SEO + social media)

**Social Media Accounts:**
- ✅ Facebook: Active (Crime Hotspots page)
- ✅ X (Twitter): Active (@crimehotspots_tt)
- ✅ Instagram: Active (1 follower, posting weekly stats)
- **Content workflow:** Google Apps Script generates stats → Image generator creates branded PNG → Post to all platforms

**Next Steps (Week of Jan 6-12):**
1. **Monday:** Generate weekly stats via `generateDailyStats()`, create branded image
2. **Tuesday:** Reddit launch post to r/TrinidadandTobago
3. **Wednesday:** Join 3-5 Trinidad Facebook groups (Crime Watch, community groups)
4. **Friday:** X post tagging Trinidad news outlets (@GuardianTT, @ExpressTT, @Newsday_TT)

**Files/Tools Involved:**
- `google-apps-script/trinidad/socialMediaStats.gs` (stats automation)
- `astro-poc/src/pages/tools/social-image-generator.astro` (image generator)
- Google Search Console (sitemap submission)
- Cloudflare Bot Fight Mode (bot protection)

**Status:**
- ✅ Traffic analysis: Complete
- ✅ Google Search Console: Verified and sitemap submitted (1,728 pages discovered)
- ✅ Bot protection: Working (1,150 blocks/day)
- ✅ Social media strategy: Planned
- ✅ Content creation workflow: Ready
- 🔜 Social media execution: Week of Jan 6-12

---

### January 5, 2026 - Automation Scripts Updated for 2026 Crime Format & Victim Count

**Problem Solved:**
Google Apps Script automation files (`blogDataGenerator.gs` and `socialMediaStats.gs`) were using 2025 crime data format. Needed to update for 2026 format (primaryCrimeType + relatedCrimeTypes) and add victim count multiplier support.

**Accomplishments:**
1. **Blog Data Generator Updated** ✅
   - Added `BLOG_CRIME_TYPE_CONFIG` for victim count multipliers
   - Updated `getDetailedAreaBreakdown()` to support 2026 format (primaryCrimeType + relatedCrimeTypes)
   - Added victim count tracking: incidents vs. victims per area
   - Updated `formatBlogData()` to output comprehensive statistics with both incident and victim counts
   - Created helper functions: `calculateTotalVictims()`, `calculateVictimsForCrimeType()`
   - **Result:** Gemini receives complete data for high-quality blog generation

2. **Social Media Stats Updated** ✅
   - Added `SOCIAL_CRIME_TYPE_CONFIG` for victim count multipliers
   - Updated `countByCrimeType()` to apply victim multipliers for primary crimes
   - **Crime type counts now reflect victims** (e.g., double murder = +2 for Murder count)
   - **Incident counts remain row-based** (total incidents stays accurate)
   - Backward compatible with 2025 data

3. **Victim Count Configuration** ✅
   - Configurable per crime type (easy to update)
   - **Enabled for:** Murder, Assault, Sexual Assault, Kidnapping, Robbery, Shooting
   - **Disabled for:** Burglary, Home Invasion, Seizures, Theft
   - Primary crimes use multiplier, related crimes always +1

**Key Learnings:**
- **Victim count for primary crimes only** - Related crimes always count as +1 to prevent double-counting
- **Configuration-based approach** - Easy to enable/disable victim count for any crime type
- **Backward compatibility essential** - Falls back to 2025 `Crime Type` field when new fields missing
- **Incidents vs. crime type counts** - Total incidents (rows) vs. crime type totals (with multipliers) are different metrics

**Example Impact:**
```
2026 Data Row: Murder (victimCount=3) + Shooting (related)

Results:
- Total Incidents: +1 (one row)
- Murder count: +3 (victim multiplier)
- Shooting count: +1 (related, no multiplier)

Social Media Post:
"📊 Total: 45 incidents this week
• Murder: 12 (+4, ↑50%)  ← victim count, not incident count
• Shooting: 10 (-1, ↓9%)"
```

**Files Modified:**
- `google-apps-script/trinidad/blogDataGenerator.gs` (crime type config, area breakdown, output formatting, victim calculation helpers)
- `google-apps-script/trinidad/socialMediaStats.gs` (crime type config, countByCrimeType function)

**Status:**
- ✅ Blog data generator: Updated for 2026 format + victim count
- ✅ Social media stats: Updated for 2026 format + victim count
- ✅ Backward compatibility: Both scripts work with 2025 data
- ✅ Configuration system: Easy to update which crimes use victim count

---

### January 4, 2026 - LCP Performance Optimization & Map Modal UX

**Problem Solved:**
Cloudflare Analytics showed LCP (Largest Contentful Paint) at 2035ms on homepage and methodology pages. Goal was to reduce page load to under 1 second through aggressive optimization. Additionally, map marker popups navigated away from dashboard, disrupting user workflow.

**Accomplishments:**
1. **Conditional Resource Loading System** ✅
   - Created `includeLeaflet` and `includePagefind` props in Layout.astro (default: false/true)
   - Leaflet CSS/JS now only loads on pages with maps (~150KB savings on non-map pages)
   - Homepage and methodology pages load without unnecessary map libraries
   - Dashboard explicitly enables Leaflet with `includeLeaflet={true}`

2. **Image Optimization** ✅
   - Converted Trinidad country card image from PNG (75KB) to JPG (41KB) - **45% reduction (34KB savings)**
   - Added `fetchpriority="high"` to Trinidad image (LCP element)
   - Added `loading="eager"` for above-fold Trinidad card
   - Other country cards use `loading="lazy"` for performance

3. **Resource Hints & Font Optimization** ✅
   - Added `dns-prefetch` for fonts.googleapis.com, fonts.gstatic.com, cloudflareinsights.com
   - Added `preconnect` for Google Fonts domains with crossorigin
   - Implemented non-blocking font loading with `preload` + `onload` trick
   - Noscript fallback ensures fonts load even without JavaScript

4. **Non-blocking CSS Loading** ✅
   - Leaflet CSS files load with `media="print" onload="this.media='all'"` pattern
   - Prevents render-blocking on map pages while ensuring styles apply when ready
   - Applied to all 4 Leaflet stylesheets (leaflet.css, markercluster, fullscreen)

5. **Map Modal UX Enhancement** ✅
   - Changed map marker popup "View Details" from navigation link to modal
   - Styled button with red border (`border border-rose-600`) matching site theme
   - Added `window.openCrimeDetailModal(slug)` function to CrimeDetailModal.astro
   - Function retrieves crime from `window.__crimesData` and opens modal overlay
   - Users stay on dashboard when viewing crime details

6. **Footer Search Button Mobile Layout** ✅
   - Right-aligned footer search button on mobile while keeping inline with social icons
   - Solution: Made Social section `col-span-2` on mobile with `justify-between` flex
   - Social icons on left, search button on right, same row
   - Hidden on desktop (`md:hidden`) where header search is available

**Key Learnings:**
- **Conditional loading saves massive bandwidth** - 150KB+ savings on non-map pages by only loading Leaflet where needed
- **Props-based resource control** - Layout component props allow per-page optimization without code duplication
- **Image format matters for LCP** - Converting PNG to JPG saved 34KB on critical LCP element
- **fetchpriority="high" signals browser** - Explicit priority hints improve LCP timing
- **Non-blocking CSS pattern** - `media="print" onload="this.media='all'"` loads CSS without blocking render
- **Preload + preconnect = faster fonts** - Resource hints + preload reduce font loading waterfall
- **Default prop values prevent breakage** - `includeLeaflet={false}` default means pages work without explicit prop
- **Modal UX keeps users in context** - Opening modal instead of navigating preserves dashboard state
- **Global variable naming matters** - Must use exact variable name (`window.__crimesData`, not `__allCrimes`)
- **Flexbox justify-between + col-span** - Keeps elements inline while positioning left/right on mobile

**Bugs Encountered & Fixed:**
1. **Dashboard Map Tiles Misaligned**
   - **Cause:** Dashboard didn't request Leaflet CSS after implementing conditional loading
   - **Fix:** Added `includeLeaflet={true}` to dashboard.astro line 43

2. **Modal Function Not Found**
   - **Cause:** CrimeDetailModal only exposed `openCrimeModal(crime)`, but map called `openCrimeDetailModal(slug)`
   - **Fix:** Added new function that retrieves crime by slug from `window.__crimesData`

3. **Wrong Global Variable Name**
   - **Cause:** Initially used `window.__allCrimes` instead of `window.__crimesData`
   - **Fix:** Verified dashboardDataLoader.ts sets `__crimesData` and corrected reference

4. **Footer Search Button Position** (3 iterations)
   - **Attempt 1:** Added `ml-auto` (pushed too far right, not inline)
   - **Attempt 2:** Created separate div with `justify-end` (not inline with social icons)
   - **Final solution:** Made Social section full-width on mobile with `justify-between` flex

**Performance Impact:**
- **Estimated page load reduction:** 500-900ms on homepage and methodology pages
- **Resource savings:** ~184KB total (150KB Leaflet + 34KB image)
- **LCP improvement:** Smaller image + fetchpriority="high" should significantly reduce LCP
- **Build verification:** 1,700+ pages built successfully with zero errors

**Files Modified:**
- `astro-poc/src/layouts/Layout.astro` (conditional loading, resource hints, fonts, footer)
- `astro-poc/src/pages/index.astro` (disabled Leaflet/Pagefind, optimized image)
- `astro-poc/src/pages/methodology.astro` (disabled Leaflet/Pagefind)
- `astro-poc/src/pages/trinidad/dashboard.astro` (enabled Leaflet)
- `astro-poc/src/scripts/leafletMap.ts` (modal button in popups)
- `astro-poc/src/components/CrimeDetailModal.astro` (slug-based modal opener)
- `astro-poc/src/components/QuickInsightsCard.astro` (minor formatting)

**Status:**
- ✅ Conditional resource loading: Complete and deployed
- ✅ Image optimization: Complete (PNG→JPG conversion)
- ✅ Resource hints & fonts: Complete
- ✅ Map modal UX: Complete and working
- ✅ Footer search button: Complete
- ✅ All bugs fixed: Dashboard map, modal function, footer layout
- ✅ Deployed to production: Commit 61c1ba8

---

### January 3, 2026 - Area Tooltips: Dashboard Integration & Mobile Fix

**Problem Solved:**
Dashboard's "Top Areas" section showed official area names without local aliases. Mobile tooltips had critical bugs: viewport overflow (cut off on left edge) and flash on first click requiring second tap to stay visible.

**Accomplishments:**
1. **Dashboard Top Areas Integration** ✅
   - Added `AreaNameTooltip` component to Top Areas card (server-side)
   - Created `renderAreaName()` helper in `dashboardUpdates.ts` for client-side updates
   - Dispatches `topAreasRendered` event to reinitialize tooltips after year filter changes
   - Tooltips show local names (e.g., "Diego Martin North") for official Google Maps names

2. **Mobile Viewport Boundary Detection** ✅
   - Tooltips now stay within screen bounds with 8px padding
   - Smart repositioning when tooltip would overflow left or right edge
   - **Dynamic arrow positioning** - arrow adjusts to point at trigger even when tooltip shifts
   - Works for both mobile (below) and desktop (above) positioning

3. **Mobile Click Flash Bug Fix** ✅
   - **Root cause 1:** Duplicate event listeners - `initAreaTooltips()` called multiple times added new listeners without removing old ones
   - **Root cause 2:** Complex toggle logic with state management caused race conditions between show/hide
   - **Fix 1:** Added `data-tooltip-initialized` flag to prevent duplicate listener attachment
   - **Fix 2:** Simplified click logic - tap always shows, tap outside hides (no toggle state)
   - **Fix 3:** Proper timeout management with `hideTimeout` variable to prevent state clearing race conditions

**Key Learnings:**
- **Portal pattern is essential** - Appending tooltips to `document.body` with `position: fixed` escapes parent overflow constraints
- **Prevent duplicate listeners** - Use data attributes to track initialization state when functions run multiple times
- **Simpler is better** - Complex toggle logic (if showing, hide; else show) causes timing issues. Better: always show on click, let document handler hide
- **Viewport math matters** - Calculate `leftPos - halfWidth < padding` to detect overflow, adjust position, then recalculate arrow offset
- **Arrow positioning formula** - `arrowOffset = ((triggerCenter - tooltipLeft) / tooltipWidth) * 100` keeps arrow pointing at trigger
- **Timeout cleanup prevents bugs** - Clear pending timeouts before creating new ones to avoid state clearing race conditions
- **Event listener lifecycle** - When dynamically rendering content, either remove old listeners or use flags to prevent duplicate attachment

**Files Modified:**
- `astro-poc/src/components/TopRegionsCard.astro` (added tooltip integration)
- `astro-poc/src/scripts/dashboardUpdates.ts` (renderAreaName helper, topAreasRendered event)
- `astro-poc/src/components/AreaNameTooltip.astro` (viewport detection, duplicate listener prevention, simplified click logic)

**Status:**
- ✅ Dashboard Top Areas tooltips: Complete
- ✅ Mobile viewport overflow: Fixed
- ✅ Mobile click flash bug: Fixed

---

### January 3, 2026 - Headlines Date Accordion & Victim Count Display

**Problem Solved:**
Headlines page showed flat list of crimes with no date grouping, making it hard to scan chronologically. Accordion headers showed redundant crime counts that didn't emphasize human impact.

**Accomplishments:**
1. **Date Accordion Grouping** ✅
   - Created reusable `DateAccordion` component for grouping crimes by date
   - Accordions show formatted date (e.g., "Friday, January 3, 2026") with expandable crime cards
   - Most recent date expanded by default, older dates collapsed
   - Smooth animations with chevron rotation indicators
   - Bottom padding added to prevent shadow clipping on cards

2. **Smart Display Modes** ✅
   - **No filters active:** Crimes grouped in date accordions (chronological organization)
   - **Filters active:** Flat grid view (all matching crimes visible for easy scanning)
   - Automatic mode switching based on filter state
   - Event listeners re-attached after dynamic rendering

3. **Victim Count Display** ✅
   - Replaced "X crimes" with "X victims" in accordion headers
   - Uses `victimCount` field when available (2026+ data)
   - Defaults to 1 victim per row for backward compatibility (2025 data)
   - Calculation: `victimCount > 0 ? victimCount : 1`
   - Shows human impact instead of incident count

4. **Backward Compatibility** ✅
   - Server-side and client-side victim count calculation functions
   - Works seamlessly with both 2025 (no victimCount) and 2026+ (with victimCount) data
   - No breaking changes to existing crime data structure

**Key Learnings:**
- **Accordion grouping improves UX** - Date-based organization makes chronological scanning easier
- **Context-aware UI modes** - Show accordions for browsing, flat grid for searching
- **Victim count emphasizes impact** - Counting lives affected vs. incidents tells the real story
- **Reusable components save time** - DateAccordion can be used on archive pages if needed
- **Shadow clipping is common with overflow:hidden** - Always add bottom padding to accordion content

**Files Created:**
- `astro-poc/src/components/DateAccordion.astro` (reusable date accordion component)

**Files Modified:**
- `astro-poc/src/pages/trinidad/headlines.astro` (accordion integration, victim count display, dual-mode rendering)

**Status:**
- ✅ Date accordion grouping: Complete
- ✅ Victim count display: Complete
- ✅ Smart filtering modes: Complete
- ✅ Shadow padding fix: Complete

---

### January 1, 2026 - Victim Count System & Manual Workflow Transition

**Problem Solved:**
Double/triple murders were counted as single incidents, losing critical victim data. Gemini AI automation faced quota limits and accuracy issues, making manual entry more reliable.

**Accomplishments:**
1. **Victim Count Multiplier System** ✅
   - Added `victimCount` field to crime data schema
   - **Configurable per crime type:** Murder, Assault, Sexual Assault, Kidnapping use victim count
   - **Critical rule:** Victim count ONLY applies to PRIMARY crime type (related crimes always count as +1)
   - **Example:** Primary: Murder (victimCount=3), Related: [Shooting] → Murder +3, Shooting +1
   - **Config file:** `astro-poc/src/config/crimeTypeConfig.ts` - toggle victim counting per crime type

2. **Frontend Integration** ✅
   - Updated CSV parser to read `victimCount` column
   - Updated dashboard counting logic to apply multipliers correctly
   - Backward compatible: Old data without victimCount defaults to 1
   - Stats cards now show accurate victim counts for configured crime types

3. **Manual Workflow Transition** ✅
   - **Decision:** Retired Gemini AI automation (quota limits, accuracy issues)
   - **New workflow:** Manual Google Form entry for complete data control
   - **Optional:** Keep RSS headline collection to assist with finding crimes
   - **Archive plan:** Created `google-apps-script/trinidad/ARCHIVE-PLAN.md` with clear archiving instructions

4. **Google Form Enhancement** ✅
   - Added "Number of Victims" field (numeric, default: 1, required)
   - Validation: Must be ≥ 1
   - Description explains which crime types use victim count
   - Setup guide: `docs/implementation/VICTIM-COUNT-SETUP.md`

**Key Learnings:**
- **Automation isn't always better** - Manual entry provides complete data control and accuracy
- **Victim count for life-impact crimes matters** - Counting lives lost vs. incidents gives true picture
- **Primary vs. related distinction is critical** - Prevents double-counting in complex incidents
- **Configuration > hardcoding** - Crime type config file allows easy toggling without code changes

**Files Created:**
- `astro-poc/src/config/crimeTypeConfig.ts` (crime type configuration)
- `docs/implementation/VICTIM-COUNT-SETUP.md` (setup instructions)
- `google-apps-script/trinidad/ARCHIVE-PLAN.md` (Gemini archive plan)

**Files Modified:**
- `astro-poc/src/lib/crimeData.ts` (added victimCount parsing)
- `astro-poc/src/scripts/dashboardUpdates.ts` (victim count logic in countCrimeType)

**Status:**
- ✅ Victim count system: Complete and working
- ✅ Frontend integration: Complete
- ✅ Archive plan: Documented (user to execute manually)
- 🔜 Google Form update: User action required
- 🔜 Google Sheet column: User action required

---

### January 1, 2026 - Social Media Stats Triple-Mode System

**Problem Solved:**
Social media stats generation had critical bugs: (1) date range calculations were off by 1 day (using midnight instead of end-of-day), (2) timezone issues caused wrong date boundaries, (3) no support for monthly reviews or custom date ranges, (4) manual fiddling with `lagDays` required to get correct dates.

**Accomplishments:**
1. **Fixed Date Range Calculation Bug** ✅
   - **Root cause:** End dates set to `00:00:00` (midnight) instead of `23:59:59` (end-of-day)
   - **Impact:** Missing last day's crimes (e.g., Dec 21-27 only counted through midnight of Dec 27)
   - **Fix:** Changed all date boundaries to use **noon (12:00:00)** to avoid timezone edge cases
   - **Result:** Weekly stats now accurately capture full 7-day periods

2. **Fixed Timezone Boundary Issues** ✅
   - **Root cause:** JavaScript `Date` objects created at midnight UTC → off-by-1-day in Trinidad timezone (UTC-4)
   - **Example:** `new Date(2025, 11, 1)` = Dec 1 00:00 UTC → Nov 30 20:00 Trinidad time
   - **Fix:** All dates now created at noon instead of midnight
   - **Result:** Logs show correct dates (Dec 1 - Dec 31, not Nov 30 - Dec 31)

3. **Triple-Mode Stats System** ✅
   - **MODE 1: Daily Weekly Stats (Automated with 3-day lag)**
     - Function: `generateDailyStats()`
     - Uses fixed 3-day lag to ensure complete data
     - On Dec 31: Compares Dec 21-27 vs Dec 14-20
     - Optional automation: `setupDailyTrigger()` (runs 3 PM daily)

   - **MODE 2: Monthly Stats (Automated, no lag)**
     - Function: `generateMonthlyStats(year, month)` or `generateMonthlyStatsWithPrompt()` (with UI)
     - Compares full months (e.g., December vs November)
     - Run on 5th of month to ensure previous month is complete
     - Optional automation: `setupMonthlyTrigger()` (runs 5th at 9 AM)

   - **MODE 3: Custom Stats (Manual, no lag)**
     - Function: `generateCustomStats(startDate, endDate)` or `generateCustomStatsWithPrompt()` (with UI)
     - Analyze ANY date range specified
     - Compares against previous period of same duration
     - Perfect for ad-hoc analysis

4. **User-Friendly Popup Functions** ✅
   - `generateMonthlyStatsWithPrompt()` - Prompts for year/month with validation
   - `generateCustomStatsWithPrompt()` - Prompts for start/end dates with validation
   - Built-in validation:
     - Year range: 2020-2030
     - Month range: 1-12
     - Date format: YYYY-MM-DD
     - End date must be after start date
   - Confirmation dialogs before execution
   - Success messages with results location

5. **Comprehensive Documentation Update** ✅
   - Updated file header with complete 3-mode usage guide
   - Clear examples for each mode
   - Setup instructions for automation triggers
   - Parameter validation with helpful error messages

**Key Learnings:**
- **Midnight boundaries cause timezone bugs** - Using noon (12:00) instead of midnight (00:00) prevents off-by-1-day errors when timezone conversions occur
- **End-of-day means 23:59:59, not 00:00:00** - Critical distinction that caused missing data
- **Reporting lag needs to account for COMPLETE days** - Formula: `today - lagDays - 1` ensures full data availability
- **Multi-mode systems need clear documentation** - Different use cases (daily/monthly/custom) require different approaches
- **UI prompts improve usability** - Popup dialogs with validation prevent parameter errors

**Files Modified:**
- `google-apps-script/trinidad/socialMediaStats.gs` (complete rewrite of date logic, added 2 new modes, added UI prompt functions, added automation triggers)

**Functions Added:**
- `generateMonthlyStats(year, month)` - Monthly comparison stats
- `generateMonthlyStatsWithPrompt()` - UI-driven monthly stats
- `generateCustomStats(startDate, endDate)` - Custom date range stats
- `generateCustomStatsWithPrompt()` - UI-driven custom stats
- `generateMonthlyPostTexts()` - Monthly post formatting
- `setupMonthlyTrigger()` - Automation setup for monthly stats
- `generateMonthlyStatsAuto()` - Auto-triggered monthly stats

**Status:**
- ✅ Daily stats: Fixed and working with correct 3-day lag
- ✅ Monthly stats: Complete with automation option
- ✅ Custom stats: Complete for ad-hoc analysis
- ✅ Timezone issues: Resolved across all modes
- ✅ UI prompts: Complete with validation

---

### December 28, 2025 - Site Notification Banner & 2026 Crime Type System

**Problem Solved:**
Need to notify users about ongoing 2025 data updates, and need better crime type tracking for 2026 (currently submitting duplicate rows for multi-crime incidents).

**Accomplishments:**
1. **Site Notification Banner System** ✅
   - Created toggle-based notification system (`src/config/siteNotifications.ts`)
   - Built dismissible banner component (`src/components/SiteNotificationBanner.astro`)
   - Persists dismiss state in localStorage
   - Added to Dashboard, Headlines, Archives, Crime detail pages
   - Simple on/off toggle: `enabled: true/false`
   - Current message: "2025 crime data is currently being updated"

2. **2026 Primary + Related Crime Types** ✅ (Complete - Ready for Jan 1)
   - **Goal:** One incident = one row, but track ALL crime types involved
   - **Example:** Murder by shooting = 1 row with primary="Murder", related="Shooting" (no duplicates!)
   - **Backend (Apps Script):**
     - Created implementation guide: `docs/implementation/2026-PRIMARY-RELATED-CRIME-TYPES.md`
     - Created crime type processor: `google-apps-script/trinidad/crimeTypeProcessor.gs`
     - Updated Gemini prompt to extract `all_crime_types` array
     - Updated `processor.gs` to use new crime type logic (both `appendToProduction` and `appendToReviewQueue`)
   - **Frontend (Astro):**
     - Implemented column header mapping (resilient to column reordering)
     - Created `countCrimeType()` helper that counts across both `primaryCrimeType` and `relatedCrimeTypes`
     - Updated Dashboard StatCards to use new counting logic
     - Updated all filtering/trend calculations in `dashboardUpdates.ts`
     - **Result:** Incidents counted once, crime types counted accurately across primary + related fields
   - **Google Form:** Updated with dual dropdowns (Primary Crime Type + Related Crime Types)
   - **Next:** User tests pipeline on Dec 31, goes live Jan 1, 2026

**Key Learnings:**
- **Toggle-based notifications are user-friendly** - Single config change controls site-wide messaging
- **Backward compatibility is critical** - Keeping old `crimeType` column means frontend works immediately
- **2025 data stays untouched** - No manual cleanup needed, focus on getting 2026 right
- **Column header mapping prevents breakage** - Parsing CSV by column name (not index) makes system resilient to column reordering
- **Counting logic must handle multiple sources** - Crime types appear in primary, related, AND legacy fields during transition

**Files Created:**
- `src/config/siteNotifications.ts` (notification config)
- `src/components/SiteNotificationBanner.astro` (dismissible banner component)
- `docs/implementation/2026-PRIMARY-RELATED-CRIME-TYPES.md` (complete implementation guide)
- `google-apps-script/trinidad/crimeTypeProcessor.gs` (crime type processor with severity ranking)

**Files Modified:**
- `src/pages/trinidad/dashboard.astro` (added notification banner, column header mapping, countCrimeType helper)
- `src/pages/trinidad/headlines.astro` (added notification banner)
- `src/pages/trinidad/archive/[year]/[month].astro` (added notification banner)
- `src/pages/trinidad/archive/index.astro` (added notification banner)
- `src/pages/trinidad/crime/[slug].astro` (added notification banner)
- `src/lib/crimeData.ts` (column header mapping, primaryCrimeType/relatedCrimeTypes fields)
- `src/scripts/dashboardUpdates.ts` (countCrimeType helper, updated filtering/trend logic)
- `google-apps-script/trinidad/geminiClient.gs` (updated prompt for all_crime_types array)
- `google-apps-script/trinidad/processor.gs` (updated appendToProduction & appendToReviewQueue)

**Status:**
- ✅ Notification banner: Deployed and ready to use
- ✅ 2026 crime types: Complete (backend + frontend), ready for Jan 1 launch

---

### December 27, 2025 - Search Index Cleanup & Pagefind Production Fix

**Problem Solved:**
Site-wide search was showing unwanted UI content (modals, footers, headers) in results, and Pagefind wasn't generating search index files in production (404 errors on `/pagefind/*` files).

**Accomplishments:**
1. **Search Index Cleanup** ✅
   - Added `data-pagefind-ignore` to all modal components (Dashboard, Headlines, Archives, Search)
   - Added `data-pagefind-ignore` to header subscribe tray and mobile menu
   - Added `data-pagefind-ignore` to footer in Layout.astro
   - Added `data-pagefind-ignore` to crime detail page metadata sections (crime type badges, location details, metadata grids, Related Crimes, Report Issue sections)
   - Search results now show ONLY crime headlines and summaries (clean, focused results)

2. **Pagefind Production Fix** ✅
   - **Root Cause:** `astro-pagefind` integration wasn't running on Cloudflare Pages during build
   - **Solution:** Switched from integration-based to manual CLI approach
   - Added `data-pagefind-body` attribute to `<main>` tag in Layout.astro (tells Pagefind what to index)
   - Removed `astro-pagefind` integration from astro.config.mjs
   - Updated Cloudflare build command: `npm ci && npm run build && npx pagefind --site dist`
   - **Result:** Successfully indexing **1,581 pages** with **4,967 words** in production

3. **TextInfoPopup Component** 🔄 (Created but not deployed)
   - Built reusable component for clickable text with dashed underlines that opens info popups
   - Encountered DOM nesting issue when used inside SearchModal (popup content visible in parent modal)
   - Component saved in `src/components/TextInfoPopup.astro` for future use with different approach

**Key Learnings:**
- **Astro integrations may not run on all hosting platforms** - Cloudflare Pages doesn't execute all Astro build hooks reliably
- **Manual CLI approach is more reliable** - Running `npx pagefind --site dist` ensures indexing happens regardless of platform
- **`data-pagefind-body` is required** - Pagefind needs an explicit marker to know which content to index
- **DOM nesting affects portal-style components** - Fixed positioning doesn't prevent content from rendering within parent containers; need to use HTML `<template>` tags or append directly to `document.body`

**Files Modified:**
- `src/components/DashboardModal.astro` (added `data-pagefind-ignore`)
- `src/components/HeadlinesModal.astro` (added `data-pagefind-ignore`)
- `src/components/ArchivesModal.astro` (added `data-pagefind-ignore`)
- `src/components/SearchModal.astro` (added `data-pagefind-ignore`, removed TextInfoPopup usage)
- `src/components/Header.astro` (added `data-pagefind-ignore` to subscribe tray and mobile menu)
- `src/layouts/Layout.astro` (added `data-pagefind-ignore` to footer, added `data-pagefind-body` to main)
- `src/pages/trinidad/crime/[slug].astro` (added `data-pagefind-ignore` to metadata sections)
- `astro.config.mjs` (removed pagefind integration)
- `src/components/TextInfoPopup.astro` (created, not deployed)

**Commits:**
- `0889528` - Clean up search index and add modal navigation system
- `c92d731` - Fix Pagefind search indexing for production

---

## Owner Guidance

**Kavell Forde - Owner**
My thoughts are just my thought process and are always open to criticism and can be urged to be modified for the success of the project.

**MAIN GOAL:**
To find a way to get goals accomplished efficiently and by using the least tokens possible by:
- Employing Kavell to do some tasks manually (with guidance)
- Have Kavell use Gemini for content where necessary (Provide prompt)
- Always ask probing questions to clear up ambiguities in requests
- Focus and implement once, so no bugs show up unnecessarily

---

## Tech Stack

**Frontend:**
- **Astro 5.16.5** - Static site generator with file-based routing
- **Tailwind CSS 4.1.18** - Via Vite plugin (@tailwindcss/vite)
- **TypeScript** - Type safety for components and content
- **Astro Content Collections** - Type-safe blog system
- **Pagefind** - Site-wide static search
- Cloudflare Turnstile for CAPTCHA
- Leaflet.js for interactive maps
- OpenStreetMap tiles

**Backend/Automation:**
- Google Apps Script (serverless)
- Google Gemini AI (crime data extraction)
- Google Sheets (data storage + CSV export)
- GitHub Actions (CI/CD)

**Hosting:**
- Cloudflare Pages (auto-deploy from GitHub)
- Custom domain: crimehotspots.com

**Working Directory:** `astro-poc/`

---

## Critical Rules

### COMPONENT-FIRST PRINCIPLE ⭐⭐⭐

Before adding any feature, ask: "Should this be a reusable component?" Create components for reusable UI patterns (filters, cards, modals, forms) before writing inline code. Store in `src/components/` or `src/scripts/` for TypeScript utilities.

### DESIGN SYSTEM ⭐

**Check `docs/guides/DESIGN-TOKENS.md` BEFORE making any UI/styling changes**

- Follow established button patterns (`px-4 py-1.5`, `min-h-[22px]`)
- Use `rounded-lg` (not `rounded-md`)
- Always add explicit text colors (`text-slate-700`, `text-slate-400`)
- Use colors only from Rose + Slate palette
- No emojis unless requested

### When Working on Astro Frontend

**DO:**
- Work in `astro-poc/` directory (NOT root)
- Use Read, Edit, Write tools (not bash)
- Prefer editing existing files
- Test with `npm run dev` (port 4321)
- Build successfully before committing: `npm run build`
- Keep page files under 500 lines - extract to components/scripts if larger

**DON'T:**
- Create markdown files unless required
- Modify `astro.config.mjs` without understanding
- Create new button variants (use existing patterns from DESIGN-TOKENS.md)
- Work in root directory (Vite version is deprecated)

### When Working on Automation

**NEVER:**
- Change `maxOutputTokens` from 4096
- Remove multi-crime detection
- Hardcode API keys

**ALWAYS:**
- Read automation README first
- Test with `testRSSCollection()` functions
- Verify Script Properties are set

### CSV URL Synchronization (CRITICAL)

**⚠️ IMPORTANT:** CSV URLs must be synchronized across multiple files:

**Files That Must Match:**
1. `astro-poc/src/lib/crimeData.ts` (lines 27-34)
2. `astro-poc/src/pages/trinidad/dashboard.astro` (lines 400-405)

**Rules:**
- **ALWAYS update BOTH files** when changing CSV URLs
- Both files must point `current` to the same year sheet
- When `current` points to 2025 sheet, don't also load explicit 2025 sheet

**Why:** Dashboard uses client-side CSV fetching, Headlines/archive use server-side fetching. Mismatch causes "flash" effect and duplicate loading.

See `docs/claude-context/development-workflow.md` for details.

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

## Quick Reference Documentation

**📂 Claude Context (Detailed Information)**
- `docs/claude-context/architecture.md` - Astro routing, file structure, SSG examples
- `docs/claude-context/automation.md` - Google Apps Script details, data collection
- `docs/claude-context/development-workflow.md` - Commands, deployment, CSV URL sync
- `docs/claude-context/recent-features.md` - December 2025 feature implementations
- `docs/claude-context/status-and-roadmap.md` - Completed features, next To-Do, vision

**🎨 Design & SEO**
- `docs/guides/DESIGN-TOKENS.md` - **Official Design System (v1.0)** ⭐ CHECK THIS FIRST
  - Button variants, frosted glass, typography, color palette, copy-paste templates
- `docs/guides/DESIGN-Guidelines.md` - Complete design framework (v2.0)
- `docs/guides/SEO-Framework.md` - Complete SEO strategy, phased roadmap

**🧩 UI Patterns**
- `docs/guides/ACCORDION-PATTERN.md` - Date accordion component pattern
- `docs/guides/INFO-ICON-PATTERN.md` - Info icon hover pattern

**🤖 Automation**
- `google-apps-script/trinidad/README.md` - Trinidad automation
- `docs/FACEBOOK-DATA-COLLECTION.md` - Facebook sources
- `docs/automation/WEEKLY-REPORT-SAFEGUARDS.md` - Blog automation
- `docs/automation/DUPLICATE-DETECTION-ARCHIVE.md` - Enhanced duplicate detection
- `docs/automation/SEIZURES-CRIME-TYPE.md` - Seizures crime type

**📦 Architecture**
- `docs/architecture/CSV-DATA-MANAGEMENT.md` - Phased implementation plan

**📜 Archive**
- `docs/archive/Development Progress/` - Historical development logs

---

## Current Status (Brief)

### ✅ Production Ready
- Astro 5.16.5 framework (1,728 static pages)
- Trinidad & Tobago automation (100% functional)
- Dashboard with Leaflet maps, year filtering, trend comparisons
- Site-wide search (Pagefind, 1,728 pages indexed)
- SEO Phase 1 complete (sitemap, structured data, breadcrumbs, Google Search Console verified)
- Google Analytics 4, cookie consent, user reporting
- Social media accounts active (Facebook, X, Instagram) with content automation

### 🔄 In Progress
- **Traffic Growth Strategy (Week of Jan 6-12)** - Launching zero-budget social media distribution plan
  - Reddit launch: r/TrinidadandTobago
  - Facebook groups: Join 3-5 Trinidad crime/community groups
  - X/Twitter: Tag Trinidad news outlets
  - Goal: 50-100 real visitors/day by March 2026

### 📋 Priority Queue (2026)
1. **SEO Phase 2: Social Media Dominance** (ACTIVE - Week of Jan 6-12)
   - ✅ Social accounts ready (Facebook, X, Instagram)
   - ✅ Content automation (Google Apps Script + image generator)
   - 🔜 Reddit launch
   - 🔜 Facebook groups distribution
   - 🔜 News outlet tagging strategy
2. Division/Area filter enhancement (hierarchical filtering)
3. Complete breadcrumb navigation
4. Open Graph preview images (once traffic is established)
5. Auto-post to Facebook/X APIs (future enhancement)

See `docs/claude-context/status-and-roadmap.md` for complete details.

---

## Development Commands

```bash
cd astro-poc
npm run dev      # Start dev server (port 4321)
npm run build    # Build for production
npm run preview  # Preview production build
```

**Deployment:**
- Push to `main` → GitHub Actions builds → Cloudflare Pages deploys
- Daily rebuild at 6 AM UTC (2 AM Trinidad time)
- Manual trigger: GitHub Actions UI → "Build and Validate" → "Run workflow"

---

**For comprehensive details on any topic, see the reference docs in `docs/claude-context/`**
