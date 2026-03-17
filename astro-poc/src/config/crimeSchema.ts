// astro-poc/src/config/crimeSchema.ts
// Mirror of google-apps-script/trinidad/schema.gs — kept in sync manually.
// Source of truth for frontend: filters, display labels, route slugs, validation.
// SYNC NOTE: Keep in sync with schema.gs — last synced: 2026-03-17 (Fraud crime type added)

export const CRIME_TYPES = {
  MURDER:           { label: 'Murder',           severity: 10, isContextType: false },
  ATTEMPTED_MURDER: { label: 'Attempted Murder', severity: 9,  isContextType: false },
  KIDNAPPING:       { label: 'Kidnapping',       severity: 8,  isContextType: false },
  SEXUAL_ASSAULT:   { label: 'Sexual Assault',   severity: 7,  isContextType: false },
  SHOOTING:         { label: 'Shooting',         severity: 6,  isContextType: false },
  ASSAULT:          { label: 'Assault',          severity: 5,  isContextType: false },
  HOME_INVASION:    { label: 'Home Invasion',    severity: 5,  isContextType: true  },
  CARJACKING:       { label: 'Carjacking',       severity: 5,  isContextType: false },
  ARSON:            { label: 'Arson',            severity: 4,  isContextType: false },
  ROBBERY:          { label: 'Robbery',          severity: 4,  isContextType: false },
  DOMESTIC_VIOLENCE:{ label: 'Domestic Violence',severity: 4,  isContextType: true  },
  EXTORTION:        { label: 'Extortion',        severity: 3,  isContextType: false },
  FRAUD:            { label: 'Fraud',            severity: 3,  isContextType: false },
  BURGLARY:         { label: 'Burglary',         severity: 3,  isContextType: false },
  THEFT:            { label: 'Theft',            severity: 2,  isContextType: false },
  SEIZURES:         { label: 'Seizures',         severity: 1,  isContextType: false },
} as const;

export type CrimeTypeKey = keyof typeof CRIME_TYPES;
export type CrimeTypeLabel = (typeof CRIME_TYPES)[CrimeTypeKey]['label'];

/** All crime type labels ordered by severity descending (ties: schema insertion order). */
export const CRIME_TYPE_LABELS = Object.values(CRIME_TYPES)
  .sort((a, b) => b.severity - a.severity)
  .map(t => t.label) as CrimeTypeLabel[];

/** Labels of context types (setting/relationship — yield to harm types in primary position). */
export const CONTEXT_TYPE_LABELS = Object.values(CRIME_TYPES)
  .filter(t => t.isContextType)
  .map(t => t.label) as CrimeTypeLabel[];

/** Map of label → severity. Mirrors getCrimeSeverityMap() in schema.gs. */
export const CRIME_SEVERITY_MAP: Record<string, number> = Object.fromEntries(
  Object.values(CRIME_TYPES).map(t => [t.label, t.severity])
);

/**
 * Hard implication rules — certain crime types ALWAYS carry implied related types.
 * No article confirmation needed; these are definitionally contained.
 * Applied at data entry / GAS processing. Mirrors CRIME_HARD_IMPLICATIONS in schema.gs.
 * Source of truth: docs/guides/CRIME-CLASSIFICATION-RULES.md §4
 */
export const CRIME_HARD_IMPLICATIONS: Partial<Record<CrimeTypeKey, CrimeTypeKey[]>> = {
  CARJACKING:    ['ROBBERY'],    // Carjacking IS a robbery — vehicle taken by force
  HOME_INVASION: ['BURGLARY'],   // Every home invasion involves unlawful entry
} as const;

export const SAFETY_TIP_CATEGORIES = [
  'Robbery',
  'Carjacking',
  'Home Invasion',
  'ATM Crime',
  'Online Scam',
  'Kidnapping',
  'Sexual Violence',
  'Fraud',
  'Assault',
  'Domestic Violence',
  'Extortion',
  'Shooting',
  'Burglary',
  'Other',
] as const;

export const SAFETY_TIP_CONTEXTS = [
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
  'At a Bar',
  'Other',
] as const;

export type SafetyTipCategory = (typeof SAFETY_TIP_CATEGORIES)[number];
export type SafetyTipContext = (typeof SAFETY_TIP_CONTEXTS)[number];
