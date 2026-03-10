# L012 — Dashboard Script Extraction Pattern

**Status:** active (Mar 10 2026)

## Context
`dashboard.astro` was 869 lines — over the page size guideline. The bulk was inline `<script>` blocks totalling ~418 lines.

## What was extracted

| File created | What it does | Lines saved |
|---|---|---|
| `src/components/MapLegend.astro` | Collapsible map legend (HTML + `is:inline` animation script) | ~100 |
| `src/scripts/dashboardMapInit.ts` | Polls `window.__crimesData`, then calls `initializeLeafletMap` with Trinidad config | ~49 |
| `src/scripts/dashboardLocationFilter.ts` | Region/area cascading dropdowns, filter active state, clear logic | ~177 |

**Result:** 869 → 554 lines.

## dashboardLocationFilter.ts — key design note
The 4x repeated shimmer/update pattern was unified into a single `applyShimmerUpdate(shimmerId, targetId, updateFn)` helper inside the module. `targetId` accepts either an element ID or a CSS class selector (prefixed with `.`).

## Line limit update (confirmed Mar 10 2026)
- Simple / content pages: ~500 lines
- Complex interactive pages (dashboards, heavily scripted): ~600 lines
- This is a guideline, not a hard cutoff — use judgement

## Scripts directory (for reference)
All dashboard-related scripts:
- `dashboardDataLoader.ts` — fetches CSV, sets `window.__crimesData`
- `dashboardUpdates.ts` — `updateStatsCards`, `updateQuickInsights`, `updateTopRegions`
- `dashboardMapInit.ts` — Leaflet init + polling (NEW)
- `dashboardLocationFilter.ts` — region/area filter logic (NEW)
- `yearFilter.ts` — year select init + callbacks
- `statCardFiltering.ts` — stat card click → filter sync
- `statsScroll.ts` — horizontal scroll wheel handler
- `leafletMap.ts` — Leaflet wrapper (`initializeLeafletMap`, `updateLeafletMap`)

## Extraction signal
If a `<script>` block in a page exceeds ~50 lines and contains named functions, extract it to `src/scripts/`. The page entry point should be a 2–3 line import + `addEventListener`.
