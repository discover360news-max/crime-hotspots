# Migration Roadmap - Trinidad Focus

**Last Updated:** December 12, 2025
**Scope:** Trinidad & Tobago ONLY (Guyana later)
**Purpose:** Map old Vite site structure to new Astro structure

---

## 🎯 PROJECT SCOPE: TRINIDAD ONLY

**Important:** We are ONLY working on Trinidad & Tobago for now. Guyana will be added later after Trinidad is complete and tested.

---

## 📊 Current Status Overview

### ✅ Completed (60%)
- Crime pages (1,300+ individual Trinidad pages)
- Monthly archives (by year/month)
- Archive index
- Static pages (About, FAQ, Methodology)
- Blog system (index + individual posts)
- Basic Layout with navigation

### 🔄 In Progress (10%)
- Trinidad Dashboard (structure exists, needs functionality)

### ❌ Missing (30%)
- **Homepage with country cards** (CRITICAL - Wrong homepage!)
- Headlines page (Trinidad)
- Complete Trinidad dashboard
- Report form
- Navigation updates to match old site

---

## 🗺️ Old Site Structure → Astro Mapping

### Old Site Pages (Vite) - TRINIDAD FOCUS

```
OLD SITE STRUCTURE:
├── index.html                              → Homepage (COUNTRY CARDS!) 🇹🇹 🇬🇾 🇧🇧
├── dashboard-trinidad.html                 → Trinidad Dashboard
├── headlines-trinidad-and-tobago.html      → Trinidad Headlines
├── blog.html                               → Blog Index
├── blog-post.html (dynamic)                → Individual Blog Posts
├── about.html                              → About Page
├── report.html                             → Crime Report Form
├── faq.html                                → FAQ Page
└── methodology.html                        → Methodology Page

[GUYANA & BARBADOS - DEFERRED]
```

### New Astro Structure - TRINIDAD ONLY

```
ASTRO SITE STRUCTURE:
astro-poc/src/pages/
├── index.astro                             ❌ WRONG! (needs country cards)
│                                              Current: Trinidad-specific landing
│                                              Should be: Country selection cards
│
├── trinidad/
│   ├── dashboard.astro                     🔄 Dashboard (structure only)
│   ├── headlines.astro                     ❌ Headlines (MISSING)
│   ├── crime/
│   │   └── [slug].astro                    ✅ Individual crimes (DONE - 1,300+)
│   └── archive/
│       ├── index.astro                     ✅ Archive index (DONE)
│       └── [year]/[month].astro            ✅ Monthly archives (DONE)
│
├── blog/
│   ├── index.astro                         ✅ Blog index (DONE)
│   └── [slug].astro                        ✅ Individual posts (DONE)
│
├── about.astro                             ✅ About (DONE)
├── faq.astro                               ✅ FAQ (DONE)
├── methodology.astro                       ✅ Methodology (DONE)
└── report.astro                            ❌ Report form (MISSING)

[NO GUYANA PAGES - Trinidad only for now]
```

---

## 🎯 Phase-by-Phase Implementation Plan - TRINIDAD ONLY

### Phase 0: Fix Homepage (Priority: CRITICAL) 🚨

**Goal:** Replace current index.astro with country cards structure

**Current Problem:**
- `index.astro` shows Trinidad-specific landing page
- Should show country selection cards (Trinidad, Guyana, Barbados) like old site

**Solution:**
1. Rename current `index.astro` → `trinidad/landing.astro` (or delete if not needed)
2. Create new `index.astro` with country cards structure
3. Use `countries.js` pattern for data-driven approach
4. Cards show: Flag, Country name, "View Dashboard" button, Image

**Reference:**
- Old site: `/Users/kavellforde/Documents/Side Projects/Crime Hotspots/index.html`
- Countries data: `/Users/kavellforde/Documents/Side Projects/Crime Hotspots/src/js/data/countries.js`

**Card Structure (per country):**
```astro
<div class="country-card">
  <img src="{country.image}" />
  <div class="flag">{country.flag}</div>
  <h2>{country.name}</h2>
  <p>{country.short}</p>
  <a href="{country.dashboard}">View Dashboard</a>
</div>
```

**For now:** Only show Trinidad card (other countries grayed out or hidden)

---

### Phase 1: Navigation (Priority: HIGH)

**Goal:** Update navigation to match old site - TRINIDAD ONLY

**Tasks:**
1. Update Layout.astro navigation links
2. Add simple links (NO dropdowns for now - only Trinidad)
3. Update mobile menu
4. Test all navigation links

**Files to Edit:**
- `src/layouts/Layout.astro` (lines 82-98 for desktop nav)

**Simplified Navigation (Trinidad Only):**
```
Logo | Dashboard | Headlines | Archives | About | Blog | Report a Crime
       (Trinidad)  (Trinidad)  (Trinidad)
```

**Future (when Guyana added):** Convert to dropdowns

---

### Phase 2: Headlines Page (Priority: HIGH)

**Goal:** Create headlines page for Trinidad

**Tasks:**
1. Create `src/pages/trinidad/headlines.astro`
2. Fetch Trinidad crime data from CSV
3. Display in table/card format with filters
4. Add date range filtering
5. Add crime type filtering
6. Add search functionality (optional for v1)

**Features to Include:**
- Table view with columns: Date, Crime Type, Location, Area, Source Link
- Filters: Date range, Crime type, Region/Area
- Pagination (show 50 per page)
- Export to CSV button
- Link to individual crime pages

**Reference:** Old site `headlines-trinidad-and-tobago.html`

---

### Phase 3: Complete Trinidad Dashboard (Priority: HIGH)

**Goal:** Finish Trinidad dashboard with full functionality

#### Trinidad Dashboard (`src/pages/trinidad/dashboard.astro`)
**Status:** 25% complete (structure exists, needs functionality)

**Tasks:**
1. ✅ Background image (DONE)
2. ✅ SVG regional map styles (DONE)
3. ❌ Integrate Leaflet map with crime data
4. ❌ Add statistics cards (Total Crimes, Crime Types, Regions, Areas)
5. ❌ Add crime type breakdown chart
6. ❌ Add regional breakdown chart
7. ❌ Add 7-day trend chart
8. ❌ Add date range filtering
9. ❌ Add regional filtering (click SVG regions)
10. ❌ Link to headlines page

**Reference:** Old site `dashboard-trinidad.html`

---

### Phase 4: Report Form (Priority: MEDIUM)

**Goal:** Create crime reporting form

**Tasks:**
1. Create `src/pages/report.astro`
2. Add form fields:
   - Country dropdown (Trinidad, Guyana)
   - Crime type dropdown
   - Location/Address
   - Area/Town
   - Date/Time
   - Description (textarea)
   - Anonymous checkbox
   - Contact info (optional)
3. Integrate with Web3Forms or similar service
4. Add Cloudflare Turnstile CAPTCHA
5. Add form validation
6. Add success/error messages
7. Email notifications

**Reference:** Old site `report.html`

---

### Phase 5: Final Polish (Priority: LOW)

**Goal:** Match old site's UX and features exactly

**Tasks:**
1. Add loading states (shimmer loaders)
2. Add error states
3. Add empty states
4. Test all links
5. Test mobile responsiveness
6. Verify SEO metadata on all pages
7. Add Google Analytics
8. Add cookie consent
9. Performance optimization
10. Accessibility audit

---

## 📋 Detailed Task Breakdown

### IMMEDIATE NEXT STEPS (This Week)

#### Task 1: Update Navigation (1 hour)
**Files:** `src/layouts/Layout.astro`

**Changes:**
```astro
<!-- Desktop nav (line 82) -->
<nav id="mainNav" class="hidden md:flex items-center gap-6">
  <!-- Dashboard Dropdown -->
  <div class="relative dropdown">
    <button class="text-nav text-slate-700 hover:text-rose-600 font-medium">
      Dashboard ▼
    </button>
    <div class="dropdown-menu">
      <a href="/trinidad/dashboard">Trinidad & Tobago</a>
      <a href="/guyana/dashboard">Guyana</a>
    </div>
  </div>

  <!-- Headlines Dropdown -->
  <div class="relative dropdown">
    <button class="text-nav text-slate-700 hover:text-rose-600 font-medium">
      Headlines ▼
    </button>
    <div class="dropdown-menu">
      <a href="/trinidad/headlines">Trinidad & Tobago</a>
      <a href="/guyana/headlines">Guyana</a>
    </div>
  </div>

  <!-- Archives Dropdown -->
  <div class="relative dropdown">
    <button class="text-nav text-slate-700 hover:text-rose-600 font-medium">
      Archives ▼
    </button>
    <div class="dropdown-menu">
      <a href="/trinidad/archive">Trinidad & Tobago</a>
      <a href="/guyana/archive">Guyana</a>
    </div>
  </div>

  <a href="/about">About</a>
  <a href="/blog">Blog</a>
  <a href="/report" class="px-4 py-1.5 rounded-lg bg-rose-600 text-white">
    Report a Crime
  </a>
</nav>
```

**Add dropdown CSS:**
```css
<style>
  .dropdown:hover .dropdown-menu {
    display: block;
  }
  .dropdown-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    border-radius: 0.5rem;
    padding: 0.5rem 0;
    min-width: 200px;
    z-index: 50;
  }
  .dropdown-menu a {
    display: block;
    padding: 0.5rem 1rem;
    color: #334155;
    text-decoration: none;
  }
  .dropdown-menu a:hover {
    background: #fff1f2;
    color: #e11d48;
  }
</style>
```

---

#### Task 2: Create Headlines Page Template (2-3 hours)
**File:** `src/pages/trinidad/headlines.astro`

**Structure:**
```astro
---
import Layout from '../../layouts/Layout.astro';
import { getTrinidadCrimes } from '../../lib/crimeData';

const crimes = await getTrinidadCrimes();
const title = "Trinidad & Tobago Crime Headlines";
const description = "Latest crime reports and headlines for Trinidad & Tobago";
---

<Layout title={title} description={description}>
  <main class="container mx-auto px-4 py-8 max-w-7xl">
    <h1 class="text-display font-bold mb-4">Trinidad & Tobago Crime Headlines</h1>

    <!-- Filters -->
    <div class="filters mb-6">
      <!-- Date range, crime type, area filters -->
    </div>

    <!-- Table/Cards View -->
    <div class="crimes-list">
      {crimes.map(crime => (
        <div class="crime-card">
          <!-- Crime details -->
        </div>
      ))}
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <!-- Pagination controls -->
    </div>
  </main>
</Layout>
```

---

#### Task 3: Complete Trinidad Dashboard (4-6 hours)
**File:** `src/pages/trinidad/dashboard.astro`

**Add:**
1. Leaflet map initialization script
2. Statistics cards with real data
3. Chart.js integration for charts
4. Date filter functionality
5. Regional filter (SVG map clicks)

---

## 🎨 Design Consistency Checklist

All new pages must follow:
- ✅ Frosted glass cards (`bg-white/70 backdrop-blur-md`)
- ✅ Rose-600 primary color
- ✅ Slate grays for text
- ✅ Custom typography (`text-display`, `text-h1`, etc.)
- ✅ Consistent button styles (`px-4 py-1.5 min-h-[22px]`)
- ✅ Mobile-first responsive design
- ✅ Proper spacing and padding

---

## 📊 Success Criteria

### Week 1 (This Week)
- ✅ Navigation updated with dropdowns
- ✅ Trinidad headlines page created
- ✅ Guyana headlines page created

### Week 2
- ✅ Trinidad dashboard completed
- ✅ Guyana dashboard completed
- ✅ Report form created

### Week 3
- ✅ Final polish and testing
- ✅ Deploy to staging
- ✅ User acceptance testing
- ✅ Production deployment

---

## 🚀 Quick Win: Navigation Update

**You can do this now!**

1. Open `src/layouts/Layout.astro`
2. Find the desktop nav section (line ~82)
3. Replace single links with dropdown structure (code above)
4. Add dropdown CSS in `<style>` tag
5. Test in browser

**Estimated time:** 30-60 minutes
**Impact:** HIGH - Makes site navigation match old site immediately

---

## 💬 Questions to Answer Before Starting

1. **Headlines Page:** Table view or card view? (Old site uses table)
2. **Dashboard:** Keep Leaflet map or use different visualization?
3. **Report Form:** Same fields as old site or updated?
4. **Navigation:** Exact match to old site or improvements allowed?

---

**Next Step:** Update navigation to add dropdowns for Dashboard, Headlines, Archives

**After That:** Create headlines pages (Trinidad, Guyana)

**Then:** Complete dashboards
