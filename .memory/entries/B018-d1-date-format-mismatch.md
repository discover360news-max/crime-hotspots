---
id: B018
type: bug
status: fixed
created: 2026-03-12
related: [D006]
---

## Summary
D1 sync worker stored the `date` column using the raw CSV string (`dateStr`) — Google Sheets exports
dates as `MM/DD/YYYY` (e.g. `01/15/2026`). The `/api/dashboard` endpoint queries D1 with
`WHERE date >= ? AND date <= ?` using `YYYY-MM-DD` format strings. String comparison between
`MM/DD/YYYY` and `YYYY-MM-DD` always fails (`'0' < '2'` in ASCII), so all date-range queries
returned 0 rows → `prev30Count = 0` → trend indicators were hidden on all stat cards.

## Fix
In `workers/crime-sync/index.ts`: compute `normalizedDate` from `dateObj` before inserting:
```ts
const normalizedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
```
Store `normalizedDate` instead of `dateStr` in D1.

After deploying the worker, a full re-sync (`POST /sync`) is required to rewrite all existing rows.
`INSERT OR REPLACE` handles this — all 2,591 rows get the normalized date on re-sync.

## Do NOT Change Google Sheets
The sheet date format is irrelevant — normalization happens in the sync worker. No sheet changes needed.

## Change Log
- 2026-03-12: Bug identified + fixed. Worker deployed, full re-sync triggered (2,591 rows rewritten).
  Cloudflare CDN cache purged manually for `/api/dashboard/?year=2026` and `?year=2025`.
