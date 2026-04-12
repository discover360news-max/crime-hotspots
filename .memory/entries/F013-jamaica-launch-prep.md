# F013 — Jamaica Launch Preparation

**Status:** In Progress — Phase D underway (parish/area pages live, tips content pending)
**Target date:** July 4, 2026 (108 days from Mar 17, 2026)

---

## Launch Sequence (critical path, in order)

| Step | Owner | Status | Notes |
|------|-------|--------|-------|
| 1. FB Submitter country toggle | Claude | **DONE** | Year toggle hidden for JA, Country toggle (T&T/JA), country-aware filter + routing, `appendToJamaicaProduction()`. Set `JAMAICA_PIPELINE_SHEET_ID` manually. |
| 2. RegionData CSV + area aliases | **DONE** | — | `JAMAICA_REGION_DATA_CSV_URL` wired, 113 areas, 13 aliases baked to `area-aliases-jamaica.json` |
| 3. Activate GAS pipeline triggers | Kavell | **DONE** | 9 triggers live (RSS@14/22/6, Fetch@15/23/7, Claude@16/0/8 UTC). First run at 14:00 UTC Mar 17. |
| 4. Jamaica D1 + sync worker | Claude | **DONE** | DB: crime-hotspots-jamaica-db (78bcc398). Schema applied. 30 rows synced. Daily cron live. |
| 5. Uncomment TODO in statistics + murder-count | Claude | **DONE** | Both pages wired to JM_DB. noindex flipped false. Live Apr 5 2026. |
| 6. Wire headlines + dashboard to Jamaica D1 | Claude | **DONE** | C2–C4 complete Apr 5 2026 |
| 7. MP photos upload | Kavell | **DONE** | Photos uploaded to `public/images/mps/jamaica/` |
| 8. Homepage card → live link | Claude | **DEFERRED** | Remove opacity/disabled, swap badge to "LIVE", move card above Guyana/Barbados |

---

## 108-Day Plan by Phase

### Phase A — Pipeline (Weeks 1–3) | Owner: Kavell + Claude
**Goal:** Confirmed rows flowing into Jamaica Live sheet from automated sources.

| Task | Notes |
|------|-------|
| A1. Activate GAS triggers | **DONE** — 9 triggers live. RSS@14/22/6, Fetch@15/23/7, Claude@16/0/8 UTC. First run 14:00 UTC Mar 17. |
| A2. Run test validation batch | IN PROGRESS — monitor Production sheet over 2–3 days. Check area names, crime types, dates. |
| A3. Fix pipeline quality issues | PENDING — assess after A2. Area normalisation + pre-filter threshold tweaks if needed. |
| A4. FB Submitter country selector | **DONE** — `facebookSubmitter.gs` updated. Fill `JAMAICA_PIPELINE_SHEET_ID` then redeploy. |

### Phase B — Database (Weeks 2–4) | Owner: Claude | Blocked by A1+A2
**Goal:** Jamaica D1 database live, syncing nightly, data accessible server-side.

| Task | Notes |
|------|-------|
| B1. Create Jamaica D1 database | New DB in Cloudflare dashboard; separate from T&T DB (ID: 23311480) |
| B2. Jamaica DB schema | Same schema as T&T (`crimes` table + `crimes_fts` FTS5 virtual table) |
| B3. Update sync worker | Add Jamaica sync route to `workers/crime-sync/` — fetches `JAMAICA_CSV_URL`, upserts to Jamaica D1, repopulates FTS |
| B4. Update `wrangler.toml` | New D1 binding (`JM_DB`), keep cron at 05:00 UTC (before 06:00 rebuild) |
| B5. Test first sync | Validate row counts, date formats (must be YYYY-MM-DD — see B018), FTS indexing |

### Phase C — Live Data Pages (Weeks 3–6) | Owner: Claude | Blocked by B
**Goal:** Statistics, murder-count, headlines, and crime detail pages showing real Jamaica data.

| Task | Notes |
|------|-------|
| C1. Statistics + murder-count | **DONE** Apr 5 2026 — wired to JM_DB, noindex removed |
| C2. New Jamaica API endpoints + dashboard | **DONE** Apr 5 2026 — `/api/jamaica/crimes/` + `/api/jamaica/dashboard/`; dashboard upgraded from stub to full SSR (vitals, crime breakdown, top parishes, quick insights) |
| C3. Headlines page | **DONE** Apr 5 2026 — full SSR headlines: type chips, date accordions, filter tray, load more, sidebar murder count card. `headlinesPage.ts` now reads `window.__hlData.crimePath` (backwards-compatible). |
| C4. Crime detail pages | **DONE** Apr 5 2026 — `/jamaica/crime/[slug]` SSR+CDN. Jamaica aliases from baked JSON. `RelatedCrimes` now accepts `crimePath` prop (default `/trinidad/crime/`). `TrendingHotspots` omitted (T&T-hardcoded routes — Phase D revisit). |
| C5. Archive pages | **DONE** Apr 5 2026 — `/jamaica/archive/` (SSR index) + `/jamaica/archive/[year]/[month]` (SSR month page). `buildRoute.jamaicaCrime` + `buildRoute.jamaicaArchive` added to routes.ts. Beta banners on both pages. |
| C6. Search update | **DONE** Apr 5 2026 — `/api/search/` queries JM_DB crimes_fts (parallel, 5/country) + region LIKE for parishes. Jamaica crimes labelled "Crime incident · Jamaica". Parish badge type added. |

### Phase D — Content & Polish (Weeks 4–10) | Owner: Mixed
**Goal:** Parish pages, area pages, safety tips, MP photos — all at T&T parity.

| Task | Owner | Notes |
|------|-------|-------|
| D1. MP photos | Kavell | **DONE** Apr 8 2026 — Photos uploaded to `public/images/mps/jamaica/` |
| D2. Parishes detail pages | Claude | **DONE** Apr 8 2026 — `/jamaica/parish/[slug]` SSR+CDN. `loadFullJamaicaAreaData()` resolves slug via `Parish` CSV column. Area ranking, crime breakdown, headlines accordion, MPSidebar (`mpBasePath="/jamaica/mp/"`, JLP/PNP colours). Beta banner. Parishes listing wired up (cards now link). |
| D3. Area detail pages | Claude | **DONE** Apr 8 2026 — `/jamaica/area/[slug]` SSR+CDN. AreaNarrative, SafetyContext, FeedbackToggle, related areas (same parish + cross-parish). No compare CTA. Breadcrumb → parish page. `buildRoute.jamaicaArea` added to routes.ts. |
| D4. Jamaica-specific safety tips | Kavell + Claude | **ENGINE DONE.** `tipsJamaica` collection, 6 pages live. 10 tips in content. Kavell supplies stories → Claude creates `JM-TIP-XXXXX` files. Content batch ready — begin next session. |
| D5. Homepage Explore tiles | Claude | Add Jamaica equivalent tiles once data is live (2nd row or dynamic country switch) |

### Phase E — SEO & Infrastructure (Weeks 6–12)
**Goal:** Google indexing Jamaica pages, analytics confirming traffic.

| Task | Notes |
|------|-------|
| E1. Google Search Console | Submit sitemap (already includes all 7 Jamaica static pages + 63 MP pages) |
| E2. Internal linking | Update FAQ, About, Methodology pages to mention Jamaica coverage |
| E3. Structured data audit | Verify all Jamaica pages pass Google Rich Results Test before launch |
| E4. OG images | Jamaica murder-count OG image (same satori+sharp pattern as T&T) |
| E5. Blog automation | Separate Jamaica GAS `weeklyBlogAutomation.gs` (low priority — post-launch is fine) |

### Phase F — Launch Day (July 4, 2026)
**Goal:** Jamaica goes live — card becomes a real link, data is visible.

| Task | Notes |
|------|-------|
| F1. Flip Jamaica card | Remove `opacity-90 cursor-not-allowed`; make it an `<a>` link to `/jamaica/dashboard/`; swap "JUL 2026" badge → animated "LIVE" badge (same as T&T) |
| F2. BottomNav | Add Jamaica to `countries.ts` with `available: true` |
| F3. Homepage Pulse | Add `HomepagePulse` variant for Jamaica below the card (or combined) |
| F4. Social announcement | Coordinated post across all channels with dashboard screenshot |
| F5. Monitor D1 | Watch sync logs + D1 row counts for first 48h; check FTS indexing |

---

## Pages Status

| Page | Status | Blocked by |
|------|--------|-----------|
| `/jamaica/dashboard/` | **Live** — full SSR dashboard | — |
| `/jamaica/headlines/` | **Live** — full SSR headlines | — |
| `/jamaica/crime/[slug]` | **Live** — SSR+CDN crime detail | — |
| `/jamaica/statistics/` | **Live** — full SSR + JM_DB | — |
| `/jamaica/murder-count/` | **Live** — full SSR + JM_DB | — |
| `/jamaica/parishes/` | **Live** — links to parish detail pages | — |
| `/jamaica/archive/` | **Live** — SSR index, JM_DB | — |
| `/jamaica/archive/[year]/[month]` | **Live** — SSR month page, JM_DB | — |
| `/jamaica/area/[slug]` | **Live** — SSR+CDN area detail | — |
| `/jamaica/parish/[slug]` | **Live** — SSR+CDN parish detail | — |
| `/jamaica/mp/` | **Live** — 63 MPs | — |
| `/jamaica/mp/[nameSlug]` | **Live** — 63 profiles + photos | — |

---

## Area Data

- **URL:** `JAMAICA_REGION_DATA_CSV_URL` in `src/config/csvUrls.ts`
- **Sheet:** Jamaica spreadsheet → RegionData tab (gid=910363151)
- **Columns:** Area, Parish, Division, known_as, population
- **Coverage:** 113 areas across 14 parishes; JCF Areas 1–4 as Division column
- **known_as aliases (13):** Downtown Kingston→"Downtown, Town", Cross Roads→"Crossroads", Whitfield Town→"Whitfield", Arnett Gardens→"Jungle", Olympic Gardens→"Olympic", Trenchtown→"Trench", Tivoli Gardens→"Tivoli, Zoo", Spanish Town→"Spanish", Portmore→"PM", Independence City→"Indy City", Savanna-la-Mar→"Sav, Sav-la-Mar", Montego Bay→"MoBay, MBJ", Ocho Rios→"Ochi"
- **Build output:** `src/data/area-aliases-jamaica.json` (baked at each build)

---

## FB Submitter Country Selector Plan

**File:** `google-apps-script/trinidad/facebookSubmitter.gs`

**Changes needed:**
1. **UI toggle** — T&T / Jamaica radio buttons at top of form
2. **Location filter** (lines 93–103) — country-aware: reject T&T locations when Jamaica selected
3. **Sheet routing** — add `appendToJamaicaProduction()` targeting Jamaica Live sheet
4. **Claude extraction context** — pass selected country so Claude uses correct area names

**B005 note:** One `doGet()` per GAS project — no concern, modifying existing form only.

---

## Jamaica-Specific Constants

| Constant | Value |
|----------|-------|
| Population | 2,800,000 |
| Country term | "parishes" (not "divisions") |
| Geo coordinates | 18.1096, -77.2975 |
| RSS sources | Observer Crime Watch, Gleaner, Star, JCF RSS (jcf.gov.jm/feed/) |
| D1 binding name (planned) | `JM_DB` |
| Countdown target | 2026-07-04T00:00:00 local |

---

## Change Log

| Date | Change |
|------|--------|
| Mar 17, 2026 | Jamaica frontend shell complete (Phase 1.5). All 7 pages live. |
| Mar 17, 2026 | Jamaica statistics + murder-count upgraded from stubs to full production pages (T&T parity). |
| Mar 17, 2026 | RegionData CSV published. `JAMAICA_REGION_DATA_CSV_URL` wired. Build plugin generates `area-aliases-jamaica.json`. |
| Mar 17, 2026 | GAS Pipeline Phase 1 in progress (scripts built, triggers deferred). |
| Mar 17, 2026 | Homepage Jamaica card: `jamaica-card-trsp-bg.png` added, D:HH:MM countdown to Jul 4 2026, amber badge. Guyana/Barbados cards restructured to match. |
| Mar 17, 2026 | FB Submitter country selector built in `facebookSubmitter.gs`. T&T/Jamaica toggle, year section hidden for JA, `appendToJamaicaProduction()` added. `JAMAICA_PIPELINE_SHEET_ID` placeholder needs manual fill + redeploy. |
| Mar 17, 2026 | JAMAICA-INTEGRATION-PLAN.md updated with Phase 1.5 enhancements and 108-day launch plan. |
| Mar 18, 2026 | murder-count.astro aligned with statistics.astro projection terminology: `daysPassed`→`daysElapsed`, `projectedAnnualMurders`→`murderProjected`, `projectedMurderRate`→`murderRateProjected`. Card label "Projected Rate"→"Annualized Rate". Sub-text now shows `{murderCount} murders in {daysElapsed} days`. Footer note added explaining annualization methodology. |
| Mar 19, 2026 | Date accuracy overhaul (B023) applied to Jamaica pipeline: `rssCollector.gs` pubDate 3-step fallback; `processor.gs` publishDateMissing flag + null crime_date → Review Queue routing; `claudeClient.gs` dayOfWeek timezone fix + "a day after" cross-reference rule + ONGOING CRIMES rule block. Parity with Trinidad pipeline. |
| Apr 5, 2026 | Phase B + C1 complete. Jamaica D1 live (30 rows). crime-sync worker updated with JM_DB + POST /sync/jamaica. statistics + murder-count wired to live D1 data. noindex removed. |
| Apr 5, 2026 | Beta banners (amber, server-side, auto-expire Jul 4 2026) added to statistics, murder-count, dashboard, and headlines. |
| Apr 5, 2026 | Phase C2 complete. `/api/jamaica/crimes/` + `/api/jamaica/dashboard/` endpoints live. `/jamaica/dashboard/` upgraded from stub to full SSR dashboard (vitals, crime breakdown, top parishes, quick insights, newsletter). |
| Apr 5, 2026 | Phase C3 complete. `/jamaica/headlines/` full SSR: type chips, date accordions, filter tray (parish/area/type/date), load more, sidebar murder count card. `headlinesPage.ts` now reads `window.__hlData.crimePath` (backwards-compatible default: `/trinidad/crime/`). |
| Apr 5, 2026 | Phase C4 complete. `/jamaica/crime/[slug]` SSR+CDN crime detail pages. Jamaica aliases from baked JSON. `RelatedCrimes.astro` has new optional `crimePath` prop. `TrendingHotspots` omitted (hardcoded T&T routes — add in Phase D). |
| Apr 5, 2026 | Phase C5 complete. `/jamaica/archive/` (SSR index) + `/jamaica/archive/[year]/[month]` (SSR month page). `buildRoute.jamaicaCrime(slug)` and `buildRoute.jamaicaArchive(year, month?)` added to routes.ts. Beta banners on both pages. |
| Apr 5, 2026 | Phase D4 engine complete. `tipsJamaica` collection, 6 safety tips pages, JamaicaTipCard/CompactTipCard components, routes, safetyTipsHelpersJamaica.ts, workflow + index docs. Crime detail page wired. Tip content pending. |
| Apr 5, 2026 | Phase C6 complete. `/api/search/` extended: JM_DB crimes_fts + region LIKE queries run in parallel with T&T. Jamaica crimes get `meta: 'Crime incident · Jamaica'`. Parish results use new `type: 'parish'` (green badge, "Parish" label). SearchModal placeholder + footer updated to mention parishes. |
| Apr 8, 2026 | Local D1 debug: fixed `availableYears[0] ?? new Date().getFullYear()` in dashboard.astro + headlines.astro — empty local D1 was setting `__dashboardDefaultYear = "undefined"` causing client to fetch `?year=undefined` → 400. |
| Apr 8, 2026 | `scripts/seed-local-d1.js` added + `npm run seed:local/tt/jm` scripts. Pulls remote D1 rows in 500-row batches → INSERT OR IGNORE SQL → local D1. Re-run after `.wrangler/state/` wipe. |
| Apr 8, 2026 | Phase D1 complete. MP photos uploaded (`public/images/mps/jamaica/`). |
| Apr 8, 2026 | Phase D2 complete. `/jamaica/parish/[slug]` SSR+CDN. `loadFullJamaicaAreaData()` added to areaAliases.ts (fetches Jamaica CSV, maps `Parish` column → `region`). `buildRoute.jamaicaArea` added to routes.ts. MPSidebar gets `mpBasePath` prop + JLP/PNP party badge colours. Parishes listing wired to parish detail pages. |
| Apr 8, 2026 | Phase D3 complete. `/jamaica/area/[slug]` SSR+CDN. `AreaNarrative.compareUrl` made optional (omitted for Jamaica — no compare page). Breadcrumb → parish page. Related areas: same-parish + cross-parish. |
