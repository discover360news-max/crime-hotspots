---
id: F009
type: feature
status: active
created: 2026-03-09
updated: 2026-03-09
related: [F001, CFG001]
---

## Summary
GA4 analytics with GA4 Consent Mode v2 (GDPR/CCPA compliant). Banner shows Accept + Decline. GA4 loads in `<head>` always but with all signals denied by default — consent updates fire on user choice and on return visits.

## Key Files
- `src/layouts/Layout.astro` — consent mode default snippet + async gtag.js load in `<head>`
- `src/lib/utils/cookieConsent.ts` — banner UI + `_updateGtagConsent()` called on accept/decline/return
- `src/lib/utils/analytics.ts` — `initGA4()` is a no-op when gtag already loaded (CM v2 path)

## How It Works

### Page load (first visit)
1. `is:inline` script runs synchronously: defines `window.gtag`, sets consent defaults to `denied`, queues `gtag('config', 'G-JMQ8B4DYEG')`
2. `gtag.js` loads async — processes the queued dataLayer, sends cookieless pings only
3. Cookie consent banner shows

### User accepts
1. `acceptConsent()` → `_updateGtagConsent('granted')` → `gtag('consent', 'update', {analytics_storage: 'granted'})`
2. `onAccept` callback → `initAnalytics()` → `initGA4()` sees `window.gtag` exists → returns early (no-op)
3. Full GA4 measurement fires from this point forward

### User declines
1. `declineConsent()` → `_updateGtagConsent('denied')` — explicit re-denial (stays denied)
2. GA4 sends cookieless pings only — Google uses these for modeled data in reports

### Returning user (cookie already set to 'accepted')
1. Constructor detects cookie → calls `_updateGtagConsent('granted')` before banner shows
2. `onAccept` fires immediately — analytics instance created for `trackEvent()` to work

## Consent Signals
| Signal | Accept | Decline | Always |
|---|---|---|---|
| `analytics_storage` | granted | denied | — |
| `ad_storage` | — | — | denied |
| `ad_user_data` | — | — | denied |
| `ad_personalization` | — | — | denied |

Ad signals are always denied — site does not run Google Ads.

## Cookie
- Name: `crime_hotspots_consent`
- Values: `'accepted'` or `'declined'`
- Duration: 365 days
- Flags: `SameSite=Lax; Secure`

## GA4 Measurement ID
`G-JMQ8B4DYEG` — hardcoded in Layout.astro (not a secret; safe to commit)

## Cloudflare Analytics
Running in parallel via `<script defer data-cf-beacon>` in Layout.astro — completely cookieless, no consent required, always active.
