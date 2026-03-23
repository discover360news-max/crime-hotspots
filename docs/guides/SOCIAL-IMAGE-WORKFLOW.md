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

The library below is a **starting point, not a ceiling.** Each week, Claude should:
1. Check the library for a strong match
2. If nothing fits precisely — **invent a bespoke concept** for that week's specific data
3. Add strong new concepts to the library with a date tag so it grows over time

Rotate concepts week-to-week. Never repeat the same concept two weeks running for the same crime type.

---

### Visual Alignment Rule

**The subject must be immediately recognisable as connected to that crime type — without the viewer needing to read the text.**

A viewer who sees the image for 1 second should feel **surprise or anger** before they read a word. Generic props that require logical leaps (e.g. a padlock for assault) are invalid — they dilute the emotional punch and confuse the message.

**Crime-type direction guide** *(use as inspiration, not a locked list — add to it):*

| Crime Type | Avoid | Direction |
|------------|-------|-----------|
| Assault | Padlocks, keys, generic crime tape | Physical impact — broken glasses, hospital wristband, bruised skin close-up, overturned scene |
| Robbery | Generic bags, evidence bags | Loss and violation — scattered belongings on dark ground, open empty wallet, motion blur of a snatched item |
| Theft | Generic props | Missing or damaged — shattered car window, damaged phone, outline where something was |
| Burglary | Intact padlocks | Forced entry — splintered door frame, cut chain, pried window frame |
| Seizures | Generic crime tape | The haul itself — contraband spread, drugs/cash/weapons laid out, evidence bags being handled |
| Attempted Murder | Neutral props | Close brush with death — hospital wristband, surgical glove with smear, aftermath of violence |
| Shooting | Generic alleys | Ballistic aftermath — shell casings, shattered glass at head height, police tape |
| Murder | Any prop | Aftermath only, no body — police tape, burned wreck, empty scene under hard light |
| Overall total (up) | Any single prop | Scale and atmosphere — rain-slicked city street at night, police lights across a skyline |
| Overall total (down) | Celebration imagery | Absence of harm — empty evidence bag, open handcuffs, clean unmarked surface |

---

### Style Library *(evolving — add new entries as invented)*

#### Clinical / Data Journalism
Aesthetic: pure white or pale grey background, cold neutral studio lighting, zero shadows, forensic, detached.

| # | Subject | Crime types | Added |
|---|---------|-------------|-------|
| C1 | Shattered car window glass spread on white surface | Theft, carjacking | Mar 2026 |
| C2 | Single closed padlock on white surface | Burglary positive / security messaging only | Mar 2026 |
| C3 | Empty evidence bag lying flat on white | Positive stats — absence of crime | Mar 2026 |
| C4 | Lone key in a lock, overhead shot | Burglary prevention angle | Mar 2026 |
| C5 | Wallet lying open and empty, overhead shot | Theft, robbery | Mar 2026 |
| C6 | Torn legal document on white surface | Fraud, financial crime | Mar 2026 |
| C7 | CCTV camera close-up, neutral bg | Surveillance / deterrence angle | Mar 2026 |
| C8 | Empty handcuffs lying open on white | Positive stats — nobody arrested, no crime | Mar 2026 |
| C9 | Police evidence tags laid out in a row | Seizures | Mar 2026 |
| C10 | Single item (phone, bag, watch) with visible damage | Theft, robbery | Mar 2026 |
| C11 | Broken eyeglasses lying on white surface, one lens cracked | Assault, domestic violence | Mar 2026 |
| C12 | Single latex surgical glove, pristine white — with one faint smear | Attempted murder, assault (clinical contrast) | Mar 2026 |

#### Raw / Visceral
Aesthetic: dark or textured background, hard directional light, deep shadows, high contrast, unsettling.

| # | Subject | Crime types | Added |
|---|---------|-------------|-------|
| V1 | Top-down confiscated contraband spread on dark concrete | Seizures — drugs, weapons, cash | Mar 2026 |
| V2 | Splintered wooden door frame — forced entry | Burglary, home invasion | Mar 2026 |
| V3 | Single overturned chair under a dangling bare bulb | Assault, general violence | Mar 2026 |
| V4 | Dark alley with single harsh streetlight | Robbery, shooting | Mar 2026 |
| V5 | Gloved hands holding an evidence bag against dark bg | Seizures, investigation | Mar 2026 |
| V6 | Close-up of broken padlock, chain cut | Burglary, forced entry | Mar 2026 |
| V7 | Smashed window on a dark surface, glass fragments | Robbery, theft | Mar 2026 |
| V8 | Silhouette of a figure against a lit doorway | General unease, home invasion | Mar 2026 |
| V9 | Hospital wristband on a dark surface, clinical light | Assault, shooting, attempted murder | Mar 2026 |
| V10 | Burned-out car wreck at night, embers faint | Arson, extreme crime | Mar 2026 |
| V11 | Police tape stretched across a dark background | Any crime — aftermath | Mar 2026 |
| V12 | Close-up hands in handcuffs, dramatic lighting | Arrest, seizure | Mar 2026 |
| V13 | Scattered personal items on dark wet ground — phone, keys, wallet | Robbery, mugging | Mar 2026 |
| V14 | Shell casings on dark concrete, single overhead light | Shooting, attempted murder | Mar 2026 |

#### Cinematic / Atmospheric *(experimental — added Mar 2026)*
Aesthetic: real-world environments, low ambient light, depth, moody — more editorial than forensic.

| # | Subject | Crime types | Added |
|---|---------|-------------|-------|
| A1 | Overhead rain-slicked urban street at night, police strobe out of focus in distance | Overall totals, general crime | Mar 2026 |

#### High-Contrast B&W / Graphic *(experimental — added Mar 2026)*
Aesthetic: colour stripped entirely, extreme crushed blacks and blown-out whites, almost graphic-design-level contrast.

| # | Subject | Crime types | Added |
|---|---------|-------------|-------|
| G1 | Heavy object (padlock, cuffs, evidence bag) under extreme B&W contrast | Burglary, positive stats | Mar 2026 |

---

### Adding New Concepts

When a new concept is invented during a weekly run, add it to the relevant style table above with:
- A new sequential ID (C13, V15, A2, G2, etc.)
- Subject description
- Crime type(s) it suits
- Date added

If a concept underperforms or feels wrong in retrospect, note it in the **Concept Log** below.

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
- [ ] **Visual subject is directly tied to the crime type** — a viewer could identify the crime category without reading the text
- [ ] **Emotional response check** — does the image produce surprise or anger on first glance?

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

---

## Concept Log

Track what was used, what worked, what to retire. Update after each week once engagement data is in.

| Week | Image | Concept used | Style | Notes |
|------|-------|--------------|-------|-------|
| Mar 12-20 | Seizures ↑17% | V1 contraband spread | Visceral | First run — no data yet |
| Mar 12-20 | Attempted Murder ↑13% | C12 surgical glove + smear | Clinical contrast | First run — no data yet |
| Mar 12-20 | Total ↑18% | A1 rain-slicked street at night | Cinematic | New style — testing |
| Mar 12-20 | Assault ↓17% | C3 empty evidence bag | Clinical | Replaced invalid padlock concept |

*Performance key: — = no data yet | ✓ = strong performer (keep rotating in) | ~ = average | ✗ = retire*

---

*Created: Mar 2026 | Platform: FB + IG via Meta Business Suite*
