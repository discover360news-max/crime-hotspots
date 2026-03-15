---
id: L005
type: learning
status: active
created: 2026-03-02
updated: 2026-03-07
related: [L006, B009]
---

## Summary
Muted UI direction established Mar 2026: Rose is reserved for hover/interaction states only — never resting fills. Three established patterns (ghost button, muted pill, muted dot) used across all non-semantic UI elements.

## Implementation Details

**Ghost Button:**
```
border-2 border-slate-300 dark:border-[hsl(0_0%_30%)] text-slate-700 dark:text-[hsl(0_0%_85%)]
hover:border-rose-600 dark:hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400
active:bg-rose-50 dark:active:bg-rose-950/40 rounded-lg transition font-medium text-xs whitespace-nowrap
```
Used on: Load More (headlines), Hero primaryCTA, crime detail top nav buttons, Report Issue trigger, Report a Crime link, ReportIssueModal trigger.

**Muted Pill:**
```
px-1.5 py-0.5 rounded-full border border-slate-300 dark:border-[hsl(0_0%_30%)] text-slate-500 dark:text-[hsl(0_0%_55%)]
```
Used on: accordion count badges, CategoryAccordion count, "Same area" badge, crime count badge, category badge (CompactTipCard).

**Muted Dot:**
```
w-2 h-2 rounded-full bg-slate-300 dark:bg-[hsl(0_0%_35%)]
```
Used on: RelatedCrimes type dot, TrendingHotspots heat dot, CompactTipCard severity dot.

**Source Links (crime detail):** Slate text + dotted underline at rest, rose on hover — not red by default.

**Stat card numbers (StatCard + StatCards):** Always slate — never rose, regardless of crime type. The `highlight` prop on `StatCards` was a L005 violation (rose on Murder count) — removed Mar 15 2026. `StatCard` had a hardcoded `crimeType === 'Murder'` rose conditional — also removed. Rose only appears on the active-state border (`.stat-card.active { border-color: #e11d48 }`).

## Keep Semantic Colour (do NOT mute)
- `SafetyContext` fills (amber/emerald/slate by risk level)
- `SiteNotificationBanner` fills
- `QuickInsightsCard` rose/emerald text
- Hero risk badge
- Layout subscribe button (single accent)

## Reference
Full design system: `docs/guides/DESIGN-TOKENS.md`

## Change Log
- 2026-03-02: Muted UI direction established and rolled out to all non-semantic components
