# UX Navigation Audit: Crime Hotspots
**Date:** February 5, 2026
**Context:** 80%+ mobile traffic, 1,889+ pages, Trinidad-focused (single active country)

---

## Executive Summary

This audit compares the current site navigation against industry best practices from Nielsen Norman Group, Google Material Design, Apple HIG, and Baymard Institute. The goal: keep users browsing, exploring, and engaged.

**Overall Assessment:** The site has strong foundations (breadcrumbs, search, modals) but the mobile navigation pattern reduces discoverability by ~50% according to Nielsen Norman research. The biggest wins come from adding a **persistent bottom tab bar** and **reducing modal friction**.

---

## Current Navigation Architecture

### What You Have Now

| Component | Desktop | Mobile |
|-----------|---------|--------|
| **Primary Nav** | Header with modal buttons + direct links | Hamburger menu (slide-out) |
| **Quick Access** | N/A | Horizontal scrolling pills |
| **Section Selection** | Modal pickers (Dashboard, Headlines, etc.) | Same modals |
| **Breadcrumbs** | Full hierarchy | Full hierarchy (may wrap) |
| **Footer** | Utility links only | Utility links + search button |
| **Search** | Icon in header (Cmd+K) | Icon in header |
| **Bottom Nav** | None | None |

### User Flow (Current)

```
Homepage → Click Island → SectionPickerModal (8 options) → Section Page
                                    ↓
         OR: Header → Modal Button → Modal (1 island) → Section Page
```

**Tap count to reach Dashboard from Homepage:** 2-3 taps (island → modal → section)
**Tap count on mobile to reach Headlines from any page:** 2 taps (pill/hamburger → modal → select)

---

## Weakness Analysis

### CRITICAL: No Persistent Bottom Navigation

| Issue | Current | Best Practice |
|-------|---------|---------------|
| **Mobile nav visibility** | Hidden in hamburger + scrollable pills | Persistent bottom tab bar (always visible) |
| **Impact** | ~50% reduced discoverability (Nielsen Norman) | Direct access to 4-5 core sections |
| **Task completion** | Longer time to find content | Immediate access |

**Nielsen Norman Finding:** "Hamburger menus significantly decrease UX metrics. Hidden navigation means later discovery, longer task time, and higher perceived difficulty."

**Recommendation:** Add a persistent bottom tab bar with 4-5 core actions:
```
[Dashboard] [Headlines] [Areas] [Report] [More]
```

---

### HIGH: Modal Friction for Single-Country Navigation

| Issue | Current | Best Practice |
|-------|---------|---------------|
| **Section access** | Tap → Modal → Select Country → Navigate | Direct links (1 tap) |
| **Context** | Only Trinidad is active | Modals designed for future multi-country |
| **User experience** | 2+ taps for every major section | 1 tap |

**Problem:** Modals make sense when users need to choose between options. With only Trinidad active, the modals add friction without value.

**Recommendation (Short-term):** On Trinidad pages, make nav buttons direct links:
- "Headlines" → `/trinidad/headlines/` (not modal)
- "Dashboard" → `/trinidad/dashboard/` (not modal)

**Recommendation (Long-term):** Keep modals for homepage/non-country pages, use direct links within country sections.

---

### HIGH: Redundant Mobile Navigation Systems

| Issue | Current | Best Practice |
|-------|---------|---------------|
| **Mobile nav** | Pills (horizontal scroll) + Hamburger | Single, visible system |
| **Pills** | 8 items, horizontal scroll (hidden items) | 4-5 visible items |
| **Hamburger** | Same items as pills | Supplementary "more" menu only |

**Problem:** Users see pills → some are hidden → hamburger has same items → confusion about what's available.

**Baymard Finding:** "60% of mobile sites don't chunk navigation properly, causing overwhelm."

**Recommendation:** Replace pills + hamburger with persistent bottom tab bar:
- Bottom bar: 4-5 primary items (always visible)
- "More" tab opens full menu
- Remove horizontal pills entirely

---

### MEDIUM: No Active Section Indicator

| Issue | Current | Best Practice |
|-------|---------|---------------|
| **"Where am I?"** | Breadcrumbs only | Highlighted nav item + breadcrumbs |
| **Header** | No visual indication of current section | Active tab underlined/highlighted |

**Problem:** Users must read breadcrumbs to know their location. A glance at nav should show current section.

**Recommendation:**
- Desktop: Underline or highlight current section in header
- Mobile bottom bar: Fill/highlight active tab icon

---

### MEDIUM: Related Content is Generic

| Issue | Current | Best Practice |
|-------|---------|---------------|
| **Crime detail "Related Crimes"** | 3 generic links (archive, map, headlines) | Actual similar crimes (same area/type) |
| **Placement** | After content (desktop: sidebar) | Prominent, labeled by relationship |

**Current "Related Crimes" links:**
```
→ All crimes in [Month Year]
→ View [Region] on interactive map
→ Browse recent [CrimeType] incidents
```

**What users expect:**
```
Similar Crimes in [Area]          ← Actual crime cards
├─ [Murder - Feb 3]
├─ [Robbery - Feb 2]
└─ View all [Area] crimes →

Other [CrimeType] Nearby          ← Geographic discovery
├─ [Area 1 - 3 crimes]
└─ [Area 2 - 2 crimes]
```

**Nielsen Norman:** "Related content should be clearly labeled by relationship and show actual items, not just navigation links."

**Recommendation:**
1. Show 3-5 actual crime cards for same area
2. Add "View all crimes in [Area]" button
3. Show "Other areas with high [CrimeType]" section

---

### MEDIUM: Footer Missing Primary Navigation

| Issue | Current | Best Practice |
|-------|---------|---------------|
| **Footer links** | Utility only (About, FAQ, Privacy, etc.) | Primary + utility |
| **Primary sections** | Not in footer | Dashboard, Headlines, Archive, Areas |

**Problem:** Users who scroll to bottom hit a dead end for primary content.

**Current Footer Quick Links:**
- Archives
- About
- Methodology
- FAQ
- Privacy Policy
- Business Solutions

**Missing:**
- Dashboard
- Headlines
- Areas
- Report a Crime

**Recommendation:** Add primary section links to footer, possibly as a "Browse" column.

---

### MEDIUM: Search Not Prominent Enough

| Issue | Current | Best Practice |
|-------|---------|---------------|
| **Search visibility** | Small icon in header | Visible search box or prominent icon |
| **Keyboard shortcut** | Cmd+K (hidden) | Tooltip shows shortcut |
| **Mobile** | Icon only | Prominent icon or search bar |

**Recommendation:**
- Desktop: Show "Search..." placeholder text next to icon
- Mobile: Search icon in bottom tab bar (replaces less-used item)
- Tooltip: "Search (Ctrl+K)" already exists, good

---

### LOW: Breadcrumbs May Wrap on Mobile

| Issue | Current | Best Practice |
|-------|---------|---------------|
| **Long paths** | Full path shown | Truncate middle, show first + last |
| **Mobile** | May wrap to 2+ lines | Never wrap |

**Example (Current):**
```
Home / Trinidad & Tobago / Archive / 2026 / February / Murder in Port of Spain...
```

**On mobile (320px):** This wraps to 3 lines, taking valuable screen space.

**Recommendation:**
- Mobile: Show only `Trinidad > Archive > [Headline]`
- Or use `>` separators (more compact than `/`)
- Truncate middle segments

---

### LOW: No Trending/Popular Content Discovery

| Issue | Current | Best Practice |
|-------|---------|---------------|
| **Discovery hooks** | None | "Trending this week", "Most viewed areas" |
| **User retention** | Users find specific content, leave | Users discover more content, stay |

**Recommendation:** Add discovery sections to Dashboard or Headlines:
- "This Week's Most Viewed"
- "Trending Areas"
- "Breaking: Latest 3 crimes"

---

### LOW: Homepage Section Picker Has 8 Options

| Issue | Current | Best Practice |
|-------|---------|---------------|
| **Options shown** | 8 sections in modal | 4-6 chunked options |
| **Hierarchy** | Flat list | Prioritized by user need |

**Current SectionPickerModal options:**
1. Dashboard
2. Headlines
3. Archive
4. Areas
5. Compare
6. Statistics
7. Regions
8. Murder Count

**Problem:** 8 equal options can overwhelm. Users don't know where to start.

**Recommendation:**
- Show top 4 prominently (Dashboard, Headlines, Areas, Archive)
- Group others under "More Sections" expandable
- Or: Show only top 4, add "Explore More" link

---

## Priority Matrix

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| No persistent bottom nav | HIGH | MEDIUM | **P1** |
| Modal friction (single country) | HIGH | LOW | **P1** |
| Redundant mobile nav systems | HIGH | MEDIUM | **P1** |
| No active section indicator | MEDIUM | LOW | **P2** |
| Generic related content | MEDIUM | MEDIUM | **P2** |
| Footer missing primary nav | MEDIUM | LOW | **P2** |
| Search not prominent | LOW | LOW | **P3** |
| Breadcrumb wrapping | LOW | LOW | **P3** |
| No trending content | LOW | MEDIUM | **P3** |
| Section picker has 8 options | LOW | LOW | **P3** |

---

## Recommended Implementation Plan

### Phase 1: Bottom Tab Bar (P1)

**Goal:** Persistent, always-visible navigation for mobile

**Design:**
```
┌─────────────────────────────────────────────┐
│          [Page Content]                     │
│                                             │
├─────────────────────────────────────────────┤
│ [🏠]    [📰]    [📍]    [🚨]    [≡]        │
│ Home  Headlines Areas  Report  More        │
└─────────────────────────────────────────────┘
```

**Implementation:**
1. Create `BottomNav.astro` component
2. Include in `Layout.astro` (mobile only: `md:hidden`)
3. Highlight active section based on current path
4. "More" opens existing hamburger menu content

**Files to modify:**
- `src/components/BottomNav.astro` (new)
- `src/layouts/Layout.astro` (add component)
- `src/components/Header.astro` (remove redundant pills)

### Phase 2: Direct Links for Trinidad (P1)

**Goal:** Reduce modal friction when already in Trinidad section

**Implementation:**
1. In Header.astro: If on `/trinidad/*` path, use direct links instead of modals
2. Keep modals for homepage and non-country pages

**Code pattern:**
```astro
{isOnTrinidadPage ? (
  <a href="/trinidad/headlines/">Headlines</a>
) : (
  <button onclick="window.openHeadlinesModal()">Headlines</button>
)}
```

### Phase 3: Active Section Indicator (P2)

**Goal:** Show users their current section at a glance

**Implementation:**
1. Pass `currentSection` prop to Header
2. Style active nav item (underline or background)
3. Bottom tab bar: Fill active icon

### Phase 4: Enhanced Related Content (P2)

**Goal:** Show actual related crimes, not just generic links

**Implementation:**
1. In crime detail page, query crimes with same area
2. Display 3-5 crime cards in "Related Crimes" section
3. Add "View all [Area] crimes" button

### Phase 5: Footer Enhancement (P2)

**Goal:** Add primary navigation to footer

**Implementation:**
1. Add "Browse" column with Dashboard, Headlines, Areas, Archive
2. Keep existing utility links

---

## UX Best Practices Reference

### Nielsen Norman Group
- [Mobile Navigation Patterns](https://www.nngroup.com/articles/mobile-navigation-patterns/)
- [Hamburger Menus Hurt UX](https://www.nngroup.com/articles/hamburger-menus/)
- [Breadcrumb Guidelines](https://www.nngroup.com/articles/breadcrumbs/)
- [Related Content Guidelines](https://www.nngroup.com/articles/recommendation-guidelines/)

### Google Material Design
- [Navigation Components](https://m3.material.io/components/navigation-bar)
- [Bottom Navigation](https://m1.material.io/components/bottom-navigation.html)

### Apple Human Interface Guidelines
- [Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)

### Baymard Institute
- [E-commerce Navigation Best Practices](https://baymard.com/blog/ecommerce-navigation-best-practice)

---

## Success Metrics

After implementing changes, monitor:

1. **Pages per session** — Should increase (easier navigation)
2. **Bounce rate** — Should decrease (users find next steps)
3. **Time on site** — Should increase (more exploration)
4. **Search usage** — May decrease (if nav is clearer) or increase (if more prominent)
5. **Report submissions** — Should increase (easier access)

---

## Appendix: Current Site Map

```
/                           Homepage (island picker)
├── /trinidad/
│   ├── dashboard/          Crime stats + map
│   ├── headlines/          Filtered crime list
│   ├── archive/
│   │   ├── [year]/         Year archive
│   │   └── [year]/[month]/ Month archive
│   ├── areas/              All areas list
│   │   └── [slug]/         Individual area
│   ├── crime/
│   │   └── [slug]/         Individual crime (SSR)
│   ├── compare/            Compare areas
│   ├── statistics/         Yearly stats
│   ├── regions/            Regional breakdown
│   └── murder-count/       Murder tracker
├── /blog/                  Blog index
│   └── [slug]/             Blog post
├── /report/                Anonymous crime report
├── /about/                 About page
├── /faq/                   FAQ
├── /methodology/           Data methodology
├── /privacy/               Privacy policy
└── /business-solutions/    B2B page
```
