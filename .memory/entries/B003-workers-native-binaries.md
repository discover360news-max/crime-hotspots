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
- `generateOgImage.ts` and `generateCrimeTypeThumbnails.ts` both use the correct `await import()` pattern
- See B012 for the related gotcha about `await import()` in Astro integration hooks (different problem)

## Change Log
- 2026-02-26: Discovered and fixed in generateCrimeTypeThumbnails.ts
