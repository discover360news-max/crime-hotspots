---
id: L004
type: learning
status: active
created: 2026-02-27
updated: 2026-03-07
related: [B001, B002, L001]
---

## Summary
Two patterns for passing server-side data to client scripts. `define:vars` exposes window globals (one-time data); `data-*` attributes on HTML elements expose per-page data that must be read fresh on each navigation.

## Implementation Details

**Pattern 1 — `define:vars` (for window globals, one-time setup):**
```astro
<script define:vars={{ allCrimes, config }}>
  // ONLY for exposing data — no logic or astro:page-load here
  window.__crimesData = allCrimes;
  window.__config = config;
</script>
```
- Makes the script inline (loses deduplication benefits)
- Do NOT put `astro:page-load` listeners or complex logic inside `define:vars` scripts

**Pattern 2 — `data-*` attributes (for per-page vars on static builds):**
```astro
<div id="pageData" data-slug={slug} data-area={area} data-year={year} />
```
```js
document.addEventListener('astro:page-load', () => {
  const el = document.getElementById('pageData');
  const slug = el?.dataset.slug;
  // use slug...
});
```
- Preferred for pre-rendered pages with unique data per page
- Data is read fresh inside `astro:page-load` — survives SPA navigation correctly

**Pattern 3 — JSON-LD structured data:**
```astro
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```
See B001 — never use `{expression}` syntax inside script tags.

## Known Issues / Gotchas
- `window.__crimesData` is set on 5 pages (see L008) — area pages set area-scoped crimes only
- `define:vars` scripts are deduplicated by Astro if the same vars produce the same hash — avoid for per-page dynamic data

## Change Log
- 2026-02-27: B001 bug led to establishing this pattern explicitly
