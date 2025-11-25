// src/js/config/crimeColors.js
// Centralized crime type color configuration
// Use this across ALL visualizations for consistency

/**
 * Crime type color mapping
 * Pastel colors for most crimes, vivid red for Murder
 * Each crime has a unique, distinct color
 */
export const CRIME_COLORS = {
  'Murder': '#dc2626',           // VIVID RED (only non-pastel)
  'Robbery': '#fca5a5',          // Pastel pink-red
  'Home Invasion': '#c4b5fd',    // Pastel violet
  'Theft': '#fde68a',            // Pastel yellow
  'Assault': '#fdba74',          // Pastel orange
  'Burglary': '#d8b4fe',         // Pastel purple
  'Vehicle Theft': '#fef08a',    // Pastel bright yellow
  'Kidnapping': '#fda4af',       // Pastel rose
  'Sexual Assault': '#f87171',   // Medium red (lighter than murder)
  'Fraud': '#a5f3fc',            // Pastel cyan
  'Arson': '#fecaca',            // Pastel light red
  'Drug-related': '#86efac',     // Pastel green
  'Other': '#d1d5db'             // Light gray
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
