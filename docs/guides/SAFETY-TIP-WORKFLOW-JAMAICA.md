# Safety Tip Workflow — Jamaica

> Claude Code is the **safety tip manager** for Jamaica tips. This document mirrors the T&T workflow (`SAFETY-TIP-WORKFLOW.md`) but is authoritative for all Jamaica-specific tip work. Read this doc, not the T&T one, when working on Jamaica tips.

---

## My Role

- I (Claude) own the full Jamaica safety tip pipeline end-to-end.
- I make all decisions about category, context, severity, and content. My recommendations stand — no verification step required.
- Kavell supplies raw flagged data and Story IDs. I do the rest.
- I ask for Story IDs if missing before creating any tip.
- I execute immediately upon receiving flagged rows: T&T cross-reference → JM overlap check → decision → create/update → build → changelog. No confirmation pause unless Story IDs are absent.

---

## Content Collection

Jamaica tips live in a **separate content collection** from T&T:

| | T&T | Jamaica |
|---|---|---|
| Collection path | `src/content/tips/` | `src/content/tips-jamaica/` |
| Tip ID format | `TIP-00001` | `JM-TIP-00001` |
| Pages | `/trinidad/safety-tips/` | `/jamaica/safety-tips/` |
| Config schema | `tips` collection in `config.ts` | `tipsJamaica` collection in `config.ts` |
| Index | `SAFETY-TIP-INDEX.md` | `SAFETY-TIP-INDEX-JAMAICA.md` |

---

## Input Format — What Kavell Provides

Flagged rows come from the Jamaica Google Sheet in this column order:

| Column | Sheet header | Notes |
|--------|-------------|-------|
| 1 | `Safety_Tip_Flag` | Always `Yes` |
| 2 | `Safety_Tip_Category` | Sheet value — may NOT match the enum exactly |
| 3 | `Safety_Tip_Context` | Sheet value — may NOT match the enum exactly |
| 4 | `Tactic_Noted` | Free-text description of the criminal tactic |
| 5 | `Story_ID` | Numeric ID — must be included as a string in `related_story_ids` |

**⚠️ Sheet values vs. enum values:** Same mapping rules as T&T — the sheet values are freeform and must be interpreted. See the mapping examples in `SAFETY-TIP-WORKFLOW.md` (Step 1).

If Story_ID is missing, **ask Kavell before creating any tip file.**

---

## Step 1 — Parse the Input

Extract from each flagged row:

1. **Tactic** — the criminal method described in `Tactic_Noted`
2. **Intended category** — interpret from sheet value + tactic
3. **Intended context** — interpret from sheet value + tactic
4. **Story_ID** — numeric; convert to string for frontmatter

---

## Step 2 — Cross-Reference T&T Tips (Jamaica-specific step)

Before checking Jamaica's own tip corpus, check the T&T tip index at **`docs/guides/SAFETY-TIP-INDEX.md`**.

**The goal:** avoid recreating advice that already exists in well-crafted form. If a T&T tip covers the same tactic and the prevention advice is ≥60% applicable to Jamaica, adapt it — don't write from scratch.

**Decision rules:**

| Match level | Action |
|-------------|--------|
| **≥60% applicable** | Use the T&T tip as the base. Adapt Jamaica-specific details: area names (Kingston, MoBay, Spanish Town), JCF terminology, parish framing. Note the T&T source tip ID in `adapted_from` frontmatter field. |
| **Partial / same tactic, different context** | Write a fresh tip but note what differs from T&T (e.g. the crime pattern works differently in Kingston vs Port of Spain). |
| **No match** | Write from scratch. |

**What typically needs adapting when borrowing from T&T:**
- Replace T&T area names with Jamaica equivalents (Kingston, MoBay, Portmore, Spanish Town, Ochi)
- Replace "divisions" with "parishes"
- Replace TTPS references with JCF (Jamaica Constabulary Force)
- Replace T&T-specific crime patterns with Jamaica-observed equivalents where different

**Do not cross-post:** A T&T tip adapted for Jamaica becomes a new Jamaica tip file — never add a JM Story_ID to a T&T tip file.

---

## Step 3 — Check Jamaica Tip Overlap

**Rule: No duplicate Jamaica tips.** If a new story is covered by an existing JM tip, attach the story to that tip — do not create a new file.

Open **`docs/guides/SAFETY-TIP-INDEX-JAMAICA.md`** — the Jamaica tip registry. Scan the relevant category section.

- **Yes, existing JM tip covers it** → update `related_story_ids` on the existing JM tip. Done.
- **Partially** → attach to the closest JM tip and note in `recent-changes.md`. Only create a new tip if the new story reveals a meaningfully different prevention angle.
- **No match** → proceed to Step 4.

---

## Step 4 — Confirm Schema Fields

Both `category` and `context` must exist in the `tipsJamaica` collection schema in `astro-poc/src/content/config.ts`.

Jamaica tips share the same category and context enums as T&T:

**Valid categories:**
`Robbery`, `Carjacking`, `Home Invasion`, `ATM Crime`, `Online Scam`, `Kidnapping`, `Sexual Violence`, `Fraud`, `Assault`, `Domestic Violence`, `Extortion`, `Shooting`, `Burglary`, `Other`

**Valid contexts:**
`At Home`, `In Your Car`, `At the ATM`, `In a Mall`, `Walking Alone`, `Online`, `At Work`, `Using Public Transport`, `At an Event`, `At a Hotel`, `At a Bar`, `Other`

If a Jamaica-specific value is needed that doesn't exist → add it to the `tipsJamaica` schema in `config.ts` first, then create the tip file. **Do not add Jamaica-only enum values to the T&T `tips` schema.**

---

## Step 5 — Assign Severity

| Severity | When to use |
|----------|-------------|
| `high` | Physical harm likely; breach of personal space (home, car, body, hotel room) |
| `medium` | Property loss; social engineering; avoidable with one behaviour change |
| `low` | Awareness/general precaution; no direct crime tied to the tactic |

---

## Step 6 — Determine the Next Tip ID

Run:
```
Glob pattern="*.md" path="astro-poc/src/content/tips-jamaica/"
```

Find the highest-numbered file. Next tip = last ID + 1. Zero-pad to 5 digits (`JM-TIP-00001`, `JM-TIP-00002`, etc.).

> **Current last tip:** None yet — first Jamaica tip will be `JM-TIP-00001`.

---

## Step 7 — Create the Tip File

**File naming convention:**
```
jm-tip-XXXXX-[short-slug-of-title].md
```

**Frontmatter template:**
```yaml
---
tip_id: "JM-TIP-XXXXX"
title: "[Descriptive title — 4–7 words, title case]"
category: "[From valid enum]"
context: "[From valid enum]"
area: ""
severity: "[low | medium | high]"
source: "manual"
status: "published"
related_story_ids: ["[Story_ID as string]"]
adapted_from: ""
date_added: YYYY-MM-DD
date_updated:
---
```

**`adapted_from` field:** If the tip was adapted from a T&T tip, enter the T&T tip ID here (e.g. `"TIP-00058"`). Leave blank if written from scratch.

**Body format:**
1. **Opening paragraph** (3–5 sentences) — Explain *why* the criminal tactic works. Reference the specific Jamaica incident as evidence. No bullet points here.
2. `**Steps to follow:**` heading
3. **4–6 bullet points** — Concrete, actionable steps. Each starts with a verb. No vague advice.

**Tone rules:**
- Authoritative but not alarmist
- Specific to Jamaica context where relevant (parishes, JCF, Kingston/MoBay geography)
- No emojis
- Second person ("you", "your")
- Do not say "in Trinidad" — tips should feel native to Jamaica

---

## Step 8 — Build Check

```bash
cd astro-poc && npm run build
```

A schema mismatch or missing required field will fail immediately. Fix before proceeding.

---

## Step 9 — Update Index + Changelog

**Update `docs/guides/SAFETY-TIP-INDEX-JAMAICA.md`:**
- Add each new tip row to the correct category table.
- Add all new/updated Story IDs to the Story → Tip cross-reference at the bottom.
- Update the header: `Last updated` date, `Total` count, `Last` tip ID.

**Update `docs/claude-context/recent-changes.md`:**
```
- **NEW JM TIP JM-TIP-XXXXX** — [Title] ([Category] / [Context])
```

If a new enum value was added to the `tipsJamaica` schema in `config.ts`, note it:
```
- **Schema (Jamaica):** Added `'[Value]'` to the `[category|context]` enum in `tipsJamaica` collection
```

---

## Step 10 — Commit

Only when Kavell requests a commit. Stage only the relevant files:

```bash
git add astro-poc/src/content/tips-jamaica/jm-tip-XXXXX-[slug].md
git add astro-poc/src/content/config.ts          # only if enum was changed
git add docs/guides/SAFETY-TIP-INDEX-JAMAICA.md
git add docs/claude-context/recent-changes.md
git commit -m "Add JM-TIP-XXXXX to JM-TIP-YYYYY: [brief description]"
```

---

## Maintenance Tasks

### Adding a story reference to an existing JM tip

Edit the tip file and append the Story_ID to `related_story_ids`:
```yaml
related_story_ids: ["123", "456"]
```

### Updating a tip's content

1. Edit the tip file
2. Set `date_updated: YYYY-MM-DD` in frontmatter
3. Run build check
4. Note in `recent-changes.md`: `- **UPDATED JM-TIP-XXXXX** — [what changed]`

### Adding a new category or context value (Jamaica only)

1. Edit `astro-poc/src/content/config.ts` — add the new string to the `tipsJamaica` collection's relevant `z.enum([...])` array only
2. Update the **Valid categories / contexts** tables in this document
3. Update `MEMORY.md` entry for the Safety Tips System

---

## Quick Reference — Files Involved

| File | Purpose |
|------|---------|
| `astro-poc/src/content/tips-jamaica/*.md` | Jamaica tip content files (one per tip) |
| `astro-poc/src/content/config.ts` | Zod schema — `tipsJamaica` collection |
| `astro-poc/src/pages/jamaica/safety-tips/` | Page routes (to be built in Phase D) |
| `docs/guides/SAFETY-TIP-INDEX-JAMAICA.md` | Jamaica tip registry — scan before creating any tip |
| `docs/guides/SAFETY-TIP-INDEX.md` | T&T tip registry — scan for cross-reference in Step 2 |
| `docs/guides/SAFETY-TIP-WORKFLOW.md` | T&T workflow — reference for shared patterns |
| `docs/claude-context/recent-changes.md` | Changelog entry |

---

## Environment Requirements

- `PUBLIC_SAFETY_TIPS_GAS_URL` — same env var as T&T for now (single GAS web app handles both). If Jamaica gets a dedicated submission sheet, a separate `PUBLIC_SAFETY_TIPS_GAS_URL_JM` will be needed.
- GAS web app must be deployed as "Execute as me / Anyone" for public access.
