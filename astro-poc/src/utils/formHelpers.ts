/**
 * Form Utility Functions
 * Reusable helpers for form handling, validation, and security
 */

/**
 * Generate unique report ID with timestamp and random component
 * @param prefix - Prefix for the ID (e.g., "REP", "TTO")
 * @returns Formatted ID like "REP-20260108-A3F9"
 */
export function generateId(prefix = "REP"): string {
  const n = new Date();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, "0")}${String(n.getDate()).padStart(2, "0")}-${rand}`;
}

/**
 * Clean and sanitize area/location names
 * @param str - Input string to clean
 * @returns Trimmed string
 */
export function cleanAreaName(str: string): string {
  return str.trim();
}

/**
 * Safely retrieve and validate localStorage values
 * Protects against XSS and invalid data
 *
 * @param key - localStorage key
 * @param validator - Optional validation function
 * @returns Validated value or null
 */
export function getValidatedLocalStorage(
  key: string,
  validator?: (val: string) => boolean
): string | null {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;

    const clean = value.trim();

    // Block malicious content
    if (/<script|javascript:|data:|vbscript:/i.test(clean)) {
      console.warn(`Blocked suspicious localStorage value for ${key}`);
      localStorage.removeItem(key);
      return null;
    }

    // Apply custom validation
    if (validator && !validator(clean)) {
      console.warn(`Invalid localStorage value for ${key}`);
      localStorage.removeItem(key);
      return null;
    }

    return clean;
  } catch (e) {
    console.error('localStorage access error:', e);
    return null;
  }
}

/**
 * Validate honeypot anti-bot protection
 * Checks multiple signals:
 * - Honeypot field not filled
 * - Field never focused
 * - Sufficient time elapsed
 * - Mouse activity detected
 *
 * @param hp - Honeypot input element
 * @returns true if likely human, false if likely bot
 */
export function validateHoneypot(hp: HTMLInputElement | null): boolean {
  // Check if honeypot field is filled (bot behavior)
  if (hp && hp.value) {
    console.warn('Honeypot: field filled');
    return false;
  }

  // Check if honeypot field was focused (bot behavior)
  const wasFocused = hp && hp.dataset.focused === 'true';
  if (wasFocused) {
    console.warn('Honeypot: field focused');
    return false;
  }

  // Check submission timing (too fast = bot)
  const formLoadTime = parseInt(sessionStorage.getItem('formLoadTime') || '0');
  const timeDelta = Date.now() - formLoadTime;
  if (timeDelta < 2000) {
    console.warn('Honeypot: too fast submission');
    return false;
  }

  // Check mouse activity (no movement = bot)
  const mouseMovements = parseInt(sessionStorage.getItem('mouseMovements') || '0');
  if (mouseMovements < 3) {
    console.warn('Honeypot: insufficient mouse activity');
    return false;
  }

  return true;
}

/**
 * Rate Limiter for form submissions
 * Prevents spam by limiting requests within a time window
 */
export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private requests: number[];

  /**
   * @param maxRequests - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   */
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Check if a new request can be made
   * @returns true if request allowed, false if rate limited
   */
  canMakeRequest(): boolean {
    const now = Date.now();

    // Remove expired requests from tracking
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    // Check if limit exceeded
    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    // Track this request
    this.requests.push(now);
    return true;
  }

  /**
   * Get time until next request is allowed
   * @returns Milliseconds until next request, or 0 if requests available
   */
  getTimeUntilNextRequest(): number {
    if (this.requests.length === 0) return 0;

    const now = Date.now();
    const oldestRequest = this.requests[0];
    return Math.max(0, this.windowMs - (now - oldestRequest));
  }
}
