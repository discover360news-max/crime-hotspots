/**
 * WEEKLY BLOG AUTOMATION - FULLY AUTOMATIC
 *
 * Generates weekly crime report blog posts using Claude Haiku 4.5
 * and commits them directly to GitHub for auto-deployment.
 *
 * FLOW:
 * 1. Monday 10 AM Trinidad time → trigger fires
 * 2. Validates data readiness (4 safeguards)
 * 3. Generates crime statistics from Production sheet
 * 4. Sends stats to Claude Haiku → receives markdown blog post
 * 5. Wraps in Astro frontmatter
 * 6. Commits to GitHub → Cloudflare auto-deploys
 *
 * DEPENDENCIES (must exist in same GAS project):
 * - config.gs         → CLAUDE_CONFIG, CLAUDE_API_ENDPOINT, getClaudeApiKey()
 * - socialMediaStats.gs → fetchCrimeData(), filterCrimesByDateRange(),
 *                         calculateStats(), SOCIAL_CONFIG
 * - blogDataGenerator.gs → analyzeTimeOfDay(), getDetailedAreaBreakdown(),
 *                           formatBlogData(), calculateTotalVictims()
 *
 * SETUP:
 * 1. Add this file to your Trinidad Google Apps Script project
 * 2. Set Script Properties (run setupBlogProperties()):
 *    - CLAUDE_API_KEY     (already set from crime extraction)
 *    - GITHUB_TOKEN       (Personal Access Token with repo scope)
 *    - GITHUB_REPO        (e.g., "username/Crime-Hotspots")
 * 3. Run setupWeeklyBlogTrigger() once to create the Monday 10 AM trigger
 * 4. Test with testBlogGeneration() before going live
 *
 * COST: ~$0.01-0.03 per blog post (Claude Haiku 4.5)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const BLOG_CONFIG = {
  // GitHub settings (set via Script Properties)
  githubToken: PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
  githubRepo: PropertiesService.getScriptProperties().getProperty('GITHUB_REPO'),
  githubBranch: 'main',

  // Blog file path in repo (Astro content collection)
  blogPath: 'astro-poc/src/content/blog',

  // Validation thresholds
  minWeeklyCrimes: 10,        // Don't publish if fewer than 10 crimes
  minDataFreshness: 3,         // Must have 3+ crimes from last 3 days
  maxPendingArticles: 50,      // Skip if pipeline is backlogged
  duplicateThreshold: 0.9,     // Skip if 90%+ identical to last week

  // Claude settings for blog writing
  blogModel: 'claude-haiku-4-5-20251001',
  blogMaxTokens: 4096,
  blogTemperature: 0.4  // Slightly higher than extraction for more natural prose
};

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Main function — called by weekly trigger (Monday 10 AM)
 * Validates data, generates blog post with Claude, commits to GitHub
 */
function generateWeeklyBlog() {
  Logger.log('='.repeat(60));
  Logger.log('WEEKLY BLOG AUTOMATION');
  Logger.log(`Time: ${new Date()}`);
  Logger.log('='.repeat(60));

  try {
    // Step 1: Validate data readiness
    Logger.log('\n--- Step 1: Validating data readiness ---');
    const validation = validateBlogDataReadiness();

    if (!validation.passed) {
      Logger.log(`SKIPPED: ${validation.reason}`);
      sendBlogSkipNotification(validation);
      return;
    }
    Logger.log('All validation checks passed');

    // Step 2: Generate crime statistics
    Logger.log('\n--- Step 2: Generating crime statistics ---');
    const blogData = generateBlogStatistics();
    Logger.log(`Generated stats for ${blogData.dateRange}`);
    Logger.log(`Total incidents: ${blogData.totalCrimes}`);

    // Step 3: Send to Claude for blog writing
    Logger.log('\n--- Step 3: Sending to Claude Haiku ---');
    const claudeResponse = generateBlogWithClaude(blogData.statsText);
    Logger.log(`Claude response received (${claudeResponse.length} chars)`);

    // Step 4: Parse Claude response and build final markdown
    Logger.log('\n--- Step 4: Building final markdown ---');
    const parsed = parseClaudeBlogResponse(claudeResponse);
    const finalMarkdown = buildFinalBlogMarkdown(parsed, blogData);
    Logger.log(`Title: ${parsed.title}`);

    // Step 5: Commit to GitHub
    Logger.log('\n--- Step 5: Committing to GitHub ---');
    const dateStr = formatBlogDateStr(blogData.weekEnd);
    const filename = `trinidad-weekly-${dateStr}.md`;
    commitBlogToGitHub(filename, finalMarkdown);

    // Step 6: Store fingerprint for next week's duplicate check
    storeBlogFingerprint(blogData.fingerprint);

    Logger.log('\n' + '='.repeat(60));
    Logger.log(`Blog published: ${filename}`);
    Logger.log('='.repeat(60));

    // Send success notification
    sendBlogSuccessNotification(filename, parsed.title);

  } catch (error) {
    Logger.log(`\nERROR: ${error.message}`);
    Logger.log(error.stack);
    sendBlogErrorNotification(error);
  }
}

// ============================================================================
// DATA VALIDATION (4 Safeguards)
// ============================================================================

/**
 * Validates that crime data is ready for blog generation
 * Uses fetchCrimeData() + filterCrimesByDateRange() from socialMediaStats.gs
 * (same CSV-based approach the stats generation uses — avoids sheet timezone issues)
 * Returns { passed: boolean, reason: string, details: object }
 */
function validateBlogDataReadiness() {
  // Use the SAME CSV-based approach as stats generation
  // This avoids timezone mismatches between sheet Date objects (GMT) and script timezone
  const crimes = fetchCrimeData();
  Logger.log(`Fetched ${crimes.length} total crimes from CSV`);

  // DEBUG: Show CSV column names and sample date values
  if (crimes.length > 0) {
    Logger.log(`CSV columns: ${Object.keys(crimes[0]).join(', ')}`);
    const sampleCrimes = crimes.slice(0, 3);
    sampleCrimes.forEach((c, i) => {
      const raw = c['Date'];
      const parsed = new Date(raw);
      const valid = !isNaN(parsed);
      Logger.log(`Sample ${i+1}: raw="${raw}" → parsed=${parsed} → valid=${valid}`);
    });
    // Show date range of ALL valid dates in CSV
    const allDates = crimes.map(c => new Date(c['Date'])).filter(d => !isNaN(d)).sort((a,b) => a-b);
    if (allDates.length > 0) {
      Logger.log(`CSV date range: ${allDates[0].toDateString()} to ${allDates[allDates.length-1].toDateString()} (${allDates.length} valid)`);
    } else {
      Logger.log('WARNING: No valid dates found in CSV!');
    }
  }

  // Calculate the same lagged window as generateBlogStatistics()
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() - SOCIAL_CONFIG.lagDays);
  weekEnd.setHours(12, 0, 0, 0); // Noon — matches filterCrimesByDateRange()
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(12, 0, 0, 0); // Noon

  Logger.log(`Validation window: ${weekStart.toDateString()} to ${weekEnd.toDateString()}`);

  // Use the SAME filter function that stats generation uses (normalizes dates to noon)
  const weekCrimes = filterCrimesByDateRange(crimes, weekStart, weekEnd);
  Logger.log(`Crimes in window: ${weekCrimes.length}`);

  // CHECK 1: Minimum data threshold
  if (weekCrimes.length < BLOG_CONFIG.minWeeklyCrimes) {
    return {
      passed: false,
      reason: `Insufficient data: Only ${weekCrimes.length} crimes in window ${weekStart.toDateString()} - ${weekEnd.toDateString()} (minimum: ${BLOG_CONFIG.minWeeklyCrimes})`,
      details: { crimeCount: weekCrimes.length, windowStart: weekStart.toDateString(), windowEnd: weekEnd.toDateString() }
    };
  }

  // CHECK 2: Data freshness — ensure the most recent days of the window have data
  const freshnessStart = new Date(weekEnd);
  freshnessStart.setDate(freshnessStart.getDate() - 2);
  freshnessStart.setHours(12, 0, 0, 0);

  const recentCrimes = filterCrimesByDateRange(crimes, freshnessStart, weekEnd);

  if (recentCrimes.length < BLOG_CONFIG.minDataFreshness) {
    return {
      passed: false,
      reason: `Data appears stale: Only ${recentCrimes.length} crimes in last 3 days of window (minimum: ${BLOG_CONFIG.minDataFreshness})`,
      details: { recentCount: recentCrimes.length }
    };
  }

  // CHECK 3: Processing backlog (this one still reads from sheet — only for Raw Articles status)
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rawArticlesSheet = ss.getSheetByName('Raw Articles');

    if (rawArticlesSheet) {
      const rawData = rawArticlesSheet.getDataRange().getValues();
      const rawHeaders = rawData[0];
      const statusCol = rawHeaders.indexOf('Status');

      if (statusCol !== -1) {
        const pendingCount = rawData.slice(1).filter(row =>
          row[statusCol] === 'pending' || row[statusCol] === 'ready'
        ).length;

        if (pendingCount > BLOG_CONFIG.maxPendingArticles) {
          return {
            passed: false,
            reason: `Processing backlog: ${pendingCount} articles pending (threshold: ${BLOG_CONFIG.maxPendingArticles})`,
            details: { pendingCount }
          };
        }
      }
    }
  } catch (e) {
    Logger.log(`Backlog check skipped (sheet access error): ${e.message}`);
  }

  // CHECK 4: Duplicate detection — fingerprint based on crime data
  const crimeFingerprint = weekCrimes
    .map(c => `${c['Date']}-${c['primaryCrimeType'] || c['crimeType'] || ''}-${c['Area'] || ''}`)
    .sort()
    .join('|');
  const currentFingerprint = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, crimeFingerprint)
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0'))
    .join('');

  const lastFingerprint = PropertiesService.getScriptProperties().getProperty('BLOG_LAST_FINGERPRINT');

  if (lastFingerprint && lastFingerprint === currentFingerprint) {
    return {
      passed: false,
      reason: 'Data appears identical to last week\'s report',
      details: { fingerprint: currentFingerprint }
    };
  }

  return {
    passed: true,
    reason: 'All checks passed',
    details: {
      crimeCount: weekCrimes.length,
      recentCrimes: recentCrimes.length,
      fingerprint: currentFingerprint
    }
  };
}

// ============================================================================
// STATISTICS GENERATION
// ============================================================================

/**
 * Generates crime statistics text for Claude
 * Reuses logic from blogDataGenerator.gs and socialMediaStats.gs
 * Returns { statsText, dateRange, totalCrimes, weekStart, weekEnd, fingerprint }
 */
function generateBlogStatistics() {
  // Fetch all crime data (from socialMediaStats.gs)
  const crimes = fetchCrimeData();

  // Calculate date ranges with 3-day lag (from socialMediaStats.gs)
  const now = new Date();
  const currentWeekEnd = new Date(now);
  currentWeekEnd.setDate(currentWeekEnd.getDate() - SOCIAL_CONFIG.lagDays);
  const currentWeekStart = new Date(currentWeekEnd);
  currentWeekStart.setDate(currentWeekStart.getDate() - 6);

  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
  const previousWeekStart = new Date(previousWeekEnd);
  previousWeekStart.setDate(previousWeekStart.getDate() - 6);

  // Filter crimes by date range (from socialMediaStats.gs)
  const currentWeekCrimes = filterCrimesByDateRange(crimes, currentWeekStart, currentWeekEnd);
  const previousWeekCrimes = filterCrimesByDateRange(crimes, previousWeekStart, previousWeekEnd);

  // Calculate stats (from socialMediaStats.gs)
  const stats = calculateStats(currentWeekCrimes, previousWeekCrimes);

  // Time of day analysis (from blogDataGenerator.gs)
  const timeAnalysis = analyzeTimeOfDay(currentWeekCrimes);

  // Area breakdown (from blogDataGenerator.gs)
  const areaBreakdown = getDetailedAreaBreakdown(currentWeekCrimes, 5);

  // Format data text (from blogDataGenerator.gs)
  const statsText = formatBlogData(
    currentWeekStart,
    currentWeekEnd,
    stats,
    timeAnalysis,
    areaBreakdown,
    currentWeekCrimes
  );

  // Generate fingerprint for duplicate detection (CSV-based, avoids sheet timezone issues)
  const crimeFingerprint = currentWeekCrimes
    .map(c => `${c['Date']}-${c['primaryCrimeType'] || c['crimeType'] || ''}-${c['Area'] || ''}`)
    .sort()
    .join('|');
  const fingerprint = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, crimeFingerprint)
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0'))
    .join('');

  return {
    statsText: statsText,
    dateRange: `${formatDateLong(currentWeekStart)} - ${formatDateLong(currentWeekEnd)}`,
    totalCrimes: currentWeekCrimes.length,
    weekStart: currentWeekStart,
    weekEnd: currentWeekEnd,
    fingerprint: fingerprint
  };
}

// ============================================================================
// CLAUDE BLOG GENERATION
// ============================================================================

/**
 * Sends crime statistics to Claude Haiku for blog post generation
 * Returns the raw markdown response from Claude
 */
function generateBlogWithClaude(statsText) {
  const apiKey = getClaudeApiKey();

  if (!apiKey) {
    throw new Error('Claude API key not configured. Run setClaudeApiKey() first.');
  }

  const systemPrompt = buildBlogSystemPrompt();
  const userPrompt = `Generate a weekly crime report blog post from this data:\n\n${statsText}`;

  const payload = {
    model: BLOG_CONFIG.blogModel,
    max_tokens: BLOG_CONFIG.blogMaxTokens,
    temperature: BLOG_CONFIG.blogTemperature,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [
      { role: 'user', content: userPrompt }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CLAUDE_API_ENDPOINT, options);
  const statusCode = response.getResponseCode();
  const responseData = JSON.parse(response.getContentText());

  if (statusCode !== 200 || responseData.error) {
    const errorMsg = responseData.error
      ? (responseData.error.message || JSON.stringify(responseData.error))
      : `HTTP ${statusCode}`;
    throw new Error(`Claude API error: ${errorMsg}`);
  }

  if (!responseData.content || responseData.content.length === 0) {
    throw new Error('Claude returned empty response');
  }

  // Log token usage
  if (responseData.usage) {
    const u = responseData.usage;
    const cacheHit = u.cache_read_input_tokens || 0;
    Logger.log(`Tokens — Input: ${u.input_tokens} (cached: ${cacheHit}), Output: ${u.output_tokens}`);
  }

  return responseData.content[0].text;
}

/**
 * System prompt for blog generation (static — cached by Claude)
 * Adapted from BLOG-GENERATION-PROMPT.md (previously used with Gemini)
 */
function buildBlogSystemPrompt() {
  return `You are a professional crime analyst writing weekly crime report blog posts for Crime Hotspots Caribbean (crimehotspots.com).

TONE & STYLE:
- Professional and objective (journalism style)
- Data-driven with clear insights
- Avoid sensationalism or fear-mongering
- Focus on trends, patterns, and safety recommendations
- Use clear, accessible language (avoid jargon)

OUTPUT FORMAT:
Your response must start with a TITLE line, then the markdown content.

**TITLE:** Trinidad Crime Report: Week of [Month Day, Year] - [X] Incidents, [Y] Murders, [Z] [Next Highest Crime Type]

Title rules:
- Include total incidents
- Include murder count (always)
- Include the next highest crime type
- Keep to 2-3 key statistics maximum
- Use full date format (Month Day, Year)

Then output the blog content using this exact markdown structure:

## Executive Summary
- 2-3 sentence overview of the week's data
- Highlight most significant trend
- Brief mention of top hotspot area

## Key Statistics
Bulleted list with arrows:
- **Total Incidents:** [number]
- **Murder:** [number] incidents (up/down X% from last week)
- [Other major crime types with changes]

## Regional Breakdown
Subsections for top 3-5 areas:
### [Area Name]
- Brief description of incident count and trends
- Mention dominant crime type

## Crime Type Analysis
Subsections for top 2-3 crime types:
### [Crime Type Name]
- Analyze the change
- Provide context

### Time of Day Patterns (if time data available)
- Present time period breakdown
- Identify peak crime hours

## Trends and Insights
Numbered list (3-4 insights):
1. **[Trend Title]:** Explanation
2. **[Pattern]:** What the data reveals

## Safety Recommendations
Bulleted actionable advice for residents based on the data.

## Methodology Note
Use this exact text:
"All data is sourced from verified media reports that may have been published by Trinidad Express, Guardian TT, Newsday, and CNC3 and reputable local Facebook Pages like Crime Watch between [dates]. Each incident has been cross-referenced with original source articles."

---
*Crime Hotspots provides data-driven insights to enhance public safety awareness. View our interactive dashboard for real-time statistics and detailed geographic analysis.*

RULES:
1. ALWAYS start with "**TITLE:** [title]" on the first line
2. Use ONLY the data provided — do not invent statistics
3. If a data category is missing, skip that section
4. Keep percentages to whole numbers
5. Use up/down arrows for changes
6. Write in present/past tense (not future predictions)
7. Keep each section concise (3-5 sentences max)
8. Total length: 600-800 words
9. Use markdown formatting (##, ###, **, -, etc.)
10. Do NOT include YAML frontmatter — only the title line and content`;
}

// ============================================================================
// RESPONSE PARSING & MARKDOWN BUILDING
// ============================================================================

/**
 * Parses Claude's blog response into title + content
 * Returns { title, content, excerpt }
 */
function parseClaudeBlogResponse(response) {
  const lines = response.trim().split('\n');

  // Extract title from first line (format: "**TITLE:** Trinidad Crime Report: ...")
  let title = '';
  let contentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('**TITLE:**') || line.startsWith('TITLE:')) {
      title = line
        .replace(/^\*\*TITLE:\*\*\s*/, '')
        .replace(/^TITLE:\s*/, '')
        .trim();
      contentStartIndex = i + 1;
      break;
    }
  }

  // If no title found, generate a fallback
  if (!title) {
    const now = new Date();
    title = `Trinidad Crime Report: Week of ${formatDateLong(now)}`;
    contentStartIndex = 0;
  }

  // Get content (everything after title line, skip blank lines)
  const content = lines.slice(contentStartIndex).join('\n').trim();

  // Extract excerpt from Executive Summary (first 1-2 sentences after ## Executive Summary)
  let excerpt = '';
  const execMatch = content.match(/## Executive Summary\s*\n\s*(.+?)(?:\n\n|\n##)/s);
  if (execMatch) {
    // Take first 2 sentences
    const sentences = execMatch[1].trim().split(/\. /);
    excerpt = sentences.slice(0, 2).join('. ');
    if (!excerpt.endsWith('.')) excerpt += '.';
    // Trim to ~200 chars max
    if (excerpt.length > 200) {
      excerpt = excerpt.substring(0, 197) + '...';
    }
  } else {
    excerpt = `Weekly crime analysis for Trinidad & Tobago.`;
  }

  return { title, content, excerpt };
}

/**
 * Builds the final Astro-compatible markdown file with frontmatter
 */
function buildFinalBlogMarkdown(parsed, blogData) {
  const dateStr = formatBlogDateStr(blogData.weekEnd);

  // Escape single quotes in title and excerpt for YAML
  const safeTitle = parsed.title.replace(/'/g, "''");
  const safeExcerpt = parsed.excerpt.replace(/'/g, "''");

  return `---
title: '${safeTitle}'
country: 'tt'
countryName: 'Trinidad & Tobago'
date: ${dateStr}
excerpt: '${safeExcerpt}'
author: 'Crime Hotspots Analytics'
readTime: '4 min read'
image: '/assets/images/report-hero.svg'
tags: ['Trinidad', 'Weekly Report', 'Statistics']
---

${parsed.content}
`;
}

// ============================================================================
// GITHUB INTEGRATION
// ============================================================================

/**
 * Commits the blog post markdown file to GitHub
 * Triggers Cloudflare Pages auto-deployment
 */
function commitBlogToGitHub(filename, markdownContent) {
  const token = BLOG_CONFIG.githubToken;
  const repo = BLOG_CONFIG.githubRepo;
  const branch = BLOG_CONFIG.githubBranch;

  if (!token) throw new Error('GITHUB_TOKEN not set. Run setupBlogProperties() first.');
  if (!repo) throw new Error('GITHUB_REPO not set. Run setupBlogProperties() first.');

  const filePath = `${BLOG_CONFIG.blogPath}/${filename}`;
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  const payload = {
    message: `Add weekly blog: ${filename}\n\nAuto-generated by Crime Hotspots Blog Automation\nCo-Authored-By: Claude <noreply@anthropic.com>`,
    content: Utilities.base64Encode(markdownContent, Utilities.Charset.UTF_8),
    branch: branch
  };

  const options = {
    method: 'put',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Crime-Hotspots-Blog-Automation'
    },
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode === 201) {
    Logger.log(`Committed: ${filePath}`);
  } else if (statusCode === 422) {
    Logger.log(`File already exists: ${filePath}`);
    throw new Error(`Blog post already exists: ${filename}. Delete it first or check for duplicates.`);
  } else {
    const responseText = response.getContentText();
    throw new Error(`GitHub API error ${statusCode}: ${responseText.substring(0, 300)}`);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format date as YYYY-MM-DD for filenames and frontmatter
 */
function formatBlogDateStr(date) {
  return Utilities.formatDate(date, SOCIAL_CONFIG.timezone || 'America/Port_of_Spain', 'yyyy-MM-dd');
}

/**
 * Generate MD5 fingerprint of week's data for duplicate detection
 */
function generateBlogDataFingerprint(weekData, dateCol) {
  const sorted = weekData
    .map(row => `${row[dateCol]}-${row[1]}-${row[2]}`)
    .sort()
    .join('|');

  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, sorted)
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Store fingerprint for next week's duplicate detection
 */
function storeBlogFingerprint(fingerprint) {
  PropertiesService.getScriptProperties().setProperty('BLOG_LAST_FINGERPRINT', fingerprint);
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Email notification when blog is skipped
 */
function sendBlogSkipNotification(validation) {
  const email = PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL')
    || 'discover360news@gmail.com';

  MailApp.sendEmail(email,
    'Weekly Blog Skipped - Crime Hotspots',
    `The weekly blog post was skipped.\n\nReason: ${validation.reason}\n\nDetails:\n${JSON.stringify(validation.details, null, 2)}\n\nNext attempt: Next Monday at 10 AM\n\n---\nCrime Hotspots Blog Automation`
  );
  Logger.log(`Skip notification sent to ${email}`);
}

/**
 * Email notification on success
 */
function sendBlogSuccessNotification(filename, title) {
  const email = PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL')
    || 'discover360news@gmail.com';

  MailApp.sendEmail(email,
    'Weekly Blog Published - Crime Hotspots',
    `New blog post published!\n\nTitle: ${title}\nFile: ${filename}\n\nIt will be live on crimehotspots.com/blog after the next build (usually within minutes).\n\n---\nCrime Hotspots Blog Automation`
  );
  Logger.log(`Success notification sent to ${email}`);
}

/**
 * Email notification on error
 */
function sendBlogErrorNotification(error) {
  const email = PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL')
    || 'discover360news@gmail.com';

  MailApp.sendEmail(email,
    'Weekly Blog ERROR - Crime Hotspots',
    `An error occurred generating the weekly blog.\n\nError: ${error.message}\n\nStack:\n${error.stack || 'N/A'}\n\nPlease investigate.\n\n---\nCrime Hotspots Blog Automation`
  );
  Logger.log(`Error notification sent to ${email}`);
}

// ============================================================================
// SETUP & TESTING
// ============================================================================

/**
 * ONE-TIME SETUP: Set required Script Properties
 * Run this function, then fill in values in the Script Properties UI
 *
 * Or run setBlogGitHubToken() and setBlogGitHubRepo() individually
 */
function setupBlogProperties() {
  const props = PropertiesService.getScriptProperties();

  // Check what's already set
  const claudeKey = props.getProperty('CLAUDE_API_KEY');
  const githubToken = props.getProperty('GITHUB_TOKEN');
  const githubRepo = props.getProperty('GITHUB_REPO');

  Logger.log('=== Blog Automation Property Status ===');
  Logger.log(`CLAUDE_API_KEY: ${claudeKey ? 'SET' : 'MISSING - run setClaudeApiKey()'}`);
  Logger.log(`GITHUB_TOKEN:   ${githubToken ? 'SET' : 'MISSING - run setBlogGitHubToken()'}`);
  Logger.log(`GITHUB_REPO:    ${githubRepo || 'MISSING - run setBlogGitHubRepo()'}`);
  Logger.log('');

  if (!claudeKey) Logger.log('>>> Run setClaudeApiKey() with your Anthropic API key');
  if (!githubToken) Logger.log('>>> Run setBlogGitHubToken() with your GitHub PAT');
  if (!githubRepo) Logger.log('>>> Run setBlogGitHubRepo() with your repo (e.g., "username/Crime-Hotspots")');

  if (claudeKey && githubToken && githubRepo) {
    Logger.log('All properties are set! Run testBlogGeneration() to test.');
  }
}

/**
 * Set GitHub Personal Access Token
 * Create at: https://github.com/settings/tokens
 * Required scope: repo (Full control of private repositories)
 */
function setBlogGitHubToken() {
  const token = 'YOUR_GITHUB_TOKEN_HERE'; // REPLACE before running

  if (token === 'YOUR_GITHUB_TOKEN_HERE') {
    Logger.log('ERROR: Replace YOUR_GITHUB_TOKEN_HERE with your actual GitHub token');
    return;
  }

  PropertiesService.getScriptProperties().setProperty('GITHUB_TOKEN', token);
  Logger.log('GitHub token saved to Script Properties');
}

/**
 * Set GitHub repository (format: "username/repo-name")
 */
function setBlogGitHubRepo() {
  const repo = 'YOUR_USERNAME/Crime-Hotspots'; // REPLACE before running

  if (repo.startsWith('YOUR_USERNAME')) {
    Logger.log('ERROR: Replace YOUR_USERNAME with your actual GitHub username');
    return;
  }

  PropertiesService.getScriptProperties().setProperty('GITHUB_REPO', repo);
  Logger.log(`GitHub repo set to: ${repo}`);
}

/**
 * ONE-TIME SETUP: Create weekly trigger (Monday 10 AM Trinidad time)
 */
function setupWeeklyBlogTrigger() {
  // Delete any existing blog triggers first
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateWeeklyBlog') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger: Monday at 10 AM
  ScriptApp.newTrigger('generateWeeklyBlog')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(10)
    .create();

  Logger.log('Weekly blog trigger created: Every Monday at 10 AM');
}

/**
 * TEST: Generate blog data and Claude response WITHOUT committing to GitHub
 * Use this to verify everything works before going live
 */
function testBlogGeneration() {
  Logger.log('='.repeat(60));
  Logger.log('TEST MODE - Blog Generation (no GitHub commit)');
  Logger.log('='.repeat(60));

  // Check properties
  setupBlogProperties();

  try {
    // Test validation
    Logger.log('\n--- Testing validation ---');
    const validation = validateBlogDataReadiness();
    Logger.log(`Validation passed: ${validation.passed}`);
    Logger.log(`Reason: ${validation.reason}`);

    if (!validation.passed) {
      Logger.log('\nValidation failed — blog would be skipped this week.');
      Logger.log('To test Claude generation anyway, run testClaudeBlogOnly()');
      return;
    }

    // Test stats generation
    Logger.log('\n--- Testing stats generation ---');
    const blogData = generateBlogStatistics();
    Logger.log(`Date range: ${blogData.dateRange}`);
    Logger.log(`Total crimes: ${blogData.totalCrimes}`);
    Logger.log('\nStats text (first 500 chars):');
    Logger.log(blogData.statsText.substring(0, 500));

    // Test Claude generation
    Logger.log('\n--- Testing Claude blog generation ---');
    const claudeResponse = generateBlogWithClaude(blogData.statsText);

    // Parse and display
    const parsed = parseClaudeBlogResponse(claudeResponse);
    const finalMarkdown = buildFinalBlogMarkdown(parsed, blogData);

    Logger.log('\n--- GENERATED BLOG POST ---');
    Logger.log(`Title: ${parsed.title}`);
    Logger.log(`Excerpt: ${parsed.excerpt}`);
    Logger.log(`Filename: trinidad-weekly-${formatBlogDateStr(blogData.weekEnd)}.md`);
    Logger.log('\n--- FULL MARKDOWN ---');
    Logger.log(finalMarkdown);
    Logger.log('\n--- END ---');
    Logger.log('\nTest passed! Run generateWeeklyBlog() to publish for real.');

  } catch (error) {
    Logger.log(`\nTEST FAILED: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * TEST: Call Claude only (bypasses validation and stats — uses sample data)
 * Useful to verify Claude API is working
 */
function testClaudeBlogOnly() {
  Logger.log('Testing Claude blog generation with sample data...');

  const sampleStats = `
BLOG POST DATA
==============

**Report Period:** January 27, 2026 - February 2, 2026

**OVERALL STATISTICS**

Incidents:
- Total Incidents This Week: 42
- Total Incidents Last Week: 38
- Change: +4 (+11% increase)

Victims:
- Total Victims This Week: 51

**CRIME TYPE BREAKDOWN (Top 6)**

1. Murder:
   - This Week: 6 incidents (9 victims)
   - Last Week: 4 incidents
   - Change: +2 (+50%)
2. Robbery:
   - This Week: 10 incidents
   - Last Week: 12 incidents
   - Change: -2 (-17%)
3. Shooting:
   - This Week: 8 incidents (11 victims)
   - Last Week: 5 incidents
   - Change: +3 (+60%)
4. Home Invasion:
   - This Week: 7 incidents
   - Last Week: 6 incidents
   - Change: +1 (+17%)
5. Theft:
   - This Week: 6 incidents
   - Last Week: 7 incidents
   - Change: -1 (-14%)
6. Assault:
   - This Week: 5 incidents
   - Last Week: 4 incidents
   - Change: +1 (+25%)

**GEOGRAPHIC BREAKDOWN (Top 5 Areas)**
1. Port of Spain:
   - Total Incidents: 8
   - Total Victims: 12
   - Most Common Crime: Robbery (3 incidents)
2. San Fernando:
   - Total Incidents: 5
   - Total Victims: 6
   - Most Common Crime: Shooting (2 incidents)
3. Arima:
   - Total Incidents: 4
   - Total Victims: 4
   - Most Common Crime: Home Invasion (2 incidents)
4. Chaguanas:
   - Total Incidents: 3
   - Total Victims: 4
   - Most Common Crime: Robbery (2 incidents)
5. Laventille:
   - Total Incidents: 3
   - Total Victims: 5
   - Most Common Crime: Murder (2 incidents)

---
END OF DATA
`;

  try {
    const claudeResponse = generateBlogWithClaude(sampleStats);
    const parsed = parseClaudeBlogResponse(claudeResponse);

    Logger.log('\n--- CLAUDE OUTPUT ---');
    Logger.log(`Title: ${parsed.title}`);
    Logger.log(`Excerpt: ${parsed.excerpt}`);
    Logger.log('\n--- CONTENT ---');
    Logger.log(parsed.content);
    Logger.log('\nClaude integration working!');

  } catch (error) {
    Logger.log(`ERROR: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * MANUAL OVERRIDE: Force generate and publish (bypasses all validation)
 * Use only when you know data is good but validation is failing
 */
function forceGenerateWeeklyBlog() {
  Logger.log('MANUAL OVERRIDE: Bypassing all validation...');

  try {
    const blogData = generateBlogStatistics();
    const claudeResponse = generateBlogWithClaude(blogData.statsText);
    const parsed = parseClaudeBlogResponse(claudeResponse);
    const finalMarkdown = buildFinalBlogMarkdown(parsed, blogData);
    const dateStr = formatBlogDateStr(blogData.weekEnd);
    const filename = `trinidad-weekly-${dateStr}.md`;

    commitBlogToGitHub(filename, finalMarkdown);
    storeBlogFingerprint(blogData.fingerprint);

    Logger.log(`Blog published (forced): ${filename}`);
    sendBlogSuccessNotification(filename, parsed.title);

  } catch (error) {
    Logger.log(`ERROR: ${error.message}`);
    sendBlogErrorNotification(error);
  }
}
