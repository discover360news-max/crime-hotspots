# Crime Hotspots Design Tokens

**Version:** 2.0 | **Updated:** February 25, 2026

---

## Token Files

| File | Covers |
|------|--------|
| [tokens/colors.md](./tokens/colors.md) | Primary palette, dark mode HSL system, CSS vars, standard card pattern, safety context colors |
| [tokens/typography.md](./tokens/typography.md) | 4-level scale (`text-display/heading/body/caption`), heading hierarchy by page type, SVG stroke width |
| [tokens/components.md](./tokens/components.md) | Buttons (all 5 variants), frosted glass, floor shadow, form inputs, active states |
| [tokens/layout.md](./tokens/layout.md) | Page wireframes, footer structure, dividers, `max-w-3xl` column, spacing, background pattern, breadcrumbs, hero HTML |
| [tokens/patterns.md](./tokens/patterns.md) | InfoPopup, Live Pulse, Alert Badge, Contextual CTA Links |
| [tokens/behaviors.md](./tokens/behaviors.md) | Leaflet map (tile URLs, dark swap, brightness), scroll lock, collapsible animation |

---

## Feature Index

Primary entry point — jump to the token files for any component.

| Component | Source File | Token Files | Key Tokens | Usage Note |
|-----------|-------------|-------------|------------|------------|
| **HomepagePulse** | `src/components/HomepagePulse.astro` | [patterns](./tokens/patterns.md), [colors](./tokens/colors.md) | `animate-ping`, `bg-rose-400`, `bg-rose-500` | Always pair pulse dot with `shrink-0 mt-1.5` |
| **AreaNarrative** | `src/components/AreaNarrative.astro` | [patterns](./tokens/patterns.md), [colors](./tokens/colors.md) | `bg-white/70 dark:bg-[hsl(0_0%_5%)]` | Uses both Live Pulse and Contextual CTA Links |
| **DashboardStory** | `src/components/DashboardStory.astro` | [patterns](./tokens/patterns.md), [colors](./tokens/colors.md) | `animate-ping`, standard card | Live pulse in narrative card container |
| **"New Since" Badge** | `src/pages/trinidad/area/[slug].astro` | [patterns](./tokens/patterns.md), [colors](./tokens/colors.md) | `bg-rose-50 dark:bg-rose-950/30`, `text-rose-700 dark:text-rose-300` | Client-rendered; `hidden` by default, shown by JS |
| **Compare Prompt** | `src/pages/trinidad/area/[slug].astro` | [patterns](./tokens/patterns.md), [colors](./tokens/colors.md) | `bg-slate-50` (not `bg-white`) | Uses `?a=slug&b=slug` query params |
| **SafetyContext** | `src/components/SafetyContext.astro` | [colors](./tokens/colors.md) | `dark:bg-amber-950/50`, `dark:bg-emerald-950/50`, `dark:bg-[hsl(0_0%_6%)]` | Three risk levels; uses `dark:` — not CSS vars |
| **CrimeDetailModal** | `src/components/CrimeDetailModal.astro` | [components](./tokens/components.md), [colors](./tokens/colors.md) | `--ch-surface`, `--ch-border`, `--ch-text` | Built at runtime — must use CSS vars, not `dark:` |
| **FlipCounter** | `src/components/FlipCounter.astro` | [components](./tokens/components.md) | `::after` pseudo-element floor shadow | Add extra bottom padding to parent for shadow room |
| **InfoPopup** | `src/components/InfoPopup.astro` | [patterns](./tokens/patterns.md), [components](./tokens/components.md) | `bg-white/80`, `rounded-2xl`, `z-[9999]` | Titles: `font-bold text-slate-700` — never rose, never semibold |
| **Hero** | `src/components/Hero.astro` | [layout](./tokens/layout.md), [components](./tokens/components.md) | `narrowContainer={true}`, `compact={true}` | Use `narrowContainer` to align with `max-w-3xl` main content |
| **TrendingHotspots** | `src/components/TrendingHotspots.astro` | [colors](./tokens/colors.md) | Standard card pattern | Zero additional API calls — reuses `allCrimes` |
| **StatCards** | `src/components/StatCards.astro` | [colors](./tokens/colors.md), [typography](./tokens/typography.md) | Standard card pattern | YoY comparison rows use `text-caption` |
| **BottomNav** | `src/components/BottomNav.astro` | [colors](./tokens/colors.md) | `bg-rose-500` active dot, `dark:` nav bg | Active section uses rose-500 dot indicator |
| **Header** | `src/components/Header.astro` | [components](./tokens/components.md), [colors](./tokens/colors.md) | `themeToggleDesktop`, `lockScroll`/`unlockScroll` | Scroll lock helpers live here — import from Header pattern |
| **Homepage** | `src/pages/index.astro` | [colors](./tokens/colors.md), [typography](./tokens/typography.md) | Standard card, `text-display` | Section picker modal driven by `countries.ts` sections array |
| **Dashboard** | `src/pages/trinidad/dashboard.astro` | [components](./tokens/components.md), [behaviors](./tokens/behaviors.md), [colors](./tokens/colors.md) | `skeleton-metric/chart/map`, Leaflet tile URLs | Full SSR + CDN cache; section `<h2>` use `text-slate-500` |
| **Area Detail** | `src/pages/trinidad/area/[slug].astro` | [colors](./tokens/colors.md), [components](./tokens/components.md) | `window.__crimesData` (area crimes only) | Alert Badge + Compare Prompt both live here |
| **Headlines** | `src/pages/trinidad/headlines.astro` | [colors](./tokens/colors.md), [layout](./tokens/layout.md) | `--ch-*` CSS vars in `<script define:vars>` | Browse/selection layout (`max-w-6xl` outer, `max-w-3xl` inner) |

---

## Common Mistakes

| Wrong | Correct | Rule |
|-------|---------|------|
| `px-6 py-2` | `px-4 py-1.5 min-h-button` | Button sizing |
| `rounded-md` | `rounded-lg` | Border radius |
| `text-h1 font-semibold` | `text-display font-bold leading-tight` | Type tokens + weight |
| `text-heading font-semibold` | `text-heading font-bold` | No `font-semibold` |
| `bg-white/70 backdrop-blur-md` | `bg-white/85 backdrop-blur-md` | Card opacity |
| `text-gray-500` | `text-slate-500` | Slate palette only |
| `text-xl font-semibold text-slate-700` on dashboard h2 | `text-body font-bold text-slate-500 dark:text-[hsl(0_0%_55%)]` | Muted labels on data pages |
| `dark:bg-[hsl(0_0%_8%)/70]` | `dark:bg-[hsl(0_0%_8%_/_0.7)]` | Tailwind v4: alpha inside HSL |

---

## Quick Reference Cheatsheet

**Primary Button:**
```html
<button class="px-4 py-1.5 min-h-button bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-bold text-caption">Action</button>
```

**Secondary Button:**
```html
<button class="px-4 py-1.5 min-h-button border-2 border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50 transition font-bold text-caption">Action</button>
```

**Ghost Button:**
```html
<button class="px-4 py-1.5 min-h-button border-2 border-slate-300 dark:border-[hsl(0_0%_30%)] text-slate-700 dark:text-[hsl(0_0%_85%)] hover:border-rose-600 dark:hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 active:bg-rose-50 dark:active:bg-rose-950/40 rounded-lg transition font-medium text-xs whitespace-nowrap">Action</button>
```

**Frosted Card:**
```html
<div class="bg-white/85 backdrop-blur-md rounded-lg shadow-md p-4">
  <h3 class="text-heading font-bold text-slate-700 leading-snug mb-2">Title</h3>
  <p class="text-caption text-slate-400">Description</p>
</div>
```

**InfoPopup Content (slot) — CORRECT:**
```html
<InfoPopup id="unique-id">
  <p class="font-bold mb-2 text-slate-700 dark:text-[hsl(0_0%_90%)]">Section Title</p>
  <p class="mb-3">Body text (inherits text-sm text-slate-600).</p>
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

**Divider:**
```html
<div class="w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-[hsl(0_0%_22%)] to-transparent my-6"></div>
```

---

## Version History

- **v2.0 (Feb 25, 2026):** Restructured into topic files (`tokens/`). Master is now an index. Common Mistakes and Cheatsheet stay in master. Fixed stale InfoPopup cheatsheet snippet (`font-semibold text-rose-700` → `font-bold text-slate-700 dark:...`).
- **v1.9 (Feb 24, 2026):** Added Leaflet Map section, Theme Icon CSS-only pattern, Scroll Lock helper, Collapsible Grid Animation, Footer 3-column structure.
- **v1.8 (Feb 20, 2026):** Clarified section heading colors by page type — data/app pages `text-slate-500`, content pages `text-slate-700`. Added antipattern to Common Mistakes.
