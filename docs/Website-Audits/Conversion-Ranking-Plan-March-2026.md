# Conversion, Ranking & UX Improvement Plan
**Audit Date:** March 30, 2026
**Overall Score:** 6.4 / 10 → Target: 8.0 / 10
**Basis:** Full UX + marketing audit against NNG, Baymard, ConversionXL, Fogg Behavior Model frameworks.

---

## How to Use This Document

Work through sessions in order. Sessions are sized for ~1–3 hours each. Before marking anything `[x]`:
1. Review the affected page in the browser
2. Confirm the fix achieves the stated goal
3. Run `npm run build` — must pass

Status key: `[ ]` pending · `[~]` in progress · `[x]` complete · `[!]` blocked

---

## Priority Index (Highest ROI First)

| # | Item | Session | Impact |
|---|---|---|---|
| 1 | Newsletter capture — homepage above fold | S2 | Retention |
| 2 | Ko-fi in-page embed — stop off-site redirect | S3 | Revenue |
| 3 | Body copy `text-xs` → `text-sm` across content pages | S1 | Trust / SEO |
| 4 | Gmail → custom domain email (B2B trust) | S1 | B2B Conversion |
| 5 | Dataset JSON-LD on Murder Count page | S5 | SEO |
| 6 | Newsletter capture on blog index | S2 | Retention |
| 7 | Support page urgency copy + supporter count display | S1 | Revenue |
| 8 | Hero CTA button touch target fix | S2 | Mobile UX |
| 9 | RelatedCrimes on mobile (crime detail page) | S4 | Engagement |
| 10 | Business Solutions pricing signal | S7 | B2B Conversion |

---

## Session 1 — Copy & Trust Quick Wins
**Effort:** ~2 hours | **Files:** 5–7 content pages + 1 component
**Goal:** Fix the items that damage credibility in <1 read — the fixes that cost almost nothing but are currently costing conversions.

---

### S1-01 · Promote body copy from `text-xs` to `text-sm` on content pages
**Why:** Body copy at 12px fails WCAG 2.1 practical readability standards and signals "fine print / hobbyist" to B2B buyers and journalists at exactly the wrong moment.
**Affected pages:** About, Methodology, FAQ, Contact, Business Solutions, Help Centre articles
**Fix:** Find every paragraph that uses `text-xs` and is body copy (not a label, pill, or caption). Promote to `text-sm` minimum. Do not change labels, pills, timestamps, or data cells.

- [x] Audit `about.astro` — find and promote body paragraph `text-xs`
- [x] Audit `methodology.astro` — same
- [x] Audit `faq.astro` — FAQ answers are the most critical (often 80–120 word answers at 12px)
- [x] Audit `contact.astro` — intro paragraphs
- [x] Audit `business-solutions.astro` — "Why Choose Crime Hotspots" copy + product descriptions + ideal client lists
- [x] Build and confirm — no layout breakage

**Acceptance:** Every body paragraph on above pages renders at ≥14px. Labels, pills, timestamps remain unchanged.

---

### S1-02 · Change B2B contact email from Gmail to custom domain
**Why:** `discover360news@gmail.com` as the contact for insurance firms and risk consultancies is the single biggest trust-killer in the B2B funnel. Enterprise procurement processes flag Gmail as a vendor disqualifier.
**Fix:** Update the contact email in `business-solutions.astro` and `data-capability-sheet.astro` (and `capabilitySheetConfig.ts` if it drives the value there). Use `contact@crimehotspots.com` or equivalent once set up. If the domain email isn't live yet, change the displayed text to `[contact@crimehotspots.com]` with a note in source, so it's one swap when ready.

- [x] Find all instances of the Gmail address in source files
- [x] Replace with custom domain address (or placeholder if not yet live)
- [x] Confirm no other Gmail addresses appear on public-facing pages
- [x] Build and confirm

**Acceptance:** No Gmail address appears on any public-facing page. B2B contact email reads `@crimehotspots.com`.

---

### S1-03 · Update Support page — urgency copy + show supporter count
**Why:** Progress bar at 76% (38/50) is a proven conversion accelerator in crowdfunding UX. The current page shows the bar but not the number "38" — weakening the social proof. Proximity-to-goal language sharply increases conversion in the final 25%.
**File:** `src/pages/support.astro` + the component rendering the Ko-fi CTA
**Fix:**
1. Show "38 of 50 supporters" as visible text alongside the progress bar (not just bar %)
2. Change "Help us reach 50 supporters" → "We need 12 more supporters to hit our goal — be one of them"
3. Make the number dynamic from `socialProof.kofi_supporters` and `socialProof.kofi_goal`

- [x] Read `support.astro` and find the goal tracker component/markup
- [x] Add visible supporter count: "38 of 50 supporters"
- [x] Update copy to urgency framing using computed `(goal - current)` remaining
- [x] Remove the off-topic secondary CTAs at page bottom (Report Crime / Help Centre) — they dilute conversion focus
- [x] Build and confirm

**Acceptance:** Support page shows "X of 50 supporters" as readable text. Copy communicates urgency. Bottom of page focuses on the donation, not routing to other features.

---

### S1-04 · Fix stale FAQ content — Jamaica is live
**Why:** The FAQ says Jamaica coverage is "planned for the future" while `/jamaica/mp/` has 63 live profiles, `/jamaica/statistics/` and `/jamaica/murder-count/` are live. This contradiction surfaces on an E-E-A-T credibility page and appears in Google's FAQ rich results.
**File:** `src/pages/faq.astro` (or wherever FAQ content is stored)

- [x] Read FAQ source — find all Jamaica-related Q&As
- [x] Update "planned" language to reflect current state: Jamaica pages live, D1 data pipeline in progress
- [x] While reviewing: check any other time-sensitive answers that reference things as "coming soon" that are now live
- [x] Build and confirm

**Acceptance:** No FAQ answer describes an active feature as "future" or "planned."

---

### S1-05 · Add contextual framing to the MP index pages
**Why:** A user arriving at `/trinidad/mp/` or `/jamaica/mp/` has no idea why MPs appear on a crime data platform. Without framing, it reads as a random people directory. Two sentences of copy transforms the feature into an accountability tool.
**Files:** `src/pages/trinidad/mp/index.astro`, `src/pages/jamaica/mp/index.astro`
**Fix:** Add a short contextual paragraph below the page H1 (or in the hero band):
> "Every constituency in Parliament is responsible for one or more areas. Track crime in your representative's area and compare it against national trends."
Adapt wording for Jamaica appropriately.

- [x] Add 2-sentence framing paragraph to T&T MP index below H1
- [x] Add 2-sentence framing paragraph to Jamaica MP index below H1
- [x] Build and confirm

**Acceptance:** Both MP indexes clearly communicate their purpose to a first-time visitor within 5 seconds.

---

### S1-06 · Add contextual label above MPSidebar on area pages
**Why:** The MPSidebar appears on all area pages but the connection between an MP and a crime area is unexplained. Diaspora users and journalists unfamiliar with T&T geography see a list of names with no "why is this here?"
**File:** `src/components/MPSidebar.astro`
**Fix:** Add a single line of contextual text above the MP names:
> "Elected representative for this area"
This is a copy-only addition to the component.

- [x] Read `MPSidebar.astro`
- [x] Add contextual label above the MP name(s)
- [x] Confirm renders correctly on both `showAll=false` (area) and `showAll=true` (region) variants
- [x] Build and confirm

**Acceptance:** MPSidebar has a label that explains its presence to someone unfamiliar with T&T's parliamentary geography.

---

## Session 2 — Homepage & Blog Conversion
**Effort:** ~2–3 hours | **Files:** `index.astro`, `blog/index.astro`, `Header.astro`, `NewsletterSignup.astro`
**Goal:** The two highest-traffic acquisition pages have no email capture. Fix that.

---

### S2-01 · Add newsletter capture to homepage above fold
**Why:** Homepage has no email capture anywhere. Users who arrive via organic search ("trinidad crime rate") and do not subscribe in session one rarely return. The live pulse indicator is the site's most attention-grabbing element — capture intent immediately below it.
**File:** `src/pages/index.astro`
**Fix:** Add the `NewsletterSignup` component with `variant="inline"` directly below the live pulse row and above the two CTA buttons in the hero section. One field, one button: "Get weekly crime reports → [email] [Subscribe]".

- [ ] Read `src/pages/index.astro` — find the hero section structure
- [ ] Read `src/components/NewsletterSignup.astro` — confirm inline variant exists and its props
- [ ] Insert `<NewsletterSignup variant="inline" />` (or equivalent) below the live pulse, above existing CTAs
- [ ] Confirm mobile layout — should not push CTAs below the fold on a standard iPhone viewport
- [ ] Build and confirm

**Acceptance:** Homepage hero has an email capture field visible without scrolling on desktop. On mobile it appears before the island card grid.

---

### S2-02 · Add dark hero + newsletter capture to blog index
**Why:** Blog index is the only high-traffic page that breaks the site's dark hero visual system — it looks like a 2018 CMS index. It is also missing a newsletter capture, which is the single most obvious missed placement on the site: a user reading a weekly crime report is the most activated subscriber candidate.
**File:** `src/pages/blog/index.astro`
**Fix:**
1. Add the dark hero section (`from-slate-900 to-slate-800`, with HeroBg texture, H1 = "Weekly Crime Reports", live pulse = "{N} reports published") matching the pattern used on Headlines, Murders, etc.
2. Insert `<NewsletterSignup variant="inline" />` directly below the dark hero, before the post grid.

- [ ] Read `blog/index.astro` — understand current page structure
- [ ] Read another page that uses the dark hero pattern (e.g. headlines) for reference
- [ ] Add dark hero section matching the site system
- [ ] Add NewsletterSignup below hero
- [ ] Add country filter (All / Trinidad & Tobago) as a pill row below the newsletter signup — keep existing filter logic
- [ ] Build and confirm

**Acceptance:** Blog index matches the site's dark hero visual system. Newsletter signup is visible before any post is shown. No existing functionality broken.

---

### S2-03 · Fix hero CTA button touch targets
**Why:** "Explore Dashboard" and "Murder Count" hero CTAs are `text-xs` (`font-medium` at 12px) with ~30px height — below WCAG 2.1 SC 2.5.5 recommended 44px minimum. These are the primary CTAs on the site's most visited page.
**File:** `src/pages/index.astro` — hero CTA buttons

- [ ] Read the hero button markup — confirm current size and padding classes
- [ ] Increase padding to achieve ≥44px height on mobile: `py-2.5` or `py-3`
- [ ] Promote button text to `text-sm` minimum
- [ ] Confirm desktop appearance is not bloated — use responsive classes if needed
- [ ] Build and confirm

**Acceptance:** Hero CTA buttons are ≥44px tall on all viewports. Text is ≥14px.

---

### S2-04 · Add "notify me" capture to coming-soon island tiles
**Why:** Guyana and Barbados coming-soon tiles use `cursor-not-allowed opacity-60` — every user who clicks them hits a dead end. Each click is expressed intent to use the platform for that island. Currently 100% of those clicks convert to nothing.
**File:** `src/pages/index.astro` — coming-soon islands section
**Fix:** On hover/tap of a coming-soon island tile, show a small tooltip or inline micro-form: "Get notified when [Island] launches → [email] [Notify me]". Can be a popover or a simple `data-island="guyana"` email input that feeds the newsletter with a tag.

- [ ] Decide: tooltip popover vs inline form vs modal (keep it lightweight — no modal for this)
- [ ] Implement hover/tap affordance on each coming-soon tile
- [ ] Wire to newsletter endpoint with an island-specific tag/label if Buttondown supports it
- [ ] Build and confirm

**Acceptance:** Clicking a coming-soon tile no longer dead-ends. A micro capture appears. Submission works.

---

## Session 3 — Ko-fi Revenue Funnel
**Effort:** ~1.5–2 hours | **Files:** `support.astro`, murder-count, statistics, F017 component
**Goal:** The donation trigger fires at the wrong location. Move the conversion closer to where motivation peaks.

---

### S3-01 · Replace Ko-fi redirect with in-page embed (Support page)
**Why:** Every off-site redirect introduces abandonment risk. The support page's primary job is conversion — the current "Donate on Ko-fi" button sends users to an external site where they leave the conversion context and distraction is introduced. Ko-fi provides an embeddable widget via `<script>` that completes the transaction without leaving the page.
**File:** `src/pages/support.astro`
**Fix:** Replace the primary Ko-fi CTA button with the Ko-fi widget embed. Add the button as a fallback `<noscript>` for users with JS disabled.

- [ ] Check Ko-fi embed options (Ko-fi button widget script) — confirm it works inside Astro without violating CSP
- [ ] If CSP needs updating for Ko-fi widget domain, add it to `public/_headers` with justification comment
- [ ] Replace primary CTA with Ko-fi widget embed
- [ ] Add `<noscript>` fallback linking to `ko-fi.com/crimehotspots`
- [ ] Build and confirm — widget renders, fallback exists

**Acceptance:** Support page completes donation without navigating away. Ko-fi redirect is only fallback.

---

### S3-02 · Replace Ko-fi redirect with embed on Murder Count + Statistics pages
**Why:** These pages are where motivated users encounter the donation CTA mid-read (F017). Same Fogg model issue: trigger placement is correct, but off-site redirect kills conversion. The embed must also pass the CDN edge cache correctly (these pages have 23h Cloudflare cache).
**Files:** Murder Count page Ko-fi CTA component, Statistics page Ko-fi CTA component

- [ ] Identify which component renders the Ko-fi CTA on these pages (F017 — `KofiCTA.astro` or inline)
- [ ] Replace redirect button with Ko-fi widget embed in that component
- [ ] Confirm CDN caching is compatible (Ko-fi script loads client-side, no cache conflict)
- [ ] Build and confirm on both pages

**Acceptance:** Ko-fi donation completes in-page on Murder Count and Statistics. No off-site redirect.

---

## Session 4 — Crime Detail & Mobile Engagement
**Effort:** ~2 hours | **Files:** crime detail `[slug].astro`, related crimes component
**Goal:** The crime detail page is the strongest template (7.6/10) but mobile users lose the RelatedCrimes sidebar. Fix the engagement falloff at the end of a mobile crime read.

---

### S4-01 · Surface RelatedCrimes on mobile (horizontal scroll row)
**Why:** `RelatedCrimes` is a sidebar component — it is rendered server-side but hidden on mobile. A user reading a murder report in Laventille on mobile never sees related crimes, losing the depth engagement and session extension that the sidebar provides on desktop. This is a direct session length and pages-per-visit fix.
**File:** `src/pages/trinidad/crime/[slug].astro`
**Fix:** Below `CompactTipCard` on mobile (using `lg:hidden`), add a horizontal scroll row of 3 related crime cards. These use the same `RelatedCrimes` data already computed server-side — no new API call needed. Cards should be compact: crime type pill + headline (line-clamp-2) + date.

- [ ] Read the crime detail page structure — find where `RelatedCrimes` is placed in the sidebar
- [ ] Identify the data passed to the sidebar component
- [ ] Add a mobile-only (`lg:hidden`) horizontal scroll container below `CompactTipCard`
- [ ] Render 3 related crime cards using the same data, in a `flex gap-3 overflow-x-auto` row
- [ ] Build and confirm — scroll row appears on mobile, sidebar remains on desktop

**Acceptance:** On a mobile viewport, 3 related crimes appear below the safety tips, in a horizontally scrollable row. Desktop is unchanged.

---

### S4-02 · Fix breadcrumb overflow on crime detail pages
**Why:** Crime detail pages are heavily indexed and frequently the entry point from Google. The breadcrumb on these pages includes the truncated headline (5 words) which overflows and wraps on mobile — the first structural element an organic search visitor sees signals disorder.
**File:** `src/pages/trinidad/crime/[slug].astro` — breadcrumb / Breadcrumbs component

- [ ] Read the breadcrumb rendering on a crime detail page
- [ ] Apply `truncate` or `line-clamp-1` to the headline segment of the breadcrumb
- [ ] Confirm the truncation is visible and has proper `title=` attribute for screen readers
- [ ] Build and confirm on a narrow viewport

**Acceptance:** Breadcrumb does not overflow on a 375px mobile viewport. Headline segment is truncated cleanly with visible ellipsis.

---

### S4-03 · Add social sharing to Statistics page
**Why:** Journalists who have just referenced a YTD murder count have no one-click share path. Share intent is highest immediately after data consumption. The statistics page has no share mechanism at all (crime detail and area pages already have share buttons).
**File:** `src/pages/trinidad/statistics.astro`
**Fix:** Add a share row below the primary stat cards — X/Twitter, WhatsApp, and copy-link buttons. Pre-populate with the key stat: "Trinidad & Tobago: X murders in {year} ({annualized rate} per 100k annualized). Full stats: [URL]".

- [ ] Read `statistics.astro` — find the main stat cards section
- [ ] Add a share row below the primary vitals (after the 4 GradientStatCards)
- [ ] Pre-populate WhatsApp and X share text with the murder count + annualized rate + URL
- [ ] Reuse the existing share button pattern from the crime detail page
- [ ] Build and confirm

**Acceptance:** Statistics page has visible share buttons that open pre-formatted messages. WhatsApp message contains the key stat.

---

## Session 5 — SEO & Structured Data
**Effort:** ~1.5–2 hours | **Files:** murder-count, statistics, JSON-LD slots
**Goal:** Murder Count is the site's highest organic traffic page. It deserves the full structured data treatment.

---

### S5-01 · Add Dataset JSON-LD to Murder Count page
**Why:** Murder Count is the highest-traffic SEO page for queries like "trinidad murder count 2026." `Dataset` schema with `dateModified` = freshness date is a direct eligibility signal for Google's Datasets vertical and rich results. This is confirmed by L015 as a known SEO gap.
**File:** `src/pages/trinidad/murder-count.astro`
**Fix:** Add `Schema.org Dataset` JSON-LD in `<slot name="head">`:
```json
{
  "@type": "Dataset",
  "name": "Trinidad & Tobago Murder Count {YEAR}",
  "description": "...",
  "dateModified": "{latest_crime_date_iso}",
  "temporalCoverage": "{YEAR}-01-01/{today}",
  "spatialCoverage": { "@type": "Place", "name": "Trinidad and Tobago" },
  "publisher": { "@type": "Organization", "name": "Crime Hotspots" }
}
```

- [ ] Read `murder-count.astro` — find the `<slot name="head">` and existing JSON-LD
- [ ] Build the `Dataset` JSON-LD block using the existing `latestCrimeDate` variable
- [ ] Ensure `dateModified` is ISO 8601 formatted
- [ ] Confirm it does not duplicate or conflict with existing `WebPage` / `FAQPage` JSON-LD on the page
- [ ] Build and confirm — validate at schema.org/validator

**Acceptance:** Murder Count page has valid `Dataset` JSON-LD. `dateModified` is dynamic (matches latest crime in D1). Passes schema.org validator.

---

### S5-02 · Add Dataset JSON-LD to Statistics page
**Why:** Same reasoning as S5-01. Statistics page surfaces annualized crime rates for all crime types — directly relevant to the Datasets vertical. The page already has `FAQPage` JSON-LD; this is additive.
**File:** `src/pages/trinidad/statistics.astro`

- [ ] Read `statistics.astro` — find existing JSON-LD block and `<slot name="head">`
- [ ] Add `Dataset` JSON-LD covering the annualized statistics data
- [ ] Set `dateModified` dynamically
- [ ] Build, confirm, validate

**Acceptance:** Statistics page has valid `Dataset` JSON-LD. Passes schema.org validator.

---

### S5-03 · Add Dataset JSON-LD to Jamaica Statistics + Murder Count
**Why:** Jamaica pages are approaching launch parity. Getting structured data in place before traffic scales means indexing credit accumulates from day one.
**Files:** `src/pages/jamaica/statistics.astro`, `src/pages/jamaica/murder-count.astro`

- [ ] Add `Dataset` JSON-LD to Jamaica statistics (population: 2.8M, spatialCoverage: Jamaica)
- [ ] Add `Dataset` JSON-LD to Jamaica murder-count
- [ ] Note: Jamaica D1 not yet live — `dateModified` can use current build date as a fallback until data is live
- [ ] Build and confirm

**Acceptance:** Both Jamaica data pages have valid `Dataset` JSON-LD.

---

## Session 6 — Safety Tips IA
**Effort:** ~2–3 hours | **Files:** `safety-tips/index.astro`, layout of filters
**Goal:** The safety tips feature has 90 tips but discovery is blocked by a taxonomy that requires users to already know crime-classification language before they can filter.

---

### S6-01 · Add "Browse by Situation" filter row
**Why:** Current filter requires the user to map their situation to a crime category. "I was just at an ATM" → "Is that ATM Crime? Robbery?" A situation-first filter (At Home, In Your Car, At a Bank, Online, Walking at Night) maps directly to how users think, not how crimes are classified.
**File:** `src/pages/trinidad/safety-tips/index.astro`
**Fix:** Add a second filter row above or below the current category pills labeled "Browse by Situation." Map each situation to one or more existing context filter values already in the data. This is navigation restructuring, not new data.

Situation → Context mapping:
- "At Home" → `home`, `home-invasion`, `burglary`
- "In Your Car" → `carjacking`, `driving`, `parking`
- "At a Bank/ATM" → `atm`, `banking`
- "Online" → `online`
- "Walking / Out" → `public-space`, `walking`, `bar`
- "At Work" → `workplace`

- [ ] Read `safety-tips/index.astro` — understand current filter implementation
- [ ] Read tip data to confirm which context values exist
- [ ] Design situation pill row — same visual pattern as category pills but labelled "By Situation"
- [ ] Wire situation pills to filter the displayed tips by matching context values
- [ ] Confirm that situation filter and category filter can work independently (not AND logic — either/or)
- [ ] Build and confirm

**Acceptance:** Safety tips index has a second "Browse by Situation" filter row. Selecting a situation filters tips correctly. Existing category filter still works.

---

### S6-02 · Add newsletter capture to Safety Tips index
**Why:** A user who reads three robbery-prevention tips in sequence is demonstrating active self-protective intent — peak receptivity to "get weekly safety alerts for your area." Currently there is no capture on this page.
**File:** `src/pages/trinidad/safety-tips/index.astro`
**Fix:** After the first 9 tips (one row of 3-col grid), add a full-width inline newsletter signup strip. Framing: "Get weekly safety updates for your area → [email] [Subscribe]".

- [ ] Read the tips grid rendering — find the right insertion point after 9 tips
- [ ] Add `<NewsletterSignup variant="inline" />` between tip row 3 and tip row 4
- [ ] Confirm it renders correctly at all viewport sizes (it should span full grid width)
- [ ] Build and confirm

**Acceptance:** Newsletter capture appears inline after the first 9 tips. Visible without scrolling to the bottom on desktop.

---

## Session 7 — Business Solutions Conversion
**Effort:** ~1.5–2 hours | **Files:** `business-solutions.astro`, `capabilitySheetConfig.ts`
**Goal:** The B2B funnel currently converts at near zero. Three targeted changes would materially improve it.

---

### S7-01 · Add pricing signal to Business Solutions page
**Why:** Complete pricing opacity is the #1 Baymard-identified B2B bounce driver. Enterprise buyers need to know "is this in my budget range?" before they will invest time in a contact. Even a range or "contact us for pricing" is significantly better than nothing.
**File:** `src/pages/business-solutions.astro`
**Fix:** Add a "Pricing" section or a per-product pricing signal. Options:
- A simple 2-column table: Product / Starting From
- Or a single section: "Pricing is tailored to your organisation's needs — contact us to discuss. API access, custom reports, and data licensing are all available."
If actual pricing is not ready, the second option is still better than silence.

- [ ] Read `business-solutions.astro` — find the product cards section
- [ ] Add a pricing section below the product cards (before the contact CTA)
- [ ] If no firm pricing: add a "Pricing" section header with a honest signal about engagement-based pricing
- [ ] Build and confirm

**Acceptance:** Business Solutions page gives a buyer enough context to know whether to continue. "Pricing" appears as a navigable section.

---

### S7-02 · Fix "Contact Sales" CTA to set correct expectations
**Why:** "Contact Sales" implies a human sales process. A `mailto:` link drops users into their email client with a template. This violates NNG Heuristic 1 — user expectation vs actual outcome.
**File:** `src/pages/business-solutions.astro`
**Fix:** Either:
- Change the label to "Send us a message" or "Get in touch" (truthful)
- Or replace the mailto with an inline contact form (better, but more work — defer if needed)

- [ ] Find the "Contact Sales" CTA
- [ ] Update label to match the actual action ("Get in touch" / "Send us a message")
- [ ] Optionally: replace mailto with a simple embedded form (only if time allows)
- [ ] Build and confirm

**Acceptance:** CTA label accurately describes what happens when clicked.

---

### S7-03 · Add named use case or anonymised social proof to Capability Sheet
**Why:** Every competitor capability sheet at this tier includes at least one named use case or client quote. Complete absence signals "no reference customers." Even one anonymised use case shifts the credibility significantly.
**File:** `src/config/capabilitySheetConfig.ts` or directly in `data-capability-sheet.astro`

- [ ] Write one anonymised use case: "A Caribbean security consultancy used this data to assess risk across 12 client locations in 2025"
- [ ] Add it to the capability sheet as a testimonial or case study callout box
- [ ] Style it as a pull-quote or highlighted card (distinct from body copy)
- [ ] Build and confirm

**Acceptance:** Capability sheet has at least one specific, credible use case reference.

---

### S7-04 · Add mobile "view on desktop" prompt to Capability Sheet
**Why:** The capability sheet is an institutional document format — inherently desktop. Users who receive a forwarded link on mobile encounter horizontal overflow with no explanation.
**File:** `src/pages/data-capability-sheet.astro`
**Fix:** Add a sticky bottom banner on mobile (`md:hidden`): "This document is designed for desktop or PDF. Email yourself the link →" with a `mailto:?subject=Crime Hotspots Data Capability&body=[URL]` link.

- [ ] Read `data-capability-sheet.astro` — find the page wrapper
- [ ] Add a `fixed bottom-0 left-0 right-0 md:hidden` banner
- [ ] Include mailto link pre-filled with subject and page URL
- [ ] Style to match the dark system (slate bg, white text, rose CTA)
- [ ] Build and confirm on a mobile viewport

**Acceptance:** On mobile, a sticky banner explains the document is best on desktop and provides a self-email link.

---

## Session 8 — Dashboard & Headlines UX
**Effort:** ~2 hours | **Files:** `trinidad/index.astro`, `headlines.astro`, `headlinesPage.ts`
**Goal:** Dashboard loading states and mobile headlines engagement.

---

### S8-01 · Add visible loading state when year filter changes on Dashboard
**Why:** Switching the year filter provides no feedback that data is updating. The DOM changes silently. This violates NNG Heuristic 1 (Visibility of System Status) and causes users to click the filter multiple times assuming it didn't register.
**File:** `astro-poc/src/scripts/dashboardUpdates.ts` (or wherever `onYearChange` fires)
**Fix:** On year filter change:
1. Add a `role="status" aria-live="polite"` region with "Loading {year} data…" text
2. Apply a shimmer overlay to the stat cards while data fetches
3. Remove loading state when data resolves

- [ ] Read the year filter JS — find the `onYearChange` handler
- [ ] Add a loading state: shimmer on stat cards + `aria-live` announcement
- [ ] Ensure the loading state clears on both success and error
- [ ] Build and confirm — year change shows visible loading feedback

**Acceptance:** Changing the year filter produces visible feedback within 200ms. The user knows something is happening.

---

### S8-02 · Add newsletter interrupt on mobile Headlines (after every 10 items)
**Why:** On mobile, the Headlines sidebar (which contains the newsletter signup) is invisible. A user scrolling through 30 crime headlines on mobile has no email capture path. Editorial interrupt after every 10th item is a proven mobile newsletter capture pattern (used by Guardian, BBC News mobile).
**File:** `src/scripts/headlinesPage.ts` + `headlines.astro`
**Fix:** When rendering headlines in mobile view (detect via JS media query or CSS), inject a `NewsletterSignup variant="inline"` strip after every 10th rendered headline card. Only show when no filter is active (filtering disrupts editorial interrupt logic).

- [ ] Read `headlinesPage.ts` — understand how headline cards are rendered to DOM
- [ ] Add injection logic: after every 10th item (when `window.innerWidth < 1024`), insert newsletter strip
- [ ] Suppress inject when any filter chip is active
- [ ] Style the strip to be distinguishable from a crime card (use a light/muted background)
- [ ] Build and confirm on a mobile viewport with 30+ headlines loaded

**Acceptance:** After the 10th and 20th headline on mobile, a newsletter strip appears. It does not appear when a filter is active. Desktop layout is unchanged.

---

## Session 9 — Help Centre Contextual CTAs
**Effort:** ~1 hour | **Files:** `help/[slug].astro`
**Goal:** Help Centre has 14 articles and zero conversion paths. Users who find answers leave without a next step.

---

### S9-01 · Add contextual bottom CTA to each Help article
**Why:** Users arriving from organic informational queries ("how does crime hotspots work", "how to read the crime map") get their question answered but have no next step. The Help Centre is a high-intent surface with zero conversion architecture.
**File:** `src/pages/help/[slug].astro`
**Fix:** Add a contextual bottom CTA block above the prev/next navigation, driven by `data.section`:

| Section | CTA |
|---|---|
| Getting Started | → "Explore the Dashboard" |
| Understanding the Data | → "View Crime Statistics" |
| Using the Dashboard | → "Go to Dashboard" |
| Safety Tips | → "Browse Safety Tips" |
| Crime Reports | → "Submit a Crime Report" |
| For Researchers | → "View the Data Capability Sheet" |

Style as a simple dark card with a short prompt sentence + rose CTA button.

- [ ] Read `help/[slug].astro` — find the content end and prev/next block
- [ ] Build a `section → { label, href }` mapping object
- [ ] Render the contextual CTA card above prev/next using the mapping
- [ ] Build and confirm on 2–3 articles from different sections

**Acceptance:** Every help article has a contextual "what to do next" CTA before the prev/next navigation.

---

## Session 10 — Blog & Author Identity
**Effort:** ~1.5 hours | **Files:** `blog/index.astro`, blog post layout
**Goal:** The blog is the most editorial surface and the one with the weakest identity signal.

---

### S10-01 · Add author byline to blog index cards
**Why:** Every blog post index shows the title and date but no author. For a platform that draws credibility from methodology and transparency, anonymous authorship on the most editorial surface is a trust gap. Even "Crime Hotspots Editorial Team" is better than no byline.
**File:** `src/pages/blog/index.astro`
**Fix:** Add a byline line to each blog card: "Crime Hotspots" or a specific author name from the post frontmatter (if stored). Add `author` to blog post frontmatter schema if not present.

- [ ] Read blog post frontmatter structure — check if `author` field exists
- [ ] If not: add `author: "Crime Hotspots"` to the blog post frontmatter schema and to existing posts
- [ ] Add byline to blog index card template
- [ ] Add byline to individual blog post layout
- [ ] Build and confirm

**Acceptance:** Blog index cards show an author. Blog post pages show an author. Both use the same value.

---

### S10-02 · Add per-stat deep share on Statistics and Murder Count
**Why:** When a journalist finds that murders are up 40% YoY, there is no mechanism to share that specific stat as a formatted card. This is the highest-frequency power user workflow (journalists, policy advocates) and it has no infrastructure. The P3-01 WhatsApp share from the March audit already exists on individual stat cards — this extends it to copy-to-clipboard and X/Twitter share alongside WhatsApp.
**Files:** `StatCards.astro`, `statistics.astro`, `murder-count.astro`
**Fix:** Where share buttons already exist on stat cards (from P3-01), add:
1. Copy-to-clipboard button ("📋 Copy stat") that copies the share text to clipboard with a "Copied!" confirmation
2. X/Twitter share button alongside WhatsApp

- [ ] Read `StatCards.astro` — find existing WhatsApp share implementation
- [ ] Add copy-to-clipboard button using `navigator.clipboard.writeText()`
- [ ] Add X/Twitter share button `https://twitter.com/intent/tweet?text=...`
- [ ] Add visual confirmation state on copy button ("Copied!" for 2s)
- [ ] Build and confirm

**Acceptance:** Each shareable stat card has WhatsApp + X + Copy buttons. Copy shows confirmation feedback.

---

## Backlog (Out of Scope for Current Sessions)

These are valid improvements from the audit that require more planning or external dependencies before they can be implemented.

| Item | Reason Deferred |
|---|---|
| Ko-fi dashboard stat share (P3-01 deferred) | Needs client-side filter-aware approach — requires more design |
| Map loading shimmer on Dashboard | Leaflet initialisation timing makes this non-trivial |
| "Browse by Situation" context expansion to Jamaica | Jamaica D1 data pipeline not yet live |
| Per-constituency accountability view (P4-05) | Dependent on P4-01 → P4-04 from March audit |
| Blog author photos | No photo assets — content decision needed |
| Social image generator — native stat card export | Requires OG image generation work (Satori) |
| Analytics funnel tracking for newsletter/Ko-fi | GA4 funnel setup — separate analytics session |

---

## Session Log

| Date | Session | Items Completed | Notes |
|---|---|---|---|
| — | — | — | Plan created March 30, 2026 |
| 2026-03-30 | S1 | S1-01 | Promoted `text-xs` → `text-sm` on methodology, faq, business-solutions; about/contact/help unchanged (already use design tokens or CSS vars) |
| 2026-03-30 | S1 | S1-02 | Replaced Gmail with `contact@crimehotspots.com` across contact, business-solutions, terms, privacy (6 occurrences total) |
| 2026-03-30 | S1 | S1-03 | Support page: "X of 50 supporters" count visible, urgency copy dynamic, bottom off-topic CTAs removed |
| 2026-03-30 | S1 | S1-04 | FAQ Jamaica answer updated: MPs/statistics/murder-count live, D1 pipeline in progress; no other stale "planned" language found |
| 2026-03-30 | S1 | S1-05 | Framing paragraph added to T&T and Jamaica MP index pages |
| 2026-03-30 | S1 | S1-06 | MPSidebar: contextual label added ("Elected representative for this area" / "…for this region") |

---

## Scoring Targets

| Page / Area | Current | Target | Sessions |
|---|---|---|---|
| Business Solutions | 5.4 | 7.0 | S1-02, S7-01, S7-02, S7-03 |
| About / Contact / FAQ | 5.4 | 7.0 | S1-01, S1-04 |
| Blog | 5.8 | 7.5 | S2-02, S10-01 |
| MP Profiles | 5.6 | 7.0 | S1-05, S1-06 |
| Homepage | 6.4 | 8.0 | S2-01, S2-03, S2-04 |
| Support | 7.2 | 8.5 | S1-03, S3-01 |
| Crime Detail | 7.6 | 8.5 | S4-01, S4-02 |
| Murder Count | 8.0 | 9.0 | S5-01, S10-02 |
| **Overall** | **6.4** | **8.0** | All sessions |

---

*Full audit: `docs/Website-Audits/Conversion-Ranking-Plan-March-2026.md`*
*Previous audit: `docs/Website-Audits/March-Audit-2026.md`*
