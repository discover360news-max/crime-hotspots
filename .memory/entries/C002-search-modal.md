---
id: C002
type: component
status: active
created: 2026-03-03
updated: 2026-03-12
related: [B011, CFG004]
---

## Summary
`SearchModal.astro` — site-wide search triggered by Ctrl+K. Powered by `/api/search` (D1 FTS5 for crimes, mps.json filter for MPs, D1 LIKE for areas). Dark mode. Shows suggestions panel when input is empty: recent searches (localStorage), 2 latest crimes (API), and static crime-type chips.

## Implementation Details

**File:** `src/components/SearchModal.astro`

**Search input:** custom `<input id="searchInput">` with 300ms debounce → fetch to `/api/search/?q=...`

**Suggestions panel (empty state):**
- **Recent searches:** `ch_search_history` localStorage key (max 5 entries). Saved on Enter / debounce / result click
- **Latest crimes:** fetched from `/api/latest-crimes.json` once per session. Source: `src/pages/api/latest-crimes.json.ts` (pre-rendered, `Cache-Control: 1h`)
- **Static chips:** 10 crime-type/area prompt chips

**Behaviour:**
- Suggestions hide when user types; re-show when input is cleared
- Loading spinner shown during fetch
- Results rendered with type badges (Crime/MP/Area), title, excerpt, meta
- `escapeHtml()` used on all innerHTML rendering

## Known Issues / Gotchas
- `/api/latest-crimes.json` is pre-rendered static — content only updates on site rebuild
- `includePagefind` prop on `<Layout>` is now a no-op (4 pages pass it — kept for compat, not removed)
- Search requires D1 runtime for crimes + areas; MPs work without D1 (static JSON)
- See D007 for full architecture, FTS5 schema, and one-time migration command

## Change Log
- 2026-03-03: Suggestions panel added (recent searches, latest crimes, chips)
- 2026-03-12: Fix — result link clicks now call `closeModal()`; clear button re-shows suggestions panel
- 2026-03-12: Perf — pagefind-ui.js moved to lazy load
- 2026-03-12: Fix — crime pages indexed via pagefindCrimeIndexer (now removed)
- 2026-03-13: Full rewrite — replaced Pagefind with D1 FTS5 via /api/search. Custom input + debounced fetch + typed result cards. Pagefind entirely removed. See D007.
