import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildRoute } from '../config/routes';
import { getTrinidadCrimes } from '../lib/crimeData';

/**
 * Google News Sitemap — /news-sitemap.xml
 *
 * Google News only indexes articles published in the last 2 days.
 * Includes both weekly blog posts AND recent crime pages (daily fresh content).
 * Rebuilt daily via Cloudflare Pages' daily GitHub Actions trigger.
 *
 * Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
export const GET: APIRoute = async () => {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Recent blog posts
  let blogPosts: any[] = [];
  try {
    const all = await getCollection('blog');
    blogPosts = all
      .filter(post => new Date(post.data.date) >= twoDaysAgo)
      .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  } catch (e) {
    // Blog collection might be empty
  }

  // Recent crime pages — primary daily content with NewsArticle schema
  let crimeEntries: { loc: string; date: string; title: string }[] = [];
  try {
    const crimes = await getTrinidadCrimes();
    crimeEntries = crimes
      .filter(c => c.dateObj >= twoDaysAgo)
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
      .slice(0, 100) // Cap at 100; Google News sitemap max is 1,000
      .map(c => ({
        loc: `https://crimehotspots.com${buildRoute.crime(c.slug)}`,
        date: (c.datePublished ?? c.dateObj).toISOString(),
        title: c.headline,
      }));
  } catch (e) {
    // Fall back to blog-only if crime data unavailable
  }

  const blogXml = blogPosts.map(post => `  <url>
    <loc>https://crimehotspots.com${buildRoute.blogPost(post.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>Crime Hotspots</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(post.data.date).toISOString()}</news:publication_date>
      <news:title>${escapeXml(post.data.title)}</news:title>
    </news:news>
  </url>`).join('\n');

  const crimeXml = crimeEntries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <news:news>
      <news:publication>
        <news:name>Crime Hotspots</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${e.date}</news:publication_date>
      <news:title>${escapeXml(e.title)}</news:title>
    </news:news>
  </url>`).join('\n');

  const parts = [blogXml, crimeXml].filter(s => s.trim());
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${parts.join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
