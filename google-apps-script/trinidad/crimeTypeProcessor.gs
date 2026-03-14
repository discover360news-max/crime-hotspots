/**
 * Crime Type Processing for Primary + Related Types (2026+)
 *
 * Determines primary crime type (most severe) and related types
 * from Gemini's all_crime_types array
 */

// Crime severity is now sourced from schema.gs via getCrimeSeverityMap().
// Do NOT redefine CRIME_SEVERITY here — schema.gs is the single source of truth.

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

  // Remove duplicates and apply hard implication rules (safety net — Claude should
  // already include implied types, but this catches any misses).
  // Source of truth for rules: docs/guides/CRIME-CLASSIFICATION-RULES.md §4
  const uniqueTypes = [...new Set(allCrimeTypes)];
  const hardImplications = getHardImplications();
  const withImplied = [...uniqueTypes];
  uniqueTypes.forEach(type => {
    (hardImplications[type] || []).forEach(impliedType => {
      if (!withImplied.includes(impliedType)) {
        withImplied.push(impliedType);
        Logger.log(`  Hard implication: ${type} → ${impliedType} (auto-added)`);
      }
    });
  });

  // Sort by severity descending.
  // Tiebreaker: schema insertion order (earlier in CRIME_TYPES = higher priority).
  // Unknown types (e.g. legacy 'Police-Involved Shooting') fall to the end.
  const severityMap = getCrimeSeverityMap();
  const schemaOrderMap = getCrimeSchemaOrderMap();
  const sortedTypes = withImplied.sort((a, b) => {
    const severityA = severityMap[a] || 0;
    const severityB = severityMap[b] || 0;
    if (severityB !== severityA) return severityB - severityA;
    // Tie: lower schema index wins (earlier in schema = higher priority)
    const orderA = schemaOrderMap[a] !== undefined ? schemaOrderMap[a] : 999;
    const orderB = schemaOrderMap[b] !== undefined ? schemaOrderMap[b] : 999;
    return orderA - orderB;
  });

  // Partition: harm types first, context types last.
  // Context types (Home Invasion, Domestic Violence) NEVER become primary
  // when any harm type is present — regardless of severity score.
  const contextTypeLabels = getContextTypeLabels();
  const harmTypes = sortedTypes.filter(t => !contextTypeLabels.includes(t));
  const ctxTypes  = sortedTypes.filter(t =>  contextTypeLabels.includes(t));
  const reordered = harmTypes.length > 0 ? [...harmTypes, ...ctxTypes] : sortedTypes;

  // Primary = first after reordering
  const primary = reordered[0];

  // Related = all others (comma-separated)
  const related = reordered.slice(1).join(',');

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
