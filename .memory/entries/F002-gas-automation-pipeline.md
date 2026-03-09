---
id: F002
type: feature
status: active
created: 2025-11-01
updated: 2026-03-09
related: [B004, B005, B006, B007, B008, B013, L010, F004]
---

## Summary
Trinidad crime data collection pipeline: RSS feeds → article fetch → pre-filter → Claude Haiku 4.5 extraction → Google Sheets → CSV → Astro site. Runs automatically; manual Facebook entries via facebookSubmitter web app.

## Implementation Details

**Pipeline files (all in `google-apps-script/trinidad/`):**
- `rssCollector.gs` — fetches RSS feeds (Trinidad news sources)
- `articleFetcherImproved.gs` — retrieves + parses article content
- `preFilter.gs` — pre-filters non-crime articles before AI
- `orchestrator.gs` — main automation flow controller
- `claudeClient.gs` — Claude Haiku 4.5 extraction (primary)
- `crimeTypeProcessor.gs` — validates/processes crime types (reads from schema.gs)
- `schema.gs` — SINGLE SOURCE OF TRUTH: CRIME_TYPES, SAFETY_TIP_CATEGORIES/CONTEXTS, CONFIDENCE_TIERS, derived helpers
- `syncToLive.gs` — staging → production sheet sync
- `config.gs` — API keys, model config, sheet/source config

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
- GAS README: `google-apps-script/trinidad/README.md`

## Change Log
- 2026-01-01: Migrated from Gemini/Groq to Claude Haiku 4.5
- 2026-02-02: Facebook Submitter web app created
- 2026-03-09: 10-point audit applied to claudeClient.gs + processor.gs + config.gs (see L010)
- 2026-03-09: schema.gs centralization migration plan created — see docs/guides/SCHEMA-CENTRALIZATION-PLAN.md
- 2026-03-09: Phases 1–4 complete — schema.gs is live, CRIME_SEVERITY deleted from crimeTypeProcessor.gs, claudeClient.gs prompt fully derived from schema. See L010 for full audit results. Phases 5–6 (frontend crimeSchema.ts) deferred.
