---
id: B003
type: bug
status: active
created: 2026-02-26
updated: 2026-03-07
related: [CFG003, CFG004]
---

## Summary
Cloudflare Workers (the SSR runtime) cannot load native Node.js binaries at runtime. Importing `sharp`, `satori`, or similar packages at module level causes HTTP 500 on ALL SSR pages — not just the page that uses them.

## Context
Hit Feb 26 in `generateCrimeTypeThumbnails.ts` when satori was imported at the top level. The entire site returned 500 errors.

## Fix
Use dynamic `await import()` inside build-time-only functions:
```ts
// WRONG — crashes all SSR pages
import sharp from 'sharp';

// CORRECT — only runs during build
async function buildTimeOnly() {
  const sharp = await import('sharp');
  const satori = await import('satori');
  // ...
}
```

## Known Issues / Gotchas
- This applies even if the file is only called during build — the import happens at module load time on Workers
- `generateOgImage.ts` has TOP-LEVEL `import sharp` and `import satori` — it is build-time ONLY. NEVER call its functions from SSR page frontmatter.
- SSR pages must use static pre-generated OG image paths. `statistics.astro` and `murder-count.astro` were both calling `generateStatisticsOgImage`/`generateMurderCountOgImage` at runtime → 500. Fixed Mar 15 2026 by replacing with static `/og-images/*.png` paths.
- OG images are regenerated fresh daily by GitHub Actions at build time — static paths are always up to date.
- See B012 for the related gotcha about `await import()` in Astro integration hooks (different problem)

## Change Log
- 2026-02-26: Discovered and fixed in generateCrimeTypeThumbnails.ts
- 2026-03-15: statistics.astro + murder-count.astro were calling generateOgImage at SSR runtime → 500. Fixed: now use static paths.
