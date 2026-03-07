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

## Known Issues / Gotchas
- `Murder|Murder` in related crimes = 2 separate murders (e.g. 4 shot, 2 died) — intentional, do NOT deduplicate
- See L009 for the full crime counting methodology
- See B010 for the related crime counting pattern in GAS scripts

## Change Log
- 2026-01-01: Victim count system implemented
- 2026-03-02: Confirmed and locked in with Kavell
