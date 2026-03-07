---
id: CFG001
type: config
status: active
created: 2025-12-16
updated: 2026-03-07
related: [CFG002, CFG003, CFG004, D005]
---

## Summary
Crime Hotspots — Caribbean crime data visualization platform. Trinidad & Tobago live. Astro 5.16.5 on Cloudflare Pages. GAS automation pipeline. Claude Haiku 4.5 for AI. ~2,100+ pages.

## Key Facts

| Property | Value |
|----------|-------|
| Live site | https://crimehotspots.com |
| Framework | Astro 5.16.5 |
| Hosting | Cloudflare Pages |
| Working directory | `astro-poc/` |
| Repo | `discover360news-max/crime-hotspots` |
| AI model | Claude Haiku 4.5 (`claude-3-5-haiku-20241022`) |
| Analytics | GA4 + Cloudflare Web Analytics |
| Monthly cost | ~$50–200 |
| Traffic (Feb 2026) | ~18–25 real visitors/day, ~82 page views/day |

## Tech Stack Summary
- **Frontend:** Astro 5, Tailwind CSS 4, TypeScript, Pagefind, Leaflet.js, Cloudflare Turnstile
- **Backend/Automation:** Google Apps Script, Claude Haiku 4.5, Google Sheets (CSV export)
- **CI/CD:** GitHub Actions → Cloudflare Pages (auto-deploy on push + daily 6AM UTC rebuild)

## Key Config Files
- `src/config/csvUrls.ts` — CSV data sources (single source of truth)
- `src/config/routes.ts` — all internal routes + `buildRoute.*` builders
- `src/config/crimeTypeConfig.ts` — crime types + victim count rules
- `src/config/riskWeights.ts` — crime severity weights
- `src/data/countries.ts` — country config (sections, icons, nav)

## Change Log
- 2025-12-16: Astro migration from Vite
- 2026-01-01: Claude Haiku 4.5 migration from Gemini/Groq
