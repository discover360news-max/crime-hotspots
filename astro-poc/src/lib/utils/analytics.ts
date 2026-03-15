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

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

interface AnalyticsConfig {
  provider: string;
  ga4MeasurementId: string;
  cloudflareToken: string;
  anonymizeIp: boolean;
  cookieless: boolean;
  debug: boolean;
  [key: string]: unknown;
}

export class Analytics {
  private config: AnalyticsConfig;
  private initialized: boolean;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      provider: (config.provider as string) || 'ga4',
      ga4MeasurementId: (config.ga4MeasurementId as string) || '',
      cloudflareToken: (config.cloudflareToken as string) || '',
      anonymizeIp: config.anonymizeIp !== false,
      cookieless: (config.cookieless as boolean) || false,
      debug: (config.debug as boolean) || false,
      ...config,
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

    // Consent Mode v2: gtag.js is already loaded in <head> with consent denied by default.
    // cookieConsent.ts has already called gtag('consent', 'update', {granted}) at this point.
    // Nothing left to do here — just mark as ready.
    if (window.gtag) {
      this.log('GA4 ready (Consent Mode v2)');
      return;
    }

    // Fallback: load gtag.js manually (should not occur when Layout.astro is correctly set up)
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.ga4MeasurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', this.config.ga4MeasurementId, {
      anonymize_ip: this.config.anonymizeIp,
      send_page_view: true,
    });

    this.log('GA4 initialized (fallback)');
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
  trackEvent(eventName: string, eventParams: Record<string, unknown> = {}) {
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
  trackPageView(pagePath: string) {
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
  log(...args: unknown[]) {
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
