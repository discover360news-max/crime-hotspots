# Components
Part of [DESIGN-TOKENS.md](../DESIGN-TOKENS.md)

---

## Button System

### Button Sizing Guide
| Variant | Padding | Min Height | Use Case |
|---------|---------|-----------|----------|
| Standard | `px-4 py-1.5` | `min-h-button` (22px) | Most buttons |
| Large | `px-6 py-2.5` | `min-h-30` (30px) | Page-level CTAs |
| Compact | `px-3 py-1.5` | `min-h-button` (22px) | Mobile/tight spaces |

### Primary CTA
```html
<button class="px-4 py-1.5 min-h-button bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-bold text-caption">
  Primary Action
</button>
```
**Use for:** Form submissions, Apply filters, Report Crime, main navigation CTAs

### Secondary CTA
```html
<button class="px-4 py-1.5 min-h-button border-2 border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50 transition font-bold text-caption">
  Secondary Action
</button>
```
**Use for:** View Headlines, View Dashboard, cancel actions

### Large/Emphasis Button
```html
<button class="px-6 py-2.5 min-h-30 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-bold text-caption">
  Load More
</button>
```
**Use for:** Load More, Submit Report, Get Started

### Muted Grey Button
```html
<button class="px-4 py-1.5 min-h-button rounded-lg bg-[hsl(0_0%_45%)] dark:bg-[hsl(0_0%_30%)] text-white hover:bg-[hsl(0_0%_35%)] dark:hover:bg-[hsl(0_0%_25%)] active:bg-[hsl(0_0%_30%)] transition font-bold text-caption">
  Secondary Action
</button>
```
**Use for:** Subscribe, Filters, Headlines nav — secondary action alongside a primary CTA.
**Rule:** Never use rose outline for secondary actions — use this instead.

### Subtle/Text Button
```html
<button class="text-rose-600 hover:text-rose-700 underline text-caption font-bold">
  Clear Filters
</button>
```
**Use for:** Clear, Reset, Cancel (destructive or low-priority)

### Neutral Button
```html
<button class="px-4 py-1.5 min-h-button bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-bold text-caption transition">
  Clear
</button>
```
**Use for:** Clear date filters, Show All regions

---

## Frosted Glass Containers

### Opacity Scale

```html
<!-- Level 1: Background panels (most subtle) -->
<div class="bg-white/25 backdrop-blur-md"><!-- Dashboard panels, map containers --></div>

<!-- Level 2: Content cards (standard) -->
<div class="bg-white/85 backdrop-blur-md"><!-- Crime cards, info cards, metric widgets --></div>

<!-- Level 3: Modals -->
<div class="bg-white/85 backdrop-blur-md"><!-- Article preview modals --></div>

<!-- Level 4: Slide trays -->
<div class="bg-white/85 backdrop-blur-lg"><!-- Mobile region selector, nav trays --></div>
```

**Rule (Feb 2026):** All cards standardized to `bg-white/85`. Do not use `/70`, `/80`, or `/90` on cards.

### Shadow Pairing
```html
<div class="bg-white/50 backdrop-blur-md rounded-lg shadow-md">      <!-- cards -->
<div class="bg-white/25 backdrop-blur-md rounded-xl shadow-lg">      <!-- panels -->
<div class="bg-white/85 backdrop-blur-md rounded-2xl shadow-xl">     <!-- modals -->
```

### Floor Shadow (Elevation Effect)

Makes elements appear to hover above a surface. Currently used on FlipCounter.

```css
.element { position: relative; }
.element::after {
  content: '';
  position: absolute;
  bottom: -36px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;      /* narrower than element for natural perspective */
  height: 24px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.18) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}
```

---

## Form Inputs

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

**Form Input Rules:**
- Padding: `px-3 py-1.5`
- Min height: `min-h-button` (22px — touch target)
- Border radius: `rounded-lg` (not `rounded-md`)
- Focus: `focus:ring-2 focus:ring-rose-300`
- Text size: `text-caption`

---

## Active States & Feedback

### Filter Active Badge
```html
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
Skeleton classes defined in `src/css/styles.css`.

### Hover States
- Buttons: `hover:bg-rose-700` (primary), `hover:bg-rose-50` (outline)
- Links: `hover:text-rose-700`
- Cards: `hover:shadow-lg transition-shadow`
