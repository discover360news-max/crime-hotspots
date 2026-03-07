---
id: F008
type: feature
status: active
created: 2026-02-08
updated: 2026-03-07
related: [L008, C001]
---

## Summary
Two-part component: "Hot Areas This Week" (top 5 areas by crime count last 7 days, server-rendered) + "Your Recent Views" (last 3 crime pages visited, localStorage). Zero extra API calls — reuses already-loaded `allCrimes` array.

## Implementation Details

**Files:**
- `src/lib/trendingHelpers.ts` — `getHotAreas()`, `trackRecentView()`, `getRecentViews()`
- `src/components/TrendingHotspots.astro` — display component
- `src/scripts/modalHtmlGenerators.ts` → `generateTrendingHotspotsHTML()` — modal version

**Placement:** Every crime detail page (between article and SafetyContext) + CrimeDetailModal

**Hot Areas algorithm:**
- `getHotAreas(allCrimes, 5)` — filters to last 7 days, groups by area, sorts by crime count
- Heat dot intensity by rank: `rose-500` (1st) → `rose-400` (2nd) → `rose-300` (3rd+)
- Area links to `/trinidad/area/[slug]`

**Recent Views (localStorage):**
- Key: rolling buffer, max 20 entries, deduplication by slug
- Shows last 3 viewed crime pages
- Client-side only — graceful fallback if localStorage unavailable
- `trackRecentView(slug, title)` called on crime detail page load

## Known Issues / Gotchas
- Recent Views is client-side only — server-renders as empty, hydrates on load
- The component is part of the Muted UI system (see L005) — flame/clock icons use slate, not rose

## Change Log
- 2026-02-08: Trending hotspots + recent views implemented
- 2026-03-02: Muted UI rollout applied to component
