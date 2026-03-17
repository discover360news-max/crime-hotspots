---
id: B015
type: bug
status: active
created: 2026-03-12
updated: 2026-03-17
related: [CFG004, D006]
---

## Summary
Astro `trailingSlash: 'always'` means EVERY internal link and fetch call must include a trailing slash. Missing slash causes the Cloudflare Worker to fall through and serve the homepage HTML instead of the intended page — no error, no redirect, silent failure.

## Affects Two Things

**1. `href` links in templates** — missing slash serves homepage silently
```astro
<a href="/data-capability-sheet/">...</a>   ✅
<a href="/data-capability-sheet">...</a>    ❌ → serves homepage
```

**2. `fetch()` calls to SSR API endpoints** — missing slash returns 200 HTML, not JSON
```ts
fetch(`/api/dashboard/?year=${year}`)  // ✅
fetch(`/api/dashboard?year=${year}`)   // ❌ → r.json() throws SyntaxError silently
```

## Symptoms
- Page navigates to homepage instead of intended destination (href case)
- Dashboard falls back to CSV even though API endpoints exist (fetch case)
- Network tab shows target URL returning `200 text/html`
- No console error in either case

## Notes
- In production Cloudflare Pages, Astro does NOT auto-redirect missing trailing slashes — it falls through to serving homepage/HTML
- Check ALL `href` values in templates and ALL `fetch()` calls to internal endpoints
- Breadcrumb `href` values are a common miss — check whenever adding a new breadcrumb trail
