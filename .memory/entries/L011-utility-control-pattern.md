# L011 — Utility Control Pattern (Filter Bar)

**Status:** active (confirmed on dashboard + compare page, Mar 10 2026)

## Pattern

Utility controls (filters, toggles, view options) are visually separated from navigation CTAs and use a distinct filled-background button style.

### Structure
- **Navigation CTAs** (Headlines, Murder Count): `border-2 border-slate-300` ghost outline buttons — link to other pages
- **Utility controls** (Year, Filters): live in a **thin sticky bar** below the hero, separate from the CTA row
- **Utility button style**: `bg-slate-100 dark:bg-[hsl(0_0%_12%)]` filled pill, icon + label, no border — clearly a control not a link
- **Active state**: inline style override → `color: #e11d48`, `backgroundColor: color-mix(in srgb, #e11d48 12%, transparent)`

### Dashboard implementation (P2-01, Mar 10 2026)
- `#filterBar`: `sticky top-16 z-30` (below `h-16` site header)
- Contains: "Year" label → `#yearFilter` select (inline) → pipe divider → `#filtersBtn` (funnel icon + "Filters") → `#clearFiltersInline` (hidden until active)
- Drawer (`FiltersTray`) keeps: Crime Type, Region, Area
- Year select options: plain year numbers only ("2026", "2025") — no "Data" suffix
- `scroll-margin-top` on `#mapContainer`: `8rem` (clears header 64px + filter bar ~45px)

### Compare page implementation (P2-02, Mar 10 2026)
- `#selectorBar`: `sticky top-16 z-30` (same offset)
- Contains: "Area A" label → `#selectA` → vs divider → "Area B" label → `#selectB`
- Both selects use `filter-select max-w-[180px]` — same class as dashboard year select
- Redundant subtitle removed; `data-pagefind-body` moved to `<main>`

## Intent
Established as the standard pattern for any page with inline utility controls. Apply to new pages that need filters/selects above content (not navigation CTAs).

## Files touched
- `astro-poc/src/pages/trinidad/dashboard.astro` — filter bar HTML, active state logic (refactored Mar 10 2026 — see L012)
- `astro-poc/src/scripts/yearFilter.ts` — option labels trimmed
- `astro-poc/src/styles/dashboard.css` — scroll-margin-top bump
- `astro-poc/src/components/FiltersTray.astro` — called with `showYearFilter={false}` from dashboard
- `astro-poc/src/scripts/dashboardLocationFilter.ts` — active state logic now lives here (extracted Mar 10 2026)
