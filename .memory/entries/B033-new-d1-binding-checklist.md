---
name: B033-new-d1-binding-checklist
description: Adding a new D1 binding requires 3 places — wrangler.toml (main site), env.d.ts, and crime-sync wrangler.toml. Missing any one silently breaks.
type: feedback
---

When adding a new D1 database binding (e.g. JM_DB), THREE files must be updated or the binding is silently undefined at runtime:

1. **`astro-poc/wrangler.toml`** — `[[d1_databases]]` entry with binding + database_id
   - Site deploys as a **Cloudflare Worker**, NOT Pages. Bindings added via the Pages dashboard have no effect.

2. **`astro-poc/src/env.d.ts`** — declare inside `Cloudflare.Env` interface:
   ```ts
   JM_DB?: D1Database;
   ```
   Without this, `env.JM_DB` is `undefined` at runtime even if the worker binding exists.

3. **`astro-poc/workers/crime-sync/wrangler.toml`** — `[[d1_databases]]` entry so the sync worker can write to it.

After updating all three: `npm run build && npx wrangler deploy`.

**Why:** Hit during Jamaica D1 setup (Apr 5 2026). `env.JM_DB` was `undefined` because env.d.ts was missing, then again because astro-poc/wrangler.toml was missing.

**How to apply:** Whenever a new D1 database is added, run through this checklist before testing.
