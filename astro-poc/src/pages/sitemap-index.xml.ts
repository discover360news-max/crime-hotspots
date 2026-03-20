import type { APIRoute } from 'astro';

/**
 * Sitemap Index
 * Points to the main sitemap containing all URLs
 */
export const GET: APIRoute = () => {
  const now = new Date().toISOString();
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://crimehotspots.com/sitemap-0.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://crimehotspots.com/news-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'CDN-Cache-Control': 'max-age=3600',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
};
