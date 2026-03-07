---
id: L008
type: learning
status: active
created: 2026-01-26
updated: 2026-03-07
related: [C001, L004, D001]
---

## Summary
`window.__crimesData` is the client-side crime array used by CrimeDetailModal for safety scoring, trending, and related crimes. It's set on exactly 5 pages. Area detail pages set area-scoped crimes only — not all crimes. Modal on those pages will only see that area's crimes.

## Implementation Details

**Pages that set `window.__crimesData`:**
1. `src/pages/trinidad/dashboard.astro` — all crimes
2. `src/pages/trinidad/headlines.astro` — all crimes
3. `src/pages/trinidad/archive/[year]/[month].astro` — all crimes
4. `src/pages/trinidad/area/[slug].astro` — area-scoped crimes only
5. `src/pages/trinidad/murder-count.astro` — all crimes

**Read by:** `CrimeDetailModal.astro` (for safety scoring, trending hotspots, related crimes)

**How it's set (via define:vars pattern):**
```astro
<script define:vars={{ crimes }}>
  window.__crimesData = crimes;
</script>
```

## Known Issues / Gotchas
- Pages that do NOT set `window.__crimesData`: statistics, compare, regions, blog, safety tips, crime detail pages themselves
- On crime detail pages, `window.__crimesData` is undefined — SafetyContext is calculated server-side instead
- If modal is opened from a page that doesn't set this, safety scoring and trending fall back to empty/disabled states

## Change Log
- 2026-01-26: Documented after SafetyContext modal integration
- 2026-02-06: CrimeDetailModal refactored — data flow unchanged
