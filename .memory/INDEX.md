# .memory INDEX

> Read this first. One-liner per entry. Open the entry file for details.
> Session protocol: `.memory/SESSION.md` | Full feature list: `docs/claude-context/site-features.md`

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
B011 | BUG | active | astro-pagefind MUST be in integrations[] in astro.config.mjs — package.json not enough → B011-pagefind-integration.md
B012 | BUG | active | NEVER `await import()` inside Astro integration hooks — crashes Vite runner → B012-await-import-hooks.md
B013 | BUG | fixed | Raw Articles sheet column is "Publish Date" not "Published Date" — caused all crime dates to use run date → B013-gas-publish-date-column-mismatch.md

## Learnings & Patterns (L)
L001 | LEARN | active | astro:page-load is the ONLY correct pattern for interactive scripts on SPA → L001-astro-page-load-pattern.md
L002 | LEARN | active | DOM refs go stale after SPA nav — always query fresh inside astro:page-load → L002-spa-dom-reference-rule.md
L003 | LEARN | active | CSS accordion: height:0→auto transition requires interpolate-size:allow-keywords → L003-css-accordion-pattern.md
L004 | LEARN | active | Data passing: define:vars for window globals only; data-* attrs for per-page vars → L004-data-passing-patterns.md
L005 | LEARN | active | Muted UI: rose=hover/interaction only; ghost button, muted pill, muted dot patterns → L005-muted-ui-system.md
L006 | LEARN | active | Dark mode CSS: .dark is on <html> — use :global(.dark) inside scoped component styles → L006-dark-mode-css-scoping.md
L007 | LEARN | active | Risk scoring: self-calibrating weighted share of national total (not absolute count) → L007-risk-scoring-algorithm.md
L008 | LEARN | active | window.__crimesData: set on 5 pages; area pages use area-scoped crimes only → L008-crimes-data-flow.md
L009 | LEARN | active | Crime counting: primary+related types per row — NOT raw row count, NOT victim count → L009-crime-counting-methodology.md
L010 | LEARN | active | Schema centralization COMPLETE (all follow-ups resolved). crimeSchema.ts ↔ schema.gs fully in sync. crimeTypeConfig.ts has Attempted Murder. → L010-gas-schema-centralization.md
L011 | LEARN | candidate | Utility control pattern: filled bg button + sticky bar, separate from nav CTA ghost buttons. Dashboard confirmed Mar 10 2026, global rollout TBD → L011-utility-control-pattern.md

## Decisions (D)
D001 | DEC | active | Crime pages: full SSR + Cloudflare CDN 24h cache (migrated from hybrid prerender) → D001-crime-page-ssr.md
D002 | DEC | active | CSV URLs: single source of truth in csvUrls.ts — all other files import from it → D002-csv-single-source.md
D003 | DEC | active | Victim count: PRIMARY crime only; related always +1; Murder|Murder = 2 victims → D003-victim-count-rules.md
D004 | DEC | active | Slug migration: Story_ID+6words new format; legacy headline-date → 301 via SSR → D004-slug-migration.md
D005 | DEC | active | Migrated to Astro (Dec 2025) from Vite for SSR, content collections, scalability → D005-astro-migration.md

## Features (F)
F001 | FEAT | active | Security: escapeHtml, sanitizeUrl, CSP headers, Turnstile, Secure cookies → F001-security-system.md
F002 | FEAT | active | GAS pipeline: RSS → preFilter → Claude Haiku → Sheets → CSV → site → F002-gas-automation-pipeline.md
F003 | FEAT | active | Safety tips: 43 tips, category/context/area pages, submit form, voting → F003-safety-tips-system.md
F004 | FEAT | active | Weekly blog: Mon 10AM GAS → Claude Haiku → GitHub commit → Cloudflare deploy → F004-weekly-blog-automation.md
F005 | FEAT | active | Safety context: area crime score 1–10, 90-day window, 3 risk levels → F005-safety-context-system.md
F006 | FEAT | active | Slug redirects: SSR handles legacy→new; redirect-map.json is reference only → F006-slug-redirect-system.md
F007 | FEAT | active | Newsletter: Buttondown embed endpoint — Workers cannot reach API subdomain → F007-newsletter-support.md
F008 | FEAT | active | Trending hotspots: 7-day hot areas (server) + recent views via localStorage → F008-trending-hotspots.md
F009 | FEAT | active | Analytics: GA4 Consent Mode v2 — gtag denied by default, updates on accept/decline/return → F009-analytics-consent.md

## Components (C)
C001 | COMP | active | CrimeDetailModal: 261-line orchestrator + 5 modal*.ts modules in src/scripts/ → C001-crime-detail-modal.md
C002 | COMP | active | SearchModal: Pagefind + suggestions panel (recent searches, latest crimes, chips) → C002-search-modal.md
C003 | COMP | active | IslandSelectorModal: unified picker; backward-compat window.open*Modal() aliases → C003-island-selector-modal.md

## Config (CFG)
CFG001 | CFG | active | Project overview: Astro 5, Cloudflare Pages, GA4, GAS, Claude Haiku → CFG001-project-overview.md
CFG002 | CFG | active | Build & deploy: npm commands, GitHub Actions, daily 6AM UTC rebuild → CFG002-build-deploy.md
CFG003 | CFG | active | Cloudflare caching: crime pages CDN 24h + browser 1h; other pages static → CFG003-cloudflare-caching.md
CFG004 | CFG | active | astro.config.mjs: output:server, Cloudflare adapter, key integrations → CFG004-astro-config.md

## Dependencies (DEP)
DEP001 | DEP | active | Key deps: satori+sharp (OG images), astro-pagefind (search), @astrojs/rss → DEP001-key-dependencies.md
