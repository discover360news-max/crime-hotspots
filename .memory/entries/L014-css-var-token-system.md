---
id: L014
type: learning
status: active
created: 2026-03-15
updated: 2026-03-15
related: [L005, L006, B009]
---

## Summary
All dark mode colours are controlled through `--ch-*` CSS vars in `Layout.astro`. Use `var(--ch-*)` in Tailwind classes — never raw HSL. One edit to the var updates the entire site.

## Why This Matters
Before Mar 15 2026, components hardcoded `dark:bg-[hsl(0_0%_8%)]` etc. A dark mode tweak required touching 60+ files. After consolidation, editing the var in `Layout.astro` updates everything.

## Token Reference

| Var | Dark value | Semantic use |
|-----|-----------|--------------|
| `--ch-bg` | 8% | Page body background |
| `--ch-surface` | 13% | Cards, panels, modals |
| `--ch-surface-hover` | 18% | Hovered card state |
| `--ch-surface-sub` | 10% | Recessed elements within cards (inputs, sub-panels) |
| `--ch-text` | 92% | Body text |
| `--ch-text-heading` | 90% | Heading / title |
| `--ch-text-strong` | 85% | Bold card heading |
| `--ch-text-muted` | 55% | Labels, secondary text |
| `--ch-text-faint` | 50% | Dates, supporting copy |
| `--ch-border` | 22% | Default borders |
| `--ch-border-card` | 18% | Inner card dividers |
| `--ch-border-subtle` | 15% | Lightest inner borders |
| `--ch-pill-bg` | 24% | Pill / badge background |
| `--ch-pill-text` | 55% | Pill / badge text |

## Usage in Tailwind (Astro templates)
```html
<div class="bg-white dark:bg-[var(--ch-surface)]">
<p class="text-slate-500 dark:text-[var(--ch-text-muted)]">
<div class="border-slate-100 dark:border-[var(--ch-border-card)]">
```

## Usage in JS-generated HTML
```js
`<div style="background:var(--ch-surface);color:var(--ch-text)">`
```

## Surface depth order (dark mode)
```
page body:        --ch-bg         (8%)   ← darkest
card surface:     --ch-surface    (13%)  ← elevated
recessed input:   --ch-surface-sub(10%)  ← sunken within card
hover state:      --ch-surface-hover(18%)← lightest interactive
```

## Intentional exceptions (keep at --ch-bg)
- `<body>` element
- Toolbar filter `<select>` dropdowns (recessed in filter bar)

## Off-spec values (tech debt, fix when touching file)
`text-65%`, `text-88%`, `bg-12%`, `border-30%` — documented in `docs/guides/tokens/colors.md`

## Hero gradient pattern
Hero sections use a `bg` → `surface` diagonal fade in dark mode:
```html
dark:from-[var(--ch-bg)] dark:via-[var(--ch-surface)] dark:to-[var(--ch-surface)]
```
Three pages have inline hero markup (not using Hero.astro): `dashboard.astro`, `compare.astro`. If adding a new page with an inline hero, use this pattern — not `rose-950/30`.

## Change Log
- 2026-03-15: CSS var consolidation complete. ~976 hardcoded dark: classes swept across all .astro/.ts files.
- 2026-03-15: Hero gradient rose tint removed — dark:from-rose-950/30 → dark:from-[var(--ch-bg)] across Hero.astro, dashboard.astro, compare.astro.
