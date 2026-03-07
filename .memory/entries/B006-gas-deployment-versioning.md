---
id: B006
type: bug
status: active
created: 2026-03-06
updated: 2026-03-07
related: [B005, F002, F003]
---

## Summary
GAS Web App deployments are version-pinned. Saving/editing code does NOT update a live deployment. Every "New Deployment" creates a new URL. To update without changing the URL, you must explicitly create a "New version" on the existing deployment.

## Fix
To update a live GAS web app without changing its URL:
1. Edit the code and save
2. Go to **Deploy → Manage Deployments**
3. Click the pencil (edit) on the active deployment
4. Change "Version" dropdown to **"New version"**
5. Click Deploy

If the old deployment was accidentally archived, it must be unarchived or a new deployment created (new URL = all env vars must be updated).

## Known Issues / Gotchas
- `PUBLIC_SAFETY_TIPS_GAS_URL` in Cloudflare Pages env vars must match the deployment URL
- If the URL changes, update it in Cloudflare Pages → Settings → Environment Variables and trigger a rebuild
- The `facebookSubmitter.gs` URL is different from `safetyTipSubmissions.gs` URL — two separate deployments

## Change Log
- 2026-03-06: Documented after confusion updating the safety tips deployment
