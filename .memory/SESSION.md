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

## Session Notes — Mar 25, 2026
- **Astro 5→6 + Cloudflare Pages→Workers migration COMPLETE.** astro `^6.0.8`, `@astrojs/cloudflare` `^13.1.3`, `@cloudflare/workers-types` `^4.20260317.1`, `@astrojs/sitemap` `^3.7.1`. Content Layer API: `src/content.config.ts`, `entry.id` (not `.slug`), `render(entry)` (not `entry.render()`). Runtime: `import { env } from 'cloudflare:workers'; env.DB` across 21 files. `wrangler.toml`: `[assets]` block, `nodejs_compat` (papaparse/stream), routes for `crimehotspots.com/*`. GitHub Actions: Node 22, `npx wrangler deploy`. `BUTTONDOWN_API_KEY` = Workers secret. `PUBLIC_SAFETY_TIPS_GAS_URL` = GitHub Actions repo variable (build-time). Pages decommissioned. B017 fixed. Local dev: `npm run build && npx wrangler dev` (port 8787, real D1).
- **SocialProofStrip rollout COMPLETE** — All 38 pages (F016 complete). Hero/sidebar/strip variants. `src/data/social-proof.json` updated weekly.
- **JNews hierarchy rollout COMPLETE** — Dark hero + 4-card GradientStatCard vitals across: dashboard, statistics, murders, murder-count, crime/[slug], area/[slug], region/[slug], areas, headlines, homepage (SSR). Hero.astro + Breadcrumbs.astro retired from all pages.
- **Mar 26 2026:** Homepage T&T section — "This Week's Hotspots" widget (top 3 areas, "X crimes · Y murders", anchored bottom with `mt-auto`). Fixed `escapeHtml()` double-encoding on index.astro homepage (B029 recurrence). Added `HeroBg.astro` texture overlay component to 13 dark-hero pages + footer-bg in Layout.astro (dark mode only). B031: bulk import injection bug — dashboard.astro import landed in `<script>` block, fixed manually.
- **Mar 26 2026 (security sweep):** Full audit — patched 3 XSS gaps (SearchModal latest-crimes, compare.astro area/region/type, dashboardUpdates.ts regions); removed `detail:msg` info leak from `/api/search` 500; added HSTS header to `_headers`; `npm audit fix` (3 HIGH + 1 MODERATE resolved). 5 moderate CVEs remain in `@astrojs/language-server` chain — dev-only, accepted risk. See F001.
- **Next:** —

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
