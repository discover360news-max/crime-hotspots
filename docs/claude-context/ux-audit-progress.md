# UX & UI Design System Audit — Progress Tracker

**Initiated:** February 17, 2026 | **Last updated:** March 20, 2026
**Goal:** Polished, app-like professional feel through strict design system discipline.

---

## Completed (Feb–Mar 2026)

- Typography 4-level scale added to `tailwind.config.mjs` + `Layout.astro` (`text-display/heading/body/caption`)
- `borderRadius.lg` updated 0.5rem → 0.75rem
- `IslandSelectorModal.astro` created; replaced 4 separate modal files (Dashboard/Headlines/Archives/Areas)
- `rounded-md` removed from active use; `rounded-lg` is standard
- SPA / ClientRouter / View Transitions removed (Mar 15)
- `about.astro` body text: `text-xs` → `text-body`; typo fixed (Mar 20)
- `contact.astro`: H1/button `font-semibold` → `font-bold`; intro `text-body`; card H3s `text-caption font-bold`; hard dividers → gradient; all `text-xs` → token (Mar 20)
- Jamaica `statistics.astro` + `murder-count.astro`: `noindex={true}` already set (confirmed Mar 20)
- `animate-fadeIn` on `methodology.astro` — **verify this is actually defined in tailwind config**

---

## P0 — Fix These First (Visible defects / SEO harm)

- [x] **`about.astro` — body text was `text-xs` (12px)** — fixed Mar 20. All paragraphs now `text-body text-slate-600 dark:text-[var(--ch-text-muted)]`. Typo "currrently" fixed.

- [x] **`contact.astro` — H1/button used `font-semibold`** — fixed Mar 20. H1 + CTA button → `font-bold`. Card H3s were `text-small font-semibold` → `text-caption font-bold`. Intro para → `text-body`. All `text-xs` → `text-caption` tokens throughout.

- [x] **Hard dividers in `contact.astro`** — fixed Mar 20. Replaced solid `bg-slate-200` lines with gradient lines (kept label text structure, mirrored gradient direction on right side). Search `h-px bg-slate-200` on other pages still needed — only contact confirmed so far.

- [x] **Jamaica stats + murder count `noindex`** — already set (`noindex={true}` confirmed on both pages). No action needed.

---

## P1 — High (Cross-page inconsistencies)

- [ ] **Utility page H1 treatment inconsistent**
  `about.astro` has `<Hero>`. `contact`, `faq`, `terms`, `privacy`, `methodology` don't — and that's **fine** (lighter feel is defensible, not a best-practice violation). But their inline H1s must follow the same rules:
  - `font-bold` not `font-semibold`
  - `text-display` token (not raw sizes)
  - `py-4 sm:py-12` on `<main>` consistently
  - Confirmed violation: `contact.astro` H1 already captured in P0 above.
  - Check `faq`, `terms`, `privacy`, `methodology` for the same `font-semibold` drift.

- [ ] **`methodology.astro` main has no responsive spacing**
  Uses `py-4 animate-fadeIn` with no `sm:` breakpoint. All sibling pages use `py-4 sm:py-12`.

- [ ] **`trinidad/murders.astro` H1 uses raw `text-2xl`**
  Should be `text-display font-bold`. Every other page uses the 4-level token.

- [ ] **`trinidad/dashboard.astro` H1 uses `text-heading` not `text-display`**
  H1 on the most-visited page renders at 22px instead of 32px. Should be `text-display font-bold`.

- [ ] **`business-solutions.astro` has a hand-rolled hero section**
  Inline gradient section built from scratch — not using `<Hero>` component. Won't inherit dark mode or future design system changes. Should be migrated to `<Hero compact={false} narrowContainer={false} ...>`.

- [ ] **`data-capability-sheet.astro` uses `max-w-4xl` — document as intentional**
  Wider than site standard (`max-w-3xl`). Justified for B2B document layout — add a comment at top of file and note in site-features.md to prevent future "fix" that breaks the layout.

- [ ] **Global `/headlines` vs country headlines — structural decision needed**
  `/headlines` (root) uses Browse/Selection pattern (`max-w-6xl` outer, `max-w-3xl` inner). Since each island will need its own headlines page, the global `/headlines` route is likely either a redirect hub or a Jamaica placeholder. Decision: does it stay as-is, redirect, or become an island picker page?

---

## P2 — Medium (Design token violations)

- [ ] **Raw HSL values instead of CSS vars — sitewide drift**
  Rule: `dark:bg-[var(--ch-surface)]` not `dark:bg-[hsl(0_0%_13%)]`. Confirmed in `about.astro:29` and throughout. Run a grep for `dark:bg-\[hsl` and `dark:text-\[hsl` to find all instances.

- [ ] **`font-semibold` on headings — sitewide sweep needed**
  Confirmed in `contact.astro`. Run grep for `font-semibold` across `src/pages/` and `src/components/`. Replace all heading/label instances with `font-bold`. (Note: `font-semibold` is permitted on inline body text emphasis, not on headings or buttons.)

- [ ] **Card opacity not standardized**
  Multiple values exist: `bg-white/70`, `bg-white/80`, `bg-white/90`. Standard is `bg-white/85`. Grep and normalize.

- [ ] **`gray-*` → `slate-*` in `DashboardInfoCards.astro`**
  Slate palette only — no gray.

- [ ] **`blog/[slug].astro` — `<Content />` not wrapped in `max-w-prose`**
  Long lines go unbounded on wide viewports. Wrap in `<div class="max-w-prose">` (65ch).

- [ ] **`blog/[slug].astro` — share button colors use `bg-slate-400`**
  Fix to branded colors: Facebook `bg-[#1877F2]`, X `bg-slate-900`, WhatsApp `bg-[#25D366]`, Copy Link `bg-rose-600`.

- [ ] **`blog/[slug].astro` — H1 missing `leading-tight`**

- [ ] **`trinidad/crime/[slug].astro` — H1 missing `leading-tight`; metadata not on `text-caption`**

- [ ] **Component token sweep** (from Feb audit, still open)
  - `CrimeCard.astro` — date → `text-caption`; headline → add `leading-snug`
  - `RelatedCrimes.astro` — `text-xs`/`text-[10px]` → `text-caption`
  - `TrendingHotspots.astro` — `text-xs`/`text-[10px]` → `text-caption`
  - `StatCards.astro` — label → `text-caption` (number sizes `text-2xl/3xl` are a documented exception)
  - `Breadcrumbs.astro` — items → `text-caption`
  - `SafetyContext.astro` — meta → `text-caption`

- [ ] **Header.astro — token fixes** (from Feb audit)
  - Desktop nav links: replace any remaining `text-nav`/`text-small` → `text-caption`
  - Mobile Report CTA: confirm `text-rose-600 font-bold`

- [ ] **BottomNav.astro** — replace `text-[10px]` → `text-caption`

- [ ] **Footer `mt-30`** → `mt-16` (invalid Tailwind spacing token)

- [ ] **`min-h-[22px]` → `min-h-button` sitewide**
  `minHeight['button']: '22px'` should be in `tailwind.config.mjs`. Once confirmed, run find/replace.

---

## P3 — Low (Structural gaps)

- [ ] **Missing JSON-LD on high-value pages**
  | Page | Missing Schema | Why it matters |
  |------|---------------|----------------|
  | `trinidad/crime/[slug]` | `NewsArticle` | Google News eligibility — highest priority |
  | `about.astro` | `Organization` | Knowledge panel signals |
  | `jamaica/statistics` | `Dataset` | Google Dataset Search (once data live) |

- [ ] **`report.astro` missing `<Breadcrumbs>`**
  Every content page has breadcrumbs except report and 404. 404 is fine; report page should have them.

- [ ] **`animate-fadeIn` in `methodology.astro` — verify definition**
  Not in the documented design tokens. Either it's in `tailwind.config.mjs` as a custom animation (check) or it's silently doing nothing.

- [ ] **`trinidad/areas.astro` — heading hierarchy leading**
  Region H2 headers: add `leading-tight`. Area card H3 titles: add `leading-snug` + `line-clamp-1`.

- [ ] **`trinidad/headlines.astro` — accessibility + filter tray**
  - Timeline dot `<div>` elements: add `aria-hidden="true"`
  - Filter tray: `w-80` → `max-w-[min(20rem,calc(100vw-2rem))]` (prevents overflow on small screens)

- [ ] **Jamaica T&T parity pass** — deferred until Jamaica D1 is live
  When Jamaica data goes live: audit statistics, murder-count, dashboard for container widths, H1 patterns, breadcrumbs, and JSON-LD matching T&T equivalents.

---

## Verification Checklist (run after each fix batch)

- [ ] `npm run build` passes
- [ ] `/` — homepage
- [ ] `/about`, `/contact`, `/faq` — H1 weight + spacing look consistent
- [ ] `/trinidad/dashboard` — H1 renders at display size
- [ ] `/trinidad/headlines` — filter tray, accordion, timeline dots
- [ ] `/trinidad/crime/[slug]` — H1 leading, metadata caption size
- [ ] `/blog/[slug]` — share button colors, content width capped
- [ ] Mobile 375px — filter tray, BottomNav, no overflow

---

## Out of Scope (Deferred)
- Breaking news badge
- Dark mode overhaul
- Header mobile menu extraction to sub-component
- StatCards number sizes (`text-2xl/3xl`) — documented scale exception
- Leaflet cluster colors → rose palette vars (low visibility)
