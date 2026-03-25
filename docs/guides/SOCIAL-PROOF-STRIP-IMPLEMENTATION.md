# SocialProofStrip — Build & Integration Tracker

**Status:** COMPLETE. All 38 pages done (3 prev sessions + 35 this session). Build passes.
**Last updated:** 2026-03-25

---

## 1. What This Is

A single reusable `SocialProofStrip.astro` component displaying real site metrics to build trust and impress new visitors. Data comes from one central JSON file (`src/data/social-proof.json`) updated weekly, plus a live D1 query for the incident count.

**Stats displayed:**

| Stat | Source | Color |
|------|--------|-------|
| Monthly readers | GA4 active users | Blue |
| Monthly reach | GSC impressions | Violet |
| Incidents tracked | D1 live query | Rose |
| Areas monitored | social-proof.json | Emerald |

**Stats excluded:** CTR, avg position, new/returning split, raw view count, share counts.

---

## 2. Central Data Source

**File:** `src/data/social-proof.json` — update weekly.

```json
{
  "updated": "2026-03-25",
  "monthly_readers": 3636,
  "monthly_readers_display": "3,600+",
  "monthly_readers_short": "3.6K+",
  "monthly_impressions": 11300,
  "monthly_impressions_display": "11K+",
  "monthly_impressions_short": "11K+",
  "areas_monitored": 135,
  "areas_monitored_display": "135",
  "areas_monitored_short": "135",
  "incident_count_fallback": 2000
}
```

Update `monthly_readers`, `monthly_impressions`, both their `_display` and `_short` strings weekly.
Update `incident_count_fallback` monthly to keep the D1 fallback accurate.

The incident count is queried live from D1 at request time — `_display` rounds to nearest 100 (`2,800+`), `_short` abbreviates (`2.8K+`).

---

## 3. The Three Confirmed Variants

### `hero` — Inside dark hero sections (2×2, abbreviated)
Goes **inside** the page's dark hero, on the **right side**, in a `hidden lg:block w-52` wrapper. Cards use semi-transparent colored backgrounds on slate (`bg-blue-500/10`), light pastel numbers (`text-blue-300`).

```
[ 🔵 3.6K+ monthly readers    ] [ 🟣 11K+ monthly impressions ]
[ 🔴 2K+  incidents tracked   ] [ 🟢 135  areas monitored     ]
```

### `sidebar` — In page sidebars (2×2, same card style as hero)
Same visual style as `hero` — identical cards, abbreviated numbers. Goes inside an existing 256px sidebar column. No wrapper needed — the page's sidebar handles positioning.

```
[ 🔵 3.6K+ monthly readers    ] [ 🟣 11K+ monthly impressions ]
[ 🔴 2K+  incidents tracked   ] [ 🟢 135  areas monitored     ]
```

### `strip` — Between content sections (4-col row, full numbers)
Goes **between sections** in the page body. Full numbers (`3,600+`, `11K+`). Cards use light colored backgrounds in light mode, dark in dark mode.

```
[ 🔵 3,600+ monthly readers ] [ 🟣 11K+ monthly impressions ] [ 🔴 2,800+ incidents ] [ 🟢 135 areas ]
```

> `compact` variant exists in the component but is **not used** going forward.

---

## 4. How to Add to a Page

### Import (adjust depth for nested pages)
```astro
import SocialProofStrip from '../components/SocialProofStrip.astro';
// or: '../../components/SocialProofStrip.astro' for pages two levels deep
```

### Hero variant — inside a dark hero section
Split the hero content div into 2 columns, add on the right:
```astro
<div class="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
  <!-- existing left content: h1, subtitle, pulse, CTAs -->
  <div>...</div>

  <!-- right: social proof (stacks below on mobile) -->
  <div class="w-full lg:w-52">
    <SocialProofStrip variant="hero" incidentCount={allCrimes.length} />
  </div>
</div>
```
Pass `incidentCount` if `allCrimes` is already in scope — avoids a second D1 query.

### Sidebar variant — inside an existing sidebar column
```astro
<SocialProofStrip variant="sidebar" incidentCount={allCrimes.length} />
```
Drop it directly inside the sidebar `<div>` — no extra wrapper needed. The sidebar handles width and positioning.

### Strip variant — between content sections
```astro
<div class="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
  <SocialProofStrip variant="strip" incidentCount={allCrimes.length} />
</div>
```
Omit `incidentCount` on pre-rendered pages without a D1 query — the component will query D1 itself (or fall back to the JSON value).

---

## 5. Implementation Checklist

Mark `[x]` when done. Work through pages one at a time, checking in browser before moving on.

---

### Phase 0 — Build the Component

- [x] Create `src/data/social-proof.json`
- [x] Build `src/components/SocialProofStrip.astro` (`hero` + `strip` variants)

---

### Phase 1 — Pages WITH Dark Heroes (`hero` variant in hero)

These pages have a `from-slate-900` / `to-slate-800` dark hero section. The `hero` variant goes **inside the hero div**, right column, `hidden lg:block w-52`.

| Done | Page | Route | Notes |
|------|------|-------|-------|
| [x] | **Homepage** | `/` | Hero variant right col + strip below |
| [x] | **Dashboard** | `/trinidad/dashboard/` | Sidebar variant stacked below blog card in existing right col |
| [x] | **Headlines** | `/trinidad/headlines/` | Hero variant, split added |
| [x] | **Area Detail** | `/trinidad/area/[slug]` | Hero variant, grid split |
| [x] | **Regions Index** | `/trinidad/regions/` | Hero variant, grid split |
| [x] | **Region Detail** | `/trinidad/region/[slug]` | Hero variant, grid split |
| [x] | **Murder Count** | `/trinidad/murder-count/` | Strip variant, after vitals row |
| [x] | **Murders List** | `/trinidad/murders/` | Hero variant, grid split |
| [x] | **Compare** | `/trinidad/compare/` | Hero variant, grid split |

---

### Phase 2 — Pages WITHOUT Dark Heroes (`strip` variant in content)

These pages have no dark hero. The `strip` variant goes between sections in the page body.

| Done | Page | Route | Placement |
|------|------|-------|-----------|
| [x] | **About** | `/about/` | Strip after `<Hero>` |
| [x] | **Blog Index** | `/blog/` | Strip before "More Reports" list |
| [x] | **Blog Post** | `/blog/[slug]` | Strip above "More Reports" section |
| [x] | **Business Solutions** | `/business-solutions/` | Strip after `<Hero>` |
| [x] | **Support** | `/support/` | Strip below 3-col cards |
| [x] | **Methodology** | `/methodology/` | Strip below intro section |
| [x] | **FAQ** | `/faq/` | Strip above FAQ accordion |
| [x] | **Contact** | `/contact/` | Strip below contact topics grid |
| [x] | **Statistics (TT)** | `/trinidad/statistics/` | Hero variant, grid split (has dark hero) |
| [x] | **Areas Index** | `/trinidad/areas/` | Strip inside main after search bar |
| [x] | **Safety Tips Index** | `/trinidad/safety-tips/` | Hero variant, grid split |
| [x] | **Safety Tip Detail** | `/trinidad/safety-tips/[slug]` | Hero variant, grid split |
| [x] | **Safety Tip Category** | `/trinidad/safety-tips/category/[cat]/` | Strip after `<Hero>` |
| [x] | **Safety Tip Context** | `/trinidad/safety-tips/context/[ctx]/` | Strip after `<Hero>` |
| [x] | **Safety Tip Area** | `/trinidad/safety-tips/area/[area]/` | Strip after `<Hero>` |
| [x] | **MP Index (TT)** | `/trinidad/mp/` | Strip after `<Hero>` |
| [x] | **MP Profile (TT)** | `/trinidad/mp/[slug]` | Strip after `<Hero>` |
| [x] | **Help Index** | `/help/` | Strip after `<Hero>`, before search bar |
| [x] | **Help Article** | `/help/[slug]` | Strip after `<Hero>` |
| [x] | **Archive Index (TT)** | `/trinidad/archive/` | Strip after `<Hero>` |
| [x] | **Archive Month (TT)** | `/trinidad/archive/[year]/[month]` | Strip after `<Hero>` |

---

### Phase 3 — Jamaica Pages (`strip` variant)

Note: Jamaica D1 pipeline not yet live. Omit `incidentCount` prop — component falls back to JSON value.

| Done | Page | Route | Placement |
|------|------|-------|-----------|
| [x] | **Jamaica Dashboard** | `/jamaica/dashboard/` | Strip after `<Hero>` |
| [x] | **Jamaica Headlines** | `/jamaica/headlines/` | Strip after `<Hero>` |
| [x] | **Jamaica Statistics** | `/jamaica/statistics/` | Strip after `<Hero>` |
| [x] | **Jamaica Murder Count** | `/jamaica/murder-count/` | Strip after murder rate 3-col grid |
| [x] | **Jamaica Parishes** | `/jamaica/parishes/` | Strip after `<Hero>` |
| [x] | **Jamaica Archive** | `/jamaica/archive/` | Strip after `<Hero>` |
| [x] | **MP Index (Jamaica)** | `/jamaica/mp/` | Strip after `<Hero>` |
| [x] | **MP Profile (Jamaica)** | `/jamaica/mp/[slug]` | Strip after `<Hero>` |

---

## 6. Pages Intentionally Excluded

| Page | Reason |
|------|--------|
| `/404` | Error page |
| `/privacy/` `/terms/` | Legal pages |
| `/report/` | Form page — don't distract from submission |
| `/trinidad/safety-tips/submit/` | Form page |
| `/data-capability-sheet/` | B2B standalone doc |
| `/tools/social-image-generator/` | Internal tool |
| API endpoints / RSS | Not user-facing |

---

## 7. Total Page Count

| Phase | Pages | Variant |
|-------|-------|---------|
| Phase 0 | Component | built |
| Phase 1 | 9 pages | `hero` |
| Phase 2 | 21 pages | `strip` |
| Phase 3 | 8 pages | `strip` |
| **Total** | **38 pages** | — |
