---
id: B002
type: bug
status: active
created: 2026-03-01
updated: 2026-03-07
related: [L001, L002]
---

## Summary
`<script is:inline>` does NOT re-run on SPA return navigation. Astro marks it `data-astro-exec` after first run and skips it forever. This causes interactive elements (menus, accordions, modals) to stop working after navigating away and back.

## Context
Discovered when the mobile menu became unresponsive after SPA navigation. Root cause: Astro's View Transitions marks inline scripts as already-executed.

## Fix
The only correct pattern for any interactive script:
```html
<script>
  document.addEventListener('astro:page-load', () => {
    // All logic here — runs on every navigation including back/forward
  });
</script>
```
Module `<script>` (without `is:inline`) runs once on first load; `astro:page-load` handles all subsequent navigations.

## Known Issues / Gotchas
- `astro:page-load` fires on every navigation including back/forward
- Files fixed Mar 1–2: `CategoryAccordion.astro`, `headlines.astro`, `area/[slug].astro`, `region/[slug].astro`, `areas.astro`, `compare.astro`, `faq.astro`, `DateAccordion.astro`, `blog/index.astro`
- `modalLifecycle.ts` uses `astro:before-navigate` with `navigationType === 'traverse'` to intercept back navigation when modal is open

## Change Log
- 2026-03-01: Root cause identified, 16 files migrated from DOMContentLoaded → astro:page-load
