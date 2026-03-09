---
id: B013
type: bug
status: fixed
created: 2026-03-09
updated: 2026-03-09
related: [B004, F002]
---

## Summary
`processor.gs` looked up `rawColMap['published date']` but the Raw Articles sheet column header is `"Publish Date"` (no 'd'). This caused `publishedDate` to always be `undefined`, triggering the `buildUserPrompt()` fallback to `new Date()` (the run date), so all crime dates were stamped with the automation run date instead of the article publish date.

## Fix Applied
`processor.gs:137` — changed `rawColMap['published date']` → `rawColMap['publish date']`

## Second Fix Applied (same session)
`processor.gs:validateAndFormatDate()` — `new Date("2026-03-08")` parses as UTC midnight in V8/GAS, which shifts one day back when formatted in TT (UTC-4). Fixed by appending `T12:00:00` to ISO date strings before parsing.

## Raw Articles Sheet Column Headers (confirmed)
`Timestamp | Source | Title | URL | Full Text | Publish Date | Status | Notes`

Note: `config.gs:getOrCreateArchiveSheet()` was also creating the archive sheet with `"Published Date"` — fixed to `"Publish Date"` to match.
