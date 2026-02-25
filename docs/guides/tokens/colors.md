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

> **Rule:** On data-heavy pages, section `<h2>` labels use `text-slate-500 dark:text-[hsl(0_0%_55%)]` — NOT `text-slate-700`. See [typography.md](./typography.md#heading-hierarchy-by-page-type).

---

## Dark Mode System

**Implemented:** February 17, 2026 — Dark is the **default** experience.

**Strategy:**
- Class-based (`@variant dark (&:is(.dark, .dark *));` in `Layout.astro`)
- `<html class="dark">` = dark mode (server-rendered default)
- Removing `.dark` = light mode (JS toggle)
- Anti-flash inline script in `<head>` reads `localStorage` before paint
- **localStorage key:** `crimehotspots-theme` — `'light'` = light, anything else = dark

### HSL Neutral Palette

| Token | Light | Dark |
|-------|-------|------|
| Page background | `bg-slate-100` | `dark:bg-[hsl(0_0%_3%)]` |
| Surface / header | `bg-white/85` | `dark:bg-[hsl(0_0%_5%)]` or `dark:bg-[hsl(0_0%_8%)]` |
| Card background | `bg-white/85` | `dark:bg-[hsl(0_0%_8%)]/85` |
| Shimmer background | `#e2e8f0` (CSS) | `hsl(0 0% 12%)` (CSS) |
| Border | `border-slate-100` or `border-slate-200` | `dark:border-[hsl(0_0%_15%)]` or `dark:border-[hsl(0_0%_18%)]` |
| Subtle border | `border-slate-300` | `dark:border-[hsl(0_0%_22%)]` |
| Divider gradient | `via-slate-300` | `dark:via-[hsl(0_0%_20%)]` or `dark:via-[hsl(0_0%_22%)]` |

### Text Hierarchy

| Role | Light | Dark |
|------|-------|------|
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
| Badge on dark bg | `bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400` |

---

## Standard Card Pattern

**Reference component:** `CrimeCard.astro` — all new cards must match.

```html
<!-- Container -->
bg-white/85 dark:bg-[hsl(0_0%_8%)]/85 backdrop-blur-md rounded-xl
border border-slate-100 dark:border-[hsl(0_0%_15%)]
shadow-md hover:shadow-lg transition

<!-- Heading -->
text-body font-bold text-slate-700 dark:text-[hsl(0_0%_90%)]

<!-- Secondary text -->
text-caption text-slate-500 dark:text-[hsl(0_0%_55%)]

<!-- Divider -->
border-t border-slate-200 dark:border-[hsl(0_0%_18%)]
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

## CSS Custom Properties (for JS-generated HTML)

Defined in `Layout.astro` `<style is:global>`. Use in JS template literals where Tailwind `dark:` classes can't be scanned (e.g., `modalHtmlGenerators.ts`, `headlines.astro` `<script define:vars>` blocks):

```css
:root {
  --ch-bg: hsl(0 0% 94%);
  --ch-surface: hsl(0 0% 100%);
  --ch-text: hsl(0 0% 20%);
  --ch-text-muted: hsl(0 0% 45%);
  --ch-border: hsl(0 0% 88%);
  --ch-pill-bg: #e2e8f0;
  --ch-pill-text: #475569;
}
.dark {
  --ch-bg: hsl(0 0% 3%);
  --ch-surface: hsl(0 0% 8%);
  --ch-text: hsl(0 0% 92%);
  --ch-text-muted: hsl(0 0% 70%);
  --ch-border: hsl(0 0% 18%);
  --ch-pill-bg: hsl(0 0% 20%);
  --ch-pill-text: hsl(0 0% 55%);
}
```

**Usage in JS:**
```js
`<div style="background:var(--ch-surface);border:1px solid var(--ch-border);color:var(--ch-text)">`
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
| Neutral (4-6) | `dark:bg-[hsl(0_0%_6%)]` | `dark:border-[hsl(0_0%_18%)]` | `dark:text-[hsl(0_0%_85%)]` | `dark:text-[hsl(0_0%_55%)]` |
| Low (<4) | `dark:bg-emerald-950/50` | `dark:border-emerald-800/60` | `dark:text-emerald-300` | `dark:text-emerald-400` |

---

## CRITICAL: Tailwind v4 HSL with Opacity

**BROKEN:** `dark:bg-[hsl(0_0%_8%)/70]` — the `/70` outside the function is misinterpreted.

**CORRECT:** `dark:bg-[hsl(0_0%_8%_/_0.7)]` — alpha inside the HSL function. Applies to `via-`, `from-`, `border-`, etc.
