// src/js/config/crimeColors.js
// Centralized crime type color configuration
// Use this across ALL visualizations for consistency

/**
 * Crime type color mapping - Family-Based System
 *
 * VIOLENCE FAMILY (Reds - Darkest to Lightest):
 *   Darkest = Most Severe
 *
 * PROPERTY CRIMES (Oranges/Warm):
 *   Force-based property crimes
 *
 * THEFT FAMILY (Yellows):
 *   Non-violent property theft
 *
 * OTHER (Cool Colors):
 *   Distinct categories
 */
export const CRIME_COLORS = {
  // VIOLENCE FAMILY (Reds)
  'Murder': '#7f1d1d',           // Darkest red - Most severe
  'Sexual Assault': '#b91c1c',   // Dark red - Very severe
  'Kidnapping': '#dc2626',       // Standard red - Severe
  'Assault': '#ef4444',          // Medium red - Violent
  'Shooting': '#f87171',         // Light red - Violence with weapon

  // PROPERTY CRIMES FAMILY (Oranges/Warm)
  'Robbery': '#ea580c',          // Dark orange - Force + property
  'Home Invasion': '#f97316',    // Orange - Occupied dwelling
  'Burglary': '#fb923c',         // Medium orange - Breaking & entering
  'Arson': '#fb7185',            // Coral/pink-orange - Fire damage

  // THEFT FAMILY (Yellows)
  'Vehicle Theft': '#ca8a04',    // Dark amber - Specific target
  'Theft': '#eab308',            // Yellow - General theft

  // OTHER CRIMES (Cool Colors)
  'Fraud': '#0891b2',            // Cyan - White-collar
  'Drug-related': '#059669',     // Green - Separate category
  'Seizures': '#3b82f6',         // Blue - Police enforcement/recovery
  'Police-Involved Shooting': '#1e40af', // Dark blue - Law enforcement
  'Other': '#6b7280'             // Grey - Catch-all
};

/**
 * Get color for a crime type
 * Falls back to gray if crime type not found
 */
export function getCrimeColor(crimeType) {
  return CRIME_COLORS[crimeType] || CRIME_COLORS['Other'];
}

/**
 * Get all crime colors as an array (for charts)
 * Returns colors in consistent order
 */
export function getCrimeColorsArray(crimeTypes) {
  return crimeTypes.map(type => getCrimeColor(type));
}

/**
 * Get ordered list of crime types by family grouping
 * Used for legend ordering - keeps families together
 */
export const CRIME_TYPE_ORDER = [
  // Violence Family (Reds - Darkest to Lightest)
  'Murder',
  'Sexual Assault',
  'Kidnapping',
  'Assault',
  'Shooting',

  // Property Crimes Family (Oranges)
  'Robbery',
  'Home Invasion',
  'Burglary',
  'Arson',

  // Theft Family (Yellows)
  'Vehicle Theft',
  'Theft',

  // Other Crimes (Cool Colors)
  'Fraud',
  'Drug-related',
  'Seizures',
  'Police-Involved Shooting',
  'Other'
];
