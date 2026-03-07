---
id: CFG003
type: config
status: active
created: 2026-02-04
updated: 2026-03-07
related: [D001, CFG004]
---

## Summary
Crime detail pages are SSR with Cloudflare edge cache (24h) + browser cache (1h). All other pages are static (pre-rendered). Cache headers are set in `[slug].astro` response headers. Never remove them.

## Implementation Details

**Crime detail pages (`/trinidad/crime/[slug]`):**
```
CDN-Cache-Control: max-age=86400    ← Cloudflare edge caches for 24h
Cache-Control: public, max-age=3600  ← Browser caches for 1h
```
Set in `src/pages/trinidad/crime/[slug].astro` via `new Response()` headers.

**All other pages:** Pre-rendered static. Cloudflare serves from CDN automatically.

**Safety tip detail pages (`/trinidad/safety-tips/[slug]`):** Also SSR + CDN cache (same pattern).

**Why this matters:**
- Without cache headers on SSR pages, every request hits Cloudflare Workers → high latency, poor LCP
- With cache: first visitor triggers SSR + caches at edge; all subsequent visitors get static speed

## Known Issues / Gotchas
- Cache invalidation: only happens on full site rebuild. Crime data updates appear after next rebuild (daily at 6AM UTC)
- NEVER remove CDN cache headers from SSR pages — degrades LCP to 5,000ms+
- Static pages: CSP headers live in `public/_headers` — any page-specific headers must be added there

## Change Log
- 2026-02-04: Cache headers added to crime detail pages
