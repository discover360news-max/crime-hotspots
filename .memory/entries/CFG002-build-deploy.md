---
id: CFG002
type: config
status: active
created: 2025-12-16
updated: 2026-03-07
related: [CFG001, CFG003, CFG004]
---

## Summary
Build via `npm run build` in `astro-poc/`. Deploy via GitHub Actions → Cloudflare Pages. Daily automatic rebuild at 6AM UTC. Build must complete under 15 minutes. Current build time: ~31 seconds.

## Dev Commands
```bash
cd astro-poc
npm run dev      # Start dev server (port 4321)
npm run build    # Build for production (must pass before committing)
npm run preview  # Preview production build locally
```

## Deployment Pipeline
1. Push to `main` → GitHub Actions triggers build
2. Cloudflare Pages auto-deploys on successful build
3. Crime pages served SSR via Cloudflare Workers
4. Other pages served as static files from Cloudflare CDN

**Daily sequence (order matters):**
1. **05:00 UTC** — D1 sync worker cron (`workers/crime-sync/wrangler.toml`) — fetches latest Google Sheets CSV → upserts into D1
2. **06:00 UTC** — GitHub Actions rebuild cron `0 6 * * *` (2AM Trinidad) — builds site with fresh D1 data; invalidates CDN cache

D1 sync MUST run before the rebuild. If either schedule changes, update the other. See B022 for the bug caused when D1 ran at 10am (4h after rebuild).
- Manual rebuild trigger: GitHub Actions UI → "Build and Validate" → "Run workflow"
- Manual D1 sync trigger: `curl -X POST https://crime-sync.discover360news.workers.dev/sync`

## Environment Variables (Cloudflare Pages)
- `PUBLIC_SAFETY_TIPS_GAS_URL` — GAS web app URL for safety tips + voting
- Any other `PUBLIC_*` vars are exposed to the client

## Sitemap Ping (post-deploy)
After Cloudflare deployment is triggered, the workflow waits 60s then pings Google for both sitemaps:
- `https://www.google.com/ping?sitemap=https://crimehotspots.com/sitemap-index.xml`
- `https://www.google.com/ping?sitemap=https://crimehotspots.com/news-sitemap.xml`
This signals Google immediately after every 6am rebuild so Googlebot re-crawls within hours, not days.

## Known Issues / Gotchas
- Build time limit: 15 minutes (Cloudflare Pages free tier)
- Current build: ~31 seconds — well within limit
- Always run `npm run build` before committing to catch issues early

## Change Log
- 2025-12-16: GitHub Actions + Cloudflare Pages pipeline established
- 2026-03-20: Added Google sitemap ping step to deploy.yml (60s post-deploy delay)
