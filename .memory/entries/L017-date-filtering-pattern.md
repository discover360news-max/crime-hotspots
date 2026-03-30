---
name: L017 — Date filtering pattern: datePublished ?? dateObj
description: All rolling window filters use datePublished ?? dateObj. YoY comparisons stay on dateObj. API serializes datePublished as ISO string; client reconstructs it.
type: feedback
---

## Rule

Use `(c.datePublished ?? c.dateObj)` for ALL rolling window date filters (7d, 14d, 30d, 90d).

Use `c.dateObj` ONLY for year-over-year comparisons — those are intentional historical anchors where crime date is the meaningful reference.

**Why:** `dateObj` is the crime incident date (when it happened). Crimes are often published days or weeks after the event. Using `dateObj` for rolling windows consistently undercounts recent activity — a murder from Mar 20 reported on Mar 28 would be excluded from a "last 7 days" window run on Mar 28. `datePublished` reflects when the crime entered the system, which is what rolling windows should measure.

## Pattern

```ts
// Rolling window — correct
const recentCrimes = allCrimes.filter(c => (c.datePublished ?? c.dateObj) >= cutoff);

// Two-sided window — correct
const lastWeek = allCrimes.filter(c => {
  const d = c.datePublished ?? c.dateObj;
  return d >= twoWeeksAgo && d < weekAgo;
});

// YoY — leave on dateObj intentionally
const prevYearCrimes = allCrimes.filter(c => c.dateObj >= cutoff90dPrevStart && c.dateObj <= cutoff90dPrevEnd);
```

## Client-Side — Critical

`datePublished` is a Date instance that does NOT survive `JSON.stringify`. Two things must stay in sync:

1. **`/api/crimes.ts`** — `serializeCrime()` outputs `datePublished` as an ISO string (not stripped). `DATE_FIELDS_OMIT` contains `dateObj` and `dateUpdated` only.
2. **`src/scripts/dashboardDataLoader.ts`** — Both reconstruction paths (SSR + non-SSR) rebuild `datePublished` as a `Date`:
   ```ts
   datePublished: c.datePublished ? new Date(c.datePublished) : undefined,
   ```
   If either of these breaks, client-side filters silently fall back to `dateObj`.

## Legacy rows

2025 rows (and some early 2026) have no `datePublished`. The `?? dateObj` fallback handles them — do not remove it.

## Files updated (Mar 30, 2026)

Server: `HomepagePulse.astro`, `DashboardStory.astro`, `dashboard.astro`, `index.astro`, `areas.astro`, `regions.astro`, `area/[slug].astro`, `region/[slug].astro`, `mp/[slug].astro`, `compare.astro`, `headlines.astro`, `safety-tips/[slug].astro`, `news-sitemap.xml.ts`

Client: `api/crimes.ts`, `dashboardDataLoader.ts`, `modalHtmlGenerators.ts`
