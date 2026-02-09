import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getTrinidadCrimes } from '../lib/crimeData';
import { buildRoute } from '../config/routes';

export const prerender = true;

/**
 * RSS Feed
 * Blog posts (weekly reports) + latest crime headlines
 * Combined and sorted by date, limited to 30 items
 */
export const GET: APIRoute = async () => {
  const site = 'https://crimehotspots.com';

  // Blog posts
  let blogItems: { title: string; link: string; description: string; pubDate: Date; author: string; category?: string }[] = [];
  try {
    const blogPosts = await getCollection('blog');
    blogItems = blogPosts.map(post => ({
      title: post.data.title,
      link: `${site}${buildRoute.blogPost(post.slug)}`,
      description: post.data.excerpt,
      pubDate: new Date(post.data.date),
      author: post.data.author,
      category: 'Weekly Report',
    }));
  } catch (e) {
    // Blog collection might not exist yet
  }

  // Crime headlines (latest 20)
  let crimeItems: typeof blogItems = [];
  try {
    const crimes = await getTrinidadCrimes();
    crimeItems = crimes.slice(0, 20).map(crime => ({
      title: crime.headline,
      link: `${site}${buildRoute.crime(crime.slug)}`,
      description: `${crime.crimeType} in ${crime.area}, ${crime.region}. ${crime.summary ? crime.summary.slice(0, 200) : ''}`,
      pubDate: crime.dateObj,
      author: 'Crime Hotspots',
      category: crime.crimeType,
    }));
  } catch (e) {
    // Crime data might not be available
  }

  // Combine and sort by date descending, limit to 30
  const allItems = [...blogItems, ...crimeItems]
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, 30);

  const items = allItems.map(item => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid>${item.link}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <author>${escapeXml(item.author)}</author>${item.category ? `\n      <category>${escapeXml(item.category)}</category>` : ''}
    </item>`).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Crime Hotspots - Caribbean Crime Reports</title>
    <link>${site}</link>
    <description>Daily crime headlines and weekly reports for the Caribbean. Data-driven analysis of crime trends across Trinidad &amp; Tobago and the wider region.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
