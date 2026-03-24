# SESSION Protocol — How Claude Uses This System

## Every New Session

1. **INDEX.md is always loaded** — scan it to locate relevant entries before starting work
2. **For any implementation request:** read `docs/claude-context/site-features.md` — states all active pages, components, scripts, and algorithms. Do this before proposing anything.
3. **If UI is involved:** `Glob pattern="*.astro" path="astro-poc/src/components/"` — never rebuild a component that already exists
4. **Open the relevant entry** from INDEX.md for deep gotchas before editing that area

## Before Writing Any Code

- State what already exists → then propose the change
- Prefer editing existing files over creating new ones
- Check `docs/guides/DESIGN-TOKENS.md` before any styling change (Rose + Slate palette, `rounded-lg`)
- Run `npm run build` in `astro-poc/` before committing — build must pass

## After Kavell Confirms a Task is Complete

Run through this checklist — update anything that's now stale:

**Always check:**
- `.memory/entries/` — update the Change Log of any entry whose subject was touched. If a new gotcha was discovered, create a new B### entry and add it to INDEX.md. If a decision was made, create or update a D### entry.
- `docs/claude-context/site-features.md` — if a new component, page, script, or algorithm was added/changed/removed, update the relevant table row. This is the canonical feature registry.

**If a new component was created:**
- Add it to the Components table in `site-features.md`
- Create a C### entry if it has non-obvious gotchas or architectural decisions

**If a new pattern or learning emerged:**
- Create an L### entry + one line in INDEX.md

**If a feature was completed or significantly changed:**
- Update or create the F### entry
- Update the Priority Queue in SESSION.md if that task is now done

**If a config/build/deployment change was made:**
- Update the relevant CFG### entry

**If a feature, page, algorithm, or crime type was added or changed:**
- `src/content/help/` — check whether any help article is now stale using the map below. If a major new feature has no coverage, consider a new article and add it to the sitemap (`sitemap-0.xml.ts` → `helpArticles`).
- `src/pages/faq.astro` — if a "how do I" or "what is" question came up during the session that isn't already answered in the FAQ, add a Q&A entry.

**Help Centre — topic → article map (for quick staleness check):**

| If you changed... | Review this article |
|-------------------|---------------------|
| Risk scoring, area scores, safety context | `understanding-risk-scores.md` |
| Dashboard, filters, map, Quick Insights | `dashboard-filters.md` |
| Trend indicators | `trend-indicators.md` |
| Compare page | `comparing-areas.md` |
| Area pages, area coverage | `finding-your-area.md` |
| Crime types, classification rules | `crime-classification.md` |
| Data sources, pipeline, RSS feeds | `data-sources.md` |
| Coverage, geographic limits, data lag | `data-coverage-limitations.md` |
| Safety tips system, categories, contexts | `using-safety-tips.md` |
| Safety tips submit form | `submitting-a-safety-tip.md` |
| Crime report form | `submitting-a-crime-report.md` |
| Privacy, form data handling | `report-privacy.md` |
| Bulk data access, citations | `citing-our-data.md` |

**Keep INDEX.md under 60 lines** — merge or archive stale entries if needed.
Never duplicate content already in CLAUDE.md's hard rules.

## Session Notes — Mar 24, 2026 (continued)
- **B025 fixed** — `dashboardDataLoader.ts` SSR path now fetches `/api/dashboard/?year=...` in parallel with `/api/crimes/`. Calls `applyPrecomputedStats()` to populate `.trend-indicator` (always `hidden` in SSR HTML, never populated before). Counts were always correct from SSR HTML; only trend arrows were missing.
- **B026 fixed** — `/api/dashboard.ts` trend queries gated on `isCurrentOrAllYears`. Historical year selections return zero trends → indicators hidden. Previously 2025 stat cards showed live 2026 rolling-window trend arrows.
- **Pluralization fix** — `AreaNarrative.astro` `total90d` fallback sentence now `incident{total90d !== 1 ? 's' : ''}` (was hardcoded "incidents").
- **Hover fix** — `area/[slug].astro` "Other Areas" sections: added `hover:bg-rose-50 dark:hover:bg-rose-950/30` + `dark:hover:border-rose-800` + `dark:hover:text-rose-400` to both link grids.
- **Reminder:** Purge Cloudflare CDN cache for `/api/dashboard/` to immediately invalidate stale 2025-with-trends responses.
- `p1-01-dashboard-after.png` still untracked in repo root — stray screenshot, safe to delete.

## Session Notes — Mar 24, 2026
- **Newsletter prompt:** Created reusable Buttondown prompt for weekly roundup — urgent/factual tone, ~300 words, fixed sections (This Week's Hotspots, By The Numbers, Stay Safe, Reports Matter), CTAs to `/trinidad/statistics`, `/trinidad/murder-toll`, `/report`, `/support`. Prompt-only deliverable, no code changes.
- **`/support/` page created** (`src/pages/support.astro`): Ko-fi CTA approach (button out to ko-fi.com/crimehotspots), 3 "what support covers" cards (Hosting & Infrastructure, AI Data Pipeline, Development), secondary ghost CTAs to /report + /help. Pre-rendered static.
- **Routes + nav wired:** `routes.ts` → `support: '/support/'`. Header.astro (3 links: desktop nav, subscribe tray, hamburger) + Layout.astro footer button all updated from direct Ko-fi URL → `/support/`. Footer Help nav section has "Support the Project" link added.
- **B024 blog date fix:** `weeklyBlogAutomation.gs` `buildFinalBlogMarkdown()` — frontmatter `date` now uses `formatBlogDateStr(new Date())` (publish day) instead of `blogData.weekEnd` (data window end). Fixes 3-day offset caused by `lagDays=3`. Filename still uses `weekEnd`. Also corrected existing `trinidad-weekly-2026-03-20.md` frontmatter date → `2026-03-23`.
- `p1-01-dashboard-after.png` still untracked in repo root — stray screenshot, safe to delete.

## Session Notes — Mar 22, 2026
- **Help Centre launched:** `/help/` index + 14 pre-rendered articles committed + pushed. 6 sections (Getting Started, Understanding the Data, Using the Dashboard, Safety Tips, Crime Reports, For Researchers). Nav link added (desktop + mobile), footer "Help Centre" link added. `content/config.ts` help collection schema (`section`, `summary`, `order`, `related`, `date_updated`). Sitemap: index priority 0.7, articles 0.6 with `date_updated` as lastmod. Added F015 to INDEX.md.
- **Docs cleanup:** `site-features.md` GAS section updated to reflect Mar 19 refactored file structure (split files now listed; deleted `geminiClient.gs`, `groqClient.gs`, `plusCodeConverter.gs` removed; `facebookSubmitter.gs` → two-file split noted).
- **Data:** 12 new redirect entries (Stories 612–624), 4 new Jamaica area aliases (Black River, Kingston, Middleton, Seaforth — count now 17), health-data.json refreshed.
- `p1-01-dashboard-after.png` remains untracked in repo root (stray screenshot — delete or gitignore).

## Session Notes — Mar 19, 2026 (continued x3)
- **Push learnings:** When splitting a monolithic GAS file, git rename detection assigns the rename to the most similar output file (by content). `claudeClient.gs → claudePrompts.gs` (64% similar) was detected as a rename; `claudeClientCore.gs` appeared as `create mode` even though it contains the core logic. Same pattern: `processor.gs → processorDuplicates.gs` (51%), `facebookSubmitter.gs → facebookSubmitterHtml.gs` (73%). Not a problem — just means git history for the "core" split file looks like a new file rather than a rename. Worth knowing when reading `git log --follow` on these files.
- **Net line reduction:** Refactoring produced -1,449 net lines (5,171 insertions, 6,620 deletions). Accounts for: Trinidad legacy deletions (geminiClient 672 + groqClient 593 + plusCodeConverter 183 = 1,448 lines) + duplicate similarity helpers removed (~116 lines across both preFilterDuplicates files). No logic was lost.
- `p1-01-dashboard-after.png` left untracked in repo root (stray screenshot, not project code — Kavell can delete or gitignore).

## Session Notes — Mar 19, 2026 (continued x2)
- **Deduplication of similarity helpers:** Removed `calculateSimilarity` and `levenshteinDistance` from `preFilterDuplicates.gs` in both Trinidad and Jamaica. Canonical definitions remain in `processorDuplicates.gs` — in global GAS scope, so preFilter code picks them up automatically. No logic changes; purely removing dead duplicate code.
- Files changed: `google-apps-script/trinidad/preFilterDuplicates.gs`, `google-apps-script/jamaica/preFilterDuplicates.gs`
- F002 updated: `preFilterDuplicates.gs` line count corrected to 265 lines; Trinidad legacy deletions added to Change Log.

## Session Notes — Mar 19, 2026 (continued)
- **GAS file refactoring — both islands:** Monolithic scripts split into focused files (applied identically to Trinidad + Jamaica):
  - `processor.gs` (~1370 lines) → `processorCore.gs` (325/324) + `processorOutputMapper.gs` (207/200) + `processorDuplicates.gs` (637) + `processorMaintenance.gs` (202)
  - `preFilter.gs` (~1148 lines) → `preFilterCore.gs` (241) + `preFilterKeywords.gs` (240/241) + `preFilterUrlIndex.gs` (188) + `preFilterDuplicates.gs` (265) + `preFilterArchive.gs` (157)
  - `claudeClient.gs` (~780 lines) → `claudeClientCore.gs` (433) + `claudePrompts.gs` (343 T&T / 352 JM)
  - `facebookSubmitter.gs` → `facebookSubmitterCore.gs` (338 T&T / 229 JM) + `facebookSubmitterHtml.gs` (772 T&T / 730 JM)
- **Trinidad legacy cleanup:** Deleted `geminiClient.gs` (old Gemini API client), `groqClient.gs` (old Groq API client), `plusCodeConverter.gs` (standalone Plus Code helper — logic absorbed into processorCore.gs). These predate the Claude Haiku migration (Jan 2026) and were dead code.
- F002 updated with full refactored file inventory + line counts.

## Session Notes — Mar 19, 2026
- **Date accuracy overhaul (B023):** diagnosed multi-root date failure via CNC3 human trafficking article (published Mar 17, stored as Mar 18 = run date). Root causes: (1) empty RSS pubDate stored as `''` → falsy publishedDate → `|| new Date()` fallback everywhere; (2) Claude returning `crime_date: null` for ongoing crimes (trafficking/abuse with multi-year span); (3) `getDay()` in buildUserPrompt uses V8 UTC clock, not script timezone — can produce inconsistent date/day-of-week pair; (4) no prompt rules for "a day after [X]" cross-references or ongoing crimes with specific event dates.
- **6 fixes applied identically to both Trinidad and Jamaica pipelines:**
  - `rssCollector.gs`: pubDate now has 3-step fallback (pubDate → dc:date namespace → collection timestamp + 🚨 log)
  - `processor.gs`: `publishDateMissing` flag detected immediately; all crimes from missing-pubDate articles capped to confidence ≤5 → Review Queue with ambiguity note
  - `processor.gs`: `!crime.crime_date` check before routing; null date forces Review Queue with "verify date against article" reason
  - `claudeClient.gs`: `dayOfWeek` now uses `Utilities.formatDate(pubDate, Session.getScriptTimeZone(), 'EEEE')` (timezone-consistent with pubDateStr)
  - `claudeClient.gs` system prompt: DATE CALCULATION RULES table extended with "a day after [X]" and "two days after [X]" rows
  - `claudeClient.gs` system prompt: new "A DAY AFTER CROSS-REFERENCE RULE" block + "ONGOING CRIMES WITH A SPECIFIC EVENT DATE" block
- **Jamaica note:** `"a day after"` example in Jamaica's prompt uses Spanish Town/Kingston (not Rio Claro/Cunupia)
- **Diagnostic signal:** crime date = run date (matches Timestamp column) → publishedDate was falsy AND crime_date was null. Check "Publish Date" cell in Raw Articles sheet first.
- Files changed: `google-apps-script/trinidad/rssCollector.gs`, `processor.gs`, `claudeClient.gs`; `google-apps-script/jamaica/rssCollector.gs`, `processor.gs`, `claudeClient.gs`
- Memory: B023 entry created; F002 updated (related list, Known Issues, Date Extraction Rules, Change Log)
- **DEPLOY REQUIRED:** All 6 GAS files must be manually copied into the live GAS editor (Trinidad + Jamaica projects). Prompt caching means the old system prompt may be served briefly after deploy — first new article will pick up the updated rules.

## Session Notes — Mar 18, 2026

- New page `/trinidad/murders/` (`src/pages/trinidad/murders.astro`): current-year murders-only list, date-grouped chronological, links to individual crime pages via `buildRoute.crime()`, victim count badge when >1, footer link to statistics, newsletter at bottom. In sitemap. `routes.ts`: added `murders: '/trinidad/murders/'` under trinidad block.
- `murder-count.astro` (T&T): "View all {year} murders →" link added at bottom of Latest Incidents sidebar block, pointing to `/trinidad/murders/`.
- T&T murder-count page synced with Jamaica: "Projected Rate" → **"Annualized Rate"** (card label + InfoPopup bullet + footer note). Card subtext changed from `~N murders` to `{murderCount} murders in {daysPassed} days`. Days calculation hardened with `Math.max(1, ...)` (removes divide-by-zero ternary). Footer note now matches Jamaica's descriptive version.
- 16 Jamaica MP photos committed (`public/images/mps/jamaica/`): andrea-purkiss, dayton-campbell, devon-mcdaniel, edmund-bartlett, george-wright, heatha-miller-bennett, heroy-clarke, horace-chang, ian-hayles, kenneth-russell, krystal-lee, marlene-malahoo-forte, matthew-samuda, nekeisha-burchell, tova-hamilton, zavia-mayne.
- `site-features.md`: page count 28 → 29; murders list page added; murder-count entries updated to reflect Annualized Rate.
- `/trinidad/murders/` updated: date-group badge changed from bare number to `N murder(s)` (singular/plural); "Load more" added — shows 14 groups initially, reveals 14 more per click, status line "Showing X of Y days", button+status self-remove when all shown. No-JS fallback: all groups present in HTML, `hidden` class toggled by JS only.
- Pipeline artifacts: `area-aliases.json` (+1 alias: Fonrose → Rio Claro), `redirect-map.json` (+22 legacy slug redirects), `health-data.json` (build timestamp).
- **Murders page count drift fixed:** `countCrimeType()` now used for all victim-aware counts (page header, day badge, title, description). `incidentCount = murders.length` used for secondary "across N incidents" note (only shown when counts differ). Day badge now consistent with individual card "N killed" badge.
- **SEO hardened (3 fixes):** (1) `sitemap-0.xml.ts`: `trinidad/murders/` added to staticPages (`priority: 0.8, changefreq: daily`); (2) Structured data upgraded from bare `WebPage` to `WebPage` + `Dataset` mainEntity with `variableMeasured` (Total Murders, Total Incidents, Days with Murders), geo coords, CC BY 4.0 — eligible for Google Dataset Search; (3) JSON-LD moved to `slot="head"` (was in body) — consistent with crime pages. All schema values self-update from live build data.

## Session Notes — Mar 17, 2026 (continued x8)
- `JAMAICA-INTEGRATION-PLAN.md` updated: Phase 1.5 enhancements documented (statistics/murder-count full production, countdown card, area aliases, csvBuildPlugin), 108-day launch plan added (Phases A–F), Progress Tracker updated with all new checkboxes.
- `facebookSubmitter.gs` country selector built: `JAMAICA_PIPELINE_SHEET_ID` placeholder constant, `targetCountry` param added to `submitFacebookPost()`, Jamaica location prepend hint for Claude extraction, country-aware location filter, 3-way routing (Jamaica → `appendToJamaicaProduction`, T&T 2025 → FR1, T&T 2026 → Production), new `appendToJamaicaProduction()` function (opens Jamaica sheet by ID, geocodes with Jamaica address). HTML: Year toggle wrapped in `#yearSection` div (hidden for Jamaica), Country toggle added (T&T/JM), `setCountry()`/`loadStickyCountry()` JS, country badge (JA/TT) in session history, subtitle updates dynamically.
- **ONE MANUAL STEP NEEDED:** Open `google-apps-script/trinidad/facebookSubmitter.gs`, find `JAMAICA_PIPELINE_SHEET_ID = 'YOUR_JAMAICA_SHEET_ID_HERE'` and fill in the Jamaica pipeline spreadsheet ID (copy from Jamaica Sheet URL bar).
- F013 step 1 (FB Submitter country toggle) is now DONE.

## Session Notes — Mar 17, 2026 (continued x7)
- Jamaica homepage card: added `jamaica-card-trsp-bg.png` (transparent-bg island+flag image). Card extracted from coming-soon loop — now its own block with: header row (flag+name left, amber "JUL 2026" badge right), full-colour image, D:HH:MM live countdown to 2026-07-04T00:00:00 local (updates every 60s via setInterval), "Launching soon" fallback when diff≤0. Guyana/Barbados loop updated to match card structure (flag+name in header, "Coming Soon" pill at same footer level, invisible spacer line for height alignment). Build passes. Full launch prep plan written to F013-jamaica-launch-prep.md.

## Session Notes — Mar 17, 2026 (continued x6)
- Jamaica RegionData CSV published by Kavell: `JAMAICA_REGION_DATA_CSV_URL` added to csvUrls.ts (gid=910363151, Jamaica spreadsheet). Build plugin updated to also generate `area-aliases-jamaica.json` alongside T&T's `area-aliases.json`. 113 areas, 12 known_as aliases. health-data.json now includes `jamaica_area_aliases_count`. Created F013-jamaica-launch-prep.md. Launch sequence step 2 (RegionData CSV + area aliases) is now DONE.
- Next launch sequence steps: (1) FB submitter country toggle, (3) pipeline producing rows, (4) D1 setup, (5) uncomment TODO.

## Session Notes — Mar 17, 2026 (continued x5)
- SEO audit (Jamaica pages): foundation solid (title/desc/canonical/robots/OG all inherited via Layout.astro). Fixed: T&T murder-count hardcoded years (currentYear=2026, dates, JSX strings, structured data names → all dynamic). Fixed: alt="" on both MP index pages (T&T + Jamaica) → `mp.photo ? \`${displayName}, MP\` : ''`. Fixed: Jamaica MP slug ogType → "profile" (63 pages).
- Upgraded Jamaica statistics + murder-count from bare stubs to full production pages (T&T parity). Jamaica-specific: population 2.8M, "parishes" not "divisions", single `JAMAICA_CSV_URL`, Jamaica geo coords (18.1096, -77.2975). Full SEO on both: Dataset schema + FAQPage (4 Q&As) + BreadcrumbList on statistics; WebPage+Dataset+BreadcrumbList on murder-count. Both have graceful empty state while allCrimes=[]. TODO comment marks the one line to uncomment when Jamaica D1 is live. Build passes.
- FB submitter (`google-apps-script/trinidad/facebookSubmitter.gs`) is a manual paste tool (not automated). Decision: add country selector (T&T/Jamaica) to existing tool. Changes needed: UI toggle, location filter update (lines 93–103), sheet routing to Jamaica spreadsheet ID. Claude extraction in claudeClient.gs should be made country-aware for better area/location accuracy.
- D1 for Jamaica: deferred until pipeline is producing rows. Do NOT set up D1 infrastructure before data is flowing.
- Jamaica area seed data provided (110 areas, 14 parishes, JCF Area 1–4 as Division). Covers Kingston, St. Andrew, St. Catherine, St. James most thoroughly. See F013-jamaica-launch-prep.md. Kavell will add to Jamaica RegionData sheet and publish CSV URL. Once URL is available → wire area aliases.
- Jamaica launch sequence: (1) FB submitter country toggle → (2) RegionData CSV published + area aliases wired → (3) pipeline producing rows confirmed → (4) Jamaica D1 setup + sync worker → (5) uncomment TODO in statistics + murder-count pages.

## Session Notes — Mar 17, 2026 (continued x4)
- Jamaica GAS Pipeline (Phase 1) in progress — NOT yet complete. 1a (sheet + LIVE_SHEET_ID configured) and 1b (all 9 script files built: config.gs with 4 RSS sources, orchestrator.gs with split trigger functions, syncToLive.gs, claudeClient.gs) are done. Triggers (1d) deliberately deferred — Kavell prioritised frontend shell first. Testing (1c) pending triggers. Next: activate triggers in GAS editor, then run test checklist. Plan doc status: "Phase 1 in progress (1a + 1b done, triggers pending)".

## Session Notes — Mar 17, 2026 (continued x3)
- Jamaica Frontend Shell (Phase 1.5) COMPLETE. All pages live: /jamaica/dashboard/, /jamaica/mp/ (63 MPs, 14 parishes), /jamaica/parishes/, /jamaica/headlines/, /jamaica/statistics/, /jamaica/murder-count/, /jamaica/archive/. Homepage: Jamaica card added as first coming-soon entry (flag emoji placeholder, no image yet). routes.ts: jamaica block + buildRoute.jamaicaMp/jamaicaParish. csvUrls.ts: JAMAICA_CSV_URL added. sitemap-0.xml.ts: 7 Jamaica static pages + 63 MP pages. Schema: mps-jamaica.json uses parishSlugs (not regionSlugs). Shell data pages use `const allCrimes: never[] = []` with TODO comment. Build passes (20s).

## Session Notes — Mar 17, 2026 (continued x2)

- SAFETY_TIP_CATEGORIES audit: count is 14 (not 13 — user miscounted). 'Online Scam' IS in use — 3 tips: tip-00005 (WhatsApp), tip-00021 (marketplace), tip-00030 (online sales). No drift. Both 'Online Scam' (tip category) and 'Fraud' (crime type) intentionally coexist.
- Facebook sources for Jamaica documented in plan doc (Phase 0c complete): Broadcast — Observer, TVJ, CVM TV, Nationwide 90FM, RJR News. Official — JCF (~357K followers), Crime Stop JA (~8.6K). Advocacy (Phase 2+) — Jamaica Women & Children Murdered RIP, Jamaicans for Justice. Priority order defined.
- Official govt stats sites assessed: JCF stats page (jcf.gov.jm/stats-2/) is JS-rendered Highcharts — not scrapeable, manual reference only, but actively maintained (last mod Mar 15 2026). STATIN (statinja.gov.jm) is annual data only, ASP.NET, skip. DISCOVERY: JCF has a live RSS feed at https://jcf.gov.jm/feed/ — updated hourly, police-confirmed press releases. Added as Source 4 in plan (highest confidence, needs pre-filter for non-crime posts).
- Next session: Phase 1 — Jamaica GAS Pipeline. Start with 1a (new Google Sheet setup).

## Session Notes — Mar 17, 2026 (continued)
- Phase 0 of Jamaica integration COMPLETE. Added `Fraud` crime type (severity 3, isContextType false) to: schema.gs, crimeSchema.ts, crimeTypeConfig.ts (useVictimCount: false), crimeColors.ts (teal-500 / #14b8a6), leafletMap.ts, generateCrimeTypeThumbnails.ts (label 'FR'), statCardFiltering.ts pluralMap. Also fixed pre-existing gaps: SAFETY_TIP_CATEGORIES in schema.gs synced with crimeSchema.ts (added Domestic Violence, Extortion, Burglary); Arson added to crimeTypeConfig.ts; Attempted Murder + Arson added to crimeColors.ts + generateCrimeTypeThumbnails.ts. Build passes. Plan doc: docs/guides/JAMAICA-INTEGRATION-PLAN.md.
- Jamaica integration plan: Jamaica (not Barbados) chosen for expansion (>1,500 murders/yr, 3M diaspora). Separate D1 DB + GAS project + sync worker per country. 3 confirmed RSS sources: Observer Crime Watch (https://www.jamaicaobserver.com/category/crime-watch/feed/ — includes parish tags), Gleaner (https://jamaica-gleaner.com/feed/news.xml), Star (http://jamaica-star.com/rss/news/feed). 14 parishes. Next: Phase 1 (GAS pipeline setup).

## Session Notes — Mar 17, 2026
- Dashboard Crime Statistics maintenance: InfoPopup now covers all 15 crime types (was 9). Added Attempted Murder + Carjacking stat cards; removed Seizures (law enforcement action, not a citizen-safety indicator). Card order: All Crimes → Murder → Attempted Murder → Shooting → Robbery → Carjacking → Home Invasion → Burglary → Theft → Assault → Kidnapping.
- Fixed brittle positional `statCards[n]` indexing in `dashboardUpdates.ts` (both `updateStatsCards` and `applyPrecomputedStats`). Now uses `document.querySelector('.stat-card[data-crime-type="..."]')`. Adding a new stat card only requires: new count vars in dashboardUpdates.ts + new StatCard in dashboard.astro + new entry in buildStats() in /api/dashboard.ts + new entry in pluralMap in statCardFiltering.ts.
- `DashboardStats` interface + `buildStats()` in `/api/dashboard.ts` updated to match (seizures removed, attemptedMurders + carjackings added).

## Session Notes — Mar 16, 2026 (continued)
- Classification rule v1.2: Flipped the Shooting vs Attempted Murder default. Old: "intent unclear → Shooting". New: "person directly targeted → Attempted Murder (primary) + Shooting (related)". Shooting reserved for: unintended bystanders (stray bullets) and no person targeted (shots at property, into air). Drive-bys targeting a group = Attempted Murder. Going forward only; existing records unchanged. Updated: claudeClient.gs, schema.gs, CRIME-CLASSIFICATION-RULES.md v1.2, HEADLINE-CLASSIFICATION-WORKFLOW.md v1.2, L013.

## Session Notes — Mar 16, 2026
- Statistics page: Attempted Murder showed 0 for 2026. Root cause: Google Sheet was reclassified (Shooting→Attempted Murder for ~16 rows) but D1 held pre-reclassification data from prior sync. Fixed by triggering manual sync: `curl -X POST https://crime-sync.discover360news.workers.dev/sync`.
- Fixed hardcoded year bug in `statisticsHelpers.ts`: `compareYearToDate()` was calling `filterToSamePeriod(crimes, 2025)` and `filterToSamePeriod(crimes, 2026)` with literals. Refactored to accept `currentYear: number, previousYear: number` parameters. `YoYComparison` interface: `count2026`/`count2025` → `countCurrent`/`countPrevious`. Updated all callsites in `statistics.astro`.
- Fixed D1 cron timing sequencing bug (B022): sync ran at 10am UTC — 4h AFTER the 6am site rebuild. Worst-case staleness ~44h. Changed `workers/crime-sync/wrangler.toml` cron: `0 10 * * *` → `0 5 * * *`. D1 now syncs at 5am, one hour before rebuild. CFG002 updated to document the dependency.

## Session Notes — Mar 15, 2026 (continued x2)
- Fixed HomepagePulse.astro: bare ternary `embedded ? (...) : (...)` in template was rendering as literal text on live site. Wrapped in `{...}`. Committed + pushed (35c8ab3).
- Upgraded tsconfig.json `base` → `strict`. Fixed all 78 TypeScript errors across 11 files: null safety (safetyContext, resultsEl, querySelector), implicit any (analytics.ts, event listener `this`, sort callbacks, compare.astro helpers), type mismatches (Crime interface storyId/oldSlug, StatCard direction, TRINIDAD_CSV_URLS number indexing), invalid void element (`<br>content</br>` in archive). `npm run check` = 0 errors. Build passes. CFG004 updated.

## Session Notes — Mar 15, 2026 (continued)
- Added `@astrojs/check` + `typescript` devDeps; `npm run check` script in package.json. Type-checks all .astro files.
- Downgraded tsconfig from `strict` → `base`. Fixed 150 of 154 type errors across ~30 files (4 left as intentional false positives or non-runtime issues).
- Added `astro:env` schema to astro.config.mjs — `BUTTONDOWN_API_KEY` (server secret) + `PUBLIC_SAFETY_TIPS_GAS_URL` (client public). Updated 3 files to import from `astro:env/server` and `astro:env/client`. Created `.env.example`.
- Updated CFG004 + DEP001 memory entries to reflect above. Build passes.

## Session Notes — Mar 15, 2026
- Phase 4 D1 migration complete. All crime-data pages now SSR + D1. csvBuildPlugin slimmed to area-aliases only. Build passes with zero CSV warnings. See D006 for full file list.

## Session Notes — Mar 14, 2026 (continued)
- Created HEADLINE-CLASSIFICATION-WORKFLOW.md in docs/guides/ — quick reference for manual headline classification (decision tree, disambiguation, T&T terminology, worked examples)
- Updated Attempted Murder rule: intentional weapon use against a person who survived = Attempted Murder (not Assault). Fists/feet only = Assault. Aligns with TT "wounding with intent" law. Updated CRIME-CLASSIFICATION-RULES.md v1.0→v1.1 and Assault §5 note.
- Corrected batch #2, #10, #11 above: those stabbings are now Attempted Murder under the new rule.
- Added .wrangler/ to both .gitignore files (was causing ~181 phantom changes in VS Code).

## Session Notes — Mar 14, 2026
- Statistics page: fixed misleading murder rate display. Raw YTD rate (e.g. 5.0/100k for 2.5 months) was shown as "current rate" — not comparable to annualized rates. Replaced with annualized rate throughout (stat tables, Quick Answer box, SEO description, FAQ schema, OG image). Collapsed Current Progress + Projected sections into one (they were mathematically identical — both = `count/daysElapsed*365`). Removed unused `murderRateCurrent`, `robberyRateCurrent`, `totalCrimeRateCurrent` vars. Build passes.

## Priority Queue (Mar 13, 2026)

1. Safety tips — active management (I am tip manager, 43 tips live)
2. Traffic growth / SEO Phase 2 — social distribution
3. Area filter enhancement — hierarchical filtering
4. Open Graph images for more pages (post traffic milestone)

## Session Notes — Mar 13, 2026
- Replaced Pagefind with D1 FTS5 search (D007). crimes_fts table live, 2,591 records indexed.
- /api/search endpoint live. SearchModal rewritten. Pagefind fully removed from codebase.
- sync worker redeployed. Committed 687b22b + pushed. Cloudflare Pages deploy triggered.
- One pending manual step: CDN cache purge for /api/dashboard/ if stale (from prior session).
- Crime schema overhaul: 3 new types (Carjacking sev 5, Domestic Violence sev 4 context, Extortion sev 3). isContextType flag added to all 15 types. Context types (Home Invasion, Domestic Violence) can no longer become primary crime in crimeTypeProcessor.gs. Assault+Robbery combination rule + context type ordering rule added to claudeClient.gs system prompt. Architecture fix: reportValidation.ts + report.astro dropdown now schema-driven. blogDataGenerator.gs BLOG_CRIME_TYPE_CONFIG synced (also fixed pre-existing Arson + Attempted Murder drift). Vehicle Theft removed from crimeColors.ts + generateCrimeTypeThumbnails.ts. Build passes. See L010 for full file list.

## Adding a New Crime Type — Mandatory Procedure

Follow these steps in order. Do not skip any.

**GAS side (schema.gs):**
1. Add entry to `CRIME_TYPES` (label, severity, isContextType, promptDescription)
2. If also a safety tip category, add to `SAFETY_TIP_CATEGORIES`
3. Run `validateSchemaSync()` in GAS editor → copy the output block

**Frontend side (astro-poc/):**
4. Update `src/config/crimeSchema.ts` CRIME_TYPES — paste from validateSchemaSync() output
5. Run `npm run check` — TypeScript will now **error on every file** that needs updating (crimeTypeConfig.ts, crimeColors.ts, leafletMap.ts, generateCrimeTypeThumbnails.ts are all exhaustiveness-checked)
6. Fix each error:
   - `crimeTypeConfig.ts` — add `'Label': { useVictimCount: true/false }`
   - `crimeColors.ts` — add tailwind + hex color entry
   - `leafletMap.ts` — add hex color entry
   - `generateCrimeTypeThumbnails.ts` — add label abbreviation + hex color
7. `statCardFiltering.ts` pluralMap — add plural form (fallback exists but add explicitly)
8. `docs/guides/CRIME-CLASSIFICATION-RULES.md` — document the new classification rule
9. Run `npm run build` — must pass before committing

**Do NOT add a stat card to dashboard.astro** unless T&T data actually contains the new type.

---

## Key External Docs

| Doc | When to use |
|-----|-------------|
| `docs/claude-context/site-features.md` | What pages/components/scripts/algorithms exist |
| `docs/guides/DESIGN-TOKENS.md` | Before any UI/styling change |
| `docs/guides/SAFETY-TIP-WORKFLOW.md` | Before creating or editing any safety tip |
| `docs/guides/RISK-SCORING-METHODOLOGY.md` | If touching TopRegionsCard or riskWeights.ts |
| `docs/claude-context/SEO-CONFIG.md` | SEO infrastructure, Layout slot rules, OG types |
| `google-apps-script/trinidad/README.md` | GAS automation overview |
