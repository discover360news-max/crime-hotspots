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

**Phase 3 — Slim dashboard client (COMPLETE Mar 12, 2026)**
Replaced 3 browser CSV fetches with 2 CDN-cached API endpoints + 1 static JSON file.

Files created:
- `src/pages/api/dashboard.ts` — SSR endpoint, returns pre-computed stats/trends/insights/topRegions from D1
- `src/pages/api/crimes.ts` — SSR endpoint, returns full Crime objects (Date fields stripped, reconstructed client-side)
- `src/data/area-aliases.json` — 116 aliases baked at build time by csvBuildPlugin

Files modified:
- `src/lib/crimeData.ts` — added `getCrimesByYearFromD1()` + `getCrimesByDateRangeFromD1()`
- `src/integrations/csvBuildPlugin.ts` — added area-aliases.json generation step
- `src/scripts/dashboardUpdates.ts` — extracted `updateCardWithTrend` to module level; added `applyPrecomputedStats`, `applyPrecomputedInsights`, `applyPrecomputedTopRegions`
- `src/scripts/dashboardDataLoader.ts` — primary path: /api/dashboard + /api/crimes; CSV fallback in `initializeDashboardDataFromCSV()`; dispatches `crimesDataReady` custom event when done
- `src/pages/trinidad/dashboard.astro` — year filter script replaces `waitForCrimesData()` polling with `crimesDataReady` event listener; API-based `onYearChange()` replaces `initializeYearFilter` callbacks

Cache headers: `public, max-age=3600, s-maxage=82800` (1h browser / ~23h CDN edge)

## Key Confirmed Facts
- `story_id` always populated on 2025+ rows — safe as PRIMARY KEY
- `historicalTrends` CSV is temporary (2025 column format differs) — remove after migration
- Only showing 1 year at a time on site — multi-year CSV accumulation is pure overhead
- Dashboard: 3 CSV fetches per user visit to Google Sheets (historicalTrends + current + regionData)

## Change Log
- 2026-03-12: Plan created after architecture review session
- 2026-03-12: Phase 1 complete
- 2026-03-12: Phase 2 spec locked (victim_count nullable, daily cron syncs all years)
- 2026-03-12: Phase 2 COMPLETE + bug fixed. story_id restarts from 1 each year — 527 2025 rows were overwritten on first sync. Fix: year-prefix PK (e.g. "2025-1"), strip in mapD1RowToCrime. D1 wiped + re-synced: 2025=2064, 2026=527, total=2591. Committed 0467d0e + pushed live.
- 2026-03-12: Phase 3 approved — ready to start next session.
- 2026-03-12: Phase 3 COMPLETE. Build passes (2596 rows, 116 area aliases). See files above.
- 2026-03-12: Phase 3 bugs fixed + committed (f5884fb). Two issues found in local testing: (1) fetch URLs missing trailing slash — Astro trailingSlash:'always' requires /api/dashboard/?year= (see B015); (2) response-building code outside try/catch caused Astro to return 200 HTML on error (see B016). Both fixed. Pushed to main.
- 2026-03-12: Post-migration cleanup: (1) removed `historicalTrends` key from csvUrls.ts + simplified CSV fallback in dashboardDataLoader.ts (60+ days of 2026 data makes historical snippet obsolete); (2) fixed D1 date format — sync worker was storing raw MM/DD/YYYY, breaking date-range trend queries. Normalized to YYYY-MM-DD, re-synced 2,591 rows, purged CDN cache (see B018).

**Phase 4 — Complete D1 Migration: All Pages Off CSV (COMPLETE Mar 15, 2026)**

Removed `prerender = true` and CSV dependency from all remaining crime-data pages. Every page now serves live D1 data, CDN-cached at the edge (~23h).

New D1 function added:
- `crimeData.ts` — `getCrimesByMonthFromD1(db, year, month)` for archive month pages

Simple page swaps (removed `prerender`, added D1 pattern + CDN cache headers):
- `headlines.astro`, `areas.astro`, `regions.astro`, `statistics.astro`, `murder-count.astro`, `archive/index.astro`, `api/latest-crimes.json.ts`, `HomepagePulse.astro`

Dynamic routes (removed `prerender` + `getStaticPaths()`, slug resolved at request time, 404 on unknown):
- `area/[slug].astro` — resolves via `loadFullAreaData()`, uses `getCrimesByAreaFromD1`
- `region/[slug].astro` — resolves via area metadata, uses `getCrimesByRegionFromD1`
- `archive/[year]/[month].astro` — uses `getCrimesByMonthFromD1` + `getAllCrimesFromD1`

Tips / feeds / sitemaps (D1 pattern + CDN cache headers):
- `safety-tips/[slug].astro`, `rss.xml.ts`, `news-sitemap.xml.ts`, `sitemap-0.xml.ts`

`csvBuildPlugin.ts` slimmed: removed all CSV crime fetching (~200 lines), `validateCsvRows`, `csv-cache.json` write, row-count drop warning. Now a 2-step plugin: fetch RegionData → write `area-aliases.json` → write simplified `health-data.json` (status/build_time/area_aliases_count). Zero CSV warnings on build.

Remaining `prerender = true` pages (intentional — no live crime data dependency):
- `dashboard.astro` (SSR shell, loads via /api/dashboard), `compare.astro`, `mp/` pages, safety-tips static pages

## Deferred Cleanup
- ~~Remove `historicalTrends` key from `TRINIDAD_CSV_URLS`~~ — DONE Mar 12, 2026. Key removed from `csvUrls.ts`; fallback in `dashboardDataLoader.ts` simplified to fetch only `current`. 60+ days of 2026 data makes cross-year historical snippet unnecessary.
