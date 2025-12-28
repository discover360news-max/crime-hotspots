/**
 * Site-wide notification configuration
 *
 * Controls dismissible notification banners displayed on data-heavy pages
 * (Dashboard, Headlines, Archives, Crime detail pages)
 */

export interface SiteNotification {
  enabled: boolean;
  id: string; // Unique ID for localStorage tracking
  message: string;
  subMessage?: string;
  type: 'info' | 'warning' | 'success';
}

/**
 * Data update notification
 *
 * Toggle this to inform users about ongoing data updates
 * Set enabled to false when updates are complete
 */
export const dataUpdateNotice: SiteNotification = {
  enabled: true, // ← Change to false when 2025 updates complete
  id: 'data-update-2025',
  message: '2025 crime data is currently being updated.',
  subMessage: 'Historical data remains available. Feel free to browse, contribute reports, and check back soon for complete 2025 statistics.',
  type: 'info'
};

/**
 * Generic site notification (for future use)
 *
 * Can be used for maintenance notices, feature announcements, etc.
 */
export const generalNotice: SiteNotification = {
  enabled: false,
  id: 'general-notice',
  message: '',
  type: 'info'
};
