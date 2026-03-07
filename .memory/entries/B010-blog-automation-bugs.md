---
id: B010
type: bug
status: active
created: 2026-03-02
updated: 2026-03-07
related: [B007, B008, F004]
---

## Summary
Blog automation produced wrong murder counts due to two simultaneous bugs: CSV column name mismatch (B008) causing silent fallback to old format, and date boundary precision error (B007) excluding end-day crimes.

## Key Rules Confirmed (Mar 2, 2026 — locked in with Kavell)

**Related crime counting:**
- Primary crime: `victimCount` applies (e.g. Shooting + 4 people shot = 4)
- Related crimes: each pipe-separated entry = exactly +1 — NO deduplication
  - `Murder|Murder` = 2 deaths (intentional — 2 separate victims)
  - `Murder|Shooting|Murder` = Murder+2, Shooting+1
- Only exclusion: filter out related entries that equal `primaryType`

```js
// Correct pattern — never Set()-deduplicate related crimes
const related = relatedTypes.split('|')
  .map(t => t.trim())
  .filter(t => t !== '' && t !== primaryType);
// Each remaining entry = exactly +1 victim
```

## Diagnostic Tool
`debugMurderCount(startDateStr, endDateStr)` in `socialMediaStats.gs`:
- Logs actual CSV column names (reveals mismatches immediately)
- Shows each row contributing to murder count
- Shows running totals (primary victims + related appearances)

```js
debugMurderCount('2026-02-21', '2026-02-27')
```

## Deleting GAS-Auto-Committed Blog Files
Blog files committed by GAS automation won't be in local repo. Delete via GitHub API:
```bash
gh api --method DELETE \
  repos/discover360news-max/crime-hotspots/contents/astro-poc/src/content/blog/FILENAME.md \
  -f message="Delete incorrect blog post" \
  -f sha="FILE_SHA"
```
Get SHA first with `gh api repos/.../contents/PATH`.

## Change Log
- 2026-03-02: Root causes found and fixed; counting rules locked in with Kavell
