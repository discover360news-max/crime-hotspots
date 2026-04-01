---
name: B032-id-redirect-overrides
description: Story_IDs shifted twice (dedup + formula→static), leaving ~1k indexed URLs pointing to non-existent D1 records. Fix: id-redirect-overrides.json checked in [slug].astro.
type: feedback
---

## The Problem

Story_IDs changed twice in the 2025 sheet:
1. **Dedup (T001, Mar 2026):** Duplicate rows removed — higher-ID copies deleted, lower-ID canonical kept. Google had indexed both.
2. **Formula→static migration:** Story_ID was a spreadsheet row-number formula; when hardened to static values, many rows shifted IDs.

Result: ~1,000 ID-format URLs (e.g. `/trinidad/crime/1612-diego-martin.../`) were indexed by Google but no longer existed in D1. The fuzzy match in `[slug].astro` (strip numeric prefix, match on words) was insufficient because some word portions differed slightly between eras.

## The Fix

`src/data/id-redirect-overrides.json` — 998 entries keyed by slug (no leading/trailing slashes), values are full paths:
- Crime→crime: `/trinidad/crime/684-diego-martin-man-gunned-down-near/`
- Deleted story: `/trinidad/`

Checked in `[slug].astro` **after** D1 `oldSlug` lookup, **before** fuzzy match:

```js
import idRedirectOverrides from '../../../data/id-redirect-overrides.json';
// …
if (!crime && slug) {
  const overrideTarget = (idRedirectOverrides as Record<string, string>)[slug];
  if (overrideTarget) {
    return Astro.redirect(overrideTarget, 301);
  }
}
```

## Critical: redirect-map.json is NOT used at runtime

`redirect-map.json` is **reference only** — regenerated every build by `redirectGenerator.ts` from the CSV. Manual edits are overwritten. Do not add entries there expecting them to work.

Runtime redirect chain in `[slug].astro`:
1. Direct D1 slug match → serve page
2. D1 `old_slug` column match → 301 (headline-date format)
3. `id-redirect-overrides.json` → 301 (ID-shifted slugs, build-safe)
4. Fuzzy word match → 301 (last resort, strips numeric prefix)
5. 404 page

## How to apply

If future dedup or ID renumbering causes new 404s: generate new entries using the same word-match technique (cross-check 404 URL word portions against redirect-map.json destinations), append to `id-redirect-overrides.json`. Values must be full paths.

**Why:** redirect-map.json only maps old headline-date slugs. ID-format slug changes have no other automated handler.
