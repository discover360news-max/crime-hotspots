# Crime Hotspots Design Framework

**Version:** 2.0
**Last Updated:** November 29, 2025
**Philosophy:** High-Density Glass — Maximize information visibility with floating UI elements that never fully block data.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography System](#typography-system)
4. [Visual Effects](#visual-effects)
5. [Components](#components)
6. [Animations & Interactions](#animations--interactions)
7. [Layout Patterns](#layout-patterns)
8. [Mobile Design Principles](#mobile-design-principles)
9. [Implementation Checklist](#implementation-checklist)

---

## Design Philosophy

**Core Aesthetic: "High-Density Glass"**

Crime data visualization requires displaying complex information without overwhelming users. Our design achieves this by:

- **Floating UI**: Interface elements hover above data (maps/charts) using frosted glass effects
- **Contextual Awareness**: Maps and charts remain visible through translucent panels
- **Progressive Disclosure**: Information reveals itself through smooth animations and layered interactions
- **Clean Simplicity**: Minimal decoration, maximum information density

**Key Principles:**

- **Never fully block data** — Users should always see context through the UI
- **Responsive hierarchy** — Important actions use Rose Red sparingly; everything else is neutral
- **iOS-inspired interactions** — Smooth, physics-based animations with haptic-like feedback
- **Mobile-first density** — Small text with generous spacing and large touch targets

---

## Color Palette

Our palette creates a clean, clinical (but not cold) backdrop for serious crime data.

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Rose 600** | `#e11d48` | Primary CTA buttons, active states, high-severity data points |
| **Rose 700** | `#be123c` | Button hover states, pressed states |
| **Rose 50** | `#fff1f2` | Hover backgrounds, subtle highlights |

### Neutral Colors

| Color | Tailwind Class | Usage |
|-------|---------------|-------|
| **Slate 700** | `text-slate-700` | Primary text, headings |
| **Slate 600** | `text-slate-600` | Secondary text, labels |
| **Slate 400** | `text-slate-400` | Disabled states, placeholders |
| **Slate 200** | `bg-slate-200` | Dividers, borders |
| **Slate 100** | `bg-slate-100` | Secondary buttons, hover states |

### Background Colors

| Color | Usage |
|-------|-------|
| **White** | Primary backgrounds, cards |
| **White 75%** | `rgba(255, 255, 255, 0.75)` — Frosted trays |
| **White 60%** | `bg-white/60` — Mobile menu overlay |
| **Black 50%** | `bg-black/50` — Modal backdrops |

### Usage Rules

✅ **DO:**
- Use Rose Red only for primary actions and critical data points
- Use neutral grays for 90% of the interface
- Combine transparency with blur for depth

❌ **DON'T:**
- Overuse Rose Red (if everything is red, nothing is urgent)
- Use pure black (#000000) — always use Slate 700/800
- Use gradients or multiple accent colors

---

## Typography System

**Implementation:** `src/css/styles.css` (lines 20-128)

Our typography framework uses CSS custom properties for consistent, responsive text sizing across the entire application.

### The Scale

| Class | Mobile | Desktop | Line Height | Usage |
|-------|--------|---------|-------------|-------|
| `.text-display` | 24px | 32px | 1.1 | Page titles (e.g., "Trinidad & Tobago") | 700 weight
| `.text-h1` | 20px | 24px | 1.2 | Main section headings | 600 weight
| `.text-h2` | 16px | 18px | 1.3 | Subsection headings |
| `.text-h3` | 13px | 15px | 1.3 | Component headings, labels |
| `.text-body` | 13px | 15px | 1.5 | Default paragraph text |
| `.text-small` | 11px | 13px | 1.4 | Labels, metadata |
| `.text-tiny` | 10px | 11px | 1.3 | Timestamps, footnotes |
| `.text-nav` | 11px | 13px | 1.2 | Navigation menu links |
| `.text-meta` | 14px | 14px | 1.4 | Meta, filters, ta |


### Typography Rules

**ALWAYS:**
- Use semantic classes (`.text-display`, `.text-h1`) instead of arbitrary Tailwind sizes
- Stick to the defined scale — never use `text-[15px]` or other arbitrary values
- Trust the mobile-first responsive breakpoints (640px)
- Remember - Font Weight is as important as size

**NEVER:**
- Mix typography systems (don't use both `.text-h1` and `text-xl` on the same project)
- Create new text sizes without updating the framework
- Use font sizes below 8px (accessibility floor)

### Font Family

**Primary:** System font stack (inherits from Tailwind's `font-sans`)

```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

**Why System Fonts:**
- Zero load time
- Native OS appearance
- Excellent readability at small sizes
- Consistent with iOS/macOS design language

### Font Weights

| Weight | Tailwind Class | Usage |
|--------|---------------|-------|
| **400** (Regular) | `font-normal` | Body text, descriptions |
| **500** (Medium) | `font-medium` | Buttons, labels, emphasis |
| **600** (Semibold) | `font-semibold` | Headings, active navigation |
| **700** (Bold) | `font-bold` | Rarely used — only for extreme emphasis |

---

## Visual Effects

### Frosted Glass Effect

**Implementation:** `src/css/styles.css` (lines 200-206)

The signature visual style of Crime Hotspots — translucent backgrounds with blur.

```css
/* Applied to region tray, mobile menu */
background: rgba(255, 255, 255, 0.75); /* or bg-white/60 in Tailwind */
-webkit-backdrop-filter: blur(16px) saturate(180%);
backdrop-filter: blur(16px) saturate(180%);
```

**Usage:**
- Dashboard panel trays
- Mobile navigation overlay (`header.js:101`)
- Modal overlays
- Slide-out sheets

**Browser Support:**
- Use `@supports` to gracefully degrade
- Fallback to solid white background if blur not supported

### Shadows

**Philosophy:** Subtle, diffuse shadows that create depth without harshness.

| Shadow | Tailwind Class | Usage |
|--------|---------------|-------|
| Small | `shadow-sm` | Header, cards |
| Medium | `shadow-md` | Dropdowns, tooltips |
| Large | `shadow-lg` | Modals, important panels |
| Extra Large | `shadow-2xl` | Mobile menu overlay |

**Custom Shadows:**

```css
/* Dashboard tray (custom) */
box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.1);

/* Button hover state */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
```

### Border Radius

| Radius | Tailwind Class | Size | Usage |
|--------|---------------|------|-------|
| Small | `rounded` | 4px | Icons, small elements |
| Medium | `rounded-lg` | 8px | Buttons, cards, inputs |
| Large | `rounded-xl` | 12px | Large cards, panels |
| Extra Large | `rounded-2xl` | 16px | Mobile menu, major containers |
| Pill | `rounded-full` | 9999px | Icon buttons, badges |

**Tray-specific:**
- Dashboard tray: Top-left and top-right only (`rounded-t-2xl` / 24px)
- Mobile sheet: Left side only (`rounded-l-2xl`)

---

## Components

### Buttons

**Implementation:** `src/css/styles.css` (lines 420-503)

We use a unified button system with semantic classes.

#### Button Variants

**Primary (Main Actions):**
```html
<button class="btn btn-primary">
  Report Crime
</button>
```

```css
.btn-primary {
  background: #e11d48; /* rose-600 */
  color: white;
  padding: 0.5rem 1rem;
}
.btn-primary:hover {
  background: #be123c; /* rose-700 */
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

**Secondary (Less Emphasis):**
```html
<button class="btn btn-secondary">
  Cancel
</button>
```

```css
.btn-secondary {
  background: #f1f5f9; /* slate-100 */
  color: #475569; /* slate-600 */
}
```

**Outline (Dashboard View Headlines):**
```html
<button class="border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50">
  View Headlines →
</button>
```

#### Button Sizes

```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
```

#### Icon Buttons

```html
<button class="btn btn-icon">
  <svg class="w-5 h-5">...</svg>
</button>
```

**Specifications:**
- Minimum size: 44x44px (iOS touch target)
- Border radius: `rounded-lg` (8px)
- Transition: `0.2s ease` for all properties
- Hover: Lift up 1px + add shadow
- Active: Return to baseline (pressed feel)

### Loading States

**Implementation:** `src/css/styles.css` (lines 286-418)

We use **skeleton screens** (not spinners) to reduce perceived load time.

#### Shimmer Animation

```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #f8f8f8 50%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
}
```

#### Skeleton Variants

```html
<!-- Dashboard shimmer -->
<div id="dashboardShimmer">
  <div class="skeleton skeleton-heading"></div>
  <div class="skeleton skeleton-chart"></div>
</div>

<!-- Headline card shimmer -->
<div class="skeleton-card">
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-text skeleton-text-sm"></div>
</div>
```

**Available Classes:**
- `.skeleton` — Base shimmer effect
- `.skeleton-text` — Single line of text
- `.skeleton-heading` — Large heading block
- `.skeleton-card` — Full card with padding
- `.skeleton-metric` — Dashboard metric card (120px height)
- `.skeleton-chart` — Chart placeholder (300px height)
- `.skeleton-map` — Map placeholder (500px height)

**Dark Mode:**
Automatically adjusts shimmer colors via `@media (prefers-color-scheme: dark)`.

### Cards

**Standard Card:**
```html
<div class="bg-white rounded-xl shadow-sm p-6">
  <!-- Content -->
</div>
```

**Metric Card (Dashboard):**
```html
<div class="bg-white rounded-xl shadow-sm p-6">
  <div class="text-small text-slate-600">Total Crimes</div>
  <div class="text-h1 font-semibold text-slate-900 mt-2">1,247</div>
</div>
```

**Specifications:**
- Background: White
- Radius: `rounded-xl` (12px)
- Shadow: `shadow-sm`
- Padding: `p-6` (24px)
- Animations: Optional `animate-fadeInCard` on load

---

## Animations & Interactions

### Animation Philosophy

**iOS-Inspired Physics:**
- Use spring animations (slight overshoot + settle)
- Quick but not instant (0.3s-0.6s)
- Smooth easing curves, never linear

### Core Animations

**Implementation:** `src/css/styles.css` (lines 134-168)

#### fadeInCard

```css
@keyframes fadeInCard {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-fadeInCard {
  animation: fadeInCard 0.8s ease-out forwards;
}
```

**Usage:** Country cards on homepage, blog post cards

#### slideUpBounce

```css
@keyframes slideUpBounce {
  0% { transform: translateY(100%); opacity: 0; }
  60% { transform: translateY(-4%); opacity: 1; }
  80% { transform: translateY(2%); }
  100% { transform: translateY(0); }
}

.animate-slideUpBounce {
  animation: slideUpBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Usage:** Dashboard panel tray, success messages

### Transition Standards

```css
/* Global button/link transitions */
button, a {
  transition: all 0.2s ease;
}

/* Specific transitions */
#mobile-menu {
  transition: all 0.3s ease;
}

#navHeadlinesMenu {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
```

### Interaction States

**Button Press Feedback:**
```css
button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

button:active {
  transform: translateY(0);
}
```

**Touch Response (iOS-like):**
- Scale down to 96% on press
- Reduce opacity to 80%
- Instant feedback (no delay)
- **Note:** Haptic feedback not available in web; simulate with visual cues

---

## Layout Patterns

### Dashboard Panel

**Implementation:** `src/js/components/dashboardPanel.js`

**Structure:**
```
[Backdrop (black/50 blur)] z-40
  └─ [Dashboard Panel Tray] z-50
       ├─ Header (rounded-t-2xl)
       ├─ Frosted glass background
       ├─ Dashboard iframe
       └─ Footer (View Headlines link)
```

**Key Features:**
- **Slide-up animation** with overshoot
- **Backdrop blur** to maintain context
- **Escape key** to close
- **Click outside** to dismiss
- **Shimmer loading** for 5+ seconds minimum
- **Cached views** skip shimmer

**Z-Index Hierarchy:**
```css
#regionTray: z-50
#trayOverlay (backdrop): z-40
#guyanaMapContainer: z-10 (desktop), z-1 (mobile)
```

### Mobile Navigation

**Implementation:** `src/js/components/header.js`

**Structure:**
```
[Backdrop (black/50 blur)] z-40
  └─ [Mobile Menu Overlay] z-50
       ├─ Frosted glass (white/60 blur)
       ├─ Rounded left corners (rounded-l-2xl)
       ├─ Slide from right
       └─ Icon-based navigation
```

**Animations:**
- Slide in from right: `translate-x-full` → `translate-x-0`
- Backdrop fade: `opacity-0` → `opacity-100`
- Duration: 300ms
- Close on link click, backdrop click, or Escape key

### Header (Sticky)

```html
<header class="bg-white shadow-sm sticky top-0 z-40">
  <!-- Logo, Nav, Mobile Toggle -->
</header>
```

**Specifications:**
- Height: 64px (h-16)
- Sticky positioning (always visible)
- Shadow: `shadow-sm`
- Background: Solid white (not transparent)

### Region Tray (Guyana Map Filter)

**Features:**
- Frosted glass slide-up tray
- Interactive SVG map
- Click region to filter dashboard
- Scroll-friendly (custom scrollbar styling)

---

## Mobile Design Principles

### Touch Targets

**Critical Rule:** Minimum 44x44px for all interactive elements.

```css
/* Even if text is small (11px), the clickable area must be 44px */
.btn-icon {
  width: 2.5rem;  /* 40px */
  height: 2.5rem; /* 40px */
  padding: 0.5rem;
}
```

**Why:** Fingers are imprecise; small touch targets cause frustration.

### Responsive Breakpoints

Our mobile-first approach uses these breakpoints:

| Breakpoint | Tailwind | Width | Usage |
|------------|----------|-------|-------|
| Mobile | (default) | < 640px | Base styles, single column |
| Small | `sm:` | ≥ 640px | Typography scales up |
| Medium | `md:` | ≥ 768px | Desktop nav visible |
| Large | `lg:` | ≥ 1024px | Desktop layout, maps visible |

**Typography Example:**
```css
/* Mobile: 20px */
--text-display: 1.25rem;

/* Desktop (640px+): 28px */
@media (min-width: 640px) {
  .text-display {
    font-size: var(--text-display-sm);
  }
}
```

### Mobile-Specific Features

**iOS-Style Frosted Overlays:**
- Mobile menu: `bg-white/60 backdrop-blur-lg`
- Dashboard tray: `bg-white/75 backdrop-blur-[16px]`

**Gesture Support:**
- Swipe to close (future enhancement)
- Draggable trays (via handle)
- Scroll lock when overlay open

**Dark Mode:**
All skeletons auto-adjust via `@media (prefers-color-scheme: dark)`.

### Content Density

**Philosophy:** Small text, generous spacing.

```html
<!-- Dense data tables -->
<table class="text-tiny">
  <tr>
    <td class="py-3">Crime</td> <!-- Generous vertical spacing -->
    <td class="py-3">Location</td>
  </tr>
</table>
```

**Horizontal Scroll for Tables:**
Don't squash columns on mobile — allow horizontal scroll with styled scrollbars.

```css
#mobileMapContainer {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}
```

---

## Implementation Checklist

Use this checklist when building new features or pages.

### Visual Consistency

- [ ] Uses semantic typography classes (`.text-display`, `.text-h1`, etc.)
- [ ] Uses Rose palette for primary actions only
- [ ] Uses neutral grays (Slate 100-700) for 90% of interface
- [ ] Buttons use `.btn` system (primary, secondary, tertiary)
- [ ] Cards use `bg-white rounded-xl shadow-sm p-6`
- [ ] Frosted glass uses `backdrop-filter: blur(16px) saturate(180%)`

### Animations

- [ ] Smooth transitions: `transition: all 0.2s ease`
- [ ] Button hover: `translateY(-1px)` + shadow
- [ ] Button active: `translateY(0)` (pressed feel)
- [ ] Trays use `slideUpBounce` animation
- [ ] Cards use `fadeInCard` animation on load
- [ ] Loading states use skeleton screens (not spinners)

### Mobile-First

- [ ] Minimum 44x44px touch targets
- [ ] Typography scales from mobile to desktop via CSS custom properties
- [ ] Mobile menu slides in from right with frosted glass
- [ ] Backdrops use `bg-black/50 backdrop-blur-sm`
- [ ] Escape key closes modals
- [ ] Click outside closes overlays
- [ ] Body scroll locked when overlay open

### Accessibility

- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Focus states visible (ring-rose-300)
- [ ] `aria-expanded`, `aria-haspopup` on dropdowns
- [ ] `aria-current="page"` on active nav
- [ ] `role="menu"`, `role="menuitem"` for dropdowns
- [ ] Keyboard navigation supported (Tab, Escape, Enter)

### Performance

- [ ] System fonts (no web font downloads)
- [ ] CSS animations use `transform` and `opacity` (GPU-accelerated)
- [ ] Shimmer loading shows within 100ms
- [ ] Shimmer displays minimum 5 seconds to cover Google dashboards
- [ ] Cached views skip loading states
- [ ] Images use `loading="lazy"`

---

## Reference Files

**Typography Framework:**
- `src/css/styles.css` (lines 20-128)

**Button System:**
- `src/css/styles.css` (lines 420-503)

**Animations:**
- `src/css/styles.css` (lines 134-168)

**Skeleton Loaders:**
- `src/css/styles.css` (lines 286-418)
- `src/js/components/loadingStates.js`

**Dashboard Panel:**
- `src/js/components/dashboardPanel.js`

**Header & Mobile Menu:**
- `src/js/components/header.js`

**Country Configuration:**
- `src/js/data/countries.js` (single source of truth)

---

## Version History

**v2.0 (Nov 29, 2025):**
- Merged aspirational guidelines with implemented features
- Added comprehensive component documentation
- Documented typography framework (CSS custom properties)
- Expanded animation and interaction patterns
- Added implementation checklist

**v1.0 (Initial):**
- High-Density Glass philosophy
- iOS-inspired interaction concepts
- Color palette and mobile principles

---

**Questions?** Reference `CLAUDE.md` for project-wide instructions and architecture overview.
