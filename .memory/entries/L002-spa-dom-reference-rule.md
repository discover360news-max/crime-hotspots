---
id: L002
type: learning
status: archived
created: 2026-03-01
updated: 2026-03-15
related: [B002, L001]
---

## Summary
**SUPERSEDED Mar 15 2026: ClientRouter (SPA) removed. Stale DOM refs are no longer an issue.**

Without SPA, every navigation is a full page load — the entire DOM is replaced naturally.
Module-level DOM captures are still not a good pattern, but they won't cause "stale after nav"
bugs because there is no SPA navigation.

## Current Rule (simplified)
Query DOM elements inside `DOMContentLoaded`, not at module level.
This is just good practice, not a SPA-specific requirement.

```js
// Good
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('my-btn');
  btn?.addEventListener('click', handler);
});
```

## Change Log
- 2026-03-01: Rule established for SPA dom-stale issue
- 2026-03-15: Superseded by SPA removal (commit e39bf9f)
