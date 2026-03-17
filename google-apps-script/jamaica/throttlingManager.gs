/**
 * Safely extracts the hostname from a URL string in Google Apps Script.
 * @param {string} url - The URL string.
 * @returns {string} The hostname (e.g., "newsday.co.tt").
 */

function getHostnameFromUrl(url) {
  // Use a simple regex to capture the domain name
  const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/i);
  if (match && match.length > 1) {
    return match[1];
  }
  // Fallback for tricky URLs
  return "default"; 
}

/**
 * Safely extracts the protocol and origin from a URL string.
 */
function getOriginFromUrl(url) {
    const match = url.match(/^(https?:\/\/[^\/]+)/i);
    return match ? match[0] : null;
}

// ============================================================================
// REQUIRED GLOBAL CONFIGURATION
// ============================================================================
// NOTE: This config object is essential for all functions to work.
const THROTTLING_CONFIG = {
  // Configuration for Adaptive Delay
  REQUESTS_PER_MINUTE: {
    'default': 10, // Default limit: 1 request every 6 seconds
    'newsday.co.tt': 5, // Domain-specific override: 1 request every 12 seconds
    'trinidadexpress.com': 6,
    // Add other domain limits here
  },
  
  // Configuration for Resilient Fetch
  USER_AGENTS: {
    // Note: Google Apps Script runs under Google IP range, using Googlebot is often acceptable for non-commercial scraping.
    'default': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    // If a site blocks Googlebot, use a generic desktop user agent
    'trinidadexpress.com': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
  },
  
  // Retry Strategy
  RETRY_STRATEGY: {
    maxAttempts: 3,
    backoffFactor: 2,    // Exponential factor (2x delay each time)
    backoffBase: 1000,   // Base delay in ms (1 second)
    jitter: 500,         // Max random jitter in ms
    retryStatusCodes: [500, 502, 503, 504], // Server errors to retry
    noRetryStatusCodes: [400, 401, 403, 404] // Client errors not to retry
  },
  
  // Circuit Breaker
  CIRCUIT_BREAKER: {
    failureThreshold: 3, // How many consecutive failures before opening circuit
    resetTimeout: 300000, // 5 minutes in ms before moving to half-open state
  },
  
  // Robots.txt Compliance
  ROBOTS_TXT: {
    enabled: true,
    userAgent: '*', // The agent to check rules against
    cacheDuration: 3600 // Cache robots.txt for 1 hour (in seconds)
  }
};

// ============================================================================
// REQUEST TRACKER (in-memory cache)
// ============================================================================

// Track requests by domain and minute
const requestTracker = {};

/**
 * Initialize request tracker for a domain
 */
function initTracker(domain) {
  const now = Math.floor(Date.now() / 60000); // Current minute
  
  if (!requestTracker[domain]) {
    requestTracker[domain] = {
      currentMinute: now,
      count: 0,
      lastRequestTime: 0,
      failures: 0,
      circuitOpen: false,
      circuitOpenedAt: 0
    };
  }
  
  // Reset counter if minute changed
  if (requestTracker[domain].currentMinute !== now) {
    requestTracker[domain].currentMinute = now;
    requestTracker[domain].count = 0;
  }
  
  return requestTracker[domain];
}

// ============================================================================
// ADAPTIVE DELAY CALCULATION
// ============================================================================

/**
 * Calculate adaptive delay based on domain limits
 * @param {string} url - The URL being requested
 * @returns {number} Delay in milliseconds
 */
function calculateAdaptiveDelay(url) {
  try {
    const domain = getHostnameFromUrl(url);
    const tracker = initTracker(domain);
    
    // Get domain-specific limit or default
    const requestsPerMinute = THROTTLING_CONFIG.REQUESTS_PER_MINUTE[domain] || 
                              THROTTLING_CONFIG.REQUESTS_PER_MINUTE.default;
    
    // Calculate optimal spacing between requests
    const optimalSpacing = 60000 / requestsPerMinute; // ms between requests
    
    // If we've made requests this minute, enforce spacing
    if (tracker.count > 0) {
      const timeSinceLastRequest = Date.now() - tracker.lastRequestTime;
      const requiredWait = Math.max(0, optimalSpacing - timeSinceLastRequest);
      
      // Add jitter to avoid predictable patterns
      const jitter = Math.random() * 500;
      return requiredWait + jitter;
    }
    
    // First request this minute, minimal delay
    return 100 + Math.random() * 400; // 100-500ms
    
  } catch (error) {
    // If URL parsing fails, use conservative default
    Logger.log(`Error parsing URL '${url}': ${error.message}`);
    return 2000 + Math.random() * 1000; // 2-3 seconds
  }
}

// ============================================================================
// RESILIENT FETCH WITH RETRY LOGIC
// ============================================================================

/**
 * Resilient fetch with rate limiting and retry logic
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} attempt - Current attempt number (internal)
 * @returns {GoogleAppsScript.URL_Fetch.HTTPResponse} Response object
 */
function resilientFetch(url, options = {}, attempt = 1) {
  const domain = getHostnameFromUrl(url);
  const tracker = initTracker(domain);
  
  // Check circuit breaker
  if (tracker.circuitOpen) {
    const timeSinceOpen = Date.now() - tracker.circuitOpenedAt;
    if (timeSinceOpen < THROTTLING_CONFIG.CIRCUIT_BREAKER.resetTimeout) {
      throw new Error(`Circuit breaker open for ${domain}. Next reset in ${Math.ceil((THROTTLING_CONFIG.CIRCUIT_BREAKER.resetTimeout - timeSinceOpen)/1000)}s`);
    } else {
      // Circuit timeout expired, move to half-open
      tracker.circuitOpen = false;
      tracker.failures = 0;
      Logger.log(`Circuit breaker half-open for ${domain}, attempting request...`);
    }
  }
  
  // Apply adaptive delay
  const delay = calculateAdaptiveDelay(url);
  if (delay > 0) {
    // Utilities.sleep is used in Google Apps Script for delays
    Utilities.sleep(delay); 
  }
  
  // Update tracker
  tracker.count++;
  tracker.lastRequestTime = Date.now();
  
  // Set user agent and full headers
  const userAgent = THROTTLING_CONFIG.USER_AGENTS[domain] || 
                    THROTTLING_CONFIG.USER_AGENTS.default;
  
  const fetchOptions = {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'close',
      'Upgrade-Insecure-Requests': '1'
    },
    ...options
  };
  
  try {
    // Make the request using GAS UrlFetchApp
    const response = UrlFetchApp.fetch(url, fetchOptions);
    const statusCode = response.getResponseCode();
    
    // Check for rate limiting (429)
    if (statusCode === 429) {
      const retryAfterHeader = response.getHeaders()['Retry-After'];
      const retryAfter = (retryAfterHeader ? parseInt(retryAfterHeader) * 1000 : null) || 
                         Math.pow(THROTTLING_CONFIG.RETRY_STRATEGY.backoffFactor, attempt) * THROTTLING_CONFIG.RETRY_STRATEGY.backoffBase;
      
      Logger.log(`Rate limited by ${domain}. Retry after ${retryAfter}ms (attempt ${attempt}/${THROTTLING_CONFIG.RETRY_STRATEGY.maxAttempts})`);
      
      if (attempt < THROTTLING_CONFIG.RETRY_STRATEGY.maxAttempts) {
        // Exponential backoff with jitter
        const jitter = Math.random() * THROTTLING_CONFIG.RETRY_STRATEGY.jitter;
        Utilities.sleep(retryAfter + jitter);
        return resilientFetch(url, options, attempt + 1);
      } else {
        // Max attempts reached, trip circuit breaker
        tracker.failures++;
        if (tracker.failures >= THROTTLING_CONFIG.CIRCUIT_BREAKER.failureThreshold) {
          tracker.circuitOpen = true;
          tracker.circuitOpenedAt = Date.now();
          Logger.log(`⚠️ Circuit breaker opened for ${domain} after ${tracker.failures} consecutive failures due to 429`);
        }
        throw new Error(`Rate limited after ${attempt} attempts`);
      }
    }
    
    // Check for server errors (5xx)
    if (THROTTLING_CONFIG.RETRY_STRATEGY.retryStatusCodes.includes(statusCode)) {
      if (attempt < THROTTLING_CONFIG.RETRY_STRATEGY.maxAttempts) {
        const backoff = Math.pow(THROTTLING_CONFIG.RETRY_STRATEGY.backoffFactor, attempt) * THROTTLING_CONFIG.RETRY_STRATEGY.backoffBase;
        const jitter = Math.random() * THROTTLING_CONFIG.RETRY_STRATEGY.jitter;
        
        Logger.log(`Server error ${statusCode} from ${domain}. Retrying in ${backoff}ms (attempt ${attempt}/${THROTTLING_CONFIG.RETRY_STRATEGY.maxAttempts})`);
        Utilities.sleep(backoff + jitter);
        return resilientFetch(url, options, attempt + 1);
      }
    }
    
    // Check for client errors (4xx) - usually shouldn't retry
    if (THROTTLING_CONFIG.RETRY_STRATEGY.noRetryStatusCodes.includes(statusCode)) {
      tracker.failures++;
      throw new Error(`HTTP ${statusCode} - Client error, not retrying`);
    }
    
    // Success - reset failure counter
    if (statusCode >= 200 && statusCode < 300) {
      tracker.failures = 0;
      if (tracker.circuitOpen) {
        Logger.log(`✅ Circuit breaker reset for ${domain} after successful request`);
        tracker.circuitOpen = false;
      }
    }
    
    return response;
    
  } catch (error) {
    // Network errors or other exceptions
    Logger.log(`Fetch error for ${url}: ${error.message}`);
    
    if (attempt < THROTTLING_CONFIG.RETRY_STRATEGY.maxAttempts) {
      const backoff = Math.pow(THROTTLING_CONFIG.RETRY_STRATEGY.backoffFactor, attempt) * THROTTLING_CONFIG.RETRY_STRATEGY.backoffBase;
      const jitter = Math.random() * THROTTLING_CONFIG.RETRY_STRATEGY.jitter;
      
      Logger.log(`Network error. Retrying in ${backoff}ms (attempt ${attempt}/${THROTTLING_CONFIG.RETRY_STRATEGY.maxAttempts})`);
      Utilities.sleep(backoff + jitter);
      return resilientFetch(url, options, attempt + 1);
    } else {
      tracker.failures++;
      if (tracker.failures >= THROTTLING_CONFIG.CIRCUIT_BREAKER.failureThreshold) {
        tracker.circuitOpen = true;
        tracker.circuitOpenedAt = Date.now();
        Logger.log(`⚠️ Circuit breaker opened for ${domain} after ${tracker.failures} consecutive failures due to network error`);
      }
      throw error;
    }
  }
}

// ============================================================================
// ROBOTS.TXT COMPLIANCE
// ============================================================================

/**
 * Check robots.txt for a domain
 * @param {string} url - URL to check
 * @returns {boolean} True if allowed to fetch
 */

function checkRobotsTxt(url) {
  if (!THROTTLING_CONFIG.ROBOTS_TXT.enabled) {
    return true;
  }
  
  try {
    const domain = getOriginFromUrl(url)
    const path = url.replace(domain, '');

    // Safety check in case the URL is malformed
    if (!domain) return true;
    
    // Check cache first (using GAS CacheService)
    const cache = CacheService.getScriptCache();
    const cacheKey = `robots_${domain.replace(/[^a-z0-9]/gi, '_')}`;
    const cached = cache.get(cacheKey);
    
    let robotsRules = null;
    
    if (cached) {
      robotsRules = JSON.parse(cached);
    } else {
      // Fetch robots.txt
      const robotsUrl = `${domain}/robots.txt`;
      try {
        const response = UrlFetchApp.fetch(robotsUrl, {
          muteHttpExceptions: true,
          followRedirects: false
        });
        
        if (response.getResponseCode() === 200) {
          robotsRules = parseRobotsTxt(response.getContentText());
          // Cache for 1 hour
          cache.put(cacheKey, JSON.stringify(robotsRules), THROTTLING_CONFIG.ROBOTS_TXT.cacheDuration);
        } else {
          // If 404/403, assume allowed (unwritten rule)
          return true;
        }
      } catch (e) {
        Logger.log(`Could not fetch robots.txt for ${domain}: ${e.message}`);
        return true;
      }
    }
    
    // If no rules found, allow
    if (!robotsRules) {
      return true;
    }
    
    // Check if our user agent is allowed
    const ourAgent = THROTTLING_CONFIG.ROBOTS_TXT.userAgent;
    const rules = robotsRules[ourAgent] || robotsRules['*'];
    
    if (rules) {
      // Check if path is disallowed
      // Note: This logic doesn't handle Allow: overriding Disallow: fully, but is a basic check.
      for (const disallowed of rules.disallow || []) {
        if (disallowed && path.startsWith(disallowed)) {
          Logger.log(`⚠️ Robots.txt disallows: ${path}`);
          return false;
        }
      }
      
      // Apply crawl delay if specified
      if (rules.crawlDelay) {
        const crawlDelayMs = parseFloat(rules.crawlDelay) * 1000;
        if (crawlDelayMs > 0) {
          Utilities.sleep(crawlDelayMs);
        }
      }
    }
    
    return true;
    
  } catch (error) {
    Logger.log(`Error checking robots.txt: ${error.message}`);
    return true;
  }
}

/**
 * Parse robots.txt content
 */
function parseRobotsTxt(content) {
  const rules = {};
  let currentAgent = null;
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const match = trimmed.match(/^([^:]+):\s*(.*)$/i);
    if (!match) continue;
    
    const [_, key, value] = match;
    
    if (key.toLowerCase() === 'user-agent') {
      currentAgent = value.trim();
      if (!rules[currentAgent]) {
        rules[currentAgent] = { disallow: [], allow: [] };
      }
    } else if (currentAgent) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey === 'disallow') {
        if (value.trim()) {
          rules[currentAgent].disallow.push(value.trim());
        }
      } else if (normalizedKey === 'allow') {
        rules[currentAgent].allow.push(value.trim());
      } else if (normalizedKey === 'crawl-delay') {
        rules[currentAgent].crawlDelay = value.trim();
      }
    }
  }
  
  return rules;
}

// ============================================================================
// MONITORING & STATISTICS
// ============================================================================

/**
 * Get throttling statistics
 * @returns {Object} Statistics object
 */
function getThrottlingStats() {
  const stats = {
    domains: {},
    totalRequests: 0,
    totalFailures: 0,
    openCircuits: 0
  };
  
  for (const [domain, tracker] of Object.entries(requestTracker)) {
    stats.domains[domain] = {
      requestsThisMinute: tracker.count,
      lastRequestTime: new Date(tracker.lastRequestTime).toISOString(),
      consecutiveFailures: tracker.failures,
      circuitOpen: tracker.circuitOpen
    };
    
    // Only count failures that led to circuit logic
    stats.totalFailures += tracker.failures; 
    
    if (tracker.circuitOpen) stats.openCircuits++;
  }
  
  return stats;
}

/**
 * Reset throttling statistics (use carefully)
 */
function resetThrottlingStats() {
  for (const domain in requestTracker) {
    requestTracker[domain] = {
      currentMinute: Math.floor(Date.now() / 60000),
      count: 0,
      lastRequestTime: 0,
      failures: 0,
      circuitOpen: false,
      circuitOpenedAt: 0
    };
  }
}

// ============================================================================
// TESTING FUNCTIONS (Corrected URL)
// ============================================================================

/**
 * Test throttling system
 */
function testThrottlingSystem() {
  Logger.log('=== TESTING THROTTLING SYSTEM ===\n');
  
  const testUrls = [
    'https://newsday.co.tt/2025/12/06/pm-hands-over-10-repaired-vehicles-to-ttps/',
    'https://trinidadexpress.com/news/local/cwu-hilton-sign-off-on-11-pay-rise/article_a2e58d27-b5dd-4c89-9be2-871af2f70cfa.html',
    'https://www.cnc3.co.tt/govt-changes-bir-board-structure-pnm-warns-of-political-control/',
    'https://generativelanguage.googleapis.com/v1beta/test'
  ];
  
  testUrls.forEach((url, index) => {
    Logger.log(`Test ${index + 1}: ${url}`);
    try {
      const delay = calculateAdaptiveDelay(url);
      Logger.log(`  Calculated delay: ${delay.toFixed(0)}ms`);
      
      // Simulate request tracking (manually called init to set up tracker for logging stats)
      const domain = getHostnameFromUrl(url).hostname;
      initTracker(domain);
      Logger.log(`  Would respect robots.txt: ${checkRobotsTxt(url)}`);
      
    } catch (error) {
      Logger.log(`  Error: ${error.message}`);
    }
    Logger.log('');
  });
  
  Logger.log('=== THROTTLING STATISTICS ===');
  Logger.log(JSON.stringify(getThrottlingStats(), null, 2));
}

/**
 * Test resilient fetch with a safe URL
 */
function testResilientFetch() {
  // Using httpbin.org which is generally safe for testing 200 status code
  const testUrl = 'https://httpbin.org/status/200'; 
  
  Logger.log(`Testing resilientFetch with: ${testUrl}`);
  
  try {
    const start = Date.now();
    const response = resilientFetch(testUrl);
    const elapsed = Date.now() - start;
    
    Logger.log(`✅ Success: HTTP ${response.getResponseCode()} in ${elapsed}ms`);
    return true;
  } catch (error) {
    Logger.log(`❌ Failed: ${error.message}`);
    return false;
  }
}