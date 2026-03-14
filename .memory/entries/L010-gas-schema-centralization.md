---
id: L010
type: learning
status: active
created: 2026-03-09
updated: 2026-03-13 (crime schema overhaul — new types + isContextType)
related: [F002, B013]
---

## Summary
The GAS pipeline has a critical fragmentation problem: crime types, severity rankings, safety tip enums, and classification rules are defined independently in `claudeClient.gs` (prompt), `crimeTypeProcessor.gs` (CRIME_SEVERITY), and the Astro frontend. They are already out of sync (e.g. Sexual Assault vs Shooting severity order differs between prompt and crimeTypeProcessor).

## Migration Plan
Full plan at `docs/guides/SCHEMA-CENTRALIZATION-PLAN.md`

6-phase migration, each independently testable:
- ✅ Phase 0: Baseline snapshot — captured 2026-03-09. Article: High Court/Coast Guard infant. `["Murder","Shooting","Assault"]`, confidence 6.
- ✅ Phase 1: Created `schema.gs` — CRIME_TYPES, SAFETY_TIP_CATEGORIES/CONTEXTS, CONFIDENCE_TIERS, all helpers. Added `getCrimeSchemaOrderMap()` for tie-breaking (not in original plan).
- ✅ Phase 2: Migrated `crimeTypeProcessor.gs` — CRIME_SEVERITY deleted, replaced with getCrimeSeverityMap() + schema-order tie-breaking. All 5 tests passed incl. Sexual Assault > Shooting fix.
- ✅ Phase 3: Migrated `claudeClient.gs` hierarchy string + crime types list to use schema helpers. Regression check passed (Murder+Shooting, confidence 7).
- ✅ Phase 4: Migrated `claudeClient.gs` safety tip enums to SAFETY_TIP_CATEGORIES/CONTEXTS. All checks passed.
- ✅ Phase 5: Created `astro-poc/src/config/crimeSchema.ts` — mirrors schema.gs. Build passes.
- ✅ Phase 6: Migrated frontend files (see Phase 6 details below). All builds passed.

## Phase 6 — Files Migrated
- `src/content/config.ts` — Zod enums now use `SAFETY_TIP_CATEGORIES` / `SAFETY_TIP_CONTEXTS`
- `src/pages/trinidad/safety-tips/submit/index.astro` — categories/contexts arrays from crimeSchema.ts
- `src/components/FiltersTray.astro` — crime type filter now uses `CRIME_TYPE_LABELS` (all 12 types)
- `src/config/riskWeights.ts` — `RISK_WEIGHTS` derived from `CRIME_SEVERITY_MAP` (values aligned to schema)

## Phase 6 — Files Intentionally NOT Migrated (with reasoning)
- `src/lib/statisticsHelpers.ts` `TRACKED_CRIME_TYPES` — deliberate 9-type curated subset for YoY stats
- `src/utils/reportValidation.ts` `validCrimes` — must match report form's `<option>` values exactly (security boundary); uses 9 types + 'Other'
- `src/scripts/statCardFiltering.ts` `pluralMap` — display/pluralization config, identity fallback for unknowns
- `src/scripts/leafletMap.ts` `CRIME_COLORS` — map pin color config, grey fallback for unknowns
- `src/config/crimeTypeConfig.ts` — behavioral config (useVictimCount per type), intentional per-type decisions
- `src/pages/trinidad/statistics.astro:210` — 5-type priority list for FAQ SEO structured data

## Crime Schema Overhaul (2026-03-13)
New types: Carjacking (sev 5, isContextType false), Domestic Violence (sev 4, isContextType true), Extortion (sev 3, isContextType false).
New field: `isContextType` on every entry — context types (Home Invasion, Domestic Violence) always yield to harm types in primary position.
Files changed: schema.gs, claudeClient.gs, crimeTypeProcessor.gs, crimeSchema.ts, crimeTypeConfig.ts, crimeColors.ts, leafletMap.ts, generateCrimeTypeThumbnails.ts, statisticsHelpers.ts, statCardFiltering.ts, reportValidation.ts (now imports from crimeSchema — arch fix), report.astro (now schema-driven — arch fix).
Removed stale `Vehicle Theft` from crimeColors.ts and generateCrimeTypeThumbnails.ts.
crimeTypeProcessor.gs: context types partitioned to end of reordered array — Home Invasion can never be primary when any harm type is present.
Assault promptDescription updated: clarifies ADD alongside Robbery when victim physically struck.
claudeClient.gs: added ASSAULT+ROBBERY COMBINATIONS section + CONTEXT TYPES ORDERING RULE section + Carjacking/DV/Extortion classification rules.
getContextTypeLabels() helper added to schema.gs.

## Hard Implications Addition (2026-03-14)
`CRIME_HARD_IMPLICATIONS` constant + `getHardImplications()` + `buildHardImplicationsBlock()` added to schema.gs.
CARJACKING promptDescription fixed (was "add Robbery only if extra property taken" — wrong per hard rule).
`CRIME_HARD_IMPLICATIONS` mirror added to crimeSchema.ts.
`determineCrimeTypes()` in crimeTypeProcessor.gs now applies hard implications as safety net before sort.
New HARD IMPLICATION RULES section + Carjacking fix + Shooting-as-primary clarification added to claudeClient.gs system prompt.
See L013 for full classification rules reference.

## Schema Drift — crimeSchema.ts vs schema.gs
✅ RESOLVED (2026-03-14) — both files synced after hard implications addition:
✅ RESOLVED (2026-03-13) — both files fully in sync after overhaul:
- `'Shooting'` added to `SAFETY_TIP_CATEGORIES` in schema.gs
- `'At a Hotel'` added to `SAFETY_TIP_CONTEXTS` in schema.gs

## Follow-up: crimeTypeConfig.ts gap
✅ RESOLVED (2026-03-09 session 3) — `'Attempted Murder': { useVictimCount: true }` added to `CRIME_TYPE_CONFIG`. Build passed.

## Known Drift (RESOLVED — fixed by GAS migration)
- ~~`CRIME_SEVERITY` in crimeTypeProcessor.gs: Home Invasion=8, Shooting=7, Sexual Assault=6~~ — fixed by Phase 2

## Audit Fixes Applied (2026-03-09) Before Migration
All in `claudeClient.gs` and `config.gs` and `processor.gs`:
1. max_tokens 2048 → 4096 (was silently truncating multi-crime articles)
2. Arson added to crime type schema + hierarchy
3. Attempted Murder added to schema + hierarchy + classification rules
4. victimCount must equal victims array length — cross-validation rule added
5. safety_tip_category/context changed to arrays (joined to CSV before sheet write)
6. Fragile || auto-insertion heuristic removed; enforcement moved into prompt
7. Arrest report carve-out added to follow-up exclusion
8. Max 5 sentences + priority order added to details field
9. Archive sheet header fixed: "Published Date" → "Publish Date"
10. logConfigStatus() now shows Claude config
