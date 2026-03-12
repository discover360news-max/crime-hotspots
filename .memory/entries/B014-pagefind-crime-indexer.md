---
id: B014
type: bug
status: fixed
created: 2026-03-12
updated: 2026-03-12
related: [C002, CFG004, D006]
---

## Summary
Pagefind only indexes static HTML files — SSR crime pages (`/trinidad/crime/[slug]/`) produce no `.html`
files in `dist/`, so they were invisible to search. Fix: `pagefindCrimeIndexer` Astro integration
(Node API, `astro:build:done` hook) adds 2,591 crime records as custom Pagefind entries. Must be
LAST in `integrations[]` in `astro.config.mjs` so it runs after `pagefind()` and overwrites the index.

## Ranking Bug (Mar 12, 2026)
Even after indexing, crime pages were not appearing in search results — only area/region pages.
Root cause: area pages are pre-rendered (`prerender = true`) and contain a full "Recent Headlines"
section with all crime headlines from the last 30 days embedded in static HTML. When `addDirectory`
indexed the `dist/` folder, each area page had dense crime content that outranked individual crime
custom records in Pagefind's TF-IDF scoring.

Fix: `data-pagefind-ignore` added to the `<section>` wrapping "Recent Headlines" on
`src/pages/trinidad/area/[slug].astro`. Area pages are still indexed (for name, region, risk level,
stats) but their crime lists no longer drown out individual records.

## Parser Bug (Mar 12, 2026)
Indexer was using `csvText.split('\n')` + `parseCSVLine` (line-by-line). Summaries with embedded
newlines (common in quoted CSV fields) would corrupt records — the summary would be split across
two "lines", breaking the column map. Fix: updated to `parseFullCSV` + `createColumnMapFromArray`
(Papaparse full-file parsing, same as the rest of the codebase after Phase 1).

## Key Facts
- Indexer reads from `csv-cache.json` at build time — D1 cannot be used (runtime-only, Cloudflare env)
- CSV approach is correct; just needs `parseFullCSV` for correctness
- `pagefind()` must still be in `integrations[]` — it provides pagefind-ui.js and the CSS
- Region pages do NOT have embedded crime lists — only area pages were affected

## Change Log
- 2026-03-12: Integration created, 2591 crimes indexed
- 2026-03-12: Ranking fix — `data-pagefind-ignore` on area page crime list section
- 2026-03-12: Parser fix — `parseFullCSV` replaces line-by-line CSV split
