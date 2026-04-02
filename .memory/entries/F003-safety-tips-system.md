---
id: F003
type: feature
status: active
created: 2026-01-26
updated: 2026-04-01
related: [F005, C001]
---

## Summary
107 tips (last: TIP-00107) as of Apr 1, 2026. Tips live in `src/content/tips/` as Markdown with YAML frontmatter. Six pages (index, detail, category, context, area, submit). I (Claude) am the tip manager — I create tips from Kavell's input.

**Index + detail pages received JNews redesign (Mar 25 2026):**
- Index: dark gradient hero (max-w-5xl), category pill filters replacing CategoryAccordion, flat 3-col TipCard grid (sm:2-col, lg:3-col), stats inline in hero text
- Detail: dark gradient hero (max-w-5xl), removed rounded-3xl card wrapper, article body max-w-3xl, related tips section max-w-5xl (up to 3, lg:3-col), `is:inline` share script converted to DOMContentLoaded
- CategoryAccordion no longer used on index — still available for other pages

## Implementation Details

**Pages:** `/trinidad/safety-tips/` + `/[slug]` + `/category/[cat]/` + `/context/[ctx]/` + `/area/[area]/` + `/submit/`

**Components:** `TipCard.astro`, `CompactTipCard.astro`, `CategoryAccordion.astro`, `TipVote.astro`

**Category enum (exact strings for schema):**
`Robbery`, `Carjacking`, `Home Invasion`, `ATM Crime`, `Online Scam`, `Kidnapping`, `Sexual Violence`, `Fraud`, `Assault`, `Domestic Violence`, `Extortion`, `Shooting`, `Burglary`, `Other`

**Context enum:**
`At Home`, `In Your Car`, `At the ATM`, `In a Mall`, `Walking Alone`, `Online`, `At Work`, `Using Public Transport`, `At an Event`, `At a Hotel`, `At a Bar`, `Other`

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
- 2026-03-17: `At a Bar` context added to enum
- 2026-03-24: 75 tips live (last: TIP-00085)
- 2026-03-25: JNews redesign — index + detail pages (dark hero, pill filters, cardless detail)
- 2026-03-27: 90 tips live (last: TIP-00090). Stories 668–675: 5 new tips (TIP-00086–90); Stories 672/673/674 attached to TIP-00058/77/59. (Pre-session count was 85, not 75 — memory was stale.)
- 2026-03-28: 95 tips live (last: TIP-00095). Stories 681–685: 5 new tips (TIP-00091–95). TIP-00091 Assault/In a Mall, TIP-00092 Domestic Violence/Walking Alone, TIP-00093 Burglary/At Work, TIP-00094 Robbery/In a Mall, TIP-00095 Burglary/At Home.
- 2026-03-30: 99 tips live (last: TIP-00099). 4 new tips (TIP-00096–99) + 4 story attachments (692, 696, 698, 701).
- 2026-03-31: 102 tips live (last: TIP-00102). 3 new tips: TIP-00100 ATM Crime/At the ATM (Story 707), TIP-00101 Carjacking/In Your Car (Story 712), TIP-00102 Robbery/Other (Story 713).
- 2026-04-01: 107 tips live (last: TIP-00107). 5 new tips (TIP-00103–107); 3 story attachments (719→064, 723→084, 725→077). New: TIP-00103 Home Invasion/At Home (718), TIP-00104 Robbery/At a Bar (720), TIP-00105 Burglary/At Home (721), TIP-00106 Assault/Walking Alone (722), TIP-00107 Kidnapping/At a Bar (724).
