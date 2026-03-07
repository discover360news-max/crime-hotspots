---
id: D002
type: decision
status: active
created: 2026-01-01
updated: 2026-03-07
related: [F002, CFG001]
---

## Summary
All CSV data source URLs are defined in exactly one place: `src/config/csvUrls.ts`. All other files import from this config. Never hardcode CSV URLs elsewhere.

## Implementation Details

**Single source of truth:**
- `astro-poc/src/config/csvUrls.ts`

**Files that import from it:**
- `src/lib/crimeData.ts` — server-side SSG/SSR data loading
- `src/scripts/dashboardDataLoader.ts` — client-side dashboard
- `src/lib/areaAliases.ts` — area name mapping

**Rule:** When `current` points to the 2026 sheet, do not also load an explicit 2026 sheet — would double-count.

## Decisions Made
Consolidated from scattered hardcoded URLs across multiple files. When year rolls over or Google Sheet URL changes, one-file update propagates everywhere.

## Known Issues / Gotchas
- GAS scripts (`socialMediaStats.gs`, `weeklyBlogAutomation.gs`) use `TRINIDAD_CSV_URL` Script Property — this must stay in sync with `csvUrls.ts` manually
- `dashboardDataLoader.ts` runs on the client — it fetches the CSV directly from the browser, so the URL must be publicly accessible (it is — Google Sheets CSV export)

## Change Log
- 2026-01-01: Consolidated CSV URL management
