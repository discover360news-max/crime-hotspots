# Recent Changes (Rolling 30 Days)

**Purpose:** What changed recently, so I don't re-do work or miss context. Slim entries only.

**Older entries:** Archived to `docs/archive/features/`

---

## April 2026

### Safety tips: TIP-00113 + 6 story attachments (Apr 3, 2026)

- **NEW TIP TIP-00113** — Verifying Job Offers to Avoid Trafficking Lures (Sexual Violence / Other) — Story 752
- **ATTACHED** Story 751 → TIP-00108 (pensioner befriended at bank, lured into vehicle, same helper-lure-after-withdrawal M.O.)
- **ATTACHED** Stories 754, 755 → TIP-00034 (Sherman Lambkin, Valencia — door kicked in at 2:30-2:45 AM, pre-dawn forced entry; two articles, same incident)
- **ATTACHED** Story 756 → TIP-00021 (victim lured to buy item, instructed to follow seller to remote location, ambushed — marketplace lure-and-redirect M.O.)
- **ATTACHED** Story 757 → TIP-00071 (student robbed at knifepoint in track off Shade Lane, Malabar, 7:42 PM — isolated residential lane after dark)

---

### Safety tips: TIP-00108 to TIP-00112 + 5 story attachments + 1 index correction (Apr 3, 2026)

- **NEW TIP TIP-00108** — Avoiding Helper-Lure Ambushes After Bank Withdrawals (ATM Crime / In Your Car) — Story 734
- **NEW TIP TIP-00109** — Recognising Erratic Behaviour as an Attack Setup (Assault / In Your Car) — Story 736
- **NEW TIP TIP-00110** — Securing Your Belongings When Leaving Your Seat at a Bar (Robbery / At a Bar) — Story 739
- **NEW TIP TIP-00111** — Protecting Yourself During Roadside Vehicle Sales (Robbery / In Your Car) — Story 742
- **NEW TIP TIP-00112** — Reporting Robbery by a Person in Authority (Robbery / Other) — Story 743
- **ATTACHED** Story 735 → TIP-00064 (bump-from-behind bracelet snatch, Frederick Street)
- **ATTACHED** Story 737 → TIP-00101 (5 men posing as taxi passengers, vehicle taken)
- **ATTACHED** Story 738 → TIP-00071 (two bandits on Persad Lane, El Socorro)
- **ATTACHED** Story 740 → TIP-00037 (driver spotted approaching men and drove off, dashcam)
- **ATTACHED** Story 741 → TIP-00027 (two armed men, daytime forced entry, Balkissoon Trace)
- **INDEX CORRECTION**: Story 738 was incorrectly attached to TIP-00026 (Shooting / At an Event) — removed from TIP-00026, moved to TIP-00071 (Robbery / Walking Alone) where it belongs.

---

### LCP fixes: HeroBg + crime-type thumbnails (Apr 2, 2026)

- **HeroBg.astro**: `loading="eager"` → `loading="lazy"` + `fetchpriority="low"`. Decorative texture overlay (15% opacity, aria-hidden) was being selected as LCP candidate on all 13 hero pages (4–5s). Now excluded from LCP consideration entirely.
- **Crime-type thumbnails**: All 17 images in `public/images/crime-types/` resized from 1408×768 to 800×440 via one-off sharp script (deleted post-run). Directory dropped from ~9.7MB → 1.1MB. `attempted-murder.webp`: 276K → 23K. Expected LCP improvement on all `/trinidad/crime/[slug]/` pages.

---

### Safety tips: TIP-00103 to TIP-00107 + 3 story attachments (Apr 1, 2026)

- **NEW TIP TIP-00103** — Reinforcing Structural Weak Points Against Forced Entry (Home Invasion / At Home) — Story 718
- **NEW TIP TIP-00104** — Protecting Yourself During an Armed Robbery at a Bar (Robbery / At a Bar) — Story 720
- **NEW TIP TIP-00105** — Protecting Utility Infrastructure on Your Property (Burglary / At Home) — Story 721
- **NEW TIP TIP-00106** — Reducing Exposure to Vehicle-Based Attacks When Walking at Night (Assault / Walking Alone) — Story 722
- **NEW TIP TIP-00107** — Staying Safe When an Ex-Partner Becomes Threatening in Public (Kidnapping / At a Bar) — Story 724
- **ATTACHED** Story 719 → TIP-00064 (drive-by chain snatch at doubles stand)
- **ATTACHED** Story 723 → TIP-00084 (armed proprietor holdup at mini mart)
- **ATTACHED** Story 725 → TIP-00077 (28-day absence burglary, St. James)

---

### SEO audit + 404 fix: 998 broken URLs resolved (Apr 1, 2026)

GSC export (last 3 months) revealed 2,916 pages with 404 errors suppressing core keyword rankings. Root cause: Story_IDs changed twice — once during dedup (T001, Mar 2026) and once when Story_ID formula was made static — causing Google to hold old ID-format URLs (e.g. `1612-diego-martin...`) that no longer existed in D1.

**Fix:** `src/data/id-redirect-overrides.json` (998 entries). Keyed by old slug (no slashes), values are full paths. Build-safe — `redirectGenerator.ts` does not touch this file. Checked in `[slug].astro` after `oldSlug` D1 lookup, before fuzzy match.

- 941 entries: old ID-format slug → correct current slug (301)
- 57 entries: fully deleted stories → `/trinidad/` (301)
- `area/[slug].astro`: unknown area slugs now 302 to `/trinidad/areas/` (was `/404/`)

**Redirect system reminder:** `redirect-map.json` is reference only — regenerated at build time by `redirectGenerator.ts` from the CSV. Never edit it manually. Runtime redirects use D1 `old_slug` column + `id-redirect-overrides.json` + fuzzy match. See B032.

**GSC action required:** Pages → Not indexed → Not found (404) → Validate Fix. Allow 1–2 weeks for Google to re-crawl.

**Remaining keyword work identified (not yet done):**
- Murder-count page: 4,832 impressions at position 6.2 — title/H1 optimisation needed
- Statistics page: 4,619 impressions at position 7.2 — same
- Core brand keywords ("trinidad and tobago crime rate", "crime hotspot") ranking 30–65 — structural on-page work needed

---

## March 2026

### Safety tips: TIP-00100 to TIP-00102 (Mar 31, 2026)

- **NEW TIP TIP-00100** — Avoiding Armed Robbery at Late-Night ATMs (ATM Crime / At the ATM) — Story 707
- **NEW TIP TIP-00101** — Recognising Coordinated Passenger Robbery in Taxis (Carjacking / In Your Car) — Story 712
- **NEW TIP TIP-00102** — Avoiding Robbery From Dating App Meetup Lures (Robbery / Other) — Story 713

---

### Safety tips: TIP-00096 to TIP-00099 + 4 story attachments (Mar 30, 2026)

- **NEW TIP TIP-00096** — Hardening Residential Door Locks Against Forced Entry (Burglary / At Home) — Story 695
- **NEW TIP TIP-00097** — Reporting Suspicious Individuals in Your Residential Building (Shooting / At Home) — Story 697
- **NEW TIP TIP-00098** — Passenger Safety Protocols for Private Hire Drivers (Robbery / In Your Car) — Story 699
- **NEW TIP TIP-00099** — Never Invite Strangers Into Short-Term Rental Accommodation (Robbery / At a Hotel) — Story 700
- **UPDATED TIP-00046** — added Story 692 (proprietor robbed carrying cash on foot to bank)
- **UPDATED TIP-00054** — added Story 701 (alcohol-triggered DV, recurring pattern)
- **UPDATED TIP-00067** — added Story 696 (2v1 chopping assault at bar)
- **UPDATED TIP-00021** — added Story 698 (knife robbery at Facebook Marketplace meetup in Laventille); severity upgraded from `low` to `medium`

---

### datePublished replaces dateObj for all rolling window filters site-wide (Mar 30, 2026)

Previously all date range filters used `dateObj` (crime incident date). Crimes are dated when they *happened*, not when they were published — creating a reporting lag that made weekly/monthly stats consistently undercount recent activity. `datePublished` (when the crime entered the system) is now the primary date for all rolling windows, falling back to `dateObj` for legacy rows.

**Rule going forward:** `(c.datePublished ?? c.dateObj)` for any rolling window filter. `c.dateObj` only for YoY comparisons (intentional historical anchors). See L017.

**Client-side fix (required to make this work end-to-end):**
- **`src/pages/api/crimes.ts`** — `datePublished` was being stripped from JSON. Now serialized as ISO string.
- **`src/scripts/dashboardDataLoader.ts`** — Both SSR and non-SSR reconstruction paths now rebuild `datePublished` as a `Date` from the ISO string.
- **`src/scripts/modalHtmlGenerators.ts`** — Hot areas 7-day filter updated.

**Server-side (rolling windows only — YoY left on dateObj):**
- `HomepagePulse.astro`, `DashboardStory.astro`, `dashboard.astro`, `index.astro` — 7/14d weekly windows (also removed `lagDays=3` workaround — no longer needed)
- `areas.astro`, `regions.astro` — 90d
- `area/[slug].astro` — 7/14/30/90d + per-area count
- `region/[slug].astro` — 30/90d
- `mp/[slug].astro` — 90d
- `compare.astro` — 90d
- `headlines.astro` — 30d
- `safety-tips/[slug].astro` — 90d
- `news-sitemap.xml.ts` — 2d filter + sort

---

### Fix: _redirects double redirect causing GA4 split views (Mar 30, 2026)

- **`public/_redirects`** — All destination URLs updated to include trailing slashes (e.g. `/trinidad/dashboard/` not `/trinidad/dashboard`). Previously, old-URL visitors hit a double redirect: `_redirects` fired first (no slash), then Astro's `trailingSlash: 'always'` fired a second redirect to add the slash. GA4 was recording the intermediate no-slash URL as a separate page, splitting view counts — e.g. dashboard showed 1,670 views on `/trinidad/dashboard/` and 410 views on `/trinidad/dashboard` as two distinct entries.

---

### Social image workflow redesigned + area comparison data added (Mar 29, 2026)

- **`docs/guides/SOCIAL-IMAGE-WORKFLOW.md`** — Full redesign. Replaced single Gemini image style with a 5-format testing framework (F1 pure text card, F2 neighbourhood warning, F3 leaderboard, F4 question hook, F5 AI scene). F1–F4 built in Canva, F5 via Gemini. Named area required in every post — key change from old approach. Weekly tracking log added to measure which formats get shares. Canva is the primary production tool; Claude outputs copy ready to paste into templates.
- **`google-apps-script/trinidad/socialMediaStats.gs`** — `getTopAreas()` now accepts previous period crimes and returns `diff` + `arrow` per area alongside `count`. All three post formats (long/medium/short) in both weekly and monthly generators updated to show per-area week-over-week change (e.g. `Laventille: 8 incidents (+3 ↑)`).

---

### HomepagePulse: crimes count uses primary+related methodology (Mar 29, 2026)

- **`HomepagePulse.astro`** — "This Week" crimes number and week-over-week % now use `getTotalCrimeCount()` (primary + related types per row) instead of raw row count. Consistent with the rest of the site per L009.

---

### Crime detail page: incident composition display + glass panel (Mar 28, 2026)

- **`crime/[slug].astro`** — Crime type chips now show victim counts per type instead of deduplicated type names. Replaced `new Set()` chip render with a `Map`-based count: `Attempted Murder ×3`, `Murder ×1`. Primary chip absorbs same-type related entries into a merged count (e.g. Robbery primary + Robbery×2 related → `[Robbery ×3]` in rose rather than a duplicate slate chip). Incident composition summary line (`"4 people involved — 1 killed · 3 injured"`) rendered between chips and H1 when Murder or Attempted Murder are present. Fixes false-positive "data error" user reports caused by invisible victim counts.
- **`crime/[slug].astro`** — Multi-crime incidents (related types present or summary text present) now group chips + summary inside a frosted glass panel (`bg-white/85 backdrop-blur-md`, 1px `border-slate-200/80` light / `hsl(0_0%_100%_/_0.08)` dark, `rounded-xl`). Single-crime incidents keep the plain rose pill with no wrapper. Chips inside panel use `flex flex-wrap gap-1.5` instead of `ml-1.5` offsets.

---

### Safety tips batch: Stories 681–685 (Mar 28, 2026)

- **NEW TIP TIP-00091** — Staying Safe During Unexpected Public Confrontations (Assault / In a Mall) — Story 681: Rajkumar Pope fatally beaten at a shop in south Trinidad; neck grab + repeated head punches. No existing Assault tip covers unprovoked stranger attack at a retail/food establishment.
- **NEW TIP TIP-00092** — Staying Safe When Your Partner Has an Abusive Ex (Domestic Violence / Walking Alone) — Story 682: Labourer Stephen Leith fatally stabbed on Waterlane Street by his girlfriend's ex-partner, who had a protection order against him. TIP-00054 covers recognising danger in your own domestic situation; this covers third-party risk to a new partner — different prevention angle.
- **NEW TIP TIP-00093** — Preventing Tool-Assisted Forced Entry to Your Business (Burglary / At Work) — Story 683: Three men forced entry to a Santa Flora bar using tools, captured on CCTV. TIP-00058 covers overnight security; TIP-00069 covers overlooked entry points — neither addresses organized daytime tool-based forced entry.
- **NEW TIP TIP-00094** — Never Leave Devices Unattended at Public Counters (Robbery / In a Mall) — Story 684: Samsung S24 Ultra ($17,000) stolen from KFC Independence Square counter while owner sat down to eat. TIP-00006 covers bag handling/pickpockets; does not cover device-on-counter abandonment.
- **NEW TIP TIP-00095** — Protecting Parked Vehicles From Parts Theft (Burglary / At Home) — Story 685: Nissan Almera occupants caught stripping car parts at Webb Trace, Cunupia. TIP-00061 is hybrid battery theft specifically; this covers regular vehicle parts stripping.

---

### Safety tips batch: Stories 668–675 (Mar 27, 2026)

- **NEW TIP TIP-00086** — Securing Burglar-Proofing Against Physical Removal (Burglary / At Home) — Story 668: Mandingo Road burglar removed window bars from frame during daytime absence. Distinct from TIP-00036 (bar cutting / armed occupied-home invasion at night).
- **NEW TIP TIP-00087** — Avoiding Ambush on Unverified Business Field Visits (Robbery / At Work) — Story 669: Salesman lured to Petit Bourg side street by fake client "Nick"; accomplice emerged from bushes at gunpoint. Distinct from TIP-00057 (ambush at your own business) and TIP-00021 (marketplace).
- **NEW TIP TIP-00088** — Protecting Your Home Against Opportunistic Fire Attack (Other / At Home) — Story 670: Venezuelan national attempted residential arson on Lakeview Drive, Carapo, Arima; captured on CCTV. Distinct from TIP-00078 (arson following explicit threats in a property dispute).
- **NEW TIP TIP-00089** — Responding to Coordinated Multi-Home Armed Invasion (Home Invasion / At Home) — Story 671: 6 armed men invaded two neighbouring Charlieville homes simultaneously at 1 a.m. Distinct from TIP-00050 (lone-occupant invasion); new prevention angle is community-level coordinated response.
- **NEW TIP TIP-00090** — Identifying and Avoiding Vehicle Purchase Deposit Scams (Fraud / Online) — Story 675: Fake "Car Hive Limited" advertised Honda Vezel rent-to-own; victim paid 2 × TT$5,000 deposits, vehicle never delivered. Distinct from TIP-00030 (seller-side protection) — this covers buyer-side scam.
- **UPDATED TIP-00058** — Added Story 672 (ABC Nursery School, Glamorgan: defective front door lock left unsecured overnight). Same close-of-business discipline applies; partial overlap noted.
- **UPDATED TIP-00077** — Added Story 673 (police officer's San Fernando apartment burglarised over 24-day absence; forced metal door lock). Direct match — extended absence / no trusted contact monitoring.
- **UPDATED TIP-00059** — Added Story 674 (Caroni North Bank Road: victim allowed passenger to take wheel, then was slashed). Existing tip covers attack inside shared vehicle; new story adds "ceding vehicle control" dimension — captured within existing advice.

---

### JNews design rollout: statistics + footer (Mar 24, session 3)

- **`statistics.astro`** — JNews hierarchy applied. Replaced `Hero.astro` with custom dark hero (`from-slate-900 to-slate-800`, inline breadcrumb, live pulse, rose CTA + ghost download CTA, freshness line). Added 4-card vitals row: Total Crimes (slate) / Murders (crimson) / YoY Change (amber) / Murder Rate per 100k (violet). Full-width dark separator band ("Crime by Type, Region & Rate") between StatCards section and detailed tables — separator is a direct `<Layout>` child to match dashboard (not inside the constrained container). `max-w-3xl` → `max-w-5xl` throughout. `yoyChangeDisplay` variable guards NaN/zero-denominator edge case.
- **Footer restructure** (`Layout.astro`) — 3-col → 5-col nav grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`). Split Help (9 links) into **Help** (Help Centre, FAQ, Methodology, Contact) + **Company** (About, Support the Project, Privacy Policy, Business Solutions, Report a Crime). Split Browse (6 links) into **Browse** (Dashboard, Headlines, Archive, Murder Count) + **Content** (Blog, Safety Tips, Murders). Removed the old mobile 2-col sub-grid hack on Help. All columns now use plain `space-y-1` lists.
- **`DESIGN-ALIGNMENT-GUIDE.md`** (`docs/guides/`) — new doc. Reference guide for applying JNews hierarchy to remaining pages: dark hero pattern, vitals row variants, separator band, section label rules, two-column zones, dark mode pairs, per-page assessment (statistics ✓, region HIGH, area HIGH, murders MEDIUM, regions MEDIUM, headlines LOW).
- **`statistics.astro`** — fixed hardcoded `Murder Count 2026` link label in Related Resources → `Murder Count {currentYear}`.
- **Pipeline artifacts** — `redirect-map.json` +16 slug redirects (Stories 2126–2142), `health-data.json` build timestamp.

---

### Dashboard JNews hierarchy + redirect bug fixes (Mar 24, session 2)

- **`dashboard.astro`** — full layout overhaul. New hierarchy: dark hero band → 4 `GradientStatCard` vitals (Total Incidents/Murders/Victims/Crimes/Day) → `DashboardStory` narrative → crime breakdown scroll → sticky year filter bar → 2-col map+top-areas → Quick Insights. New `GradientStatCard.astro` component with `variant` prop (slate/crimson/amber/violet).
- **`onYearChange` try/catch** — year filter previously froze dashboard on shimmer if API call failed. Now catch block hides all shimmers + restores visible state.
- **`dashboardDataLoader.ts`** — added `window.__crimesData = []` fallback in SSR path catch block so Leaflet map can initialize (no longer hangs on shimmer when `/api/crimes/` fails).
- **`TopRegionsCard.astro` + `dashboardUpdates.ts`** — removed crime count badge + "crimes" text (too tight in 2fr column). Hover strengthened: `slate-50` → `slate-100`.
- **301 → 302 on slug-not-found redirects** — `region/[slug].astro`, `area/[slug].astro`, `archive/[year]/[month].astro` all changed from `Astro.redirect('/404/', 301)` to `302`. 301s were being browser-cached permanently — if `loadFullAreaData()` temporarily failed, every visiting browser cached the redirect forever. `crime/[slug].astro` 301s left unchanged (intentional slug migrations). See B027.
- **`regions.astro`** — fixed missing trailing slash on region card links (`/trinidad/region/${slug}` → `.../${slug}/`).

---

### Dashboard + area page bug fixes (Mar 24)

- **`dashboardDataLoader.ts`**: SSR path now fetches `/api/dashboard/?year=...` in parallel with `/api/crimes/` and calls `applyPrecomputedStats()`. Previously the SSR path never fetched `/api/dashboard`, so `.trend-indicator` elements (always `hidden` in SSR HTML) were never populated on first load. Counts were correct; only trend arrows were missing.
- **`api/dashboard.ts`**: Rolling 30-day trend queries now only run for current year or `all`. Historical year selections (e.g. 2025) return zero trends so trend indicators are hidden. Previously 2025 stat cards showed live 2026 rolling-window arrows, which was misleading.
- **`AreaNarrative.astro`**: Fixed pluralization — `total90d` fallback sentence (`thisWeekCount === 0` branch) now correctly shows "1 incident" not "1 incidents".
- **`area/[slug].astro`**: Added `hover:bg-rose-50 dark:hover:bg-rose-950/30` + dark mode hover variants (`dark:hover:border-rose-800`, `dark:hover:text-rose-400`) to both "Other Areas" link sections.

---

### Dashboard + Compare: prerender → SSR (D1 migration complete) (Mar 24)

- **`dashboard.astro`**: Removed `export const prerender = true`. Now SSR + CDN cached (`max-age=3600, s-maxage=82800`). Uses `getAllCrimesFromD1(db)` with `getTrinidadCrimes()` CSV fallback. No longer fetches CSV at build time.
- **`compare.astro`**: Same SSR migration. Removed `export const prerender = true` and `loadFullAreaData()` CSV call. Area info now derived from `allCrimes` (region from D1) + `area-aliases.json` (knownAs — static, build-time). `getSafetyContext` 90-day window now always current at request time.
- **Shimmer behaviour updated** (`dashboardDataLoader.ts`): SSR path detects `window.__dashboardSSR` (set via `define:vars`). On SSR load, stats/insights/topRegions are revealed immediately (no shimmer — real data already in HTML). Shimmers now only show on year filter changes (`onYearChange`). Map shimmer stays briefly while `/api/crimes/` is fetched silently for Leaflet map + year filter interactivity.
- **CSV fallback kept**: `initializeDashboardDataFromCSV()` retained as safety net for local dev without D1 (non-SSR path only).
- **CSV audit**: All crime-data pages now on D1. `statistics.astro` uses `TRINIDAD_CSV_URLS` only for CSV download links (not data). `mp/[slug].astro` uses CSV (pre-rendered, intentional). `redirectGenerator.ts` uses CSV at build time for redirect map (intentional).

---

### /support page + blog date fix (Mar 24)

- **NEW PAGE `/support/`** (`src/pages/support.astro`): Ko-fi CTA page — primary rose button to ko-fi.com/crimehotspots, 3 cards (Hosting & Infrastructure, AI Data Pipeline, Development), secondary ghost CTAs to /report + /help. Pre-rendered static.
- **Routes:** `routes.support = '/support/'` added to `routes.ts`.
- **Header.astro:** All 3 Ko-fi links (desktop nav, subscribe tray, hamburger) now route through `/support/` instead of direct ko-fi URL.
- **Layout.astro footer:** Help nav section now includes "Support the Project" link; footer Ko-fi button also routes through `/support/`.
- **B024 fixed — blog publish date:** `weeklyBlogAutomation.gs` `buildFinalBlogMarkdown()` frontmatter `date` now uses `new Date()` (publication day). Previously used `blogData.weekEnd` (lagDays=3 behind), causing Monday posts to show Friday's date. Filename still uses `weekEnd` as data-period identifier. `trinidad-weekly-2026-03-20.md` corrected to `2026-03-23`.

---

### Safety Tips Batch: TIP-00082 to TIP-00085 (Mar 24)

- **NEW TIP TIP-00082** — Concealing Jewellery at Late-Night Bar Exits (Robbery / At a Bar)
- **NEW TIP TIP-00083** — Limiting Outdoor Exposure in Residential Areas After Dark (Shooting / Walking Alone)
- **NEW TIP TIP-00084** — Employee Safety During an Armed Retail Raid (Robbery / At Work)
- **NEW TIP TIP-00085** — Protecting Yourself in a Chase-and-Overpower Robbery (Robbery / Walking Alone)
- **UPDATED TIP-00033** — Added Story 638 to `related_story_ids` (early-morning minimart robbery — low-staff period already covered)

---

### Safety Tips Batch: TIP-00078 to TIP-00081 (Mar 23)

- **NEW TIP TIP-00078** — Protecting Your Residence When Arson Is Threatened (Extortion / At Home)
- **NEW TIP TIP-00079** — Reducing Risk When You May Be a Drive-By Target (Shooting / Walking Alone)
- **NEW TIP TIP-00080** — Complying Safely During an Armed Carjacking (Carjacking / In Your Car)
- **NEW TIP TIP-00081** — Vetting Acquaintances Before Granting Home Access (Home Invasion / At Home)
- **UPDATED TIP-00064** — Added Story 628 to `related_story_ids` (vehicle-based chain snatch from pedestrian — same tactic as existing tips)

---

### Safety Tips Batch: TIP-00076 to TIP-00077 (Mar 22)

- **NEW TIP TIP-00076** — Armed Robbery Along Transit Corridors at Night (Robbery / Using Public Transport)
- **NEW TIP TIP-00077** — Securing Your Property During Extended Absence (Burglary / At Home)
- **UPDATED TIP-00064** — Added Stories 616, 617 to `related_story_ids` (chain snatch while walking — same tactic)
- **UPDATED TIP-00027** — Added Story 618 to `related_story_ids` (daytime home invasion while occupant present — same tactic)
- **UPDATED TIP-00033** — Added Story 620 to `related_story_ids` (false-customer cafe robbery — same tactic)

---

### Safety Tips Batch: TIP-00074 to TIP-00075 (Mar 19)

- **NEW TIP TIP-00074** — Designing Security Lighting Criminals Cannot Map (Burglary / At Home)
- **NEW TIP TIP-00075** — Protecting Shift Workers at Isolated Transport Stops (Robbery / Using Public Transport)
- **UPDATED TIP-00033** — Added Story 596 to `related_story_ids` (retail robbery during hours — same tactic)
- **UPDATED TIP-00034** — Added Story 595 to `related_story_ids` (3am forced entry + hammer assault — pre-dawn entry already covered)
- **Workflow:** Autonomous execution — no confirmation step; recommendations stand immediately upon receiving flagged rows

---

### Safety Tips (Mar 19)

- **NEW TIP TIP-00073** — Avoiding Isolated Locations on Late-Night Outings (Kidnapping / Other)
- **UPDATED TIP-00055** — Added Story 592 to `related_story_ids` (ransom demand via video call — extortion angle already covered)
- **Workflow:** Added explicit no-duplicates rule to Step 2 of `SAFETY-TIP-WORKFLOW.md` — stories that match existing tactics must be attached, not given a new file; partial-overlap case also documented

---

### Safety Tips Batch: TIP-00070 to TIP-00072 (Mar 18)

- **NEW TIP TIP-00070** — Protecting Open Religious and Community Premises (Robbery / At Work)
- **NEW TIP TIP-00071** — Reducing Ambush Risk on Residential Lanes (Robbery / Walking Alone)
- **NEW TIP TIP-00072** — Vehicle-Based Robbery at Your Home Gate (Robbery / At Home)
- **UPDATED TIP-00055** — Added Story 586 to `related_story_ids` (extortion / same tactic)
- **UPDATED TIP-00064** — Added Story 587 to `related_story_ids` (jewelry snatch / same tactic)

---

### Safety Tips Batch: TIP-00068 to TIP-00069 (Mar 18)

- **NEW TIP TIP-00068** — Recognising Signs of Human Trafficking Near You (Sexual Violence / Other)
- **NEW TIP TIP-00069** — Securing Overlooked Entry Points at Work (Burglary / At Work)

---

### Safety Tips Batch: TIP-00065 to TIP-00067 (Mar 17)

- **UPDATED TIP-00030** — Added Story 571 to `related_story_ids` (forged WhatsApp receipt — same tactic already covered)
- **Schema:** Added `'At a Bar'` to the `context` enum in `src/config/crimeSchema.ts` (new context page auto-generated: `/trinidad/safety-tips/context/at-a-bar/`)
- **NEW TIP TIP-00065** — Securing Rear and Perimeter Entry Points at Home (Home Invasion / At Home)
- **NEW TIP TIP-00066** — Reducing Snatch-Theft Risk While Waiting for Transport (Robbery / Walking Alone)
- **NEW TIP TIP-00067** — Avoiding Dangerous Escalation at Late-Night Bars (Assault / At a Bar)

---

### Complete D1 Migration — All Pages Off CSV (Mar 15)

All crime-data pages now serve live D1 data at request time (CDN-cached ~23h). `prerender = true` and `getTrinidadCrimes()` as primary data source removed from all in-scope pages.

**New D1 function:** `getCrimesByMonthFromD1(db, year, month)` in `crimeData.ts`

**Simple page swaps** (8 files — D1 pattern + CDN headers added):
`headlines.astro`, `areas.astro`, `regions.astro`, `statistics.astro`, `murder-count.astro`, `archive/index.astro`, `api/latest-crimes.json.ts`, `HomepagePulse.astro`

**Dynamic routes** (3 files — `getStaticPaths()` removed, slug resolved at request time, 404 on unknown slug):
`area/[slug].astro`, `region/[slug].astro`, `archive/[year]/[month].astro`

**Feeds/sitemaps** (4 files): `safety-tips/[slug].astro`, `rss.xml.ts`, `news-sitemap.xml.ts`, `sitemap-0.xml.ts`

**`csvBuildPlugin.ts` slimmed:** removed all CSV crime fetching (~200 lines), validation, and `csv-cache.json` write. Now only fetches RegionData → writes `area-aliases.json` + simplified `health-data.json`. Zero CSV warnings on build.

---

### Pipeline duplicate fixes + Assault classification rule (Mar 15)

**processor.gs — Fix A:** After each Production write, the last-written row is read back and pushed onto `cachedProdData` in memory. Prevents same-incident articles processed in the same batch from bypassing all duplicate checks.

**processor.gs — Fix B (POTENTIAL 4):** New check in `findPotentialDuplicate()` — same victim name + crime date 1 day apart → routes to Review Queue instead of passing through. Catches cross-outlet date discrepancies that exact-date checks miss.

**schema.gs — Assault promptDescription:** Added explicit rule: a weapon pointed at a victim without physical contact does NOT qualify as Assault. Fixes incorrect Assault classification for knife-threat-only scenarios (e.g. grandma story).

**Docs synced:** `CRIME-CLASSIFICATION-RULES.md` §6 + `HEADLINE-CLASSIFICATION-WORKFLOW.md` weapon-threat row updated to match.

---

### Safety Tips TIP-00062 to TIP-00064 + TIP-00049 update (Mar 15)

- **UPDATED TIP-00049** — Added Story 549 to related_story_ids (return-from-shopping garage robbery)
- **NEW TIP TIP-00062** — Securing Your Home During Morning Routines (Home Invasion / At Home)
- **NEW TIP TIP-00063** — Securing High-Value Items in Hotel Rooms (Burglary / At a Hotel)
- **NEW TIP TIP-00064** — Concealing Jewellery When Walking in Public (Robbery / Walking Alone)

---

### Safety Tips TIP-00058 to TIP-00061 + Burglary schema (Mar 14)

- **Schema:** Added `'Burglary'` to the `category` enum in `src/config/crimeSchema.ts`
- **NEW TIP TIP-00058** — Securing Your Business Premises Overnight (Burglary / At Work)
- **NEW TIP TIP-00059** — Recognising Escalation Inside a Shared Vehicle (Carjacking / In Your Car)
- **NEW TIP TIP-00060** — Responding When Your Vehicle Is Shot At (Shooting / In Your Car)
- **NEW TIP TIP-00061** — Protecting Your Hybrid Vehicle Overnight (Burglary / At Home)

---

### Safety Tips TIP-00056 + TIP-00057 (Mar 14)

- **NEW TIP TIP-00056** — When a Dispute Follows You Home (Shooting / At Home)
- **NEW TIP TIP-00057** — Ambush Risk Arriving at Your Business (Shooting / At Work)

---

### Claude Prompt Quality Overhaul (Mar 14)

**Files changed:**
- `google-apps-script/trinidad/schema.gs` — enriched `promptDescription` for Murder (added keywords), Attempted Murder (added "Do NOT use for stray bullets"), Arson (added "use when" / "never for" guidance). All 15 types now have substantive per-type rules.
- `google-apps-script/trinidad/claudeClient.gs` — `buildSystemPrompt()` fully restructured and quality-fixed:

**Gaps closed:**
- `buildClassificationRulesBlock()` now wired into the prompt — all 15 crime types have explicit rules (was 7/15 before; Sexual Assault, Kidnapping, Burglary, Theft, Shooting, Assault, Home Invasion had no classification guidance)
- `location_country` disambiguation rule added: Trinidad / Tobago / Trinidad and Tobago defined
- Safety tip multi-category ordering rule added: "list ALL applicable, ordered most-specific first"
- `role` field removed from VICTIM COUNT worked example (was not in the JSON schema — caused inconsistent output)
- Mass-casualty example clarified: "3 shot, 1 dies" explicitly stated as one crime object

**Overlaps eliminated:**
- Carjacking rule: was in 3 sections → now in 1 (Classification only, auto-generated from schema)
- Shooting sections merged into one SHOOTING CLASSIFICATION block
- Date worked examples: 3 redundant examples → 1 example covering all key cases

**Structural improvements:**
- Section order: Hierarchy + Hard Implications + Classification moved immediately after JSON schema (foundational rules now precede sections that reference them)
- `CRITICAL` keyword reduced from 14+ uses to 1 reserved case (date distinction)
- Output examples: "Bad (no || separators)" is now a one-liner instead of full repeated text

---

### Crime Classification Rules — Hard Implications + Reference Doc (Mar 14)

**New doc:** `docs/guides/CRIME-CLASSIFICATION-RULES.md`
- Full schematic: severity hierarchy, context type rules, hard rules (§4), soft flags per crime type (§5), disambiguation rules (§6), quick reference card
- Recording standard reference: FBI NIBRS + UK Home Office (harm hierarchy)

**Hard implication rules established (2 rules):**
- Carjacking → Robbery (always, definitionally — vehicle IS the stolen property)
- Home Invasion → Burglary (always — every home invasion involves unlawful entry)

**Key disambiguation decisions locked in:**
- Robbery ≠ Theft: mutually exclusive; Robbery always supersedes (no double-counting)
- Shooting (primary) vs Attempted Murder (primary): intent-based. Intent confirmed (execution-style, stated intent, multiple shots at close range) → Attempted Murder. In doubt → default to Shooting.
- Shooting and Assault are not stackable as peers — choose the more specific

**Files changed:**
- `schema.gs` — CARJACKING promptDescription fixed (was "add Robbery only if extra property taken" — wrong). `CRIME_HARD_IMPLICATIONS` constant + `getHardImplications()` + `buildHardImplicationsBlock()` added.
- `claudeClient.gs` — new HARD IMPLICATION RULES section in system prompt; Carjacking rule fixed with ✅/❌ examples; SHOOTING AS PRIMARY clarification block added with intent-based decision table.
- `crimeTypeProcessor.gs` — `determineCrimeTypes()` now applies `getHardImplications()` as safety net after dedup, before sort. Auto-adds implied types if Claude misses them.
- `crimeSchema.ts` — `CRIME_HARD_IMPLICATIONS` added (frontend mirror).

---

### Safety Tips — New categories + seed tips (Mar 13)

- **Schema:** Added `'Domestic Violence'` and `'Extortion'` to `SAFETY_TIP_CATEGORIES` in `src/content/config.ts` (via `crimeSchema.ts`)
- **NEW TIP TIP-00054** — Recognising Escalating Danger in a Domestic Situation (Domestic Violence / At Home)
- **NEW TIP TIP-00055** — Responding to Extortion and Threatening Demands (Extortion / Other)
- **Docs:** `docs/guides/SAFETY-TIP-WORKFLOW.md` — categories table + last tip ID updated

---

### Safety Tips — Stories 530–533 (Mar 13)

- **NEW TIP TIP-00050** — Protecting a Lone Occupant Against Evening Home Invasion (Home Invasion / At Home)
- **NEW TIP TIP-00051** — Armed Window-Smash Robbery on Vehicles Parked at Home (Robbery / In Your Car)
- **NEW TIP TIP-00052** — Avoiding Jewellery Theft on Public Transport (Robbery / Using Public Transport)
- **NEW TIP TIP-00053** — Protecting Business Vehicles From Targeted Arson (Other / At Work)

---

### Search + Performance Fixes (Mar 12)

**SearchModal — two bug fixes:**
- Clicking a Pagefind result now calls `closeModal()` before navigation — modal was staying open (SPA nav happened in background, looked like nothing happened)
- Pagefind clear button click re-shows the suggestions panel — Pagefind's clear button does not fire a native `input` event, so the empty-state handler wasn't running

**Search — crime pages now indexed (2,591 records):**
- Root cause: crime pages are SSR so Pagefind's build-time HTML crawler never sees them — only static pages (areas, regions, blog, etc.) were appearing in results
- Fix: new `src/integrations/pagefindCrimeIndexer.ts` — runs in `astro:build:done` AFTER `pagefind()`, re-builds the complete index using `pagefind` Node API: `addDirectory` (static pages) + `addCustomRecord` per crime (slug, headline, area, region, crimeType, summary). Overwrites astro-pagefind's index with the combined one.
- Build time impact: ~6s extra per build
- Config: must stay LAST in `integrations[]` in `astro.config.mjs` (runs after astro-pagefind)

**LCP + INP improvements (all crime detail pages):**
- `font-display: swap` → `font-display: optional` on both Inter `@font-face` rules in `Layout.astro` — eliminates the re-paint LCP bump (font is preloaded so it's available within the block period on first render)
- `pagefind-ui.js` (83KB) removed from eager Layout load; now lazy-injected by `loadPagefindScript()` inside `openSearchModal()` on first call — pagefind-ui.css still loads upfront (non-blocking). Defers 83KB of JS parse/execute until user actually opens search.

---

### Safety Tips — Stories 520–521 (Mar 12)

- **UPDATED TIP-00033** — Added Story 520 to `related_story_ids` (armed retail robbery, employees tied up — same actionable advice as false-customer entry)
- **NEW TIP TIP-00049** — Preventing Push-In Robbery at Your Home (Home Invasion / At Home)

---

### CSS Modernisation — Groups 1–5 complete (Mar 12)

**~781 JS lines removed across 10 components. Full plan doc: `docs/CSS-MODERNISATION.md`.**

**Group 1 — `<details>/<summary>` accordions (done earlier):**
- `CategoryAccordion.astro`, `DateAccordion.astro` — JS class toggles → `<details>/<summary>` + CSS `:open` chevron
- `MapLegend.astro` — JS `grid-template-rows` animation retained; click + open logic simplified
- `area/[slug].astro` — inline "Recent Headlines" accordion: same pattern applied

**Group 2 — `<dialog>` modals & menus:**
- `IslandSelectorModal.astro`, `SectionPickerModal.astro`, `SearchModal.astro`, `Header.astro`, `BottomNav.astro` — all converted from JS-managed divs to native `<dialog>` + `showModal()` + `::backdrop`
- Established patterns: `@starting-style` open animation, `.is-closing` + `transitionend` close, `cancel` intercept for Esc, `astro:before-preparation` SPA guard, `animation-fill-mode: backwards` backdrop concurrent fade
- `BottomNav` country indicator: IntersectionObserver removed; strip always visible
- All `is:inline` scripts converted to module scripts with `astro:page-load`

**Group 3 — CSS `@keyframes` rotating banner:**
- `BlogRotatingBanner.astro` — `setInterval` removed; 2 `@keyframes` variants (`blog-rotate-2/3`) + `[data-post-count]` selectors; item 0 gets `animation-delay: -0.5s` (no slide-in flash on load); `:hover` pauses rotation

**Group 5 — Minor cleanup:**
- `FeedbackToggle.astro` — `setTimeout(700)` → `animationend` + `{ once: true }`
- `SiteNotificationBanner.astro` — `style.display='block/none'` → `hidden` attribute

**Group 4 deferred** — CSS Anchor Positioning (Firefox not yet baseline; revisit late 2026)

---

### MPSidebar.astro + Murder Count Sidebar Layout (Mar 11)

**New component: `src/components/MPSidebar.astro`**
- Sticky right-column sidebar for area and region detail pages
- Sections: share buttons (X/Facebook/WhatsApp using `.sb-share-btn` pattern), MPs card, Ko-fi support card
- `showAll=false` (area pages): shows 2 MPs + "N more" chevron toggle
- `showAll=true` (region pages): all MPs visible on desktop, mobile toggle
- Added to `area/[slug].astro` + `region/[slug].astro` (replaces inline share button + MP grid)
- Full design rules: `.memory/entries/C004-mpsidebar-design-rules.md`

**Site width standard established (Mar 11):**
- Global content width: `max-w-5xl` — header, footer, hero `narrowContainer`, sidebar pages
- Sidebar grid: `lg:grid-cols-[1fr_256px]` with `lg:gap-8`; `min-w-0` required on both columns
- Template: `docs/guides/tokens/layout.md` → "Sidebar Page Layout"

**murder-count.astro sidebar:**
- Converted to `max-w-5xl` + `lg:grid-cols-[1fr_256px]` layout (same pattern as MPSidebar pages)
- Does NOT use MPSidebar component — sidebar content is inline (share buttons + incidents + newsletter)

---

### UX Audit Phase 1 & 2 (Mar 10)

**P2-01 — Dashboard filter bar:**
- Extracted year select + filters button into `sticky top-16 z-30` filter bar above content
- Utility button style: `bg-slate-100` filled pill (vs ghost border for nav CTAs) — see L011
- `#clearFiltersInline` hidden until filters active; `scroll-margin-top: 8rem` on map container
- Year select options: plain years only ("2026" not "2026 Data")

**P2-02 — Compare page selector bar:**
- Same `sticky top-16 z-30` bar pattern; `#selectA` + `#selectB` dropdowns; redundant subtitle removed

**Dashboard script extraction (L012):**
- `dashboard.astro` 869 → 554 lines — extracted `MapLegend.astro`, `dashboardMapInit.ts`, `dashboardLocationFilter.ts`
- Line limit updated: content pages ~500, complex interactive pages ~600

---

### MP Profiles — Phase 1 complete (Mar 10–11)

- All 41 MPs now have real photos (`public/images/mps/`)
- `socials` (Facebook, X, Instagram, YouTube), `website`, `contact.emailAlt`, `contact.whatsapp` populated where available
- Non-standard filenames: `khadijah-ameen.webp`, `mrs-camille-robinson-regis.webp`, `neil-gosine.webp`
- Phase 2 deferred: area page → MP link (only where area↔constituency mapping is unambiguous)

---

### Safety Tips — TIP-00047 to TIP-00048 (Mar 11)

- **NEW TIP TIP-00047** — Concealing Valuables Before Exiting Your Vehicle (Robbery / In Your Car) — Story ID 514
- **NEW TIP TIP-00048** — Staying Safe During Roadside Enforcement Duties (Assault / At Work) — Story ID 515

### Safety Tips — TIP-00044 to TIP-00046 (Mar 9)

- **NEW TIP TIP-00044** — Vary Your Morning Departure to Avoid Ambush (Carjacking / At Home) — Story ID 506
- **NEW TIP TIP-00045** — Recognising Fake Weapons and False Police Authority (Home Invasion / At Home) — Story ID 507
- **NEW TIP TIP-00046** — Protecting Yourself When Carrying Cash on Foot (Robbery / Walking Alone) — Story ID 503

### Safety Tips — TIP-00037 to TIP-00043 (Mar 7)

- **NEW TIP TIP-00037** — Avoiding Being Targeted While Parked Alone in a Vehicle (Robbery / In Your Car) — Story IDs 489, 495
- **NEW TIP TIP-00038** — Staying Safe When Travelling Through Remote Areas (Robbery / Other)
- **NEW TIP TIP-00039** — Recognising Dispute-Based Attacks at Your Business (Assault / At Work)
- **NEW TIP TIP-00040** — Never Exit Your Home Based on an Unverified Claim (Assault / At Home)
- **NEW TIP TIP-00041** — Bystander Safety During Road Confrontations and Gunfire (Assault / In Your Car)
- **NEW TIP TIP-00042** — Staying Vigilant in Mall and Shopping Centre Carparks (Robbery / In a Mall)
- **NEW TIP TIP-00043** — Counter-Surveillance and Window Security for Retail Businesses (Robbery / At Work)

### Safety Tips — TIP-00034 to TIP-00036 (Mar 7)

- **NEW TIP TIP-00034** — Hardening Your Home Against Forced Pre-Dawn Entry (Home Invasion / At Home)
- **NEW TIP TIP-00035** — Recognising Hostile Intent from Known Contacts (Assault / Walking Alone)
- **NEW TIP TIP-00036** — Protecting Against Window Bar Cutting and Armed Robbery (Home Invasion / At Home)

### Safety Tips — TIP-00031 to TIP-00033 (Mar 6)

- **NEW TIP TIP-00031** — Securing Your Hotel Room Door at Night (Home Invasion / At a Hotel)
- **NEW TIP TIP-00032** — Recognising and Responding to Road-Block Robberies (Robbery / In Your Car)
- **NEW TIP TIP-00033** — Preventing False-Customer Entry Robberies at Retail Premises (Robbery / At Work)
- **Schema:** Added `'At a Hotel'` to the `context` enum in `src/content/config.ts`

### GSC Indexing Fixes + Google News Sitemap (Mar 6)

**GSC audit across 6 validation emails (~700 URLs total):**
- **5xx errors (43 pages):** Already resolved by `9cc78ca` — stale GSC data. Request re-validation, no code change needed.
- **Page with redirect — area pages (120):** Root cause found: `region/[slug].astro:208` generated `/trinidad/area/${slug}` without trailing slash. Googlebot followed all area links from region pages into 308 redirects. Fixed by adding trailing slash. Deployed `6b49ba9`.
- **Page with redirect — old crime slugs (~308):** Intentional 301s from Story_ID migration. Will age out as Google re-crawls new sitemap over 4–8 weeks. Do not re-validate.
- **Duplicate canonical (104):** Story_ID migration aftermath — Google chose old URLs as canonical. Resolves naturally over time.
- **Crawled not indexed (77):** Thin content / quality signal issue. No immediate fix.

**Google News sitemap fix (`5ceb8b2`):**
- Was: blog posts only → empty 6/7 days (weekly Monday automation)
- Now: blog posts + crime pages from last 2 days (daily fresh content, capped at 100)
- Crime pages already have `NewsArticle` schema — valid Google News candidates

**Google Reader Revenue Manager (RRM):**
- Approved Mar 5, 2026. Publisher Center primary URL: `crimehotspots.com`
- **Do not use monetization features** — Ko-fi + Buttondown already handle support/newsletter
- **Keep the approval** — it's a publisher legitimacy signal enabling Top Stories / Google News eligibility
- SwG script already in codebase (commit `a0a8776`) — keep it, costs nothing
- News sitemap registered in Publisher Center under Content settings → Sitemaps: `https://crimehotspots.com/news-sitemap.xml`

### Google Freshness Signals — datePublished / dateUpdated pipeline (Mar 6)

**Goal:** Let Google know when a story was published into the pipeline and when it was last corrected, so every signal shows accurate freshness rather than the incident date.

**CSV columns** (`Date_Published`, `Date_Updated`) confirmed present in both 2025 and 2026 sheets.

**`crimeData.ts` + `dashboardDataLoader.ts`:**
- Added `datePublished?: Date` and `dateUpdated?: Date` to `Crime` interface
- Both parsed via the same `parseDate()` function (MM/DD/YYYY, same protection as `Date` column)
- Invalid/missing values silently become `undefined` — fallback to `dateObj`

**`[slug].astro` — NewsArticle structured data:**
- `datePublished`: `crime.datePublished ?? crime.dateObj`
- `dateModified`: `crime.dateUpdated ?? crime.datePublished ?? crime.dateObj`

**`rss.xml.ts`:**
- `<pubDate>`: `crime.datePublished ?? crime.dateObj`
- `<atom:updated>` added per item: `crime.dateUpdated ?? crime.datePublished ?? crime.dateObj`

**`sitemap-0.xml.ts`:**
- Crime page `<lastmod>`: `crime.dateUpdated ?? crime.datePublished ?? crime.dateObj`

**GAS — `processor.gs`:**
- Refactored all positional column indices → `buildColMap()` + `appendRowByHeaders()` helpers (safe against sheet column reordering)
- Auto-fills `Date_Published` = today (Trinidad time) on every new Production/Review Queue row
- `Date_Updated` left blank on insert (filled manually when a story is corrected)
- Safety tip fields normalized: default to `'No'` if Claude omits them (`claudeClient.gs`)

**GAS — `syncToLive.gs`:**
- Replaced hardcoded `COLUMN_MAPPING` with `NAME_BASED_FIELD_MAP` (name → name, resolved at runtime)
- Propagates `Date_Published` and `Date_Updated` from Production → LIVE sheet on sync

**GAS — `facebookSubmitter.gs`:**
- 2025-sheet append switched to `appendRowByHeaders()` (column-reorder safe)

---

### Top Regions — Weighted National Share Risk Scoring (Mar 4)
- **TopRegionsCard.astro** + **dashboardUpdates.ts** — replaced old relative-to-max area system with region-based weighted national share scoring
- Sort: absolute weighted score (crime severity × victim count per region)
- Risk label: each region's % share of the national weighted total — self-calibrating, zero config
- Removed dead `calculateAreaRiskLevels()` function (old relative-to-max, was unused)
- Fixed misleading comments in `riskWeights.ts` and `TopRegionsCard.astro`
- **NEW DOC** — `docs/guides/RISK-SCORING-METHODOLOGY.md` — canonical reference for the scoring system
- `REGION_POPULATION_CSV_URL` added to `csvUrls.ts` (available for future per-capita use)

---

### Safety Tips (Mar 6)
- **NEW TIP TIP-00029** — Dual-Flank Vehicle Approach Awareness (Carjacking / In Your Car) — Story ID 474
- **NEW TIP TIP-00030** — Payment-Before-Release for Online Sales (Online Scam / Online) — Story ID 473

### Safety Tips (Mar 4)
- **NEW TIP TIP-00027** — Daytime Home Security While You're Inside (Home Invasion / At Home) — Story ID 458
- **NEW TIP TIP-00028** — Device Handling During In-Person Sales (Robbery / In a Mall) — Story ID 459
- **NEW DOC** — `docs/guides/SAFETY-TIP-WORKFLOW.md` — step-by-step workflow for all future tip creation

---

### Newsletter + Blog Revenue Signals (Mar 3)

**NewsletterSignup.astro — all 3 variants (card, inline, footer):**
- Added social proof line: "3,400+ residents subscribed this month" (muted subtitle, card + inline)
- Added "Read the latest brief →" archive link to Buttondown archive (all variants)

**Blog index (`/blog/`) — Latest Brief pin:**
- Rose-tinted pinned card above the post list showing the latest post title, date, read time
- Auto-updates on every blog publish (uses `sortedPosts[0]`)

**Blog post pages (`/blog/[slug]`) — No-Ad Guarantee:**
- Small note inside article card after article body: "100% ad-free. Supported by readers like you on Ko-fi."
- Shield icon, muted styling, Ko-fi link opens in new tab

---

### Header + Search Overhaul (Mar 3)

**Header — mobile logo:**
- Mobile (`< md`) now shows `logo-icon.png` (36px square) instead of the full logo
- Desktop continues to use `logo.png` / `logo-dark-mode.png` unchanged

**Header — Subscribe button:**
- Both mobile and desktop Subscribe buttons updated to ghost style (matches design tokens: `border-2 border-slate-300`, rose hover)

**Header — ♥ Support link:**
- Desktop: ghost button `♥ Support` added after Subscribe, links to `https://ko-fi.com/crimehotspots` (new tab)
- Mobile hamburger: "Support this Project" menu item with filled heart icon in rose, at bottom of menu
- Contact item gained a bottom border to visually separate it from Support

**Search — Pagefind fix:**
- `astro-pagefind` was installed but missing from `astro.config.mjs` integrations → pagefind never ran → `/pagefind/` dir absent on live → search broken
- Fix: added `import pagefind from 'astro-pagefind'` + `pagefind()` to integrations array

**Search — dark mode:**
- Full dark mode CSS for all Pagefind UI selectors (input, results, excerpts, mark highlights, buttons, clear button)
- Modal shell uses `dark:bg-[hsl(0_0%_8%)]` and all borders/text updated

**Search — suggestions panel (shown when input is empty):**
- **Recent searches:** localStorage key `ch_search_history` (max 5). Clock icon chips. Rendered on each modal open.
- **Latest crimes:** fetched once per session from `/api/latest-crimes.json`. 2 cards with headline, area, crime type, date. Links directly to crime pages.
- **Static chips:** 10 prompt chips (Murder, Shooting, Robbery, Burglary, Assault, Kidnapping, Seizures, Port of Spain, Laventille, San Fernando)
- Clicking any chip or crime card populates Pagefind input and fires search
- Terms auto-save to history on Enter, after 1.5s idle typing, or on result click

**New file:** `src/pages/api/latest-crimes.json.ts` — pre-rendered endpoint, returns 2 latest crimes (headline, date, area, crimeType, slug). `Cache-Control: public, max-age=3600`.

---

### Crime Counting Methodology Alignment + QuickInsights Redesign (Mar 3)

**Core decision:** "All Crimes" counts primary + related crime type occurrences per row (not raw row count, not victim count). This is now consistent across every counter, label, and table on the site.

**QuickInsightsCard.astro — redesigned layout:**
- Daily Avg now full-width row — crimes/day + victims/day shown inline
- Peak Day + Busiest Month moved to 2-column row below it
- Concentration of Crimes removed entirely
- "Highest Crimes" / "Lowest Crimes" → "Highest Crime Area" / "Lowest Crime Area"

**Methodology fix — area counts now use `getTotalCrimeCount` logic (primary + related):**
- `dashboardHelpers.ts` — `calculateInsights()` area map: was `+1 per row`, now `+primary + related count`
- `dashboardUpdates.ts` — `updateQuickInsights()` client-side area map: same fix
- `statisticsHelpers.ts` — `getTopRegions()`: same fix; total denominator now uses summed crime count
- `compare.astro` — `total90d` and `totalAll` switched from `crimes.length` to `getTotalCrimeCount()`

**"incidents" → "crimes" full sweep (all visible UI labels):**
- `DashboardStory.astro` — weekly summary count
- `HomepagePulse.astro` — stats label (both card variants)
- `headlines.astro` — accordion date label (server + client-rendered)
- `archive/[year]/[month].astro` — accordion date label
- `areas.astro` — sort button + region count label
- `area/[slug].astro` — Hero subtitle
- `region/[slug].astro` — Hero subtitle + badge
- `statistics.astro` — column header + 3× crime rate section labels
- `compare.astro` — table row labels
- `QuickInsightsCard.astro` — area crime sub-labels

**Left as "incidents" (contextually correct prose):** faq.astro, methodology.astro, about.astro, safetyHelpers.ts tip copy, reportValidation.ts

**Safety Tip TIP-00026 added:**
- `src/content/tips/tip-00026-nighttime-venue-perimeter-awareness.md`
- Category: Shooting, Severity: high, Context: At an Event
- Related stories: 738, 1024, 343, 1267 (recreation club + late-night shooting incidents)
- `src/content/config.ts` — `Shooting` added to tip category enum

**socialMediaStats.gs date range fix:**
- Removed off-by-one (`lagDays - 1` → `lagDays`)
- Changed to 8-day window (full-day midnight–23:59 boundaries)
- Insert-then-trim sheet order fix

---

### Calculation Audit + Fixes (Mar 2)

**Root issues identified and fixed across dashboard, statistics, and murder count pages.**

**Dashboard — "All Crimes" card (was "Total Incidents"):**
- `dashboard.astro` + `dashboardUpdates.ts` — changed from raw `crimes.length` (incident rows) to `getTotalCrimeCount()` (primary + related crime type occurrences). Renamed label "Total Incidents" → "All Crimes"
- Trend arrows (↑↓ vs prev 30 days) now use same count method

**Statistics page:**
- `statistics.astro` — "Total Incidents" stat card renamed "All Crimes"
- Fixed double-counting in total YoY row: was summing 9 individual crime type counts (incidents with both a primary + related tracked type were counted twice). Now uses `filterToSamePeriod` + `getTotalCrimeCount` on each year's data

**Murder Count page:**
- `murder-count.astro` — "Latest Murders" list was filtering on old `crimeType` field only, missing 2026 incidents. Now checks `primaryCrimeType`, `crimeType` (legacy fallback), and `relatedCrimeTypes`. Incidents where Murder is in relatedCrimes are included but victimCount is not applied (multiple injuries ≠ multiple deaths)

**DashboardStory banner ("This week: X incidents"):**
- `DashboardStory.astro` — applied the same 3-day lag used by stat card trends. "This week" now covers day 3→10 ago (complete data) vs last week day 10→17 ago, instead of comparing incomplete recent data against complete historical data (was causing inflated "down 45%" figures)
- Fixed boundary day mismatch: "leads with X" top area now derived from the same lag-adjusted `thisWeekCrimes` array instead of `getHotAreas()` which used its own unlagged window
- Removed unused `getHotAreas` import

---

### Console Error Cleanup + UI Polish (Mar 1)

**Console errors fixed:**
- `Layout.astro` — corrupted Ko-fi SVG path (`masterpageWidth` artifact in `d` attr) replaced with clean heart icon
- `Layout.astro` — removed `integrity` attr from Leaflet CSS `<link>` — was causing SRI mismatch preload warnings due to Astro ClientRouter generating integrity-free preload tags
- `statsScroll.ts` — removed `console.warn` when scroll elements not found (expected on non-dashboard pages)
- `yearFilter.ts` — removed `console.error` + debug logs when `#yearFilter` not in DOM (same pattern)
- `leafletMap.ts` — removed `console.error` when map container not found (same pattern)
- `headlines.astro` — added `astro:before-swap` listener to clear `window.__hlData`; without it, stale data caused the page-load guard to not bail out on other pages, throwing TypeErrors on missing DOM elements

**UI polish (homepage):**
- `QuickAnswers.astro` — CTA links inside FAQ cards centred (`self-center` in `flex-col` parent)
- `index.astro` (InfoPopup) — methodology link centred + restyled as muted pill; text updated to "Read the full methodology"

**Ignored (not our code):**
- Leaflet source map CSP block — DevTools-only, `.map` file fetch, no user impact
- `astro:before-swap` extension error — Chrome extension message channel lifecycle, unrelated to site

---

### Muted UI Pass + SPA Script Fixes (Mar 1–2)

**Muted UI — resting-state rose removed across components:**
- `RelatedCrimes.astro` — lightning bolt icon + "View all" link: rose → slate at rest
- `TrendingHotspots.astro` — flame icon, clock icon, "View all areas" link: rose → slate at rest
- `CompactTipCard.astro` — "Read tip →" link: rose → slate at rest
- `CategoryAccordion.astro` — mobile "See all" link: rose → slate at rest
- `areas.astro` — "View Region" link: rose → slate at rest
- `blog/index.astro` — country badge: `bg-rose-50` fill → muted pill (border-only, no fill); Guyana filter button removed; thumbnail `w-20→w-24` to match "All Countries" button width (`w-24`); filter script fixed
- `faq.astro` — accordion `+` icon + hover: rose → slate/light-grey
- **Kept semantic colour:** SafetyContext fills, SiteNotificationBanner fills, QuickInsightsCard rose/emerald, Hero risk badge, Layout subscribe button

**Accordion CSS transitions — `height: auto` pattern applied to:**
- `area/[slug].astro` — date accordion + "More stats" tray (`more-stats-content` class)
- `region/[slug].astro` — date accordion
- `faq.astro` — replaced `max-height: 600px` hack with `height: auto`
- `DateAccordion.astro` — already used `height: auto`, confirmed correct

**SPA navigation bug fixed (`is:inline` → `<script>` + `astro:page-load`) on:**
- `areas.astro` — search + sort listeners
- `area/[slug].astro` — accordion, more-stats toggle, share buttons; `define:vars` → hidden `<div id="areaPageData">` data element; dead badge code removed
- `region/[slug].astro` — accordion + more-stats toggle
- `compare.astro` — `define:vars` data split to `window.__compareData`; all logic in `astro:page-load`
- `faq.astro` — tag change only (`is:inline` → `<script>`); logic already had `astro:page-load`
- `DateAccordion.astro` — fixed wrong comment ("is:inline re-runs" was incorrect)
- `blog/index.astro` — filter vars moved inside `astro:page-load`

---

## February 2026

### Institutional Data Capability Sheet (Feb 25)
- **New page:** `/data-capability-sheet/` — SSR, institutional document for insurers, risk consultancies, researchers, grant committees
- **Content config:** `src/config/capabilitySheetConfig.ts` — single source of truth for all copy, datasets, packages, roadmap
- **Placeholders:** `contact.email`, `contact.entity`, `contact.dataEthicsPath` are `null` → hidden from render. Set to real values when ready — no other files to touch.
- **Dynamic month count:** Reads `health-data.json` (`oldest_story` field) at render time → computes "X+ months" automatically. Token `{MONTHS}` in config is substituted in overview text and data asset table.
- **Print/PDF:** "Export PDF" button calls `window.print()`; `@media print` CSS hides site chrome, forces A4 layout, preserves brand colours.
- **Standalone HTML:** `docs/data-capability-sheet.html` — fully self-contained, no framework dependency, for sending directly to contacts.
- **Markdown:** `docs/data-capability-sheet.md` — internal reference version.
- **business-solutions.astro** — dark CTA banner added linking to capability sheet.

### Dashboard max-w-3xl + Collapsible Legend (Feb 23)
- Applied `max-w-3xl` standard to dashboard (was `max-w-6xl`) — hero and main content wrapper now match all other pages
- Map layout: removed `lg:grid-cols-3` side-by-side; map is full-width, legend moved to collapsible `<details>` below map
- Legend label: "View Legend" when closed, "Legend" when open (pure CSS, `group-open:hidden` / `group-open:block`)
- Spacing: Top Areas `mb-12` → `mb-6`, added missing `pt-4` to Top Areas heading to match Quick Insights + Map
- `docs/guides/DESIGN-TOKENS.md` updated: Dashboard added to standard pages list, exception note removed

### CSV Fetch Pipeline Resilience (Feb 23)
- **`csvBuildPlugin.ts`** (new Astro integration) — fetch with 3-retry exponential backoff (2s/4s/8s), row validation (missing fields, duplicate Story_IDs, >10% row count drop), writes `csv-cache.json` + `health-data.json` at build:start
- **`crimeData.ts`** — `fetchWithRetry()` + cache fallback at runtime (uses bundled `csv-cache.json`)
- **`/api/health.json`** — pre-rendered static endpoint (`prerender = true`), imports `health-data.json` written by csvBuildPlugin
- **Files created:** `src/integrations/csvBuildPlugin.ts`, `src/data/csv-cache.json`, `src/data/health-data.json`, `src/pages/api/health.json.ts`
- **CRITICAL GOTCHA:** Dynamic `await import()` inside Astro integration hooks causes "Vite module runner has been closed" — always use static top-level imports in integrations (`redirectGenerator.ts` also fixed)
- **Infrastructure:** Deleted `crime-hotspots-guyana` Cloudflare Pages project; fixed expired `CLOUDFLARE_API_TOKEN` in GitHub Actions secrets

### Story_ID-Based Slug Migration (Feb 23)

- **New URL format:** `/trinidad/crime/00842-missing-man-found-dead-princes-town/` (Story_ID prefix + 6 headline words)
- **Old URL format:** `/trinidad/crime/missing-man-found-dead-princes-town-2026-01-15/` — SSR 301-redirects to new URL (scales infinitely, no `_redirects` file needed)
- **Crimes with no Story_ID:** slug unchanged (old headline-date format stays)
- **`csvParser.ts`** — added `generateSlugWithId(storyId, headline)`
- **`Crime` interface** — new fields: `storyId: string | null`, `oldSlug: string`
- **`crimeData.ts` + `dashboardDataLoader.ts`** — read `story_id` column; compute conditional slug
- **`[slug].astro`** — SSR fallback: `oldSlug` match → `Astro.redirect(newSlug, 301)` before 404
- **`src/integrations/redirectGenerator.ts`** — new Astro integration: build-time CSV fetch, duplicate-slug validation (blocks build on collision), writes `src/data/redirect-map.json`
- **1,984 redirects** mapped at build time; missing Story_ID rows warn (non-blocking)

### UI Polish — Accent Discipline & FAQ (Feb 20)

- **QuickAnswers.astro** (created) — FAQ component on homepage bottom: 4 Q&As (40-50 words each), FAQPage JSON-LD schema, per-question deep-dive links, "Read full Methodology" CTA
- **StatCards.astro** — added `highlight?: boolean` prop; murder stat cards now render count in `text-rose-600` site-wide
- **`area/[slug].astro`, `region/[slug].astro`** — Murders (YTD) card passes `highlight: true`
- **`statistics.astro`** — previous year murder rate number fixed to rose-600 (YTD was already rose); all section headings muted to `text-body font-bold text-slate-500`; full dark mode pass
- **`statistics.astro`, `archive/index.astro`, `archive/[year]/[month].astro`** — nav buttons changed from rose outline → neutral grey border pattern
- **`archive/index.astro`** — "Trinidad & Tobago" subtitle muted to slate; crime count text on cards muted; arrow chevron only rose on hover; current month heading stays rose-600
- **`archive/[year]/[month].astro`** — scroll hint arrow muted (removed animate-pulse)
- **`FeedbackToggle.astro`** — background changed from `bg-white` → `bg-slate-50` for visual separation
- **Areas/regions/compare pages** — responsive padding fixed (`px-4` → `px-4 sm:px-6 lg:px-8`) to align with header
- **DESIGN-TOKENS.md** — v1.8: muted section heading rule codified, antipattern added, page-type distinction documented

### User Journey Overhaul — "Lead with the Story" (Feb 19)

- **HomepagePulse.astro** (created) — live Trinidad stats below country card: incidents this week (±%), top area, murders, latest headline, CTA to dashboard
- **DashboardStory.astro** (created) — narrative summary at top of dashboard: week-over-week incidents, top area, murder trend
- **AreaNarrative.astro** (created) — "This Week in [Area]" prose with contextual CTAs (compare, archive) and "New Since Last Visit" badge slot
- **Homepage** (`index.astro`) — Trinidad card now links directly to dashboard (skip modal), restructured layout: Trinidad + pulse grouped, Coming Soon cards below
- **Area detail** (`area/[slug].astro`) — added AreaNarrative, contextual compare prompt (suggests related area), "New since your last visit" badge (localStorage)
- **Dashboard** (`dashboard.astro`) — added DashboardStory after notification banner
- **DESIGN-TOKENS.md** — v1.7: Feature Index table, Live Pulse Indicator / Alert Badge / Contextual CTA Links patterns
- **Gotcha:** "New Since" badge uses localStorage key `crimehotspots_area_visit_{slug}`, client-side only

### Headlines Dark Mode & CSS Minimalism Polish (Feb 18)

- **CrimeCard.astro:** Muted badges (multi-color → neutral `bg-slate-200`/`text-slate-600`), unified grey tones, `font-medium` weight, View Details muted
- **CrimeDetailModal.astro:** Full dark mode — shell, header, headline, details grid, action buttons, share buttons, JS-generated metadata/summary/details
- **Headlines accordion:** Dark mode for server-rendered + JS-generated accordions, count pills match dashboard Top Areas style
- **Filter tray:** Dark mode bg fix (`/90` opacity syntax), custom select chevron SVG (light/dark), `overflow-y-auto`, `color-scheme: dark` for native date icons
- **Hero.astro:** Added `sm:px-6 lg:px-8` padding alignment with header
- **Layout.astro:** Added `--ch-pill-bg`/`--ch-pill-text` CSS vars, `color-scheme: dark` for native form controls
- **"Showing X of Y" text:** Muted to match "Data as of" and "View Archive" tone
- **DESIGN-TOKENS.md:** Updated with pill CSS vars

### Design System Audit — Full Token Pass (Feb 17)
- **Type scale:** 8 tokens → 4 strict levels: `text-display` (32px), `text-heading` (22px), `text-body` (18px), `text-caption` (12px)
- **Font weights:** Only `font-normal` and `font-bold` — `font-semibold` eliminated from headings
- **IslandSelectorModal.astro** created — replaces 4 near-identical modals (`HeadlinesModal`, `DashboardModal`, `ArchivesModal`, `AreasModal`). Backward-compat aliases: `window.openDashboardModal()` etc.
- **Card opacity standardized:** all `bg-white/70`, `bg-white/80`, `bg-white/90` → `bg-white/85`
- **`gray-*` → `slate-*`** audit (DashboardInfoCards)
- **`border-radius.lg`** changed from 8px → 12px in tailwind.config.mjs
- **`min-h-button`** named token added (22px)
- **`mt-30`** in footer → `mt-16` (8px grid fix)
- **Leaflet cluster hex colors** → rose palette CSS vars
- **Pages polished:** `crime/[slug].astro`, `blog/[slug].astro`, `headlines.astro`, `areas.astro`
- **`aria-hidden="true"`** on timeline dots in headlines (a11y)
- **Filter tray width** → `max-w-[min(20rem,calc(100vw-2rem))]` (375px phone fix)
- **Blog content:** `max-w-prose` (65ch) wrapping `<Content />`
- **Share buttons:** platform colors fixed (were `bg-slate-400`)
- **DESIGN-TOKENS.md:** Updated to v1.4 with new type scale
- **Files deleted:** `HeadlinesModal.astro`, `DashboardModal.astro`, `ArchivesModal.astro`, `AreasModal.astro`
- **Files created:** `IslandSelectorModal.astro`, `docs/claude-context/ux-audit-progress.md`

### UX Foundation Improvements (Feb 9)

- **Data freshness indicator** on dashboard — "Data as of [date]" below subtitle, updates with year filter
- **Share buttons on area pages** — X, Facebook, WhatsApp (same pattern as crime detail pages)
- **RSS feed** (`/rss.xml`) — blog posts + latest 20 crime headlines, pre-rendered, `<category>` tags per crime type
- **RSS autodiscovery** `<link>` in Layout `<head>`, visible RSS icon in footer + blog index
- **Empty state for headlines filters** — friendly message when filters return zero results
- **Crime type tooltips on dashboard** — InfoPopup explaining all 9 crime type definitions
- **Dataset license field** — CC BY 4.0 added to murder count structured data (GSC fix)
- **Files created:** `src/pages/rss.xml.ts`
- **Files modified:** `dashboard.astro`, `area/[slug].astro`, `Layout.astro`, `headlines.astro`, `blog/index.astro`, `murder-count.astro`
- **Installed:** `@astrojs/rss`

### Trending Hotspots Component (Feb 8)
- "Hot Areas This Week" (top 5 by crime count, 7-day window, server-rendered) + "Your Recent Views" (localStorage, client-side)
- Placed on crime detail pages + CrimeDetailModal
- **Files created:** `src/lib/trendingHelpers.ts`, `src/components/TrendingHotspots.astro`
- **Files modified:** `safetyHelpers.ts` (exported `toDate()`), `modalHtmlGenerators.ts` (`generateTrendingHotspotsHTML()`)

### Link Checker Automation (Feb 7)
- Bi-weekly dead link detection for news article source URLs in Trinidad CSVs
- HEAD-then-GET retry, trigger chaining for GAS 5-min limit, email reports
- **Files created:** `google-apps-script/trinidad/linkChecker.gs`

### Weekly Blog Automation (Feb 6)
- Fully automatic: Monday 10 AM trigger → CSV stats → Claude Haiku writes blog → GitHub commit → Cloudflare deploys
- 4-layer validation (min crimes, freshness, backlog, duplicate)
- **Gotcha:** Must use CSV-based `fetchCrimeData()`, not sheet `.getDataRange()` (GAS timezone mismatch)
- **Files created:** `google-apps-script/trinidad/weeklyBlogAutomation.gs`

### Blog Internal Linking (Feb 6)
- "More Weekly Reports" on blog post pages (3 recent same-country posts)
- **Files modified:** `src/pages/blog/[slug].astro`

### CrimeDetailModal Refactoring (Feb 6)
- 918 → 261 lines. Thin orchestrator importing 5 modules from `src/scripts/modal*.ts`
- Eliminated duplicated utilities (now imports from `src/lib/`)
- **Gotcha:** Area detail pages use `areaCrimes` only in `window.__crimesData`

### UX Navigation Overhaul (Feb 5)
- BottomNav.astro (mobile tab bar), RelatedCrimes.astro (actual crime cards)
- Header: direct links on Trinidad pages, active section indicator
- Footer: added "Browse" column with primary nav
- **Config:** `countries.ts` — `showInBottomNav`, `icon` fields
- **Gotcha:** `getActiveSection(path)` detects current section for highlighting

### Routes Centralization (Feb 4)
- `src/config/routes.ts` — single source of truth for all internal routes
- Static: `routes.trinidad.dashboard`, dynamic: `buildRoute.crime(slug)`
- **Gotcha:** Inline scripts (`<script is:inline>`) can't import modules — have "keep in sync with routes.ts" comments

### Section Picker Modal (Feb 2)
- Homepage island click opens section picker instead of navigating to dashboard
- Sections driven from `countries.ts` config
- **Files created:** `src/components/SectionPickerModal.astro`

### Facebook Post Submitter (Feb 2)
- GAS web app for manual Facebook crime post entry → Claude Haiku extraction → Production sheet
- Year toggle: 2026 → pipeline, 2025 → FR1 sheet
- **Files created:** `google-apps-script/trinidad/facebookSubmitter.gs`

### Modal Pageview Tracking (Feb 2)
- `pushState` on modal open → Cloudflare + GA4 both detect it as pageview
- `popstate` listener closes modal on browser back button
- **Files modified:** `CrimeDetailModal.astro`

---

## January 2026

### Dynamic OG Image (Jan 28)
- Build-time OG image for murder count page (satori + sharp → 1200x630 PNG)
- **Files created:** `src/lib/generateOgImage.ts`

### Murder Count Performance (Jan 28)
- Turnstile made opt-in (`includeTurnstile` prop, defaults false)
- Pagefind disabled on murder count page
- **3 fewer requests, ~60-80KB saved**

### Security Audit (Jan 27)
- Removed stale Google Fonts from CSP, added Secure cookie flag, GAS email escaping
- **Grade: A-**

### LCP Font Optimization (Jan 27)
- Self-hosted Inter font (woff2), removed Google Fonts external requests
- Hero compact variant + slot support

### Safety Context System (Jan 26)
- Area crime scoring (1-10), contextual tips (high/neutral/low risk)
- **Files created:** `src/lib/safetyHelpers.ts`, `src/components/SafetyContext.astro`
- **Gotcha:** Modal needs `window.__crimesData` populated; scoring uses 90-day rolling window

### Hybrid → Full SSR Switch (Jan 26 → Feb 4)
- Crime pages switched from 90-day prerender to full SSR + CDN cache
- **Reason:** Old pages 404'd silently, GSC reported 446+ pages as canonical issues
- **Never:** Add `prerender = true` back to `[slug].astro`

### SEO Phase 1 (Jan 23)
- Statistics three-tier system, murder count title optimization, internal linking network
- Dynamic year handling (auto-calculates currentYear/previousYear)

### Murder Count Page (Jan 22)
- iOS flip counter, share buttons, responsive scaling
- **Files:** `murder-count.astro`, `FlipCounter.astro`, `flip-counter.css`, `flipCounter.ts`

### Related Crime Pills (Jan 10)
- Visual pills for related crime types (gray) next to primary (rose)
- CSV parsing fix for quoted comma fields in area aliases

### Report Page Refactoring (Jan 9)
- Extracted `formHelpers.ts` + `reportValidation.ts`, 22% line reduction
- Report Issue button added to CrimeDetailModal
- **Gotcha:** Turnstile explicit mode — use EITHER data attributes OR render() config, not both
- **Gotcha:** Components on same page need `idPrefix` for unique IDs
