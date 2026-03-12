---
id: D006
type: decision
status: active
created: 2026-03-12
updated: 2026-03-12
related: [D002, F002, CFG001, CFG004]
---

## Summary
Approved plan to migrate data layer from Google Sheets CSV to Cloudflare D1. Full plan in `docs/architecture/D1-MIGRATION-PLAN.md`. GAS and Sheets untouched — only the site's read layer changes.

## Three Phases

**Phase 1 — Papaparse (COMPLETE Mar 12, 2026)**
Replaced `parseCSVLine()` with Papaparse. Also added `parseFullCSV()` + `createColumnMapFromArray()`
and updated all callers (`crimeData.ts`, `dashboardDataLoader.ts`, `areaAliases.ts`) to use full-text
parsing — fixes both `""` escaped quotes and embedded newlines. Build passes (2591 crimes).

**Phase 2 — D1 + Cron Sync Worker (COMPLETE Mar 12, 2026)**

Infrastructure created:
- `workers/crime-sync/schema.sql` — D1 table + 5 indexes (year, area, region, slug, old_slug)
- `workers/crime-sync/index.ts` — Cron Worker (daily 10:00 UTC). Also exposes `POST /sync` (+ SYNC_SECRET) for one-time migration trigger.
- `workers/crime-sync/wrangler.toml` — D1 binding + cron trigger. Update `database_id` after creating DB.
- `workers/crime-sync/package.json` + `tsconfig.json` — Worker package
- `astro-poc/wrangler.toml` — Pages D1 binding (for `wrangler pages dev` local dev)
- `astro-poc/src/env.d.ts` — Cloudflare env types (`DB: D1Database`, `App.Locals.runtime`)

Code changes:
- `crimeData.ts` — added `getAllCrimesFromD1(db)`, `getCrimesByAreaFromD1(db, area)`, `getCrimesByRegionFromD1(db, region)`, `mapD1RowToCrime()`. CSV functions untouched (pre-rendered pages keep using them at build time).
- `[slug].astro` — reads `Astro.locals.runtime?.env?.DB`, calls `getAllCrimesFromD1(db)` at runtime. Falls back to `getTrinidadCrimes()` when DB absent (plain `astro dev`).

Pre-rendered pages (Dashboard, Headlines, Areas, etc.) continue using CSV + csvBuildPlugin at build time — removing these is Phase 3 scope.

Infrastructure deployed (Mar 12, 2026):
- D1 DB: crime-hotspots-db | ID: 23311480-68d6-45ec-b351-e6185a5af80a | region: WEUR
- Schema applied remotely (6 queries, table + 5 indexes)
- Cron Worker live: https://crime-sync.discover360news.workers.dev | cron: 0 10 * * *
- Both wrangler.toml files have correct database_id

Pending (Kavell — manual steps in dashboard/terminal):
1. Run one-time migration: `curl -X POST https://crime-sync.discover360news.workers.dev/sync`
2. Verify: check Cloudflare Dashboard → Workers → crime-sync → Logs for "Full sync complete: 2591 rows"
3. Add D1 binding in Pages dashboard: Pages → crime-hotspots → Settings → Functions → D1 database bindings → Variable: `DB` → Database: `crime-hotspots-db`
4. Redeploy Pages (push a commit or retry from dashboard)
5. Smoke test: visit any /trinidad/crime/[slug]/ page and confirm it loads correctly

Next session — after Kavell confirms steps 1–5 are done:
- Verify D1 queries are being used (check Workers logs for DB query activity)
- Run `wrangler d1 execute crime-hotspots-db --remote --command="SELECT COUNT(*) FROM crimes;"` to confirm row count
- Consider Phase 3: replace dashboardDataLoader.ts's 3 browser CSV fetches with one /api/dashboard Pages Function

**Phase 3 — Slim dashboard client (not started, after Phase 2 stable)**
Replace 3 browser CSV fetches in `dashboardDataLoader.ts` with one `/api/dashboard?year=X`
Pages Function that returns pre-computed JSON from D1.

## Key Confirmed Facts
- `story_id` always populated on 2025+ rows — safe as PRIMARY KEY
- `historicalTrends` CSV is temporary (2025 column format differs) — remove after migration
- Only showing 1 year at a time on site — multi-year CSV accumulation is pure overhead
- Dashboard: 3 CSV fetches per user visit to Google Sheets (historicalTrends + current + regionData)

## Change Log
- 2026-03-12: Plan created after architecture review session
- 2026-03-12: Phase 1 complete
- 2026-03-12: Phase 2 spec locked (victim_count nullable, daily cron syncs all years)
