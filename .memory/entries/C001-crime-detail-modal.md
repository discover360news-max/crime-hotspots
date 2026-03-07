---
id: C001
type: component
status: active
created: 2026-02-06
updated: 2026-03-07
related: [L008, F005, F008]
---

## Summary
`CrimeDetailModal.astro` — thin 261-line orchestrator that imports 5 focused TypeScript modules. Handles crime detail in a modal overlay on dashboard, headlines, archive, area pages. Removed from non-map pages Mar 1 — crime cards now use plain `<a href>` links.

## Implementation Details

**Orchestrator:** `src/components/CrimeDetailModal.astro` (261 lines)

**5 modules in `src/scripts/`:**
- `modalHtmlGenerators.ts` — generates HTML for trending, related crimes, safety context
- `modalFeedbackHandler.ts` — helpful/not helpful feedback
- `modalShareHandlers.ts` — social sharing (WhatsApp, Facebook, X, copy link)
- `modalReportHandler.ts` — issue reporting form submission
- `modalLifecycle.ts` — open/close, `pushState` URL updates, `popstate` back button

**`bindRelatedCrimeLinks()`** — stays in orchestrator (not extracted)

**Shared utils:** `src/lib/escapeHtml.ts`, `src/lib/safetyHelpers.ts`, `src/lib/trendingHelpers.ts`

**Where it's used:**
- `dashboard.astro` — map popup opens modal
- All other pages: removed Mar 1, 2026 — crime cards use `<a href="/trinidad/crime/[slug]">`

## Known Issues / Gotchas
- Modal requires `window.__crimesData` to be set (see L008) — only works on pages that set it
- `ReportIssueModal` must be mounted to `document.body` — ancestor `backdrop-blur-md` breaks `fixed` positioning
- `modalLifecycle.ts` intercepts `astro:before-navigate` with `navigationType === 'traverse'` to prevent back-nav while modal is open
- `pushState` on modal open means browser back button closes modal (handled by `popstate` listener)

## Change Log
- 2026-02-06: Refactored from 918 → 261 lines; 5-module architecture
- 2026-03-01: Removed from all non-map pages; crime cards use plain links
