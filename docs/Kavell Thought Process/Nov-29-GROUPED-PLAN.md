# Nov 29 Bug Fixes & Features - Grouped Implementation Plan

**Created:** November 29, 2025
**Source:** `Nov-29-Thoughts` document
**Strategy:** Group by page/component to minimize context switching

## ✅ Session Completion Summary - December 2, 2025

**Priority Tasks Completed:**
- ✅ Typography framework applied site-wide (report.html, dashboard-trinidad.html, dashboard-guyana.html, about.html)
- ✅ Footer redesign with dark grey background (about.html, report.html)
- ✅ Date format failsafe implemented (frontend: headlinesPage.js parseDate() now handles MM/DD export format)
- ✅ Crime type color palette finalized (14 unique colors, family-based system)
- ✅ Facebook source failsafe verified (working correctly with fallback chain)
- ✅ Blog auto-generation bug identified and fixed (column name mismatch)

**Pending Backend Deployments (User Action Required):**
- Date format fix to processor.gs (Trinidad & Guyana) - prepend apostrophe to force DD/MM text
- Weekly report generator deployment to Google Apps Script (optional, complex setup)

**Next Session Focus:**
- Dashboard chart fixes (7-day trend, top locations, legend colors)
- Dashboard z-index and map improvements
- Remaining site-wide polish items

---

## 📋 Table of Contents

1. [Backend/Data Issues](#1-backenddata-issues-google-apps-script)
2. [Dashboard Pages (Both Countries)](#2-dashboard-pages-trinidad--guyana)
3. [Headlines Pages (Both Countries)](#3-headlines-pages-trinidad--guyana)
4. [Homepage](#4-homepage-indexhtml)
5. [Blog System](#5-blog-system)
6. [Site-Wide Design System](#6-site-wide-design-system)
7. [New Features - High Impact](#7-new-features-high-impact)
8. [Legal & Documentation](#8-legal--documentation)
9. [Nice-to-Have / Future](#9-nice-to-have--future)

---

## 1. Backend/Data Issues (Google Apps Script)

**When to Work On:** Once, applies to all future data
**Files:** `google-apps-script/trinidad/`, `google-apps-script/guyana/`

###Items from Nov-29:

- [ ] **"null" → "Unknown"** in victim names
  - Location: `processor.gs` extraction logic
  - Fix: `victim.name || "Unknown"`
  - Impact: Production sheet, all future crimes

- [x] **Date parsing fix** (DD/MM/YYYY vs MM/DD/YYYY confusion) ✅ COMPLETED Dec 1
  - Problem: "12/03/2025" showing as Dec 3 instead of Mar 12
  - Solution: Smart detection in frontend + DD/MM format enforcement in backend
  - Location: `headlinesPage.js` parseDate() + `processor.gs` validateAndFormatDate()
  - Frontend: Intelligently detects MM/DD vs DD/MM based on values
  - Backend: Outputs `'DD/MM/YYYY` (apostrophe forces plain text in Sheets)

- [ ] **Region auto-population**
  - Create: Google Sheet with Area-to-Region mapping
  - Implement: VLOOKUP formula or Apps Script auto-fill
  - Benefit: No more manual lookup (saves time)
  - **Need your input:** Should I create the lookup table, or will you via Gemini?

- [ ] **Duplicate detection with archives**
  - Current: Archives break duplicate checking
  - Solution: Separate "Processed URLs" sheet (never archives)
  - Impact: Fewer duplicates in Production

- [x] **Facebook source names** ✅ COMPLETED Dec 1
  - Problem: Shows "Facebook" instead of "Ian Alleyne Network"
  - Solution: Added Source column to CSV, frontend now reads it with failsafe
  - Location: `headlinesPage.js` + `headlineSummaryModal.js`
  - Fallback: Extracts from URL if Source column empty, shows "Unknown Source" if both missing

- [x] **Weekly blog auto-generation check** ✅ COMPLETED Dec 1
  - Issue: "haven't had any since"
  - Root cause: Looking for wrong column names ('Incident Date' vs 'Date')
  - Fix: Updated `weeklyReportGenerator-IMPROVED.gs` to use correct column names
  - Manual trigger available: `forceGenerateReport('trinidad')`
  - Note: Script needs to be deployed to Google Apps Script project

---

## 2. Dashboard Pages (Trinidad & Guyana)

**When to Work On:** Together (same components, different data)
**Files:** `dashboard-trinidad.html`, `dashboard-guyana.html`, shared JS components

### Items from Nov-29:

#### Charts & Widgets

- [ ] **7-day trend chart** - Not working
  - Current: Broken
  - Fix: Change from Days→Amount to **Crime Type→Amount** (bar chart)
  - Apply to: Both dashboards

- [ ] **Top locations chart** - Slanted numbers
  - Problem: Too many numbers, text overlaps
  - Solution: Logarithmic scale OR abbreviate (1.2K vs 1234)
  - Alternative: Rotate labels 45°

- [x] **Legend colors** - Similar crimes have similar colors ✅ COMPLETED Dec 1
  - Examples: Kidnapping/Robbery (both red-ish), Home Invasion/Burglary (both orange)
  - Solution: Created family-based color system with 14 unique colors
  - Location: `src/js/config/crimeColors.js`
  - System: Violence (5 reds), Property (4 oranges), Theft (2 yellows), Other (3 cool colors)
  - Each crime type has distinct color, families gradient by severity

- [ ] **Add "Shootings" widget**
  - Filter: `crimeType === "Shooting"`
  - Icon: 🔫 or SVG
  - Placement: With other metric cards

- [ ] **Make widgets scrollable** (horizontal)
  - Wrap in: `overflow-x-auto` container
  - Benefit: Unlimited widgets, clean layout
  - Snap scrolling for better mobile UX

#### Maps

- [ ] **Incidents map z-index** - "Still over everything"
  - Problem: Map overlaps tray/header
  - Fix: Desktop `z-10`, Mobile tray `z-50`
  - Verify: No overlap on scroll

- [ ] **Map in mobile tray** - Guyana cut off
  - Set height: `h-96` with scroll
  - Make zoomable: Already is (Leaflet default)

- [ ] **Map markers** - Add Street + Area
  - Current popup: Just headline
  - New: `<strong>{street}</strong><br>{area}, {region}`

- [ ] **"Click, Zoom, Explore" text** below map
  - Add: `<p class="text-tiny text-center mt-2">Click markers • Zoom • Explore</p>`

#### Header & Controls

- [ ] **Trinidad date range filter** - Not showing placeholder text in tray
  - Check: Is element hidden on mobile? Debug

- [ ] **"Select Region" floating bubble** on scroll
  - When scroll > 300px: Show fixed button
  - Icon: 🌍 or map pin
  - Position: `fixed bottom-20 right-4 z-40`
  - Opens region tray

- [ ] **Trinidad map region name fix** - "Penal Debe" → "Penal-Debe"
  - File: SVG regional map or data
  - Simple find/replace

#### Guyana Styling Updates

- [ ] **Apply Trinidad's Nov 27 styling** to Guyana
  - Remove red background from header
  - "View Headlines" as outline button
  - Compact "Select Region" for mobile
  - Clean, minimal design

#### Info & Help

- [ ] **Info icon** for dashboard features
  - Icon: ⓘ (top right)
  - Opens frosted tray with:
    - "How to Use This Dashboard"
    - Click regions to filter
    - Adjust date range
    - View crime density
  - Use standardized tray component

#### Text & Labels

- [ ] **Label large text** as "Crime Statistics Dashboard" → just "Statistics"
  - Simplify header text
  - Or remove entirely if redundant

- [ ] **Info widget at bottom** - Update text sizes to match new layout
  - Apply typography framework
  - Verify readability on mobile

---

## 3. Headlines Pages (Trinidad & Guyana)

**When to Work On:** Together (same component, different data)
**Files:** `headlines-trinidad-and-tobago.html`, `headlines-guyana.html`, `headlinesPage.js`

### Items from Nov-29:

#### Cards & Display

- [ ] **"Read Article" link** - Hover-only doesn't work on mobile
  - Current: Shows on hover (desktop only)
  - Fix: Always visible OR add icon (→)
  - Mobile: Show as button below card

- [ ] **Total Crimes text** - Make bigger
  - Current: `.text-small` or similar
  - Change to: `.text-display` (same size as page title)
  - Emphasis: Important stat

- [ ] **Clear distinction: Victim vs. Suspect**
  - Victims: Regular text
  - Suspects: `<span class="text-rose-600">Suspect: {name}</span>`
  - Visual separation in tray

- [ ] **Add Street + Area to headline cards**
  - Current: Just on map/tray
  - New: Show on cards too
  - Format: `[Crime Type] in [Area] • [Date]`

#### Regional Filtering

- [ ] **"Select Region" dropdown** on headlines pages
  - Add: Filter by specific region
  - Placement: Near crime type filter
  - Filters: Headlines client-side by `headline.region`
  - Persist in sessionStorage

#### Tray (Modal) Improvements

- [ ] **Empty source field handling**
  - Current: If source empty, module might not show
  - Fix: Show "Source Unknown" + disable link
  - Never hide entire modal

- [ ] **Tray button layout** - Compact
  - Current: 3 rows (Source, Read, Map)
  - New: 1 row, 3 buttons side-by-side
  - `flex gap-2`: Source | Read Article | View Map
  - Saves space for additional features

- [ ] **"View Map" button** - Trinidad goes to homepage (bug)
  - Fix: `/dashboard-trinidad.html#map`
  - Guyana: `/dashboard-guyana.html#map`
  - Add anchor scroll behavior

- [ ] **Swipeable tray** - 3-state behavior
  - Closed → Half (50vh) → Full (90vh) → Half → Closed
  - Swipe up: Expand
  - Swipe down: Minimize or close
  - Click outside or swipe down from half: Close
  - Controlled by handle drag

#### Additional Tray Features (Ideas from Nov-29)

- [ ] **Timeline View** (multi-victim incidents)
  - If `victims.length > 1`: Show timeline
  - Format: "10:00 PM - Victim 1 encountered..."

- [ ] **Crime Trend Badge**
  - "⚠️ 3 robberies in this area this week"
  - Query: Same area, same crime type, last 7 days

- [ ] **Safety Tips** (contextual)
  - Based on crime type:
    - Robbery → "Avoid displaying valuables"
    - Home Invasion → "Install security, deadbolts"
  - Pre-written tips in JS file

- [ ] **Email Alerts CTA** (future feature)
  - "Notify me of crimes in my area"
  - Links to email alert signup

- [ ] **Export/Print button**
  - PDF generation for personal records
  - CSV download of filtered data

---

## 4. Homepage (index.html)

**When to Work On:** Quick wins, high visibility
**File:** `index.html`

### Items from Nov-29:

- [ ] **Remove from country cards:**
  - ❌ "Nationwide Coverage" text
  - ❌ Flag emoji (keep in menu only)
  - ❌ "Nationwide Data" text
  - Clean, minimal cards

- [ ] **Homepage text changes** (already done by Kavell?)
  - Changed: "Every Island | Every Incident | One Map"
  - To: "Access data and headlines across the islands"
  - New subtitle: "Select a region for immediate geographical intelligence..."
  - **Verify:** Is this live? Check index.html line 77-84

---

## 5. Blog System

**When to Work On:** After critical bugs fixed
**Files:** `blog.html`, `blog-post.html`, weekly report generator

### Items from Nov-29:

#### Blog Index (blog.html)

- [ ] **Redesign layout**
  - Current: Card layout
  - New: Image left (square), content right
  - Format:
    ```html
    <article class="flex gap-4 py-4 border-b">
      <img class="w-24 h-24 rounded-lg" />
      <div>
        <h2 class="text-h2">{title}</h2>
        <p class="text-tiny">{date}</p>
        <p class="text-small line-clamp-2">{excerpt}</p>
      </div>
    </article>
    ```

- [ ] **Rename title** → "The Hotspot Report"
  - Update page title
  - Update header text

- [ ] **Shrink filter buttons** (country selector)
  - Use `.text-tiny` pills
  - Smaller, cleaner look

---

## 6. Site-Wide Design System

**When to Work On:** Foundation for all future work
**Files:** Multiple (site-wide impact)

### Items from Nov-29:

#### Frosted Glass Standardization

- [ ] **Create master frosted tray component**
  - Reusable: Headlines, region selector, cookies, info, etc.
  - Features:
    - Backdrop blur
    - Rounded corners (top)
    - Handle for dragging
    - Swipe gestures
    - Close on outside click, Escape key
    - Body scroll lock
  - File: `src/js/components/frostedTray.js`

- [ ] **Apply to all trays:**
  - Headlines modal
  - Region selector (mobile)
  - Cookie consent banner
  - Dashboard info popup
  - Blog filters (mobile)

- [ ] **Design language checklist:**
  - Frosted: `bg-white/75 backdrop-blur-[16px]`
  - Curved edges: `rounded-t-2xl` (24px top)
  - Rose accents: `rose-600` for primary CTA
  - Dark grey: `slate-700` text
  - Light grey: `slate-200` dividers
  - Off white: `slate-50` backgrounds

#### Typography Framework Application

- [x] **Audit all pages** for Tailwind text classes ✅ COMPLETED Dec 2
  - Find: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`
  - Replace with framework: `.text-small`, `.text-body`, `.text-h2`, `.text-h1`, `.text-display`
  - **Completed status:** All priority pages updated
  - **Priority pages completed:**
    - ✅ report.html (all 16 instances replaced)
    - ✅ dashboard-guyana.html (all 15 instances replaced)
    - ✅ dashboard-trinidad.html (all 12 instances replaced)
    - ✅ about.html (all 12 instances replaced)

#### Button Standardization

- [ ] **Two button types everywhere:**
  - **Primary CTA:** `bg-rose-600 hover:bg-rose-700 text-white rounded-lg`
  - **Secondary CTA:** `border-2 border-rose-600 text-rose-600 hover:bg-rose-50 rounded-lg`
  - Size reference: Dashboard "View Headlines" button
  - Apply site-wide

#### Footer Redesign

- [x] **Remove blue background** ✅ COMPLETED Dec 2
  - Solution: Dark grey (`bg-slate-800`) background with white text
  - Applied to: about.html, report.html
  - Matches: dashboard-trinidad.html, dashboard-guyana.html, blog.html, blog-post.html
  - Design: py-8 padding, centered text, two-line structure with copyright and tagline

- [ ] **Structure (Ground.news inspired):**
  ```
  About | Mission | Blog
  Help Center | FAQ | Contact | News Sources
  Terms | Privacy | Suggest a Source
  ```

- [ ] **Make site-wide** (component in `footer.js`)
  - Import on all pages
  - Consistent across site
  - Note: Currently consistent HTML structure across all pages, but not yet a component

#### Cookie Consent Redesign

- [ ] **Theme-colored banner**
  - Current: Generic/non-themed
  - New: Frosted glass slide-up
  - Matches design language
  - Rose accent buttons

- [ ] **Slide-up animation**
  - Bottom sheet style
  - Handle for dismissal
  - Clear "Accept" / "Decline" buttons

#### Loading States

- [ ] **Replace shimmer with CloudFlare-style logo loader**
  - Current: Light shimmer (barely visible)
  - New: Logo with loading circle
  - Visible, gives feedback
  - Apply to: Dashboards, headlines, blog

---

## 7. New Features - High Impact

**When to Work On:** After core bugs fixed
**Priority:** SEO → Social → Email Alerts

### Items from Nov-29:

#### Social Media

- [ ] **Create profiles** (all platforms)
  - Accounts needed: Facebook, X (Twitter), Instagram, WhatsApp Business
  - **Need:** Cohesive handles (e.g., @crimehotspots)
  - **Need:** Profile descriptions, bios
  - **Ask Kavell:** Create account info or use Gemini to draft?

- [ ] **Social sharing implementation**
  - Button: Opens modal with share options
  - Platforms: WhatsApp, Facebook, X, Copy Link
  - Format:
    ```
    🚨 {Crime Type} in {Area}, Trinidad

    {Description}

    View details: {url}

    #TrinidadCrime #PublicSafety
    ```
  - Frictionless, one-click

- [ ] **Auto-posting strategy**
  - Similar to headline module setup
  - Monday weekly blog → auto-post to all platforms
  - Tool: Buffer, Zapier, or custom Apps Script
  - **Need:** Define workflow

- [ ] **Ground.news approach adoption?**
  - Positioning: "ALL Trinidad news in one place"
  - Aggregator vs. crime data platform angle
  - **Ask Kavell:** Thoughts on this positioning?

#### SEO

- [ ] **Check current SEO score**
  - Run: Google Lighthouse, PageSpeed Insights
  - Baseline metrics

- [ ] **Implement Phase 1 from SEO-Framework.md:**
  - Meta descriptions (all pages)
  - Open Graph tags
  - Twitter Cards
  - Canonical URLs
  - Structured data (Schema.org)
  - Sitemap.xml
  - Robots.txt

- [ ] **Create Methodology page** (`/methodology.html`)
  - Data sources (RSS, Facebook)
  - Verification process
  - Limitations, disclaimers
  - E-E-A-T compliance (YMYL content)

#### Email Alerts

- [ ] **Simple implementation** (no complex backend)
  - Option 1: IFTTT/Zapier (watch sheet, send emails)
  - Option 2: Mailto link (manual list management)
  - **Ask Kavell:** Preference?

- [ ] **Signup form/button**
  - Placement: Homepage, headlines pages
  - Collect: Email, region, crime types
  - Store in Google Sheet

#### Export/Print

- [ ] **Add to dashboards**
  - PDF: `window.print()` with print stylesheet
  - CSV: Download filtered data
  - Image: Screenshot via html2canvas
  - Button: Download icon

---

## 8. Legal & Documentation

**When to Work On:** Before social media launch
**Files:** New pages needed

### Items from Nov-29:

- [ ] **Terms of Use** (`/terms.html`)
  - Data usage rights
  - Disclaimers
  - **Need:** Draft text (Gemini can help?)

- [ ] **Privacy Policy** (`/privacy.html`)
  - Cookie usage
  - Google Analytics data
  - GDPR compliance if applicable
  - **Need:** Draft text

- [ ] **Add to footer** (all pages)
  - Links: Terms | Privacy

- [ ] **Feedback mechanism**
  - About page form
  - Web3Forms or Google Form
  - Email to your address

- [ ] **"Suggest a Source" button**
  - Google Form (like Ground.news)
  - Fields: Source name, URL, Region, Why useful
  - Link in footer

---

## 9. Nice-to-Have / Future

**When to Work On:** After Phase 1-8 complete
**Priority:** Based on user feedback

### Items from Nov-29:

- [ ] **Dark mode**
  - Toggle in header
  - CSS variables for colors
  - Persist in localStorage
  - **Ask Kavell:** Priority or wait?

- [ ] **Timelines** (Ground.news style)
  - Topic timelines for major incidents
  - "Port of Spain Kidnapping Spree - Nov 2025"
  - Scroll-based interactive

- [ ] **Topic buttons** (below header)
  - Pebble-sized pills: "Robberies" "Homicides" "Kidnappings"
  - Filter site by topic
  - Ground.news approach

- [ ] **Help Center** (dedicated page)
  - Video tutorials
  - Written guides
  - FAQs

- [ ] **"Contribute" feature**
  - Community ideas
  - User submissions
  - Moderation needed

---

## 📊 Optimization & Technical Debt

**When to Work On:** Ongoing, between feature work

### Items from Nov-29:

- [ ] **CSV size optimization**
  - Question: "How many rows too much?"
  - Solution: Snapshot + refresh pattern
  - Load cached data (instant)
  - "Refresh" button fetches latest
  - localStorage 1-hour cache

- [ ] **Check for bloat**
  - Audit: Duplicate styling, clashing CSS
  - Optimize for modality
  - Clean up unused code

- [ ] **Cell mapping in Google Sheets**
  - Use named ranges instead of A1 notation
  - Prevents formula breaking when cells move
  - Example: `=FILTER(CrimeData, ...)` instead of `=FILTER(A:Z, ...)`

---

## 🚀 Recommended Delivery Sequence

Based on **impact × effort** and **dependencies**:

### Week 1: Foundation & Critical Bugs
**Goal:** Site works perfectly, looks consistent

1. ✅ **Typography updated** (DONE - Nov 29)
2. ✅ Backend data fixes (null, dates, regions, duplicates)
3. ✅ Typography framework application (all pages)
4. ✅ Dashboard chart fixes (7-day, top locations, legend)
5. ✅ Dashboard z-index and map improvements

### Week 2: Design System
**Goal:** One unified frosted glass design language

6. Create master frosted tray component
7. Apply to all trays (headlines, region, cookies)
8. Button standardization site-wide
9. Footer redesign (dark/frosted)
10. Loading states (logo + spinner)

### Week 3: Headlines & Homepage Polish
**Goal:** Best mobile UX, clean presentation

11. Headlines tray improvements (compact buttons, swipe)
12. Regional filtering on headlines
13. Victim/suspect distinction
14. Homepage card cleanup
15. Blog redesign

### Week 4: High-Impact Features
**Goal:** Visibility, shareability, growth

16. SEO Phase 1 (meta tags, structured data, sitemap)
17. Methodology page
18. Social sharing buttons
19. Export/print functionality

### Week 5: Social & Legal
**Goal:** Ready to launch social presence

20. Social profiles created
21. Auto-posting setup
22. Terms & Privacy pages
23. Suggest a Source form
24. Feedback mechanism

### Week 6+: Advanced Features
**Goal:** Differentiation, delight

25. Email alerts
26. Dark mode
27. Timeline pages
28. Help Center
29. Community features

---

## ❓ Questions for Kavell (Before Starting)

### Backend/Data:
1. **Region mapping:** Should I create the Area→Region lookup table, or will you via Gemini?
2. **Facebook sources:** Full list to map? (Ian Alleyne Network, DJ Sherrif, others?)
3. **Date format:** Should I enforce DD/MM/YYYY in extraction script, or handle both with detection?

### Design:
4. **Frosted tray:** Build as reusable component first, then apply everywhere? (Recommended: Yes)
5. **Footer:** Dark grey or frosted glass background? Which do you prefer?
6. **Dark mode:** Priority now, or save for Phase 2?
7. **Legend colors:** Want to see color palette options before I implement?

### Features:
8. **Email alerts:** IFTTT/Zapier automation OR simple mailto links?
9. **Social positioning:** Aggregator ("all news") vs. crime platform ("data-driven")? Which angle?
10. **Blog auto-generation:** Should I check why it stopped, or just add manual trigger?

### Content:
11. **Legal pages:** Draft Terms/Privacy via Gemini, or do you have templates?
12. **Social profiles:** Create bios/descriptions, or you'll provide?
13. **Methodology page:** Write full content, or just structure and you'll fill in?

---

## 🎯 Next Steps

1. **Kavell answers questions above**
2. **I start with Week 1 (Foundation)**:
   - Backend data fixes
   - Typography application
   - Dashboard chart fixes
3. **Test each fix immediately** (you verify on live site)
4. **Move to Week 2** after Week 1 complete

---

**Status:** Ready to begin once questions answered
**Estimated Timeline:** 6-8 weeks for full completion (Weeks 1-5 priority)
**Blocker:** None - can start on agreed items immediately
