/**
 * Generates a JSON manifest of all blog posts from markdown files
 * This runs during the build process and creates blogPosts.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_POSTS_DIR = path.join(__dirname, '../src/blog/posts');
const OUTPUT_FILE = path.join(__dirname, '../dist/blogPosts.json');

// Country metadata mapping
const COUNTRY_META = {
  'tt': { name: 'Trinidad & Tobago', image: './src/assets/images/trinidad.jpg' },
  'gy': { name: 'Guyana', image: './src/assets/images/guyana.jpg' },
  'bdos': { name: 'Barbados', image: './src/assets/images/barbados.jpg' }
};

function parseFrontMatter(content) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontMatterRegex);

  if (!match) {
    throw new Error('No frontmatter found');
  }

  const frontMatter = {};
  const lines = match[1].split('\n');

  lines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      // Remove quotes if present
      value = value.replace(/^["']|["']$/g, '');

      frontMatter[key] = value;
    }
  });

  // Extract content without frontmatter
  const markdownContent = content.replace(frontMatterRegex, '').trim();

  return { frontMatter, content: markdownContent };
}

function estimateReadTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}

function generateManifest() {
  console.log('Generating blog posts manifest...');

  // Create blog posts directory if it doesn't exist
  if (!fs.existsSync(BLOG_POSTS_DIR)) {
    console.log('No blog posts directory found. Creating empty manifest.');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ posts: [], bySlug: {} }, null, 2));
    return;
  }

  const files = fs.readdirSync(BLOG_POSTS_DIR).filter(file => file.endsWith('.md'));

  if (files.length === 0) {
    console.log('No blog posts found. Creating empty manifest.');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ posts: [], bySlug: {} }, null, 2));
    return;
  }

  const posts = [];
  const bySlug = {};

  files.forEach(file => {
    const filePath = path.join(BLOG_POSTS_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    try {
      const { frontMatter, content } = parseFrontMatter(fileContent);

      const slug = file.replace('.md', '');
      const countryMeta = COUNTRY_META[frontMatter.country] || {};

      const post = {
        id: slug,
        title: frontMatter.title,
        country: frontMatter.country,
        countryName: frontMatter.countryName || countryMeta.name,
        date: frontMatter.date,
        excerpt: frontMatter.excerpt,
        author: frontMatter.author || 'Crime Hotspots Analytics',
        readTime: estimateReadTime(content),
        image: countryMeta.image || './src/assets/images/caribbean.jpg',
        slug: slug,
        tags: frontMatter.tags ? frontMatter.tags.split(',').map(t => t.trim()) : [],
        content: content
      };

      posts.push(post);
      bySlug[slug] = post;
    } catch (error) {
      console.error(`Error parsing ${file}: ${error.message}`);
    }
  });

  // Sort by date (newest first)
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const manifest = {
    posts: posts.map(({ content, ...rest }) => rest), // Exclude content from posts array
    bySlug: bySlug,
    generated: new Date().toISOString()
  };

  // Ensure dist directory exists
  const distDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

  console.log(`Generated manifest with ${posts.length} posts`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

try {
  generateManifest();
} catch (error) {
  console.error('Error generating manifest:', error);
  process.exit(1);
}
