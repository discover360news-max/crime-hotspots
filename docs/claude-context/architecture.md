# Architecture Reference

**For:** Detailed understanding of Crime Hotspots codebase structure

---

## Astro File-Based Routing

**All pages are in `astro-poc/src/pages/` with automatic routing:**

- `index.astro` → `/` (homepage)
- `trinidad/dashboard.astro` → `/trinidad/dashboard`
- `trinidad/headlines.astro` → `/trinidad/headlines`
- `trinidad/crime/[slug].astro` → `/trinidad/crime/00842-missing-man-found-dead-princes-town/` (2,300+ pages, Story_ID-prefixed slugs; legacy `headline-YYYY-MM-DD` slugs 301-redirect to new format)
- `trinidad/archive/[year]/[month].astro` → `/trinidad/archive/2025/12`
- `blog/[slug].astro` → `/blog/trinidad-weekly-2025-11-10`

**No `countries.js` file** - Configuration moved directly into pages.

---

## Key Files & Directory Structure

```
astro-poc/
├── src/
│   ├── components/           # Reusable Astro components
│   │   ├── Header.astro      # Navigation with mobile menu + subscribe tray
│   │   ├── Breadcrumbs.astro # SEO breadcrumb navigation
│   │   ├── InfoPopup.astro   # Click-based help tooltips (modal)
│   │   ├── LoadingShimmer.astro # Facebook-style shimmer loading
│   │   ├── ReportIssueModal.astro # Crime issue reporting modal
│   │   ├── FiltersTray.astro # Dashboard slide-out filters
│   │   ├── StatCard.astro    # Dashboard stat cards
│   │   ├── QuickInsightsCard.astro # Dashboard insights
│   │   ├── TopRegionsCard.astro # Top areas ranking
│   │   ├── DashboardModal.astro # Island dashboard selector
│   │   ├── HeadlinesModal.astro # Island headlines selector
│   │   ├── ArchivesModal.astro # Island archives selector
│   │   └── SearchModal.astro # Site-wide search (Pagefind)
│   ├── content/              # Astro Content Collections
│   │   ├── config.ts         # Blog schema (TypeScript validation)
│   │   └── blog/             # Markdown blog posts
│   ├── layouts/              # Base templates
│   │   └── Layout.astro      # Main layout (SEO, header, footer)
│   ├── lib/                  # Utilities & data fetching
│   │   ├── crimeData.ts      # Trinidad CSV fetcher + processors
│   │   └── crimeColors.ts    # Crime type color mappings
│   ├── scripts/              # Reusable TypeScript utilities
│   │   ├── yearFilter.ts     # Year filtering with callbacks
│   │   ├── leafletMap.ts     # Map initialization & updates
│   │   ├── statsScroll.ts    # Horizontal scroll behavior
│   │   ├── statCardFiltering.ts # Clickable stat card logic
│   │   └── dashboardUpdates.ts # Dashboard update functions
│   ├── utils/                # Form & validation utilities
│   │   ├── formHelpers.ts    # generateId, cleanAreaName, localStorage, honeypot, rate limiter
│   │   └── reportValidation.ts # Form validation functions
│   ├── pages/                # File-based routing (auto-generates URLs)
│   │   ├── index.astro       # Homepage
│   │   ├── trinidad/
│   │   │   ├── dashboard.astro      # Dashboard (Leaflet map)
│   │   │   ├── headlines.astro      # Headlines page
│   │   │   ├── crime/[slug].astro   # 1,300+ crime pages
│   │   │   └── archive/             # Monthly archives
│   │   ├── blog/
│   │   │   ├── index.astro          # Blog listing
│   │   │   └── [slug].astro         # Individual posts
│   │   ├── about.astro
│   │   ├── faq.astro
│   │   ├── methodology.astro
│   │   ├── report.astro
│   │   └── 404.astro
│   └── styles/               # Global CSS
│       └── global.css        # Tailwind imports
├── public/                   # Static assets
│   ├── assets/
│   │   ├── images/           # Country cards, backgrounds
│   │   └── Trinidad-Map.svg  # Regional SVG map
│   └── favicon files
├── astro.config.mjs          # Astro configuration
├── tailwind.config.mjs       # Tailwind CSS config
└── package.json

google-apps-script/          # (Unchanged - same automation)
├── trinidad/                # Trinidad automation
├── guyana/                  # Guyana automation (deferred)
└── weekly-reports/          # Blog post generation
```

---

## Working with CSV Data (Server-Side)

**Location:** `astro-poc/src/lib/crimeData.ts`

- Sheets must be published with `single=true&output=csv`
- Use native `fetch()` API (no PapaParse)
- Data fetched at BUILD TIME (server-side only)
- Sort/filter happens during build
- All processed data is baked into static HTML

**Example:**
```typescript
import { getTrinidadCrimes } from '../lib/crimeData';

const crimes = await getTrinidadCrimes(); // Server-side only
```

---

## Creating Dynamic Pages (SSG)

**Example:** Auto-generate page for each crime

```astro
---
// src/pages/trinidad/crime/[slug].astro
import { getTrinidadCrimes } from '../../../lib/crimeData';

export async function getStaticPaths() {
  const crimes = await getTrinidadCrimes();
  return crimes.map((crime) => ({
    params: { slug: crime.slug },
    props: { crime },
  }));
}

const { crime } = Astro.props;
---

<Layout title={crime.headline}>
  <h1>{crime.headline}</h1>
  <p>{crime.summary}</p>
</Layout>
```

This generates 1,300+ static HTML pages at build time.

---

## Styling System

**IMPORTANT:** Before making ANY UI changes, consult `docs/guides/DESIGN-TOKENS.md` for the official design system.

- Tailwind utilities for layout
- Rose palette (`rose-600`, `rose-700`) for primary actions
- Custom animations in `src/css/styles.css`
- See `docs/guides/DESIGN-TOKENS.md` for **component patterns, button variants, colors, typography** (v1.0, Dec 2025)
- See `docs/guides/DESIGN-Guidelines.md` for complete framework (v2.0)
