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

**Keep INDEX.md under 60 lines** — merge or archive stale entries if needed.
Never duplicate content already in CLAUDE.md's hard rules.

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

## Key External Docs

| Doc | When to use |
|-----|-------------|
| `docs/claude-context/site-features.md` | What pages/components/scripts/algorithms exist |
| `docs/guides/DESIGN-TOKENS.md` | Before any UI/styling change |
| `docs/guides/SAFETY-TIP-WORKFLOW.md` | Before creating or editing any safety tip |
| `docs/guides/RISK-SCORING-METHODOLOGY.md` | If touching TopRegionsCard or riskWeights.ts |
| `docs/claude-context/SEO-CONFIG.md` | SEO infrastructure, Layout slot rules, OG types |
| `google-apps-script/trinidad/README.md` | GAS automation overview |
