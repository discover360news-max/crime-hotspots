# Risk Scoring Methodology

**Last updated:** March 4, 2026
**Applies to:** Top Regions card (dashboard), `TopRegionsCard.astro`, `dashboardUpdates.ts`

---

## Overview

The Top Regions card ranks regions by weighted crime severity and labels each with a risk level. The system is **self-calibrating** — no hardcoded absolute thresholds that need manual tuning. Labels update automatically as new crime data is added.

---

## Step 1 — Weighted Score Per Crime

Each crime row receives a weighted score based on its type and victim count.

```
weightedScore = crimeWeight × victimCount (primary crime)
              + sum of crimeWeight × 1 (each related crime type)
```

**victim count rule:** Only applied to the primary crime type. Related crimes always count as ×1. This prevents double-counting (matches the site-wide crime counting methodology).

**Crime weights** (defined in `src/config/riskWeights.ts`):

| Crime Type | Weight |
|---|---|
| Murder | 10 |
| Kidnapping | 9 |
| Sexual Assault | 8 |
| Shooting | 7 |
| Assault | 6 |
| Home Invasion | 5 |
| Robbery | 4 |
| Burglary | 3 |
| Theft | 2 |
| Seizures | 1 |
| (unknown) | 1 |

**Example:**
- Row: Murder (victimCount=2) + Shooting (related)
- Score: (10 × 2) + (7 × 1) = **27 points**

---

## Step 2 — Region Weighted Score

Sum the weighted scores of all crimes within a region:

```
regionWeightedScore = sum of weightedScore for all crimes where crime.region = region
```

---

## Step 3 — National Total

Sum the weighted scores across **all** regions in the current filter window:

```
nationalTotal = sum of all regionWeightedScores
```

---

## Step 4 — Region Share

Each region's share of the national weighted crime burden:

```
share = (regionWeightedScore / nationalTotal) × 100
```

---

## Step 5 — Bar Width

```
barWidth = (regionWeightedScore / maxRegionWeightedScore) × 100
```

The #1 region is always 100% (full bar). All others are proportional to it.

---

## Step 6 — Risk Label

Derived directly from bar width so bar and label always tell the same story:

| Bar width | Risk label | Text colour |
|---|---|---|
| ≤ 10% | Low | Green |
| ≤ 25% | Medium | Green |
| ≤ 45% | Concerning | Yellow |
| ≤ 65% | High | Yellow |
| ≤ 85% | Dangerous | Rose |
| > 85% | Extremely Dangerous | Rose |

**Example:** POS at 100% bar → Extremely Dangerous. Tunapuna at 75% bar → Dangerous.

---

## Sort Order

- **Sort order:** Absolute regional weighted score (descending). The region with the most severe crime volume appears first — typically Port of Spain.

---

## Why This Approach

**Self-calibrating:** The national total is the denominator. No manually set thresholds need tuning as crime levels change year to year.

**Severity-aware:** 10 murders score far higher than 50 thefts. The weighted system reflects actual risk, not just volume.

**Honest ordering:** Sort by absolute weighted score means the list answers "where is the most severe crime happening?" — which is what users expect.

---

## What This Does NOT Affect

- **SafetyContext system** (`src/lib/safetyHelpers.ts`) — uses a separate 1–10 scale based on 90-day crime density for individual area pages and the CrimeDetailModal. This is intentionally separate. See `docs/guides/The-Safety-Strength-Engine.md`.
- **`getTopRegions()`** in `statisticsHelpers.ts` — used by the Statistics page, counts raw crime types (not weighted). That page is about volume reporting, not risk scoring.

---

## Files Involved

| File | Role |
|---|---|
| `src/config/riskWeights.ts` | Crime type weights |
| `src/components/TopRegionsCard.astro` | Server-side render (initial page load) |
| `src/scripts/dashboardUpdates.ts` | Client-side update (year filter changes) |

Both `TopRegionsCard.astro` and `dashboardUpdates.ts` contain identical `getRiskLevelText()` and `getRiskTextColor()` functions. **If you change the share thresholds, update both files.**

---

## Tuning

The share thresholds (3 / 8 / 15 / 25 / 40) are the only values that may ever need adjustment. Change them in:

1. `src/components/TopRegionsCard.astro` → `getRiskLevelText()` + `getRiskTextColor()`
2. `src/scripts/dashboardUpdates.ts` → `getRiskLevelText()` + `getRiskTextColor()`
