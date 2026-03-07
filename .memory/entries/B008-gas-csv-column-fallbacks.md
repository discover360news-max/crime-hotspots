---
id: B008
type: bug
status: active
created: 2026-03-02
updated: 2026-03-07
related: [B004, B010, F002]
---

## Summary
The Production sheet may use short column names (`primaryType`, `relatedTypes`) instead of long names (`primaryCrimeType`, `relatedCrimeTypes`). When no variant matched, code silently fell back to old-format path — ignoring victimCount AND all related crimes.

## Fix
Always try all 3 variants when reading CSV crime data in GAS:
```js
const primary = crime['primaryCrimeType'] || crime['Primary Crime Type'] || crime['primaryType'] || '';
const related = crime['relatedCrimeTypes'] || crime['Related Crime Types'] || crime['relatedTypes'] || '';
const victims = crime['victimCount'] || crime['Victim Count'] || '1';
```

## Known Issues / Gotchas
- `getValues()` returns native JS types — Date cells = Date objects, numeric cells = Numbers
- Always coerce: `String(row[colMap['field']] || '')` for text, `Number(row[colMap['lat']])` for coords
- Calling `.toLowerCase()` on a sheet value without `String()` coercion throws `"x.toLowerCase is not a function"`
- `debugMurderCount(startDateStr, endDateStr)` in `socialMediaStats.gs` logs actual column names — use this to diagnose future mismatches

## Change Log
- 2026-03-02: Added 3-variant fallback to socialMediaStats.gs, blogDataGenerator.gs
