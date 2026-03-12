---
id: C004
type: component
status: active
created: 2026-03-11
updated: 2026-03-11
related: [F010, F007, L005]
---

## Summary
`MPSidebar.astro` — sticky right-column sidebar on area and region detail pages. Contains share buttons, regional MPs, and Ko-fi support card. Always renders (sidebar exists even if no MPs).

## File
`src/components/MPSidebar.astro`

## Layout Rules

### Grid (both area/[slug].astro and region/[slug].astro)
- Outer wrapper: `max-w-5xl mx-auto px-4 sm:px-6 py-5`
- Grid: `lg:grid lg:grid-cols-[1fr_256px] lg:gap-8 lg:items-start`
- Left column: `<main class="min-w-0" data-pagefind-body>` — all main content
- Right column: `<MPSidebar .../>` — always rendered, unconditional
- **Mobile**: sidebar stacks below main (natural DOM order)

### Sticky positioning
- `lg:sticky lg:top-20` — `top-20` = 80px clears the `h-16` (64px) sticky header with 16px gap
- **Never use `lg:top-6`** — it collides with the header

## Sidebar Sections (top → bottom)

### 1. Share buttons
- Always visible, 3 buttons: X/Twitter, Facebook, WhatsApp
- Uses `data-platform`, `data-share-url`, `data-share-text` attributes
- Share text: provided via `shareText` prop, or auto-built from `areaDisplayName` + `safetyScore`
  - Area default: `Crime stats for {areaDisplayName}, Trinidad — Risk Level: {safetyScore}/10. View details at Crime Hotspots.`
  - Region: `Crime statistics for {regionName} Region, Trinidad. View details at Crime Hotspots.`
- Handled by `.sb-share-btn` query in component `<script>`; **no IDs** to avoid collisions

### 2. MPs card (conditional — `mps.length > 0`)
- Bordered card with header: "Members of Parliament" + "{regionName} Region" subtext
- Each card: 36×36px photo (`rounded-md`), honorific + full name, party badge (10px), constituency (10px)
- Links to `/trinidad/mp/{nameSlug}/`
- Party badge classes: PNM=red, UNC=orange, TPP/default=slate
- **`showAll=false` (area pages):** show 2, rest hidden behind "N more" chevron toggle
  - Toggle IDs: `mpSidebarToggle`, `mpSidebarHidden`, `mpSidebarLabel`, `mpSidebarChevron`
- **`showAll=true` (region pages):** all MPs in `id="mpMobileList"` with `class="hidden lg:block"`
  - Desktop: always visible (`lg:block` wins over `hidden`)
  - Mobile: collapsed by default; chevron button `id="mpMobileToggle"` (class `lg:hidden`) expands it

### 3. Ko-fi support card
- Always visible
- Amber hover (`hover:border-amber-400`, `hover:text-amber-700`)
- URL: `https://ko-fi.com/crimehotspots` — `target="_blank" rel="noopener noreferrer"`
- Heart SVG icon (`text-amber-500`)

## Props
```typescript
interface Props {
  mps: MP[];              // pre-filtered by caller
  regionName: string;     // raw region name (e.g. "Port of Spain")
  pageUrl: string;        // full canonical URL for share buttons
  shareText?: string;     // custom share text (region pages provide this explicitly)
  // Area-page-only (unused when shareText is provided):
  areaDisplayName?: string;
  safetyScore?: string;
  // Behaviour toggle:
  showAll?: boolean;      // false=area (2+chevron), true=region (all on desktop, mobile toggle)
}
```

## What Does NOT Go in the Sidebar
- `FeedbackToggle` ("Was this safety insight helpful?") — lives in main content, directly after `<SafetyContext>`
- `NewsletterSignup` — too wide; stays in main content
- `data-pagefind-body` — main column only; sidebar is excluded from search indexing

## Script Pattern
Component script runs on `astro:page-load`. Three handlers:
1. Share buttons — `querySelectorAll('.sb-share-btn')` → reads `data-*` attrs, opens appropriate window
2. Area page chevron toggle — `getElementById('mpSidebarToggle')` etc. (only present when `showAll=false`)
3. Region mobile toggle — `getElementById('mpMobileToggle')` + `getElementById('mpMobileList')` (only present when `showAll=true`)

## Mobile Behaviour
- Sidebar appended after `</main>` in DOM → stacks below all main content on mobile
- Share buttons show at `mt-4` separation from main content above
- Region pages: MPs collapsed on mobile by default (toggle button in card header)

## Where This Is Used
- `src/pages/trinidad/area/[slug].astro` — `showAll=false` (default)
- `src/pages/trinidad/region/[slug].astro` — `showAll=true`, MPs moved here from inline grid (Mar 11 2026)
- `src/pages/trinidad/murder-count.astro` — sidebar layout only (no MPs); share + incidents + newsletter. Does NOT use MPSidebar component — sidebar is inline in the page. Share buttons use the same `.sb-share-btn` + `data-platform`/`data-share-url`/`data-share-text` pattern.

## Site Width Standard (established Mar 11 2026)
- **Global content width:** `max-w-5xl` (64rem / 1024px) — applies to header, footer nav, footer brand, and hero `narrowContainer`
- **Sidebar column:** `256px` fixed
- **Gap:** `lg:gap-8` (32px)
- **Main column at max width:** ~736px (`1fr` within 1024px − 256px − 32px)
- **What stays narrower:** `max-w-3xl` on single-column page content (readable line lengths) — centred within the wider chrome
- **What stays wider/unchanged:** non-narrow hero (`max-w-6xl`), non-compact hero (`max-w-4xl`)
- Files owning each zone:
  - Header: `src/components/Header.astro` line 43
  - Footer nav + brand: `src/layouts/Layout.astro` lines ~376, ~453
  - Hero (narrowContainer branch): `src/components/Hero.astro` line 60

## Extension Notes
- To add sidebar to other page types: replicate the `max-w-5xl` + `lg:grid-cols-[1fr_256px]` wrapper pattern (see `tokens/layout.md` → "Sidebar Page Layout" for full template + spacing standards)
- **`min-w-0` is required on both `<main>` and `<aside>`** — grid items default to `min-width: auto` which allows overflow
- **NewsletterSignup in sidebar:** card variant form overflows 256px. Fix on the `<aside>`: add `[&_.newsletter-signup-form]:flex-col [&_.newsletter-signup-form_input]:w-full`
- **Header-above-grid pattern:** if the page was previously a centered single-column page, put the h1/title block above the grid (`text-center mb-8`). The grid then starts at the first content block so the sidebar aligns naturally with it, not the title
- If MPs need area-level filtering (not just region), add `areaSlugs: string[]` to `mps.json` schema and filter by area slug instead
