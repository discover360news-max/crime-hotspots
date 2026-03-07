---
id: F007
type: feature
status: active
created: 2026-02-01
updated: 2026-03-07
related: [CFG001]
---

## Summary
Newsletter via Buttondown; Ko-fi for support. `NewsletterSignup.astro` has 3 variants. Critical gotcha: Cloudflare Workers cannot reach Buttondown API subdomains — the form must POST directly from the browser to the embed endpoint.

## Implementation Details

**Buttondown:**
- Endpoint: `POST https://buttondown.com/api/emails/embed-subscribe/discover_360`
- Form field: `email`
- Must POST from **browser** — Workers cannot reach this subdomain

**Ko-fi:**
- URL: `https://ko-fi.com/crimehotspots`
- Used in Header (♥ Support button, desktop + hamburger) and crime detail page right column

**`NewsletterSignup.astro` variants:**
- `card` — area detail pages (right column)
- `inline` — statistics page
- `footer` — Layout footer, subscribe tray, crime modal

## Known Issues / Gotchas
- NEVER server-side proxy the Buttondown request through a Cloudflare Worker — the subdomain is unreachable from Workers runtime
- The form action must be the embed endpoint, not the API endpoint
- Support card on crime detail page uses amber hover (Ko-fi brand colour)

## Change Log
- 2026-02-01: Newsletter + Ko-fi integration implemented
