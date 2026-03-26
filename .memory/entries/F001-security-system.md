---
id: F001
type: feature
status: active
created: 2026-01-27
updated: 2026-03-26
related: [CFG001, CFG003]
---

## Summary
Security grade A (Jan 27, 2026). Four-layer protection: XSS escaping via escapeHtml(), CSP headers in _headers, Turnstile CAPTCHA on forms, Secure+SameSite=Lax cookies. Known accepted risks documented below.

## Implementation Details

**XSS Protection:**
- `src/lib/escapeHtml.ts` — `escapeHtml()`, `sanitizeUrl()`, `validateUrl()`
- Use `escapeHtml()` on ALL user/crime data rendered via `innerHTML` or `set:html`
- Use `sanitizeUrl()` for any external URLs in anchor hrefs
- GAS email templates also use `escapeHtml()` in `reports-page-Code.gs`

**CSP Headers:** `public/_headers` — tight policy
- `unsafe-inline` and `unsafe-eval` in `script-src` required by Leaflet.js and Astro inline scripts
- Only add external domains with justification

**Cloudflare Turnstile:**
- Opt-in via `includeTurnstile={true}` prop on `<Layout>` (defaults to false)
- Only loaded on pages with forms (`/report/`, `/trinidad/safety-tips/submit/`)
- Honeypot fields + RateLimiter class as additional protection

**Cookies:** `Secure;SameSite=Lax` on all cookies (set in `cookieConsent.ts`)

## Known Accepted Risks
- `unsafe-inline` / `unsafe-eval` in CSP — required by Leaflet.js, mitigated by escapeHtml()
- 5 moderate npm CVEs in `@astrojs/language-server` chain (yaml/lodash/volar-service-yaml) — dev/IDE only, zero production exposure. Fix requires breaking downgrade of `@astrojs/check`. Leave as-is.

## Change Log
- 2026-01-18: XSS fixes — escapeHtml utility + secured CrimeDetailModal + headlines
- 2026-01-27: Security hardening audit — grade A-; CSP tightened, Secure cookie flag added
- 2026-03-26: Full security sweep — 3 XSS gaps patched (SearchModal latest-crimes, compare.astro area/region/type data, dashboardUpdates.ts region names); removed error detail leak from /api/search 500 response; added HSTS header; npm audit fix (resolved rollup/fast-xml-parser/picomatch HIGH, lodash MODERATE)
