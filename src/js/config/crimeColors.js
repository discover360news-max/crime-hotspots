// src/js/config/crimeColors.js
// Centralized crime type color configuration
// Use this across ALL visualizations for consistency

/**
 * Crime type color mapping
 * Colors chosen for accessibility and visual distinction
 */
export const CRIME_COLORS = {
  'Murder': '#dc2626',           // Red-600
  'Robbery': '#ea580c',          // Orange-600
  'Home Invasion': '#7c3aed',    // Violet-600
  'Theft': '#ca8a04',            // Yellow-600
  'Assault': '#f97316',          // Orange-500
  'Burglary': '#9333ea',         // Purple-600
  'Vehicle Theft': '#eab308',    // Yellow-500
  'Kidnapping': '#be123c',       // Rose-700
  'Sexual Assault': '#dc2626',   // Red-600
  'Fraud': '#0891b2',            // Cyan-600
  'Arson': '#ef4444',            // Red-500
  'Drug-related': '#16a34a',     // Green-600
  'Other': '#6b7280'             // Gray-500
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
 * Get ordered list of crime types by priority
 * Used for legend ordering
 */
export const CRIME_TYPE_ORDER = [
  'Murder',
  'Robbery',
  'Home Invasion',
  'Assault',
  'Theft',
  'Burglary',
  'Vehicle Theft',
  'Kidnapping',
  'Sexual Assault',
  'Fraud',
  'Arson',
  'Drug-related',
  'Other'
];
