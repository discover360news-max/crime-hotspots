# SEO CTR Optimisation Log

Tracks GSC-driven title/meta description changes. Re-check GSC ~4 weeks after each change.

---

## GSC Export: crimehotspots-4 (Apr 2026)

**Period analysed:** snapshot from `/Users/kavellforde/Downloads/crimehotspots-4/`

### Key findings

| Page | Impressions | CTR | Issue |
|------|-------------|-----|-------|
| /trinidad/murder-count/ | 4,941 | 8.08% | High volume, weak snippet |
| /trinidad/statistics/ | 4,698 | 4.81% | Worst CTR of hub pages |
| /trinidad/dashboard/ | 955 | 4.92% | Position 13.5 — ranking issue, not snippet |
| /trinidad/areas/ | 494 | 4.86% | Hub page, weak snippet |

**Top missed queries (high impressions, low CTR):**
- "how many murders in trinidad for 2026" — 478 imp, 5.65% CTR
- "murder toll in trinidad 2026" — 309 imp, 14.89% CTR
- "trinidad crime rate 2026" — 246 imp, 13.82% CTR

**Zero-click anomaly to investigate:**
- "maraval bank theft $76000" — 412 impressions, 0 clicks, position 6.16
  — check if crime page exists and is properly titled/indexed

**Desktop CTR gap:** Mobile 9.01% vs Desktop 3.13% — needs UX investigation.

**US traffic:** 6,876 impressions, 2.78% CTR — not targetable (wrong audience).

---

## Changes Made — Apr 2, 2026

### /trinidad/murder-count/ — commit b2870c4

**Before:**
```
Title: Trinidad Murder Count 2026: X Murders So Far — Updated Daily | Crime Hotspots
Desc:  Trinidad murder count 2026: X murders (updated daily). Murder rate: Y per 100k.
       Projected at Z per 100k for full year. Track the Trinidad & Tobago murder toll live.
       (~175 chars — leads with title repeat)
```

**After:**
```
Title: Trinidad Murder Toll 2026: X Murders — Live Count | Crime Hotspots
Desc:  X murders recorded in Trinidad & Tobago in 2026. Murder rate: Y per 100k —
       projected Z per 100k by year end. Breakdown by month, area, and crime type.
       Updated daily. (~155 chars — leads with the number)
```

**Rationale:** "Murder Toll" targets 309-impression query. Description now answers "how many murders" directly before truncation point.

---

### /trinidad/statistics/ — commit b2870c4

**Before:**
```
Title: Trinidad Crime Statistics & Crime Rate 2026 - Live Data | Crime Hotspots
Desc:  Trinidad & Tobago 2026 crime statistics: X total crimes — Y murders, Z robberies,
       W shootings (murder rate ... per 100k annualized, ... projected annually).
       2025 final: ... per 100k. Updated daily. (~220 chars — truncated by Google)
```

**After:**
```
Title: Trinidad Crime Statistics 2026: X Crimes, Y Murders | Crime Hotspots
Desc:  Trinidad & Tobago 2026: X crimes — Y murders (Z/100k projected), W robberies,
       V shootings. Compare to 2025: U/100k. Updated daily. (~145 chars)
```

**Rationale:** Live numbers in title are more compelling in SERP. Description shortened by 75 chars — old version was being cut mid-sentence. YoY comparison added to answer follow-up intent in one snippet.

---

---

## Task 1 — Maraval Bank Theft Zero-Click (Apr 2, 2026)

**Query:** "maraval bank theft $76000" — 412 impressions, 0 clicks, position 6.16

**Page found:** `/trinidad/crime/3-contractor-robbed-of-76-000-cash/`
- Story_ID 3, Date: Jan 9 2026, Crime type: Theft
- Headline: "Contractor Robbed of $76,000 Cash Following Bank Withdrawal at Ellerslie Plaza in Maraval"

**Root cause (two compounding problems):**

1. **Title truncation** — headline is 90 chars. Google displays ~60 chars, so the visible SERP title is "Contractor Robbed of $76,000 Cash Following Bank W..." — **"Maraval" (at char 80) is never shown**.

2. **Description hides key terms** — `crime.summary` was ~350 chars (Google rewrites it). The summary text doesn't use "Maraval" at all; it's only in the headline and street address fields. First ~139 chars of summary: "A contractor was targeted in a vehicle break-in after withdrawing a large sum of cash intended for a home renovation project on Friday morn…"

**Result:** Searcher sees a result where neither the visible title nor the snippet mentions "Maraval" — despite this being the correct page.

**Fix applied (commit TBD):**
- `src/pages/trinidad/crime/[slug].astro` — `buildCrimeDescription()` helper:
  - Prefixes description with `${crime.area} — ` so location appears in the snippet
  - Truncates to first sentence ≤155 chars (prevents Google rewriting with worse content)
  - New description: "Port of Spain — A contractor was targeted in a vehicle break-in after withdrawing a large sum of cash intended for a home renovation project on Friday morn…" (156 chars)

**Residual issue:** "$76,000" and "Maraval" (the neighbourhood, not the area) are still not in the snippet because they appear in sentence 2 of the summary. The GAS pipeline should put key details (amount, specific neighbourhood) in sentence 1 for crimes with notable dollar values. Flag for GAS prompt update.

---

## Task 2 — Desktop CTR UX Audit (Apr 2, 2026)

**Gap:** Mobile CTR 9.01% vs Desktop 3.13% — 3× difference.

**Primary driver (data, not layout):** US desktop research traffic. GSC shows 6,876 US impressions at 2.78% CTR — these are predominantly desktop users doing research on a topic irrelevant to them (not Trinidad residents). This single audience segment drags the entire desktop CTR average down. Stripping US traffic, the desktop gap would likely be much smaller.

**On-page UX issues found at 1280px+:**

| Page | Issue | Severity |
|------|-------|----------|
| Homepage (`/`) | Hero CTAs `text-xs px-4 py-2` — no `min-h` — look like tiny utility links on wide desktop | Medium |
| Statistics (`/trinidad/statistics/`) | Same CTA sizing issue | Medium |
| Murder Count (`/trinidad/murder-count/`) | Single-column centered layout — `max-w-5xl` container leaves large dead space at 1440px+ | Low |
| All three | `max-w-5xl` (1024px) wrapper — at 1440px screens, 200px+ of blank margin each side. Not a bug, but layout density feels thin | Low |

**No critical bugs found.** No broken layouts, no hidden above-fold CTAs. CTAs are visible on load on all three pages. The layout is functional at 1280px.

**Recommended fixes (not implemented — awaiting direction):**
1. Homepage + Statistics hero CTAs: increase to `px-5 py-2.5 text-sm min-h-[36px]` — more visible as desktop targets
2. Consider widening max container to `max-w-6xl` on stats-heavy pages to use desktop real estate better
3. Do NOT pursue — will not fix the 3× gap because the root cause is audience composition, not layout

---

## Backlog / Next Actions

- [x] Investigate "maraval bank theft $76000" — fixed description truncation + area prefix
- [x] Desktop CTR UX audit — root cause identified (US research traffic drag)
- [x] GAS prompt update (Apr 2, 2026): `headline` now location-first max 75 chars; `details` sentence 1 must name specific location + amounts + victim role. Applied to both Trinidad + Jamaica `claudePrompts.gs`. Also updated OUTPUT EXAMPLE in both files with before/after illustrations.
- [ ] Re-pull GSC ~May 2026 to measure CTR delta on above changes
- [ ] Consider same title/meta treatment for /trinidad/areas/ and /trinidad/dashboard/
- [ ] Desktop CTR: if gap persists in May pull, investigate position delta (desktop vs mobile average position) before changing CTAs
