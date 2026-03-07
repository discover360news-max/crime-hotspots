---
id: L009
type: learning
status: active
created: 2026-03-03
updated: 2026-03-07
related: [D003, L007, B010]
---

## Summary
"All Crimes" = count of primary crime type + count of each related crime type per row. NOT raw row count. NOT victim count. Murder is the exception: victimCount applies (double murder = 2). This is LOCKED IN as of Mar 3, 2026.

## Implementation Details

**Canonical function:** `getTotalCrimeCount()` in `src/lib/statisticsHelpers.ts`

**Where this logic is applied:**
- `getTotalCrimeCount()` in `statisticsHelpers.ts` — server-side canonical
- `getTopRegions()` — summed crime count denominator
- `calculateInsights()` in `dashboardHelpers.ts` — area map
- `updateQuickInsights()` in `dashboardUpdates.ts` — client-side filter updates
- `compare.astro` — `total90d` and `totalAll` both use crime count

**The murder exception:**
```ts
// For murder: victimCount applies
// For all other crimes: each occurrence = 1
// Murder|Murder in related = 2 murders (2 victims)
// Never Set()-deduplicate related crimes — duplicates are intentional
```

**Label rule:** Use **"crimes"** everywhere in the UI. "incidents" is acceptable only in prose/methodology text.

## Known Issues / Gotchas
- This is confirmed locked-in with Kavell — do not revert to row counting
- Raw row count would undercount crimes (misses related types)
- Victim count would overcount (inflated by high-victim events)
- `Murder|Murder` in related crimes = 2 deaths — never deduplicate with Set()

## Change Log
- 2026-03-03: Methodology locked in with Kavell; applied across all calculation points
