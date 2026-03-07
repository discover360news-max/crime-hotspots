---
id: B005
type: bug
status: active
created: 2026-03-06
updated: 2026-03-07
related: [F002, F003, F004]
---

## Summary
All `.gs` files in the same GAS project share a global scope. Only ONE `doGet()` function can exist per project — the one that sorts LAST alphabetically wins and silently overrides all others.

## Context
Hit Mar 6: `safetyTipSubmissions.gs` (`s`) was overriding `facebookSubmitter.gs` (`f`), making the Facebook Submitter always return the safety tips JSON health check response instead.

## Fix
Only one `.gs` file in a project should define `doGet()`. All others must rename their web app entry point to a descriptive function name:
```js
// WRONG — two files with doGet() in same project
function doGet(e) { /* facebookSubmitter logic */ }

// CORRECT — rename the secondary handler
function handleFacebookSubmitterRequest(e) { /* logic */ }
// Then doGet() delegates:
function doGet(e) {
  if (e.parameter.source === 'facebook') return handleFacebookSubmitterRequest(e);
  return handleSafetyTipsRequest(e);
}
```

## Known Issues / Gotchas
- There is no warning or error — the wrong handler silently wins
- Sort order is alphabetical by filename — `a.gs` beats `z.gs`
- GAS deployments are version-pinned (see B006) — renaming alone doesn't fix a live deployment

## Change Log
- 2026-03-06: Discovered and fixed; safetyTipSubmissions.gs `doGet()` renamed
