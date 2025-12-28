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
 */
function getDetailedAreaBreakdown(crimes, limit) {
  const areaData = {};

  crimes.forEach(crime => {
    const area = crime['Area'] || 'Unknown';
    const crimeType = crime['Crime Type'] || 'Other';

    if (!areaData[area]) {
      areaData[area] = {
        total: 0,
        types: {}
      };
    }

    areaData[area].total++;
    areaData[area].types[crimeType] = (areaData[area].types[crimeType] || 0) + 1;
  });

  // Convert to array and sort
  const sorted = Object.entries(areaData)
    .map(([area, data]) => ({
      area: area,
      total: data.total,
      topType: Object.entries(data.types).sort((a, b) => b[1] - a[1])[0],
      types: data.types
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return sorted;
}

/**
 * Format all data for Gemini
 */
function formatBlogData(startDate, endDate, stats, timeAnalysis, areaBreakdown, crimes) {
  const dateRange = `${formatDateLong(startDate)} - ${formatDateLong(endDate)}`;

  let output = '\n';
  output += 'BLOG POST DATA\n';
  output += '==============\n\n';

  // Date Range
  output += `**Report Period:** ${dateRange}\n\n`;

  // Overall Statistics
  output += `**OVERALL STATISTICS**\n`;
  output += `- Total Incidents This Week: ${stats.totalCurrent}\n`;
  output += `- Total Incidents Last Week: ${stats.totalPrevious}\n`;
  const totalDiff = stats.totalCurrent - stats.totalPrevious;
  const totalPercent = stats.totalPrevious > 0 ? ((totalDiff / stats.totalPrevious) * 100).toFixed(1) : 0;
  const trend = totalDiff > 0 ? 'increase' : (totalDiff < 0 ? 'decrease' : 'no change');
  output += `- Change: ${totalDiff >= 0 ? '+' : ''}${totalDiff} (${totalPercent}% ${trend})\n\n`;

  // Crime Type Breakdown
  output += `**CRIME TYPE BREAKDOWN (Top ${stats.changes.length})**\n`;
  stats.changes.forEach((c, index) => {
    const sign = c.diff >= 0 ? '+' : '';
    output += `${index + 1}. ${c.type}:\n`;
    output += `   - This Week: ${c.current} incidents\n`;
    output += `   - Last Week: ${c.previous} incidents\n`;
    output += `   - Change: ${sign}${c.diff} (${c.percentChange >= 0 ? '+' : ''}${Math.round(c.percentChange)}%)\n`;
  });
  output += '\n';

  // Geographic Breakdown
  output += `**GEOGRAPHIC BREAKDOWN (Top ${areaBreakdown.length} Areas)**\n`;
  areaBreakdown.forEach((area, index) => {
    output += `${index + 1}. ${area.area}:\n`;
    output += `   - Total Incidents: ${area.total}\n`;
    output += `   - Most Common Crime: ${area.topType[0]} (${area.topType[1]} incidents)\n`;
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
    output += `${index + 1}. ${crime['Crime Type']} in ${crime['Area']} on ${crime['Date']}\n`;
  });
  output += '\n';

  output += '---\n';
  output += 'END OF DATA\n';

  return output;
}

/**
 * Helper: Format date as "November 10, 2025"
 */
function formatDateLong(date) {
  return Utilities.formatDate(date, SOCIAL_CONFIG.timezone, 'MMMM d, yyyy');
}
