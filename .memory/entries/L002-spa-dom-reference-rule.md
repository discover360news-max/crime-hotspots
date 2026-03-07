---
id: L002
type: learning
status: active
created: 2026-03-01
updated: 2026-03-07
related: [B002, L001]
---

## Summary
Module-level `const el = document.getElementById(...)` captures a DOM reference on first load. After SPA navigation, the body is replaced — old references point to detached nodes. All DOM queries must happen fresh inside the function that uses them, or inside `astro:page-load`.

## Implementation Details

**Root cause of "menu unresponsive after SPA nav":**
```js
// WRONG — module-level capture, stale after SPA nav
const menuBtn = document.getElementById('menu-btn');
menuBtn.addEventListener('click', openMenu);

// CORRECT — query fresh on every use
document.addEventListener('astro:page-load', () => {
  const menuBtn = document.getElementById('menu-btn');
  if (!menuBtn) return;
  menuBtn.addEventListener('click', openMenu);
});
```

**Files fixed Mar 1:**
- `IslandSelectorModal.astro` — all `getElementById`/`querySelectorAll` moved inside open/close functions
- `Header.astro` — converted to `<script>` + `astro:page-load`; `window.closeMobileMenu` + `window.navigateAreas` exposed as globals for inline onclick attributes

## Known Issues / Gotchas
- `window.*` globals (like `window.openIslandModal`) persist across navigations — they're safe to set once at module level
- The rule is specifically about DOM element references, not window globals
- `onclick` attributes in HTML must call window-exposed functions since inline handlers can't access module scope

## Change Log
- 2026-03-01: Rule established after menu bug root cause analysis
