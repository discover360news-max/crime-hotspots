---
id: CFG003
type: config
status: active
created: 2026-02-04
updated: 2026-03-15
related: [D001, D006, CFG004]
---

## Summary
All crime-data pages are SSR with Cloudflare edge cache (~23h) + browser cache (1h). A small set of non-data pages remain pre-rendered static. Cache headers must be present on every SSR page — they are what makes D1 usage scale.

## Cache Header Pattern (all SSR pages)
```
CDN-Cache-Control: max-age=82800    ← Cloudflare edge caches for ~23h
Cache-Control: public, max-age=3600, must-revalidate  ← Browser caches for 1h
```
Set via `Astro.response.headers.set()` in the page frontmatter (Astro pages) or in the `Response` headers (API routes).

## SSR Pages (Phase 4 complete — Mar 15, 2026)
Every crime-data page is now SSR + D1 + CDN cached:
- `/trinidad/crime/[slug]`, `/trinidad/area/[slug]`, `/trinidad/region/[slug]`
- `/trinidad/headlines`, `/trinidad/areas`, `/trinidad/regions`, `/trinidad/statistics`
- `/trinidad/murder-count`, `/trinidad/archive/`, `/trinidad/archive/[year]/[month]`
- `/trinidad/safety-tips/[slug]`
- `/api/latest-crimes.json`, `/rss.xml`, `/news-sitemap.xml`, `/sitemap-0.xml`

## Still Pre-rendered (intentional — no live crime data)
`dashboard.astro` (SSR shell, loads data via /api/), `compare.astro`, `mp/` pages, safety-tips category/context/area/index/submit pages, blog pages, homepage.

## D1 Free Tier Capacity
CDN caching is what keeps D1 usage low. D1 is only hit on a cache miss (first request after 23h expiry), not on every visit.

**Free tier limits:**
- 5 million rows read / day
- 100,000 rows written / day (sync worker writes ~2,500 rows once/day — fine)
- 500 MB database size (current: ~2,500 rows ≈ 2–3 MB — fine for years)
- 50 D1 queries per Worker invocation (site makes 1–2 per request — fine)

**Headroom at current scale (2,500 crimes):**
- Each full-table scan = 2,500 rows read
- At 1,000 visits/day: ~570,000 rows read/day ≈ 11% of daily limit
- Safe up to ~15,000–20,000 visits/day before D1 costs become a factor
- Paid tier overage is $0.001/million rows — negligible even at 3× the free limit

**What would change this:** a crawler hammering pages faster than 23h cache TTL, or a much larger crime dataset. Neither is a near-term concern.

## Known Issues / Gotchas
- NEVER remove CDN cache headers from SSR pages — every request hits D1 + Worker, degrades LCP and burns free quota fast
- Cache invalidation: new D1 data appears within 23h as edge caches expire naturally (no manual purge needed)
- Static pages: CSP headers live in `public/_headers` — page-specific headers go there, not in Astro response

## Change Log
- 2026-02-04: Cache headers added to crime detail pages
- 2026-03-15: Updated to reflect Phase 4 — all crime-data pages now SSR + CDN cached. Added D1 capacity analysis.
