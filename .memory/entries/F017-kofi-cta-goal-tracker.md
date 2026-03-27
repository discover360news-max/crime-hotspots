# F017 — Contextual Ko-fi CTAs + Goal Tracker

**Status:** active | **Added:** Mar 26 2026 | **Commit:** df5a6f2

## What was built

### 1. Contextual Ko-fi CTA box (TT pages)
Subtle inline box that appears mid-page after the first major data section.

**Placement:**
- `src/pages/trinidad/murder-count.astro` → after `<MonthlyBreakdownChart>`, before action buttons
- `src/pages/trinidad/statistics.astro` → after `<StatCards>` YTD summary, before the dark separator band

**Copy** (dynamic from `social-proof.json`):
> "Keeping this data ad-free for **{monthly_readers_display}** readers depends on community support."
> [Support on Ko-fi] button (rose-600, opens in new tab)

**Design:** `bg-slate-50 dark:bg-[hsl(0_0%_9%)]`, `border-[var(--ch-border-subtle)]`, flex row on sm+, `rounded-lg`

### 2. Goal tracker on support page
Located between the primary Ko-fi button and "What your support covers" card.

**Shows:** goal number + filled progress bar
**Hides:** current supporter count (not shown to visitors)
**Calculation:** `kofiPct = Math.min(100, Math.round((kofi_supporters / kofi_goal) * 100))`

## Data source — social-proof.json
All numbers live in `src/data/social-proof.json`. Single source of truth.

```json
{
  "monthly_readers": 4000,
  "monthly_readers_display": "4,000+",
  "monthly_readers_short": "4K+",
  "kofi_supporters": 38,
  "kofi_goal": 50
}
```

**To update:** edit `social-proof.json` — CTA copy + goal bar recalculate automatically on next deploy.

**Weekly update cadence:** update `kofi_supporters` alongside the other social proof fields.

## Why placement was chosen
- Murder Count: user has seen hero counter + vitals + year comparison + full monthly chart before the CTA — maximum data engagement before ask
- Statistics: user has processed the 4 KPI cards + YTD summary — same principle
- Both pages already had `SocialProofStrip` earlier on the page; placing CTA too early would double-ask within 2 sections

## Jamaica — pending F013
`jamaica/murder-count.astro` and `jamaica/statistics.astro` need the same CTA blocks.
- Copy is island-agnostic (`monthly_readers_display` doesn't reference TT specifically)
- Blocked on Jamaica D1 data pipeline (F013 in-progress)
- When F013 is live: copy the two CTA blocks verbatim, import `socialProof` in each file

## Ko-fi links audit (Mar 26 2026)
All Ko-fi links site-wide already had `target="_blank" rel="noopener noreferrer"`:
- `help/[slug].astro`, `trinidad/crime/[slug].astro`, `MPSidebar.astro`, `CrimeDetailModal.astro`, `support.astro`, `blog/[slug].astro`
