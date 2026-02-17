# UX & UI Design System Audit — Progress Tracker

**Initiated:** February 17, 2026
**Goal:** Polished, app-like professional feel through strict design system discipline.
**Full Plan:** `/Users/kavellforde/.claude/plans/radiant-bubbling-aho.md`

---

## Phase 0 — Setup
- [x] Create this progress tracker

---

## Phase 1 — Global Foundation (Design Tokens)

### 1A. Typography — Strict 4-Level Scale
**Files:** `astro-poc/tailwind.config.mjs` + `astro-poc/src/layouts/Layout.astro`

| New Token | Size | Replaces |
|-----------|------|----------|
| `text-display` | 2rem (32px), leading-tight | `display` (36px) + `h1` (32px) |
| `text-heading` | 1.375rem (22px), leading-snug | `h2` (24px) + `h3` (20px) |
| `text-body` | 1.125rem (18px), leading-relaxed | `body` (16px) |
| `text-caption` | 0.75rem (12px), leading-snug | `small` + `tiny` + `nav` |

- [ ] Update `tailwind.config.mjs` — new 4-level `fontSize` config
- [ ] Update `Layout.astro` `@theme` block — remove 8 old tokens, add 4 new
- [ ] Bump body text to 18px (`text-body: 1.125rem`)
- [ ] 2 weights only: `font-normal` and `font-bold` (no `font-semibold` on headings)

### 1B. Color Standardization
- [ ] Replace all `gray-*` with `slate-*` equivalents (found in `DashboardInfoCards.astro`)
- [ ] Standardize card opacity: all `bg-white/70`, `bg-white/80`, `bg-white/90` → `bg-white/85`
- [ ] Fix Leaflet cluster colors in `Layout.astro` (lines ~239–248): replace raw hex with rose palette vars

### 1C. Spacing — 8px Grid
**File:** `astro-poc/tailwind.config.mjs` + `astro-poc/src/layouts/Layout.astro`

- [ ] Fix `mt-30` in footer → `mt-16`
- [ ] Add `'Inter'` to front of `fontFamily.sans` array in tailwind.config.mjs
- [ ] Change `borderRadius.lg` from `0.5rem` → `0.75rem` (currently same as `DEFAULT`)
- [ ] Add `minHeight['button']: '22px'` to replace hardcoded `min-h-[22px]`
- [ ] Document `p-3` (12px) and `p-5` (20px) as accepted 4px grid exceptions

---

## Phase 2 — Component Consolidation

### 2A. Modal Consolidation
**New:** `astro-poc/src/components/IslandSelectorModal.astro`
**Pattern from:** `SectionPickerModal.astro`

- [ ] Create `IslandSelectorModal.astro` with `type` prop
- [ ] Update `src/pages/index.astro` — replace old modal imports
- [ ] Update `src/pages/trinidad/headlines.astro` — replace HeadlinesModal
- [ ] Update `src/pages/trinidad/areas.astro` — replace AreasModal
- [ ] Update dashboard page — replace DashboardModal/ArchivesModal
- [ ] Delete `HeadlinesModal.astro`
- [ ] Delete `DashboardModal.astro`
- [ ] Delete `ArchivesModal.astro`
- [ ] Delete `AreasModal.astro`

### 2B. Header.astro Targeted Fixes
**File:** `astro-poc/src/components/Header.astro`

- [ ] Replace all `text-nav` → `text-caption` (per new type scale)
- [ ] Replace all `text-small` → `text-caption`
- [ ] Desktop nav links: use `text-body` (18px)
- [ ] Fix mobile Report CTA: `text-rose-400 hover:text-rose-600` → `text-rose-600 font-bold`
- [ ] Replace any `text-gray-500` → `text-slate-500`

### 2C. BottomNav.astro
**File:** `astro-poc/src/components/BottomNav.astro`

- [ ] Replace `text-[10px]` → `text-caption`

---

## Phase 3 — Component Token Pass

**Migration rule:** `text-small/tiny/nav` → `text-caption` | `text-h1` → `text-display` | `text-h2/h3` → `text-heading`

- [ ] `CrimeCard.astro` — date → `text-caption`; headline → add `leading-snug`
- [ ] `SafetyContext.astro` — meta → `text-caption` (tip text already has `leading-relaxed`)
- [ ] `RelatedCrimes.astro` — `text-xs`/`text-[10px]` → `text-caption`
- [ ] `TrendingHotspots.astro` — `text-xs`/`text-[10px]` → `text-caption`
- [ ] `StatCards.astro` — label → `text-caption` (note: number sizes `text-2xl/3xl` are documented exception)
- [ ] `Hero.astro` — H1 → `text-display leading-tight`; subheading → `text-body`
- [ ] `InfoPopup.astro` — body → `text-body`; meta → `text-caption`
- [ ] `Breadcrumbs.astro` — items → `text-caption`
- [ ] `DashboardInfoCards.astro` — replace `text-gray-*` → `text-slate-*`

---

## Phase 4 — Page-Level Polish

### Crime Detail Page
**File:** `astro-poc/src/pages/trinidad/crime/[slug].astro`

- [ ] Add `leading-tight` to H1 (`text-display`)
- [ ] Metadata (date, location, source) → `text-caption`

### Headlines Page
**File:** `astro-poc/src/pages/trinidad/headlines.astro`

- [ ] Add `aria-hidden="true"` to timeline dot `<div>` elements
- [ ] Filter tray: `w-80` → `max-w-[min(20rem,calc(100vw-2rem))]`
- [ ] Accordion date headers: add `leading-snug`
- [ ] Update all text tokens to new 4-level scale

### Blog Post Page
**File:** `astro-poc/src/pages/blog/[slug].astro`

- [ ] Fix share button colors:
  - Facebook: `bg-[#1877F2] text-white`
  - X/Twitter: `bg-slate-900 text-white`
  - WhatsApp: `bg-[#25D366] text-white`
  - Copy Link: `bg-rose-600 text-white`
  - Remove `bg-slate-400`
- [ ] Wrap `<Content />` in `<div class="max-w-prose">` (65ch line length)
- [ ] Add `leading-tight` to page H1

### Areas Index Page
**File:** `astro-poc/src/pages/trinidad/areas.astro`

- [ ] Region H2 headers: add `leading-tight`
- [ ] Area card H3 titles: add `leading-snug`
- [ ] Area card titles: add `line-clamp-1`

---

## Verification Checklist

After all phases complete:

- [ ] `npm run build` passes under 15 minutes
- [ ] Dev server visual check:
  - [ ] `/` — homepage (SectionPickerModal still works)
  - [ ] `/trinidad/headlines` — filter tray, accordion, timeline dots
  - [ ] `/trinidad/crime/[slug]` — article typography, 4 type sizes visible
  - [ ] `/blog/[slug]` — share button colors, content width
  - [ ] `/trinidad/areas` — heading hierarchy
- [ ] Mobile 375px viewport check — filter tray, BottomNav, modals
- [ ] Accessibility: Tab through headlines page — timeline dots not focusable
- [ ] No visual regressions on dashboard, murder-count page

---

## Out of Scope (Deferred)
- Breaking news badge
- Dark mode
- Header mobile menu extraction to sub-component
- StatCards number sizes (`text-2xl/3xl`) — documented scale exception
