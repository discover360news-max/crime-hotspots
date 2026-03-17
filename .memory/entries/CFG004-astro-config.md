---
id: CFG004
type: config
status: active
created: 2025-12-16
updated: 2026-03-15
related: [B003, B012, CFG002]
---

## Summary
`astro-poc/astro.config.mjs` — most dangerous file in the project. Controls SSR output mode, Cloudflare adapter, integrations list, and env schema. Don't modify without understanding the impact.

## Key Configuration

**Output mode:** `output: 'server'` — enables SSR for all pages (pre-rendered pages opt in with `export const prerender = true`)

**Adapter:** `@astrojs/cloudflare` — targets Cloudflare Workers runtime

**Integrations that MUST be present:**
```js
import csvBuildPlugin from './src/integrations/csvBuildPlugin.ts';
import sitemap from '@astrojs/sitemap';
import redirectGenerator from './src/integrations/redirectGenerator.ts';
```

**Typed env vars (`astro:env` schema):**
```js
env: {
  schema: {
    BUTTONDOWN_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    PUBLIC_SAFETY_TIPS_GAS_URL: envField.string({ context: 'client', access: 'public', optional: true }),
  }
}
```
Import in server files: `import { BUTTONDOWN_API_KEY } from 'astro:env/server'`
Import in client/page files: `import { PUBLIC_SAFETY_TIPS_GAS_URL } from 'astro:env/client'`
Adding a new env var = add to schema here + add to `.env.example`.

**Image service:** `imageService: 'passthrough'` — use Astro's default image service

## Known Issues / Gotchas
- `await import()` must NOT be used inside integration hooks — see B012
- `output: 'server'` means all pages are SSR by default; static pages need `export const prerender = true`
- Never add `prerender = true` to `[slug].astro` — see D001

## Change Log
- 2025-12-16: Initial Astro config
- 2026-01-26: Hybrid rendering (some pages prerendered)
- 2026-02-04: Switched to full `output: 'server'`
- 2026-03-13: Removed `astro-pagefind` (replaced with D1 FTS5 search)
- 2026-03-15: Added `astro:env` schema for typed env vars; `envField` import added
- 2026-03-15: Upgraded tsconfig.json from `astro/tsconfigs/base` → `astro/tsconfigs/strict`. Fixed 78 errors across 11 files (null safety, implicit any, type mismatches). `npm run check` now passes at 0 errors.
