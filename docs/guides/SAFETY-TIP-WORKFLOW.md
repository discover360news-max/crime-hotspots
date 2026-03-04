# Safety Tip Creation Workflow

> Use this guide every time a new `Safety_Tip_Flag = Yes` row appears in the crime data.

---

## Step 1 — Triage the Flag

From the flagged row, extract:

| Field | Source column |
|---|---|
| Category | `Safety_Tip_Category` |
| Context | `Safety_Tip_Context` |
| Tactic | `Tactic_Noted` |
| Story ID | The numeric Story_ID from the crime row |

---

## Step 2 — Check for Overlap

Before creating anything, confirm no existing tip already covers the same tactic.

**Run in Claude Code:**
```
Glob pattern="*.md" path="astro-poc/src/content/tips/"
```

Then scan titles for same category + context combination. Ask: "Does any existing tip give the same actionable advice?"

- If **yes** → consider updating `related_story_ids` on the existing tip instead of creating a new one
- If **no** → proceed to Step 3

---

## Step 3 — Confirm Schema Fields

Both `category` and `context` must exist in the enum in `astro-poc/src/content/config.ts`.

**Valid categories:** `Robbery`, `Carjacking`, `Home Invasion`, `ATM Crime`, `Online Scam`, `Kidnapping`, `Sexual Violence`, `Fraud`, `Assault`, `Shooting`, `Other`

**Valid contexts:** `At Home`, `In Your Car`, `At the ATM`, `In a Mall`, `Walking Alone`, `Online`, `At Work`, `Using Public Transport`, `At an Event`, `Other`

If the flagged category or context does not exist in the enum → add it to `config.ts` first (both the `category` and `context` enums), then proceed.

---

## Step 4 — Assign Severity

| Severity | When to use |
|---|---|
| `high` | Physical harm possible or likely; breach of personal space (home, car, body) |
| `medium` | Property loss; social engineering; avoidable with a single behaviour change |
| `low` | Awareness/general precaution; no direct crime tied to the tactic |

---

## Step 5 — Determine the Next Tip ID

Check the last file in `astro-poc/src/content/tips/` — tip IDs are sequential (`TIP-00026`, `TIP-00027`, etc.).

Next tip = last ID + 1. Zero-pad to 5 digits.

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
1. **Opening paragraph** (3–5 sentences) — Explain *why* the criminal tactic works. Use the specific incident as evidence. No bullet points here.
2. `**Steps to follow:**` heading
3. **4–6 bullet points** — Concrete, actionable steps. Each starts with a verb. Avoid vague advice like "be careful."

**Tone rules:**
- Authoritative but not alarmist
- Specific to Caribbean/T&T context where relevant
- No emojis
- Second person ("you", "your")

---

## Step 7 — Build Check

After writing the file, run:
```bash
cd astro-poc && npm run build
```

A schema mismatch (wrong enum value, missing field) will fail the build immediately. Fix before committing.

---

## Step 8 — Update `recent-changes.md`

Add a one-line entry under the current date in `docs/claude-context/recent-changes.md`:
```
- **NEW TIP TIP-XXXXX** — [Title] ([Category] / [Context])
```

---

## Step 9 — Commit

Only when Kavell requests a commit:
```
git add astro-poc/src/content/tips/tip-XXXXX-[slug].md
git commit -m "Add TIP-XXXXX: [Title]"
```

---

## Quick Reference — Files Involved

| File | Purpose |
|---|---|
| `astro-poc/src/content/tips/*.md` | Tip content files |
| `astro-poc/src/content/config.ts` | Schema — category + context enums |
| `docs/guides/SAFETY-TIP-WORKFLOW.md` | This document |
| `docs/claude-context/recent-changes.md` | Changelog entry |
