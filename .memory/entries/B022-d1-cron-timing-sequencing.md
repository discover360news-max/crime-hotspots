---
id: B022
type: bug
status: fixed
created: 2026-03-16
updated: 2026-03-16
related: [D006, CFG002, CFG003]
---

## Summary
D1 sync cron ran at **10:00 UTC**, one hour AFTER the site rebuild at **06:00 UTC**. This meant every daily site rebuild — and all SSR requests served in the 06:00–10:00 window — were reading 20-hour-old D1 data. CDN caching compounded this: after the 10:00 sync, edge caches still served the pre-sync snapshot for another ~23h. Worst-case staleness: **~44 hours**.

## Symptoms
- Statistics page (and all SSR pages) showed yesterday's D1 data immediately after a rebuild
- Reclassified crimes in Google Sheets would not appear on the site until the following day's CDN cache expiry (not the current day's sync)
- Discovered when Attempted Murder showed 0 for 2026 despite 42 rows existing in the sheet — the reclassification happened after the last sync, but the site rebuild invalidated the CDN, causing all requests to hit D1 with stale data

## Root Cause
Cloudflare Pages daily rebuild: `0 6 * * *` (GitHub Actions)
D1 sync worker cron: `0 10 * * *` (Cloudflare Workers)
→ Rebuild fires 4 hours BEFORE the sync

## Fix
Changed `workers/crime-sync/wrangler.toml` cron from `0 10 * * *` to `0 5 * * *`.

New sequence:
- **05:00 UTC** — D1 sync (fresh data from Google Sheets)
- **06:00 UTC** — Site rebuild (pulls fresh D1 data; CDN cache invalidated with up-to-date content)

## Invariant
D1 sync cron MUST always run at least 30 minutes before the GitHub Actions rebuild (`0 6 * * *`). If the rebuild schedule ever changes, update the cron accordingly.
