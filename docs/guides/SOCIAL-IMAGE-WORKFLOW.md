# Social Image Generation Workflow
## Weekly Crime Stats — Gemini Image Prompts

**Platform:** Facebook + Instagram (via Meta Business Suite)
**Aspect ratio:** 4:5 portrait (1080×1350px) — optimal for both feeds without cropping
**Text rendering:** Burnt into image by Gemini
**Images per week:** 4 (3 crime spikes + 1 positive trend)

---

## Step 1 — Paste the Weekly Stats

Paste the weekly update block in this format:

```
📊 Total: [N] incidents ([change])

Top Crime Types:
• [Type]: [N] incidents ([change], [direction]%)
• ...

Hotspots: [Area] ([N]), [Area] ([N])
```

---

## Step 2 — Select the 4 Images

**Pick 3 crime spike images** using this priority order:
1. Highest **percentage increase** (most alarming growth signal)
2. Highest **raw volume** (most common crime — most relatable)
3. Highest **emotional weight** (violence, invasion of safety)

**Pick 1 positive image:**
- Biggest **percentage decrease** — must be at least -20% to be worth celebrating
- If no stat qualifies, use overall total if it dropped week-over-week

---

## Step 3 — Assign Styles

| Image | Style |
|-------|-------|
| Positive stat | Clinical / Data Journalism |
| Highest volume crime | Clinical / Data Journalism |
| Highest % spike | Raw / Visceral |
| Emotional weight crime | Raw / Visceral |

---

## Step 4 — Pick a Creative Concept

Choose one concept per image from the library below, or invent a new one.
Rotate concepts week-to-week for variety — avoid repeating the same visual 2 weeks in a row.

### Clinical / Data Journalism Concepts
Aesthetic: pure white or pale grey background, cold neutral studio lighting, zero shadows, forensic, detached.

| # | Subject | Notes |
|---|---------|-------|
| C1 | Shattered car window glass spread on white surface | Works for theft, carjacking |
| C2 | Single closed padlock on white surface | Positive stats / security |
| C3 | Empty evidence bag lying flat on white | Neutral — works for most |
| C4 | Lone key in a lock, overhead shot | Security / prevention angle |
| C5 | Wallet lying open and empty, overhead shot | Theft, robbery |
| C6 | Torn legal document on white surface | Fraud, financial crime |
| C7 | CCTV camera close-up, neutral bg | Any crime — surveillance angle |
| C8 | Empty handcuffs lying open on white | Positive stats — nobody arrested, no crime |
| C9 | Police evidence tags laid out in a row | Seizures, any crime |
| C10 | Single item (phone, bag, watch) with visible damage | Theft, robbery, assault |

### Raw / Visceral Concepts
Aesthetic: dark or textured background, hard directional light, deep shadows, high contrast, unsettling.

| # | Subject | Notes |
|---|---------|-------|
| V1 | Top-down confiscated contraband spread on dark concrete | Seizures — drugs, weapons, cash |
| V2 | Splintered wooden door frame — forced entry | Assault, home invasion, burglary |
| V3 | Single overturned chair under a dangling bare bulb | Assault, general violence |
| V4 | Dark alley with single harsh streetlight | General crime, robbery, shooting |
| V5 | Gloved hands holding an evidence bag against dark bg | Seizures, investigation |
| V6 | Close-up of broken padlock, chain cut | Burglary, theft, forced entry |
| V7 | Smashed window on a dark surface, glass fragments | Robbery, theft, assault |
| V8 | Silhouette of a figure against a lit doorway | General crime, unease |
| V9 | Hospital wristband on a dark surface, clinical light | Assault, shooting, murder |
| V10 | Burned-out car wreck at night, embers faint | Arson, extreme crime |
| V11 | Police tape stretched across a dark background | Any crime — aftermath |
| V12 | Close-up hands in handcuffs, dramatic lighting | Arrest, seizure, general |

---

## Step 5 — Fill the Prompt Template

### Clinical Template

```
Photorealistic [CONCEPT DESCRIPTION], [BACKGROUND — pure white / pale grey surface],
cold neutral studio lighting, zero shadows. Forensic, detached, data journalism aesthetic.
Portrait orientation 4:5. Bold [black / dark green for positive] sans-serif text upper left:
"[CRIME TYPE]: [DIRECTION][PERCENTAGE]%". Smaller secondary grey line directly below:
"[N] incidents — [up/down] [CHANGE] this week". No borders, no branding. Stark, minimal.
```

### Visceral Template

```
Photorealistic [CONCEPT DESCRIPTION], [BACKGROUND — dark concrete / black surface],
harsh single-source directional light casting sharp shadows. High contrast, gritty, raw.
Portrait orientation 4:5. Bold white sans-serif text upper left:
"[CRIME TYPE]: [DIRECTION][PERCENTAGE]%". Smaller secondary white line directly below:
"[N] incidents — [up/down] [CHANGE] this week". No other text or branding. Visceral, dramatic.
```

---

## Step 6 — Text Values Reference

Fill in from the weekly stats:

| Field | Format | Example |
|-------|--------|---------|
| CRIME TYPE | Title case | `Seizures` |
| DIRECTION | Arrow only | `↑` or `↓` |
| PERCENTAGE | No decimal | `83%` |
| N | Integer | `11` |
| up/down | Word | `up` or `down` |
| CHANGE | Integer | `5` |

**Positive stat:** Use **dark green** bold text. All others: **white** (visceral) or **black** (clinical).

---

## Quality Checklist (after generation)

- [ ] Percentage and arrow direction match the stats
- [ ] Numbers are correct (Gemini occasionally hallucinates digits)
- [ ] Text is legible — no blending into background
- [ ] No unintended text or watermarks in the image
- [ ] 4:5 crop is clean — no important subject cut off
- [ ] The 4 images feel visually distinct from each other

---

## How to Invoke This Workflow with Claude

Paste the weekly update block and say:

> "Generate this week's 4 social images using the social image workflow."

Claude will:
1. Select the 4 stats
2. Assign clinical/visceral styles
3. Suggest a creative concept for each (rotating from the library)
4. Output 4 ready-to-paste Gemini prompts

You can also say:
- "Use concept V4 for the seizures image" to override the concept choice
- "Make all 4 clinical this week" to override styles
- "Skip the positive image this week" if no stat qualifies

---

*Created: Mar 2026 | Platform: FB + IG via Meta Business Suite*
