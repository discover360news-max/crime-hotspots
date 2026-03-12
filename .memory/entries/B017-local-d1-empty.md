---
id: B017
type: bug
status: active
created: 2026-03-12
related: [D006]
---

## Summary
Local D1 (used by `wrangler pages dev --d1 DB=<id>`) is a separate empty SQLite file stored in
`.wrangler/state/v3/d1/`. It has NO schema and NO data by default. Queries fail with
"no such table: crimes" until schema is applied and data is seeded.

## Local Setup Steps
```bash
cd astro-poc

# 1. Apply schema to local D1
npx wrangler d1 execute crime-hotspots-db --local \
  --file workers/crime-sync/schema.sql

# 2. (Optional) Seed with production data
#    Export from production: wrangler d1 export crime-hotspots-db --output crimes.sql
#    Import locally: wrangler d1 execute crime-hotspots-db --local --file crimes.sql
```

## Notes
- Production D1 ID: `23311480-68d6-45ec-b351-e6185a5af80a` (WEUR region)
- The `.wrangler/` dir is gitignored — never commit local D1 state
- Local D1 being empty is expected during local dev; CSV fallback handles it
- `wrangler pages dev` must be run from `astro-poc/` (not project root) — wrangler.toml is there
- Port 8788 is often in use; use `--port 8789` if it fails to bind
