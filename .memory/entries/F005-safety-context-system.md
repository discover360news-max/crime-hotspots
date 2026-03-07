---
id: F005
type: feature
status: active
created: 2026-01-26
updated: 2026-03-07
related: [F003, L007, L008, C001]
---

## Summary
"The Safety Strength Engine" — calculates area crime scores (1–10 scale, 90-day rolling window) and shows contextual safety tips on crime detail pages and in CrimeDetailModal. Three risk levels with colour-coded backgrounds.

## Implementation Details

**Files:**
- `src/lib/safetyHelpers.ts` — `calculateAreaCrimeScore()`, `getSafetyContext()`, `toDate()`
- `src/components/SafetyContext.astro` — display component
- `src/pages/trinidad/crime/[slug].astro` — server-side integration
- `src/scripts/modalHtmlGenerators.ts` → `generateSafetyContextHTML()` — modal integration

**Risk levels:**
- High (>7): Amber background, actionable prevention tips
- Neutral (4–6): Slate background, maintenance tips
- Low (<4): Emerald background, positive reinforcement

**Score algorithm:**
- 90-day crime density for the area
- Weighted by crime type severity (from `riskWeights.ts`)
- Returns 1–10 scale

## Known Issues / Gotchas
- Modal requires `window.__crimesData` populated (see L008) — crime detail pages calculate server-side instead
- `toDate()` is exported from `safetyHelpers.ts` and shared by `trendingHelpers.ts`
- Client-side modal calculation must use `dateObj` field (not just `date` string)
- Do NOT remove from modal — improves UX by keeping users engaged with safety content
- Keep language non-alarmist — positive framing for low-crime areas benefits SEO

## Change Log
- 2026-01-26: Initial implementation with 25 tips
- 2026-01-26: Integrated into CrimeDetailModal
