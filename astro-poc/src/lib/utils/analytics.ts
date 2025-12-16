/**
 * Privacy-Focused Analytics Integration
 *
 * Supports multiple analytics providers:
 * - Google Analytics 4 (free, privacy-focused config)
 * - Cloudflare Web Analytics (free, no cookies)
 * - Custom event tracking
 *
 * Only initializes after user consent
 */

export class Analytics {
  constructor(config = {}) {
    this.config = {
      provider: config.provider || 'ga4', // 'ga4' or 'cloudflare' or 'both'
      ga4MeasurementId: config.ga4MeasurementId || '',
      cloudflareToken: config.cloudflareToken || '',
      anonymizeIp: config.anonymizeIp !== false, // Default true
      cookieless: config.cookieless || false,
      debug: config.debug || false,
      ...config
    };

    this.initialized = false;
  }

  /**
   * Initialize analytics (call after user consents)
   */
  init() {
    if (this.initialized) {
      return;
    }

    if (this.config.provider === 'ga4' || this.config.provider === 'both') {
      this.initGA4();
    }

    if (this.config.provider === 'cloudflare' || this.config.provider === 'both') {
      this.initCloudflare();
    }

    this.initialized = true;
    this.log('Analytics initialized');
  }

  /**
   * Initialize Google Analytics 4
   */
  initGA4() {
    if (!this.config.ga4MeasurementId) {
      this.log('GA4 Measurement ID not provided');
      return;
    }

    // Load gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.ga4MeasurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());

    // Privacy-focused configuration
    const gaConfig = {
      anonymize_ip: this.config.anonymizeIp,
      cookie_flags: 'SameSite=None;Secure',
      send_page_view: true
    };

    // Cookieless mode (less accurate but more privacy-friendly)
    if (this.config.cookieless) {
      gaConfig.client_storage = 'none';
      gaConfig.anonymize_ip = true;
    }

    gtag('config', this.config.ga4MeasurementId, gaConfig);

    this.log('GA4 initialized');
  }

  /**
   * Initialize Cloudflare Web Analytics
   * (Completely cookieless, GDPR-friendly)
   */
  initCloudflare() {
    if (!this.config.cloudflareToken) {
      this.log('Cloudflare token not provided');
      return;
    }

    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.setAttribute('data-cf-beacon', JSON.stringify({ token: this.config.cloudflareToken }));
    document.head.appendChild(script);

    this.log('Cloudflare Analytics initialized');
  }

  /**
   * Track custom event
   */
  trackEvent(eventName, eventParams = {}) {
    if (!this.initialized) {
      this.log('Analytics not initialized, event not tracked:', eventName);
      return;
    }

    // Google Analytics 4
    if (window.gtag) {
      window.gtag('event', eventName, eventParams);
      this.log('Event tracked (GA4):', eventName, eventParams);
    }

    // Cloudflare doesn't support custom events, but we can send to custom endpoint
    // For now, just log in debug mode
    this.log('Event tracked:', eventName, eventParams);
  }

  /**
   * Track page view (for SPAs)
   */
  trackPageView(pagePath) {
    if (!this.initialized) {
      return;
    }

    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pagePath || window.location.pathname
      });
      this.log('Page view tracked:', pagePath);
    }
  }

  /**
   * Helper: Console log in debug mode
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[Analytics]', ...args);
    }
  }
}

/**
 * Global analytics instance
 * Usage:
 *
 * import { initAnalytics, trackEvent } from './utils/analytics.js';
 *
 * // Initialize after consent
 * initAnalytics({
 *   provider: 'ga4',
 *   ga4MeasurementId: 'G-XXXXXXXXXX'
 * });
 *
 * // Track events
 * trackEvent('dashboard_viewed', { country: 'trinidad' });
 */
let analyticsInstance = null;

export function initAnalytics(config) {
  analyticsInstance = new Analytics(config);
  analyticsInstance.init();
  return analyticsInstance;
}

export function trackEvent(eventName, eventParams) {
  if (analyticsInstance) {
    analyticsInstance.trackEvent(eventName, eventParams);
  }
}

export function trackPageView(pagePath) {
  if (analyticsInstance) {
    analyticsInstance.trackPageView(pagePath);
  }
}

/**
 * Predefined event trackers for common actions
 */
export const Events = {
  // Dashboard interactions
  dashboardViewed: (country) => trackEvent('dashboard_viewed', { country }),
  dashboardLoaded: (country, loadTime) => trackEvent('dashboard_loaded', { country, load_time_ms: loadTime }),

  // Headlines interactions
  headlineViewed: (country, area) => trackEvent('headline_viewed', { country, area }),
  headlineFiltered: (country, area) => trackEvent('headline_filtered', { country, area }),
  loadMoreClicked: (country) => trackEvent('load_more_clicked', { country }),

  // Blog interactions
  blogPostViewed: (slug, country) => trackEvent('blog_post_viewed', { slug, country }),
  blogShared: (platform, slug) => trackEvent('blog_shared', { platform, slug }),

  // Form interactions
  reportSubmitted: (country) => trackEvent('report_submitted', { country }),
  reportFailed: (country, error) => trackEvent('report_failed', { country, error_type: error }),

  // Navigation
  countrySelected: (country) => trackEvent('country_selected', { country }),
  externalLinkClicked: (url) => trackEvent('external_link_clicked', { url })
};
