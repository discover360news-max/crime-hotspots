---
id: F006
type: feature
status: active
created: 2026-02-23
updated: 2026-03-07
related: [D001, D004]
---

## Summary
Legacy crime page URLs (`/trinidad/crime/headline-words-YYYY-MM-DD/`) are 301-redirected to new Story_ID URLs at runtime by the SSR handler. The redirect-map.json is a build-time artifact for inspection only — not used for routing.

## Implementation Details

**How redirects work:**
1. Request hits `[slug].astro`
2. Try to find crime by new StoryID slug → hit → serve page
3. Try to find crime by `oldSlug` field → hit → `Astro.redirect(newSlug, 301)`
4. Neither found → `new Response(null, { status: 404 })`

**Build-time map generation:**
- `src/integrations/redirectGenerator.ts` — runs at build, creates `src/data/redirect-map.json`
- ~1,984 old→new mappings generated for inspection/validation

**Key files:**
- `src/pages/trinidad/crime/[slug].astro` — SSR handler
- `src/lib/csvParser.ts` → `generateSlug()` + `generateSlugWithId()`
- `src/lib/crimeData.ts` — `Crime.slug`, `Crime.oldSlug`, `Crime.storyId` fields
- `src/data/redirect-map.json` — reference only, do not use for routing

## Known Issues / Gotchas
- NEVER write these to `public/_redirects` — Cloudflare's 2,000-rule limit is exhausted
- NEVER remove the `oldSlug` fallback from `[slug].astro` — breaks all GSC-indexed legacy URLs
- NEVER use `Astro.redirect('/404')` — use `new Response(null, { status: 404 })` for proper HTTP 404

## Change Log
- 2026-02-23: Story_ID slug migration + SSR redirect system implemented
