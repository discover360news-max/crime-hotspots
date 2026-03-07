---
id: B012
type: bug
status: active
created: 2026-02-23
updated: 2026-03-07
related: [B003, CFG004]
---

## Summary
Using `await import()` inside Astro integration hooks (e.g. `buildStart`, `buildEnd`) causes a "Vite module runner has been closed" error. Always use static top-level imports in `src/integrations/*.ts` files.

## Context
Hit Feb 23 in `csvBuildPlugin.ts` when trying to lazily import a helper inside the `buildStart` hook.

## Fix
```ts
// WRONG — causes "Vite module runner has been closed"
export default function csvPlugin() {
  return {
    name: 'csv-build',
    async buildStart() {
      const { helper } = await import('./helper.ts'); // crashes
    }
  };
}

// CORRECT — static top-level import
import { helper } from './helper.ts';

export default function csvPlugin() {
  return {
    name: 'csv-build',
    async buildStart() {
      helper(); // works fine
    }
  };
}
```

## Known Issues / Gotchas
- This is different from B003 (native binaries in Workers) — same `await import()` syntax, different context and error
- `csvBuildPlugin.ts` and `redirectGenerator.ts` both use static imports correctly
- B003 rule: use `await import()` inside build-time functions to avoid Workers runtime issues. B012 rule: use static imports in integration hooks. These rules apply to different layers.

## Change Log
- 2026-02-23: Discovered and fixed in csvBuildPlugin.ts
