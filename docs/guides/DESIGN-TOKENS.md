# Crime Hotspots Design Tokens

**Version:** 1.5
**Last Updated:** February 17, 2026
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

## 🌙 Dark Mode System

**Implemented:** February 17, 2026 — Dark is the **default** experience.

### Strategy

- **Class-based** (`@variant dark (&:is(.dark, .dark *));` in `Layout.astro` global styles)
- `<html class="dark">` = dark mode (server-rendered default)
- Removing `.dark` = light mode (JS toggle)
- **Anti-flash inline script** in `<head>` reads `localStorage` and applies `.dark` before paint
- **localStorage key:** `crimehotspots-theme` — `'light'` = light, anything else = dark

### HSL Neutral Palette (no blue tinting)

| Token | Dark value | Light value |
|-------|-----------|------------|
| Page background | `hsl(0 0% 3%)` | `hsl(0 0% 94%)` |
| Surface / header | `hsl(0 0% 5%)`–`hsl(0 0% 8%)` | `hsl(0 0% 100%)` |
| Card background | `hsl(0 0% 8%)`–`hsl(0 0% 10%)` | `hsl(0 0% 100%)` |
| Primary text | `hsl(0 0% 92%)` | `hsl(0 0% 20%)` |
| Muted text | `hsl(0 0% 70%)` | `hsl(0 0% 45%)` |
| Faint text | `hsl(0 0% 55%)` | `hsl(0 0% 59%)` |
| Strong text | `hsl(0 0% 95%)` | `hsl(0 0% 12%)` |
| Border | `hsl(0 0% 18%)` | `hsl(0 0% 88%)` |
| Subtle border | `hsl(0 0% 22%)` | `hsl(0 0% 80%)` |

Rose-600/700/800 accents: **unchanged** — visible in both modes.

### CSS Custom Properties (for JS-generated HTML)

Defined in `Layout.astro` `<style is:global>`. Use these in JS template literals where Tailwind `dark:` classes can't be scanned at build time (e.g., `modalHtmlGenerators.ts` runtime-built strings, `headlines.astro` `<script define:vars>` blocks):

```css
:root {
  --ch-bg: hsl(0 0% 94%);      /* page background */
  --ch-surface: hsl(0 0% 100%); /* card/surface background */
  --ch-text: hsl(0 0% 20%);    /* primary text */
  --ch-text-muted: hsl(0 0% 45%); /* muted text */
  --ch-border: hsl(0 0% 88%);  /* border color */
}
.dark {
  --ch-bg: hsl(0 0% 3%);
  --ch-surface: hsl(0 0% 8%);
  --ch-text: hsl(0 0% 92%);
  --ch-text-muted: hsl(0 0% 70%);
  --ch-border: hsl(0 0% 18%);
}
```

**Usage in JS:**
```js
`<div style="background:var(--ch-surface);border:1px solid var(--ch-border);color:var(--ch-text)">`
```

### Toggle Script

Located in `Layout.astro` just before `</body>` as `<script is:inline>`. Exposes `window.toggleTheme()`.

- **Sun icon** (`id="themeIconSun*"`) — shown in dark mode (click → go light)
- **Moon icon** (`id="themeIconMoon*"`) — shown in light mode (click → go dark)
- Toggle buttons: `id="themeToggleDesktop"` in Header, `id="moreMenuThemeToggle"` in BottomNav More menu

### Dark Mode Tailwind Class Rules

**When `dark:` classes work** (Tailwind scans these at build time):
- `.astro` component files
- `.ts` source modules (static string literals)

**When `dark:` classes DON'T work** — use CSS vars instead:
- `<script define:vars>` runtime template literals
- Any HTML built as a runtime string from data

### Safety Context Colors (Dark)

| Level | Background | Border | Title | Icon |
|-------|-----------|--------|-------|------|
| High (>7) | `dark:bg-amber-950/50` | `dark:border-amber-800/60` | `dark:text-amber-300` | `dark:text-amber-400` |
| Neutral (4-6) | `dark:bg-[hsl(0_0%_6%)]` | `dark:border-[hsl(0_0%_18%)]` | `dark:text-[hsl(0_0%_85%)]` | `dark:text-[hsl(0_0%_55%)]` |
| Low (<4) | `dark:bg-emerald-950/50` | `dark:border-emerald-800/60` | `dark:text-emerald-300` | `dark:text-emerald-400` |

---

## 🔘 Button System

### Primary CTA (Most Important Action)
```html
<button class="px-4 py-1.5 min-h-button bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-bold text-caption">
  Primary Action
</button>
```
**Use for:** Form submissions, "Apply" filters, "Report Crime", main navigation CTAs

### Secondary CTA (Alternative Action)
```html
<button class="px-4 py-1.5 min-h-button border-2 border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50 transition font-bold text-caption">
  Secondary Action
</button>
```
**Use for:** "View Headlines", "View Dashboard", cancel actions

### Large/Emphasis Button (Page-Level Actions)
```html
<button class="px-6 py-2.5 min-h-30 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-bold text-caption">
  Load More
</button>
```
**Use for:** "Load More", "Submit Report", "Get Started" (page-level CTAs that need extra weight)

### Subtle/Text Button (Low Priority)
```html
<button class="text-rose-600 hover:text-rose-700 underline text-caption font-bold">
  Clear Filters
</button>
```
**Use for:** "Clear", "Reset", "Cancel" (destructive or low-priority actions)

### Neutral Button (Non-Critical Actions)
```html
<button class="px-4 py-1.5 min-h-button bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-bold text-caption transition">
  Clear
</button>
```
**Use for:** "Clear" date filters, "Show All" regions

### Button Sizing Guide
| Variant | Padding | Min Height | Use Case |
|---------|---------|-----------|----------|
| Standard | `px-4 py-1.5` | `min-h-button` (22px) | Most buttons |
| Large | `px-6 py-2.5` | `min-h-30` (30px) | Page-level CTAs |
| Compact | `px-3 py-1.5` | `min-h-button` (22px) | Mobile/tight spaces |

---

## 📝 Typography System

### Strict 4-Level Scale (as of Feb 17, 2026)

| Token | Size | Line Height | Use |
|-------|------|-------------|-----|
| `text-display` | 32px (2rem) | `leading-tight` (1.2) | Hero text, page H1 titles |
| `text-heading` | 22px (1.375rem) | `leading-snug` (1.35) | Section H2/H3, card titles |
| `text-body` | 18px (1.125rem) | `leading-relaxed` (1.65) | All reading text, nav items |
| `text-caption` | 12px (0.75rem) | `leading-snug` (1.35) | Metadata, badges, timestamps, nav labels, buttons |

**2 font weights only:** `font-normal` (400) and `font-bold` (700). Never use `font-semibold` on headings.

**Migration from old tokens:**
- `text-h1`, `text-display` (old 36px) → `text-display`
- `text-h2`, `text-h3` → `text-heading`
- `text-small`, `text-tiny`, `text-nav` → `text-caption`
- `text-body` stays but is now **18px** (was 16px)

### Typography Usage Rules

#### Headings
```html
<!-- Page Title (H1) -->
<h1 class="text-display font-bold text-slate-700 leading-tight">Trinidad & Tobago</h1>

<!-- Section Title (H2) -->
<h2 class="text-heading font-bold text-slate-700 leading-snug">Crime Statistics Dashboard</h2>

<!-- Subsection (H3) -->
<h3 class="text-heading font-bold text-slate-600 leading-snug">Real-Time Data</h3>
```

**Rules:**
- All headings must have an explicit text color (`text-slate-700` or `text-slate-600`)
- All headings must have an explicit `leading-*` class (`leading-tight` for H1, `leading-snug` for H2/H3)
- Never use `font-semibold` — use `font-bold`

#### Body Text
```html
<!-- Standard paragraph -->
<p class="text-body text-slate-700">Select a region to view and filter</p>

<!-- Supporting/caption text -->
<p class="text-caption text-slate-400">Dashboard updates automatically with the latest crime statistics</p>

<!-- Metadata/labels -->
<p class="text-caption text-slate-500">Data sources: Verified news outlets</p>
```

#### Form Labels
```html
<label for="startDate" class="text-caption text-slate-600 font-bold">From:</label>
```

---

## 🪟 Frosted Glass Containers

### Opacity Scale (Background to Foreground)
```html
<!-- Level 1: Background Containers (Most Subtle) -->
<div class="bg-white/25 backdrop-blur-md">
  <!-- Use for: Dashboard background panels, map containers -->
</div>

<!-- Level 2: Content Cards (Standard) -->
<div class="bg-white/85 backdrop-blur-md">
  <!-- Use for: Crime cards, info cards, metric widgets — ALL standard cards use /85 -->
</div>

<!-- Level 3: Modals (High Prominence) -->
<div class="bg-white/85 backdrop-blur-md">
  <!-- Use for: Article preview modals, lightboxes -->
</div>

<!-- Level 4: Slide Trays (Highest Prominence) -->
<div class="bg-white/85 backdrop-blur-lg">
  <!-- Use for: Mobile region selector, navigation trays -->
</div>
```

**Rule (Feb 2026):** All cards standardized to `bg-white/85`. Do not use `/70`, `/80`, or `/90` on cards — those are inconsistent.

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
<div class="bg-white/85 backdrop-blur-md rounded-2xl shadow-xl">
```

### Floor Shadow (Elevation Effect)

Used to make elements appear to hover above a surface. Creates a soft elliptical shadow beneath the element.

```css
/* Floor shadow via pseudo-element */
.element {
  position: relative;
}

.element::after {
  content: '';
  position: absolute;
  bottom: -36px;             /* Distance from element — higher = more "float" */
  left: 50%;
  transform: translateX(-50%);
  width: 80%;                /* Narrower than element for natural perspective */
  height: 24px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.18) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}
```

**Currently used on:** FlipCounter (murder count page)

**Rules:**

- Shadow width should be narrower than the element (`80%`) for natural perspective
- Use `pointer-events: none` so shadow doesn't block clicks
- Add extra bottom padding on the parent container to give the shadow room

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
rounded      /* 8px (DEFAULT) - tight use cases */
rounded-lg   /* 12px - Standard (buttons, inputs, cards) */
rounded-xl   /* 16px - Large (panels, containers) */
rounded-2xl  /* 24px - Extra large (modals, slide trays) */
rounded-md   /* DEPRECATED - use rounded-lg instead */
```

**Rule:** Use `rounded-lg` as default, `rounded-xl` for containers, `rounded-2xl` for modals

**Note (Feb 2026):** `rounded-lg` was updated from 8px → 12px in tailwind.config.mjs. `rounded` (DEFAULT) is 8px.

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
  class="px-3 py-1.5 min-h-button rounded-lg border border-slate-300 text-slate-500 text-caption focus:ring-2 focus:ring-rose-300 outline-none"
>
```

### Select Dropdowns
```html
<select class="px-3 py-1.5 min-h-button rounded-lg border border-slate-300 bg-white text-caption focus:ring-2 focus:ring-rose-500 focus:border-rose-500">
  <option value="">All Areas</option>
</select>
```

### Form Input Rules
- **Padding:** `px-3 py-1.5`
- **Min Height:** `min-h-button` (22px named token — ensures touch target)
- **Border Radius:** `rounded-lg` (not `rounded-md`)
- **Focus State:** `focus:ring-2 focus:ring-rose-300`
- **Text Size:** `text-caption` for inputs and labels

---

## 🎯 Active States & Feedback

### Filter Active State
```html
<!-- Active filter badge -->
<span class="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-caption font-bold">
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
<!-- Wrong: Non-standard button sizing -->
<button class="px-6 py-2">

<!-- Wrong: Deprecated radius -->
<div class="rounded-md">  <!-- Use rounded-lg -->

<!-- Wrong: Old type tokens -->
<h1 class="text-h1 font-semibold">
<p class="text-caption text-slate-400">
<span class="text-tiny">

<!-- Wrong: Missing leading on headings -->
<h1 class="text-display font-bold text-slate-700">

<!-- Wrong: Inconsistent card opacity -->
<div class="bg-white/70 backdrop-blur-md">
<div class="bg-white/80 backdrop-blur-md">

<!-- Wrong: gray-* instead of slate-* -->
<p class="text-gray-500">
```

### ✅ Do This Instead
```html
<!-- Correct: Named token, font-bold -->
<button class="px-4 py-1.5 min-h-button text-caption font-bold">

<!-- Correct: Modern border radius -->
<div class="rounded-lg">

<!-- Correct: New type tokens with leading -->
<h1 class="text-display font-bold text-slate-700 leading-tight">
<h2 class="text-heading font-bold text-slate-700 leading-snug">
<p class="text-caption text-slate-400">

<!-- Correct: Standardized card opacity -->
<div class="bg-white/85 backdrop-blur-md">

<!-- Correct: slate-* only -->
<p class="text-slate-500">
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
  <h3 class="text-caption font-bold text-rose-600 mb-2">Feature Name</h3>
  <p class="text-caption text-slate-500">Feature description</p>
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
<p class="text-caption text-slate-500">Supporting text</p>  <!-- For secondary text -->
```

---

---

## 📖 Quick Reference Cheatsheet

### Copy-Paste Components

**Primary Button:**
```html
<button class="px-4 py-1.5 min-h-button bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-bold text-caption">Action</button>
```

**Secondary Button:**
```html
<button class="px-4 py-1.5 min-h-button border-2 border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50 transition font-bold text-caption">Action</button>
```

**Frosted Card:**
```html
<div class="bg-white/85 backdrop-blur-md rounded-lg shadow-md p-4">
  <h3 class="text-heading font-bold text-slate-700 leading-snug mb-2">Title</h3>
  <p class="text-caption text-slate-400">Description</p>
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
<input type="text" class="px-3 py-1.5 min-h-button rounded-lg border border-slate-300 text-caption focus:ring-2 focus:ring-rose-300 outline-none">
```

**Select Dropdown:**
```html
<select class="px-3 py-1.5 min-h-button rounded-lg border border-slate-300 bg-white text-caption focus:ring-2 focus:ring-rose-500">
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
5. Test on mobile (ensure `min-h-button` on all interactive elements)

**When Updating Existing Pages:**
1. Run audit for `rounded-md` → replace with `rounded-lg`
2. Check all H1-H3 have explicit text color
3. Verify button sizing matches standard patterns
4. Ensure form inputs follow the established pattern

---

**Version History:**

- **v1.5 (Feb 17, 2026):** Added Dark Mode System section (HSL palette, CSS vars, toggle script, Tailwind scanning rules)
- **v1.3 (Feb 12, 2026):** Added Floor Shadow (elevation effect) pattern for hovering elements
- **v1.2 (Feb 10, 2026):** Added InfoPopup pattern (container + content styling rules, three content variants)
- **v1.1 (Jan 23, 2026):** Added Hero Sections pattern (full-width gradient hero with enterprise CTAs)
- **v1.0 (Dec 9, 2025):** Initial documentation based on index.html, dashboard-trinidad.html, and headlines-trinidad-and-tobago.html patterns
