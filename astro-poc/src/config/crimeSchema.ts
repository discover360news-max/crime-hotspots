// astro-poc/src/config/crimeSchema.ts
// Mirror of google-apps-script/trinidad/schema.gs — kept in sync manually.
// Source of truth for frontend: filters, display labels, route slugs, validation.
// SYNC NOTE: Keep in sync with schema.gs — last synced: 2026-03-09 (session 3)

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

export type CrimeTypeKey = keyof typeof CRIME_TYPES;
export type CrimeTypeLabel = (typeof CRIME_TYPES)[CrimeTypeKey]['label'];

/** All crime type labels ordered by severity descending (ties: schema insertion order). */
export const CRIME_TYPE_LABELS = Object.values(CRIME_TYPES)
  .sort((a, b) => b.severity - a.severity)
  .map(t => t.label) as CrimeTypeLabel[];

/** Map of label → severity. Mirrors getCrimeSeverityMap() in schema.gs. */
export const CRIME_SEVERITY_MAP: Record<string, number> = Object.fromEntries(
  Object.values(CRIME_TYPES).map(t => [t.label, t.severity])
);

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
  'Shooting',
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
  'Other',
] as const;

export type SafetyTipCategory = (typeof SAFETY_TIP_CATEGORIES)[number];
export type SafetyTipContext = (typeof SAFETY_TIP_CONTEXTS)[number];
