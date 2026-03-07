---
id: L007
type: learning
status: active
created: 2026-01-26
updated: 2026-03-07
related: [L009, D003]
---

## Summary
Top Regions risk scoring is self-calibrating: each region's weighted crime score is expressed as a share of the national total, then labelled relative to the national average. This means labels stay meaningful even as overall crime volume changes.

## Implementation Details

**Files involved:**
- `src/config/riskWeights.ts` — per-crime-type severity weights
- `src/components/TopRegionsCard.astro` — server-side calculation
- `src/scripts/dashboardUpdates.ts` — client-side update on year filter change
- `src/lib/safetyHelpers.ts` — uses same weights for SafetyContext area scoring

**Algorithm (simplified):**
1. For each region: `weightedScore = Σ(crimeCount × weight)` across all crime types
2. `nationalTotal = Σ(all regions' weightedScores)`
3. `regionShare = weightedScore / nationalTotal` (percentage of national risk)
4. Label based on share vs average: `> 2× avg` → Critical, `> 1.5× avg` → High, etc.

**Key property:** self-calibrating — if all crime rises uniformly, labels stay the same. Only relative risk changes labels.

## Known Issues / Gotchas
- Area crime scoring (`calculateAreaCrimeScore()` in `safetyHelpers.ts`) uses a different scale (1–10) and a 90-day rolling window — it's NOT the same as Top Regions
- `getTopRegions()` in `statisticsHelpers.ts` counts primary + related crime types (not raw rows) — see L009
- Full methodology: `docs/guides/RISK-SCORING-METHODOLOGY.md`

## Change Log
- 2026-01-26: Safety context system implemented using same risk weights
