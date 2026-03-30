# Social Image Workflow
## Weekly Crime Stats — Multi-Format Testing Framework

**Platform:** Facebook + Instagram (via Meta Business Suite)
**Aspect ratio:** 4:5 portrait (1080×1350px)
**Images per week:** 4
**Goal:** Week-by-week format testing until a formula is proven

---

## The Core Principle

Nobody shares crime stats. They share content that feels like a direct warning to them personally.

Before publishing any image, ask: *"Would someone who lives in this area share this to warn a friend?"*
If the answer is no, the image is wrong — regardless of how good it looks.

---

## Step 1 — Paste the Weekly Stats

```
Total: [N] incidents ([change] vs last week)

Top Crime Types:
• [Type]: [N] incidents ([+/-N], [+/-%])
• ...

Hotspots (areas with highest concentration):
• [Area]: [N] incidents
• [Area]: [N] incidents
• [Area]: [N] incidents
```

---

## Step 2 — Select the 4 Posts

Each week pick 4 stats to post. Use this priority order:

1. The hotspot area with the biggest spike — leads with a named neighbourhood
2. The crime type with the highest % increase
3. The crime type with the highest raw volume (most common = most relatable)
4. One positive stat — biggest % decrease (only if -20% or more), otherwise use overall total if it dropped

---

## Step 3 — Pick a Format for Each Post

This is the testing layer. Each week, assign formats from the table below. **Rotate formats week to week** — never repeat the same format in the same slot two weeks running. The Tracking Log records what was used so you can compare engagement.

### Format Menu

| ID | Name | Description | Tool |
|----|------|-------------|------|
| **F1** | Pure Text Card | Black background, red label, bold white stat, one supporting line. No image. | Canva |
| **F2** | Neighbourhood Warning | Named area front and centre. One stat. Dark bg. Feels like a direct alert. | Canva |
| **F3** | Leaderboard Card | Top 3 hotspot areas ranked with incident counts. More info = more reason to share. | Canva |
| **F4** | Question Hook | Opens with a question ("Is [Area] getting safer?"), answers with the stat. | Canva |
| **F5** | AI Scene Image | Photorealistic generated scene with text overlay. See templates below. | Gemini + Canva |

**Default week-1 assignment:**

| Post | Stat | Format |
|------|------|--------|
| 1 — Named hotspot spike | Area with biggest rise | F2 — Neighbourhood Warning |
| 2 — Biggest % crime spike | Crime type | F1 — Pure Text Card |
| 3 — Highest volume crime | Crime type | F3 — Leaderboard Card |
| 4 — Positive stat | Decrease or overall drop | F1 — Pure Text Card |

Swap formats in subsequent weeks and track results in the Tracking Log.

---

## Format Templates

### F1 — Pure Text Card

**Canva layout:**
- Background: `#0D0D0D` (near-black)
- Top label: Red pill badge — `CRIME ALERT` or `THIS WEEK` in white caps, 14–16px
- Headline: Bold white, 56–64px, 2–3 lines max
- Supporting line: Regular weight white, 22–24px, muted opacity
- Bottom: `crimehotspots.com` wordmark, small, bottom-left

**Content structure:**
```
[RED BADGE] CRIME ALERT

[CRIME TYPE OR AREA]
up [N]% this week

[N] incidents — [+/-CHANGE] vs last week
```

**Positive variant:** swap red badge for dark green, headline in white, supporting line in light green.

---

### F2 — Neighbourhood Warning Card

**Canva layout:**
- Background: `#0D0D0D` or dark navy
- Top-left: Small location pin icon + neighbourhood name in muted caps (e.g. `LAVENTILLE`)
- Headline: Bold white, large — the stat itself (e.g. `Robberies up 40%`)
- Sub-line: "This week — [N] incidents" in smaller regular weight
- Bottom strip: thin red or amber horizontal rule, then `crimehotspots.com`

**Content structure:**
```
[PIN ICON] [NEIGHBOURHOOD NAME]

[CRIME TYPE] up [N]%
this week

[N] incidents recorded
[+CHANGE] vs last week

crimehotspots.com
```

**Rule:** Always include a named area — never post a generic stat with no location.

---

### F3 — Leaderboard Card

Best used for the overall hotspot summary or the most common crime type.

**Canva layout:**
- Background: `#0D0D0D`
- Title row: `THIS WEEK'S HOTSPOTS` or `TOP CRIME AREAS` — red caps label
- Ranked list: 3 rows, each with rank number (large, muted), area name (bold white), incident count (right-aligned, accent colour)
- Optional: small up/down arrow next to each count showing week-over-week direction
- Bottom: `crimehotspots.com`

**Content structure:**
```
[RED LABEL] THIS WEEK'S HOTSPOTS

#1  [Area Name]          [N] incidents  ↑
#2  [Area Name]          [N] incidents  →
#3  [Area Name]          [N] incidents  ↓

Week of [DATE] — crimehotspots.com
```

---

### F4 — Question Hook Card

Opens with a question that speaks directly to the viewer's personal safety. The stat is the answer.

**Canva layout:**
- Background: dark, same palette
- Top line: Question in regular weight, muted white — smaller than the answer
- Answer: Large bold white stat
- Small supporting context line
- Bottom: `crimehotspots.com`

**Content structure:**
```
Is [Area] getting safer?

Not this week.
[Crime Type] up [N]%.

[N] incidents — [CHANGE] vs last week
crimehotspots.com
```

Or for a positive stat:
```
One thing that improved
in [Area] this week:

[Crime Type] down [N]%.

[N] incidents — [CHANGE] vs last week
crimehotspots.com
```

---

### F5 — AI Scene Image (Gemini)

Use sparingly — test against the text formats first to establish whether scene imagery adds anything.

#### Clinical Template
```
Photorealistic [SUBJECT], pure white or pale grey surface,
cold neutral studio lighting, zero shadows. Forensic, detached.
Portrait orientation 4:5. Bold black sans-serif text upper left:
"[CRIME TYPE]: [DIRECTION][PERCENTAGE]%"
Smaller grey line directly below: "[N] incidents — [up/down] [CHANGE] this week"
No borders, no branding.
```

#### Visceral Template
```
Photorealistic [SUBJECT], dark concrete or black surface,
harsh single-source directional light, deep shadows. High contrast, raw.
Portrait orientation 4:5. Bold white sans-serif text upper left:
"[CRIME TYPE]: [DIRECTION][PERCENTAGE]%"
Smaller white line directly below: "[N] incidents — [up/down] [CHANGE] this week"
No other text or branding.
```

#### Subject Library

**Clinical (white/pale bg):**

| ID | Subject | Crime types |
|----|---------|-------------|
| C1 | Shattered car window glass on white | Theft, carjacking |
| C3 | Empty evidence bag lying flat | Positive stats |
| C5 | Wallet open and empty, overhead | Theft, robbery |
| C8 | Open handcuffs on white | Positive stats |
| C9 | Evidence tags in a row | Seizures |
| C11 | Broken eyeglasses, one lens cracked | Assault |
| C12 | Latex glove with faint smear | Attempted murder, assault |

**Visceral (dark bg):**

| ID | Subject | Crime types |
|----|---------|-------------|
| V1 | Confiscated contraband on dark concrete | Seizures |
| V2 | Splintered door frame | Burglary, home invasion |
| V7 | Smashed window on dark surface | Robbery, theft |
| V9 | Hospital wristband, clinical light | Assault, shooting |
| V13 | Scattered belongings on wet ground | Robbery, mugging |
| V14 | Shell casings, overhead light | Shooting |

**Cinematic:**

| ID | Subject | Crime types |
|----|---------|-------------|
| A1 | Rain-slicked urban street at night, police strobe distant | Overall totals |

Add new subjects here with a date tag. Never repeat the same subject two weeks running for the same crime type.

---

## Step 4 — Text Values Reference

| Field | Format | Example |
|-------|--------|---------|
| CRIME TYPE | Title case | `Robberies` |
| AREA | Proper name | `Laventille` |
| DIRECTION | Arrow only | `↑` or `↓` |
| PERCENTAGE | No decimal | `40%` |
| N | Integer | `11` |
| CHANGE | +/- integer | `+5` or `-3` |

**Colour rules:**
- Positive stat → dark green label/badge, white text
- Crime spike → red label/badge, white text
- Neutral → amber or white label

---

## Quality Checklist

- [ ] A named area or specific crime type is in the headline — no generic stats
- [ ] Numbers match the weekly data exactly
- [ ] Arrow direction matches the change (up = ↑, down = ↓)
- [ ] Text is legible at thumbnail size (check at 25% zoom)
- [ ] 4:5 crop is clean — nothing important cut off
- [ ] `crimehotspots.com` appears on every image
- [ ] The 4 images feel visually distinct from each other
- [ ] The "would they share this to warn a friend?" test passes

---

## How to Invoke This Workflow with Claude

Paste the weekly stats block and say:

> "Generate this week's 4 social posts using the social image workflow."

Claude will:
1. Select the 4 stats
2. Assign formats based on the rotation (checking the Tracking Log for what ran last week)
3. Output copy-ready content for each format — text, layout notes, and (if F5) a Gemini prompt

Override options:
- "Use F1 for all 4 this week" — override formats
- "Skip the positive post" — if no stat qualifies
- "Use V9 for the assault image" — override subject choice for F5

---

## Tracking Log

Update after each week once engagement data is in.

**Performance key:** — = no data | ✓ strong (keep using) | ~ average | ✗ retire

| Week | Post | Stat used | Format | Likes | Comments | Shares | Notes |
|------|------|-----------|--------|-------|----------|--------|-------|
| Mar 12–20 | Seizures ↑17% | Seizures | F5 V1 Visceral | — | — | — | First run, no engagement data |
| Mar 12–20 | Attempted Murder ↑13% | Att. Murder | F5 C12 Clinical | — | — | — | First run |
| Mar 12–20 | Total ↑18% | Overall | F5 A1 Cinematic | — | — | — | First run |
| Mar 12–20 | Assault ↓17% | Assault | F5 C3 Clinical | — | — | — | First run |
| Mar 19–27 | San Fernando +5 | Area spike | F2 Neighbourhood Warning | — | — | — | First Canva run |
| Mar 19–27 | Assault ↑40% | Crime spike | F1 Pure Text Card | — | — | — | First Canva run |
| Mar 19–27 | Top crime types leaderboard | Volume | F3 Leaderboard Card | — | — | — | First Canva run |
| Mar 19–27 | Robbery ↓41% | Positive | F4 Question Hook | — | — | — | First Canva run |

---

## Format Rotation Guide

Once you have 4+ weeks of data, use this to decide what to keep testing:

1. Any format with consistent shares → keep in rotation, increase frequency
2. Any format with zero shares 3 weeks running → retire, replace with an untested format
3. The first format to produce a share from someone outside your existing followers = the breakthrough format — double down on it

---

*Created: Mar 2026 | Redesigned: Mar 2026 | Platform: FB + IG via Meta Business Suite*
