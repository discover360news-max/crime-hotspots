---
id: CFG002
type: config
status: active
created: 2025-12-16
updated: 2026-03-25
related: [CFG001, CFG003, CFG004]
---

## Summary
Build via `npm run build` in `astro-poc/`. Deploy via GitHub Actions → `npx wrangler deploy` → Cloudflare Workers. Daily automatic rebuild at 6AM UTC. Build time: ~31 seconds.

## Dev Commands
```bash
cd astro-poc
npm run dev                        # Astro dev server (port 4321) — no D1, CSV fallback
npm run build && npx wrangler dev  # Full Workers runtime (port 8787) — real D1 bindings
npm run build                      # Production build (must pass before committing)
```

## Deployment Pipeline
1. Push to `main` → GitHub Actions triggers build
2. `npx wrangler deploy` pushes to Cloudflare Workers
3. Worker serves both SSR pages and static assets via `[assets]` block
4. Routes: `crimehotspots.com/*` + `www.crimehotspots.com/*` in wrangler.toml

**Daily sequence (order matters):**
1. **05:00 UTC** — D1 sync worker cron (`workers/crime-sync/wrangler.toml`) — fetches latest Google Sheets CSV → upserts into D1
2. **06:00 UTC** — GitHub Actions rebuild cron `0 6 * * *` (2AM Trinidad) — builds site with fresh D1 data; invalidates CDN cache

D1 sync MUST run before the rebuild. If either schedule changes, update the other. See B022 for the bug caused when D1 ran at 10am (4h after rebuild).
- Manual rebuild trigger: GitHub Actions UI → "Build and Validate" → "Run workflow"
- Manual D1 sync trigger: `curl -X POST https://crime-sync.discover360news.workers.dev/sync`

## Environment Variables (Cloudflare Workers)
- `BUTTONDOWN_API_KEY` — set as a Workers secret (`npx wrangler secret put BUTTONDOWN_API_KEY`)
- `PUBLIC_SAFETY_TIPS_GAS_URL` — set in Workers dashboard → Settings → Variables
- Any other `PUBLIC_*` vars are exposed to the client
- DB binding: D1 database `crime-hotspots-db` (configured in wrangler.toml)
- SESSION binding: KV namespace `crime-hotspots-session` (auto-provisioned by adapter)

## Sitemap Ping (post-deploy)
After Workers deployment, the workflow waits 30s then pings Google for both sitemaps:
- `https://www.google.com/ping?sitemap=https://crimehotspots.com/sitemap-index.xml`
- `https://www.google.com/ping?sitemap=https://crimehotspots.com/news-sitemap.xml`
This signals Google immediately after every 6am rebuild so Googlebot re-crawls within hours, not days.

## Known Issues / Gotchas
- `wrangler deploy` validates wrangler.toml BEFORE build — do NOT add `main` field (dist/ doesn't exist at validation time). The adapter writes `dist/server/wrangler.json` with the correct `main`; wrangler detects and uses it.
- `nodejs_compat` flag required in wrangler.toml for papaparse (imports Node.js `stream`)
- Content collections: `entry.id` not `entry.slug`; `render(entry)` not `entry.render()`; config at `src/content.config.ts` not `src/content/config.ts`
- Always run `npm run build` before committing to catch issues early

## Change Log
- 2025-12-16: GitHub Actions + Cloudflare Pages pipeline established
- 2026-03-20: Added Google sitemap ping step to deploy.yml
- 2026-03-25: Migrated to Cloudflare Workers. `npx wrangler deploy` replaces Pages curl. Node 22. Sitemap ping delay 60s→30s.
