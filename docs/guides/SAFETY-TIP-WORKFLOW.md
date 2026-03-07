# Safety Tip Workflow — Creation, Configuration & Maintenance

> Claude Code is the **safety tip manager** for this project. This document is the single source of truth for every task related to safety tips: creating new tips, updating existing ones, managing the schema, and maintaining quality over time.

---

## My Role

- I (Claude) own the full safety tip pipeline end-to-end.
- I make all decisions about category, context, severity, and content unless Kavell specifies otherwise.
- Kavell supplies the raw flagged data and Story IDs. I do the rest.
- I ask for Story IDs if they are missing before creating any tip.

---

## Input Format — What Kavell Provides

Flagged rows come from the Google Sheet in this column order:

| Column | Sheet header | Notes |
|--------|-------------|-------|
| 1 | `Safety_Tip_Flag` | Always `Yes` |
| 2 | `Safety_Tip_Category` | Sheet value — may NOT match the enum exactly (see mapping below) |
| 3 | `Safety_Tip_Context` | Sheet value — may NOT match the enum exactly |
| 4 | `Tactic_Noted` | Free-text description of the criminal tactic |
| 5 | `Story_ID` | Numeric ID — must be included as a string in `related_story_ids` |

**⚠️ Sheet values vs. enum values:** The sheet columns `Safety_Tip_Category` and `Safety_Tip_Context` are filled in by whoever flags the row and do not always use the exact enum string. It is my job to map the sheet value to the correct enum value. Examples:

| Sheet says | Correct enum | Why |
|------------|-------------|-----|
| `At Work` in category column | Determine from tactic (e.g. `Home Invasion`, `Robbery`) | "At Work" is a context, not a category |
| `In Your Car` in category column | `Robbery` or `Carjacking` based on tactic | Same issue |
| `At a Hotel` in context column | `At a Hotel` ✓ | Valid enum value (added Mar 2026) |

If the Story_ID is missing from the input, **ask Kavell before creating any tip file.**

---

## Step 1 — Parse the Input

Extract from each flagged row:

1. **Tactic** — the criminal method described in `Tactic_Noted`
2. **Intended category** — interpret from sheet value + tactic
3. **Intended context** — interpret from sheet value + tactic
4. **Story_ID** — numeric; convert to string for frontmatter

---

## Step 2 — Check for Overlap

Before creating anything, confirm no existing tip covers the same tactic.

```
Glob pattern="*.md" path="astro-poc/src/content/tips/"
```

Scan titles for same category + context. Ask: "Does any existing tip give the same actionable advice?"

- **Yes** → update `related_story_ids` on the existing tip instead. No new file needed.
- **No** → proceed to Step 3.

**Tips most likely to overlap (check these first):**

| Tactic type | Likely existing tip |
|-------------|-------------------|
| Cash deposit / workplace robbery | TIP-00015 (cash deposits), TIP-00020 (deposit variance) |
| Carjacking at standstill / traffic | TIP-00007 (car-length gap), TIP-00029 (dual-flank) |
| Home entry while occupied | TIP-00009 (visitor verification), TIP-00027 (daytime home) |
| ATM crime | TIP-00002, TIP-00008, TIP-00023 |
| Online / social media fraud | TIP-00005, TIP-00010, TIP-00021, TIP-00024 |
| Public transport | TIP-00012, TIP-00017 |

---

## Step 3 — Confirm Schema Fields

Both `category` and `context` must exist in `astro-poc/src/content/config.ts`.

**Current valid categories:**
`Robbery`, `Carjacking`, `Home Invasion`, `ATM Crime`, `Online Scam`, `Kidnapping`, `Sexual Violence`, `Fraud`, `Assault`, `Shooting`, `Other`

**Current valid contexts:**
`At Home`, `In Your Car`, `At the ATM`, `In a Mall`, `Walking Alone`, `Online`, `At Work`, `Using Public Transport`, `At an Event`, `At a Hotel`, `Other`

If a value does not exist in the enum → add it to the `config.ts` enum **first**, then create the tip file. A mismatched value will break the build immediately.

---

## Step 4 — Assign Severity

| Severity | When to use |
|----------|-------------|
| `high` | Physical harm likely; breach of personal space (home, car, body, hotel room) |
| `medium` | Property loss; social engineering; avoidable with one behaviour change |
| `low` | Awareness/general precaution; no direct crime tied to the tactic |

---

## Step 5 — Determine the Next Tip ID

Run:
```
Glob pattern="*.md" path="astro-poc/src/content/tips/"
```

Find the highest-numbered file. Next tip = last ID + 1. Zero-pad to 5 digits (`TIP-00031`, `TIP-00032`, etc.).

> **Current last tip:** TIP-00036 (as of March 7, 2026)

---

## Step 6 — Create the Tip File

**File naming convention:**
```
tip-XXXXX-[short-slug-of-title].md
```

**Frontmatter template:**
```yaml
---
tip_id: "TIP-XXXXX"
title: "[Descriptive title — 4–7 words, title case]"
category: "[From valid enum]"
context: "[From valid enum]"
area: ""
severity: "[low | medium | high]"
source: "manual"
status: "published"
related_story_ids: ["[Story_ID as string]"]
date_added: YYYY-MM-DD
date_updated:
---
```

**Body format:**
1. **Opening paragraph** (3–5 sentences) — Explain *why* the criminal tactic works. Reference the specific incident as evidence. No bullet points here.
2. `**Steps to follow:**` heading
3. **4–6 bullet points** — Concrete, actionable steps. Each starts with a verb. No vague advice ("be careful", "stay aware").

**Tone rules:**
- Authoritative but not alarmist
- Specific to Caribbean/T&T context where relevant
- No emojis
- Second person ("you", "your")

---

## Step 7 — Build Check

```bash
cd astro-poc && npm run build
```

A schema mismatch or missing required field will fail immediately. Fix before proceeding. The build should complete in under 15 minutes.

---

## Step 8 — Update `recent-changes.md`

Add entries under the current date in `docs/claude-context/recent-changes.md`:
```
- **NEW TIP TIP-XXXXX** — [Title] ([Category] / [Context])
```

If a new enum value was added to `config.ts`, note it:
```
- **Schema:** Added `'[Value]'` to the `[category|context]` enum in `src/content/config.ts`
```

---

## Step 9 — Commit

Only when Kavell requests a commit. Stage only the relevant files:

```bash
git add astro-poc/src/content/tips/tip-XXXXX-[slug].md
git add astro-poc/src/content/config.ts          # only if enum was changed
git add docs/claude-context/recent-changes.md
git commit -m "Add TIP-XXXXX to TIP-YYYYY: [brief description]"
```

---

## Maintenance Tasks

### Adding a story reference to an existing tip

Edit the tip file and append the Story_ID to `related_story_ids`:
```yaml
related_story_ids: ["123", "456"]
```

### Updating a tip's content

1. Edit the tip file
2. Set `date_updated: YYYY-MM-DD` in the frontmatter
3. Run build check
4. Note in `recent-changes.md`: `- **UPDATED TIP-XXXXX** — [what changed]`

### Changing a tip's status

- `published` → tip is live and visible on the site
- `pending-review` → tip exists but is hidden from the public listing

Edit the frontmatter `status` field. No build change required.

### Adding a new category or context value

1. Edit `astro-poc/src/content/config.ts` — add the new string to the relevant `z.enum([...])` array
2. Update the **Current valid categories / contexts** tables in this document
3. Update the MEMORY.md entry for the Safety Tips System

### Reviewing all tips in a category

```
Grep pattern="category: \"Robbery\"" path="astro-poc/src/content/tips/" glob="*.md"
```

Replace `Robbery` with any category name.

---

## Quick Reference — Files Involved

| File | Purpose |
|------|---------|
| `astro-poc/src/content/tips/*.md` | Tip content files (one per tip) |
| `astro-poc/src/content/config.ts` | Zod schema — category + context enums |
| `astro-poc/src/pages/trinidad/safety-tips/` | Page routes (index + detail) |
| `astro-poc/src/components/CategoryAccordion.astro` | Tip listing UI |
| `astro-poc/src/components/TipCard.astro` | Full tip card |
| `astro-poc/src/components/CompactTipCard.astro` | Compact tip card (related tips) |
| `astro-poc/src/components/TipVote.astro` | Voting widget on tip detail pages |
| `google-apps-script/trinidad/safetyTipSubmissions.gs` | Handles community submissions + votes |
| `docs/guides/SAFETY-TIP-WORKFLOW.md` | This document |
| `docs/claude-context/recent-changes.md` | Changelog entry |

---

## Environment Requirements

- `PUBLIC_SAFETY_TIPS_GAS_URL` must be set in Cloudflare Pages env vars — required for tip submission and voting to work in production.
- GAS web app (`safetyTipSubmissions.gs`) must be deployed as "Execute as me / Anyone" for public access.
