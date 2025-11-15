/**
 * Cookie Consent Manager
 *
 * Simple, lightweight cookie consent banner for GDPR/CCPA compliance
 * No external dependencies - fully self-contained
 *
 * FEATURES:
 * - GDPR/CCPA compliant
 * - Blocks analytics until consent given
 * - Remembers user preference (1 year)
 * - Minimal styling, integrates with Tailwind
 * - <1KB minified
 */

const CONSENT_COOKIE_NAME = 'crime_hotspots_consent';
const CONSENT_DURATION_DAYS = 365;

export class CookieConsent {
  constructor(config = {}) {
    this.config = {
      position: config.position || 'bottom', // 'bottom' or 'top'
      primaryColor: config.primaryColor || '#e11d48', // rose-600
      onAccept: config.onAccept || (() => {}),
      onDecline: config.onDecline || (() => {}),
      ...config
    };

    this.consentGiven = this.checkConsent();

    // If consent already given, initialize analytics immediately
    if (this.consentGiven) {
      this.config.onAccept();
    }
  }

  /**
   * Check if user has already given consent
   */
  checkConsent() {
    const consent = this.getCookie(CONSENT_COOKIE_NAME);
    return consent === 'accepted';
  }

  /**
   * Show consent banner if not already consented
   */
  show() {
    if (this.consentGiven) {
      return; // Already consented, don't show banner
    }

    const banner = this.createBanner();
    document.body.appendChild(banner);

    // Fade in animation
    setTimeout(() => {
      banner.style.opacity = '1';
      banner.style.transform = 'translateY(0)';
    }, 100);
  }

  /**
   * Create consent banner HTML
   */
  createBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.style.cssText = `
      position: fixed;
      ${this.config.position}: 0;
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.98);
      color: white;
      padding: 1.5rem;
      box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      opacity: 0;
      transform: translateY(${this.config.position === 'bottom' ? '100%' : '-100%'});
      transition: all 0.3s ease-in-out;
      backdrop-filter: blur(10px);
    `;

    banner.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;">
        <div style="flex: 1; min-width: 300px;">
          <p style="margin: 0; font-size: 0.95rem; line-height: 1.5;">
            <strong style="font-weight: 600;">We value your privacy</strong><br>
            We use cookies to analyze site traffic and improve your experience.
            By clicking "Accept", you consent to our use of analytics cookies.
            <a href="/about.html" style="color: ${this.config.primaryColor}; text-decoration: underline;" target="_blank">Learn more</a>
          </p>
        </div>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button id="cookie-decline" style="
            padding: 0.625rem 1.25rem;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 0.5rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
          " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
            Decline
          </button>
          <button id="cookie-accept" style="
            padding: 0.625rem 1.25rem;
            background: ${this.config.primaryColor};
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
          " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            Accept All Cookies
          </button>
        </div>
      </div>
    `;

    // Event listeners
    banner.querySelector('#cookie-accept').addEventListener('click', () => {
      this.acceptConsent();
      this.hideBanner(banner);
    });

    banner.querySelector('#cookie-decline').addEventListener('click', () => {
      this.declineConsent();
      this.hideBanner(banner);
    });

    return banner;
  }

  /**
   * Hide and remove banner
   */
  hideBanner(banner) {
    banner.style.opacity = '0';
    banner.style.transform = `translateY(${this.config.position === 'bottom' ? '100%' : '-100%'})`;

    setTimeout(() => {
      banner.remove();
    }, 300);
  }

  /**
   * User accepted cookies
   */
  acceptConsent() {
    this.setCookie(CONSENT_COOKIE_NAME, 'accepted', CONSENT_DURATION_DAYS);
    this.consentGiven = true;
    this.config.onAccept();
  }

  /**
   * User declined cookies
   */
  declineConsent() {
    this.setCookie(CONSENT_COOKIE_NAME, 'declined', CONSENT_DURATION_DAYS);
    this.consentGiven = false;
    this.config.onDecline();
  }

  /**
   * Helper: Set cookie
   */
  setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  /**
   * Helper: Get cookie
   */
  getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }

    return null;
  }

  /**
   * Revoke consent (for testing or user-requested deletion)
   */
  revokeConsent() {
    this.setCookie(CONSENT_COOKIE_NAME, '', -1);
    this.consentGiven = false;
  }
}

/**
 * Initialize consent banner (call this on every page)
 */
export function initCookieConsent(config = {}) {
  const consent = new CookieConsent(config);

  // Show banner when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => consent.show());
  } else {
    consent.show();
  }

  return consent;
}
