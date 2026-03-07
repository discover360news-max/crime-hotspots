---
id: D005
type: decision
status: active
created: 2025-12-16
updated: 2026-03-07
related: [CFG001, CFG004]
---

## Summary
Migrated from Vite (custom setup) to Astro 5 in December 2025. The Vite version still exists at project root but is deprecated. All active development happens in `astro-poc/`.

## Decisions Made

**Why Astro over Vite:**
- SSR with Cloudflare adapter (Vite had no native SSR story)
- Content Collections — type-safe blog/tips system
- View Transitions + Pagefind integration out of the box
- Pre-render + SSR hybrid in one framework (crime pages SSR, other pages static)
- Better image optimization (Astro Image component)

**What was migrated:**
- All pages recreated as `.astro` files
- Leaflet map, year filter, CSV data loading preserved
- Google Apps Script automation unchanged (server-side, independent)
- Deployment changed from Cloudflare Pages Vite build to Cloudflare Pages Astro build

## Known Issues / Gotchas
- Never work in the root directory — the Vite version is deprecated
- Working directory: `astro-poc/`
- `astro.config.mjs` is the most dangerous file — understand it before editing (see CFG004)

## Change Log
- 2025-12-16: Astro migration completed and deployed
