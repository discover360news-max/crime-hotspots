# Headline Classification Workflow

**Version:** 1.1 — March 2026
**Use for:** Manually classifying crime headlines into the Crime Hotspots database
**Output columns:** `primaryCrimeType` | `relatedCrimeTypes` | `victimCount`
**Full rules reference:** `docs/guides/CRIME-CLASSIFICATION-RULES.md`

---

## Output Format

One row per incident. Pipe-separate multiple related types.

| primaryCrimeType | relatedCrimeTypes | victimCount |
|---|---|---|
| Murder | Shooting\|Home Invasion | 2 |
| Robbery | Assault | 1 |
| Burglary | NONE | 1 |

**One row per headline.** If a headline covers two separate, unconnected incidents, use two rows.

---

## Step 1 — Identify All Crime Types Present

Read the headline and list every crime type mentioned or clearly implied.
Use only the 15 valid types (exact spelling):

| Type | Severity | Notes |
|---|---|---|
| Murder | 10 | Victim confirmed dead |
| Attempted Murder | 9 | Weapon used intentionally + victim survived OR intent to kill confirmed |
| Kidnapping | 8 | Person taken/held against will |
| Sexual Assault | 7 | |
| Shooting | 6 | Firearm discharged at person; victim survived; intent unclear |
| Assault | 5 | Physical violence only, **no weapon** (fists, kicks, shoving) |
| Home Invasion | 5 | Context type — attacker entered occupied home |
| Carjacking | 5 | Vehicle taken from person by force |
| Arson | 4 | Deliberate fire |
| Robbery | 4 | Property taken by force or threat |
| Domestic Violence | 4 | Context type — perpetrator is partner, spouse, or family |
| Extortion | 3 | Demands made under threat |
| Burglary | 3 | Unlawful entry into property |
| Theft | 2 | Property taken without confrontation |
| Seizures | 1 | Law enforcement seizure |

---

## Step 2 — Pick Primary (Highest Severity)

The **single highest-severity type** becomes `primaryCrimeType`.

> Severity tie → earlier in the table above wins (schema order).

**Multiple Victims Override:** If a lower-severity crime affects significantly more victims
than the highest-severity type, the higher-victim type becomes primary.
Example: "3 shot, 1 dies" → PRIMARY: Shooting (3), RELATED: Murder (1)

**Context types (Home Invasion, Domestic Violence) are NEVER primary**
when any harm type is present.

---

## Step 3 — Apply Hard Rules (automatic, no confirmation needed)

| If present | Always add to RELATED |
|---|---|
| Carjacking | Robbery |
| Home Invasion | Burglary |

---

## Step 4 — Add Confirmed Related Types

Only add what the headline/article confirms. Do not infer.

### Murder (primary)
| Add | When |
|---|---|
| Shooting | "shot dead", "gunned down", killed by firearm |
| Assault | "beaten to death", "stabbed to death", killed by physical force |
| Attempted Murder | Other victims survived, intent to kill was clear |
| Home Invasion | Died inside their own home after attacker entered |
| Domestic Violence | Perpetrator is partner, spouse, or family member |

### Attempted Murder (primary)
| Add | When |
|---|---|
| Shooting | Shot by firearm, survived |
| Home Invasion | Occurred in victim's home |
| Domestic Violence | Partner/family perpetrator |

### Shooting — non-fatal (primary)
| Add | When |
|---|---|
| Murder | Any victim died |
| Attempted Murder | Intent to kill confirmed |
| Robbery | Robbery was in progress |
| Home Invasion | Occurred in victim's home |

### Robbery (primary)
| Add | When |
|---|---|
| Shooting | Victim was shot |
| Assault | Victim physically struck (not just threatened) |
| Murder | Victim killed |
| Home Invasion | Occurred in victim's home |

### Carjacking (primary)
| Add | When |
|---|---|
| Robbery | **Always (hard rule)** |
| Shooting | Someone was shot |
| Assault | Victim physically attacked, no weapon (dragged, punched) |
| Murder | Victim killed |
| Attempted Murder | Victim attacked with weapon |

### Burglary (primary)
| Add | When |
|---|---|
| Theft | Property confirmed stolen |
| Home Invasion | Occupants were home and confronted |
| Arson | Property set on fire |

---

## Step 5 — Set Victim Count

Count **all people directly affected** by the incident — shot, killed, robbed, beaten, held at gunpoint, tied up.

| Rule | victimCount |
|---|---|
| Number explicitly stated | Use it exactly ("two shot" = 2, "three robbed" = 3) |
| Plural but no number ("teens", "children", "family members") | Minimum 2 |
| Count not stated | Default to 1 |

For Murder: count the number **killed** (survivors are counted under their own crime type if split into separate rows).

Related types never affect victim count.

---

## Key Disambiguation

### Assault vs Attempted Murder — THE WEAPON RULE
| Scenario | Classification |
|---|---|
| Stabbed with knife/cutlass and survived | **Attempted Murder** |
| Chopped with cutlass and survived | **Attempted Murder** |
| Beaten with bat, bottle, or any object and survived | **Attempted Murder** |
| Punched, kicked, shoved — fists/feet only | **Assault** |
| Weapon used but only threatening, not striking | Robbery (if property taken) — weapon threat alone is NOT Assault |

> Rationale: Intentional weapon use against a person = "wounding with intent"
> under TT law. The attacker would face Attempted Murder charges, not Assault.
> Fists/feet only = Assault.

### Shooting vs Attempted Murder
| Scenario | Primary |
|---|---|
| Shot, survived, intent unclear | **Shooting** |
| Shot execution-style (head/neck), survived | **Attempted Murder** |
| Shot multiple times at close range, survived | **Attempted Murder** |
| Drive-by, multiple hit, all survived | **Shooting** |
| When in doubt on intent | Default to **Shooting** |

### Robbery vs Theft
| Scenario | Classification |
|---|---|
| Force or threat used | **Robbery** only — never also add Theft |
| No confrontation, no force | **Theft** only |

### Carjacking vs Theft
| Scenario | Classification |
|---|---|
| Vehicle taken from person by force | **Carjacking** + Robbery (hard rule) |
| Vehicle stolen with no person present | **Theft** only |

### Home Invasion vs Burglary
| Scenario | Classification |
|---|---|
| Occupants not home | **Burglary** only |
| Occupants home, not confronted | Burglary + **Home Invasion** (context, in RELATED) |
| Occupants home, confronted | Burglary + **Home Invasion** + primary harm type |

### Shooting vs Assault — not stackable as peers
- Firearm discharged → **Shooting**
- Physical violence only → **Assault**
- Gun brandished/threatened but NOT fired → Robbery (if property taken) or Assault
- Both beaten AND shot (two separate acts) → include both Shooting + Assault
- Do NOT add Assault to every Shooting — a shooting is not simultaneously an Assault

---

## T&T Terminology

| Term | Meaning | Classification note |
|---|---|---|
| Gallery | Front porch / veranda of a home | Outside the residence — NOT Home Invasion unless attacker entered |
| Trace / Back trace | Alley or dirt path | Location only — no classification impact |
| Liming | Hanging out socially | Location/context only |
| Cutlass | Machete-style blade | Weapon → Attempted Murder if used against person who survived |
| Wappie | Abandoned or informal area | Location only |
| "Chopped" | Struck with a cutlass | Weapon attack → Attempted Murder if survived |
| "Held for ransom" | Kidnapping with extortion | Kidnapping primary + Extortion related |
| Bandits | Armed robbers | Robbery primary; add Shooting/Assault if confirmed |

---

## When to Flag

Flag a record (don't guess) when:
- Method of attack not stated and it affects the classification (e.g. "wounded" — shot or stabbed?)
- Fire reported but cause (deliberate vs accidental) not confirmed
- Victim status unclear (dead or survived?) when it changes the primary type
- Context type (Home Invasion / Domestic Violence) is possible but not confirmed
- Two unconnected incidents in one headline — needs two rows

---

## Worked Examples

**"Man stabbed at bar in Couva"**
→ Weapon (knife) used, survived
→ PRIMARY: Attempted Murder | RELATED: NONE | VICTIMS: 1

**"Man beaten and robbed of gold chain"**
→ Robbed = Robbery (higher severity than Assault at 4, but Assault is 5...)
→ Wait — Assault (5) > Robbery (4). PRIMARY: Assault, RELATED: Robbery
→ VICTIMS: 1

**"Bandits break into home, rob family at gunpoint"**
→ Home Invasion (context) + Robbery + Burglary (hard rule from Home Invasion)
→ Gun as threat only, not fired → no Shooting
→ PRIMARY: Robbery | RELATED: Home Invasion\|Burglary | VICTIMS: 1

**"Two men killed, one injured in Morvant shooting"**
→ Multiple victims rule: 2 killed + 1 survived with clear intent → Murder primary
→ PRIMARY: Murder | RELATED: Shooting\|Attempted Murder | VICTIMS: 2

**"Woman injured in gallery of home shooting"**
→ Gallery = front porch, NOT inside the home — no Home Invasion
→ Shot, survived, intent unclear
→ PRIMARY: Shooting | RELATED: NONE | VICTIMS: 1

**"Man carjacked at traffic lights"**
→ Vehicle taken from person by force → Carjacking + Robbery (hard rule)
→ PRIMARY: Carjacking | RELATED: Robbery | VICTIMS: 1

**"Police seize $2M in cocaine in Beetham"**
→ Law enforcement action
→ PRIMARY: Seizures | RELATED: NONE | VICTIMS: 1

---

*Maintained by:* Crime Hotspots project
*Full rules:* `docs/guides/CRIME-CLASSIFICATION-RULES.md`
*Schema:* `astro-poc/src/config/crimeSchema.ts` ↔ `google-apps-script/trinidad/schema.gs`
