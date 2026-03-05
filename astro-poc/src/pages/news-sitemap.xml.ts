import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildRoute } from '../config/routes';

/**
 * Google News Sitemap — /news-sitemap.xml
 *
 * Google News only indexes articles published in the last 2 days,
 * so this sitemap includes only recent blog posts.
 * Rebuilt daily via Cloudflare Pages' daily GitHub Actions trigger.
 *
 * Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
export const GET: APIRoute = async () => {
  let blogPosts: any[] = [];
  try {
    blogPosts = await getCollection('blog');
  } catch (e) {
    // Blog collection might be empty
  }

  // Google News only indexes articles from the last 2 days
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const recentPosts = blogPosts
    .filter(post => new Date(post.data.date) >= twoDaysAgo)
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${recentPosts.map(post => `  <url>
    <loc>https://crimehotspots.com${buildRoute.blogPost(post.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>Crime Hotspots</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(post.data.date).toISOString()}</news:publication_date>
      <news:title>${escapeXml(post.data.title)}</news:title>
    </news:news>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
