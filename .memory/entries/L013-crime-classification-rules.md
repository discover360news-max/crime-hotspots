---
id: L013
type: learning
status: active
created: 2026-03-14
updated: 2026-03-14
related: [L009, L010, D003]
---

## Summary
Crime classification rules formalised as a written standard + encoded in the pipeline.
Two hard implication rules established; Shooting-vs-Attempted-Murder decision standard set;
Robbery/Theft mutual exclusion confirmed. Full reference: `docs/guides/CRIME-CLASSIFICATION-RULES.md`.

## Hard Implication Rules (always apply, no article confirmation needed)
| When this appears | Always also add | Reason |
|---|---|---|
| Carjacking | Robbery | Carjacking IS a robbery — vehicle taken by force |
| Home Invasion (as related) | Burglary | Every home invasion involves unlawful entry |

Enforced at two layers:
1. **Claude prompt** — `HARD IMPLICATION RULES` section in `buildSystemPrompt()` + `buildHardImplicationsBlock()` injected
2. **`determineCrimeTypes()`** in `crimeTypeProcessor.gs` — safety net: applies `getHardImplications()` after dedup, before sort

## Key Disambiguation Decisions
**Robbery vs Theft — mutually exclusive:**
- Force/threat used → Robbery only. Never also add Theft.
- No force → Theft only.
- Robbery already covers taking property. Theft as related on a Robbery row = always wrong.

**Carjacking and Theft:**
- Vehicle + phone/wallet taken = Carjacking + Robbery (covers all). Never also add Theft.

**Shooting (primary) vs Attempted Murder (primary) — T&T rule (v1.2):**
- Person directly targeted and shot, survived → **Attempted Murder** (primary) + Shooting (related). Always.
- Group deliberately targeted (drive-by), all survived → **Attempted Murder** (primary)
- Victim was unintended bystander (stray bullet) → **Shooting** (primary)
- No person targeted (shots at property, into air, warning shots) → **Shooting** (primary)
- Old "intent unclear → default Shooting" standard deliberately removed for T&T context — shooting at a person implies intent to kill here.

**Shooting vs Assault — not stackable as peers:**
- Firearm discharged → Shooting (not also Assault)
- Physical violence only → Assault
- Exception: both a shooting AND separate physical beating → include both

**Mixed-outcome incidents (some died, some survived):**
- Primary: Murder (victimCount = deaths only), Related: Attempted Murder + Shooting (if firearm)

**Home Invasion vs Burglary:**
- Occupants home + confronted → Burglary + Home Invasion (context) — hard rule auto-adds Burglary
- Occupants not home → Burglary only

## Files Encoding These Rules
- `docs/guides/CRIME-CLASSIFICATION-RULES.md` — source of truth reference doc
- `google-apps-script/trinidad/schema.gs` — `CRIME_HARD_IMPLICATIONS`, `getHardImplications()`, `buildHardImplicationsBlock()`; all 15 `promptDescription` fields are substantive (enriched Mar 14)
- `google-apps-script/trinidad/claudeClient.gs` — `buildSystemPrompt()` uses `buildClassificationRulesBlock()` (auto-generates from schema — all 15 types covered); section order restructured; duplications removed
- `google-apps-script/trinidad/crimeTypeProcessor.gs` — safety net in `determineCrimeTypes()`
- `astro-poc/src/config/crimeSchema.ts` — `CRIME_HARD_IMPLICATIONS` (frontend mirror)

## Prompt Coverage Note
As of Mar 14 2026, `buildClassificationRulesBlock()` is wired into `buildSystemPrompt()`.
All 15 crime types now have explicit per-type rules in the Claude prompt — no types rely on general knowledge.
Adding a new crime type to `CRIME_TYPES` in `schema.gs` automatically includes it in the prompt.

## Change Log
- 2026-03-14: Rules established, doc created, all files updated
- 2026-03-14: Prompt quality overhaul — buildClassificationRulesBlock() wired in; promptDescriptions enriched for Murder, Attempted Murder, Arson; prompt restructured (hierarchy first)
- 2026-03-16: v1.2 — Shooting vs Attempted Murder default flipped. Old: "intent unclear → Shooting". New: "person directly targeted → Attempted Murder". Shooting reserved for stray/unintended victims and shots not aimed at any person. Applies going forward; existing records not retroactively reclassified. Updated: claudeClient.gs, schema.gs (both promptDescriptions), CRIME-CLASSIFICATION-RULES.md, HEADLINE-CLASSIFICATION-WORKFLOW.md.
