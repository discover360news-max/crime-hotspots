---
id: L001
type: learning
status: archived
created: 2026-03-01
updated: 2026-03-15
related: [B002, L002]
---

## Summary
**SUPERSEDED Mar 15 2026: ClientRouter (SPA) removed. See B002.**

`astro:page-load` is no longer used. All interactive scripts use `DOMContentLoaded`.

## Current Pattern (post-SPA removal)

```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    // All interactive logic here — runs on every full page load
  });
</script>
```

`DOMContentLoaded` fires reliably after the DOM is ready on every full page navigation.
No SPA timing ambiguity. No `is:inline` hacks needed.

## What Was Tried and Failed
- `is:inline` — deduplicated, stops re-running after first page load (B002)
- `astro:page-load` — fired unreliably on first SPA visit to dynamic routes,
  causing site-wide accordion/interactive failures across 31+ files

## Do Not Re-introduce
Do not suggest `astro:page-load`, `ClientRouter`, or View Transitions.
The pattern failed at scale on a content/data site. Full page loads with CDN are fast enough.

## Change Log
- 2026-03-01: Pattern established, 16 files migrated to astro:page-load
- 2026-03-15: ClientRouter removed; all files migrated back to DOMContentLoaded (commit e39bf9f)
