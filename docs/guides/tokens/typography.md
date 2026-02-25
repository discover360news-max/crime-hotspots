# Typography
Part of [DESIGN-TOKENS.md](../DESIGN-TOKENS.md)

---

## Strict 4-Level Scale

| Token | Size | Line Height | Use |
|-------|------|-------------|-----|
| `text-display` | 32px (2rem) | `leading-tight` (1.2) | Hero text, page H1 titles |
| `text-heading` | 22px (1.375rem) | `leading-snug` (1.35) | Section H2/H3, card titles |
| `text-body` | 18px (1.125rem) | `leading-relaxed` (1.65) | All reading text, nav items |
| `text-caption` | 12px (0.75rem) | `leading-snug` (1.35) | Metadata, badges, timestamps, nav labels, buttons |

**2 font weights only:** `font-normal` (400) and `font-bold` (700). **Never `font-semibold`.**

**CRITICAL: `text-h1`, `text-h2`, `text-h3` are NOT defined** in tailwind.config.mjs — they are silently ignored, causing browser defaults. Always use the tokens above.

---

## Heading Hierarchy by Page Type

**Content pages** (about, privacy, FAQ, methodology):
```html
<h1 class="text-display font-bold text-slate-700 leading-tight">Page Title</h1>
<h2 class="text-heading font-bold text-slate-700 leading-snug">Section Title</h2>
<h3 class="text-body font-bold text-slate-600">Subsection</h3>
```

**Dashboard/app pages** (dashboard, statistics — data dominates):
```html
<h1 class="text-2xl font-bold text-slate-700">Trinidad & Tobago</h1>
<h2 class="text-body font-bold text-slate-500 dark:text-[hsl(0_0%_55%)]">Quick Insights</h2>
```
Section labels use `text-body` (18px) muted `text-slate-500` — subordinate to page title (`text-2xl` = 24px).

**Modals and cards:**
```html
<h2 class="text-heading font-bold text-slate-700 leading-snug">Card Title</h2>
<h3 class="text-body font-bold text-slate-600">Card Subtitle</h3>
```

**Rules:**
- All headings: explicit text color (`text-slate-700` or `text-slate-600`)
- All headings: explicit `leading-*` (`leading-tight` for H1, `leading-snug` for H2/H3)
- Never `font-semibold` — use `font-bold`
- Never `text-h1`, `text-h2`, `text-h3`

---

## Body Text & Labels

```html
<!-- Standard paragraph -->
<p class="text-body text-slate-700">Select a region to view and filter</p>

<!-- Supporting/caption -->
<p class="text-caption text-slate-400">Dashboard updates automatically</p>

<!-- Metadata/labels -->
<p class="text-caption text-slate-500">Data sources: Verified news outlets</p>

<!-- Form label -->
<label for="startDate" class="text-caption text-slate-600 font-bold">From:</label>
```

---

## SVG Icon Stroke Width

All outline-style SVG icons: `stroke-width="1"` (light, refined look).

```html
<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="..." />
</svg>
```

**Exception:** Small chevron arrows (`w-3 h-3`) may use `stroke-width="2"` for visibility.
