---
id: C002
type: component
status: active
created: 2026-03-03
updated: 2026-03-12
related: [B011, CFG004]
---

## Summary
`SearchModal.astro` — site-wide Pagefind search triggered by Ctrl+K. Dark mode. Shows suggestions panel when input is empty: recent searches (localStorage), 2 latest crimes (API), and static crime-type chips.

## Implementation Details

**File:** `src/components/SearchModal.astro`

**Suggestions panel (empty state):**
- **Recent searches:** `ch_search_history` localStorage key (max 5 entries). Saved on Enter / 1.5s idle / result click
- **Latest crimes:** fetched from `/api/latest-crimes.json` once per session. Source: `src/pages/api/latest-crimes.json.ts` (pre-rendered, `Cache-Control: 1h`)
- **Static chips:** 10 crime-type/area prompt chips

**Behaviour:**
- Suggestions hide when user types; re-show when input is cleared
- Pagefind indexes at build time — `astro-pagefind` must be in `integrations[]` (see B011)
- `pagefind-ui.js` is **lazy-loaded** — injected into `<head>` on first `openSearchModal()` call via `loadPagefindScript()`. Only the CSS is loaded upfront (non-blocking). Do NOT add the script back to Layout.

## Known Issues / Gotchas
- Murder count page opts out: `includePagefind={false}` on `<Layout>` — intentional (reduces JS payload)
- `/api/latest-crimes.json` is pre-rendered static — content only updates on site rebuild
- See B011 — `astro-pagefind` in package.json alone is not enough; must be in astro.config.mjs
- Pagefind clear button (`.pagefind-ui__search-clear`) does NOT fire a native `input` event — handled separately via click delegation in `watchSearchInput()`

## Change Log
- 2026-03-03: Suggestions panel added (recent searches, latest crimes, chips)
- 2026-03-12: Fix — result link clicks now call `closeModal()` so navigation is visible; clear button click re-shows suggestions panel
- 2026-03-12: Perf — `pagefind-ui.js` (83KB) moved from eager Layout load to lazy injection on first modal open (INP improvement)
- 2026-03-12: Fix — crime pages (SSR) now indexed via `pagefindCrimeIndexer` integration (2,591 records). Root cause: Pagefind only crawls static HTML; SSR pages produce no `.html` files.
