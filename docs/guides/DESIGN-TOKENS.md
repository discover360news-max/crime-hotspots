# Crime Hotspots Design Tokens

**Version:** 1.7
**Last Updated:** February 19, 2026
**Status:** Living Document

This document defines the design system for Crime Hotspots. All pages should follow these patterns for visual consistency.

---

## Feature Index

Jump to the design pattern for a specific feature. Each entry links to the tokens section it relies on and lists its source file.

| Feature | File | Uses Tokens |
|---------|------|-------------|
| **HomepagePulse** | `src/components/HomepagePulse.astro` | [Live Pulse Indicator](#-live-pulse-indicator), [Standard Card](#standard-card-pattern), [Dark Mode](#-dark-mode-system) |
| **AreaNarrative** | `src/components/AreaNarrative.astro` | [Live Pulse Indicator](#-live-pulse-indicator), [Standard Card](#standard-card-pattern), [Contextual CTA Links](#contextual-cta-links), [Dark Mode](#-dark-mode-system) |
| **DashboardStory** | `src/components/DashboardStory.astro` | [Live Pulse Indicator](#-live-pulse-indicator), [Standard Card](#standard-card-pattern), [Dark Mode](#-dark-mode-system) |
| **"New Since" Badge** | `src/pages/trinidad/area/[slug].astro` (inline script) | [Alert Badge](#alert-badge-pattern), [Dark Mode](#-dark-mode-system) |
| **Compare Prompt** | `src/pages/trinidad/area/[slug].astro` | [Contextual CTA Links](#contextual-cta-links), [Standard Card](#standard-card-pattern), [Dark Mode](#-dark-mode-system) |
| **SafetyContext** | `src/components/SafetyContext.astro` | [Safety Context Colors](#safety-context-colors-dark), [Dark Mode](#-dark-mode-system) |
| **CrimeDetailModal** | `src/components/CrimeDetailModal.astro` | [Frosted Glass](#-frosted-glass-containers), [CSS Custom Properties](#css-custom-properties-for-js-generated-html), [Dark Mode](#-dark-mode-system) |
| **FlipCounter** | `src/components/FlipCounter.astro` | [Floor Shadow](#floor-shadow-elevation-effect), [Dark Mode](#-dark-mode-system) |
| **InfoPopup** | `src/components/InfoPopup.astro` | [InfoPopup Pattern](#-infopopup-pattern), [Frosted Glass](#-frosted-glass-containers), [Dark Mode](#-dark-mode-system) |
| **Hero** | `src/components/Hero.astro` | [Hero Sections](#-hero-sections), [Button System](#-button-system) |
| **TrendingHotspots** | `src/components/TrendingHotspots.astro` | [Standard Card](#standard-card-pattern), [Dark Mode](#-dark-mode-system) |
| **StatCards** | `src/components/StatCards.astro` | [Standard Card](#standard-card-pattern), [Typography](#-typography-system), [Dark Mode](#-dark-mode-system) |
| **BottomNav** | `src/components/BottomNav.astro` | [Dark Mode](#-dark-mode-system), Rose accent for active dot |
| **Header** | `src/components/Header.astro` | [Button System](#-button-system), [Dark Mode](#-dark-mode-system) |
| **Homepage** | `src/pages/index.astro` | [Standard Card](#standard-card-pattern), [Typography](#-typography-system), [Dark Mode](#-dark-mode-system) |
| **Dashboard** | `src/pages/trinidad/dashboard.astro` | [Button System](#-button-system), [Loading Skeleton](#loading-skeleton), [Dark Mode](#-dark-mode-system) |
| **Area Detail** | `src/pages/trinidad/area/[slug].astro` | [Standard Card](#standard-card-pattern), [Button System](#-button-system), [Dark Mode](#-dark-mode-system) |
| **Headlines** | `src/pages/trinidad/headlines.astro` | [CSS Custom Properties](#css-custom-properties-for-js-generated-html), [Dark Mode](#-dark-mode-system) |

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

| Token | Light Tailwind | Dark Tailwind |
|-------|---------------|--------------|
| Page background | `bg-slate-100` | `dark:bg-[hsl(0_0%_3%)]` |
| Surface / header | `bg-white/85` | `dark:bg-[hsl(0_0%_5%)]` or `dark:bg-[hsl(0_0%_8%)]` |
| Card background | `bg-white/85` | `dark:bg-[hsl(0_0%_8%)]/85` |
| Shimmer background | `#e2e8f0` (CSS) | `hsl(0 0% 12%)` (CSS) |
| Border | `border-slate-100` or `border-slate-200` | `dark:border-[hsl(0_0%_15%)]` or `dark:border-[hsl(0_0%_18%)]` |
| Subtle border | `border-slate-300` | `dark:border-[hsl(0_0%_22%)]` |
| Divider gradient | `via-slate-300` | `dark:via-[hsl(0_0%_20%)]` or `dark:via-[hsl(0_0%_22%)]` |

### Text Hierarchy

| Role | Light Tailwind | Dark Tailwind |
|------|---------------|--------------|
| Heading / title | `text-slate-700` | `dark:text-[hsl(0_0%_90%)]` |
| Strong heading | `text-slate-700 font-bold` | `dark:text-[hsl(0_0%_85%)]` |
| Body text | `text-slate-700` | `dark:text-[hsl(0_0%_92%)]` (inherits from body) |
| Label / secondary | `text-slate-500` | `dark:text-[hsl(0_0%_55%)]` |
| Faint / date | `text-slate-400` | `dark:text-[hsl(0_0%_50%)]` |

### Accent Colors

**Rose accents stay the SAME in both modes** — do NOT use muted variants like `dark:text-rose-400`.

| Usage | Class |
|-------|-------|
| Primary accent (links, CTAs, murder numbers) | `text-rose-600` (both modes) |
| Active border | `border-rose-600` or `#e11d48` (both modes) |
| Badge on dark bg | `bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400` (exception: badge needs contrast on dark surface) |

### Standard Card Pattern

**Reference component:** `CrimeCard.astro` — all new cards should match this pattern.

```html
<!-- Card container -->
bg-white/85 dark:bg-[hsl(0_0%_8%)]/85 backdrop-blur-md rounded-xl
border border-slate-100 dark:border-[hsl(0_0%_15%)]
shadow-md hover:shadow-lg transition

<!-- Card heading -->
text-body font-bold text-slate-700 dark:text-[hsl(0_0%_90%)]

<!-- Card secondary text -->
text-caption text-slate-500 dark:text-[hsl(0_0%_55%)]

<!-- Card divider -->
border-t border-slate-200 dark:border-[hsl(0_0%_18%)]
```

### Scoped Dark Styles (CSS)

For `<style>` blocks inside Astro components, use `:global(.dark)` prefix:

```css
/* Light mode (default) */
.my-element { background: rgba(255, 255, 255, 0.7); }

/* Dark mode override */
:global(.dark) .my-element { background: rgba(255, 255, 255, 0.08); }
```

For raw CSS files (e.g., `dashboard.css`), use `:root.dark` instead:

```css
:root.dark .my-element { background: hsl(0 0% 12%); }
```

### CSS Custom Properties (for JS-generated HTML)

Defined in `Layout.astro` `<style is:global>`. Use these in JS template literals where Tailwind `dark:` classes can't be scanned at build time (e.g., `modalHtmlGenerators.ts` runtime-built strings, `headlines.astro` `<script define:vars>` blocks):

```css
:root {
  --ch-bg: hsl(0 0% 94%);      /* page background */
  --ch-surface: hsl(0 0% 100%); /* card/surface background */
  --ch-text: hsl(0 0% 20%);    /* primary text */
  --ch-text-muted: hsl(0 0% 45%); /* muted text */
  --ch-border: hsl(0 0% 88%);  /* border color */
  --ch-pill-bg: #e2e8f0;          /* slate-200 pill/badge bg */
  --ch-pill-text: #475569;        /* slate-600 pill/badge text */
}
.dark {
  --ch-bg: hsl(0 0% 3%);
  --ch-surface: hsl(0 0% 8%);
  --ch-text: hsl(0 0% 92%);
  --ch-text-muted: hsl(0 0% 70%);
  --ch-border: hsl(0 0% 18%);
  --ch-pill-bg: hsl(0 0% 20%);           /* dark pill/badge bg */
  --ch-pill-text: hsl(0 0% 55%);         /* dark pill/badge text */
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

### Muted Grey Button (Secondary Actions)
```html
<button class="px-4 py-1.5 min-h-button rounded-lg bg-[hsl(0_0%_45%)] dark:bg-[hsl(0_0%_30%)] text-white hover:bg-[hsl(0_0%_35%)] dark:hover:bg-[hsl(0_0%_25%)] active:bg-[hsl(0_0%_30%)] transition font-bold text-caption">
  Secondary Action
</button>
```
**Use for:** Subscribe, Filters, Headlines nav buttons, InfoPopup CTAs — any secondary action that sits alongside a primary CTA
**Color:** Same neutral as `--ch-text-muted` family — no tint, professional, recedes behind rose primary
**Rule:** Never use rose outline for secondary actions — use this pattern instead

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

**Migration from old tokens (COMPLETED Feb 18, 2026):**
- `text-h1` → `text-display` (all 19 files migrated)
- `text-h2` → `text-heading` (all files migrated)
- `text-h3` → `text-body` (all files migrated)
- `text-small`, `text-tiny`, `text-nav` → `text-caption`

**CRITICAL: `text-h1`, `text-h2`, `text-h3` are NOT defined in tailwind.config.mjs and will be silently ignored, causing headings to render at browser defaults. Always use the tokens above.**

### Typography Usage Rules

#### Heading Hierarchy by Page Type

**Content pages** (about, privacy, FAQ, methodology — long-form reading):
```html
<h1 class="text-display font-bold text-slate-700 leading-tight">Page Title</h1>
<h2 class="text-heading font-bold text-slate-700 leading-snug">Section Title</h2>
<h3 class="text-body font-bold text-slate-600">Subsection</h3>
```

**Dashboard/app pages** (dashboard, statistics — data-heavy, compact):
```html
<h1 class="text-2xl font-bold text-slate-700">Trinidad & Tobago</h1>  <!-- page title -->
<h2 class="text-body font-bold text-slate-500 dark:text-[hsl(0_0%_55%)]">Quick Insights</h2>  <!-- section labels -->
```
Section labels on dashboards use `text-body` (18px) in muted `text-slate-500` to stay subordinate to the page title (`text-2xl` = 24px). Using `text-heading` (22px) creates no visual hierarchy.

**Modals and cards** (inside components):
```html
<h2 class="text-heading font-bold text-slate-700 leading-snug">Card Title</h2>
<h3 class="text-body font-bold text-slate-600">Card Subtitle</h3>
```

**Rules:**
- All headings must have an explicit text color (`text-slate-700` or `text-slate-600`)
- All headings must have an explicit `leading-*` class (`leading-tight` for H1, `leading-snug` for H2/H3)
- Never use `font-semibold` — use `font-bold`
- Never use `text-h1`, `text-h2`, `text-h3` — these are undefined and silently ignored

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

### SVG Icon Stroke Width

All outline-style SVG icons must use `stroke-width="1"` for a light, refined look that matches the design system.

```html
<!-- Correct: thin stroke -->
<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="..." />
</svg>
```

**Exception:** Small chevron arrows (e.g., `w-3 h-3` navigation indicators) may use `stroke-width="2"` for visibility at small sizes.

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
<p class="font-bold mb-2 text-slate-700 dark:text-[hsl(0_0%_90%)]">Section Title</p>
```
- **Always `text-slate-700`** — neutral, no rose accent on titles
- **Always `font-bold`** — never `font-semibold` (design system rule: two weights only)

**Body Text:**
```html
<p class="mb-3">Descriptive text inherits text-sm text-slate-600 from wrapper.</p>
```

**Subheadings (within popup):**
```html
<p class="font-bold mb-2 text-slate-700 dark:text-[hsl(0_0%_90%)]">Subsection Title</p>
```
- Use `text-slate-700` for all subheadings — consistent neutral hierarchy, no rose

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
<!-- Wrong: Rose accent on titles -->
<p class="font-semibold mb-2 text-rose-700">Title</p>

<!-- Wrong: font-semibold (not in design system) -->
<p class="font-semibold mb-2 text-slate-700">Title</p>

<!-- Correct: Neutral bold title, dark mode aware -->
<p class="font-bold mb-2 text-slate-700 dark:text-[hsl(0_0%_90%)]">Title</p>

<!-- Wrong: Missing text class on body paragraphs -->
<p class="mb-3">Some description</p>

<!-- Correct: Explicit or inherited (wrapper provides text-sm text-slate-600) -->
<p class="mb-3">Some description</p>  <!-- OK if inside the component slot -->
<p class="text-caption text-slate-500">Supporting text</p>  <!-- For secondary text -->
```

---

## 🔴 Live Pulse Indicator

Animated dot showing live/active data. Used by HomepagePulse, AreaNarrative, and DashboardStory.

```html
<span class="relative flex h-2 w-2 shrink-0">
  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
  <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
</span>
```

**Rules:**
- Outer span: `relative flex h-2 w-2 shrink-0` — prevents layout shift
- Ping layer: `animate-ping absolute` + `bg-rose-400 opacity-75` — subtle pulse
- Solid dot: `relative` + `bg-rose-500` — always visible core
- Always pair with `shrink-0` and `mt-1.5` when used alongside text (keeps dot aligned to first line)

**Container pattern (narrative card):**
```html
<div class="rounded-lg border border-slate-200 dark:border-[hsl(0_0%_15%)] bg-white/70 dark:bg-[hsl(0_0%_5%)] p-3">
  <div class="flex items-start gap-2">
    <!-- pulse dot here -->
    <p class="text-sm text-slate-600 dark:text-[hsl(0_0%_80%)] leading-relaxed">
      Narrative text with <span class="font-bold text-slate-700 dark:text-[hsl(0_0%_90%)]">bold callouts</span>.
    </p>
  </div>
</div>
```

**Currently used on:** HomepagePulse, DashboardStory, AreaNarrative

---

## 🔔 Alert Badge Pattern

Notification-style badge for "new since last visit" or similar alerts. Client-side rendered.

```html
<div class="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-3 flex items-center gap-2">
  <svg class="w-4 h-4 text-rose-500 shrink-0"><!-- bell icon --></svg>
  <p class="text-sm text-rose-700 dark:text-rose-300">
    <span class="font-bold">3</span> new incidents since your last visit
  </p>
</div>
```

**Rules:**
- Light: `bg-rose-50` background, `border-rose-200` border, `text-rose-700` text
- Dark: `bg-rose-950/30`, `border-rose-800/50`, `text-rose-300`
- Icon: `text-rose-500` (same in both modes)
- Hidden by default (`hidden` class), shown via JS when count > 0
- Uses localStorage timestamp pattern (see `trendingHelpers.ts` for reference)

**Currently used on:** Area detail "New Since Last Visit" badge

---

## 🔗 Contextual CTA Links

Inline text-based CTAs within narrative blocks (not full buttons). Used for cross-page navigation suggestions.

```html
<!-- Inline within narrative text -->
<a href="/trinidad/compare/?a=slug" class="text-rose-600 hover:text-rose-700 font-medium underline">
  How does this compare?
</a>

<!-- Standalone compare prompt card -->
<div class="rounded-lg border border-slate-200 dark:border-[hsl(0_0%_15%)] bg-slate-50 dark:bg-[hsl(0_0%_5%)] p-3">
  <p class="text-sm text-slate-600 dark:text-[hsl(0_0%_70%)]">
    See how <span class="font-bold text-slate-700 dark:text-[hsl(0_0%_90%)]">Area Name</span> compares to
    <span class="font-bold text-slate-700 dark:text-[hsl(0_0%_90%)]">Other Area</span>
  </p>
  <a href="/trinidad/compare/?a=slug&b=slug"
     class="inline-flex items-center gap-1 mt-2 text-sm text-rose-600 hover:text-rose-700 font-medium">
    Compare areas
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </a>
</div>
```

**Rules:**
- Inline links: `text-rose-600 hover:text-rose-700 font-medium underline`
- Standalone card: `bg-slate-50` (not `bg-white`) to visually distinguish from content cards
- Arrow chevron: `w-3 h-3`, `stroke-width="2"` (small icon exception)
- Always pass area slugs as query params (`?a=slug&b=slug`) to pre-populate compare page

**Currently used on:** AreaNarrative CTAs, Compare Prompt card on area detail pages

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

- **v1.7 (Feb 19, 2026):** Added Feature Index (jump-to-feature table), Live Pulse Indicator pattern, Alert Badge pattern, Contextual CTA Links pattern — supports HomepagePulse, AreaNarrative, DashboardStory, "New Since" badge, Compare Prompt
- **v1.6 (Feb 18, 2026):** Typography token migration complete (text-h1/h2/h3 → text-display/heading/body across 19 files), added heading hierarchy rules by page type, SVG icon stroke-width convention (stroke-width="1"), DashboardInfoCards dark mode + border
- **v1.5 (Feb 17, 2026):** Added Dark Mode System section (HSL palette, CSS vars, toggle script, Tailwind scanning rules)
- **v1.3 (Feb 12, 2026):** Added Floor Shadow (elevation effect) pattern for hovering elements
- **v1.2 (Feb 10, 2026):** Added InfoPopup pattern (container + content styling rules, three content variants)
- **v1.1 (Jan 23, 2026):** Added Hero Sections pattern (full-width gradient hero with enterprise CTAs)
- **v1.0 (Dec 9, 2025):** Initial documentation based on index.html, dashboard-trinidad.html, and headlines-trinidad-and-tobago.html patterns
