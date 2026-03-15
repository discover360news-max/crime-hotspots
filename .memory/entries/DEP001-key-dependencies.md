---
id: DEP001
type: dependency
status: active
created: 2026-03-07
updated: 2026-03-15
related: [B003, CFG004]
---

## Summary
Key non-trivial npm dependencies and why they exist. Most are in `astro-poc/package.json`.

## Critical Dependencies

| Package | Why it exists | Gotcha |
|---------|---------------|--------|
| `@astrojs/check` | `npm run check` — type-checks `.astro` files (tsc can't do this) | devDep only; run before committing |
| `typescript` | Required peer dep for `@astrojs/check` | devDep; tsconfig extends `astro/tsconfigs/base` (not strict) |
| `satori` | OG image SVG generation (murder count page) | Use `await import()` — crashes Workers at module level (B003) |
| `sharp` | OG image PNG conversion | Same as satori — `await import()` only (B003) |
| `@astrojs/rss` | RSS feed (`/rss.xml`) — blog posts + latest crimes | Standard usage |
| `@astrojs/cloudflare` | Cloudflare Workers SSR adapter | Keep updated — SSRF vulnerability patched in 12.6.12 |
| `@tailwindcss/vite` | Tailwind CSS 4 via Vite plugin | Tailwind v4 has breaking HSL syntax change (B009) |
| `leaflet` | Interactive crime map on dashboard | Requires `unsafe-inline` + `unsafe-eval` in CSP |

## Known Accepted Risk
- Moderate `undici` CVE in transitive `wrangler` dependency — upstream unpatched, server-side only, low exploitability

## Change Log
- 2026-01-27: `@astrojs/cloudflare` updated to 12.6.12 (SSRF fix)
- 2026-02-01: `@astrojs/rss` added for RSS feed
- 2026-03-13: `astro-pagefind` removed (search replaced with D1 FTS5, see D007)
- 2026-03-15: Added `@astrojs/check` + `typescript` devDeps; `npm run check` now available
