# Jamaica Integration Plan

**Created:** 2026-03-17
**Status:** Phase 1 (GAS Pipeline) — in progress (triggers pending). Phase 1.5 fully complete with upgrades.
**Owner:** Kavell Forde

**Last updated:** 2026-03-17 — Phase 1.5 significantly upgraded: statistics + murder-count at full T&T parity (SSR + CDN cache), homepage Jamaica card replaced Coming Soon with D:HH:MM countdown to Jul 4 2026 + island image, RegionData CSV wired (113 areas, 13 area aliases built at every deploy). FB Submitter country selector added (T&T + Jamaica routing from one tool). 108-day launch plan documented below.

---

## Rationale

Jamaica is the priority expansion country over Barbados:
- ~1,500 murders/year (≈49/100k — one of the highest rates globally)
- Generates 40–60+ capturable incidents/week vs Barbados's 5–10
- ~3M diaspora (US/UK/Canada) driving search demand
- 14 parishes × community sub-pages = large organic SEO surface

Barbados remains shelved until Jamaica is stable and live.

---

## Architecture Decision — One Full Stack Per Country

Each country gets its own isolated pipeline. No shared databases or GAS projects.

```
Jamaica (new)
├── GAS Project        — new Google Sheet + Apps Script project
├── D1 Database        — new: wrangler d1 create jamaica-crimes
├── Sync Worker        — new: clone crime-sync, point to jamaica D1
└── Astro pages        — added to existing site: /jamaica/...

Trinidad (existing — unchanged)
├── GAS Project        ✅ live
├── D1 Database        ✅ live (ID: 23311480)
├── Sync Worker        ✅ live (crime-sync.discover360news.workers.dev)
└── Astro pages        ✅ live /trinidad/...
```

**Why separate D1 (not a `country` column on shared table):**
- Independent sync failures — Jamaica outage cannot affect T&T data
- No `WHERE country = 'JM'` on every query across ~2,100 pages
- Independent rate limits (5M reads/day per DB, not shared)
- Cleaner Astro worker bindings
- Can wipe/reset one country without risk

**Why separate GAS project:**
- GAS execution limits are per-project — two countries fight for quota
- B005: only one `doGet()` per project (Facebook Submitter needs its own)
- Independent triggers — Jamaica pipeline can't block T&T processing

Cloudflare free tier: up to 10 D1 databases — well within limits.

---

## Confirmed RSS Sources

| Priority | Source | Feed URL | Notes |
|---|---|---|---|
| 1 | Jamaica Observer Crime Watch | `https://www.jamaicaobserver.com/category/crime-watch/feed/` | **Crime-filtered feed** — includes parish tags per item. Best signal-to-noise ratio. |
| 2 | Jamaica Gleaner | `https://jamaica-gleaner.com/feed/news.xml` | General news, crime mixed in. Pre-filter will handle noise. |
| 3 | Jamaica Star | `http://jamaica-star.com/rss/news/feed` | Tabloid, heavy crime focus. |
| 4 | Jamaica Constabulary Force | `https://jcf.gov.jm/feed/` | **Police-confirmed press releases.** Updated hourly. Posts include confirmed murders, gang operations, police shootings, community alerts. Highest confidence of any source. Pre-filter essential — also posts recruitment, witness notices, commissioner statements. |

**Not recommended:**
- Loop Jamaica — shut down (2026)
- RJR News, TVJ, Nationwide — no RSS, JS-rendered

**Manual submission (Facebook Submitter):**
Build a Jamaica-specific Facebook Submitter web app for sources without RSS (same pattern as T&T Guardian). The Observer Crime Watch feed may reduce this need significantly. See Facebook Sources section below for pages to monitor.

---

## Official Government Crime Statistics Sites

Researched as potential automated data sources. Neither is suitable for the incident pipeline.

### Jamaica Constabulary Force — Stats Page (`jcf.gov.jm/stats-2/`)

**Status: Actively maintained. Updated bi-weekly. Not machine-readable.**

- Shows YTD Serious Crimes Report by police division (murders, shooting incidents, shooting injuries)
- Data presented as **JavaScript-rendered Highcharts** — raw HTML contains no data, no CSV/Excel download
- Confirmed: last page modification March 15, 2026 — JCF is keeping it current
- Parish-level breakdown exists (police divisions ≈ parishes, not always 1:1)
- **Cannot be automated** without headless browser scraping — fragile and likely against ToS

**What it's good for:** Manual reference for Statistics page YoY comparisons. Not for the incident pipeline.

### Statistical Institute of Jamaica / STATIN (`statinja.gov.jm`)

**Status: Annual historical data only. Not useful for pipeline.**

- Heavy ASP.NET application (ViewState-driven), complex tree navigation
- Has "Intentional Homicide" under Crime Statistics — but **annual aggregates only**, not monthly
- No direct download links found in the HTML
- Last data appears to be 2023/2024 vintage — not current enough for our purposes

**What it's good for:** Academic context, long-term trend verification. Not for the pipeline.

### Summary

| Source | Format | Frequency | Machine-readable? | Use |
|---|---|---|---|---|
| JCF Stats page | JS charts | Bi-weekly | No | Manual reference only |
| JCF RSS feed | RSS/XML | Hourly | **Yes** | Add as Source 4 above |
| STATIN | ASP.NET app | Annual | No | Historical context only |

---

## Facebook Sources — Manual Submission Candidates

No RSS available on any of these. All require the Facebook Submitter workflow. Grouped by type.

### Broadcast / Media Pages

These post crime incidents shortly after they break — often ahead of full written articles. High signal, high volume.

| Page | FB URL | Approx. Followers | Value |
|---|---|---|---|
| **Jamaica Observer** | `facebook.com/jamaicaobserver` | ~500K+ | Mirrors Crime Watch RSS but posts faster; comments often contain parish detail not in article |
| **TVJ (Television Jamaica)** | `facebook.com/televisionjamaica` | Large (national broadcaster) | Breaking crime clips + written summaries; covers all 14 parishes |
| **CVM Television** | `facebook.com/cvmtv` | Active — confirmed crime posts | Second TV broadcaster; covers incidents TVJ may miss |
| **Nationwide 90FM** | `facebook.com/nationwideradiojm` | ~150K likes | Jamaica's only Emmy news station; active crime reporting with specifics |
| **RJR News** | Search "RJR News" on FB | Active | Radio Jamaica's news arm; covers shootings/murders in detail |

**Notes on broadcast pages:**
- TVJ and CVM post video clips with text descriptions — the text description is what the Facebook Submitter would extract.
- Nationwide and RJR post text-only crime summaries — cleaner for extraction than video pages.
- Observer FB posts often include the parish name in the caption even when the article URL doesn't.

### Official / Government Pages

Lower raw volume but high accuracy — JCF press releases are police-confirmed.

| Page | FB URL | Approx. Followers | Value |
|---|---|---|---|
| **Jamaica Constabulary Force (JCF)** | `facebook.com/JamaicaConstabularyForce` | ~357K likes | Official police press releases: confirmed murders, gang operations, seizures. Posts wanted persons + missing persons too (not crime incidents — skip those). |
| **Crime Stop Jamaica** | `facebook.com/crimestopja` | ~8,600 likes | Community crime stoppers programme. Lower volume but incidents are police-vetted. |

**Notes on official pages:**
- JCF posts are high-confidence (police-confirmed) — expect confidence scores ≥ 8 from Claude.
- JCF also posts non-crime content (recruitment, traffic, community events) — pre-filter will handle noise.
- Crime Stop is small but every post is a real crime report.

### Advocacy / Community Pages

Informal monitoring only — not primary sources. Useful for incidents that don't reach mainstream media (domestic violence, femicide).

| Page | FB URL | Approx. Followers | Value |
|---|---|---|---|
| **Jamaica Women and Children Murdered R.I.P** | `facebook.com/p/Jamaica-Women-and-Children-Murdered-RIP-100068005351507/` | ~17K likes | Documents femicide and violence against women/children. Covers cases that traditional media under-reports. **Caution:** editorial framing — always cross-check details. |
| **Jamaicans for Justice (JFJ)** | `facebook.com/JamaicansForJustice` | Active | Human rights org. Documents police killings and state violence. Note: police killings = NOT capturable as murder in our schema (per `CRIME_TYPES.MURDER` rule: "Never for police killings"). Use only for context. |

### Priority Order for Facebook Submitter (Phase 1)

Start with the highest-volume, highest-accuracy pages. Add advocacy pages only once pipeline is stable.

1. JCF (`facebook.com/JamaicaConstabularyForce`) — police-confirmed, low noise
2. TVJ (`facebook.com/televisionjamaica`) — national reach, all parishes
3. CVM Television (`facebook.com/cvmtv`) — complements TVJ
4. Nationwide 90FM (`facebook.com/nationwideradiojm`) — text-heavy posts, easy extraction
5. RJR News — radio summaries, good parish specificity
6. Jamaica Women and Children Murdered R.I.P — domestic violence gap-fill (Phase 2+)

---

## Jamaica Geography — 14 Parishes

**Phase 1 launch:** Parish-level pages for all 14.
**Phase 2 (data-driven):** Sub-area pages for highest-volume parishes.

| Parish | Priority | Key Areas |
|---|---|---|
| St. Andrew | HIGH (23.3% of violent crime) | Constant Spring, Half Way Tree, Duhaney Park, Arnett Gardens |
| St. Catherine | HIGH (18.8%) | Spanish Town, Portmore, Gregory Park, Waterford |
| Kingston | HIGH (12.2%) | Downtown Kingston, Tivoli Gardens, Rema, Denham Town |
| St. James | HIGH (10.8%) | Montego Bay, Flankers, Norwood, Mount Salem |
| Clarendon | MEDIUM | May Pen, Lionel Town |
| Manchester | MEDIUM | Mandeville |
| Westmoreland | MEDIUM | Savanna-la-Mar (lottery scam capital) |
| St. Elizabeth | LOW | Black River |
| St. Ann | LOW | Ocho Rios, St. Ann's Bay |
| Trelawny | LOW | Falmouth |
| Portland | LOW | Port Antonio |
| St. Mary | LOW | Port Maria |
| St. Thomas | LOW | Morant Bay |
| Hanover | LOW | Lucea |

**Note on Kingston vs St. Andrew:** JCF treats Kingston and St. Andrew South as one policing area (Area 4). Consider whether to merge on site or keep separate. Keeping separate mirrors official parish boundaries and is simpler.

---

## Jamaica-Specific Crime Terminology

These appear in Jamaican news and need accurate classification:

| Term | Classification |
|---|---|
| Praedial Larceny | `Theft` — agricultural produce theft |
| Lottery Scam / Lotto Scam | `Fraud` ← **new crime type (see Phase 0)** |
| Reprisal Killing | `Murder` |
| Extortion (garrison communities) | `Extortion` |
| Drive-by / Motorcar Shooting | `Attempted Murder` + `Shooting` (standard rule applies) |
| "Gunman killed" / "don killed" | `Murder` |

---

## Phase 0 — Schema Update (T&T + Foundation for Jamaica)

**Do this before Jamaica GAS build. Jamaica must launch with the correct schema.**

### Tasks
- [ ] Add `Fraud` crime type to `schema.gs`
  - Severity: 3 (same band as Extortion/Burglary — financial harm, no physical violence)
  - `isContextType`: false
  - `promptDescription`: "Financial deception causing loss. Covers lottery scam, lotto scam, online fraud, identity theft. No force or immediate threat required — victim deceived into transferring money or access."
- [ ] Mirror `Fraud` to `astro-poc/src/config/crimeSchema.ts`
- [ ] Add `Fraud` to `SAFETY_TIP_CATEGORIES` in `schema.gs` (alongside existing `Online Scam` or replace — decide)
- [ ] Update `claudeClient.gs` classification rules block (auto-generates from schema — should be automatic)
- [ ] Add `Fraud` to `crimeTypeConfig.ts` (`useVictimCount: false` — financial crime)
- [ ] Add `Fraud` to `crimeColors.ts` and `leafletMap.ts`
- [ ] Add `Fraud` to `statCardFiltering.ts` pluralMap
- [ ] Run `npm run build` — must pass
- [ ] Test one article through pipeline to confirm Fraud classification works

**Note:** `Online Scam` already exists in `SAFETY_TIP_CATEGORIES`. Decision: keep both (`Online Scam` = context/method, `Fraud` = crime type) or merge. Recommend keeping both — they serve different purposes.

---

## Phase 1 — Jamaica GAS Pipeline (In Progress — triggers pending)

**Prerequisite:** Phase 0 complete.

### 1a. Setup ✅
- [x] Google Sheet "Crime Hotspots - Jamaica" created
- [x] Sheets created: Raw Articles, Processing Queue, Review Queue, Production, Production Archive, LIVE, Archive
- [x] Headers set (same structure as T&T)
- [x] LIVE sheet published as CSV — `LIVE_SHEET_ID = '1_05QcI1y4YuWyzGboncIRffyHoDan6a2_RJFrYqh2OA'`
- [x] Apps Script project created (Extensions → Apps Script in the sheet)

### 1b. Script Files ✅

All files created in `google-apps-script/jamaica/`:

| File | Status | Key Jamaica adaptations |
|---|---|---|
| `schema.gs` | ✅ | Shared schema (copied post Phase 0) |
| `config.gs` | ✅ | 4 RSS sources, `JAMAICA_BOUNDS`, `JAMAICA_CENTER`, `JAMAICA_PARISHES`, Claude Haiku |
| `rssCollector.gs` | ✅ | Pulls from 4 Jamaica `NEWS_SOURCES` |
| `articleFetcherImproved.gs` | ✅ | Country-agnostic — copied as-is |
| `claudeClient.gs` | ✅ | Jamaica context, `location_country: "Jamaica"`, parish area examples, prompt caching |
| `crimeTypeProcessor.gs` | ✅ | Country-agnostic — copied as-is |
| `preFilter.gs` | ✅ | Country-agnostic — copied as-is |
| `orchestrator.gs` | ✅ | Split triggers: `runRSSCollection`, `runTextFetchAndFilter`, `runAIProcessing`, `syncProductionToLive` |
| `syncToLive.gs` | ✅ | `LIVE_SHEET_ID` configured with real sheet ID |
| `validationHelpers.gs` | ✅ | Country-agnostic — copied as-is |

**config.gs — confirmed values:**
```javascript
// Bounding box
const JAMAICA_BOUNDS = {
  north: 18.53, south: 17.70,
  east: -76.18, west: -78.37
};

// Center point (Kingston)
const JAMAICA_CENTER = { lat: 17.9970, lng: -76.7936 };

// 14 parishes
const JAMAICA_PARISHES = [
  'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
  'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
  'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
];

// AI: Claude Haiku (same as T&T)
// RSS: 4 sources (Observer Crime Watch, Gleaner, Star, JCF feed)
```

### 1c. Test Checklist (pending — triggers needed first)
- [ ] RSS collection: all 4 feeds collecting articles
- [ ] Pre-filter: correctly rejecting non-crime articles
- [ ] Claude extraction: crime type, area, victims, confidence all populated
- [ ] `Fraud` correctly applied to lottery scam article
- [ ] Parish correctly extracted in `area` field
- [ ] `location_country` = "Jamaica" on all records
- [ ] Production sheet populating for confidence ≥ 7
- [ ] Review Queue populating for confidence < 7
- [ ] LIVE sheet syncing
- [ ] CSV URL accessible from browser

### 1d. Triggers (pending)

Planned split schedule (staggered +30min vs T&T per B022 lesson):
- `runRSSCollection` — 10:00, 18:00, 02:00 UTC
- `runTextFetchAndFilter` — 11:00, 19:00, 03:00 UTC
- `runAIProcessing` — 12:00, 20:00, 04:00 UTC
- `syncProductionToLive` — 04:00 UTC daily (before D1 sync)

**D1 cron dependency (B022):** Jamaica D1 sync must run at 5:30am UTC (T&T at 5am — staggered 30min). Site rebuild at 6am UTC. Sequencing: sync → D1 → rebuild.

---

## Phase 2 — Jamaica D1 Database + Sync Worker

**Prerequisite:** Phase 1 complete and collecting data for at least 48 hours.

### 2a. D1 Database
- [ ] `wrangler d1 create jamaica-crimes` — note the DB ID
- [ ] Apply schema: same DDL as T&T (crimes table + crimes_fts FTS5 table)
- [ ] Update `wrangler.toml` in a new `workers/jamaica-crime-sync/` directory

### 2b. Sync Worker
- [ ] Create `workers/jamaica-crime-sync/` — clone from `workers/crime-sync/`
- [ ] Update: CSV URL points to Jamaica LIVE sheet
- [ ] Update: D1 binding points to `jamaica-crimes` DB
- [ ] Update: cron trigger `0 5 30 * * *` → `30 5 * * *` (5:30am UTC)
- [ ] Deploy: `wrangler deploy --config workers/jamaica-crime-sync/wrangler.toml`
- [ ] Test: `curl -X POST https://jamaica-crime-sync.discover360news.workers.dev/sync`
- [ ] Verify: D1 rows present in Cloudflare dashboard

### 2c. wrangler.toml additions
Add `jamaica-crimes` binding to `astro-poc/wrangler.toml` so Astro can query it.

---

## Phase 1.5 — Frontend Shell ✅ COMPLETE (2026-03-17)

**Done before D1 to allow MP pages and static content to go live immediately.**

### Config (all complete)
- [x] `src/config/routes.ts` — `jamaica` block (7 routes) + `buildRoute.jamaicaMp` + `buildRoute.jamaicaParish`
- [x] `src/config/csvUrls.ts` — `JAMAICA_CSV_URL` added (LIVE sheet)
- [x] `src/data/mps-jamaica.json` — 63 MPs, JLP 35 / PNP 28, `parishSlugs` schema

### Pages (all prerendered, all building)
- [x] `/jamaica/mp/` — 63 MPs grouped by 14 parishes; JLP=green, PNP=orange badges
- [x] `/jamaica/mp/[slug]/` — 63 individual profile pages (placeholder.svg photo, crime stats deferred)
- [x] `/jamaica/parishes/` — 14 parishes with constituency count + capital
- [x] `/jamaica/dashboard/` — empty-state shell (prerender)
- [x] `/jamaica/headlines/` — empty-state shell (SSR)
- [x] `/jamaica/statistics/` — **full production page** (SSR + CDN cache, T&T parity — `const allCrimes: Crime[] = []` with TODO stub)
- [x] `/jamaica/murder-count/` — **full production page** (SSR + CDN cache, T&T parity — TODO stub)
- [x] `/jamaica/archive/` — empty-state shell (prerender)

### Homepage + Sitemap
- [x] Homepage — Jamaica card: `jamaica-card-trsp-bg.png` island image, D:HH:MM countdown to Jul 4 2026, amber "JUL 2026" badge, "Launching soon" fallback. Guyana/Barbados cards restructured to match layout.
- [x] `sitemap-0.xml.ts` — 7 Jamaica static pages + 63 MP pages (priority 0.7, changefreq yearly)

### Area Aliases (new)
- [x] `src/config/csvUrls.ts` — `JAMAICA_REGION_DATA_CSV_URL` added (RegionData sheet, gid=910363151)
- [x] `src/integrations/csvBuildPlugin.ts` — generates `area-aliases-jamaica.json` at every build
- [x] `src/data/area-aliases-jamaica.json` — 13 aliases (Downtown Kingston→"Downtown, Town", Montego Bay→"MoBay, MBJ", etc.)
- [x] `src/data/health-data.json` — `jamaica_area_aliases_count` field added

### What's wired to D1 (pending Phase 2 + 3)
Statistics + murder-count: `const allCrimes: Crime[] = []` with `// TODO: wire to Jamaica D1`.
All other data pages: `const allCrimes: never[] = []` with TODO comment.
All pages render gracefully with empty state — no errors, no crashes.

---

## Phase 3 — Astro D1 Integration

**Prerequisite:** Phase 2 complete. D1 has ≥ 100 rows (enough to test pages).

### 3a. Country Config (partial — remaining items only)
- [ ] Add Jamaica to `src/data/countries.ts` (if it exists; otherwise skip — routes.ts is the source of truth)
- [ ] Add Jamaica D1 binding to `astro-poc/wrangler.toml` (new `[[d1_databases]]` entry)
- [ ] Create `jamaica-area-aliases.json` build plugin (or extend existing csvBuildPlugin)

### 3b. Wire Data Pages to D1

Replace `const allCrimes: never[] = []` in each shell page with real data fetches:

| Page | File | Data source |
|---|---|---|
| Dashboard | `jamaica/dashboard.astro` | `getAllCrimesFromD1(db, 'JM')` |
| Headlines | `jamaica/headlines.astro` | `getAllCrimesFromD1(db, 'JM')` |
| Statistics | `jamaica/statistics.astro` | `getAllCrimesFromD1(db, 'JM')` |
| Murder count | `jamaica/murder-count.astro` | `getAllCrimesFromD1(db, 'JM')` |
| Archive | `jamaica/archive/index.astro` | `getAllCrimesFromD1(db, 'JM')` |

### 3c. New Pages (deferred — need D1 data)
- [ ] `/jamaica/parish/[slug]/` — individual parish detail page (like T&T region pages)
- [ ] `/jamaica/crime/[slug]/` — individual crime detail pages
- [ ] `/jamaica/area/[slug]/` — community-level area pages
- [ ] `/jamaica/compare/` — multi-parish comparison

### 3d. Map
- [ ] Leaflet map config for Jamaica (bounding box: N18.53 S17.70 E-76.18 W-78.37, centre: 17.997, -76.794)
- [ ] Parish boundary data (GeoJSON or simplified polygons)
- [ ] Crime pin colours: reuse existing `crimeColors.ts` — no changes needed

### 3e. MP profiles — wire crime stats
- [ ] Update `jamaica/mp/[slug].astro` to query D1 for parish-level crime stats (remove placeholder note)
- [ ] Use `parishSlugs[0]` for area filter (equivalent of T&T `regionSlugs`)

### 3f. Build + Deploy
- [ ] `npm run build` — must pass
- [ ] `npm run check` — 0 TypeScript errors
- [ ] Deploy to Cloudflare Pages
- [ ] Verify dashboard, headlines, statistics all load with real data
- [ ] Verify `/jamaica/mp/[slug]/` shows live crime stats for each constituency

---

## Cost Impact

| Item | Current (T&T) | Added (Jamaica) | Total |
|---|---|---|---|
| Claude Haiku | ~$2.70/month | ~$2.70/month | ~$5.40/month |
| Cloudflare D1 | Free | Free (new DB, shared limits) | Free |
| Cloudflare Workers | Free | Free (new worker, within 100k req/day) | Free |
| Cloudflare Pages | Free | Free (same deployment) | Free |
| Google Apps Script | Free | Free (new project, own quota) | Free |
| **Total added cost** | — | **~$2.70/month** | — |

---

## Data Sanity Check — Fields We're Not Capturing (Deferred)

These are known gaps. Not blocking Jamaica launch. Revisit after Jamaica is stable.

| Field | Why useful | Effort |
|---|---|---|
| Time of day | Peak hour analysis, "nighttime crime" patterns | Medium |
| Victim gender | Gender-disaggregated stats | Medium |
| Weapon type detail | Beyond firearm/non-firearm (knife, cutlass) | Low |
| Motive indicator | Gang vs domestic vs opportunistic | Hard (often not in article) |

---

## 108-Day Launch Plan (Target: July 4, 2026)

Full detail in `.memory/entries/F013-jamaica-launch-prep.md`. Summary below.

### Phase A — Pipeline (Weeks 1–3) | Owner: Kavell + Claude
| Task | Status |
|------|--------|
| A1. Activate GAS triggers in Jamaica GAS editor | PENDING |
| A2. Run test validation batch (10+ rows) | PENDING |
| A3. Fix pipeline quality issues (area normalisation) | PENDING |
| A4. FB Submitter country selector | **DONE** — `facebookSubmitter.gs` updated |

### Phase B — Database (Weeks 2–4) | Blocked by A1+A2
| Task | Status |
|------|--------|
| B1. `wrangler d1 create jamaica-crimes` | DEFERRED |
| B2. Jamaica DB schema (same as T&T) | DEFERRED |
| B3. Update sync worker (`workers/crime-sync/`) | DEFERRED |
| B4. Update `wrangler.toml` — `JM_DB` binding | DEFERRED |
| B5. Test first sync — row counts, date formats, FTS | DEFERRED |

### Phase C — Live Data Pages (Weeks 3–6) | Blocked by B
| Task | Status |
|------|--------|
| C1. Wire statistics + murder-count to `JM_DB` | DEFERRED (TODO stubs ready) |
| C2. New Jamaica API endpoints (`/api/jamaica/dashboard/`, etc.) | DEFERRED |
| C3. Headlines page — wire DateAccordion + CrimeCard | DEFERRED |
| C4. Crime detail pages `/jamaica/crime/[slug]` | DEFERRED |
| C5. Archive pages `/jamaica/archive/[year]/[month]` | DEFERRED |
| C6. Extend `/api/search/` to query `JM_DB` | DEFERRED |

### Phase D — Content & Polish (Weeks 4–10)
| Task | Owner | Status |
|------|-------|--------|
| D1. MP photos | Kavell | IN PROGRESS (`public/images/mps/jamaica/`) |
| D2. Parish detail pages `/jamaica/parish/[slug]` | Claude | DEFERRED |
| D3. Area detail pages `/jamaica/area/[slug]` | Claude | DEFERRED |
| D4. Jamaica-specific safety tips | Mixed | DEFERRED |
| D5. Homepage Explore tiles | Claude | DEFERRED |

### Phase E — SEO & Infrastructure (Weeks 6–12)
- Google Search Console sitemap submission
- Internal linking update (FAQ, About, Methodology)
- OG images for Jamaica murder-count
- Structured data audit

### Phase F — Launch Day (July 4, 2026)
- Flip Jamaica card: remove `opacity-90 cursor-not-allowed`, swap to live `<a>` link
- Add Jamaica to `countries.ts` with `available: true`
- Animated "LIVE" badge (same as T&T)
- Social announcement

---

## Progress Tracker

```
Phase 0 — Schema (Fraud crime type)          [x] COMPLETE (2026-03-17)
Phase 0b — Drift prevention                  [x] COMPLETE (2026-03-17)
  crimeTypeConfig.ts — exhaustive Record<>   [x]
  crimeColors.ts — exhaustive Record<>       [x]
  leafletMap.ts — exhaustive Record<>        [x]
  generateCrimeTypeThumbnails.ts — Record<>  [x]
  schema.gs — validateSchemaSync() added     [x]
  SESSION.md — new crime type procedure      [x]
  npm run check + build — PASS               [x]
  schema.gs — Fraud added to CRIME_TYPES     [x]
  schema.gs — SAFETY_TIP_CATEGORIES synced   [x]
  crimeSchema.ts — Fraud mirrored            [x]
  crimeTypeConfig.ts — Fraud + Arson added   [x]
  crimeColors.ts — Fraud + AM + Arson added  [x]
  leafletMap.ts — Fraud color added          [x]
  generateCrimeTypeThumbnails.ts — updated   [x]
  statCardFiltering.ts — Fraud in pluralMap  [x]
  npm run build — PASSES                     [x]

Phase 0c — Pre-Phase 1 Research              [x] COMPLETE (2026-03-17)
  SAFETY_TIP_CATEGORIES audit — clean        [x]  (14 entries, Online Scam used in 3 tips)
  Facebook sources researched + documented   [x]  (6 pages, tiered by priority)
  Official govt stats sites assessed         [x]  (JCF stats: JS charts, not scrapeable)
  JCF RSS feed discovered + added as Src 4  [x]  (https://jcf.gov.jm/feed/ — live, hourly)
  STATIN assessed — annual only, skip        [x]

Phase 1.5 — Frontend Shell                   [x] COMPLETE (2026-03-17) + UPGRADED
  routes.ts — jamaica block + buildRoutes    [x]
  csvUrls.ts — JAMAICA_CSV_URL added         [x]
  csvUrls.ts — JAMAICA_REGION_DATA_CSV_URL   [x]  (RegionData sheet, gid=910363151)
  csvBuildPlugin.ts — area-aliases-jamaica   [x]  (generates at every build, 13 aliases)
  mps-jamaica.json — 63 MPs (JLP35/PNP28)   [x]
  /jamaica/mp/ — MP listing by parish        [x]  (63 MPs, 14 parishes, JLP/PNP badges)
  /jamaica/mp/[slug]/ — 63 profile pages     [x]  (contact info, photo placeholder)
  /jamaica/parishes/ — 14 parishes           [x]  (constituency count + capital)
  /jamaica/dashboard/ — empty-state shell    [x]
  /jamaica/headlines/ — empty-state shell    [x]
  /jamaica/statistics/ — full production     [x]  (SSR + CDN cache, Crime[] stub, T&T parity)
  /jamaica/murder-count/ — full production   [x]  (SSR + CDN cache, Crime[] stub, T&T parity)
  /jamaica/archive/ — empty-state shell      [x]
  Homepage — Jamaica countdown card          [x]  (island image, D:HH:MM, Jul 4 2026 target)
  sitemap-0.xml.ts — 7 static + 63 MP pages [x]
  FB Submitter — country selector (T&T/JM)   [x]  (facebookSubmitter.gs, one tool two countries)
  npm run build — PASSES                     [x]

Phase 1 — Jamaica GAS Pipeline               [ ] IN PROGRESS
  1a. Google Sheet + LIVE sheet configured   [x]  (LIVE_SHEET_ID real value set)
  1b. Script files — all 9 files created     [x]  (google-apps-script/jamaica/)
  1c. Testing                                [ ]  (pending triggers)
  1d. Triggers live                          [ ]  (deferred — frontend shell prioritised first)

Phase 2 — D1 + Sync Worker                   [ ] Blocked on Phase 1
  2a. D1 database created                    [ ]
  2b. Sync worker deployed                   [ ]
  2c. Astro binding added to wrangler.toml   [ ]

Phase 3 — Astro D1 Integration               [ ] Partially done (shell exists)
  3a. D1 binding + wrangler config           [ ]
  3b. Wire data pages to D1                  [ ]  (5 shell pages have TODO comments)
  3c. Parish/crime/area detail pages         [ ]  (deferred — need real data)
  3d. Map (Leaflet, Jamaica bounds)          [ ]
  3e. MP profiles — wire crime stats         [ ]
  3f. Build + deploy                         [ ]

🏁 Jamaica LIVE                              [ ]
```

---

## Key Reference Files

| File | Purpose |
|---|---|
| `google-apps-script/trinidad/schema.gs` | Crime schema — source of truth |
| `google-apps-script/trinidad/claudeClient.gs` | Extraction prompt — adapt for Jamaica |
| `google-apps-script/trinidad/config.gs` | Pipeline config — adapt for Jamaica |
| `workers/crime-sync/` | Sync worker — clone for Jamaica |
| `astro-poc/src/config/csvUrls.ts` | CSV URLs — add Jamaica |
| `astro-poc/src/data/countries.ts` | Country config — add Jamaica |
| `.memory/entries/B022-d1-cron-timing-sequencing.md` | Cron timing gotcha — D1 must sync before rebuild |
| `.memory/entries/F002-gas-automation-pipeline.md` | GAS pipeline reference |
| `.memory/entries/D006-d1-migration-plan.md` | D1 schema reference |

---

*Last updated: 2026-03-17 (Phase 1.5 upgraded: statistics/murder-count at T&T parity, countdown card, area aliases, FB Submitter country selector. Phase 1 triggers still pending. 108-day launch plan added.)*
