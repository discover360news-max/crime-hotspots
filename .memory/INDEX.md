# .memory INDEX

> Read this first. One-liner per entry. Open the entry file for details.
> Session protocol: `.memory/SESSION.md` | Full feature list: `docs/claude-context/site-features.md`

## User & Workflow
user-claude-throttle-windows | USER | active | Claude peak hours + Kavell's timezone windows (UK until Apr 10, then Tobago) — re-fetch source URL periodically → user-claude-throttle-windows.md

## Bugs & Gotchas (B)
B001 | BUG | active | Astro `{expr}` in `<script>` NOT evaluated — use set:html → B001-astro-script-expression.md
B002 | BUG | active | `is:inline` does NOT re-run on SPA nav — always use astro:page-load → B002-isinline-spa-rerun.md
B003 | BUG | active | Cloudflare Workers can't load native binaries at module level → B003-workers-native-binaries.md
B004 | BUG | active | GAS timezone mismatch — never use getValues() for dates → B004-gas-timezone-mismatch.md
B005 | BUG | active | GAS: only ONE doGet() per project — last alphabetically wins → B005-gas-doget-collision.md
B006 | BUG | active | GAS deployments version-pinned — saving code ≠ updating live URL → B006-gas-deployment-versioning.md
B007 | BUG | active | filterCrimesByDateRange() normalises to noon — use setHours(0/23) at boundaries → B007-gas-date-boundary.md
B008 | BUG | active | GAS CSV columns: always try 3 name variants (camelCase, Title Case, short) → B008-gas-csv-column-fallbacks.md
B009 | BUG | active | Tailwind v4 HSL opacity: use `hsl(0 0% 8% / 0.7)` not `hsl(...)/70` → B009-tailwind-hsl-opacity.md
B010 | BUG | active | Blog automation: column mismatch + noon boundary caused wrong murder count → B010-blog-automation-bugs.md
B011 | BUG | archived | astro-pagefind removed (Mar 13 2026) — search now uses D1 FTS5 via /api/search → B011-pagefind-integration.md
B012 | BUG | active | NEVER `await import()` inside Astro integration hooks — crashes Vite runner → B012-await-import-hooks.md
B013 | BUG | fixed | Raw Articles sheet column is "Publish Date" not "Published Date" — caused all crime dates to use run date → B013-gas-publish-date-column-mismatch.md
B014 | BUG | archived | Pagefind ranking issues → fully resolved by removing Pagefind (Mar 13 2026). Search now uses D1 FTS5 (see D007) → B014-pagefind-crime-indexer.md
B015 | BUG | active | Astro trailingSlash:'always' — ALL internal hrefs AND fetch calls MUST use trailing slash or homepage HTML is served silently → B015-astro-trailing-slash-api-fetch.md
B016 | BUG | active | SSR handlers: wrap ENTIRE body in try/catch, not just DB queries — uncaught throws return 200 HTML from Astro error handler → B016-ssr-handler-try-catch.md
B017 | BUG | fixed | Local D1 works: `npm run build && npx wrangler dev` (Workers v13 runs workerd locally) → B017-local-d1-empty.md
B018 | BUG | fixed | D1 date column stored as MM/DD/YYYY (raw CSV) — range queries with YYYY-MM-DD always returned 0 rows → trend indicators hidden. Fix: normalize in sync worker + re-sync → B018-d1-date-format-mismatch.md
B019 | BUG | fixed | Quick Insights "Highest Crime Area" could show 'Unknown' — calculateInsights() + updateQuickInsights() used areaArray[0] instead of validAreas[0]. Fix: both server (dashboardHelpers.ts) + client (dashboardUpdates.ts) now use validAreas[0] → B019-quick-insights-unknown-area.md
B020 | BUG | fixed | updateQuickInsights() used new Date(c.date) string parse (UTC midnight) for Peak Day/Busiest Month — shifts day for Trinidad (UTC-4). Fix: use c.dateObj when available → B019-quick-insights-unknown-area.md
B021 | BUG | fixed | Astro template bare ternary `expr ? (...) : (...)` renders as literal text — MUST wrap in `{}`. Hit HomepagePulse (Mar 15 2026) → B021-astro-template-bare-ternary.md
B022 | BUG | fixed | D1 sync ran at 10am UTC — AFTER 6am site rebuild → stale data all day. Fix: moved cron to 5am. D1 MUST sync before rebuild. See B022-d1-cron-timing-sequencing.md
B023 | BUG | fixed | Crime dates stored as run date: 3 compounding bugs — empty RSS pubDate, Claude returning null crime_date for ongoing crimes, dayOfWeek using getDay() (UTC not TZ). + missing "a day after" prompt rule. → B023-gas-date-accuracy-multi-root.md
B024 | BUG | fixed | Blog frontmatter `date` used `blogData.weekEnd` (lagDays=3 offset) instead of `new Date()` — Monday publish showed Friday's date. Fix: `publishDateStr = formatBlogDateStr(new Date())` in buildFinalBlogMarkdown(). Filename still uses weekEnd. → weeklyBlogAutomation.gs
B025 | BUG | fixed | SSR dashboard path fetched only `/api/crimes/` — `.trend-indicator` (always `hidden` in SSR HTML) never populated on first load. Fix: also fetch `/api/dashboard/` in parallel + call `applyPrecomputedStats()`. See dashboardDataLoader.ts SSR path. → recent-changes.md Mar 24
B026 | BUG | fixed | `/api/dashboard` trend queries always used `now-3/33/63d` regardless of year param — historical year (e.g. 2025) showed live 2026 rolling-window arrows next to 2025 totals. Fix: skip trend queries for non-current years; return zero trends → indicators hidden. → api/dashboard.ts
B027 | BUG | active | 301 on slug-not-found SSR pages gets browser-cached permanently — transient `loadFullAreaData()` failure poisons all visits forever. Use 302 for region/area/archive. crime/[slug] 301s are fine (intentional permanent migrations). → B027-301-redirect-browser-cache.md
B028 | BUG | active | `flex-1` without `min-w-0` overflows narrow containers — flex children default to `min-width:auto` and won't shrink below intrinsic width. Fixed in NewsletterSignup card variant (content div + email input). Always add `min-w-0` alongside `flex-1` when container width is constrained. → B028-flex-min-w-0-overflow.md
B029 | BUG | fixed | `escapeHtml()` in Astro `{expr}` causes double-encoding — Astro auto-escapes text nodes, so `{escapeHtml(x)}` renders `&#39;` literally. Use `{x}` directly; `escapeHtml()` only for `set:html`/`innerHTML`. → B029-escaphtml-double-encoding-astro.md
B030 | BUG | active | zsh glob expansion breaks `git add` on bracket filenames (`[slug].astro`) even when quoted. Fix: prefix with `noglob` → B030-zsh-noglob-bracket-filenames.md
B031 | BUG | active | Bulk Astro import injection via script: MUST scope to frontmatter only (between `---` fences). dashboard.astro import landed in `<script>` block → blank page, no build error → B031-astro-frontmatter-import-injection.md
B032 | BUG | active | Story_ID shifts (dedup + formula→static) left ~1k indexed URLs 404ing. Fix: id-redirect-overrides.json checked in [slug].astro. redirect-map.json is reference only — never edit manually. → B032-id-redirect-overrides.md

## Learnings & Patterns (L)
L001 | LEARN | archived | ~~astro:page-load~~ — SPA removed Mar 15 2026. Use DOMContentLoaded. Do NOT re-introduce ClientRouter → L001-astro-page-load-pattern.md
L002 | LEARN | archived | ~~SPA stale DOM refs~~ — not an issue without SPA → L002-spa-dom-reference-rule.md
L003 | LEARN | active | CSS accordion: height:0→auto transition requires interpolate-size:allow-keywords → L003-css-accordion-pattern.md
L004 | LEARN | active | Data passing: define:vars for window globals only; data-* attrs for per-page vars → L004-data-passing-patterns.md
L005 | LEARN | active | Muted UI: rose=hover/interaction only; ghost button, muted pill, muted dot patterns → L005-muted-ui-system.md
L006 | LEARN | active | Dark mode CSS: .dark is on <html> — use :global(.dark) inside scoped component styles → L006-dark-mode-css-scoping.md
L007 | LEARN | active | Risk scoring: self-calibrating weighted share of national total (not absolute count) → L007-risk-scoring-algorithm.md
L008 | LEARN | active | window.__crimesData: set on 5 pages; area pages use area-scoped crimes only → L008-crimes-data-flow.md
L009 | LEARN | active | Crime counting: primary+related types per row — NOT raw row count, NOT victim count → L009-crime-counting-methodology.md
L010 | LEARN | active | Schema centralization COMPLETE (all follow-ups resolved). crimeSchema.ts ↔ schema.gs fully in sync. crimeTypeConfig.ts has Attempted Murder. → L010-gas-schema-centralization.md
L011 | LEARN | active | Utility control pattern: filled bg button + sticky bar, separate from nav CTA ghost buttons. Confirmed on dashboard + compare page (Mar 10 2026) → L011-utility-control-pattern.md
L012 | LEARN | active | Dashboard script extraction (Mar 10 2026): 869→554 lines. MapLegend.astro + dashboardMapInit.ts + dashboardLocationFilter.ts. Extraction signal: >50-line named-function script → move to src/scripts/ → L012-dashboard-script-extraction.md
L013 | LEARN | active | Crime classification rules: 2 hard rules (Carjacking→Robbery, HomeInvasion→Burglary), Shooting vs AttemptedMurder intent standard, Robbery≠Theft, Gun Present≠Shooting (armed robbery at gunpoint = Robbery only, not Shooting). Encoded in schema.gs + crimeTypeProcessor.gs + claudePrompts.gs (both TT+JM). Doc: docs/guides/CRIME-CLASSIFICATION-RULES.md → L013-crime-classification-rules.md
L014 | LEARN | active | CSS var token system: `--ch-*` vars in Layout.astro control all dark mode colours. Use `var(--ch-*)` in Tailwind, never raw HSL. One edit = site-wide change. → L014-css-var-token-system.md
L015 | LEARN | active | SEO on-page patterns: H1 must be single element with full keyword phrase, FAQPage JSON-LD targets People Also Ask, dateModified on Dataset = freshness signal, yearless queries are content gap not optimisation problem → L015-seo-on-page-patterns.md
L016 | LEARN | active | Dark section texture overlay: `mix-blend-screen` makes image bg transparent, CSS `mask-image` radial gradient clears centre for text contrast. HeroBg.astro = 13 hero pages. Footer inline in Layout.astro (dark mode only) → L016-hero-texture-overlay-pattern.md
L017 | LEARN | active | Date filtering: ALL rolling windows use `datePublished ?? dateObj`. YoY stays on dateObj. API serializes datePublished as ISO string; client reconstructs it. → L017-date-filtering-pattern.md

## Decisions (D)
D001 | DEC | active | Crime pages: full SSR + Cloudflare CDN 24h cache (migrated from hybrid prerender) → D001-crime-page-ssr.md
D002 | DEC | active | CSV URLs: single source of truth in csvUrls.ts — all other files import from it → D002-csv-single-source.md
D003 | DEC | active | Victim count: PRIMARY crime only; related always +1; Murder|Murder = 2 victims → D003-victim-count-rules.md
D004 | DEC | active | Slug migration: Story_ID+6words new format; legacy headline-date → 301 via SSR → D004-slug-migration.md
D005 | DEC | active | Migrated to Astro (Dec 2025) from Vite for SSR, content collections, scalability → D005-astro-migration.md
D006 | DEC | active | CSV → D1 migration. ALL PHASES COMPLETE (incl. dashboard + compare, Mar 24 2026). Dashboard + Compare now SSR+CDN. Shimmer skipped on SSR initial load (window.__dashboardSSR). Only mp/[slug].astro still uses CSV (pre-rendered, intentional). → D006-d1-migration-plan.md
D007 | DEC | active | Search: replaced Pagefind with D1 FTS5. crimes_fts virtual table (FTS5). /api/search endpoint (crimes via FTS5, MPs via mps.json, areas via D1 LIKE). Sync worker clears+repopulates FTS on every sync. → D007-search-d1-fts.md

## Backlog (IDEA)
IDEA001 | IDEA | tabled | Criminal behavioural patterns page: public editorial (~1500w, 8 documented patterns from tips corpus) + internal content strategy doc. Value confirmed. Constraint: frame as "documented patterns" not stats. Tabled Mar 22 2026 — revisit when tips batch work slows.

## Features (F)
F016 | FEAT | complete | SocialProofStrip: all 38 pages done. 3 variants (hero/sidebar/strip). Data: src/data/social-proof.json (update weekly). Live D1 incident count. Tracker: docs/guides/SOCIAL-PROOF-STRIP-IMPLEMENTATION.md → F016-social-proof-strip.md
F017 | FEAT | active | Contextual Ko-fi CTAs + goal tracker: CTA box on TT murder-count (after MonthlyBreakdownChart) + TT statistics (after StatCards). Goal tracker on support page (bar, goal shown, count hidden). All numbers from social-proof.json (kofi_supporters, kofi_goal). Jamaica pending F013. → F017-kofi-cta-goal-tracker.md
F010 | FEAT | active | MP profiles (T&T): 41 pages /trinidad/mp/[slug]/, index /trinidad/mp/, mps.json, region page card, placeholder.svg. Socials render as brand SVG icons. → F010-mp-profiles.md
F012 | FEAT | active | MP profiles (Jamaica): 63 pages /jamaica/mp/[slug]/, index /jamaica/mp/, mps-jamaica.json. Same card layout as T&T. Photo min-h-[500px]. TikTok in socials. Photos in public/images/mps/jamaica/. Crime stats placeholder until D1 pipeline live. → site-features.md
F014 | WORKFLOW | active | MP data update workflow: contact info, photos, parliament profiles, bulk updates, gotchas → docs/guides/MP-UPDATE-WORKFLOW.md
F013 | FEAT | in-progress | Jamaica launch prep: statistics + murder-count at T&T parity, RegionData CSV wired (113 areas, area-aliases-jamaica.json), FB submitter country selector pending, D1 deferred. Launch sequence in entry. → F013-jamaica-launch-prep.md
F015 | FEAT | active | Help Centre: /help/ index + 14 pre-rendered articles (6 sections), nav + footer links, sitemap (priority 0.7/0.6). SESSION.md staleness checker maps features → articles. → site-features.md
F011 | FEAT | active | Data Capability Sheet: /data-capability-sheet/ — B2B institutional one-pager, PDF-printable, content in capabilitySheetConfig.ts. CSV/PDF formats are on-engagement only, not self-serve → F011-data-capability-sheet.md
F001 | FEAT | active | Security: escapeHtml, sanitizeUrl, CSP headers, Turnstile, Secure cookies → F001-security-system.md
F002 | FEAT | active | GAS pipeline: RSS → preFilter → Claude Haiku → Sheets → CSV → site → F002-gas-automation-pipeline.md
F003 | FEAT | active | Safety tips: 75 tips (last: TIP-00085, Mar 24 2026), category/context/area pages, submit form, voting. Categories: Robbery, Carjacking, Home Invasion, ATM Crime, Online Scam, Kidnapping, Sexual Violence, Fraud, Assault, Domestic Violence, Extortion, Shooting, Burglary, Other. Contexts include At a Bar (added Mar 17 2026) → F003-safety-tips-system.md
F004 | FEAT | active | Weekly blog: Mon 10AM GAS → Claude Haiku → GitHub commit → Cloudflare deploy → F004-weekly-blog-automation.md
F005 | FEAT | active | Safety context: area crime score 1–10, 90-day window, 3 risk levels → F005-safety-context-system.md
F006 | FEAT | active | Slug redirects: SSR handles legacy→new; redirect-map.json is reference only → F006-slug-redirect-system.md
F007 | FEAT | active | Newsletter: Buttondown embed endpoint — Workers cannot reach API subdomain → F007-newsletter-support.md
F008 | FEAT | active | Trending hotspots: 7-day hot areas (server) + recent views via localStorage → F008-trending-hotspots.md
F009 | FEAT | active | Analytics: GA4 Consent Mode v2 — gtag denied by default, updates on accept/decline/return → F009-analytics-consent.md

## Components (C)
C001 | COMP | active | CrimeDetailModal: 261-line orchestrator + 5 modal*.ts modules in src/scripts/ → C001-crime-detail-modal.md
C002 | COMP | active | SearchModal: D1 FTS5 via /api/search (crimes+MPs+areas) + suggestions panel (recent searches, latest crimes, chips) → C002-search-modal.md
C003 | COMP | active | IslandSelectorModal: unified picker; backward-compat window.open*Modal() aliases → C003-island-selector-modal.md
C004 | COMP | active | MPSidebar: area pages (showAll=false: 2+chevron) + region pages (showAll=true: all on desktop, mobile toggle). Share + MPs + Ko-fi. Global width standard: max-w-5xl across header/footer/hero → C004-mpsidebar-design-rules.md

## Config (CFG)
CFG001 | CFG | active | Project overview: Astro 6, Cloudflare Workers, GA4, GAS, Claude Haiku → CFG001-project-overview.md
CFG002 | CFG | active | Build & deploy: `wrangler deploy`, wrangler dev for local D1, GitHub Actions, daily 6AM UTC → CFG002-build-deploy.md
CFG003 | CFG | active | Cloudflare caching: ALL crime-data pages SSR + CDN ~23h. D1 free tier: 5M rows read/day; safe to ~15k visits/day → CFG003-cloudflare-caching.md
CFG004 | CFG | active | astro.config.mjs: output:server, Cloudflare adapter, key integrations → CFG004-astro-config.md

## Social Media (SM)
SM001 | WORKFLOW | active | Weekly social posts: 5 formats (F1 pure text, F2 neighbourhood warning, F3 leaderboard, F4 question hook, F5 Gemini scene). Rotate formats week-to-week, track in Tracking Log. Canva for F1–F4, Gemini for F5 → docs/guides/SOCIAL-IMAGE-WORKFLOW.md

## Tools (T)
T001 | TOOL | archived | dedup-2025: one-time GAS script to de-duplicate Raw Articles sheet entries. `google-apps-script/tools/dedup-2025/dedup.gs` + `index.html`. Ran Mar 2026; kept for reference if de-dup needed again.

## Dependencies (DEP)
DEP001 | DEP | active | Key deps: astro 6, @astrojs/cloudflare v13, @cloudflare/workers-types, satori+sharp (OG images), papaparse (needs nodejs_compat) → DEP001-key-dependencies.md
