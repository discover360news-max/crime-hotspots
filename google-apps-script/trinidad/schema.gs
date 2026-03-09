// ============================================================================
// schema.gs — SINGLE SOURCE OF TRUTH
// All crime classification, safety tip enums, and confidence tiers.
// Everything else derives from this file — never duplicate these values.
//
// SYNC NOTE: Keep in sync with astro-poc/src/config/crimeSchema.ts (Phase 5).
// Last synced: 2026-03-09 (session 3)
// ============================================================================

/**
 * Crime type definitions.
 * severity: 1–10 (used by crimeTypeProcessor to determine primary crime)
 * label: display string (used in prompt, frontend filters, sheet values)
 * promptDescription: one-line rule for Claude's classification section
 *
 * TIE-BREAKING: When two types share the same severity, schema insertion order
 * is used as the tiebreaker (earlier = higher priority). This is guaranteed
 * stable in GAS V8 (Object.values preserves insertion order for string keys).
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
  'Shooting',
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
  'At a Hotel',
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
 * Ordered array of crime type entries sorted by severity descending.
 * Stable sort: ties preserve insertion order from CRIME_TYPES (earlier = higher priority).
 * @returns {Array<{label: string, severity: number, promptDescription: string}>}
 */
function getCrimeTypesSortedBySeverity() {
  return Object.values(CRIME_TYPES)
    .sort((a, b) => b.severity - a.severity)
    .map(t => t.label);
}

/**
 * Map of label → severity. Drop-in replacement for CRIME_SEVERITY in crimeTypeProcessor.gs.
 * @returns {Object} e.g. { 'Murder': 10, 'Attempted Murder': 9, ... }
 */
function getCrimeSeverityMap() {
  const map = {};
  Object.values(CRIME_TYPES).forEach(t => { map[t.label] = t.severity; });
  return map;
}

/**
 * Map of label → schema position (0-based insertion order).
 * Used as tiebreaker in determineCrimeTypes() when two types share a severity.
 * Lower index = higher priority in ties.
 * @returns {Object} e.g. { 'Murder': 0, 'Attempted Murder': 1, ... }
 */
function getCrimeSchemaOrderMap() {
  const map = {};
  Object.values(CRIME_TYPES).forEach((t, i) => { map[t.label] = i; });
  return map;
}

/**
 * Build the hierarchy string for the Claude system prompt.
 * Output: "Murder > Attempted Murder > Kidnapping > ..."
 * @returns {string}
 */
function buildCrimeHierarchyString() {
  return getCrimeTypesSortedBySeverity().join(' > ');
}

/**
 * Build the crime type schema list for the Claude classification section.
 * Output: "Murder, Attempted Murder, Shooting, ..."
 * @returns {string}
 */
function buildCrimeTypesList() {
  return getCrimeTypesSortedBySeverity().join(', ');
}

/**
 * Build the classification rules block for the Claude system prompt.
 * Each crime type's promptDescription becomes one line.
 * @returns {string}
 */
function buildClassificationRulesBlock() {
  return Object.values(CRIME_TYPES)
    .sort((a, b) => b.severity - a.severity)
    .map(t => `${t.label}: ${t.promptDescription}`)
    .join('\n\n');
}
