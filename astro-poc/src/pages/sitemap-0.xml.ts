import type { APIRoute } from 'astro';
import { getTrinidadCrimes } from '../lib/crimeData';
import { getCollection } from 'astro:content';
import { buildRoute } from '../config/routes';

/**
 * Main Sitemap
 * Dynamically generates sitemap with all pages
 * - Static pages (homepage, dashboard, etc.)
 * - Crime detail pages (1,700+ dynamically generated)
 * - Archive pages (monthly archives)
 * - Blog posts
 */
export const GET: APIRoute = async () => {
  // Get all crimes for crime pages
  const crimes = await getTrinidadCrimes();

  // Get blog posts
  let blogPosts: any[] = [];
  try {
    blogPosts = await getCollection('blog');
  } catch (e) {
    // Blog collection might not exist yet
  }

  // SEO CRITICAL: static pages sitemap. Update this list whenever adding a new section or country.
  // priority: 1.0=homepage, 0.9=high-value stats, 0.8=content hubs, 0.7=archive/areas, 0.5=utility
  // changefreq: set to actual update cadence (Google ignores inflated values).
  // See docs/claude-context/SEO-CONFIG.md — Sitemap section.
  const staticPages = [
    { url: '', priority: 1.0, changefreq: 'daily' },
    { url: 'trinidad/dashboard', priority: 1.0, changefreq: 'daily' },
    { url: 'trinidad/headlines', priority: 0.9, changefreq: 'daily' },
    { url: 'trinidad/statistics', priority: 0.9, changefreq: 'weekly' },
    { url: 'trinidad/murder-count', priority: 0.8, changefreq: 'daily' },
    { url: 'headlines', priority: 0.8, changefreq: 'daily' },
    { url: 'blog', priority: 0.8, changefreq: 'weekly' },
    { url: 'trinidad/areas', priority: 0.7, changefreq: 'weekly' },
    { url: 'trinidad/archive', priority: 0.7, changefreq: 'weekly' },
    { url: 'trinidad/regions', priority: 0.6, changefreq: 'weekly' },
    { url: 'trinidad/compare', priority: 0.5, changefreq: 'monthly' },
    { url: 'report', priority: 0.6, changefreq: 'monthly' },
    { url: 'about', priority: 0.7, changefreq: 'monthly' },
    { url: 'faq', priority: 0.7, changefreq: 'monthly' },
    { url: 'methodology', priority: 0.7, changefreq: 'monthly' },
    { url: 'privacy', priority: 0.5, changefreq: 'yearly' },
    { url: 'tools/social-image-generator', priority: 0.4, changefreq: 'monthly' },
  ];

  // Crime pages - prioritize recent crimes
  const crimePages = crimes.map(crime => {
    const ageInDays = (Date.now() - crime.dateObj.getTime()) / (1000 * 60 * 60 * 24);
    const priority = ageInDays < 30 ? 0.8 : ageInDays < 90 ? 0.6 : 0.4;

    return {
      url: buildRoute.crime(crime.slug).slice(1),
      lastmod: crime.dateObj.toISOString(),
      priority,
      changefreq: 'monthly' as const
    };
  });

  // Archive pages - monthly pages
  const years = [...new Set(crimes.map(c => c.year))].sort((a, b) => b - a);
  const archivePages = [];
  for (const year of years) {
    const yearCrimes = crimes.filter(c => c.year === year);
    const months = [...new Set(yearCrimes.map(c => c.month))].sort((a, b) => a - b);
    for (const month of months) {
      archivePages.push({
        url: buildRoute.archive(Number(year), String(month).padStart(2, '0')).slice(1),
        lastmod: new Date().toISOString(),
        priority: year === years[0] ? 0.7 : 0.5,
        changefreq: 'weekly' as const
      });
    }
  }

  // Blog posts
  const blogPages = blogPosts.map(post => ({
    url: buildRoute.blogPost(post.slug).slice(1),
    lastmod: post.data.pubDate?.toISOString() || new Date().toISOString(),
    priority: 0.7,
    changefreq: 'monthly' as const
  }));

  // Combine all pages
  const allPages = [
    ...staticPages.map(p => ({ ...p, lastmod: new Date().toISOString() })),
    ...archivePages,
    ...blogPages,
    ...crimePages
  ];

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>https://crimehotspots.com/${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
