# UX / Design System Audit Progress

Started: 2026-03-20

---

## P0 — Critical (All Done)

- [x] `about.astro` — typography fixes (font-semibold → font-bold on headings)
- [x] `contact.astro` — font-semibold violation on headings fixed
- [x] SEO: sitemap + deploy improvements

---

## P1 — High Priority

- [x] **font-semibold sweep** — `faq.astro`, `terms.astro`, `privacy.astro`, `methodology.astro`, `business-solutions.astro` — all heading font-semibold → font-bold
- [x] **methodology.astro** — missing responsive spacing: `py-4` → `py-4 sm:py-12`; removed undefined `animate-fadeIn` class
- [x] **trinidad/murders.astro** — H1 `text-2xl sm:text-3xl` → `text-display`
- [x] **trinidad/dashboard.astro** — H1 `text-heading` → `text-display`
- [x] **business-solutions.astro** — hand-rolled hero migrated to `<Hero>` component

---

## P2 — Medium Priority

Token violations and missing dark mode variants on main user-facing pages.

**`text-small` is not a design token** (silently ignored by Tailwind — element inherits font-size from parent). The 4-token scale is: `text-display` / `text-heading` / `text-body` / `text-caption`.

- [x] **`DateAccordion.astro` L41** — Date header `text-small font-semibold` → `text-body font-bold` (per typography token for accordion date labels)
- [x] **`report.astro` L27** — Page H1 `font-semibold` → `font-bold`
- [x] **`report.astro` L37, L60, L90** — Form section `<h3>` labels: `text-small font-semibold` → `text-caption font-bold`
- [x] **`headlines.astro` (global /headlines/)  L27, L28** — H1 and body text missing dark mode variants (`dark:text-[hsl(0_0%_95%)]` on H1, `dark:text-[hsl(0_0%_65%)]` on body)
- [x] **`trinidad/statistics.astro` L349, L375** — Sub-section h3: `text-base font-semibold` → `text-body font-bold`
- [x] **`trinidad/statistics.astro` L487** — "Latest Analysis" card h3: `text-lg font-semibold` → `text-body font-bold`
- [x] **`trinidad/statistics.astro` L637, L641, L645, L649** — "Related Resources" card h3s: missing size token + `font-semibold` → add `text-body font-bold`
- [x] **`jamaica/statistics.astro` L329, L355** — Same sub-section pattern as trinidad
- [x] **`jamaica/statistics.astro` L587, L591, L595, L599** — Same related resources pattern
- [x] **`trinidad/murder-count.astro` L185** — H2 `text-xl font-bold` → `text-heading font-bold`
- [x] **`trinidad/regions.astro` L98** — Region card h2 `text-base font-bold` → `text-body font-bold`

---

## P3 — Low Priority

Remaining `text-small` / `font-semibold` cleanup on secondary/tool pages and components.

- [x] **`headlines.astro` (global) L75** — `text-small` → `text-caption` on help text paragraph
- [x] **`404.astro` L38, L50, L62, L74, L86, L98** — Nav link labels `text-small font-semibold` → `text-caption font-bold`
- [x] **`business-solutions.astro` L181–L226** — Card h4s + body para `text-small` → `text-caption`
- [x] **`SectionPickerModal.astro` L63** — `text-small` → `text-caption`
- [x] **`report.astro` L154, L187, L194** — Button/link/feedback `text-small` → `text-caption`
- [x] **`trinidad/dashboard.astro` L345, L351** — Info widget h3s `font-semibold text-sm` → `font-bold text-caption`
- [x] **`tools/social-image-generator.astro` L69, L109, L258** — Internal tool h3s `text-lg font-semibold` → `text-body font-bold`
- [x] **`trinidad/region/[slug].astro` L225** — Crime-type chip label `text-sm font-semibold` → `text-caption font-bold`
- [x] **`trinidad/crime/[slug].astro` L285, L316, L363** — Inline paragraphs + label `font-semibold` → `font-bold`
- [~] **`compare.astro`** — Hero migration deferred: H1 uses `text-heading` correctly (Hero compact mode pattern). Full `<Hero>` migration blocked by (1) subtitle required, (2) `narrowContainer` gives `max-w-5xl` vs current `max-w-3xl`. Not a token violation.

---

## Post-P3 Sweep (2026-03-20)

Full grep sweep across `src/pages/` + `src/components/` found additional violations missed in P0–P3.

**`font-semibold` on heading elements — fixed:**
- `QuickAnswers.astro` — h3 `font-semibold` → `font-bold`
- `NewsletterSignup.astro` — h3 `text-sm font-semibold` → `text-caption font-bold`
- `BottomNav.astro` (×2) — h3 `text-xs font-semibold` → `font-bold`
- `MapLegend.astro` — h3 `text-xs font-semibold` → `font-bold`
- `trinidad/murders.astro` — h2 date group label `text-xs font-semibold` → `font-bold`

**Raw size tokens on heading elements — fixed:**
- `CrimeDetailModal.astro` — h2 `text-lg` → `text-heading` (modal title)
- `FiltersTray.astro` — h2 `text-lg` → `text-heading` (panel title)
- `TrendingHotspots.astro` — h2 `text-sm` → `text-caption`
- `blog/index.astro` — h3 `text-sm` → `text-caption`
- `business-solutions.astro` — h3 `text-sm` → `text-caption`
- `trinidad/compare.astro` — h3 (JS template) `text-sm` → `text-caption`
- `trinidad/murder-count.astro` — h3 `text-sm` → `text-caption`
- `trinidad/area/[slug].astro` (×4) — h2 `text-lg` → `text-body`
- `trinidad/mp/[slug].astro` — h2 `text-base` → `text-body`; h2 `text-lg` → `text-body`
- `trinidad/mp/index.astro` — h2 `text-lg` → `text-body`
- `trinidad/region/[slug].astro` (×3) — h2 `text-lg` → `text-body`
- `jamaica/parishes.astro` — h2 `text-base` → `text-body`
- `jamaica/mp/[slug].astro` — h2 `text-base` → `text-body`
- `jamaica/mp/index.astro` — h2 `text-lg` → `text-body`
- `jamaica/murder-count.astro` — h2 `text-xl` → `text-heading`
- `jamaica/dashboard.astro` — h2 `text-lg` → `text-body`

**Result: All three sweeps (`text-small`, `font-semibold` on headings, raw size on headings) return 0 matches.**
