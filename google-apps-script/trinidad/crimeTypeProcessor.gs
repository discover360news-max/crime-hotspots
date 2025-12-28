/**
 * Crime Type Processing for Primary + Related Types (2026+)
 *
 * Determines primary crime type (most severe) and related types
 * from Gemini's all_crime_types array
 */

// Crime severity ranking (higher = more severe)
const CRIME_SEVERITY = {
  'Murder': 10,
  'Kidnapping': 9,
  'Police-Involved Shooting': 8,
  'Shooting': 7,
  'Sexual Assault': 6,
  'Assault': 5,
  'Robbery': 4,
  'Home Invasion': 3,
  'Theft': 2,
  'Seizures': 1
};

/**
 * Process crime types to determine primary and related
 * @param {Array} allCrimeTypes - Array from Gemini (e.g., ["Murder", "Shooting"])
 * @returns {Object} { primary: string, related: string (comma-separated) }
 */
function determineCrimeTypes(allCrimeTypes) {
  // Validate input
  if (!allCrimeTypes || !Array.isArray(allCrimeTypes) || allCrimeTypes.length === 0) {
    Logger.log('⚠️ No crime types provided, defaulting to Unknown');
    return {
      primary: 'Unknown',
      related: ''
    };
  }

  // Remove duplicates and sort by severity (descending)
  const uniqueTypes = [...new Set(allCrimeTypes)];
  const sortedTypes = uniqueTypes.sort((a, b) => {
    const severityA = CRIME_SEVERITY[a] || 0;
    const severityB = CRIME_SEVERITY[b] || 0;
    return severityB - severityA; // Descending
  });

  // Primary = most severe (first after sorting)
  const primary = sortedTypes[0];

  // Related = all others (comma-separated)
  const related = sortedTypes.slice(1).join(',');

  Logger.log(`  Crime types: ${allCrimeTypes.join(', ')}`);
  Logger.log(`  → Primary: ${primary}, Related: ${related || 'none'}`);

  return {
    primary: primary,
    related: related
  };
}

/**
 * BACKWARD COMPATIBILITY: Handle old single crime_type format
 * @param {Object} crime - Crime object from Gemini
 * @returns {Object} Processed crime types
 */
function processLegacyCrimeType(crime) {
  // Old format (2025 and earlier): crime.crime_type (string)
  if (crime.crime_type && !crime.all_crime_types) {
    return {
      primary: crime.crime_type,
      related: ''
    };
  }

  // New format (2026+): crime.all_crime_types (array)
  if (crime.all_crime_types) {
    return determineCrimeTypes(crime.all_crime_types);
  }

  // Fallback
  return {
    primary: 'Unknown',
    related: ''
  };
}
