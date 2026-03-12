---
id: F004
type: feature
status: active
created: 2026-02-06
updated: 2026-03-11
related: [B007, B008, B010, F002]
---

## Summary
Fully automated weekly blog pipeline: Monday 10AM Trinidad time → GAS validates data → fetches CSV stats → Claude Haiku writes post → GitHub commit → Cloudflare auto-deploys. Cost: ~$0.01–0.03/post.

## Implementation Details

**Main file:** `google-apps-script/trinidad/weeklyBlogAutomation.gs`
**Dependencies:** `config.gs`, `socialMediaStats.gs`, `blogDataGenerator.gs`

**Pipeline flow:**
1. Monday 10AM trigger fires `generateWeeklyBlog()`
2. 4-layer validation: min crimes (10), data freshness, backlog check, duplicate detection
3. `fetchCrimeData()` + `filterCrimesByDateRange()` → CSV-based stats
4. Stats sent to Claude Haiku 4.5 → markdown blog post returned
5. Wrapped in Astro frontmatter → committed to GitHub via Contents API
6. Cloudflare auto-deploys from the push

**Script Properties required:**
- `CLAUDE_API_KEY` — Anthropic API key
- `GITHUB_TOKEN` — GitHub personal access token
- `GITHUB_REPO` — `discover360news-max/crime-hotspots`
- `TRINIDAD_CSV_URL` — must match `src/config/csvUrls.ts`

**Key config:** `SOCIAL_CONFIG.lagDays = 3` — crimes dated by incident date, ~3-day reporting lag

**Test functions:**
- `testBlogGeneration()` — full test without GitHub commit
- `testClaudeBlogOnly()` — tests Claude API with sample data only
- `forceGenerateWeeklyBlog()` — bypasses all 4 safeguards

**Blog file path:** `astro-poc/src/content/blog/trinidad-weekly-YYYY-MM-DD.md`

## Known Issues / Gotchas
- See B007 — date boundaries must use `setHours(0/23)` in stats functions
- See B008 — CSV column fallbacks required
- To delete a GAS-committed blog file (not in local repo): use GitHub API via `gh api --method DELETE` (see B010)
- `SOCIAL_CONFIG.lagDays = 3` — do not change without understanding impact on stats accuracy

## Title Format
`buildBlogSystemPrompt()` generates titles as:
`Trinidad [Year]: [Y] Murders This Week — [X] Total Crimes ([Month Abbreviation Day])`
e.g. `Trinidad 2026: 7 Murders This Week — 55 Total Crimes (Mar 6)`
Targets "trinidad murders 2026" and "trinidad crime this week" queries.

## Change Log
- 2026-02-06: Weekly blog automation launched
- 2026-03-02: Fixed murder count bugs (B007, B008, B010)
- 2026-03-11: Updated title template in system prompt for SEO keyword targeting
