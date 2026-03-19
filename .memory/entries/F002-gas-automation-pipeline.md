---
id: F002
type: feature
status: active
created: 2025-11-01
updated: 2026-03-19
related: [B004, B005, B006, B007, B008, B013, B023, L010, F004]
---

## Summary
Trinidad crime data collection pipeline: RSS feeds → article fetch → pre-filter → Claude Haiku 4.5 extraction → Google Sheets → CSV → Astro site. Runs automatically; manual Facebook entries via facebookSubmitter web app.

## Implementation Details

**Pipeline files (all in `google-apps-script/trinidad/` and `google-apps-script/jamaica/`):**

Core automation:
- `rssCollector.gs` — fetches RSS feeds
- `articleFetcherImproved.gs` — retrieves + parses article content
- `orchestrator.gs` — main automation flow controller
- `crimeTypeProcessor.gs` — validates/processes crime types (reads from schema.gs)
- `schema.gs` — SINGLE SOURCE OF TRUTH: CRIME_TYPES, SAFETY_TIP_CATEGORIES/CONTEXTS, CONFIDENCE_TIERS, derived helpers
- `syncToLive.gs` — staging → production sheet sync
- `config.gs` — API keys, model config, sheet/source config

**Refactored files (Mar 19 2026) — split from monolithic originals:**

`processor.gs` (was ~1370 lines) → 4 files:
- `processorCore.gs` (~325 lines) — shared helpers (buildColMap, appendRowByHeaders) + main loop + utility date functions
- `processorOutputMapper.gs` (~207 lines) — appendToProduction + appendToReviewQueue
- `processorDuplicates.gs` (~637 lines) — all duplicate detection logic (isDuplicateCrime, checkSemanticDuplicate, findPotentialDuplicate, similarity helpers)
- `processorMaintenance.gs` (~202 lines) — backlog monitoring + archiving + test function

`preFilter.gs` (was 1148 lines, identical between projects) → 5 files:
- `preFilterCore.gs` (~241 lines) — PREFILTER_CONFIG + preFilterArticles orchestrator + promoteFilteredArticle
- `preFilterKeywords.gs` (~240 lines) — loadKeywords + scoreArticle + logFilteredArticle + API tracker sheet helpers
- `preFilterUrlIndex.gs` (~188 lines) — buildUrlIndex + refreshUrlIndexCache + debugRawArchiveSheet
- `preFilterDuplicates.gs` (265 lines) — all checkFor* and checkSheetFor* duplicate functions. NOTE: calculateSimilarity + levenshteinDistance removed (Mar 19 2026) — canonical definitions are in processorDuplicates.gs (global scope)
- `preFilterArchive.gs` (~157 lines) — autoArchiveProcessedArticles + previewArchivableArticles

`claudeClient.gs` (was ~780 lines) → 2 files:
- `claudeClientCore.gs` (~433 lines) — extractCrimeData + parseClaudeResponse + test functions
- `claudePrompts.gs` (~343-352 lines) — buildSystemPrompt + buildUserPrompt

`facebookSubmitter.gs` (was 959-1110 lines) → 2 files:
- `facebookSubmitterCore.gs` (~229-338 lines) — doGet + submitFacebookPost + sheet writer functions
- `facebookSubmitterHtml.gs` (~730-772 lines) — getFacebookSubmitterHtml (pure HTML/CSS/JS template)

**Trinidad legacy files deleted (Mar 19 2026):**
- `geminiClient.gs` — old Gemini API client (predates Jan 2026 Claude migration, dead code)
- `groqClient.gs` — old Groq API client (same era, dead code)
- `plusCodeConverter.gs` — standalone Plus Code helper (logic absorbed into processorCore.gs)

**Claude Haiku config:**
- Model: `claude-haiku-4-5-20251001` (Haiku 4.5)
- Prompt caching enabled (~90% input token savings)
- `max_tokens`: 4096 in CLAUDE_CONFIG — NEVER reduce below 4096
- Cost: ~$2.70/month for 20 articles/day

**Facebook Submitter (`facebookSubmitter.gs`):**
- Web app: paste text + URL → Claude Haiku extracts → Production sheet
- Year toggle: 2026 → pipeline Production; 2025 → FR1 sheet (different column format)
- Primary source for Guardian articles (site is fully JS-rendered, no RSS)
- See B005 — only one `doGet()` per project

**Script Properties required:**
- `CLAUDE_API_KEY` — Anthropic API key
- `GOOGLE_SHEETS_ID` — Production spreadsheet ID

## Known Issues / Gotchas
- NEVER change `maxOutputTokens` from 4096
- NEVER remove multi-crime detection
- See B004 for timezone mismatch when reading sheet dates
- See B008 for CSV column name fallbacks
- See B023 for the date accuracy multi-root bug (empty pubDate + null crime_date + getDay() timezone + missing prompt rules)
- If a crime date stored in Production = the automation run date (matches Timestamp column) → publishedDate was falsy AND crime_date was null. Check "Publish Date" cell in Raw Articles sheet.
- ⚠️ No Trinidad GAS README exists (F002 referenced one that was never created)

## Date Extraction Rules (as of Mar 19 2026)
The system prompt in `claudeClient.gs` now covers:
- Standard phrases: yesterday, on [day], last [day], this morning/today, overnight
- "a day after [X]" cross-references: Event X date = primary event date − 1 day
- Ongoing crimes (trafficking, fraud, abuse): use the raid/rescue/arrest date, never null
- `publishDateMissing` flag: routes all crimes from that article to Review Queue
- `!crime.crime_date` check: forces Review Queue with ambiguity note

## Change Log
- 2026-01-01: Migrated from Gemini/Groq to Claude Haiku 4.5
- 2026-02-02: Facebook Submitter web app created
- 2026-03-09: 10-point audit applied to claudeClient.gs + processor.gs + config.gs (see L010)
- 2026-03-09: schema.gs centralization migration plan created — see docs/guides/SCHEMA-CENTRALIZATION-PLAN.md
- 2026-03-09: Phases 1–4 complete — schema.gs is live, CRIME_SEVERITY deleted from crimeTypeProcessor.gs, claudeClient.gs prompt fully derived from schema. See L010 for full audit results. Phases 5–6 (frontend crimeSchema.ts) deferred.
- 2026-03-19: Monolithic scripts split into focused files (both islands) — processor.gs→4 files, preFilter.gs→5 files, claudeClient.gs→2 files, facebookSubmitter.gs→2 files. Trinidad legacy cleanup: deleted geminiClient.gs, groqClient.gs, plusCodeConverter.gs.
- 2026-03-19: Date accuracy overhaul (B023) — 6 fixes applied to both Trinidad and Jamaica pipelines: (1) rssCollector.gs pubDate 3-step fallback; (2) processor.gs publishDateMissing flag + review routing; (3) processor.gs null crime_date review routing; (4) claudeClient.gs dayOfWeek timezone fix (getDay→Utilities.formatDate EEEE); (5) prompt: "a day after" cross-reference rule + table rows; (6) prompt: ONGOING CRIMES rule block.
- 2026-03-19: Removed duplicate calculateSimilarity + levenshteinDistance from preFilterDuplicates.gs (both projects). Canonical definitions in processorDuplicates.gs (global GAS scope) are shared by preFilter code automatically.
