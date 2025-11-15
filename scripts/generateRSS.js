/**
 * Generates RSS feed from blog posts manifest
 * This runs during the build process and creates rss.xml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_FILE = path.join(__dirname, '../dist/blogPosts.json');
const OUTPUT_FILE = path.join(__dirname, '../dist/rss.xml');

// Site configuration
const SITE_CONFIG = {
  title: 'Crime Hotspots Caribbean - Crime Statistics Blog',
  description: 'Weekly crime statistics analysis and reports for Trinidad & Tobago, Guyana, and the Caribbean. Data-driven insights into public safety trends.',
  siteUrl: 'https://crimehotspots.com', // Update with actual domain
  language: 'en-US',
  copyright: `Copyright ${new Date().getFullYear()} Crime Hotspots Caribbean`,
  author: 'Crime Hotspots Analytics',
  webMaster: 'support@crimehotspots.com'
};

function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateRSS() {
  console.log('Generating RSS feed...');

  if (!fs.existsSync(MANIFEST_FILE)) {
    console.error('Blog posts manifest not found. Run generateBlogManifest.js first.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
  const posts = manifest.posts || [];

  if (posts.length === 0) {
    console.log('No blog posts found. Creating empty RSS feed.');
  }

  const rssItems = posts.slice(0, 20).map(post => {
    const pubDate = new Date(post.date).toUTCString();
    const link = `${SITE_CONFIG.siteUrl}/blog-post.html?slug=${post.slug}`;
    const guid = link;

    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.author)}</author>
      <description>${escapeXml(post.excerpt)}</description>
      <category>${escapeXml(post.countryName)}</category>
      ${post.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
  }).join('\n');

  const lastBuildDate = posts.length > 0
    ? new Date(posts[0].date).toUTCString()
    : new Date().toUTCString();

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_CONFIG.title)}</title>
    <link>${SITE_CONFIG.siteUrl}</link>
    <description>${escapeXml(SITE_CONFIG.description)}</description>
    <language>${SITE_CONFIG.language}</language>
    <copyright>${escapeXml(SITE_CONFIG.copyright)}</copyright>
    <managingEditor>${SITE_CONFIG.webMaster} (${escapeXml(SITE_CONFIG.author)})</managingEditor>
    <webMaster>${SITE_CONFIG.webMaster}</webMaster>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_CONFIG.siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

  fs.writeFileSync(OUTPUT_FILE, rssXml);

  console.log(`Generated RSS feed with ${posts.length} posts`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

try {
  generateRSS();
} catch (error) {
  console.error('Error generating RSS feed:', error);
  process.exit(1);
}
