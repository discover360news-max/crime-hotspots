# SEO-CONFIG.md

Complete reference for all SEO infrastructure in Crime Hotspots.
**Last updated:** February 23, 2026

---

## Quick Map: Where Every SEO Element Lives

| Element | File | Notes |
|---------|------|-------|
| Canonical tags | `src/layouts/Layout.astro:69` | Auto-computed from `Astro.url.pathname` |
| og:type | `src/layouts/Layout.astro:74` | Pass `ogType="article"` for story/blog pages |
| og:title / og:description | `src/layouts/Layout.astro:75-76` | From `title` and `description` props |
| og:image | `src/layouts/Layout.astro:77` | Passed as `ogImage` prop |
| Twitter card | `src/layouts/Layout.astro:83-87` | square=summary, wide=summary_large_image |
| head slot (JSON-LD injection) | `src/layouts/Layout.astro:128` | `<slot name="head" />` — DO NOT REMOVE |
| GA4 tracking | `src/layouts/Layout.astro:170-180` | Consent-gated; ID: `G-JMQ8B4DYEG` |
| Cloudflare Analytics | `src/layouts/Layout.astro:135` | Cookieless; token: `9edc1888af84466fa5b067943e7c6f99` |
| robots meta | `src/layouts/Layout.astro:68` | `index, follow` on all pages |
| RSS feed link | `src/layouts/Layout.astro:94` | Links `/rss.xml` for feed discovery |
| NewsArticle schema | `src/pages/trinidad/crime/[slug].astro:80` | `slot="head"` → injected into `<head>` |
| Dataset schema | `src/pages/trinidad/statistics.astro` | Inline in body (Google accepts either location) |
| WebSite schema | `src/pages/index.astro` | Inline in body |
| Sitemap | `src/pages/sitemap-0.xml.ts` | Dynamic SSR, all pages |
| Sitemap index | `src/pages/sitemap-index.xml.ts` | Points to `sitemap-0.xml` |
| robots.txt | `public/robots.txt` | `Sitemap:` pointer + `Crawl-delay: 1` |
| Cache headers | `public/_headers` | Cloudflare Pages header rules |
| CSP | `public/_headers` (the `/*` block) | Single source of truth — no `<meta>` CSP |
| RSS feed content | `src/pages/rss.xml.ts` | Blog + last 20 headlines; pre-rendered |
| Breadcrumbs (visible) | `src/components/Breadcrumbs.astro` | Visual breadcrumbs on all content pages |
| Breadcrumb schema | `src/pages/trinidad/statistics.astro` | BreadcrumbList JSON-LD |

---

## 1. Canonical Tags

**File:** `src/layouts/Layout.astro:29-31, 69`

```astro
const canonicalURL = Astro.site
  ? new URL(Astro.url.pathname, Astro.site).href
  : `https://crimehotspots.com${Astro.url.pathname}`;
```

- Computed automatically from the request URL — no page needs to hardcode it.
- `Astro.site` is set to `https://crimehotspots.com` in `astro.config.mjs`.
- `trailingSlash: 'always'` in `astro.config.mjs` ensures all URLs end in `/` — prevents duplicate content from `/page` vs `/page/`.

**WARNING:** Do NOT hardcode canonical URLs in Layout props unless you have a specific reason (e.g., statistics page). Hardcoded canonicals can silently point to wrong URLs after refactors.

---

## 2. Open Graph Tags

**File:** `src/layouts/Layout.astro:71-80`

### og:type

```astro
<meta property="og:type" content={ogType}>
```

- Default: `"website"` — used for homepage, dashboard, statistics, etc.
- **Pass `ogType="article"`** for story pages (`[slug].astro`) and blog posts.
- Facebook and LinkedIn use this to determine share card format.

### og:image

- Default image: `/og-image.jpg` (1200×630)
- Crime story pages: per-crime-type thumbnail via `getCrimeTypeThumbnailUrl()`
- Murder Count page: dynamically generated OG image (`src/lib/generateOgImage.ts`)
- Image dimensions are inferred from path: `/crime-types/` → 200×200 (square), others → 1200×630

**WARNING:** The path-based dimension detection is fragile. If you change the crime type thumbnail path, also update `Layout.astro:78-79` where `.includes('/crime-types/')` is checked.

---

## 3. Structured Data (JSON-LD)

### How Injection Works

Astro's named slot mechanism is used for `<head>` injection:

**Layout.astro** exposes `<slot name="head" />` just before `</head>`:
```astro
<slot name="head" />
</head>
```

**Pages** inject structured data into it:
```astro
<script type="application/ld+json" slot="head">
  { JSON.stringify({ "@context": "https://schema.org", ... }) }
</script>
```

**WARNING:** If you remove `<slot name="head" />` from Layout.astro, all `slot="head"` structured data is silently dropped. Crime pages will lose their NewsArticle schema.

### NewsArticle Schema (Crime Pages)

**File:** `src/pages/trinidad/crime/[slug].astro:80-122`

Fields populated from CSV:
- `headline` — crime.headline
- `datePublished` / `dateModified` — crime.dateObj (ISO 8601)
- `description` — crime.summary
- `articleSection` — crime.crimeType
- `keywords` — crimeType, area, region, "crime trinidad", "trinidad news"
- `mainEntityOfPage` — absolute URL of the crime page
- `locationCreated` — area + region + country code
- `author` — crime.source (NewsMediaOrganization) or Crime Hotspots fallback
- `publisher` — Crime Hotspots Organization with logo

### Dataset Schema (Statistics Page)

**File:** `src/pages/trinidad/statistics.astro`

- Includes `license: CC BY 4.0` — enables Google Dataset Search discovery
- `distribution` links to actual CSV URLs from `csvUrls.ts`
- `temporalCoverage` and `spatialCoverage` for geo-discovery

### WebSite Schema (Homepage)

**File:** `src/pages/index.astro`

- Basic `WebSite` with name, URL, description, publisher

---

## 4. Sitemap

**Files:**
- `src/pages/sitemap-index.xml.ts` — index that points to `sitemap-0.xml`
- `src/pages/sitemap-0.xml.ts` — all pages, dynamically generated at request time

### Priority Guide

| Priority | Pages |
|----------|-------|
| 1.0 | Homepage, Dashboard |
| 0.9 | Statistics, Headlines |
| 0.8 | Murder Count, Blog index |
| 0.7 | Areas, Archive, About, FAQ, Methodology |
| 0.6 | Regions, Report, Archive months |
| 0.5 | Compare, Privacy |
| 0.8 → 0.4 | Crime pages (age-based: <30d=0.8, <90d=0.6, older=0.4) |

### Changefreq Guide

- `daily` — Dashboard, Headlines, Murder Count (new crimes added daily)
- `weekly` — Statistics, Blog, Areas, Regions (updated weekly)
- `monthly` — Archive pages, About, FAQ, Compare
- `yearly` — Privacy policy

**WARNING:** Google ignores inflated changefreq values. Don't set everything to `daily`.

### Adding a New Page to Sitemap

1. Open `src/pages/sitemap-0.xml.ts`
2. Add to `staticPages` array: `{ url: 'your/path', priority: 0.X, changefreq: 'weekly' }`
3. URL format: no leading slash, no trailing slash (they're added in the XML generator)

---

## 5. robots.txt

**File:** `public/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://crimehotspots.com/sitemap-index.xml
Crawl-delay: 1
```

- Allows all crawlers unconditionally.
- Points to sitemap index (not `sitemap-0.xml` directly — allows future multi-sitemap scaling).
- `Crawl-delay: 1` — respected by compliant bots, prevents hammering the SSR origin.

**WARNING:** Do NOT add `Disallow:` rules without careful thought. Blocking paths removes them from Google's index.

---

## 6. Cloudflare Headers (`public/_headers`)

**File:** `public/_headers`

### Rule Order

Cloudflare Pages applies ALL matching rules and uses the more specific path when headers conflict.

| Path | Cache-Control | Notes |
|------|--------------|-------|
| `/assets/*`, `/_astro/*` | `max-age=31536000, immutable` | Content-hashed files — safe to cache forever |
| `*.woff2`, `*.otf` | `max-age=31536000, immutable` | Self-hosted fonts |
| `*.png`, `*.jpg`, `*.svg` | `max-age=604800` | 1 week |
| `/trinidad/crime/*` | `max-age=3600, stale-while-revalidate=86400` | Faster repeat loads via stale serving |
| `/pagefind/*` | `max-age=86400` | Search index — 1 day |
| `/api/health.json` | `no-cache` | Monitoring always gets fresh data |
| `/api/*` | `no-cache, no-store` | All other API endpoints |
| `/*` | `max-age=3600, must-revalidate` | All HTML pages — 1h browser cache |

### Security Headers (on `/*`)

- `Content-Security-Policy` — single source of truth; do NOT also add a `<meta>` CSP (conflicts with Turnstile)
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Robots-Tag: index, follow` — reinforces `<meta name="robots">` for crawlers that read HTTP headers
- `Referrer-Policy: strict-origin-when-cross-origin` — privacy-safe referrer

**WARNING:** When adding a new external service (analytics, CDN, etc.) update `connect-src` in the CSP. See `docs/claude-context/recent-changes.md` for audit history.

---

## 7. GA4 Analytics

**File:** `src/layouts/Layout.astro:164-180`

- **Measurement ID:** `G-JMQ8B4DYEG`
- **Consent-gated:** GA4 only loads after user clicks "Accept" on the cookie banner
- **Cloudflare Analytics:** always active (cookieless, `beacon.min.js`), covers users who decline GA4
- IP anonymization enabled
- Cookie consent state stored in `cookieConsent` cookie (Secure; SameSite=Lax)

**WARNING:** Do NOT add a second GA4 script. Duplicate tags will double-count all events. The only place GA4 should appear is `initAnalytics()` in `Layout.astro`.

---

## 8. Twitter Card

**File:** `src/layouts/Layout.astro:81-86`

- `summary_large_image` — used for full-width OG images (1200×630)
- `summary` — used for square crime-type thumbnails (200×200)
- Card type is inferred from `ogImage.includes('/crime-types/')` — same fragility as og:image dimensions

---

## Checklists

### When Adding a New Page Type

- [ ] Pass `title` and `description` props to `<Layout>`
- [ ] Choose correct `ogType`: `"website"` for data pages, `"article"` for content pages
- [ ] Add appropriate structured data (use `slot="head"` for JSON-LD in `<head>`)
- [ ] Add to `sitemap-0.xml.ts` staticPages with correct priority/changefreq
- [ ] Verify breadcrumbs render correctly (use `<Breadcrumbs>` component)
- [ ] Check that `prerender = true` is set if the page is static (dashboard is dynamic, statistics is static)

### When Adding a New Country/Island Section

- [ ] Add pages to `src/pages/[country]/` directory
- [ ] Add all section URLs to `sitemap-0.xml.ts` staticPages
- [ ] Add country crime pages to the sitemap `crimePages` loop (currently hardcoded to Trinidad)
- [ ] Verify `Astro.url.pathname` canonical works for new URL structure
- [ ] Add country to `countryPathMap` in `Layout.astro` for BottomNav detection
- [ ] Create structured data schema for country statistics page (Dataset schema)
- [ ] Add country CSV URL to `src/config/csvUrls.ts`
- [ ] Test that GA4 events fire with the correct country page path

### When Changing CSV Column Names

**CRITICAL:** All CSV parsing must reference columns by header name, never by position index.
- CSVs are parsed in `src/lib/crimeData.ts` and `src/lib/csvParser.ts`
- Header-name-based parsing means adding or reordering columns never breaks the pipeline
- Verify `Crime` interface fields map to correct CSV column headers after any schema change

---

## What NOT to Change

| Element | Why |
|---------|-----|
| `<slot name="head" />` in Layout | NewsArticle schema silently disappears |
| `Sitemap:` line in robots.txt | Googlebot uses this to discover all pages |
| `CDN-Cache-Control: max-age=86400` on crime pages | Remove = Cloudflare re-renders every hit, kills LCP |
| CSP in `_headers` `/*` block | Don't add `<meta>` CSP — dual CSP breaks Turnstile |
| `trailingSlash: 'always'` in astro.config.mjs | Changing creates duplicate content (with and without `/`) |
| GA4 Measurement ID `G-JMQ8B4DYEG` | All historical analytics data tied to this property |
| `output: 'server'` in astro.config.mjs | Switching breaks crime page 301 redirects and SSR logic |

---

## Known Accepted Gaps

| Gap | Reason | Impact |
|-----|--------|--------|
| `og:image` dimensions inferred from path string | Simple heuristic; fragile but functional | Low — images still display |
| No Organization schema on homepage | Not yet added | Low — WebSite schema present |
| Statistics canonical is hardcoded string | That URL never changes | None |
| JSON-LD in body for statistics page | Uses `set:html` instead of `slot="head"` | None — Google accepts body JSON-LD |
