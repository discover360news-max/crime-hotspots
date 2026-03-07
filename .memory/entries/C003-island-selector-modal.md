---
id: C003
type: component
status: active
created: 2026-02-02
updated: 2026-03-07
related: [CFG001]
---

## Summary
`IslandSelectorModal.astro` — unified country/section picker. Replaced 4 separate modal files (HeadlinesModal, DashboardModal, etc.). Exposes `window.openIslandModal(section)` globally. Backward-compat aliases maintained.

## Implementation Details

**File:** `src/components/IslandSelectorModal.astro`

**Global API:**
```js
window.openIslandModal('dashboard');   // opens modal, preselects dashboard tab
window.openIslandModal('headlines');
window.openIslandModal('areas');
window.openIslandModal('archive');
// Backward-compat aliases:
window.openDashboardModal();   // → openIslandModal('dashboard')
window.openHeadlinesModal();   // → openIslandModal('headlines')
```

**Sections config:** driven by `src/data/countries.ts` — each country's `sections` array

**When used:**
- Homepage island cards (click → section picker)
- Header nav on non-Trinidad pages

## Known Issues / Gotchas
- `window.openIslandModal` is set at module level — persists across SPA navigations (intended)
- DOM queries inside open/close functions (not module level) — see L002
- All `getElementById`/`querySelectorAll` calls are inside the open/close handler functions

## Change Log
- 2026-02-02: Unified modal replacing 4 separate files
