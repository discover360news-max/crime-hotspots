---
id: D007
type: decision
status: active
created: 2026-03-13
updated: 2026-03-18
related: [D006, C002, B014]
---

## Summary
Replaced Pagefind static search with D1 FTS5 server-side search. Pagefind was fundamentally
mismatched for this site: SSR crime pages produced no static HTML for the crawler, ranking was
controlled by TF-IDF over static HTML content (area pages dominated), and every change required
a full rebuild to update the index.

## Architecture

**FTS5 virtual table (`crimes_fts`):**
```sql
CREATE VIRTUAL TABLE crimes_fts USING fts5(
  story_id UNINDEXED,  -- year-prefixed PK, stored not indexed
  title,               -- crime headline (BM25 weight 10)
  body,                -- area + region + crimeType + street + summary (weight 1)
  url UNINDEXED        -- /trinidad/crime/[slug]/ stored not indexed
);
```

**Sync worker (`workers/crime-sync/index.ts`):**
- `DELETE FROM crimes_fts` at start of each `runFullSync()` (clears stale entries)
- Batch-inserts FTS entries alongside crimes in same `db.batch()` calls
- FTS is always in sync with crimes table after each sync

**Search endpoint (`src/pages/api/search.ts`):**
- `GET /api/search/?q=...` — prerender: false, no CDN cache
- Crimes: FTS5 MATCH with prefix tokens (`word*`), sorted by recency (JOIN crimes on story_id, ORDER BY year DESC, month DESC, day DESC)
- Areas: `SELECT DISTINCT area, region FROM crimes WHERE LOWER(area) LIKE LOWER(?)`
- MPs: static filter over `mps.json` (fullName, constituency, party, partyFull)
- Returns `{ results: SearchResult[] }` typed array

**SearchModal (`src/components/SearchModal.astro`):**
- Custom `<input id="searchInput">` with search icon + loading spinner
- Debounced fetch (300ms) to `/api/search/?q=...`
- `renderResults()` renders typed result cards with crime/mp/area badges
- Suggestions panel (recent searches, latest crimes, chips) preserved
- `escapeHtml()` used on all innerHTML rendering

## What was removed
- `astro-pagefind` and `pagefind` npm packages
- `src/integrations/pagefindCrimeIndexer.ts`
- `pagefind()` and `pagefindCrimeIndexer()` from `astro.config.mjs`
- Pagefind CSS link from `Layout.astro` (`includePagefind` prop kept as no-op for backward compat)
- `loadPagefindScript()`, `pagefindUI` variable from SearchModal

## One-time migration command
```bash
# Create FTS5 table in remote D1 (run once if DB was created before this migration):
wrangler d1 execute crime-hotspots-db --remote --command="CREATE VIRTUAL TABLE IF NOT EXISTS crimes_fts USING fts5(story_id UNINDEXED, title, body, url UNINDEXED)"

# Then trigger a manual sync to populate FTS:
curl -X POST https://crime-sync.discover360news.workers.dev/sync
```

## Key Facts
- `data-pagefind-body` / `data-pagefind-ignore` attrs left in place (inert, harmless, too many to clean)
- Areas query uses D1 LIKE (not FTS5) — different mechanism, but correct
- MPs query is pure in-process JSON filter — no D1 call needed
- No build-time index needed — crimes appear in search as soon as cron worker syncs
- Crime results sorted by recency (year/month/day DESC), not BM25 — news site UX: users want latest, not highest term frequency. FTS5 still filters by relevance; only matching stories are returned.

## Change Log
- 2026-03-18: Switched crime result sort from BM25 to recency (year/month/day DESC via JOIN with crimes table). Uses integer columns to avoid date string format issues.
- 2026-03-13: Implemented. Build passes (2596 rows). Pagefind fully removed.
