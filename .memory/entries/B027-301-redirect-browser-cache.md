# B027 — 301 Redirect Browser Cache: Slug-Not-Found Pages

**Status:** active
**Discovered:** March 24, 2026

---

## The Bug

`region/[slug].astro`, `area/[slug].astro`, and `archive/[year]/[month].astro` used `Astro.redirect('/404/', 301)` when slug resolution failed. HTTP 301 is a **permanent redirect** — browsers cache it indefinitely with no expiry.

When `loadFullAreaData()` briefly fails (Google Sheets rate limit, network hiccup, temporary outage), the page correctly returns 301 → `/404/`. But every user who visited during that window had the redirect permanently cached. On subsequent visits the browser served the cached redirect directly — never making a server request — even after the server recovered.

**Symptom reported:** "All region links go back to the homepage." The user saw the 404 page (which has the full site layout with header/nav) and interpreted it as homepage content. The URL in the address bar stayed on the region slug because the 301 redirect wasn't always followed in the expected way, or the user was confused by the 404 page's layout.

---

## The Fix

Changed to `Astro.redirect('/404/', 302)` — temporary redirect. Browsers do not cache 302s, so if the failure was transient, the next visit makes a fresh server request and gets the correct page.

**Files changed:**
- `src/pages/trinidad/region/[slug].astro` line 34
- `src/pages/trinidad/area/[slug].astro` line 40
- `src/pages/trinidad/archive/[year]/[month].astro` lines 25 and 40

---

## What Was NOT Changed

`src/pages/trinidad/crime/[slug].astro` — still uses 301 for old-slug → new-slug redirects. These are **intentional permanent migrations** (old headline-date slug → new StoryID slug). A crime's URL genuinely has permanently moved; caching is desired.

---

## Rule

> Use **302** for "not found right now" (data load failure, slug doesn't exist yet).
> Use **301** only for genuine permanent URL migrations where the new URL is stable and will never change back.

**Corollary:** Any SSR page that resolves a slug by fetching external data (Google Sheets CSV, D1 query) MUST use 302, because the resolution can fail transiently.

---

## User Recovery

Users whose browsers cached the old 301 need to hard-refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) or clear site data to purge the stale redirect. The 302 fix only prevents the problem recurring.

---

## Change Log

| Date | Change |
|------|--------|
| Mar 24, 2026 | Bug discovered + fixed. 301→302 on region/area/archive slug-not-found. |
