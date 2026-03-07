---
id: D004
type: decision
status: active
created: 2026-02-23
updated: 2026-03-07
related: [D001, F006]
---

## Summary
Crime page slugs migrated from `headline-words-YYYY-MM-DD` format to `XXXXXX-first-six-words` (Story_ID + 6 words). Legacy slugs 301-redirect to new URLs via SSR. This improves SEO canonicalization and avoids date collisions.

## Implementation Details

**New slug format:** `/trinidad/crime/00842-missing-man-found-dead-princes-town/`
**Legacy slug format:** `/trinidad/crime/headline-words-YYYY-MM-DD/` → 301 redirect

**Key files:**
- `src/lib/csvParser.ts` → `generateSlug()` (legacy) + `generateSlugWithId()` (current)
- `src/lib/crimeData.ts` + `dashboardDataLoader.ts` → `Crime.storyId`, `Crime.oldSlug`, `Crime.slug`
- `src/pages/trinidad/crime/[slug].astro` → SSR slug lookup → oldSlug fallback → 301 → 404
- `src/integrations/redirectGenerator.ts` → builds `src/data/redirect-map.json` at build time
- `src/data/redirect-map.json` → ~1,984 old→new path mappings (for inspection/validation)

**Slug resolution order in `[slug].astro`:**
1. Try new StoryID slug → found → serve
2. Try `oldSlug` fallback → found → 301 redirect to new URL
3. Not found → `new Response(null, { status: 404 })`

## Decisions Made
- Crimes without Story_ID keep the old headline-date format (unchanged, no redirect needed)
- The `redirect-map.json` is for reference only — SSR handles all redirects at runtime

## Known Issues / Gotchas
- NEVER remove the `oldSlug` fallback block from `[slug].astro` — legacy GSC URLs stay alive via this
- NEVER write redirects to `public/_redirects` — Cloudflare's 2,000-rule limit

## Change Log
- 2026-02-23: Story_ID slug migration implemented; redirect map generated
