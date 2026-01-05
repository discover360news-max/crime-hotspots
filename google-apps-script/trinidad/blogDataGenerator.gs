/**
 * BLOG DATA GENERATOR FOR GEMINI
 *
 * Extends socialMediaStats.gs to generate detailed blog post data
 * Outputs structured text ready to paste into Gemini for blog generation
 *
 * USAGE:
 * 1. Run generateBlogData() in Apps Script editor
 * 2. Copy the output from the Logger
 * 3. Paste into Gemini along with the blog prompt
 * 4. Gemini generates the full blog post in markdown
 * 5. Copy result into new .md file in astro-poc/src/content/blog/
 */

/**
 * CRIME TYPE CONFIGURATION
 * Controls which crime types use victim count multipliers
 *
 * useVictimCount Rules:
 * - true: Multiply PRIMARY crime type by victimCount (e.g., double murder = 2)
 * - false: Count as 1 incident regardless of victim count
 *
 * IMPORTANT: Victim count ONLY applies to PRIMARY crime type.
 * Related crimes ALWAYS count as +1 (incident-based).
 */
const BLOG_CRIME_TYPE_CONFIG = {
  // Victim-count crimes (count each victim for PRIMARY crime only)
  'Murder': { useVictimCount: true },
  'Assault': { useVictimCount: true },
  'Sexual Assault': { useVictimCount: true },
  'Kidnapping': { useVictimCount: true },
  'Robbery': { useVictimCount: true },
  'Shooting': { useVictimCount: true },

  // Incident-count crimes (always count as 1 incident)
  'Burglary': { useVictimCount: false },
  'Home Invasion': { useVictimCount: false },
  'Seizures': { useVictimCount: false },
  'Theft': { useVictimCount: false }
};

/**
 * Helper: Check if crime type uses victim count
 */
function usesVictimCount(crimeType) {
  return BLOG_CRIME_TYPE_CONFIG[crimeType]?.useVictimCount || false;
}

/**
 * Main function - generates comprehensive blog data
 * Copy the logger output and paste into Gemini
 */
function generateBlogData() {
  Logger.log('📰 Generating Blog Data for Gemini...\n');
  Logger.log('=' + '='.repeat(60));

  try {
    // Fetch crime data (reuse from socialMediaStats.gs)
    const crimes = fetchCrimeData();

    // Calculate date ranges (same logic as social posts)
    const now = new Date();
    const currentWeekEnd = new Date(now);
    currentWeekEnd.setDate(currentWeekEnd.getDate() - SOCIAL_CONFIG.lagDays);
    const currentWeekStart = new Date(currentWeekEnd);
    currentWeekStart.setDate(currentWeekStart.getDate() - 6);

    const previousWeekEnd = new Date(currentWeekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
    const previousWeekStart = new Date(previousWeekEnd);
    previousWeekStart.setDate(previousWeekStart.getDate() - 6);

    // Filter crimes
    const currentWeekCrimes = filterCrimesByDateRange(crimes, currentWeekStart, currentWeekEnd);
    const previousWeekCrimes = filterCrimesByDateRange(crimes, previousWeekStart, previousWeekEnd);

    // Calculate stats
    const stats = calculateStats(currentWeekCrimes, previousWeekCrimes);

    // Generate time-of-day analysis
    const timeAnalysis = analyzeTimeOfDay(currentWeekCrimes);

    // Get area breakdowns (top 5)
    const areaBreakdown = getDetailedAreaBreakdown(currentWeekCrimes, 5);

    // Generate output for Gemini
    const blogData = formatBlogData(
      currentWeekStart,
      currentWeekEnd,
      stats,
      timeAnalysis,
      areaBreakdown,
      currentWeekCrimes
    );

    Logger.log(blogData);
    Logger.log('=' + '='.repeat(60));
    Logger.log('\n✅ COPY THE TEXT ABOVE and paste into Gemini with the blog prompt');
    Logger.log('📝 Find the prompt in: docs/automation/BLOG-GENERATION-PROMPT.md');

  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * Analyze time-of-day patterns
 */
function analyzeTimeOfDay(crimes) {
  // Time periods: Morning (6am-12pm), Afternoon (12pm-6pm), Evening (6pm-9pm), Night (9pm-midnight), Late Night (midnight-6am)
  const periods = {
    'Morning (6 AM - 12 PM)': 0,
    'Afternoon (12 PM - 6 PM)': 0,
    'Evening (6 PM - 9 PM)': 0,
    'Night (9 PM - Midnight)': 0,
    'Late Night (Midnight - 6 AM)': 0
  };

  let totalWithTime = 0;

  crimes.forEach(crime => {
    // Try to extract time from Incident Date field
    const dateStr = crime['Date'] || '';
    const match = dateStr.match(/(\d{1,2}):(\d{2})/); // Matches "14:30" or "2:30"

    if (match) {
      totalWithTime++;
      const hour = parseInt(match[1]);

      if (hour >= 6 && hour < 12) periods['Morning (6 AM - 12 PM)']++;
      else if (hour >= 12 && hour < 18) periods['Afternoon (12 PM - 6 PM)']++;
      else if (hour >= 18 && hour < 21) periods['Evening (6 PM - 9 PM)']++;
      else if (hour >= 21 || hour < 0) periods['Night (9 PM - Midnight)']++;
      else periods['Late Night (Midnight - 6 AM)']++;
    }
  });

  return {
    periods: periods,
    totalWithTime: totalWithTime,
    totalCrimes: crimes.length,
    hasData: totalWithTime > 0
  };
}

/**
 * Get detailed area breakdown
 * Tracks both incidents and victims per area
 * Uses 2026 crime type format (primaryCrimeType + relatedCrimeTypes)
 */
function getDetailedAreaBreakdown(crimes, limit) {
  const areaData = {};

  crimes.forEach(crime => {
    const area = crime['Area'] || 'Unknown';

    if (!areaData[area]) {
      areaData[area] = {
        totalIncidents: 0,
        totalVictims: 0,
        types: {}, // { 'Murder': { incidents: 3, victims: 5 } }
        incidents: [] // Store crime references for analysis
      };
    }

    // Count this incident
    areaData[area].totalIncidents++;
    areaData[area].incidents.push(crime);

    // Get crime types (support both 2026 and 2025 formats)
    const primaryType = crime['primaryCrimeType'] || crime['Primary Crime Type'];
    const relatedTypes = crime['relatedCrimeTypes'] || crime['Related Crime Types'] || '';
    const victimCount = parseInt(crime['victimCount'] || crime['Victim Count'] || '1', 10) || 1;

    if (primaryType && primaryType.trim() !== '') {
      // 2026 format: primary + related crime types

      // Initialize primary crime type if not exists
      if (!areaData[area].types[primaryType]) {
        areaData[area].types[primaryType] = { incidents: 0, victims: 0 };
      }

      // Count primary crime
      areaData[area].types[primaryType].incidents++;

      // Apply victim count if configured for this crime type
      if (usesVictimCount(primaryType)) {
        areaData[area].types[primaryType].victims += victimCount;
        areaData[area].totalVictims += victimCount;
      } else {
        areaData[area].types[primaryType].victims += 1;
        areaData[area].totalVictims += 1;
      }

      // Count related crime types (always +1 for related)
      if (relatedTypes && relatedTypes.trim() !== '') {
        const related = relatedTypes.split('|').map(t => t.trim()).filter(t => t !== '');
        related.forEach(type => {
          if (!areaData[area].types[type]) {
            areaData[area].types[type] = { incidents: 0, victims: 0 };
          }
          areaData[area].types[type].incidents++;
          areaData[area].types[type].victims += 1; // Related crimes always count as 1
          areaData[area].totalVictims += 1;
        });
      }

    } else {
      // 2025 format: single Crime Type field (fallback)
      const crimeType = crime['Crime Type'] || crime['crimeType'] || 'Other';

      if (!areaData[area].types[crimeType]) {
        areaData[area].types[crimeType] = { incidents: 0, victims: 0 };
      }

      areaData[area].types[crimeType].incidents++;
      areaData[area].types[crimeType].victims += 1; // 2025 data doesn't have victim count
      areaData[area].totalVictims += 1;
    }
  });

  // Convert to array and sort
  const sorted = Object.entries(areaData)
    .map(([area, data]) => {
      // Find top crime type by incidents
      const topType = Object.entries(data.types)
        .sort((a, b) => b[1].incidents - a[1].incidents)[0];

      return {
        area: area,
        totalIncidents: data.totalIncidents,
        totalVictims: data.totalVictims,
        topType: topType ? {
          name: topType[0],
          incidents: topType[1].incidents,
          victims: topType[1].victims
        } : null,
        types: data.types
      };
    })
    .sort((a, b) => b.totalIncidents - a.totalIncidents)
    .slice(0, limit);

  return sorted;
}

/**
 * Format all data for Gemini
 * Provides comprehensive statistics including both incidents and victims
 */
function formatBlogData(startDate, endDate, stats, timeAnalysis, areaBreakdown, crimes) {
  const dateRange = `${formatDateLong(startDate)} - ${formatDateLong(endDate)}`;

  let output = '\n';
  output += 'BLOG POST DATA\n';
  output += '==============\n\n';

  // Date Range
  output += `**Report Period:** ${dateRange}\n\n`;

  // Overall Statistics (Incidents + Victims)
  output += `**OVERALL STATISTICS**\n`;
  output += `\nIncidents:\n`;
  output += `- Total Incidents This Week: ${stats.totalCurrent}\n`;
  output += `- Total Incidents Last Week: ${stats.totalPrevious}\n`;
  const totalDiff = stats.totalCurrent - stats.totalPrevious;
  const totalPercent = stats.totalPrevious > 0 ? ((totalDiff / stats.totalPrevious) * 100).toFixed(1) : 0;
  const trend = totalDiff > 0 ? 'increase' : (totalDiff < 0 ? 'decrease' : 'no change');
  output += `- Change: ${totalDiff >= 0 ? '+' : ''}${totalDiff} (${totalPercent}% ${trend})\n`;

  // Calculate total victims from current week crimes
  const totalVictimsCurrent = calculateTotalVictims(crimes);
  output += `\nVictims:\n`;
  output += `- Total Victims This Week: ${totalVictimsCurrent}\n`;
  output += `- Note: Victim count applies to configured crime types (Murder, Assault, Sexual Assault, Kidnapping, Robbery, Shooting)\n\n`;

  // Crime Type Breakdown (with incidents + victims)
  output += `**CRIME TYPE BREAKDOWN (Top ${stats.changes.length})**\n`;
  output += `Note: Shows both incident count and victim count where applicable\n\n`;

  stats.changes.forEach((c, index) => {
    const sign = c.diff >= 0 ? '+' : '';
    output += `${index + 1}. ${c.type}:\n`;
    output += `   - This Week: ${c.current} incidents`;

    // Add victim count if this crime type uses it
    if (usesVictimCount(c.type)) {
      const victimsCurrent = calculateVictimsForCrimeType(crimes, c.type);
      output += ` (${victimsCurrent} victims)`;
    }
    output += `\n`;

    output += `   - Last Week: ${c.previous} incidents\n`;
    output += `   - Change: ${sign}${c.diff} (${c.percentChange >= 0 ? '+' : ''}${Math.round(c.percentChange)}%)\n`;
  });
  output += '\n';

  // Geographic Breakdown (with incidents + victims)
  output += `**GEOGRAPHIC BREAKDOWN (Top ${areaBreakdown.length} Areas)**\n`;
  areaBreakdown.forEach((area, index) => {
    output += `${index + 1}. ${area.area}:\n`;
    output += `   - Total Incidents: ${area.totalIncidents}\n`;
    output += `   - Total Victims: ${area.totalVictims}\n`;
    if (area.topType) {
      output += `   - Most Common Crime: ${area.topType.name} (${area.topType.incidents} incidents`;
      if (area.topType.victims > area.topType.incidents) {
        output += `, ${area.topType.victims} victims`;
      }
      output += `)\n`;
    }
  });
  output += '\n';

  // Time of Day Analysis
  if (timeAnalysis.hasData) {
    output += `**TIME OF DAY PATTERNS**\n`;
    output += `(Based on ${timeAnalysis.totalWithTime} of ${timeAnalysis.totalCrimes} incidents with time data)\n`;
    Object.entries(timeAnalysis.periods).forEach(([period, count]) => {
      const percent = timeAnalysis.totalWithTime > 0 ? ((count / timeAnalysis.totalWithTime) * 100).toFixed(0) : 0;
      output += `- ${period}: ${count} incidents (${percent}%)\n`;
    });
    output += '\n';
  }

  // Sample Incidents (first 10 for context)
  output += `**SAMPLE INCIDENTS (First 10)**\n`;
  crimes.slice(0, 10).forEach((crime, index) => {
    const primaryType = crime['primaryCrimeType'] || crime['Primary Crime Type'] || crime['Crime Type'] || 'Unknown';
    const victimCount = parseInt(crime['victimCount'] || crime['Victim Count'] || '1', 10) || 1;

    output += `${index + 1}. ${primaryType} in ${crime['Area']} on ${crime['Date']}`;
    if (victimCount > 1) {
      output += ` (${victimCount} victims)`;
    }
    output += `\n`;
  });
  output += '\n';

  output += '---\n';
  output += 'END OF DATA\n';

  return output;
}

/**
 * Calculate total victims from crime list
 */
function calculateTotalVictims(crimes) {
  let totalVictims = 0;

  crimes.forEach(crime => {
    const primaryType = crime['primaryCrimeType'] || crime['Primary Crime Type'];
    const relatedTypes = crime['relatedCrimeTypes'] || crime['Related Crime Types'] || '';
    const victimCount = parseInt(crime['victimCount'] || crime['Victim Count'] || '1', 10) || 1;

    if (primaryType && primaryType.trim() !== '') {
      // 2026 format

      // Count primary crime victims
      if (usesVictimCount(primaryType)) {
        totalVictims += victimCount;
      } else {
        totalVictims += 1;
      }

      // Count related crimes (always +1 each)
      if (relatedTypes && relatedTypes.trim() !== '') {
        const related = relatedTypes.split('|').filter(t => t.trim() !== '');
        totalVictims += related.length;
      }

    } else {
      // 2025 format (no victim count)
      totalVictims += 1;
    }
  });

  return totalVictims;
}

/**
 * Calculate victims for a specific crime type
 */
function calculateVictimsForCrimeType(crimes, targetType) {
  let victims = 0;

  crimes.forEach(crime => {
    const primaryType = crime['primaryCrimeType'] || crime['Primary Crime Type'];
    const relatedTypes = crime['relatedCrimeTypes'] || crime['Related Crime Types'] || '';
    const victimCount = parseInt(crime['victimCount'] || crime['Victim Count'] || '1', 10) || 1;

    if (primaryType && primaryType.trim() !== '') {
      // 2026 format

      // Check if primary crime matches
      if (primaryType === targetType) {
        if (usesVictimCount(targetType)) {
          victims += victimCount;
        } else {
          victims += 1;
        }
      }

      // Check if any related crime matches (always +1)
      if (relatedTypes && relatedTypes.trim() !== '') {
        const related = relatedTypes.split('|').map(t => t.trim()).filter(t => t !== '');
        if (related.includes(targetType)) {
          victims += 1;
        }
      }

    } else {
      // 2025 format
      const crimeType = crime['Crime Type'] || crime['crimeType'];
      if (crimeType === targetType) {
        victims += 1;
      }
    }
  });

  return victims;
}

/**
 * Helper: Format date as "November 10, 2025"
 */
function formatDateLong(date) {
  return Utilities.formatDate(date, SOCIAL_CONFIG.timezone, 'MMMM d, yyyy');
}
