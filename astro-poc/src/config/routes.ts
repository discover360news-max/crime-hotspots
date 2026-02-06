/**
 * Centralized Route Configuration
 *
 * SINGLE SOURCE OF TRUTH for all internal routes.
 *
 * Used by:
 * - All .astro pages and components (static links)
 * - Client-side scripts (dynamic navigation)
 * - src/data/countries.ts (section URLs)
 * - Sitemap generation
 *
 * IMPORTANT: When changing routes, this is the ONLY file you need to update.
 *
 * Created: Feb 4, 2026
 */

// Static routes
export const routes = {
  home: '/',
  blog: '/blog/',
  report: '/report/',
  about: '/about/',
  contact: '/contact/',
  faq: '/faq/',
  methodology: '/methodology/',
  privacy: '/privacy/',
  businessSolutions: '/business-solutions/',
  trinidad: {
    dashboard: '/trinidad/dashboard/',
    headlines: '/trinidad/headlines/',
    archive: '/trinidad/archive/',
    areas: '/trinidad/areas/',
    compare: '/trinidad/compare/',
    statistics: '/trinidad/statistics/',
    regions: '/trinidad/regions/',
    murderCount: '/trinidad/murder-count/',
  },
} as const;

// Dynamic route builders
export const buildRoute = {
  crime: (slug: string) => `/trinidad/crime/${slug}/`,
  crimeAbsolute: (slug: string) => `https://crimehotspots.com/trinidad/crime/${slug}/`,
  area: (slug: string) => `/trinidad/area/${slug}/`,
  region: (slug: string) => `/trinidad/region/${slug}/`,
  archive: (year: number, month?: string) =>
    month ? `/trinidad/archive/${year}/${month}/` : `/trinidad/archive/${year}/`,
  blogPost: (slug: string) => `/blog/${slug}/`,
} as const;
