# F016 — SocialProofStrip

**Status:** COMPLETE (38/38 pages done)
**Tracker:** `docs/guides/SOCIAL-PROOF-STRIP-IMPLEMENTATION.md`

---

## What It Is

A reusable `src/components/SocialProofStrip.astro` component displaying 4 real site metrics to build trust with new visitors:

| Stat | Source | Color |
|------|--------|-------|
| Monthly readers | `social-proof.json` (`monthly_readers_display`) | Blue |
| Monthly impressions | `social-proof.json` (`monthly_impressions_display`) | Violet |
| Incidents tracked | D1 live query (fallback: `incident_count_fallback`) | Rose |
| Areas monitored | `social-proof.json` (`areas_monitored_display`) | Emerald |

**Central data file:** `src/data/social-proof.json` — update weekly. Has both `_display` (full: `3,600+`) and `_short` (abbreviated: `3.6K+`) fields.

---

## Three Confirmed Variants

### `hero` — Inside dark hero sections
- 2×2 grid, abbreviated numbers (`_short` fields)
- Cards: `bg-blue-500/10 border border-blue-400/20`, numbers `text-blue-300`
- Placement: right column of hero grid, `w-full lg:w-52` (visible on mobile, stacks below hero text)

### `sidebar` — Below existing hero right-column content
- Same card style as `hero` (identical classes)
- 2×2 grid, abbreviated numbers
- Placement: stacked below existing right-column card (e.g. blog card on dashboard)
- When adding: change hero grid to `items-center`

### `strip` — Between page content sections
- 4-col row (`grid-cols-2 sm:grid-cols-4`), full numbers (`_display` fields)
- Cards: `bg-blue-50 dark:bg-blue-950/40 border border-blue-100`, numbers `text-blue-600 dark:text-blue-400`
- Section label: `"Trusted by readers across the Caribbean"` (text-[10px] uppercase)
- Wrapper: `<div class="max-w-[3xl|5xl] mx-auto px-4 sm:px-6 pb-10">`

---

## All 38 Pages — DONE

### Hero variant (dark hero grid split)
Area Detail, Regions, Region Detail, Murders, Compare, Safety Tips Index, Safety Tip Detail, Statistics (TT), Homepage, Headlines

### Sidebar variant
Dashboard (below blog card in hero right col)

### Strip after `<Hero>` component
About, Business Solutions, safety-tips/category, safety-tips/context, safety-tips/area, MP Index (TT), MP Profile (TT), Help Index, Help Article, Archive Index (TT), Archive Month (TT), Jamaica Dashboard, Jamaica Headlines, Jamaica Statistics, Jamaica Parishes, Jamaica Archive, Jamaica MP Index, Jamaica MP Profile

### Strip inside content
Murder Count (after vitals row), Areas (inside main), Blog Index, Blog Post, Support, Methodology, FAQ, Contact, Jamaica Murder Count

---

## Key Implementation Notes

- Always pass `incidentCount={allCrimes.length}` when `allCrimes` is in scope
- Prerendered pages without D1: omit `incidentCount` — falls back to `incident_count_fallback`
- Hero right col: `w-full lg:w-52` (NOT `hidden lg:block`)
- Grid split: `<div class="grid lg:grid-cols-[1fr_auto] gap-8 items-center">`

### Import depth reference
- `src/pages/` → `'../components/SocialProofStrip.astro'`
- `src/pages/trinidad/` or `jamaica/` or `blog/` or `help/` → `'../../components/SocialProofStrip.astro'`
- `src/pages/trinidad/mp/`, `archive/`, `safety-tips/`, `jamaica/mp/`, `jamaica/archive/` → `'../../../components/SocialProofStrip.astro'`
- `src/pages/trinidad/safety-tips/category|context|area/`, `trinidad/archive/[year]/` → `'../../../../components/SocialProofStrip.astro'`
