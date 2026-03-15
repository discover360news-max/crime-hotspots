---
id: B002
type: bug
status: archived
created: 2026-03-01
updated: 2026-03-15
related: [L001, L002]
---

## Summary
**RESOLVED Mar 15 2026: ClientRouter (SPA) removed entirely.**

`astro:page-load` proved unreliable site-wide — accordions on headlines, archive, and all
interactive pages stopped working after SPA navigation. Root cause was never fully resolved
despite multiple fix attempts. Removed SPA as the permanent solution.

## What Was Removed
- `ClientRouter` import + element from Layout.astro
- Nav progress bar (used `astro:before-preparation` + `astro:page-load`)
- All `astro:before-preparation` close-on-nav guards (Header, BottomNav, SearchModal, etc.)
- `astro:before-navigate` back-nav modal intercept in modalLifecycle.ts
- `astro:before-swap` cleanup in headlines.astro

## Current Pattern
All interactive scripts now use `DOMContentLoaded`. Every navigation is a full page load.
CDN caching keeps page loads fast. No timing ambiguity.

```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    // All logic here — runs on every full page load
  });
</script>
```

## Do Not Re-introduce SPA
The recurring issues were not worth the animated transitions on a data/content site.
If SPA is ever reconsidered, all 31+ files would need re-migrating.

## Change Log
- 2026-03-01: Root cause identified (is:inline), 16 files migrated to astro:page-load
- 2026-03-15: astro:page-load proved unreliable site-wide; ClientRouter removed, all files migrated to DOMContentLoaded (37 files, commit e39bf9f)
