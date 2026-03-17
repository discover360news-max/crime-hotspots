# F013 — Jamaica Launch Preparation

**Status:** In Progress — Foundation complete, pipeline pending
**Target date:** July 4, 2026 (108 days from Mar 17, 2026)

---

## Launch Sequence (critical path, in order)

| Step | Owner | Status | Notes |
|------|-------|--------|-------|
| 1. FB Submitter country toggle | Claude | **DONE** | Year toggle hidden for JA, Country toggle (T&T/JA), country-aware filter + routing, `appendToJamaicaProduction()`. Set `JAMAICA_PIPELINE_SHEET_ID` manually. |
| 2. RegionData CSV + area aliases | **DONE** | — | `JAMAICA_REGION_DATA_CSV_URL` wired, 113 areas, 13 aliases baked to `area-aliases-jamaica.json` |
| 3. Activate GAS pipeline triggers | Kavell | **DONE** | 9 triggers live (RSS@14/22/6, Fetch@15/23/7, Claude@16/0/8 UTC). First run at 14:00 UTC Mar 17. |
| 4. Jamaica D1 + sync worker | Claude | **DEFERRED** | Do NOT set up until pipeline produces confirmed rows |
| 5. Uncomment TODO in statistics + murder-count | Claude | **DEFERRED** | One-liner per page — unblocked by step 4 |
| 6. Wire headlines + dashboard to Jamaica D1 | Claude | **DEFERRED** | New API endpoints (see Phase C below) |
| 7. MP photos upload | Kavell | **IN PROGRESS** | `public/images/mps/jamaica/` — 63 MPs |
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
| C1. Statistics + murder-count | Remove `const allCrimes: Crime[] = []` stub; wire to Jamaica D1 via `getAllCrimesFromD1(JM_DB)` or equivalent |
| C2. New Jamaica API endpoints | `/api/jamaica/dashboard/` + `/api/jamaica/crimes/` — mirrors T&T pattern but uses `JM_DB` binding |
| C3. Headlines page | Wire `DateAccordion` + `CrimeCard` to Jamaica crimes; add year filter |
| C4. Crime detail pages | `/jamaica/crime/[slug]` — same SSR+CDN pattern as `/trinidad/crime/[slug]` |
| C5. Archive pages | `/jamaica/archive/[year]/[month]` — pre-rendered, queries `JM_DB` at build |
| C6. Search update | Extend `/api/search/` to also query Jamaica `crimes_fts` + `JM_DB` area LIKE |

### Phase D — Content & Polish (Weeks 4–10) | Owner: Mixed
**Goal:** Parish pages, area pages, safety tips, MP photos — all at T&T parity.

| Task | Owner | Notes |
|------|-------|-------|
| D1. MP photos | Kavell | Upload to `public/images/mps/jamaica/filename.jpg`; set `photo: "jamaica/filename.jpg"` in mps-jamaica.json |
| D2. Parishes detail pages | Claude | `/jamaica/parish/[slug]` — T&T region page equivalent; MPs card uses `parishSlugs` |
| D3. Area detail pages | Claude | `/jamaica/area/[slug]` — risk score, crime breakdown, safety context |
| D4. Jamaica-specific safety tips | Kavell + Claude | Add tips tagged to Kingston, MoBay contexts; existing tips mostly applicable |
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
| `/jamaica/` — Dashboard | Shell stub | Phase C2 |
| `/jamaica/headlines/` | Shell stub | Phase C3 |
| `/jamaica/parishes/` | Shell stub | Phase D2 |
| `/jamaica/statistics/` | Full production (TODO stub) | Phase C1 |
| `/jamaica/murder-count/` | Full production (TODO stub) | Phase C1 |
| `/jamaica/archive/` | Shell stub | Phase C5 |
| `/jamaica/crime/[slug]` | Not built | Phase C4 |
| `/jamaica/area/[slug]` | Not built | Phase D3 |
| `/jamaica/parish/[slug]` | Not built | Phase D2 |
| `/jamaica/mp/` | **Live** — 63 MPs | — |
| `/jamaica/mp/[nameSlug]` | **Live** — 63 profiles | Photos pending (D1) |

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
