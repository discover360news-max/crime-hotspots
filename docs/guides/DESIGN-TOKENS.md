# Crime Hotspots Design Tokens

**Version:** 1.1
**Last Updated:** January 23, 2026
**Status:** Living Document

This document defines the design system for Crime Hotspots. All pages should follow these patterns for visual consistency.

---

## 🎨 Color Palette

### Primary Colors
```css
/* Accent (All CTAs, Links, Active States) */
Rose-600: #e11d48
Rose-700: #be123c (hover states)
Rose-50:  #fff1f2 (subtle backgrounds)

/* Text Colors */
Slate-700: #334155 (primary text)
Slate-600: #475569 (secondary text)
Slate-500: #64748b (tertiary text)
Slate-400: #94a3b8 (supporting text)

/* Backgrounds */
Slate-100: #f1f5f9 (page backgrounds)
Slate-50:  #f8fafc (card backgrounds)
White:     #ffffff (containers)
```

### Color Usage Rules
- **Rose-600:** All primary CTAs, links, active filter states, error states
- **Slate-700:** All H1-H3 headings, primary body text
- **Slate-400/500:** Supporting text, captions, metadata
- **Never use:** Blue, green, yellow (except for crime type indicators)

---

## 🔘 Button System

### Primary CTA (Most Important Action)
```html
<button class="px-4 py-1.5 min-h-[22px] bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium text-small">
  Primary Action
</button>
```
**Use for:** Form submissions, "Apply" filters, "Report Crime", main navigation CTAs

### Secondary CTA (Alternative Action)
```html
<button class="px-4 py-1.5 min-h-[22px] border-2 border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50 transition font-medium text-small">
  Secondary Action
</button>
```
**Use for:** "View Headlines", "View Dashboard", cancel actions

### Large/Emphasis Button (Page-Level Actions)
```html
<button class="px-6 py-2.5 min-h-[30px] bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium text-small">
  Load More
</button>
```
**Use for:** "Load More", "Submit Report", "Get Started" (page-level CTAs that need extra weight)

### Subtle/Text Button (Low Priority)
```html
<button class="text-rose-600 hover:text-rose-700 underline text-small font-medium">
  Clear Filters
</button>
```
**Use for:** "Clear", "Reset", "Cancel" (destructive or low-priority actions)

### Neutral Button (Non-Critical Actions)
```html
<button class="px-4 py-1.5 min-h-[22px] bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-medium text-small transition">
  Clear
</button>
```
**Use for:** "Clear" date filters, "Show All" regions

### Button Sizing Guide
| Variant | Padding | Min Height | Use Case |
|---------|---------|-----------|----------|
| Standard | `px-4 py-1.5` | `min-h-[22px]` | Most buttons |
| Large | `px-6 py-2.5` | `min-h-[30px]` | Page-level CTAs |
| Compact | `px-3 py-1.5` | `min-h-[22px]` | Mobile/tight spaces |

---

## 📝 Typography System

### Size Classes (from styles.css)
```css
.text-display  /* 36px/28px (desktop/mobile) - Page titles */
.text-h1       /* 32px/24px - Main headings */
.text-h2       /* 24px/20px - Section headings */
.text-h3       /* 20px/18px - Subsection headings */
.text-body     /* 16px/15px - Body text */
.text-small    /* 14px/13px - Supporting text */
.text-tiny     /* 12px - Labels, metadata */
.text-nav      /* 15px - Navigation items */
```

### Typography Usage Rules

#### Headings
```html
<!-- Page Title (H1) -->
<h1 class="text-display font-bold text-slate-700">Trinidad & Tobago</h1>

<!-- Section Title (H2) -->
<h2 class="text-h2 font-bold text-slate-700">Crime Statistics Dashboard</h2>

<!-- Subsection (H3) -->
<h3 class="text-h3 font-semibold text-slate-600">Real-Time Data</h3>
```

**Rule:** All headings should have `text-slate-700` or `text-slate-600` (never default to black)

#### Body Text
```html
<!-- Standard paragraph -->
<p class="text-body text-slate-400 font-medium">Select a region to view and filter</p>

<!-- Supporting/caption text -->
<p class="text-small text-slate-400">Dashboard updates automatically with the latest crime statistics</p>

<!-- Metadata/labels -->
<p class="text-tiny text-slate-500">Data sources: Verified news outlets</p>
```

#### Form Labels
```html
<label for="startDate" class="text-slate-600 font-medium text-tiny">From:</label>
```

---

## 🪟 Frosted Glass Containers

### Opacity Scale (Background to Foreground)
```html
<!-- Level 1: Background Containers (Most Subtle) -->
<div class="bg-white/25 backdrop-blur-md">
  <!-- Use for: Dashboard background panels, map containers -->
</div>

<!-- Level 2: Content Cards (Medium Prominence) -->
<div class="bg-white/50 backdrop-blur-md">
  <!-- Use for: Info cards, metric widgets, statistics panels -->
</div>

<!-- Level 3: Modals (High Prominence) -->
<div class="bg-white/70 backdrop-blur-md">
  <!-- Use for: Article preview modals, lightboxes -->
</div>

<!-- Level 4: Slide Trays (Highest Prominence) -->
<div class="bg-white/80 backdrop-blur-lg">
  <!-- Use for: Mobile region selector, navigation trays -->
</div>
```

### When to Use Frosted Glass
- ✅ **Use for:** Containers over background images, overlays, cards with depth
- ❌ **Don't use for:** Plain white backgrounds (use `bg-white` instead), text containers

### Shadow Pairing
```html
<!-- Light shadow (cards) -->
<div class="bg-white/50 backdrop-blur-md rounded-lg shadow-md">

<!-- Medium shadow (panels) -->
<div class="bg-white/25 backdrop-blur-md rounded-xl shadow-lg">

<!-- Heavy shadow (modals) -->
<div class="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl">
```

---

## 📐 Spacing & Layout

### Container Padding
```html
<!-- Page containers -->
<main class="container mx-auto px-4 py-6 max-w-7xl">

<!-- Card padding -->
<div class="p-4">  <!-- Standard -->
<div class="p-6">  <!-- Spacious -->

<!-- Section padding -->
<div class="py-8">  <!-- Vertical only -->
```

### Border Radius
```css
rounded-lg   /* 8px - Standard (buttons, inputs, cards) */
rounded-xl   /* 12px - Large (panels, containers) */
rounded-2xl  /* 16px - Extra large (modals, slide trays) */
rounded-md   /* 6px - DEPRECATED (being phased out, use rounded-lg) */
```

**Rule:** Use `rounded-lg` as default, `rounded-xl` for containers, `rounded-2xl` for modals

---

## 🖼️ Background Treatment

### Page Background Pattern (Trinidad/Guyana Pages)
```css
body {
  background-image:
    /* Gradient fade (top to bottom) */
    linear-gradient(to bottom,
      rgba(241, 245, 249, 0) 0%,      /* Image fully visible */
      rgba(241, 245, 249, 0.5) 5%,   /* Midway fade */
      #f1f5f9 25%                     /* Image fully hidden */
    ),
    /* Background image */
    url('/assets/images/trinidad-page-bg.png');

  background-repeat: no-repeat;
  background-position: top center;
  background-size: 100% auto;
  background-attachment: fixed;
}
```

**Why This Works:**
- Image visible at top (branding)
- Fades smoothly into solid color (prevents text readability issues)
- Fixed attachment creates parallax effect

---

## 🧭 Breadcrumb Rules

**Country label must always be the full name:**
- Trinidad pages: `{ label: 'Trinidad & Tobago', href: '/trinidad/dashboard' }` — NEVER just "Trinidad"
- The folder path is `/trinidad/` but the display label is always "Trinidad & Tobago" (the two islands together)

**Standard pattern for Trinidad pages:**
```astro
<Breadcrumbs items={[
  { label: 'Home', href: '/' },
  { label: 'Trinidad & Tobago', href: '/trinidad/dashboard' },
  { label: 'Page Name' }
]} />
```

---

## 🎭 Hero Sections

### Full-Width Gradient Hero (Enterprise/Landing Pages)
```html
<!-- Breadcrumbs (Above Hero) -->
<div class="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4">
  <Breadcrumbs items={[
    { label: 'Home', href: '/' },
    { label: 'Trinidad & Tobago', href: '/trinidad/dashboard' },
    { label: 'Page Title' }
  ]} />
</div>

<!-- Hero Section (Full Width) -->
<section class="w-full bg-gradient-to-br from-rose-50 via-white to-slate-50 py-12 sm:py-20 px-4">
  <div class="max-w-4xl mx-auto text-center">
    <!-- Main Headline -->
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-4 sm:mb-6 leading-tight">
      Main Value Proposition Headline
    </h1>

    <!-- Subheadline -->
    <p class="text-base sm:text-lg text-slate-600 mb-6 max-w-3xl mx-auto leading-relaxed">
      Supporting description that expands on the value proposition.
      Keep it concise but compelling.
    </p>

    <!-- CTAs -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
      <!-- Primary CTA -->
      <a
        href="#section"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 transition text-sm font-medium shadow-lg hover:shadow-xl min-h-[44px]"
      >
        Primary Action
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </a>

      <!-- Secondary CTA -->
      <a
        href="mailto:discover360news@gmail.com?subject=Inquiry"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 hover:border-rose-600 hover:text-rose-600 active:bg-rose-50 transition text-sm font-medium min-h-[44px]"
      >
        Secondary Action
      </a>
    </div>
  </div>
</section>
```

### Hero Usage Rules
- **Use for:** Landing pages, business pages, major feature announcements
- **Gradient:** `from-rose-50 via-white to-slate-50` (subtle, professional)
- **Typography Scale:** `text-3xl` (mobile) → `text-4xl` (tablet) → `text-5xl` (desktop)
- **Subtitle Color:** `text-slate-600` (not 700, for hierarchy)
- **CTA Hierarchy:** Primary (solid rose-600) + Secondary (outlined slate-300)
- **Spacing:** `py-12 sm:py-20` (breathing room on hero)

### Hero Button Sizing
Hero CTAs use larger sizing than standard buttons:
```html
<!-- Hero Primary CTA -->
<a class="px-6 py-3 min-h-[44px] bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition text-sm font-medium shadow-lg hover:shadow-xl">

<!-- Hero Secondary CTA -->
<a class="px-6 py-3 min-h-[44px] border-2 border-slate-300 text-slate-700 rounded-lg hover:border-rose-600 hover:text-rose-600 transition text-sm font-medium">
```

**Why Larger?** Hero CTAs need more visual weight to match the scale of large headlines.

---

## 📋 Form Inputs

### Text Inputs & Date Pickers
```html
<input
  type="date"
  class="px-3 py-1.5 min-h-[22px] rounded-lg border border-slate-300 text-slate-500 text-tiny focus:ring-2 focus:ring-rose-300 outline-none"
>
```

### Select Dropdowns
```html
<select class="px-3 py-1.5 min-h-[22px] rounded-lg border border-slate-300 bg-white text-tiny focus:ring-2 focus:ring-rose-500 focus:border-rose-500">
  <option value="">All Areas</option>
</select>
```

### Form Input Rules
- **Padding:** `px-3 py-1.5`
- **Min Height:** `min-h-[22px]` (ensures touch target)
- **Border Radius:** `rounded-lg` (not `rounded-md`)
- **Focus State:** `focus:ring-2 focus:ring-rose-300`
- **Text Size:** `text-tiny` for inputs, `text-small` for labels

---

## 🎯 Active States & Feedback

### Filter Active State
```html
<!-- Active filter badge -->
<span class="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-tiny font-medium">
  Port of Spain
  <button class="hover:text-rose-900">×</button>
</span>
```

### Loading Skeleton
```html
<div class="skeleton skeleton-metric"></div>
<div class="skeleton skeleton-chart"></div>
<div class="skeleton skeleton-map"></div>
```

**Note:** Skeleton classes defined in `src/css/styles.css`

### Hover States
- **Buttons:** `hover:bg-rose-700` (primary), `hover:bg-rose-50` (outline)
- **Links:** `hover:text-rose-700`
- **Cards:** `hover:shadow-lg transition-shadow`

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This
```html
<!-- Wrong: Mixing button sizes -->
<button class="px-6 py-2">  <!-- Non-standard -->

<!-- Wrong: Using rounded-md (deprecated) -->
<div class="rounded-md">  <!-- Use rounded-lg instead -->

<!-- Wrong: Missing text color on headings -->
<h1 class="text-h1 font-bold">  <!-- Add text-slate-700 -->

<!-- Wrong: Using default black text -->
<p>Some text</p>  <!-- Add text-slate-400 or text-slate-700 -->

<!-- Wrong: Inconsistent frosted glass opacity -->
<div class="bg-white/60 backdrop-blur-md">  <!-- Use 25/50/70/80 scale -->
```

### ✅ Do This Instead
```html
<!-- Correct: Standard button size -->
<button class="px-4 py-1.5 min-h-[22px]">

<!-- Correct: Modern border radius -->
<div class="rounded-lg">

<!-- Correct: Explicit heading color -->
<h1 class="text-h1 font-bold text-slate-700">

<!-- Correct: Consistent text color -->
<p class="text-body text-slate-400">

<!-- Correct: Follow opacity scale -->
<div class="bg-white/50 backdrop-blur-md">
```

---

## 💬 InfoPopup Pattern

The `InfoPopup` component (`src/components/InfoPopup.astro`) provides contextual help across the site. All instances must follow these rules for visual consistency.

### Container (Handled by Component)
```html
<!-- Trigger: Circle info icon -->
<button class="cursor-pointer p-1 rounded hover:bg-slate-100 active:bg-slate-200 transition">
  <svg class="w-5 h-5 text-slate-500 hover:text-slate-700 transition"><!-- info circle --></svg>
</button>

<!-- Overlay -->
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]">

<!-- Content Card -->
<div class="absolute top-4 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] md:w-auto md:max-w-md bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-8">

<!-- Close Button -->
<button class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition text-slate-500 hover:text-slate-700">
```

**Container Rules:**
- Frosted glass: `bg-white/80` (Level 3 opacity)
- Border radius: `rounded-2xl` (modal-level)
- Padding: `p-8` (spacious, content-focused)
- Z-index: `z-[9999]` (above all other overlays)
- Content wrapper: `text-sm text-slate-600 pr-6` (right padding for close button clearance)

### Content Styling (Passed via Slot)

**Main Title:**
```html
<p class="font-semibold mb-2 text-rose-700">Section Title</p>
```
- **Always `text-rose-700`** — rose accent provides visual hierarchy and brand consistency
- Never `text-slate-700` for the main title (that's for body headings, not popup titles)

**Body Text:**
```html
<p class="mb-3">Descriptive text inherits text-sm text-slate-600 from wrapper.</p>
```

**Subheadings (within popup):**
```html
<p class="font-semibold mb-2 text-rose-700">Subsection Title</p>
```
- Use `text-rose-700` for subheadings within the same popup to maintain hierarchy

**Lists:**
```html
<ul class="list-disc list-inside space-y-1">
  <li><span class="font-medium text-slate-700">Bold Term</span> — Description text</li>
</ul>
```

**Feature Cards (optional, for richer popups):**
```html
<div class="p-4">
  <div class="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-3">
    <svg class="w-6 h-6 text-slate-500"><!-- icon --></svg>
  </div>
  <h3 class="text-nav font-semibold text-rose-600 mb-2">Feature Name</h3>
  <p class="text-small text-slate-500">Feature description</p>
</div>
```

**CTA Button (optional, at bottom of popup):**
```html
<div class="mt-8">
  <a href="/link" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white active:bg-rose-700 transition text-xs font-medium">
    Action Text
    <svg class="w-4 h-4"><!-- arrow --></svg>
  </a>
</div>
```

### Content Variants

| Variant | When to Use | Example |
|---------|-------------|---------|
| **Rich** (icons + cards) | Marketing/informational popups on landing pages | Homepage "Verified Crime Intelligence" |
| **Reference** (title + list) | Definition lists, glossaries, how-to guides | Dashboard "Crime Type Definitions" |
| **Instructional** (title + steps) | Feature explanations with ordered/unordered lists | Dashboard "Understanding the Map" |

**All variants share:** `text-rose-700` main title, `text-sm text-slate-600` body, `text-slate-700` for bold terms in lists.

### Common Mistakes
```html
<!-- Wrong: Slate title (inconsistent with brand) -->
<p class="font-semibold mb-2 text-slate-700">Title</p>

<!-- Correct: Rose accent title -->
<p class="font-semibold mb-2 text-rose-700">Title</p>

<!-- Wrong: Missing text class on body paragraphs -->
<p class="mb-3">Some description</p>

<!-- Correct: Explicit or inherited (wrapper provides text-sm text-slate-600) -->
<p class="mb-3">Some description</p>  <!-- OK if inside the component slot -->
<p class="text-small text-slate-500">Supporting text</p>  <!-- For secondary text -->
```

---

## 🔧 Known Issues to Fix

### Current Inconsistencies (as of Dec 9, 2025)

1. **headlines-trinidad-and-tobago.html line 184**
   - ❌ `<option>Siezure</option>`
   - ✅ Should be: `<option>Seizures</option>`

2. **headlines-trinidad-and-tobago.html line 157**
   - ❌ `<h1 class="text-h1 font-bold mb-3">`
   - ✅ Should be: `<h1 class="text-h1 font-bold text-slate-700 mb-3">`

3. **headlines-trinidad-and-tobago.html line 166**
   - ❌ `class="...rounded-md..."`
   - ✅ Should be: `class="...rounded-lg..."`

---

## 📖 Quick Reference Cheatsheet

### Copy-Paste Components

**Primary Button:**
```html
<button class="px-4 py-1.5 min-h-[22px] bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium text-small">Action</button>
```

**Secondary Button:**
```html
<button class="px-4 py-1.5 min-h-[22px] border-2 border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50 transition font-medium text-small">Action</button>
```

**Frosted Card:**
```html
<div class="bg-white/50 backdrop-blur-md rounded-lg shadow-md p-4">
  <h3 class="text-h3 font-semibold text-slate-600 mb-2">Title</h3>
  <p class="text-small text-slate-400">Description</p>
</div>
```

**InfoPopup Content (slot):**
```html
<InfoPopup id="unique-id">
  <p class="font-semibold mb-2 text-rose-700">Section Title</p>
  <p class="mb-3">Body text (inherits text-sm text-slate-600).</p>
  <p class="font-semibold mb-2 text-rose-700">Subsection</p>
  <ul class="list-disc list-inside space-y-1">
    <li><span class="font-medium text-slate-700">Term</span> — Definition</li>
  </ul>
</InfoPopup>
```

**Text Input:**
```html
<input type="text" class="px-3 py-1.5 min-h-[22px] rounded-lg border border-slate-300 text-tiny focus:ring-2 focus:ring-rose-300 outline-none">
```

**Select Dropdown:**
```html
<select class="px-3 py-1.5 min-h-[22px] rounded-lg border border-slate-300 bg-white text-tiny focus:ring-2 focus:ring-rose-500">
  <option>Option</option>
</select>
```

**Hero Section (Full-Width Gradient):**
```html
<section class="w-full bg-gradient-to-br from-rose-50 via-white to-slate-50 py-12 sm:py-20 px-4">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-4 sm:mb-6 leading-tight">
      Headline
    </h1>
    <p class="text-base sm:text-lg text-slate-600 mb-6 max-w-3xl mx-auto leading-relaxed">
      Subheadline
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
      <a href="#" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition text-sm font-medium shadow-lg min-h-[44px]">
        Primary Action
      </a>
      <a href="#" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 hover:border-rose-600 hover:text-rose-600 transition text-sm font-medium min-h-[44px]">
        Secondary Action
      </a>
    </div>
  </div>
</section>
```

---

## 🎨 Design Philosophy

**Crime Hotspots Visual Identity:**
- **Data-First:** Design doesn't compete with content
- **Modern & Clean:** Frosted glass, subtle shadows, minimal decoration
- **Professional:** Slate grays convey seriousness and authority
- **Urgent:** Rose accent color signals importance without being alarmist
- **Accessible:** High contrast, clear hierarchy, touch-friendly targets

---

## 📝 Maintenance Notes

**Before Adding New Pages:**
1. Copy button patterns from this file (don't create new variants)
2. Use frosted glass opacity scale (25/50/70/80 only)
3. All headings must have `text-slate-700` or `text-slate-600`
4. Form inputs use `rounded-lg`, not `rounded-md`
5. Test on mobile (ensure `min-h-[22px]` on all interactive elements)

**When Updating Existing Pages:**
1. Run audit for `rounded-md` → replace with `rounded-lg`
2. Check all H1-H3 have explicit text color
3. Verify button sizing matches standard patterns
4. Ensure form inputs follow the established pattern

---

**Version History:**
- **v1.2 (Feb 10, 2026):** Added InfoPopup pattern (container + content styling rules, three content variants)
- **v1.1 (Jan 23, 2026):** Added Hero Sections pattern (full-width gradient hero with enterprise CTAs)
- **v1.0 (Dec 9, 2025):** Initial documentation based on index.html, dashboard-trinidad.html, and headlines-trinidad-and-tobago.html patterns
