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

**Daily rebuild:** GitHub Actions cron `0 6 * * *` (6AM UTC = 2AM Trinidad)
- Ensures murder count page reflects latest data
- Regenerates OG images
- Manual trigger: GitHub Actions UI → "Build and Validate" → "Run workflow"

## Environment Variables (Cloudflare Pages)
- `PUBLIC_SAFETY_TIPS_GAS_URL` — GAS web app URL for safety tips + voting
- Any other `PUBLIC_*` vars are exposed to the client

## Known Issues / Gotchas
- Build time limit: 15 minutes (Cloudflare Pages free tier)
- Current build: ~31 seconds — well within limit
- Always run `npm run build` before committing to catch issues early

## Change Log
- 2025-12-16: GitHub Actions + Cloudflare Pages pipeline established
