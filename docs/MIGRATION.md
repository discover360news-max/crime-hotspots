# Migration Log

---

## Newsletter: Google Apps Script → Buttondown (February 2026)

### What was removed

| Item | Location | Notes |
|------|----------|-------|
| `MailchimpSignup.astro` | `astro-poc/src/components/` | **Deleted.** Despite the name, this component was not connected to Mailchimp. It submitted `{ email, area }` via `fetch` to a hardcoded Google Apps Script webhook URL, which stored signups in a Google Sheet. |
| GAS webhook URL | Inside `MailchimpSignup.astro` | `https://script.google.com/macros/s/AKfycbzIvXmh2o1unXQFKsNNesdBvGuV4PBln78YPO4L0MGZ1pgUJsUm1pyqbJrE3thKYdGA/exec` — this URL is now orphaned. The GAS script that backed it can be disabled or archived. |
| Import in `[slug].astro` | `src/pages/trinidad/area/[slug].astro` | Replaced with `NewsletterSignup` import. |

### What was added

| Item | Location | Purpose |
|------|----------|---------|
| `NewsletterSignup.astro` | `astro-poc/src/components/` | Replaces MailchimpSignup. Three visual variants: `card` (area pages), `inline` (statistics page), `footer` (Layout footer). Submits to `/api/subscribe`. |
| `subscribe.ts` | `astro-poc/src/pages/api/` | Server-side Astro API endpoint. Validates email, calls Buttondown API with `BUTTONDOWN_API_KEY`, returns JSON `{ success }` or `{ error }`. Never exposes the API key to the browser. |
| Footer section | `astro-poc/src/layouts/Layout.astro` | "Weekly crime digest" newsletter form + "Support this project" Buy Me a Coffee link — added between the nav columns and the brand signature in the global footer. |
| Inline prompt | `astro-poc/src/pages/trinidad/statistics.astro` | `NewsletterSignup variant="inline"` after the Related Resources section, before page end. |
| Newsletter + Support block | `astro-poc/src/components/CrimeDetailModal.astro` | Added below the Share row inside the crime detail modal. Newsletter `variant="footer"` + Ko-fi support link. Also fixed sticky header z-index bug (content was painting over the close button while scrolling). |

### Environment variables

| Variable | Where to set | Notes |
|----------|-------------|-------|
| `BUTTONDOWN_API_KEY` | Cloudflare Pages → Settings → Environment variables | Set for **Production** and **Preview** environments. Get the key from [Buttondown → Settings → API](https://buttondown.email/settings). |
| `BUTTONDOWN_API_KEY` (local dev) | `astro-poc/.env` (not committed) | Add `BUTTONDOWN_API_KEY=your_key` for local `npm run dev` testing. |

### Buttondown configuration

- **List slug / public URL:** https://buttondown.com/discover_360
- **Tags applied per signup:** `website` + source tag (e.g. `footer`, `area-page`, `statistics-page`)
- **API endpoint used:** `POST https://api.buttondown.com/v1/subscribers`
- **Duplicate handling:** 400 responses with "already" / "exists" in body are treated as soft-success (subscriber stays on the list, user sees a friendly "already subscribed" message)

### Ko-fi URL

Support links point to `https://ko-fi.com/crimehotspots`. Both the footer (`Layout.astro`) and the crime modal (`CrimeDetailModal.astro`) use this URL.

### CSP / headers

No changes to `public/_headers` were required. The browser never calls Buttondown directly — all API traffic goes through the Astro server endpoint (`/api/subscribe`), which is same-origin from the browser's perspective. The existing `connect-src 'self'` already covers this.

### Google Apps Script cleanup (manual, optional)

The GAS function that received signups from the old `MailchimpSignup.astro` is now unused. To clean up:
1. Open the Apps Script project for the Trinidad automation
2. Locate the function handling the email signup webhook (likely in a standalone script or `reports-page-Code.gs`)
3. Remove or archive the function and the associated Google Sheet tab ("Email Signups" or similar)

---
