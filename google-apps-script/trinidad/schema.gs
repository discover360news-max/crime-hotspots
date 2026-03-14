// ============================================================================
// schema.gs — SINGLE SOURCE OF TRUTH
// All crime classification, safety tip enums, and confidence tiers.
// Everything else derives from this file — never duplicate these values.
//
// SYNC NOTE: Keep in sync with astro-poc/src/config/crimeSchema.ts (Phase 5).
// Last synced: 2026-03-14 (CRIME_HARD_IMPLICATIONS + Carjacking promptDescription fix + hard implication helpers)
// ============================================================================

/**
 * Crime type definitions.
 * severity: 1–10 (used by crimeTypeProcessor to determine primary crime)
 * label: display string (used in prompt, frontend filters, sheet values)
 * promptDescription: one-line rule for Claude's classification section
 * isContextType: true = describes METHOD or SETTING (yields to harm types in
 *   primary position); false = the primary harm itself
 *
 * TIE-BREAKING: When two types share the same severity, schema insertion order
 * is used as the tiebreaker (earlier = higher priority). This is guaranteed
 * stable in GAS V8 (Object.values preserves insertion order for string keys).
 */
const CRIME_TYPES = {
  MURDER:           { label: 'Murder',           severity: 10, isContextType: false, promptDescription: 'Civilian intentionally killed by another civilian. Keywords: murdered, slain, executed, gunned down, killed by gunman. Never for accidents, medical deaths, traffic deaths, or police killings.' },
  ATTEMPTED_MURDER: { label: 'Attempted Murder', severity: 9,  isContextType: false, promptDescription: 'Targeted attack with clear intent to kill where victim survived. Always paired with Shooting or Assault in all_crime_types. Do NOT use for stray bullets or ambiguous fights — default to Shooting or Assault instead.' },
  KIDNAPPING:       { label: 'Kidnapping',       severity: 8,  isContextType: false, promptDescription: 'Person abducted or held against their will.' },
  SEXUAL_ASSAULT:   { label: 'Sexual Assault',   severity: 7,  isContextType: false, promptDescription: 'Rape, sexual violence, or forced sexual contact.' },
  SHOOTING:         { label: 'Shooting',         severity: 6,  isContextType: false, promptDescription: 'Firearm was DISCHARGED at a person. Gun as threat only = NOT a Shooting.' },
  ASSAULT:          { label: 'Assault',          severity: 5,  isContextType: false, promptDescription: 'Physical attack causing injury. ADD Assault alongside Robbery when victim is physically struck/beaten (not just threatened). Threat alone = no Assault.' },
  HOME_INVASION:    { label: 'Home Invasion',    severity: 5,  isContextType: true,  promptDescription: 'Forced entry into a residence while occupied. Describes the SETTING — always yields to harm types in primary position.' },
  CARJACKING:       { label: 'Carjacking',       severity: 5,  isContextType: false, promptDescription: 'Vehicle taken from driver/occupant using force or threat. HARD RULE: always include Robbery in all_crime_types — the vehicle IS the stolen property. Add Shooting if shots fired, Assault if victim was physically struck. Never add Theft — Robbery covers all property taken.' },
  ARSON:            { label: 'Arson',            severity: 4,  isContextType: false, promptDescription: 'Deliberate setting of fire to property or person. Use when article explicitly states fire was deliberately set, describes arson, or treats it as criminal. Never for accidental fires, electrical fires, or fires of undetermined cause.' },
  ROBBERY:          { label: 'Robbery',          severity: 4,  isContextType: false, promptDescription: 'Taking property using force or threat. Not pure theft.' },
  DOMESTIC_VIOLENCE:{ label: 'Domestic Violence',severity: 4,  isContextType: true,  promptDescription: 'Violence between intimate partners or family members. ALWAYS appears alongside Assault/Murder/Shooting — never alone. Describes RELATIONSHIP context, not the harm type.' },
  EXTORTION:        { label: 'Extortion',        severity: 3,  isContextType: false, promptDescription: 'Demanding money or compliance under threat of harm, property damage, or exposure. No immediate physical violence required.' },
  BURGLARY:         { label: 'Burglary',         severity: 3,  isContextType: false, promptDescription: 'Forced entry into unoccupied property to steal.' },
  THEFT:            { label: 'Theft',            severity: 2,  isContextType: false, promptDescription: 'Taking property without confrontation.' },
  SEIZURES:         { label: 'Seizures',         severity: 1,  isContextType: false, promptDescription: 'Police recovering contraband (guns/drugs/cash).' },
};

/**
 * Hard implication rules — certain crime types ALWAYS carry implied related types.
 * No article confirmation needed; these are definitionally contained.
 * Applied in determineCrimeTypes() in crimeTypeProcessor.gs as a safety net.
 * Source of truth: docs/guides/CRIME-CLASSIFICATION-RULES.md §4
 */
const CRIME_HARD_IMPLICATIONS = {
  'Carjacking':    ['Robbery'],   // Carjacking IS a robbery — vehicle taken by force
  'Home Invasion': ['Burglary'],  // Every home invasion involves unlawful entry
};

/**
 * Returns the hard implications map.
 * Used by crimeTypeProcessor.gs to auto-add implied types.
 * @returns {Object} Map of crime label → array of always-implied labels
 */
function getHardImplications() {
  return CRIME_HARD_IMPLICATIONS;
}

/**
 * Build the hard implications block for the Claude system prompt.
 * @returns {string}
 */
function buildHardImplicationsBlock() {
  return Object.entries(CRIME_HARD_IMPLICATIONS)
    .map(([type, implied]) => `${type} → always include in all_crime_types: ${implied.join(', ')}`)
    .join('\n');
}

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
 * Returns array of labels where isContextType = true.
 * Used by crimeTypeProcessor to partition harm types vs context types.
 * @returns {string[]}
 */
function getContextTypeLabels() {
  return Object.values(CRIME_TYPES).filter(t => t.isContextType).map(t => t.label);
}

/**
 * Build the hierarchy string for the Claude system prompt.
 * Context types are marked with [context] so Claude understands ordering.
 * Output: "... > Assault > Home Invasion [context] > Carjacking > ..."
 * Stable sort: ties preserve insertion order (GAS V8 guarantee).
 * @returns {string}
 */
function buildCrimeHierarchyString() {
  return Object.values(CRIME_TYPES)
    .sort((a, b) => b.severity - a.severity)
    .map(t => t.isContextType ? `${t.label} [context]` : t.label)
    .join(' > ');
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
