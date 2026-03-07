---
id: L001
type: learning
status: active
created: 2026-03-01
updated: 2026-03-07
related: [B002, L002, L004]
---

## Summary
`astro:page-load` is the only correct pattern for interactive scripts in an Astro site with View Transitions. Module scripts run once; `DOMContentLoaded` doesn't fire on SPA navigation; `is:inline` is deduplicated. Only `astro:page-load` fires on every navigation including back/forward.

## Implementation Details

**The correct pattern:**
```html
<script>
  document.addEventListener('astro:page-load', () => {
    // All interactive logic here
    // Re-runs on every navigation
  });
</script>
```

**Related lifecycle events:**
- `astro:page-load` — fires after each navigation (DOM ready)
- `astro:before-navigate` — fires before leaving a page (use for cleanup/intercept)
- `astro:after-swap` — fires after DOM swap but before scripts run

**Never use:**
- `DOMContentLoaded` — only fires once, not on SPA nav
- `<script is:inline>` for logic — see B002
- Module-level code outside event listeners — runs once only

## Decisions Made
Migrated all 16 interactive files from DOMContentLoaded → astro:page-load on Mar 1, 2026.

## Known Issues / Gotchas
- `cookieConsent.ts` calls `show()` on every `astro:page-load` — `show()` is a no-op if already consented, so this is safe
- `dashboard.astro` Leaflet: `mapShimmerStartTime` moved inside `initMap()` so it resets per navigation
- `yearFilter.ts` — readyState check removed; `initYearFilter()` called directly since astro:page-load guarantees DOM readiness

## Change Log
- 2026-03-01: Pattern confirmed and applied project-wide
