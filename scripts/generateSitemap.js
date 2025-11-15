/**
 * Generates sitemap.xml for SEO
 * This runs during the build process
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, '../dist/sitemap.xml');
const MANIFEST_FILE = path.join(__dirname, '../dist/blogPosts.json');

// Site configuration
const SITE_URL = 'https://crimehotspots.com'; // Update with actual domain

// Static pages
const STATIC_PAGES = [
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/about.html', priority: 0.8, changefreq: 'monthly' },
  { url: '/report.html', priority: 0.9, changefreq: 'monthly' },
  { url: '/headlines-trinidad-and-tobago.html', priority: 0.9, changefreq: 'daily' },
  { url: '/headlines-guyana.html', priority: 0.9, changefreq: 'daily' },
  { url: '/blog.html', priority: 0.9, changefreq: 'weekly' }
];

function generateSitemap() {
  console.log('Generating sitemap.xml...');

  const urls = [...STATIC_PAGES];

  // Add blog posts if manifest exists
  if (fs.existsSync(MANIFEST_FILE)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
    const posts = manifest.posts || [];

    posts.forEach(post => {
      urls.push({
        url: `/blog-post.html?slug=${post.slug}`,
        lastmod: post.date,
        priority: 0.7,
        changefreq: 'monthly'
      });
    });
  }

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${page.url}</loc>\n`;
    if (page.lastmod) {
      xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
    }
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  // Ensure dist directory exists
  const distDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, xml);

  console.log(`Generated sitemap with ${urls.length} URLs`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

try {
  generateSitemap();
} catch (error) {
  console.error('Error generating sitemap:', error);
  process.exit(1);
}
