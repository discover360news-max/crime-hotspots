---
id: D003
type: decision
status: active
created: 2026-01-01
updated: 2026-03-07
related: [L009, B010]
---

## Summary
Victim count applies ONLY to the PRIMARY crime type. Related crimes always count as exactly +1 victim each, regardless of victim count. This prevents double-counting when a shooting results in multiple murders.

## Decisions Made

**The rule:**
- Row: Primary = Murder (victimCount=3), Related = [Shooting]
- Result: Murder +3, Shooting +1

**Why not apply victimCount to related crimes:**
- Related crimes are flags for what else happened — "there was also a shooting"
- Applying victimCount to related would mean 3 murders AND 3 shootings — wrong
- The primary crime type "owns" the victim count

**Configuration:** `astro-poc/src/config/crimeTypeConfig.ts`

## relatedCrimeTypes Repetition Convention
When victim counts differ across crime types in the same incident, the related crime type is **repeated N times** to encode the count. This is intentional and the analytics layer relies on it.

Example — shooting where 5 injured, 2 died:
- `primaryCrimeType`: Murder, `victimCount`: 2
- `relatedCrimeTypes`: "Attempted Murder, Attempted Murder, Attempted Murder, Shooting, Shooting, Shooting, Shooting, Shooting"

Analytics code counts repetitions via `.split(',').map(t => t.trim()).filter(Boolean).length` — each repetition = 1 victim. **Do NOT change this encoding without migrating all D1 data and updating all parsers.**

Validated March 2026: 2,633 records checked; only 1 instance of primary appearing in related (data entry error). Cross-field dedup is NOT needed.

**Display dedup:** `CrimeDetailModal.astro` and `crime/[slug].astro` both use `[...new Set(...)]` before rendering pills — shows each crime type once. This is display-only and does NOT affect analytics. Do not remove the Set().

## Known Issues / Gotchas
- `Murder|Murder` in related crimes = 2 separate murders (e.g. 4 shot, 2 died) — intentional, do NOT deduplicate
- Repetition format is 15+ months of production data — schema change requires D1 migration + updating 10+ files
- See L009 for the full crime counting methodology
- See B010 for the related crime counting pattern in GAS scripts

## Change Log
- 2026-01-01: Victim count system implemented
- 2026-03-02: Confirmed and locked in with Kavell
- 2026-03-17: Documented repetition convention; added display dedup to modal + slug page
