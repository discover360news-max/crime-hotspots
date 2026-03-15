# Colors & Dark Mode
Part of [DESIGN-TOKENS.md](../DESIGN-TOKENS.md)

---

## Primary Color Palette

```css
/* Accent (All CTAs, Links, Active States) */
Rose-600: #e11d48
Rose-700: #be123c  /* hover states */
Rose-50:  #fff1f2  /* subtle backgrounds */

/* Text */
Slate-700: #334155  /* primary text */
Slate-600: #475569  /* secondary text */
Slate-500: #64748b  /* tertiary text */
Slate-400: #94a3b8  /* supporting text */

/* Backgrounds */
Slate-100: #f1f5f9  /* page backgrounds */
Slate-50:  #f8fafc  /* card backgrounds */
White:     #ffffff  /* containers */
```

**Color Usage Rules:**
- **Rose-600:** All primary CTAs, links, active filter states, error states
- **Slate-700:** Page-level H1 and content-page section headings
- **Slate-500:** Section labels on data/app pages (dashboard, statistics) — muted so data dominates
- **Never use:** Blue, green, yellow (except crime type indicators), `gray-*` classes

> **Rule:** On data-heavy pages, section `<h2>` labels use `text-slate-500 dark:text-[var(--ch-text-muted)]` — NOT `text-slate-700`. See [typography.md](./typography.md#heading-hierarchy-by-page-type).

---

## CSS Custom Properties — Single Source of Truth

All dark mode colors are controlled through CSS vars defined in `Layout.astro`. **This is the canonical system for both Astro templates AND JS-generated HTML.**

When a dark mode value needs to change site-wide, edit the var in `Layout.astro` — nowhere else.

```css
:root {
  /* Backgrounds */
  --ch-bg: hsl(0 0% 94%);
  --ch-surface: hsl(0 0% 100%);
  --ch-surface-hover: hsl(0 0% 97%);
  --ch-surface-sub: hsl(0 0% 97%);       /* inner areas within cards */
  --ch-pill-bg: #e2e8f0;                  /* slate-200 */
  /* Text */
  --ch-text: hsl(0 0% 20%);
  --ch-text-heading: hsl(0 0% 20%);      /* heading / title */
  --ch-text-strong: hsl(0 0% 15%);       /* bold heading, card titles */
  --ch-text-muted: hsl(0 0% 45%);        /* label / secondary */
  --ch-text-faint: hsl(0 0% 65%);        /* faint / date / supporting */
  --ch-pill-text: #475569;               /* slate-600 */
  /* Borders */
  --ch-border: hsl(0 0% 88%);
  --ch-border-card: hsl(0 0% 88%);       /* inner card dividers */
  --ch-border-subtle: hsl(0 0% 92%);     /* lightest inner borders */
}
.dark {
  /* Backgrounds */
  --ch-bg: hsl(0 0% 8%);
  --ch-surface: hsl(0 0% 13%);
  --ch-surface-hover: hsl(0 0% 18%);
  --ch-surface-sub: hsl(0 0% 10%);       /* inner areas within cards */
  --ch-pill-bg: hsl(0 0% 24%);
  /* Text */
  --ch-text: hsl(0 0% 92%);
  --ch-text-heading: hsl(0 0% 90%);      /* heading / title */
  --ch-text-strong: hsl(0 0% 85%);       /* bold heading, card titles */
  --ch-text-muted: hsl(0 0% 55%);        /* label / secondary */
  --ch-text-faint: hsl(0 0% 50%);        /* faint / date / supporting */
  --ch-pill-text: hsl(0 0% 55%);
  /* Borders */
  --ch-border: hsl(0 0% 22%);
  --ch-border-card: hsl(0 0% 18%);       /* inner card dividers */
  --ch-border-subtle: hsl(0 0% 15%);     /* lightest inner borders */
}
```

### Usage in Astro templates

```html
<!-- Preferred: var() references — dark mode handled automatically -->
<div class="bg-white dark:bg-[var(--ch-surface)]">
<p class="text-slate-500 dark:text-[var(--ch-text-muted)]">
<div class="border-slate-200 dark:border-[var(--ch-border-card)]">
```

### Usage in JS-generated HTML (runtime strings)

```js
`<div style="background:var(--ch-surface);border:1px solid var(--ch-border);color:var(--ch-text)">`
```

**Why not hardcode HSL?** If you hardcode `dark:text-[hsl(0_0%_55%)]` and the token value changes, you have to grep and update every file. With `var(--ch-text-muted)`, you change one line in `Layout.astro`.

---

## Dark Mode System

**Implemented:** February 17, 2026 — Dark is the **default** experience.

**Strategy:**
- Class-based (`@variant dark (&:is(.dark, .dark *));` in `Layout.astro`)
- `<html class="dark">` = dark mode (server-rendered default)
- Removing `.dark` = light mode (JS toggle)
- Anti-flash inline script in `<head>` reads `localStorage` before paint
- **localStorage key:** `crimehotspots-theme` — `'light'` = light, anything else = dark

### HSL Neutral Palette (for reference)

| Token | Light | Dark | CSS Var |
|-------|-------|------|---------|
| Page background | `bg-slate-100` | `dark:bg-[var(--ch-bg)]` | `--ch-bg` |
| Surface / card | `bg-white/85` | `dark:bg-[var(--ch-surface)]` | `--ch-surface` |
| Surface hover | `bg-white/95` | `dark:bg-[var(--ch-surface-hover)]` | `--ch-surface-hover` |
| Sub-surface | `bg-slate-50` | `dark:bg-[var(--ch-surface-sub)]` | `--ch-surface-sub` |
| Border (default) | `border-slate-200` | `dark:border-[var(--ch-border)]` | `--ch-border` |
| Border (card inner) | `border-slate-100` | `dark:border-[var(--ch-border-card)]` | `--ch-border-card` |
| Border (subtle) | `border-slate-50` | `dark:border-[var(--ch-border-subtle)]` | `--ch-border-subtle` |
| Divider gradient | `via-slate-300` | `dark:via-[var(--ch-border)]` | `--ch-border` |

### Text Hierarchy

| Role | Light | Dark | CSS Var |
|------|-------|------|---------|
| Body text | `text-slate-700` | `dark:text-[var(--ch-text)]` | `--ch-text` |
| Heading / title | `text-slate-700` | `dark:text-[var(--ch-text-heading)]` | `--ch-text-heading` |
| Strong heading | `text-slate-700 font-bold` | `dark:text-[var(--ch-text-strong)]` | `--ch-text-strong` |
| Label / secondary | `text-slate-500` | `dark:text-[var(--ch-text-muted)]` | `--ch-text-muted` |
| Faint / date | `text-slate-400` | `dark:text-[var(--ch-text-faint)]` | `--ch-text-faint` |

### Accent Colors

**Rose accents stay the SAME in both modes** — do NOT use muted variants like `dark:text-rose-400`.

| Usage | Class |
|-------|-------|
| Primary accent (links, CTAs, murder numbers) | `text-rose-600` (both modes) |
| Active border | `border-rose-600` or `#e11d48` (both modes) |
| Badge on dark bg | `bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400` |

---

## Standard Card Pattern

**Reference component:** `CrimeCard.astro` — all new cards must match.

```html
<!-- Container -->
bg-white/85 dark:bg-[var(--ch-surface)] backdrop-blur-md rounded-xl
border border-slate-100 dark:border-[var(--ch-border-card)]
shadow-md hover:shadow-lg transition

<!-- Heading -->
text-body font-bold text-slate-700 dark:text-[var(--ch-text-heading)]

<!-- Secondary text -->
text-caption text-slate-500 dark:text-[var(--ch-text-muted)]

<!-- Divider -->
border-t border-slate-200 dark:border-[var(--ch-border-card)]
```

---

## Scoped Dark Styles (CSS)

For `<style>` blocks inside Astro components, use `:global(.dark)`:
```css
.my-element { background: rgba(255, 255, 255, 0.7); }
:global(.dark) .my-element { background: rgba(255, 255, 255, 0.08); }
```

For raw CSS files (e.g., `dashboard.css`), use `:root.dark`:
```css
:root.dark .my-element { background: hsl(0 0% 12%); }
```

---

## Toggle Script & Theme Icons

**Toggle script:** `Layout.astro` just before `</body>` as `<script is:inline>`. Exposes `window.toggleTheme()`.
- Toggle buttons: `id="themeToggleDesktop"` (Header), `id="moreMenuThemeToggle"` (BottomNav More menu)

**Icon visibility — CSS-only (CORRECT pattern):**
```html
<!-- Sun: hidden by default, visible in dark mode -->
<svg id="themeIconSunDesktop" class="w-5 h-5 hidden dark:block">...</svg>
<!-- Moon: visible by default, hidden in dark mode -->
<svg id="themeIconMoonDesktop" class="w-5 h-5 block dark:hidden">...</svg>
```
**NEVER toggle icons with JavaScript** — CSS `dark:` handles it reliably.

---

## Dark Mode Tailwind Class Rules

**When `dark:` works** (Tailwind scans at build time):
- `.astro` component files
- `.ts` source modules (static string literals)

**When `dark:` DOESN'T work** — use CSS vars instead:
- `<script define:vars>` runtime template literals
- Any HTML built as a runtime string from data

---

## Safety Context Colors

| Level | Background | Border | Title | Icon |
|-------|-----------|--------|-------|------|
| High (>7) | `dark:bg-amber-950/50` | `dark:border-amber-800/60` | `dark:text-amber-300` | `dark:text-amber-400` |
| Neutral (4-6) | `dark:bg-[var(--ch-surface-sub)]` | `dark:border-[var(--ch-border-card)]` | `dark:text-[var(--ch-text-strong)]` | `dark:text-[var(--ch-text-muted)]` |
| Low (<4) | `dark:bg-emerald-950/50` | `dark:border-emerald-800/60` | `dark:text-emerald-300` | `dark:text-emerald-400` |

---

## CRITICAL: Tailwind v4 HSL with Opacity

**BROKEN:** `dark:bg-[hsl(0_0%_8%)/70]` — the `/70` outside the function is misinterpreted.

**CORRECT:** `dark:bg-[hsl(0_0%_8%_/_0.7)]` — alpha inside the HSL function. Applies to `via-`, `from-`, `border-`, etc.

---

## Off-Spec Values (tech debt)

These hardcoded values remain in the codebase and don't map cleanly to the token system. Fix them when touching the relevant file:

| Value | Count | Likely intent |
|-------|-------|---------------|
| `text-[hsl(0_0%_65%)]` | ~170 | Drift — probably should be `--ch-text-muted` |
| `text-[hsl(0_0%_88%)]` | ~93 | Close to `--ch-text-heading` (90%) |
| `text-[hsl(0_0%_60%)]` | ~41 | Drift — mid-range |
| `bg-[hsl(0_0%_12%)]` | ~23 | Old surface (now 13%) — use `--ch-surface` |
| `border-[hsl(0_0%_30%)]` | ~29 | Strong border, intentional per-component |
