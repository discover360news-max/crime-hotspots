# Crime Classification Rules

**Version:** 1.1 — March 2026
**Applies to:** All crime records in the Crime Hotspots database (Trinidad & Tobago)
**Implements:** The primary + related crime type system in `crimeSchema.ts` / `schema.gs`
**Recording standard reference:** FBI NIBRS, UK Home Office Counting Rules (harm hierarchy)

---

## 1. Data Model

Each crime record has:
- **`primaryCrimeType`** — the single highest-severity harm type in the incident
- **`relatedCrimeTypes`** — pipe-separated list of other crime types present in the same incident

Crime counting uses **harm count** (not row count):
- Primary crime = victimCount (Murder only) or 1 (all other types)
- Each related type = always +1, never multiplied by victim count
- `Murder|Murder` in related = 2 separate murders — never deduplicate

---

## 2. Severity Hierarchy

When choosing the primary type, use the highest severity. In ties, earlier schema order wins.

```
Murder (10) > Attempted Murder (9) > Kidnapping (8) > Sexual Assault (7)
> Shooting (6) > Assault (5) = Carjacking (5) > Arson (4) = Robbery (4)
> Extortion (3) = Burglary (3) > Theft (2) > Seizures (1)
```

**Multiple Victims Override:** If a lower-severity crime affects significantly more victims
than the highest-severity crime, the more-victims type becomes primary.

> Example: "3 people shot, 1 dies" → Primary: Shooting (3 victims), Related: Murder (1 victim)

---

## 3. Context Types

**Home Invasion** and **Domestic Violence** are **context types** — they describe the
*setting* or *relationship*, not the harm itself.

| Context Type | Describes |
|---|---|
| Home Invasion | Forced entry into an occupied residence |
| Domestic Violence | Violence between intimate partners or family members |

Rules:
- **Never primary** when any harm type is present in the same incident
- **Always related** — they tag onto the harm type as context
- If an article mentions only a Home Invasion or Domestic Violence with no confirmed harm type,
  flag the record for human review — do not use a context type as primary

---

## 4. Hard Implication Rules

These are **always applied** — no article confirmation needed. They are definitionally
contained in the primary crime. Enforced in `determineCrimeTypes()` in `crimeTypeProcessor.gs`.

| When this appears | Always also add | Reason |
|---|---|---|
| **Carjacking** (primary or related) | **Robbery** | Carjacking IS a robbery — force/threat used to take a vehicle from a person |
| **Home Invasion** (related context) | **Burglary** | Every home invasion involves unlawful entry into a residence |

**Note — Carjacking and Theft:** The vehicle itself is the stolen property; Robbery covers it.
Do NOT add Theft alongside Robbery — they are mutually exclusive (see §6).

---

## 5. Soft Implication Rules

Add these **only when confirmed by the article**. Do not infer.

### Murder (primary)
| Add as Related | When |
|---|---|
| Shooting | Method explicitly stated as firearm ("shot dead", "gunned down", "shot and killed") |
| Assault | Method was physical force, no firearm ("beaten to death", "stabbed to death") |
| Attempted Murder | Other victims survived and intent to kill was clear |
| Home Invasion *(context)* | Crime occurred inside victim's home (attacker entered unlawfully) |
| Domestic Violence *(context)* | Perpetrator is partner, spouse, or family member |

### Attempted Murder (primary)
| Add as Related | When |
|---|---|
| Shooting | Victim was shot and survived |
| Assault | Physical method used, no firearm, victim survived |
| Home Invasion *(context)* | Occurred in victim's home |
| Domestic Violence *(context)* | Partner/family perpetrator |

### Shooting — non-fatal (primary)
*Use Shooting as primary when victim was shot, survived, and intent to kill is NOT confirmed.
This is the correct standard (per FBI NIBRS) when outcome doesn't qualify for Attempted Murder.*

| Add as Related | When |
|---|---|
| Murder | Any victim died from the shooting |
| Attempted Murder | Article confirms intent to kill (see §6 for when to use Attempted Murder) |
| Robbery | A robbery was in progress when the victim was shot |
| Home Invasion *(context)* | Occurred in victim's home |

### Robbery (primary)
| Add as Related | When |
|---|---|
| Shooting | Victim was shot during the robbery |
| Assault | Victim was physically struck or beaten (not just threatened) |
| Murder | Victim was killed |
| Home Invasion *(context)* | Occurred in victim's home — also triggers Home Invasion → Burglary hard rule |
| ~~Theft~~ | **Never** — see §6 |

### Carjacking (primary) — Robbery is always hard-added
| Add as Related | When |
|---|---|
| **Robbery** | **Always (hard rule — see §4)** |
| Shooting | Victim or bystander was shot during the carjacking |
| Assault | Victim was physically attacked (dragged from car, beaten) |
| Murder | Victim was killed |
| Attempted Murder | Victim was shot/attacked with confirmed intent to kill |

### Kidnapping (primary)
| Add as Related | When |
|---|---|
| Extortion | Ransom or demands were made |
| Assault | Violence used during the kidnapping |
| Sexual Assault | Victim was sexually assaulted during captivity |
| Murder | Victim was killed |
| Domestic Violence *(context)* | Perpetrator is partner/family |

### Sexual Assault (primary)
| Add as Related | When |
|---|---|
| Assault | Separate physical violence also occurred, distinct from the sexual assault itself |
| Kidnapping | Victim was transported to a different location against their will |
| Murder | Victim was killed before or after the assault |
| Domestic Violence *(context)* | Perpetrator is partner/family |
| Home Invasion *(context)* | Attacker entered the victim's home unlawfully |

### Assault (primary — fists/feet only, no weapon)
> If a weapon was used, see §6 Assault vs. Attempted Murder — The Weapon Rule.
> Assault as primary applies only when physical violence involved no weapon.

| Add as Related | When |
|---|---|
| Robbery | Force used to take property (when Assault is primary due to context) |
| Domestic Violence *(context)* | Perpetrator is partner/family |
| Home Invasion *(context)* | Occurred in victim's home |

### Burglary (primary — unlawful entry, occupants NOT confronted)
| Add as Related | When |
|---|---|
| Theft | Property was stolen during the break-in (confirm from article) |
| Arson | Property was set on fire after the break-in |
| Home Invasion *(context)* | Occupants were actually home and confronted — change character from quiet burglary |

### Arson (primary)
| Add as Related | When |
|---|---|
| Murder | Victim died in the fire or was deliberately targeted |
| Attempted Murder | Victim was inside, survived, and was clearly targeted |
| Theft | Property was also stolen before the fire was set |

### Extortion (primary)
| Add as Related | When |
|---|---|
| Assault | Violence used to enforce the threat |
| Kidnapping | A person was taken or held as leverage |
| Arson | Property was targeted as part of the extortion |
| Murder | Victim was killed for non-compliance |

### Seizures (primary — law enforcement action)
Typically standalone. No standard implied related types.

---

## 6. Disambiguation Rules

### Robbery vs. Theft — mutually exclusive
- Force or threat of force used → **Robbery** only. Never also add Theft.
- Property taken without confrontation → **Theft** only.
- Robbery already covers the taking of property. Theft as a related type on a Robbery record is always wrong.

### Carjacking vs. Robbery vs. Theft
- Vehicle taken from a person by force → **Carjacking** (primary) + **Robbery** (hard-added)
- Vehicle stolen with no person present → **Theft** only (no Robbery, no Carjacking)
- Phone/wallet also taken during carjacking → Covered by Robbery. No need to also add Theft.

### Assault vs. Attempted Murder — The Weapon Rule

Intentional weapon use against a person who survived = **Attempted Murder**, not Assault.
Rationale: using a weapon implies intent to cause grievous bodily harm at minimum —
consistent with "wounding with intent" charges under TT law (Offences Against the Person Act).

| Scenario | Classification |
|---|---|
| Stabbed with knife/cutlass and survived | **Attempted Murder** |
| Chopped with cutlass and survived | **Attempted Murder** |
| Beaten with bat, bottle, or any wielded object and survived | **Attempted Murder** |
| Punched, kicked, or shoved — fists/feet only | **Assault** |
| Weapon brandished as threat only, not used to strike | Robbery (if property taken) — no Assault, not Attempted Murder |

> Assault is reserved for fists/feet only — physical violence without a weapon.
> A weapon pointed at a victim without physical contact does NOT qualify as Assault.
> If a weapon made contact with the victim and they survived, use Attempted Murder.

---

### Shooting vs. Assault — not stackable as peers
- Firearm was discharged at someone → **Shooting** (more specific type — use this)
- Physical violence only, no firearm → **Assault**
- Do NOT add Assault to every Shooting — a shooting is not simultaneously an Assault in this system
- Exception: if there was BOTH a shooting AND a separate physical beating (e.g. beaten then shot), include both

### Shooting (primary) vs. Attempted Murder (primary)
Based on FBI NIBRS and UK Home Office harm hierarchy:

| Outcome | Primary | Related |
|---|---|---|
| Victim(s) killed | Murder | Shooting |
| Victim(s) survived, intent to kill confirmed | Attempted Murder | Shooting |
| Victim(s) survived, intent unclear | **Shooting** | — |
| No victims hit (drive-by, warning shots, discharge) | **Shooting** | — |

**Confirmed intent to kill** means: execution-style (shot in head at close range), perpetrator
stated intent, multiple shots fired at close range targeting the individual.

**When in doubt on intent → default to Shooting as primary.**

### Home Invasion vs. Burglary
- Occupants home AND confronted → Add **Home Invasion** (context) + **Burglary** (hard rule auto-adds it)
- Occupants NOT home → **Burglary** only. No Home Invasion.

### Murder vs. Attempted Murder in mixed-outcome incidents
- Some victims died, some survived: Primary = **Murder** (victimCount = deaths only),
  Related = **Attempted Murder** + **Shooting** (if firearm used)
- All victims survived: Primary = **Attempted Murder** or **Shooting** (see above table). Never Murder.

---

## 7. Quick Reference Card

### "Should I add Theft?"
| Scenario | Correct type |
|---|---|
| Robbed at gunpoint | Robbery only |
| Pickpocket, bag snatch, shoplifting | Theft only |
| Carjacking | Carjacking + Robbery (hard rule) — no Theft |
| Burglary with confirmed stolen items | Burglary + Theft |

### "Is this Shooting or Assault?"
| Scenario | Correct type |
|---|---|
| Firearm discharged, person hit | Shooting |
| Firearm discharged, no one hit | Shooting |
| Gun brandished or used as threat only | NOT Shooting (Robbery if property taken, Assault if person threatened with violence) |
| Beaten with fists, blunt object, or non-firearm weapon | Assault |
| Beaten AND shot (two separate acts) | Both Shooting + Assault |

### "Is this Shooting or Attempted Murder?"
| Scenario | Correct primary |
|---|---|
| Shot, survived, intent to kill unclear | Shooting |
| Shot execution-style (head), survived | Attempted Murder |
| Shot multiple times at close range, survived | Attempted Murder |
| Drive-by, multiple people hit, all survived | Shooting |
| Robber shot at victim who dodged | Shooting (intent probable but not confirmed) |

### "Is this a Home Invasion or just Burglary?"
| Scenario | Correct types |
|---|---|
| Break-in while occupants away | Burglary only |
| Break-in while occupants home, no confrontation | Burglary + Home Invasion (context) |
| Break-in while occupants home, confronted | Burglary + Home Invasion (context) + primary harm type |

---

*Maintained by:* Crime Hotspots project
*Source of truth for:* Human reviewers, Claude Haiku classification prompt, `schema.gs`, `crimeSchema.ts`
*Related files:* `google-apps-script/trinidad/schema.gs` | `astro-poc/src/config/crimeSchema.ts` | `crimeTypeProcessor.gs`
