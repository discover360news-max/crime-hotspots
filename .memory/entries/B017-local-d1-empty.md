---
id: B017
type: bug
status: fixed
created: 2026-03-12
updated: 2026-03-25
related: [D006, CFG002]
---

## Summary
**FIXED (Mar 25 2026) — Astro 6 + @astrojs/cloudflare v13 resolves this.**

`wrangler dev` now runs workerd locally (not Pages dev server). D1 bindings work as configured in wrangler.toml — same as production. CSV fallback still available but D1 is accessible locally.

## Local Dev (Post-Migration)
```bash
cd astro-poc
npm run build        # required before wrangler dev
npx wrangler dev     # port 8787 — full Workers runtime, real D1
```

Or for fast iteration (no D1, CSV fallback):
```bash
npm run dev          # port 4321 — Astro dev server
```

## Historical Context (Pre-Migration)
`wrangler pages dev` used a local SQLite mock at `.wrangler/state/v3/d1/` that was empty by default. Required manual schema apply + optional data seed.

## Notes
- Production D1 ID: `23311480-68d6-45ec-b351-e6185a5af80a` (WEUR region)
- wrangler.toml `nodejs_compat` flag required for papaparse in prerender env
