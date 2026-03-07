---
id: B011
type: bug
status: active
created: 2026-03-03
updated: 2026-03-07
related: [CFG004, C002]
---

## Summary
Installing `astro-pagefind` in `package.json` is not sufficient. It MUST also be added to the `integrations` array in `astro.config.mjs`. Without this, the build never runs indexing, the `/pagefind/` directory is never generated, and search silently fails on live — locally the modal opens but `window.PagefindUI` is undefined.

## Fix
```js
// astro.config.mjs
import pagefind from 'astro-pagefind';

export default defineConfig({
  integrations: [pagefind(), /* other integrations */],
});
```

## Known Issues / Gotchas
- The failure is silent in dev (no error) and only manifests on the live build
- Murder count page uses `includePagefind={false}` on `<Layout>` — this is intentional to reduce JS payload
- Pagefind indexes at build time — new content only appears after a full rebuild

## Change Log
- 2026-03-03: Discovered when search stopped working after dependency update
