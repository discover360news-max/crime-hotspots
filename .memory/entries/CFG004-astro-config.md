---
id: CFG004
type: config
status: active
created: 2025-12-16
updated: 2026-03-25
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

## Content Collections (Astro 6)
Config moved to `src/content.config.ts` (root of `astro-poc/src/`, NOT `src/content/config.ts`).
Uses Content Layer API with `glob` loader from `astro/loaders`:
```ts
import { glob } from 'astro/loaders'; // NOT 'astro:loaders'
const blog = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/blog' }), schema: ... });
```
Entries use `.id` not `.slug`. Render via `render(entry)` imported from `astro:content` (not `entry.render()`).

## Known Issues / Gotchas
- `await import()` must NOT be used inside integration hooks — see B012
- `output: 'server'` means all pages are SSR by default; static pages need `export const prerender = true`
- Never add `prerender = true` to `[slug].astro` — see D001
- tsconfig extends `astro/tsconfigs/strict` — `npm run check` must pass before committing

## Change Log
- 2025-12-16: Initial Astro config
- 2026-02-04: Switched to full `output: 'server'`
- 2026-03-13: Removed `astro-pagefind` (replaced with D1 FTS5 search)
- 2026-03-15: Added `astro:env` schema; tsconfig → strict
- 2026-03-25: Astro 6 — Content Layer API, content.config.ts, entry.id, render(entry)
