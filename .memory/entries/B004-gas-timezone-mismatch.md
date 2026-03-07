---
id: B004
type: bug
status: active
created: 2026-01-01
updated: 2026-03-07
related: [B007, B008, F002, F004]
---

## Summary
Google Apps Script's `sheet.getDataRange().getValues()` returns Date objects in GMT, while `new Date()` uses the script's configured timezone (America/Port_of_Spain, UTC-4). This causes date comparisons to silently include or exclude the wrong crimes.

## Fix
Never use sheet date values for filtering. Always use the CSV-based pipeline:
```js
// WRONG
const values = sheet.getDataRange().getValues();
const date = values[i][dateCol]; // GMT Date object

// CORRECT
const crimes = fetchCrimeData(TRINIDAD_CSV_URL);
const filtered = filterCrimesByDateRange(crimes, startDate, endDate);
```

## Known Issues / Gotchas
- `fetchCrimeData()` is in `socialMediaStats.gs`
- `filterCrimesByDateRange()` normalizes dates to noon — see B007 for the boundary gotcha
- `SOCIAL_CONFIG.lagDays = 3` — crimes are dated by incident date with ~3-day reporting lag
- This affects blog automation, social stats, and any GAS script that processes crime data

## Change Log
- 2026-01-01: Documented after blog automation produced wrong date ranges
