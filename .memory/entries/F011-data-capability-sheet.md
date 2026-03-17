---
id: F011
type: feature
status: active
created: 2026-03-17
related: [CFG002, D006]
---

## Summary
Institutional-grade one-pager at `/data-capability-sheet/` for B2B prospects — insurance companies, risk consultancies, researchers, grant committees. Printable as PDF via browser print. All content lives in `src/config/capabilitySheetConfig.ts` — edit there, not the Astro page.

## What It Contains
- Platform overview (dynamic month count from `health-data.json`)
- Data Asset Summary table (datasets, coverage, frequency, formats)
- Incident Record Schema (field list)
- The Unreported Crime Layer (qualitative section — no dataset backing this)
- Institutional Use Cases
- Data Packages (Basic / Professional / Enterprise)
- Expansion Roadmap
- Contact & Legal

## Updating Content
Edit `src/config/capabilitySheetConfig.ts` only. The Astro page is a template — do not put content directly in it. `{MONTHS}` token in strings is replaced at build time with the calculated month count.

## Data Delivery Honesty Gap (confirmed March 2026)
The formats column lists CSV and PDF Report for most datasets. These are **not self-serve** — they are available upon engagement. The page makes this explicit with a `†` footnote below the table.

What is actually live/self-serve:
- JSON via `/api/crimes`, `/api/dashboard`, `/api/search` — real and working
- Dashboard (web) — real and working
- Browser print-to-PDF of the capability sheet itself

What requires engagement (not automated):
- CSV export — no export buttons or generation code exists anywhere
- PDF Reports — no programmatic generation; manual/custom only

## The Unreported Crime Layer
This section describes the "dark figure" concept (Facebook group incidents). The data layer was **never built** — no `sourceType` field in the Crime schema, no pipeline for it. It was removed from the Data Asset Summary table (March 2026) because listing it as a comparable dataset damages credibility. The qualitative section below the table still explains the concept correctly.

## Change Log
- ~Feb 2026: Page created
- 2026-03-17: Fixed missing trailing slash on CTA link (`/business-solutions.astro` line 184)
- 2026-03-17: Removed unreported crime row from Data Asset Summary table
- 2026-03-17: Added `†` footnote to CSV/PDF Report formats — "available upon engagement"
- 2026-03-17: Removed `Source Type (Reported / Unreported)` from schema fields (field doesn't exist in data)
- 2026-03-17: Fixed breadcrumb href in `data-capability-sheet.astro` (missing trailing slash on Business Solutions link)
