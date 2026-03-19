# L015 — SEO On-Page Patterns

**Status:** active | **Added:** Mar 19 2026

---

## Core rule: H1 must be a single element containing the target keyword phrase

If the visible page header is split across multiple tags (h1 + p + p), Google reads only the `<h1>` content — the rest is body text.

**Wrong:**
```html
<h1>Trinidad & Tobago</h1>
<p>Murder Count</p>
<p>2026</p>
```
Google H1: "Trinidad & Tobago" — keyword phrase invisible.

**Right:**
```html
<h1>
  <span class="block text-2xl ...">Trinidad & Tobago</span>
  <span class="block text-lg ...">Murder Count</span>
  <span class="block text-4xl ...">2026</span>
</h1>
```
Google H1: "Trinidad & Tobago Murder Count 2026" — visually identical, semantically correct.

---

## FAQPage JSON-LD → People Also Ask boxes

Add FAQPage schema to any page where "how many / what is / why" queries appear in GSC.

- murder-count.astro: 3 questions (murder count, murder rate, murder toll)
- statistics.astro: 4 questions (already had this)
- Queries at position 8–15 with high CTR are the best candidates — they click when shown, just not shown enough

Build faqData object in frontmatter (with dynamic counts), render as second `<script type="application/ld+json">` block.

---

## dateModified on Dataset schema = freshness signal

Add `"dateModified": new Date().toISOString()` to any Dataset schema on pages with live/daily data. Google uses this to validate that the page is actively maintained.

Pages that have it: statistics.astro, murder-count.astro (added Mar 19 2026), murders.astro.

---

## H1 / title tag alignment

The `<title>` tag and `<h1>` should match in intent and include the same year.

- statistics.astro: title had year, Hero title didn't → fixed to `Trinidad & Tobago Crime Statistics ${currentYear}`
- murder-count.astro: title had year + count, H1 didn't → fixed

---

## Content gap vs optimisation problem

Queries without a year (`trinidad crime rate`, `crime statistics t&t`) rank at positions 65–90.
These are dominated by Wikipedia + academic reference pages with 5+ years of data.
**These cannot be fixed by tweaking the statistics page** — they require a dedicated historical rates page covering multiple years. Treat as a separate content project.

Year-specific queries (`trinidad murder rate 2026`) respond to on-page optimisation.
Yearless evergreen queries require content authority (multi-year data + backlinks).

---

## GSC data interpretation notes (from Mar 19 2026 audit)

- Traffic spikes on "today" queries (`murders in trinidad 2026 update today`) are news-cycle driven — not lost rankings
- CTR 20–50% at positions 3–5 is healthy; focus is moving from pos 4→1–2
- Impressions dropping week-over-week = demand drop, not ranking drop
- All traffic is T&T murder-specific; Jamaica has zero GSC traction yet (as of Mar 2026)
