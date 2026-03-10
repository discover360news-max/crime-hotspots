# Crime Hotspots — UX, Shareability & Civic Extension Plan
**Audit Date:** March 9, 2026
**Context:** Full site review conducted via Playwright. Covers UX gaps, shareability failures, and civic extension readiness (Bill Watch, Constituency Voice, Accountability Gap).

---

## How to Use This Document

Work through items in phase order. Before closing any item:
1. Revisit the affected page in the browser
2. Confirm the fix achieves the intended outcome for the user
3. Log result, challenges, and any follow-up items below the task

Status key: `[ ]` pending · `[~]` in progress · `[x]` complete · `[!]` blocked

---

## Phase 1 — Immediate Fixes (Credibility & Broken Things)

These erode user trust and should be resolved before anything else.

---

### P1-01 · Remove or contextualise the 2025 data banner
**Page:** `/trinidad/dashboard/`
**Problem:** "2025 crime data is currently being updated" banner appears as the first visible content after the breadcrumb. It's been sitting there since at least early 2026 (now March). Directly undermines confidence in data freshness.
**Fix:** Either complete the 2025 data backfill and remove the banner, or replace with a specific message ("2025 archive data is available — some months may be incomplete") that doesn't cast doubt on current 2026 data.

- [x] Determine actual status of 2025 data completeness
- [x] Update or remove banner accordingly
- [x] Re-review dashboard to confirm first visible content is positive

**Status:** `[x]`
**Result:** Banner removed. Dashboard now opens with title → "Crime Statistics Dashboard for 2026" → data freshness date → stat cards. No doubt cast on data.
**Challenges:** 2025 data is mostly complete (Jun 20–Oct is the gap) but Kavell decided not to draw attention to it.
**Solution:** Set `enabled: false` in `astro-poc/src/config/siteNotifications.ts`. One-line change. The config has a comment to re-enable if needed.

---

### P1-02 · Fix broken empty component on homepage
**Page:** `/` (homepage)
**Problem:** A `button "Show information"` floats in empty space between the FAQ section and the footer. Nothing is visible around it. Appears to be an orphaned or broken component. Creates a large dead zone on the page.
**Fix:** Identify the component, either populate it with content or remove it entirely.

- [x] Locate the component in source
- [x] Decide: populate or remove
- [x] Re-review homepage — no unexplained gaps or orphaned elements

**Status:** `[x]`
**Result:** Button removed. Homepage ends cleanly at QuickAnswers → footer. A visible gap between FAQ and footer remains due to sparse page content + footer `mt-16` — this is expected and will be resolved by P2-04 (Explore section).
**Challenges:** Removing the button exposed the natural viewport gap that was previously masked. Not a bug — a content density issue.
**Solution:** Deleted the orphaned `<div class="mt-16 flex items-center gap-2">` block and removed the unused `InfoPopup` import from `astro-poc/src/pages/index.astro`.

---

### P1-03 · Fix "Other Areas" on area pages to show relevant areas
**Page:** `/trinidad/area/[slug]/`
**Problem:** "Other Areas in Trinidad" section shows random unrelated villages. Port of Spain shows "Indian Walk, Madras Settlement, Moos." This reads like a bug and damages the credibility of the recommendations.
**Fix:** Replace random areas with areas in the same region, or the top areas by crime count nationally. Region-matching is the most useful to users.

- [x] Understand how "Other Areas" is currently populated
- [x] Change logic to same-region areas, or top areas by crime
- [x] Re-review area page — related areas should be obviously relevant

**Status:** `[x]`
**Result:** Both sections now show relevant areas. "Other Areas in [Region]" is sorted by all-time crime count descending (most active nearby areas first). "Other Areas in Trinidad" replaced the random shuffle with the top 3 highest-crime areas nationally outside the current region — Port of Spain, San Juan, San Fernando consistently appear.
**Challenges:** Port of Spain is the only area in its own region, so it only shows the cross-region section. Confirmed correct on Chaguanas page which has both sections populated meaningfully.
**Solution:** Replaced `.sort(() => Math.random() - 0.5)` with `.sort((a, b) => b.crimeCount - a.crimeCount)` on both `relatedAreas` and `otherRegionAreas`. Added `.map()` step to compute `crimeCount` (all-time total) before sorting. Two targeted edits in `astro-poc/src/pages/trinidad/area/[slug].astro` lines 158–187.

---

### P1-04 · Fix Google swg-basic.js console errors (8 per page)
**Page:** All pages
**Problem:** 8 console errors on every page from Google's Subscribe with Google script. Harmless to users but indicates a misconfigured or unused integration. Noise in the console makes legitimate errors harder to spot.
**Fix:** Determine if Subscribe with Google is actively used. If not, remove the script entirely.

- [x] Determine if swg-basic.js integration is intentional/active
- [x] Remove or properly configure
- [x] Re-check console — zero errors from this source

**Status:** `[x]`
**Result:** Script removed from all pages. Console errors gone.
**Challenges:** Integration was intentionally added for Google News Publisher Center but is not yet approved/active. Running it was generating 8 errors per page with no benefit.
**Solution:** Removed the `swg-basic.js` script tag and init block from `Layout.astro`. Left a comment with the product ID and re-add instructions for when Publisher Center approval comes through. Scope it to article pages only (not all pages) when re-adding.

---

## Phase 2 — High-Impact UX Fixes

These don't require new data — just better surfacing and packaging of what already exists.

---

### P2-01 · Surface the filter panel on the dashboard
**Page:** `/trinidad/dashboard/`
**Problem:** "Filters ›" reads like a navigation link. The year, crime type, region, and area filters — the most powerful feature on the site — are hidden behind it. Most users never discover them.
**Fix:** Make the filter button visually distinct from navigation. Consider showing the filter controls inline or as a visible sidebar rather than a hidden drawer. At minimum, differentiate it clearly from text links.

- [x] Review current filter button design in context
- [x] Explore inline vs drawer vs sidebar approaches
- [x] Implement chosen approach
- [x] Re-review dashboard — filters should be discoverable without hunting

**Status:** `[x]`
**Result:** Year filter moved inline to a sticky filter bar that sits below the site header and pins on scroll. Drawer now contains only Crime Type, Region, and Area. Filters button uses a filled background + funnel icon — visually distinct from nav links. Filters button turns rose when drawer filters are active.
**Challenges:** Option label "2026 Data" was cramping the native select arrow — trimmed to just "2026".
**Solution:** Added `#filterBar` sticky div after the hero section (`top-16 z-30`). Moved `#yearFilter` select inline. Passed `showYearFilter={false}` to FiltersTray. Updated active state logic to only track drawer filters (Crime Type, Region, Area) — year state is self-evident in the inline select. `scroll-margin-top` on `#mapContainer` bumped from 7rem to 8rem to clear both sticky bars.

---

### P2-02 · Pre-load a default comparison on the Compare page
**Page:** `/trinidad/compare/`
**Problem:** Page loads with two blank dropdowns and empty space. Users don't know what the output looks like and most leave before selecting anything.
**Fix:** Pre-load Port of Spain vs Tunapuna-Piarco (the top two crime areas) as the default state. Users arrive and immediately see the feature working. They can then change the selections.

- [x] Check how comparison data is rendered (client-side JS, URL params, etc.)
- [x] Set default selections via URL params or JS initialisation
- [x] Confirm default loads correctly on page arrival
- [x] Re-review compare page — meaningful comparison visible immediately

**Status:** `[x]`
**Result:** Page now loads Port of Spain vs San Juan by default — dropdowns pre-selected, full comparison rendered immediately. URL stays clean on first load; params are pushed as usual when user changes selections.
**Challenges:** Original plan said "Port of Spain vs Tunapuna-Piarco" but those are regions, not areas. Top two areas by all-time crime count (from CSV cache) confirmed as Port of Spain (330) and San Juan (214).
**Solution:** Added a 5-line `else if (!initialA && !initialB)` branch after the existing URL-param conditional in `compare.astro`. Sets `selectA`/`selectB` values and calls `renderComparison('port-of-spain', 'san-juan')`. No URL mutation on default load.

---

### P2-03 · Surface the weekly blog on the dashboard
**Page:** `/trinidad/dashboard/`
**Problem:** The weekly crime report is buried in the footer (small link) and once on the Statistics page. It is the best organic content on the site and the strongest reason for repeat visits. It should be on the dashboard.
**Fix:** Add a "Latest Weekly Report" card or banner to the dashboard, above or near the Quick Insights section. Link to the most recent blog post with a brief summary line.

- [x] Identify best placement on dashboard (above Quick Insights, below stat cards, etc.)
- [x] Build the component — latest blog post title, date, 1-line summary, read link
- [x] Confirm it auto-updates when a new blog post is published
- [x] Re-review dashboard — weekly report is visible without scrolling to footer

**Status:** `[x]`
**Result:** Latest weekly blog post now surfaces in the DashboardStory card as a right column. Title (line-clamp-1), date, read-time label, and "Read →" link are visible immediately on page load. Date/Read row locked to the bottom of the column, level with the last line of the live data text. Auto-updates on every build — no manual work needed when a new post is published.
**Challenges:** dark:text-rose-400 made the "Read →" link appear pink vs the rest of the dashboard's rose-600 links. Spacing required two rounds: hero padding reduced (py-8→py-6), then wrapper py balanced against Crime Statistics heading (removed pt-4, set wrapper py-6). Date/Read row needed mt-auto + items-stretch on the parent to lock to the card bottom.
**Solution:** Modified `DashboardStory.astro` only — added `getCollection('blog')` + `buildRoute` imports, fetched latest TT post in frontmatter, restructured card to two-column flex layout with vertical/horizontal dividers. Right column is `flex flex-col` with `mt-auto` on the date row. Link uses plain `text-rose-600` matching all other dashboard action links.

---

### P2-04 · Improve homepage second-action flow
**Page:** `/`
**Problem:** After the country card and FAQ section, the homepage offers no guided path for a new visitor who wants to explore. A first-time visitor who doesn't immediately click the dashboard has nowhere obvious to go.
**Fix:** Add a short "Explore" section between the FAQ and footer — e.g. 3 tiles: "See your area's risk level" → Areas, "Track the murder count" → Murder Count, "Read this week's report" → Blog. Simple, direct, no new content needed.

- [x] Design 3-tile explore section (text + links only, no new imagery needed)
- [x] Add above footer on homepage
- [x] Re-review homepage — clear second and third paths for a new visitor

**Status:** `[x]`
**Result:** Explore section added between the country cards and QuickAnswers. 3-column grid (1-col mobile, 3-col sm+): "See your area's risk level" → Areas, "Track the murder count" → Murder Count, "Read this week's report" → Blog. Each tile: bold title → muted xs description → rose arrow link. QuickAnswers moved to last position on page.
**Challenges:** Parent `<section>` has `text-center` — required `text-left` on the grid to prevent centered body text inside narrow tiles.
**Solution:** Added Explore `<div>` inline in `index.astro` before `<QuickAnswers />`, using same pill label + h2 header pattern and same frosted card style (`bg-white/70 rounded-2xl shadow-sm border`) as QuickAnswers. No new component needed — page is 213 lines, well under 500.

---

### P2-05 · Strengthen visual hierarchy across key pages
**Page:** Dashboard, Area pages, Statistics
**Problem:** Everything reads at similar visual weight. Risk scores, key stats, and weekly summaries don't visually dominate. Users must read everything to find what matters.
**Fix:** Not a full redesign — targeted emphasis. The risk score on area pages should be the biggest number. The weekly summary text should be styled as a callout, not body text. The Quick Insights section on the dashboard should take more vertical space.

- [x] Identify 3-5 specific elements that need weight increases
- [x] Apply font size / colour / spacing changes (within existing design tokens)
- [x] Re-review area page and dashboard — key numbers dominate at a glance

**Status:** `[x]`
**Result:**
**Challenges:**
**Solution:**

---

## Phase 3 — Shareability

The single highest-leverage growth mechanism. Data that can't be shared stays in the site.

---

### P3-01 · Build shareable stat cards
**Pages:** Dashboard, Statistics, Area pages
**Problem:** Share buttons on the Statistics page share a URL. Nothing on the dashboard or area pages generates something worth forwarding. What spreads on WhatsApp in TT is a card with one number: "Robberies in Port of Spain up 74% this year."
**Fix:** For each key stat (murders, robberies, risk score), add a "Share this stat" button that either:
  (a) Generates an OG-style image card on the fly (server-side), or
  (b) Opens a pre-formatted WhatsApp/X message with the stat text + URL

Option B is faster to build and still highly effective. Option A is more impactful longer term.

- [x] Decide: pre-formatted text share (quick) or generated image card (impactful)
- [x] Implement for top-level stats on Statistics page first
- [x] Extend to area pages (area-specific stat share)
- [ ] Extend to dashboard stat cards (deferred — needs client-side JS for filter-aware share)
- [ ] Re-review — test sharing flow end-to-end on mobile

**Status:** `[~]`
**Result:** WA share icon added inline-right on each stat card's YoY/subtitle row. Statistics page: Murders + Robberies cards. Area pages: Murders YTD + Risk Level cards. Dashboard deferred (StatCard.astro is JS-driven; share text must reflect active filter state — needs client-side approach). Option A (image cards) noted as upgrade path for later.
**Challenges:** `canonicalUrl` in statistics.astro is defined after the statCardsData block — `buildShareText` referenced it via closure causing TDZ error at build time. Fixed by defining `statsPageUrl` const before the function.
**Solution:** `shareText?: string` added to `StatCards.astro` interface. WA link (`<a href="wa.me/?text=...">`) renders inline-right of YoY badge or subtitle in each card. `buildShareText()` helper in statistics.astro. Share text messages always name "Trinidad and Tobago" explicitly.

---

### P3-02 · Add WhatsApp-optimised area summary
**Page:** `/trinidad/area/[slug]/`
**Problem:** The weekly area summary ("Incidents in Port of Spain dropped 29% this week") is the most shareable sentence on the site but has no dedicated share button next to it.
**Fix:** Add a WhatsApp share button directly on the weekly summary text, pre-populating: "[Area] this week: [summary sentence]. Full data: [URL]". One tap, ready to forward.

- [x] Identify the weekly summary element on area pages
- [x] Add WhatsApp share button alongside existing X/FB/WA share row
- [x] Pre-populate with summary text + URL
- [x] Re-review area page — share button is immediately visible alongside summary

**Status:** `[x]`
**Result:** WA icon added to the right end of the AreaNarrative CTAs row (`ml-auto` separator from text links). All 4 narrative branches covered: up / down / flat / zero incidents. Icon-only style, muted slate + rose hover — consistent with stat cards. Share text mirrors the summary sentence with "Full crime data for Trinidad and Tobago: [url]" appended.
**Challenges:** None.
**Solution:** `shareText` computed in `AreaNarrative.astro` frontmatter from `areaSlug` (URL constructed internally — no new prop needed). WA `<a>` link added at end of `.flex` CTAs row with `ml-auto`.

---

## Phase 4 — Civic Extension Foundation

Do not start Phase 4 until Phases 1-3 are complete. The civic extension is built on top of a clean, credible, shareable platform — not alongside a broken one.

---

### P4-01 · Add MP/constituency mapping to area and region pages
**Pages:** `/trinidad/area/[slug]/`, `/trinidad/region/[slug]/`
**Problem:** Crime data is organised by administrative region, which roughly (but not exactly) maps to parliamentary constituencies. Nothing currently connects crime data to the sitting MP. This is the sentence that transforms the site: "Port of Spain North-West — 152 crimes — MP: [name], [party]."
**Fix:** Build a constituency-to-MP lookup (static data — 41 seats, infrequently changes). Display on region pages and where applicable on area pages.

- [ ] Compile full TT parliamentary constituency list (41 seats) with current MPs and parties
- [ ] Map existing region slugs to constituency names (note: boundaries don't perfectly align)
- [ ] Build static lookup data file
- [ ] Add MP display component to region and area pages
- [ ] Re-review region page — MP name, party, and constituency visible in context of crime data

**Status:** `[ ]`
**Result:**
**Challenges:**
**Solution:**

---

### P4-02 · Add constituency filter alongside regional filter
**Page:** `/trinidad/dashboard/`
**Problem:** Dashboard filters by administrative region, not parliamentary constituency. These boundaries don't perfectly align. Civic users (journalists, NGOs, researchers) want to filter by constituency.
**Fix:** Add a "Constituency" filter option to the existing filter panel, mapped from the lookup built in P4-01. Where data is ambiguous (area crosses boundaries), show in both.

- [ ] Confirm constituency-to-region mapping completeness from P4-01
- [ ] Add constituency combobox to filter panel
- [ ] Handle boundary ambiguity gracefully
- [ ] Re-review dashboard filter panel — constituency filter works and returns relevant results

**Status:** `[ ]`
**Result:**
**Challenges:**
**Solution:**

---

### P4-03 · Bill Watch — parliamentary bills tracker
**Page:** New page `/trinidad/bills/` (or `/parliament/bills/`)
**Problem:** No civic accountability layer exists. Bill Watch is the first civic feature — tracking active parliamentary bills with plain-language summaries and constituency relevance.
**Approach:**
- Source: Parliament of TT website (bills and acts pages — manual or scraped)
- Display: bill name, plain-language summary, status (first reading / committee / passed), date
- Link: "How does this affect [your area]?" — connects bill topics to area data where applicable
- No community input required — this is purely informational

- [ ] Assess data availability on parliament.gov.tt
- [ ] Decide scrape vs manual maintenance vs hybrid
- [ ] Design page layout
- [ ] Build initial data layer (even if static/manual to start)
- [ ] Add to site navigation
- [ ] Re-review bills page — at least 5 active bills with status and plain-language summary

**Status:** `[ ]`
**Result:**
**Challenges:**
**Solution:**

---

### P4-04 · Constituency Voice — community issue reporting
**Page:** New page `/trinidad/voice/` or per-area
**Problem:** Currently only "Report a Crime" exists. Civic extension needs a parallel "Report a Community Issue" flow — potholes, flooding, abandoned lots, infrastructure failures — mapped to constituency.
**Approach:**
- Extend or duplicate the existing report form
- Add issue category (separate from crime types)
- Map submission to constituency based on location input
- Issues feed into a public record visible per constituency
- **Requires a credible face attached before launch** — anonymous community reporting needs a trusted name behind it in TT

- [ ] Confirm trusted person/org is attached to this feature before building (dependency)
- [ ] Design issue categories
- [ ] Build report form (extend existing)
- [ ] Build public issue log per constituency
- [ ] Add moderation layer (issues are reviewed before public display)
- [ ] Re-review voice page — submission works, public log shows issues by constituency

**Status:** `[ ]` (blocked until P4-01 complete and face identified)
**Result:**
**Challenges:**
**Solution:**

---

### P4-05 · Accountability Gap — the synthesis layer
**Page:** New page `/trinidad/accountability/` or per-constituency
**Problem:** The gap between what bills promise and what constituencies experience is the core civic product. This is what gets cited, shared, and funded.
**Approach:**
- Per-constituency view: crime trend + relevant bills + community issues reported + MP voting record
- "Promised vs Delivered" tracker (manually maintained, updated per budget/bill cycle)
- This is the grant application headline

- [ ] Complete P4-01 through P4-04 first (hard dependency)
- [ ] Design per-constituency accountability view
- [ ] Build MVP with at least Port of Spain and Tunapuna-Piarco as pilot constituencies
- [ ] Re-review accountability page — gap between data and governance is visible and shareable

**Status:** `[ ]` (blocked until P4-01 through P4-04 complete)
**Result:**
**Challenges:**
**Solution:**

---

## Technical Debt & Known Issues (Non-Blocking)

| Issue | Priority | Notes |
|---|---|---|
| `D'abadie` and `D'Abadie` duplicate area entries in dropdowns | Low | Data normalisation needed |
| `North Trinidad`, `Online`, `Trinidad`, `Unknown` as area options | Low | Junk data entries in area list |
| `San Rafael` / `San Raphael` duplicate spellings | Low | Alias needed |
| Logo illegible at mobile nav sizes | Low | Requires logo asset update |
| Homepage hero subtext is generic | Low | "Live crime data..." — says nothing differentiating |

---

## Civic Extension Income Path (Reference)

Not a build task — context for grant applications when ready.

| Funding Source | Fit | Notes |
|---|---|---|
| Open Society Foundations | High | Caribbean civic tech, accountability platforms |
| USAID Democracy & Governance | High | TT qualifies, Caribbean focus active |
| IDB Lab (Inter-American Dev Bank) | High | Innovation + civic data in LAC region |
| Caribbean Development Bank | Medium | Less focused on civic tech specifically |
| Media data licensing (Guardian TT, Newsday) | Medium | Structured data they can't produce themselves |

Pitch headline: *"A civic accountability platform tracking parliamentary bills, constituency crime data, and the measurable gap between legislative promises and community outcomes in Trinidad and Tobago."*

---

## Session Log

| Date | Phase | Items Completed | Notes |
|---|---|---|---|
| March 9, 2026 | Audit | Full site review | Homepage, Dashboard, Statistics, Compare, Area pages reviewed |
| March 9, 2026 | Phase 1 | P1-01, P1-02 | P1-01: disabled 2025 data banner (`siteNotifications.ts` `enabled: false`). P1-02: removed orphaned InfoPopup button from homepage (`index.astro`). |
| March 9, 2026 | Phase 1 | P1-03 | Replaced random area shuffle with crime-count sort on both `relatedAreas` and `otherRegionAreas` in `[slug].astro`. "Other Areas in Trinidad" now always shows top-crime national areas. |
| March 9, 2026 | Phase 1 | P1-04 | Removed swg-basic.js from `Layout.astro`. Integration not active (Publisher Center approval pending). Left reinstatement comment with product ID + scope note (article pages only). |
| March 10, 2026 | Phase 2 | P2-01 | Sticky filter bar added below hero (`top-16 z-30`). Year select moved inline. Filters button: filled bg + funnel icon — distinct from nav links. Drawer keeps Crime Type / Region / Area. Drawer active state turns button rose. "2026 Data" label trimmed to "2026". `scroll-margin-top` bumped to 8rem. Pattern flagged as candidate for global utility control design. |
| March 10, 2026 | Phase 2 | P2-02 | Compare page pre-loads Port of Spain vs San Juan on first visit. 5-line addition to `compare.astro` — `else if` branch sets dropdowns + calls `renderComparison`. URL stays clean on default load. Corrected brief: PoS/Tunapuna-Piarco are regions not areas; top 2 areas by all-time count used instead. |
| March 10, 2026 | Phase 2 | P2-02 follow-on | Compare page restructured to match dashboard visual pattern: rose gradient hero section, sticky selector bar (`sticky top-16 z-30`, `border-b`, `backdrop-blur-sm`) with Area A / Area B inline selects using `filter-select` + `max-w-[180px]`. Redundant subtitle removed. `data-pagefind-body` moved to `<main>`. |
| March 10, 2026 | Phase 2 | P2-01 deferred | "Compare areas →" contextual link added to Top Areas card header on dashboard, left of existing "View all →". Both links now muted slate (`text-slate-400`) with rose hover — consistent secondary action treatment. Pipe separator between them. |
| March 10, 2026 | Phase 2 | P2-03 | Latest weekly blog post surfaced in DashboardStory card as right column. Two-column layout: left = live weekly summary (existing), right = blog title (line-clamp-1) + date + "Read →". Date/Read locked to card bottom via mt-auto. Hero py reduced (py-8→py-6), wrapper py-6, Crime Statistics pt-4 removed for balanced spacing. Link colour corrected to text-rose-600 (not dark:rose-400). Single file change: `DashboardStory.astro`. |
| March 10, 2026 | Phase 2 | P2-04 | Explore section added to homepage. 3 tiles (Areas, Murder Count, Blog) in `grid-cols-1 sm:grid-cols-3`, placed between country cards and QuickAnswers. Matches QuickAnswers header pattern (rose pill + h2). Tile hierarchy: bold title → muted xs description → rose arrow link. `text-left` on grid overrides parent `text-center`. Single file change: `index.astro`. |
| March 10, 2026 | Phase 3 | P3-01 | WA share icon added inline-right of YoY badge on stat cards. Statistics page: Murders + Robberies. Area pages: Murders YTD + Risk Level. `shareText?` added to `StatCards.astro` interface. `buildShareText()` helper in `statistics.astro`. Dashboard deferred (filter-aware values need client-side approach). Build fix: `statsPageUrl` const defined before helper to avoid TDZ. |
| March 10, 2026 | Phase 3 | P3-02 | WA icon added to AreaNarrative CTAs row (far-right via `ml-auto`). All 4 narrative branches covered. Share text: "[Area] this week: [summary]. Full crime data for Trinidad and Tobago: [url]". URL constructed from existing `areaSlug` prop — no new prop needed. Single component change: `AreaNarrative.astro`. |

---

*Plan created: March 9, 2026 · Next review after Phase 1 complete*
