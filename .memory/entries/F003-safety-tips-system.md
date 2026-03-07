---
id: F003
type: feature
status: active
created: 2026-01-26
updated: 2026-03-07
related: [F005, C001]
---

## Summary
43 safety tips (TIP-00001–TIP-00043) as of Mar 7, 2026. Tips live in `src/content/tips/` as Markdown with YAML frontmatter. Six pages (index, detail, category, context, area, submit). I (Claude) am the tip manager — I create tips from Kavell's input.

## Implementation Details

**Pages:** `/trinidad/safety-tips/` + `/[slug]` + `/category/[cat]/` + `/context/[ctx]/` + `/area/[area]/` + `/submit/`

**Components:** `TipCard.astro`, `CompactTipCard.astro`, `CategoryAccordion.astro`, `TipVote.astro`

**Category enum (exact strings for schema):**
`Robbery`, `Carjacking`, `Home Invasion`, `ATM Crime`, `Online Scam`, `Kidnapping`, `Sexual Violence`, `Fraud`, `Assault`, `Shooting`, `Other`

**Context enum:**
`At Home`, `In Your Car`, `At the ATM`, `In a Mall`, `Walking Alone`, `Online`, `At Work`, `Using Public Transport`, `At an Event`, `At a Hotel`, `Other`

**GAS web app:** `safetyTipSubmissions.gs` — receives POST from submit form + vote requests
- Env var required: `PUBLIC_SAFETY_TIPS_GAS_URL` in Cloudflare Pages
- Tip Votes → "Tip Votes" sheet; Submissions → "Safety Tip Submissions" sheet

**Input format from Kavell:**
`Safety_Tip_Flag | Safety_Tip_Category | Safety_Tip_Context | Tactic_Noted`
- Sheet values may not exactly match enum — interpret and map
- Always ask for Story_ID if missing (`related_story_ids` must be strings, not numbers)

**Full workflow:** `docs/guides/SAFETY-TIP-WORKFLOW.md` — 9-step process, read before creating/editing tips

## Known Issues / Gotchas
- `related_story_ids` field must be strings: `["00842"]` not `[842]`
- Voting requires redeployment of GAS + env var confirmed
- `PUBLIC_SAFETY_TIPS_GAS_URL` must match current active deployment URL

## Change Log
- 2026-01-26: Safety tips system launched (25 initial tips)
- 2026-03-01: Tip voting system added (TipVote.astro)
- 2026-03-06: `At a Hotel` context added to enum
- 2026-03-07: 43 tips live
