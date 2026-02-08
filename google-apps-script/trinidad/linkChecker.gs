/**
 * linkChecker.gs
 *
 * Checks all news article source URLs in Trinidad crime CSVs for dead links.
 * Fetches from 2025 and 2026 CSVs, HEAD-requests each unique URL, and emails
 * a summary of broken links bi-weekly (1st and 15th of each month).
 *
 * Dependencies:
 *   - config.gs (NOTIFICATION_EMAIL)
 *   - socialMediaStats.gs (parseCSV, parseCSVLine)
 *
 * Script Properties required:
 *   - TRINIDAD_CSV_URL (2026/current — already set by blog automation)
 *   - TRINIDAD_CSV_URL_2025 (run setLinkChecker2025CsvUrl() once to configure)
 *
 * Key functions:
 *   - runLinkChecker()           — Main entry (bi-weekly trigger calls this)
 *   - continueLinkCheck_()       — Auto-resume (called by chained triggers, not manually)
 *   - testLinkChecker()          — Dry run: checks first 20 URLs, logs results
 *   - setupLinkCheckerTrigger()  — Creates 1st/15th monthly triggers
 *   - checkLinkCheckerSetup()    — Verifies Script Properties are configured
 *   - setLinkChecker2025CsvUrl() — One-time setup for 2025 CSV URL
 *
 * Trigger chaining:
 *   If a run hits the 5-minute GAS limit, it saves progress to CacheService
 *   and schedules a one-time trigger (continueLinkCheck_) to resume in 2 min.
 *   This repeats until all URLs are checked, then one email is sent.
 *
 * Created: February 7, 2026
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const LINK_CHECK_CONFIG = {
  batchSize: 50,                // URLs per fetchAll batch (parallel)
  requestTimeoutMs: 10000,      // 10s per request
  maxExecutionMs: 300000,       // 5 min (1 min buffer from GAS 6 min limit)
  skipDomains: [
    'facebook.com', 'fb.com', 'fb.watch', 'm.facebook.com', 'web.facebook.com',
    'instagram.com',
    'twitter.com', 'x.com', 'mobile.twitter.com',
    'tiktok.com',
    'youtube.com', 'youtu.be',
    'wa.me', 'whatsapp.com'
  ],
  userAgent: 'Mozilla/5.0 (compatible; CrimeHotspots LinkChecker/1.0)'
};

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Main entry point — called by bi-weekly trigger or manually.
 * Always starts a fresh check (clears any leftover state from previous runs).
 */
function runLinkChecker() {
  clearLinkCheckState_();
  runLinkCheckCycle_();
}

/**
 * Continuation entry — called by one-time triggers to resume an interrupted check.
 * Picks up where the previous run left off using cached state.
 */
function continueLinkCheck_() {
  runLinkCheckCycle_();
}

/**
 * Core check cycle. Handles both fresh runs and continuations.
 *
 * Flow:
 *   1. Fetch all URLs from CSVs (cheap: 2 HTTP calls)
 *   2. Sort URLs alphabetically for deterministic order across runs
 *   3. Resume from saved startIndex (0 for fresh runs)
 *   4. Check in parallel batches until done or time limit
 *   5. If time limit: save state, schedule continuation in 2 min
 *   6. If complete: send email, clean up
 *
 * @private
 */
function runLinkCheckCycle_() {
  var startTime = Date.now();
  var state = getLinkCheckState_();
  var isResume = state !== null;

  Logger.log('=== Link Checker ' + (isResume ? 'RESUMING from index ' + state.startIndex : 'Started') + ' ===');

  try {
    // 1. Fetch all unique source URLs (re-fetched each run for fresh metadata)
    var urlMap = getAllSourceUrls_();
    var urls = Object.keys(urlMap).sort(); // Alphabetical for deterministic order
    var totalUrls = urls.length;
    Logger.log('Found ' + totalUrls + ' unique news article URLs');

    if (totalUrls === 0) {
      Logger.log('No URLs to check. Exiting.');
      clearLinkCheckState_();
      return;
    }

    // 2. Restore or initialize state
    var startIndex = isResume ? state.startIndex : 0;
    var deadLinks = isResume ? state.deadLinks : [];
    var checkedCount = isResume ? state.checkedCount : 0;

    if (isResume) {
      Logger.log('Restored state: ' + checkedCount + ' already checked, ' + deadLinks.length + ' dead so far');
    }

    // 3. Check URLs in batches from startIndex
    for (var i = startIndex; i < totalUrls; i += LINK_CHECK_CONFIG.batchSize) {
      // Guard against GAS execution time limit
      if (Date.now() - startTime > LINK_CHECK_CONFIG.maxExecutionMs) {
        // Save progress and schedule continuation
        var newState = {
          startIndex: i,
          deadLinks: deadLinks,
          checkedCount: checkedCount,
          totalUrls: totalUrls
        };
        saveLinkCheckState_(newState);
        scheduleContinuation_();
        Logger.log('Time limit at ' + checkedCount + '/' + totalUrls + '. Continuation scheduled.');
        return;
      }

      var batch = urls.slice(i, i + LINK_CHECK_CONFIG.batchSize);
      var results = checkUrlBatch_(batch);

      results.forEach(function(result) {
        if (!result.ok) {
          deadLinks.push({
            url: result.url,
            status: result.status,
            error: result.error,
            crimeCount: urlMap[result.url].count,
            years: urlMap[result.url].years,
            source: urlMap[result.url].source
          });
        }
      });

      checkedCount += batch.length;
      Logger.log('Checked ' + checkedCount + '/' + totalUrls + ' URLs, ' + deadLinks.length + ' dead so far');

      // Small delay between batches to avoid rate limiting
      if (i + LINK_CHECK_CONFIG.batchSize < totalUrls) {
        Utilities.sleep(1000);
      }
    }

    // 4. All URLs checked — send report and clean up
    Logger.log('=== Check complete: ' + checkedCount + ' checked, ' + deadLinks.length + ' dead ===');
    clearLinkCheckState_();
    cleanupContinuationTriggers_();

    if (deadLinks.length > 0) {
      sendLinkCheckReport_(deadLinks, checkedCount, totalUrls);
    } else {
      Logger.log('No dead links found. No email sent.');
    }

  } catch (error) {
    Logger.log('FATAL ERROR: ' + error.message);
    Logger.log(error.stack);
    clearLinkCheckState_();
    cleanupContinuationTriggers_();
    sendLinkCheckErrorEmail_(error);
  }
}

// ============================================================================
// STATE MANAGEMENT (CacheService — 6-hour TTL)
// ============================================================================

var LINK_CHECK_CACHE_KEY = 'LINK_CHECK_STATE';

/**
 * Retrieves saved check state from cache, or null if none exists.
 * @private
 */
function getLinkCheckState_() {
  var cached = CacheService.getScriptCache().get(LINK_CHECK_CACHE_KEY);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch (e) {
    Logger.log('WARNING: Corrupt cache state. Starting fresh.');
    return null;
  }
}

/**
 * Saves check state to cache with 6-hour TTL.
 * @private
 */
function saveLinkCheckState_(state) {
  var json = JSON.stringify(state);
  // CacheService max value: 100KB. Dead links array should be well under this.
  CacheService.getScriptCache().put(LINK_CHECK_CACHE_KEY, json, 21600); // 6 hours
  Logger.log('State saved: index=' + state.startIndex + ', dead=' + state.deadLinks.length);
}

/**
 * Clears saved check state from cache.
 * @private
 */
function clearLinkCheckState_() {
  CacheService.getScriptCache().remove(LINK_CHECK_CACHE_KEY);
}

/**
 * Creates a one-time trigger to continue the check in 2 minutes.
 * @private
 */
function scheduleContinuation_() {
  ScriptApp.newTrigger('continueLinkCheck_')
    .timeBased()
    .after(2 * 60 * 1000) // 2 minutes
    .create();
  Logger.log('Continuation trigger scheduled for 2 minutes from now');
}

/**
 * Removes all one-time continuation triggers (does NOT touch bi-weekly triggers).
 * @private
 */
function cleanupContinuationTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'continueLinkCheck_') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetches crime data from all CSVs and builds a map of unique news article URLs.
 * Reuses parseCSV() from socialMediaStats.gs (shared GAS namespace).
 *
 * @returns {Object} { [url]: { count: number, years: string[], source: string } }
 * @private
 */
function getAllSourceUrls_() {
  var props = PropertiesService.getScriptProperties();
  var csvSources = {
    '2026': props.getProperty('TRINIDAD_CSV_URL'),
    '2025': props.getProperty('TRINIDAD_CSV_URL_2025')
  };

  var urlMap = {};

  for (var year in csvSources) {
    var csvUrl = csvSources[year];
    if (!csvUrl) {
      Logger.log('WARNING: CSV URL for ' + year + ' not set in Script Properties. Skipping.');
      continue;
    }

    Logger.log('Fetching ' + year + ' CSV...');
    var response = UrlFetchApp.fetch(csvUrl);
    var crimes = parseCSV(response.getContentText());
    Logger.log(year + ': ' + crimes.length + ' crime records');

    for (var i = 0; i < crimes.length; i++) {
      var crime = crimes[i];
      var url = (crime['URL'] || '').trim();

      // Skip empty, invalid, or social media URLs
      if (!url || !isValidHttpUrl_(url)) continue;
      if (isSocialMediaUrl_(url)) continue;

      if (!urlMap[url]) {
        urlMap[url] = { count: 0, years: [], source: crime['Source'] || 'Unknown' };
      }
      urlMap[url].count++;
      if (urlMap[url].years.indexOf(year) === -1) {
        urlMap[url].years.push(year);
      }
    }
  }

  return urlMap;
}

// ============================================================================
// URL FILTERING
// ============================================================================

/**
 * Checks if a URL belongs to a social media platform (these are skipped).
 * @private
 */
function isSocialMediaUrl_(url) {
  try {
    var hostname = url.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    for (var i = 0; i < LINK_CHECK_CONFIG.skipDomains.length; i++) {
      var domain = LINK_CHECK_CONFIG.skipDomains[i];
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Basic HTTP URL validation.
 * @private
 */
function isValidHttpUrl_(url) {
  return url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
}

// ============================================================================
// URL CHECKING
// ============================================================================

/**
 * Checks a batch of URLs using UrlFetchApp.fetchAll() for parallel requests.
 * Tries HEAD first; retries with GET for servers that reject HEAD (405/501).
 *
 * @param {string[]} urls - Array of URLs to check
 * @returns {Object[]} Array of { url, ok, status, error }
 * @private
 */
function checkUrlBatch_(urls) {
  var requests = urls.map(function(url) {
    return {
      url: url,
      method: 'head',
      muteHttpExceptions: true,
      followRedirects: true,
      validateHttpsCertificates: false,
      headers: { 'User-Agent': LINK_CHECK_CONFIG.userAgent }
    };
  });

  var responses;
  try {
    responses = UrlFetchApp.fetchAll(requests);
  } catch (e) {
    // If fetchAll fails entirely, check individually
    Logger.log('fetchAll failed: ' + e.message + '. Falling back to individual checks.');
    return urls.map(function(url) { return checkSingleUrl_(url); });
  }

  var results = [];
  var retryUrls = [];

  for (var i = 0; i < urls.length; i++) {
    try {
      var status = responses[i].getResponseCode();

      // HEAD not supported — queue for GET retry
      if (status === 405 || status === 501) {
        retryUrls.push({ index: results.length, url: urls[i] });
        results.push(null); // placeholder
      } else {
        results.push({
          url: urls[i],
          ok: status >= 200 && status < 400,
          status: status,
          error: status >= 400 ? 'HTTP ' + status : null
        });
      }
    } catch (e) {
      results.push({
        url: urls[i],
        ok: false,
        status: 0,
        error: e.message || 'Request failed'
      });
    }
  }

  // Retry HEAD-rejected URLs with GET
  if (retryUrls.length > 0) {
    var retryRequests = retryUrls.map(function(item) {
      return {
        url: item.url,
        method: 'get',
        muteHttpExceptions: true,
        followRedirects: true,
        validateHttpsCertificates: false,
        headers: { 'User-Agent': LINK_CHECK_CONFIG.userAgent }
      };
    });

    try {
      var retryResponses = UrlFetchApp.fetchAll(retryRequests);
      for (var j = 0; j < retryUrls.length; j++) {
        var retryStatus = retryResponses[j].getResponseCode();
        results[retryUrls[j].index] = {
          url: retryUrls[j].url,
          ok: retryStatus >= 200 && retryStatus < 400,
          status: retryStatus,
          error: retryStatus >= 400 ? 'HTTP ' + retryStatus : null
        };
      }
    } catch (e) {
      // Fall back to individual checks for retry batch
      for (var k = 0; k < retryUrls.length; k++) {
        results[retryUrls[k].index] = checkSingleUrl_(retryUrls[k].url);
      }
    }
  }

  // Safety: ensure no null placeholders remain from failed retries
  for (var m = 0; m < results.length; m++) {
    if (results[m] === null) {
      results[m] = { url: urls[m], ok: false, status: 0, error: 'Retry failed unexpectedly' };
    }
  }

  return results;
}

/**
 * Checks a single URL with GET (fallback for fetchAll failures).
 * @private
 */
function checkSingleUrl_(url) {
  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      followRedirects: true,
      validateHttpsCertificates: false,
      headers: { 'User-Agent': LINK_CHECK_CONFIG.userAgent }
    });
    var status = response.getResponseCode();
    return {
      url: url,
      ok: status >= 200 && status < 400,
      status: status,
      error: status >= 400 ? 'HTTP ' + status : null
    };
  } catch (e) {
    return {
      url: url,
      ok: false,
      status: 0,
      error: e.message || 'Connection failed'
    };
  }
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Sends email report of dead links, sorted by crime count (most impactful first).
 * @private
 */
function sendLinkCheckReport_(deadLinks, checkedCount, totalCount) {
  var email = PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL')
    || 'discover360news@gmail.com';

  // Sort by crime count descending (most impactful dead links first)
  deadLinks.sort(function(a, b) { return b.crimeCount - a.crimeCount; });

  var totalAffected = deadLinks.reduce(function(sum, d) { return sum + d.crimeCount; }, 0);
  var dateStr = new Date().toLocaleDateString('en-TT', { timeZone: 'America/Port_of_Spain' });

  var partial = checkedCount < totalCount;
  var subject = 'Link Checker: ' + deadLinks.length + ' Dead Links Found'
    + (partial ? ' (PARTIAL CHECK)' : '') + ' - Crime Hotspots';

  var body = 'Crime Hotspots Link Checker Report\n';
  body += '=============================================\n\n';
  body += 'Date: ' + dateStr + '\n';
  body += 'URLs Checked: ' + checkedCount + ' of ' + totalCount + '\n';
  body += 'Dead Links: ' + deadLinks.length + '\n';
  body += 'Total Crime Records Affected: ' + totalAffected + '\n';

  if (checkedCount < totalCount) {
    body += '\nNOTE: Time limit reached. ' + (totalCount - checkedCount) + ' URLs were not checked this run.\n';
  }

  body += '\n---------------------------------------------\n\n';

  deadLinks.forEach(function(link, index) {
    body += (index + 1) + '. ' + link.url + '\n';
    body += '   Status: ' + (link.status || 'N/A') + (link.error ? ' (' + link.error + ')' : '') + '\n';
    body += '   Source: ' + link.source + '\n';
    body += '   Crimes Affected: ' + link.crimeCount + ' (Years: ' + link.years.join(', ') + ')\n\n';
  });

  body += '---------------------------------------------\n';
  body += 'Crime Hotspots Link Checker - Automated Report\n';
  body += 'Social media URLs (Facebook, Instagram, X) were excluded.\n';

  MailApp.sendEmail(email, subject, body);
  Logger.log('Report sent to ' + email);
}

/**
 * Sends error notification if the checker itself fails.
 * @private
 */
function sendLinkCheckErrorEmail_(error) {
  var email = PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL')
    || 'discover360news@gmail.com';

  MailApp.sendEmail(
    email,
    'Link Checker ERROR - Crime Hotspots',
    'The link checker encountered an error:\n\n' +
    error.message + '\n\n' +
    (error.stack || '') +
    '\n\n---\nCrime Hotspots Link Checker'
  );
}

// ============================================================================
// SETUP & TRIGGERS
// ============================================================================

/**
 * Sets up bi-weekly triggers (1st and 15th of each month at 8 AM Trinidad time).
 * Run once to configure.
 */
function setupLinkCheckerTrigger() {
  // Delete existing link checker triggers
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'runLinkChecker') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 1st of month at 8 AM
  ScriptApp.newTrigger('runLinkChecker')
    .timeBased()
    .onMonthDay(1)
    .atHour(8)
    .create();

  // 15th of month at 8 AM
  ScriptApp.newTrigger('runLinkChecker')
    .timeBased()
    .onMonthDay(15)
    .atHour(8)
    .create();

  Logger.log('Link checker triggers created: 1st and 15th of each month at 8 AM');
}

/**
 * One-time setup: stores the 2025 CSV URL in Script Properties.
 * The 2026 URL is already stored as TRINIDAD_CSV_URL by the blog automation.
 * Run this once.
 */
function setLinkChecker2025CsvUrl() {
  var url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-ktijzh1ySAy3NpfrcPEEEEs90q-0F0V8UxZxCTlTTbk4Qsa1cbLhlPwh38ie2_bGJYQX8n5vy8v/pub?gid=1749261532&single=true&output=csv';
  PropertiesService.getScriptProperties().setProperty('TRINIDAD_CSV_URL_2025', url);
  Logger.log('TRINIDAD_CSV_URL_2025 set successfully');
}

/**
 * Verifies that all required Script Properties are configured.
 * Run to diagnose setup issues.
 */
function checkLinkCheckerSetup() {
  var props = PropertiesService.getScriptProperties();

  var csv2026 = props.getProperty('TRINIDAD_CSV_URL');
  var csv2025 = props.getProperty('TRINIDAD_CSV_URL_2025');
  var email = props.getProperty('NOTIFICATION_EMAIL');

  Logger.log('=== Link Checker Setup Check ===');
  Logger.log('TRINIDAD_CSV_URL (2026): ' + (csv2026 ? 'SET' : 'MISSING'));
  Logger.log('TRINIDAD_CSV_URL_2025:   ' + (csv2025 ? 'SET' : 'MISSING - run setLinkChecker2025CsvUrl()'));
  Logger.log('NOTIFICATION_EMAIL:      ' + (email || NOTIFICATION_EMAIL + ' (using config.gs default)'));

  // Check triggers
  var triggers = ScriptApp.getProjectTriggers().filter(function(t) {
    return t.getHandlerFunction() === 'runLinkChecker';
  });
  Logger.log('Active triggers:         ' + triggers.length + (triggers.length === 2 ? ' (correct)' : ' - run setupLinkCheckerTrigger()'));

  Logger.log('================================');
}

// ============================================================================
// TESTING
// ============================================================================

/**
 * Dry run: fetches URLs and checks the first 20.
 * Does NOT send email. Results logged to Apps Script Logger.
 */
function testLinkChecker() {
  Logger.log('=== TEST: Link Checker (dry run) ===');

  var urlMap = getAllSourceUrls_();
  var urls = Object.keys(urlMap);
  Logger.log('Found ' + urls.length + ' unique news article URLs');

  // Show domain breakdown
  var domainCounts = {};
  urls.forEach(function(url) {
    var domain = url.replace(/^https?:\/\//, '').split('/')[0];
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });
  var sortedDomains = Object.keys(domainCounts).sort(function(a, b) {
    return domainCounts[b] - domainCounts[a];
  });
  Logger.log('Top domains:');
  sortedDomains.slice(0, 10).forEach(function(d) {
    Logger.log('  ' + d + ': ' + domainCounts[d] + ' URLs');
  });

  // Check first 20 URLs
  var testBatch = urls.slice(0, 20);
  Logger.log('\nTesting first ' + testBatch.length + ' URLs...');

  var results = checkUrlBatch_(testBatch);
  var dead = results.filter(function(r) { return !r.ok; });

  Logger.log('\nResults: ' + results.length + ' checked, ' + dead.length + ' dead');
  dead.forEach(function(d) {
    Logger.log('  DEAD: ' + d.url);
    Logger.log('    Status: ' + d.status + ' ' + (d.error || ''));
    Logger.log('    Crimes affected: ' + urlMap[d.url].count);
  });

  Logger.log('\n=== TEST COMPLETE ===');
}

/**
 * Full check without email — logs all dead links to Logger.
 * Useful for reviewing results before enabling the trigger.
 */
function testLinkCheckerFull() {
  Logger.log('=== FULL TEST: Link Checker (no email) ===');

  var startTime = Date.now();
  var urlMap = getAllSourceUrls_();
  var urls = Object.keys(urlMap);
  Logger.log('Checking all ' + urls.length + ' URLs...');

  var deadLinks = [];
  var checkedCount = 0;

  for (var i = 0; i < urls.length; i += LINK_CHECK_CONFIG.batchSize) {
    if (Date.now() - startTime > LINK_CHECK_CONFIG.maxExecutionMs) {
      Logger.log('Time limit reached at ' + checkedCount + '/' + urls.length);
      break;
    }

    var batch = urls.slice(i, i + LINK_CHECK_CONFIG.batchSize);
    var results = checkUrlBatch_(batch);

    results.forEach(function(result) {
      if (!result.ok) {
        deadLinks.push({
          url: result.url,
          status: result.status,
          error: result.error,
          crimeCount: urlMap[result.url].count,
          source: urlMap[result.url].source
        });
      }
    });

    checkedCount += batch.length;
    Logger.log('Progress: ' + checkedCount + '/' + urls.length);

    if (i + LINK_CHECK_CONFIG.batchSize < urls.length) {
      Utilities.sleep(1000);
    }
  }

  Logger.log('\n=== RESULTS ===');
  Logger.log('Checked: ' + checkedCount);
  Logger.log('Dead: ' + deadLinks.length);

  deadLinks.sort(function(a, b) { return b.crimeCount - a.crimeCount; });
  deadLinks.forEach(function(link, idx) {
    Logger.log((idx + 1) + '. ' + link.url + ' [' + link.status + '] ' + link.source + ' (' + link.crimeCount + ' crimes)');
  });

  Logger.log('=== FULL TEST COMPLETE ===');
}
