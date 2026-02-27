# Safety Tips System — Implementation Guide

**Created:** February 27, 2026
**Status:** Active

---

## 1. Writing and Adding a New Tip

### File naming

```
src/content/tips/tip-XXXXX-short-title-slug.md
```

Use the next sequential `tip_id` and a short slug (3-6 words) derived from the title. Example:

```
tip-00001-empty-seat-protocol.md
tip-00002-atm-awareness-after-withdrawal.md
```

### Frontmatter fields

```yaml
---
tip_id: "TIP-00001"
title: "Empty Seat Protocol When Driving Alone"
category: "Carjacking"   # Robbery | Carjacking | Home Invasion | ATM Crime | Online Scam |
                         #   Kidnapping | Sexual Violence | Fraud | Assault | Other
context: "In Your Car"   # At Home | In Your Car | At the ATM | In a Mall | Walking Alone |
                         #   Online | At Work | Using Public Transport | At an Event | Other
area: ""                 # Leave blank for a national tip; fill for area-specific tips (e.g. "Port of Spain")
severity: "high"         # low | medium | high
source: "manual"         # manual | community
status: "published"      # published | pending-review
related_story_ids: []    # e.g. ["00842", "00901"] — Story_IDs from CSV
date_added: 2026-02-27
date_updated:            # Optional — fill if tip is later revised
---
```

### Tip body (Markdown)

Write the actionable advice below the frontmatter as standard Markdown. A good tip has:

- **What to do** (specific action, not vague advice)
- **Why it works** (optional — 1 sentence)
- **Bullet list** if multiple steps

Example:

```md
When driving alone at night, keep the front passenger seat visibly empty and ensure your doors are locked at all times.

Carjackers often target lone drivers stopped at red lights. An empty seat with no bag or visible valuables reduces perceived opportunity and signals that no easy distraction is available.

**Steps to follow:**
- Remove bags and valuables from front passenger seat
- Lock doors as soon as you enter the vehicle
- Avoid stopping in unlit or isolated areas late at night
```

---

## 2. Linking Tips to Story IDs

The `related_story_ids` array accepts Story_IDs from the Trinidad CSV (e.g. `"00842"`).

**How to find a Story_ID:** Look at the URL of any crime page. The slug starts with the Story_ID:
```
/trinidad/crime/00842-missing-man-found-dead-princes-town/
                ^^^^^  ← Story_ID
```

The individual tip page resolves these IDs at request time via `getTrinidadCrimes()` and renders linked headline cards below the tip body.

You can link up to ~20 stories; there's no enforced limit.

---

## 3. Community Submission Review Workflow

1. Open the pipeline spreadsheet → **Safety Tip Submissions** tab
2. Review the submission (Title, Description, Category, Context)
3. If approved:
   - Create a new `.md` file in `src/content/tips/` using the frontmatter above
   - Set `source: "community"` and `status: "published"`
   - Use the submission's description as the tip body; edit for clarity if needed
4. If rejected: set Status column = `rejected` (no action needed in Astro)
5. Commit the new `.md` file → Cloudflare auto-deploys

---

## 4. Gemini Workflow for Generating Tips from Flagged Incidents

When Claude flags an incident with `safety_tip_flag: "Yes"`, the sheet will show the tactic in column 20 (`Tactic_Noted`).

Use this Gemini prompt to draft the tip:

```
You are a crime safety writer for a Trinidad & Tobago crime statistics site.

Write a concise, actionable crime safety tip based on the following incident tactic:

TACTIC: [paste Tactic_Noted here]
CATEGORY: [paste Safety_Tip_Category]
CONTEXT: [paste Safety_Tip_Context]
AREA: [area from the crime record, or leave blank for national]

Output a safety tip in this format:
1. A title (10 words or fewer, imperative sentence)
2. 2-3 short paragraphs of actionable advice
3. A bullet list of 3-5 specific steps to take

Tone: calm, practical, not alarmist. Focus on what people CAN do, not on fear.
```

Paste the output into a new `.md` file, format it, and publish.

---

## 5. How Tips Appear on Crime Pages

**Matching logic** (`src/pages/trinidad/crime/[slug].astro`):

1. `normalizedCrimeType(crime.primaryCrimeType)` converts the CSV crime type to a tip category
2. `getCollection('tips')` filters by matching category + `status === 'published'`
3. `sortTipsByAreaRelevance()` puts area-specific tips first, national tips second
4. Maximum 3 tips shown; if 0 matches → nothing rendered (no placeholder)

**What renders:** A compact card section with title, category badge, and "Read full tip →" link.

**Zero-result behaviour:** The section is entirely hidden. No empty state shown.

---

## 6. SEO Intent per Page Type

| Page | Title pattern | Intent |
|------|--------------|--------|
| `/safety-tips/` | Crime Safety Tips Trinidad | Hub — captures broad safety queries |
| `/safety-tips/[slug]/` | [Tip title] \| Safety Tips Trinidad | Specific tactic advice |
| `/safety-tips/category/[cat]/` | [Category] Safety Tips Trinidad | Category-level safety intent |
| `/safety-tips/context/[ctx]/` | Staying Safe [Context] in Trinidad | Situational queries (e.g. "safe driving Trinidad") |
| `/safety-tips/area/[area]/` | Safety Tips for [Area], Trinidad | Hyper-local queries (min 3 tips per area) |
| `/safety-tips/submit/` | Submit a Safety Tip | Community engagement |

---

## 7. What NOT to Change

- **`SafetyContext.astro`** — This is a separate score-based component. Curated tips supplement it; they will eventually replace it but currently coexist. Do NOT remove `SafetyContext` from crime pages.
- **Schema field constraints** — The `category` and `context` enums must match exactly between `config.ts`, the GAS prompt, and `safetyTipsHelpers.ts`. Changing them requires updating all three.
- **Minimum tips threshold for area pages** — `MIN_TIPS_FOR_PAGE = 3` in `area/[area].astro`. Do not lower this; thin area pages hurt SEO.
- **`related_story_ids` format** — Must be strings (e.g. `"00842"`, not `842`). The CSV lookup uses string comparison.

---

## 8. Files Reference

| File | Purpose |
|------|---------|
| `src/content/config.ts` | Tips collection Zod schema |
| `src/content/tips/` | Tip `.md` files live here |
| `src/lib/safetyTipsHelpers.ts` | `normalizedCrimeType()`, `sortTipsByAreaRelevance()`, `slugifyCategory()` |
| `src/components/TipCard.astro` | Full card for grid pages |
| `src/components/CompactTipCard.astro` | Inline card for crime pages |
| `src/pages/safety-tips/index.astro` | Main index (prerendered) |
| `src/pages/safety-tips/[slug].astro` | Individual tip (SSR + CDN cache) |
| `src/pages/safety-tips/category/[category].astro` | Category pages (prerendered) |
| `src/pages/safety-tips/context/[context].astro` | Context pages (prerendered) |
| `src/pages/safety-tips/area/[area].astro` | Area pages (prerendered, min 3 tips) |
| `src/pages/safety-tips/submit/index.astro` | Community submission form (prerendered) |
| `google-apps-script/trinidad/safetyTipSubmissions.gs` | GAS web app for form submissions |
| `google-apps-script/trinidad/claudeClient.gs` | Updated with 4 new safety tip fields |
| `google-apps-script/trinidad/processor.gs` | Writes safety fields to columns 17-20 |
