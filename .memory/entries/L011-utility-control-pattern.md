# L011 — Utility Control Pattern (Filter Bar)

**Status:** candidate (confirmed on dashboard, not yet rolled out globally)

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

## Intent
Kavell flagged this as a candidate global pattern for any page with utility controls. Before applying elsewhere, confirm the pattern is working well on the dashboard across a few sessions.

## Files touched
- `astro-poc/src/pages/trinidad/dashboard.astro` — filter bar HTML, active state logic
- `astro-poc/src/scripts/yearFilter.ts` — option labels trimmed
- `astro-poc/src/styles/dashboard.css` — scroll-margin-top bump
- `astro-poc/src/components/FiltersTray.astro` — called with `showYearFilter={false}` from dashboard
