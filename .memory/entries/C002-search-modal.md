---
id: C002
type: component
status: active
created: 2026-03-03
updated: 2026-03-07
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

## Known Issues / Gotchas
- Murder count page opts out: `includePagefind={false}` on `<Layout>` — intentional (reduces JS payload)
- `/api/latest-crimes.json` is pre-rendered static — content only updates on site rebuild
- See B011 — `astro-pagefind` in package.json alone is not enough; must be in astro.config.mjs

## Change Log
- 2026-03-03: Suggestions panel added (recent searches, latest crimes, chips)
