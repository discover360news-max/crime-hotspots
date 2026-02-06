/**
 * HTML Escaping Utilities
 *
 * Prevents XSS attacks by escaping special HTML characters in user/external data
 * before inserting into innerHTML.
 *
 * Created: Jan 17, 2026
 */

/**
 * Escape HTML special characters to prevent XSS
 *
 * @param str - String that may contain HTML characters
 * @returns Escaped string safe for innerHTML
 */
export function escapeHtml(str: string | null | undefined): string {
  if (str == null) return '';

  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate and sanitize a URL
 * Only allows http://, https://, and relative URLs starting with /
 * Returns empty string for potentially dangerous URLs (javascript:, data:, etc.)
 *
 * @param url - URL string to validate
 * @returns Safe URL or empty string
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (url == null) return '';

  const trimmed = String(url).trim();

  // Allow relative URLs starting with /
  if (trimmed.startsWith('/')) {
    return escapeHtml(trimmed);
  }

  // Allow http:// and https:// URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return escapeHtml(trimmed);
  }

  // Block everything else (javascript:, data:, vbscript:, etc.)
  return '';
}

/**
 * Validate a URL scheme without HTML escaping.
 * Use this when assigning to DOM properties (element.href = url)
 * where HTML escaping would cause double-encoding.
 * Use sanitizeUrl() instead when inserting URLs into innerHTML templates.
 */
export function validateUrl(url: string | null | undefined): string {
  if (url == null) return '';

  const trimmed = String(url).trim();

  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  return '';
}
