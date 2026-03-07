---
id: F002
type: feature
status: active
created: 2025-11-01
updated: 2026-03-07
related: [B004, B005, B006, B007, B008, F004]
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
- `crimeTypeProcessor.gs` — validates/processes crime types
- `syncToLive.gs` — staging → production sheet sync
- `config.gs` — API keys, model config, sheet/source config

**Claude Haiku config:**
- Model: `claude-3-5-haiku-20241022`
- Prompt caching enabled (~90% input token savings)
- `maxOutputTokens`: 4096 — NEVER change this
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
