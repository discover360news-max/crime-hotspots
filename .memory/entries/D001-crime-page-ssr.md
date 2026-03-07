---
id: D001
type: decision
status: active
created: 2026-02-04
updated: 2026-03-07
related: [CFG003, CFG004, D004]
---

## Summary
All crime detail pages (`/trinidad/crime/[slug]`) are fully server-rendered (SSR) with Cloudflare CDN caching. This replaced a hybrid prerender approach (90-day static window) on Feb 4, 2026. The CDN makes first-visit fast while SSR gives unlimited page count and correct 301 redirects for legacy slugs.

## Decisions Made

**Why full SSR over hybrid prerender:**
- Hybrid prerender hit build time limits as crime page count grew (~2,100+ pages)
- Legacy slug 301 redirects require runtime logic — cannot be done statically
- Cloudflare's CDN caching makes SSR performance equivalent to static for repeat visitors
- Scales infinitely — adding 10,000 crimes doesn't change build time

**Cache configuration:**
```
CDN-Cache-Control: max-age=86400    ← Cloudflare edge caches 24h
Cache-Control: public, max-age=3600  ← Browser caches 1h
```

## Known Issues / Gotchas
- NEVER add `export const prerender = true` back to `[slug].astro` — breaks old crime page redirects
- NEVER use `Astro.redirect('/404')` for missing crimes — return `new Response(null, { status: 404 })` instead (correct HTTP 404 for SSR)
- NEVER remove CDN cache headers — SSR without caching degrades LCP significantly
- NEVER write old→new redirects to `public/_redirects` — Cloudflare's 2,000-rule limit makes this unviable; SSR handles it

## Change Log
- 2026-01-26: Initial hybrid prerender (90-day static window)
- 2026-02-04: Migrated to full SSR + CDN cache
