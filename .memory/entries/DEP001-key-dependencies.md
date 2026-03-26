---
id: DEP001
type: dependency
status: active
created: 2026-03-07
updated: 2026-03-25
related: [B003, CFG004]
---

## Summary
Key non-trivial npm dependencies and why they exist. All in `astro-poc/package.json`.

## Critical Dependencies

| Package | Version | Why it exists | Gotcha |
|---------|---------|---------------|--------|
| `astro` | ^6.0.8 | Framework | Content Layer API, entry.id not entry.slug |
| `@astrojs/cloudflare` | ^13.1.3 | Cloudflare Workers SSR adapter | v13 = Workers only (not Pages). `env.DB` via `cloudflare:workers` |
| `@cloudflare/workers-types` | ^4.x | TypeScript types for `cloudflare:workers` + D1 | Augment `Cloudflare.Env` (not global `Env`) for bindings |
| `@astrojs/check` | latest | `npm run check` — type-checks `.astro` files | devDep; run before committing |
| `typescript` | ^5.9.3 | Peer dep for `@astrojs/check` | tsconfig extends `astro/tsconfigs/strict` |
| `@astrojs/sitemap` | ^3.7.1 | Sitemap generation | Must be ≥3.7.1 — earlier versions crash Astro 6 build hook |
| `satori` | ^0.19.1 | OG image SVG generation (murder count page) | Use `await import()` — crashes Workers at module level (B003) |
| `sharp` | ^0.34.5 | OG image PNG conversion | Same as satori — `await import()` only (B003) |
| `@astrojs/rss` | ^4.0.15 | RSS feed (`/rss.xml`) | Standard usage |
| `@tailwindcss/vite` | ^4.1.18 | Tailwind CSS 4 via Vite plugin | Tailwind v4 has breaking HSL syntax change (B009) |
| `leaflet` | ^1.9.4 | Interactive crime map on dashboard | Requires `unsafe-inline` + `unsafe-eval` in CSP |
| `papaparse` | ^5.5.3 | CSV parsing | Imports Node.js `stream` — requires `nodejs_compat` in wrangler.toml |

## Known Accepted Risk
- Moderate `undici` CVE in transitive `wrangler` dependency — upstream unpatched, server-side only, low exploitability

## Change Log
- 2026-01-27: `@astrojs/cloudflare` updated to 12.6.12 (SSRF fix)
- 2026-02-01: `@astrojs/rss` added for RSS feed
- 2026-03-13: `astro-pagefind` removed (search replaced with D1 FTS5)
- 2026-03-15: `@astrojs/check` + `typescript` devDeps added
- 2026-03-25: Astro 6.0.8, @astrojs/cloudflare v13, @cloudflare/workers-types added, @astrojs/sitemap 3.7.1
