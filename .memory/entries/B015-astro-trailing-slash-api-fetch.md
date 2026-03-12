---
id: B015
type: bug
status: active
created: 2026-03-12
related: [CFG004, D006]
---

## Summary
Astro `trailingSlash: 'always'` (set in astro.config.mjs) compiles API endpoint route patterns
with a required trailing slash: `^\\/api\\/dashboard\\/$`. Client-side `fetch('/api/dashboard?year=2026')`
(no trailing slash) does NOT match — wrangler serves the full site HTML with status 200 instead.
`r.json()` on HTML content throws SyntaxError → triggers fallback path silently.

## Symptom
- Dashboard falls back to CSV even though API endpoints exist
- Network tab shows `/api/dashboard?year=2026` returning `200 text/html`
- No console error — just the fallback warning

## Fix
Always use trailing slashes in fetch calls to SSR endpoints:
```ts
fetch(`/api/dashboard/?year=${year}`)  // ✅
fetch(`/api/dashboard?year=${year}`)   // ❌
```

## Notes
- In production Cloudflare Pages, Astro middleware may redirect non-slash → slash, but in
  local `wrangler pages dev` no redirect occurs — it falls through to the SPA HTML shell.
- Check ALL fetch calls targeting `src/pages/api/*.ts` endpoints.
