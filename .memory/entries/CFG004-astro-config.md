---
id: CFG004
type: config
status: active
created: 2025-12-16
updated: 2026-03-07
related: [B003, B011, B012, CFG002]
---

## Summary
`astro-poc/astro.config.mjs` — most dangerous file in the project. Controls SSR output mode, Cloudflare adapter, integrations list. Don't modify without understanding the impact.

## Key Configuration

**Output mode:** `output: 'server'` — enables SSR for all pages (pre-rendered pages opt in with `export const prerender = true`)

**Adapter:** `@astrojs/cloudflare` — targets Cloudflare Workers runtime

**Integrations that MUST be present:**
```js
import pagefind from 'astro-pagefind';  // ← B011: required in integrations[], not just package.json
import { redirectGenerator } from './src/integrations/redirectGenerator.ts';
import csvBuildPlugin from './src/integrations/csvBuildPlugin.ts';
```

**Image service:** `@astrojs/cloudflare` image service for Astro's `<Image>` component

## Known Issues / Gotchas
- `astro-pagefind` must be in `integrations[]` — see B011
- `await import()` must NOT be used inside integration hooks — see B012
- `output: 'server'` means all pages are SSR by default; static pages need `export const prerender = true`
- Never add `prerender = true` to `[slug].astro` — see D001

## Change Log
- 2025-12-16: Initial Astro config
- 2026-01-26: Hybrid rendering (some pages prerendered)
- 2026-02-04: Switched to full `output: 'server'`
