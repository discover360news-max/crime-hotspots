# Schema Centralization Plan
## Making `schema.gs` the Single Source of Truth

**Created:** 2026-03-09
**Status:** Ready to implement
**Scope:** GAS pipeline + Astro frontend
**Goal:** Eliminate the silent drift between prompt rules, validation logic, and frontend display that currently lives in 4+ disconnected locations.

---

## The Problem — Proof It Already Exists

Before any migration, here is the **current drift** between the two main owners of crime type data:

| Crime Type | `claudeClient.gs` Prompt Hierarchy | `crimeTypeProcessor.gs` CRIME_SEVERITY |
|---|---|---|
| Murder | 1st (highest) | 10 ✓ |
| Kidnapping | 2nd | 9 ✓ |
| Sexual Assault | 3rd | **6** ✗ |
| Shooting | 4th | **7** ✗ |
| Assault | 5th | **5** ✓ |
| Home Invasion | 6th | **8** ✗ (ranked above Shooting in code) |
| Robbery | 7th | 4 ✓ |
| Burglary | 8th | 3 ✓ |
| Theft | 9th | 2 ✓ |
| Seizures | 10th | 1 ✓ |
| Attempted Murder | In prompt (new) | **Missing** ✗ |
| Arson | In prompt (new) | **Missing** ✗ |

**Result today:** Claude classifies a sexual assault above a shooting (prompt rule), but `crimeTypeProcessor.gs` sorts the shooting as primary (CRIME_SEVERITY: Shooting=7 > Sexual Assault=6). The primary crime type written to the sheet contradicts what Claude was instructed to extract.

---

## What Gets Centralized

### 1. Crime Types — `CRIME_TYPES` object
Currently in: prompt string in `claudeClient.gs` (hierarchy table), `CRIME_SEVERITY` in `crimeTypeProcessor.gs`, filter lists in frontend.

Single owner after migration: `schema.gs` → `crimeSchema.ts`

### 2. Safety Tip Enums — `SAFETY_TIP_CATEGORIES`, `SAFETY_TIP_CONTEXTS`
Currently in: prompt string in `claudeClient.gs`, safety tip pages in frontend, `SAFETY-TIP-WORKFLOW.md`.

Single owner after migration: `schema.gs` → `crimeSchema.ts`

### 3. Confidence Threshold
Currently in: `PROCESSING_CONFIG.CONFIDENCE_THRESHOLD` in `config.gs` (7), referenced in comments across processor, prompt, and frontend risk scoring.

Single owner after migration: `schema.gs` (stays in `config.gs` for the threshold value; schema provides the meaning of each tier).

---

## The Target — What `schema.gs` Looks Like

```javascript
// ============================================================================
// schema.gs — SINGLE SOURCE OF TRUTH
// All crime classification, safety tip enums, and confidence tiers.
// Everything else derives from this file — never duplicate these values.
// ============================================================================

/**
 * Crime type definitions.
 * severity: 1–10 (used by crimeTypeProcessor to determine primary crime)
 * label: display string (used in prompt, frontend filters, sheet values)
 * promptDescription: one-line rule for Claude's classification section
 */
const CRIME_TYPES = {
  MURDER:           { label: 'Murder',           severity: 10, promptDescription: 'Civilian intentionally killed by another civilian. Never for accidents, medical deaths, or police killings.' },
  ATTEMPTED_MURDER: { label: 'Attempted Murder', severity: 9,  promptDescription: 'Targeted attack with clear intent to kill where victim survived. Always paired with Shooting or Assault.' },
  KIDNAPPING:       { label: 'Kidnapping',       severity: 8,  promptDescription: 'Person abducted or held against their will.' },
  SEXUAL_ASSAULT:   { label: 'Sexual Assault',   severity: 7,  promptDescription: 'Rape, sexual violence, or forced sexual contact.' },
  SHOOTING:         { label: 'Shooting',         severity: 6,  promptDescription: 'Firearm was DISCHARGED at a person. Gun as threat only = NOT a Shooting.' },
  ASSAULT:          { label: 'Assault',          severity: 5,  promptDescription: 'Physical attack causing injury. Not robbery with a threat.' },
  HOME_INVASION:    { label: 'Home Invasion',    severity: 5,  promptDescription: 'Forced entry into a residence while occupied.' },
  ARSON:            { label: 'Arson',            severity: 4,  promptDescription: 'Deliberate setting of fire to property or person.' },
  ROBBERY:          { label: 'Robbery',          severity: 4,  promptDescription: 'Taking property using force or threat. Not pure theft.' },
  BURGLARY:         { label: 'Burglary',         severity: 3,  promptDescription: 'Forced entry into unoccupied property to steal.' },
  THEFT:            { label: 'Theft',            severity: 2,  promptDescription: 'Taking property without confrontation.' },
  SEIZURES:         { label: 'Seizures',         severity: 1,  promptDescription: 'Police recovering contraband (guns/drugs/cash).' },
};

/**
 * Safety tip categories (what type of crime it helps prevent).
 * Used in: Claude prompt, safety tip pages, submit form.
 */
const SAFETY_TIP_CATEGORIES = [
  'Robbery',
  'Carjacking',
  'Home Invasion',
  'ATM Crime',
  'Online Scam',
  'Kidnapping',
  'Sexual Violence',
  'Fraud',
  'Assault',
  'Other',
];

/**
 * Safety tip contexts (where the crime occurs / resident's situation).
 * Used in: Claude prompt, safety tip pages, context filter routes.
 */
const SAFETY_TIP_CONTEXTS = [
  'At Home',
  'In Your Car',
  'At the ATM',
  'In a Mall',
  'Walking Alone',
  'Online',
  'At Work',
  'Using Public Transport',
  'At an Event',
  'Other',
];

/**
 * Confidence tier definitions.
 * Threshold for Production vs Review Queue is in PROCESSING_CONFIG.CONFIDENCE_THRESHOLD.
 * This defines what each band means for human reviewers.
 */
const CONFIDENCE_TIERS = {
  HIGH:    { min: 9, max: 10, label: 'High',    meaning: 'Named victim, police confirmed, specific location and date' },
  GOOD:    { min: 7, max: 8,  label: 'Good',    meaning: 'Clear crime, location and date known, minor details missing' },
  REVIEW:  { min: 5, max: 6,  label: 'Review',  meaning: 'Ambiguous cause, vague location, or date unclear' },
  WEAK:    { min: 3, max: 4,  label: 'Weak',    meaning: 'Only 1 indicator of crime, most details absent' },
  REJECT:  { min: 1, max: 2,  label: 'Reject',  meaning: 'Barely mentioned, no confirmation' },
};

// ============================================================================
// DERIVED HELPERS — build values other files need from the schema above
// ============================================================================

/**
 * Ordered array of crime type labels sorted by severity descending.
 * Used to build the Claude prompt hierarchy and for validation lists.
 */
function getCrimeTypesSortedBySeverity() {
  return Object.values(CRIME_TYPES)
    .sort((a, b) => b.severity - a.severity)
    .map(t => t.label);
}

/**
 * Map of label → severity. Drop-in replacement for CRIME_SEVERITY in crimeTypeProcessor.gs.
 */
function getCrimeSeverityMap() {
  const map = {};
  Object.values(CRIME_TYPES).forEach(t => { map[t.label] = t.severity; });
  return map;
}

/**
 * Build the hierarchy string for the Claude system prompt.
 * Output: "Murder > Attempted Murder > Kidnapping > ..."
 */
function buildCrimeHierarchyString() {
  return getCrimeTypesSortedBySeverity().join(' > ');
}

/**
 * Build the classification rules block for the Claude system prompt.
 * Each crime type's promptDescription becomes one bullet.
 */
function buildClassificationRulesBlock() {
  return Object.values(CRIME_TYPES)
    .sort((a, b) => b.severity - a.severity)
    .map(t => `${t.label}: ${t.promptDescription}`)
    .join('\n\n');
}
```

---

## The Target — What `crimeSchema.ts` Looks Like (Frontend)

```typescript
// astro-poc/src/config/crimeSchema.ts
// Mirror of schema.gs — kept in sync manually.
// Source of truth for frontend: filters, display labels, route slugs.

export const CRIME_TYPES = {
  MURDER:           { label: 'Murder',           severity: 10 },
  ATTEMPTED_MURDER: { label: 'Attempted Murder', severity: 9  },
  KIDNAPPING:       { label: 'Kidnapping',       severity: 8  },
  SEXUAL_ASSAULT:   { label: 'Sexual Assault',   severity: 7  },
  SHOOTING:         { label: 'Shooting',         severity: 6  },
  ASSAULT:          { label: 'Assault',          severity: 5  },
  HOME_INVASION:    { label: 'Home Invasion',    severity: 5  },
  ARSON:            { label: 'Arson',            severity: 4  },
  ROBBERY:          { label: 'Robbery',          severity: 4  },
  BURGLARY:         { label: 'Burglary',         severity: 3  },
  THEFT:            { label: 'Theft',            severity: 2  },
  SEIZURES:         { label: 'Seizures',         severity: 1  },
} as const;

export const CRIME_TYPE_LABELS = Object.values(CRIME_TYPES).map(t => t.label);

export const SAFETY_TIP_CATEGORIES = [
  'Robbery', 'Carjacking', 'Home Invasion', 'ATM Crime',
  'Online Scam', 'Kidnapping', 'Sexual Violence', 'Fraud', 'Assault', 'Other',
] as const;

export const SAFETY_TIP_CONTEXTS = [
  'At Home', 'In Your Car', 'At the ATM', 'In a Mall',
  'Walking Alone', 'Online', 'At Work', 'Using Public Transport', 'At an Event', 'Other',
] as const;
```

---

## Migration Plan

Each phase is self-contained and independently testable. Complete and verify Phase N before starting Phase N+1. The rollback for every phase is: revert the files changed in that phase only — all other phases remain intact.

---

### Phase 0 — Baseline Snapshot (Before Anything)

**Purpose:** Capture the current state so you have a reference point for every subsequent test.

**Actions:**
1. Run a test article through the pipeline manually (use `testClaudeWithSheetData()` in `claudeClient.gs`)
2. Copy the output JSON to a document — this is your baseline extraction
3. Note the `primary` and `related` crime types that `determineCrimeTypes()` produces for that output
4. Run `logConfigStatus()` and screenshot the log
5. Commit the current state of all GAS files with message `chore: baseline before schema centralization`

**Pass criteria:** You have a written baseline. No code changes yet.

**Rollback:** N/A — nothing changed.

---

### Phase 1 — Create `schema.gs`

**Purpose:** Add the new file. Nothing reads from it yet — zero risk.

**Files changed:** `schema.gs` (new file only)

**Actions:**
1. Create `schema.gs` with the full `CRIME_TYPES`, `SAFETY_TIP_CATEGORIES`, `SAFETY_TIP_CONTEXTS`, `CONFIDENCE_TIERS`, and derived helper functions shown above
2. Add the file to the GAS project
3. Call `getCrimeTypesSortedBySeverity()` manually from the Apps Script editor — verify the output order matches the intended hierarchy

**Test:**
```
// Run in Apps Script editor:
Logger.log(getCrimeTypesSortedBySeverity().join(' > '));
// Expected: Murder > Attempted Murder > Kidnapping > Sexual Assault > Shooting > Assault > Home Invasion > Arson > Robbery > Burglary > Theft > Seizures

Logger.log(buildCrimeHierarchyString());
// Expected: same as above

Logger.log(JSON.stringify(getCrimeSeverityMap()));
// Expected: {"Murder":10,"Attempted Murder":9,...}
```

**Pass criteria:** All three Logger outputs match expected values. No other files affected.

**Rollback:** Delete `schema.gs`.

---

### Phase 2 — Migrate `crimeTypeProcessor.gs`

**Purpose:** Replace the hardcoded `CRIME_SEVERITY` object with a call to `getCrimeSeverityMap()` from `schema.gs`. This is the highest-risk GAS change because `determineCrimeTypes()` runs on every processed article.

**Files changed:** `crimeTypeProcessor.gs`

**Current state (problem):**
```javascript
const CRIME_SEVERITY = {
  'Murder': 10,
  'Kidnapping': 9,
  'Home Invasion': 8,  // ← wrong position — should be below Sexual Assault and Shooting
  'Shooting': 7,
  'Sexual Assault': 6, // ← wrong position — should be above Shooting
  ...
  // Missing: Attempted Murder, Arson
};
```

**Target state:**
```javascript
// Remove CRIME_SEVERITY constant entirely.
// In determineCrimeTypes(), replace:
//   const severityA = CRIME_SEVERITY[a] || 0;
// with:
//   const severityMap = getCrimeSeverityMap();
//   const severityA = severityMap[a] || 0;
```

**Test — run before AND after the change:**
```javascript
// Test 1: Basic sort
const result1 = determineCrimeTypes(['Shooting', 'Murder']);
// Expected: { primary: 'Murder', related: 'Shooting' }

// Test 2: The previously-broken Sexual Assault vs Shooting case
const result2 = determineCrimeTypes(['Shooting', 'Sexual Assault']);
// Before fix: { primary: 'Shooting', related: 'Sexual Assault' }  ← was wrong
// After fix:  { primary: 'Sexual Assault', related: 'Shooting' }  ← correct

// Test 3: New types
const result3 = determineCrimeTypes(['Shooting', 'Attempted Murder']);
// Expected: { primary: 'Attempted Murder', related: 'Shooting' }

// Test 4: Arson
const result4 = determineCrimeTypes(['Robbery', 'Arson']);
// Expected: { primary: 'Arson', related: 'Robbery' }  (Arson severity:4 = Robbery severity:4, tie goes to first in schema order)

// Test 5: Unknown type (backward compat)
const result5 = determineCrimeTypes(['Police-Involved Shooting']);
// Expected: { primary: 'Police-Involved Shooting', related: '' }  — should not crash
```

**Pass criteria:** All 5 tests produce expected output. Run a full article through `testClaudeWithSheetData()` and compare `primary`/`related` values against baseline.

**Rollback:** Restore the original `CRIME_SEVERITY` const in `crimeTypeProcessor.gs`.

---

### Phase 3 — Migrate `claudeClient.gs` Prompt Generation

**Purpose:** Replace the hardcoded hierarchy table and crime type list in `buildSystemPrompt()` with calls to `schema.gs` helpers. This means the prompt is always in sync with `CRIME_TYPES` — adding a type to `schema.gs` automatically adds it to the prompt.

**Files changed:** `claudeClient.gs`

**Actions:**
Replace these sections of the prompt string with dynamic generation:

```javascript
// In buildSystemPrompt(), replace the hardcoded line:
// "Murder > Attempted Murder > Kidnapping > ..."
// with:
buildCrimeHierarchyString()

// Replace the hardcoded crime type schema list:
// "Murder, Attempted Murder, Shooting, ..."
// with:
getCrimeTypesSortedBySeverity().join(', ')
```

**Test:**
```javascript
// Run in Apps Script editor:
const prompt = buildSystemPrompt();

// Check 1: hierarchy appears correctly
Logger.log(prompt.includes('Murder > Attempted Murder > Kidnapping'));
// Expected: true

// Check 2: all crime types appear in the schema list
const labels = getCrimeTypesSortedBySeverity();
labels.forEach(label => {
  if (!prompt.includes(label)) Logger.log('MISSING FROM PROMPT: ' + label);
});
// Expected: no output (nothing missing)

// Check 3: full extraction still works
testClaudeExtraction();
// Expected: same confidence and crime type output as baseline
```

**Pass criteria:** Prompt contains all labels in correct order. Full extraction test matches baseline output.

**Rollback:** Restore the hardcoded strings in `buildSystemPrompt()`.

---

### Phase 4 — Migrate Safety Tip Enums in Prompt

**Purpose:** Replace the hardcoded `Robbery|Carjacking|Home Invasion|...` strings in the Claude schema definition with values derived from `schema.gs`.

**Files changed:** `claudeClient.gs` (schema section of `buildSystemPrompt()`)

**Actions:**
```javascript
// Replace the hardcoded safety_tip_category string in the JSON schema comment with:
`"safety_tip_category": ["array of: ${SAFETY_TIP_CATEGORIES.join('|')}. Empty array if not flagged."]`

// Same for safety_tip_context:
`"safety_tip_context": ["array of: ${SAFETY_TIP_CONTEXTS.join('|')}. Empty array if not flagged."]`
```

**Test:**
```javascript
// Run in Apps Script editor:
const prompt = buildSystemPrompt();

// Check all categories appear
SAFETY_TIP_CATEGORIES.forEach(cat => {
  if (!prompt.includes(cat)) Logger.log('MISSING CATEGORY: ' + cat);
});

// Check all contexts appear
SAFETY_TIP_CONTEXTS.forEach(ctx => {
  if (!prompt.includes(ctx)) Logger.log('MISSING CONTEXT: ' + ctx);
});
// Expected: no output
```

**Pass criteria:** All categories and contexts appear in the prompt. Run one safety-tip-flagged article through extraction and confirm the arrays are populated correctly.

**Rollback:** Restore the hardcoded category/context strings.

---

### Phase 5 — Create `crimeSchema.ts` (Frontend)

**Purpose:** Give the frontend a single import for crime type labels, safety tip enums, and severity order. Replaces scattered string arrays and magic strings in filter components.

**Files changed:** `astro-poc/src/config/crimeSchema.ts` (new file only)

**Actions:**
1. Create `crimeSchema.ts` with the structure shown in the target above
2. No existing files changed yet

**Test:**
```bash
cd astro-poc && npm run build
# Expected: build passes, crimeSchema.ts compiles without errors
```

**Pass criteria:** Build passes. File is importable.

**Rollback:** Delete `crimeSchema.ts`.

---

### Phase 6 — Migrate Frontend Files to `crimeSchema.ts`

**Purpose:** Replace hardcoded crime type lists and safety tip arrays in Astro components with imports from `crimeSchema.ts`.

**Files changed:** Astro frontend files that contain hardcoded crime type or safety tip strings (identified by grepping for the string `"Murder"` or `"Carjacking"` in `src/`).

**Before starting:** Run `grep -r "Carjacking\|Home Invasion\|Attempted Murder" src/` to produce the full list of files to migrate.

**Strategy:** Migrate one file at a time. After each file:
```bash
npm run build   # must pass
npm run preview # visually confirm the filter/display still works
```

**Test for each migrated file:**
1. Build passes
2. The filter or display that file controls still shows all crime types in the expected order
3. No new crime type labels appear as "undefined" or "Unknown"

**Pass criteria:** All files migrated, build passes, visual inspection shows no regressions.

**Rollback:** Revert individual files one at a time.

---

## Adding a New Crime Type After Migration

Once all phases are complete, the process to add a new type (e.g., `Extortion`) is:

1. Add it to `CRIME_TYPES` in `schema.gs` with a severity and promptDescription
2. Add the same entry to `crimeSchema.ts` on the frontend
3. Run Phase 2 tests (crimeTypeProcessor) to confirm sorting
4. Run Phase 3 tests (prompt generation) to confirm it appears in the prompt
5. Run `npm run build` on the frontend

**That's it.** No hunting through prompt strings, no separate validation list to update, no frontend filter to manually add it to.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `schema.gs` helper functions not available to other GAS files | Low | High | GAS shares global scope across all `.gs` files in a project — no imports needed |
| Severity tie-breaking differs from old behavior | Medium | Low | Ties are rare; document tie behavior in `schema.gs` comments |
| Frontend `crimeSchema.ts` drifts from `schema.gs` | Medium | Medium | Add a comment in both files: "Keep in sync with [other file] — last synced [date]" |
| Phase 3 prompt change shifts Claude's classification behavior | Low | Medium | Compare 10 recent extractions before vs after using `testClaudeWithSheetData()` |
| Old data in Production sheet has legacy crime type labels | Low | Low | `crimeTypeProcessor.gs` backward-compat block handles old formats |

---

## File Change Summary

| Phase | Files Changed | New / Modified |
|---|---|---|
| 0 | None — baseline commit | — |
| 1 | `schema.gs` | New |
| 2 | `crimeTypeProcessor.gs` | Modified |
| 3 | `claudeClient.gs` (hierarchy + schema list) | Modified |
| 4 | `claudeClient.gs` (safety tip enums) | Modified |
| 5 | `crimeSchema.ts` | New |
| 6 | Multiple Astro frontend files | Modified |
