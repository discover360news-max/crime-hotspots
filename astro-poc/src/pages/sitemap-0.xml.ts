import type { APIRoute } from 'astro';
import { getTrinidadCrimes, getAllCrimesFromD1, generateNameSlug } from '../lib/crimeData';
import { getCollection } from 'astro:content';
import { buildRoute } from '../config/routes';
import { slugifyCategory } from '../lib/safetyTipsHelpers';
import mpsData from '../data/mps.json';
import mpsJamaicaData from '../data/mps-jamaica.json';

/**
 * Main Sitemap
 * Dynamically generates sitemap with all pages
 * - Static pages (homepage, dashboard, etc.)
 * - Crime detail pages (1,700+ dynamically generated)
 * - Archive pages (monthly archives)
 * - Blog posts
 */
export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  // Get all crimes for crime pages
  const crimes = db ? await getAllCrimesFromD1(db) : await getTrinidadCrimes();

  // Get blog posts
  let blogPosts: any[] = [];
  try {
    blogPosts = await getCollection('blog');
  } catch (e) {
    // Blog collection might not exist yet
  }

  // Get published tips
  let publishedTips: any[] = [];
  try {
    publishedTips = await getCollection('tips', ({ data }: { data: any }) => data.status === 'published');
  } catch (e) {
    // Tips collection might be empty
  }

  // SEO CRITICAL: static pages sitemap. Update this list whenever adding a new section or country.
  // priority: 1.0=homepage, 0.9=high-value stats, 0.8=content hubs, 0.7=archive/areas, 0.5=utility
  // changefreq: set to actual update cadence (Google ignores inflated values).
  // lastmod rules:
  //   - Data-driven pages (daily/weekly): use buildTime so Google sees a fresh signal after each deploy.
  //   - Static content pages: HARDCODE the date you last edited the file. Do not use buildTime —
  //     Google will learn to ignore lastmod if it changes on every build for pages that never change.
  //     Update the hardcoded date manually whenever you meaningfully edit that page's content.
  // See docs/claude-context/SEO-CONFIG.md — Sitemap section.
  // IMPORTANT: All URLs must include trailing slashes.
  // Astro is configured with trailingSlash: 'always' — URLs without trailing slashes
  // receive a 308 redirect, which GSC reports as "Page with redirect" and won't index.
  const buildTime = new Date().toISOString();
  const staticPages = [
    // Data-driven — content changes on every build
    { url: '', priority: 1.0, changefreq: 'daily', lastmod: buildTime },
    { url: 'trinidad/dashboard/', priority: 1.0, changefreq: 'daily', lastmod: buildTime },
    { url: 'trinidad/headlines/', priority: 0.9, changefreq: 'daily', lastmod: buildTime },
    { url: 'trinidad/statistics/', priority: 0.9, changefreq: 'weekly', lastmod: buildTime },
    { url: 'trinidad/murder-count/', priority: 0.8, changefreq: 'daily', lastmod: buildTime },
    { url: 'trinidad/murders/', priority: 0.8, changefreq: 'daily', lastmod: buildTime },
    { url: 'headlines/', priority: 0.8, changefreq: 'daily', lastmod: buildTime },
    { url: 'blog/', priority: 0.8, changefreq: 'weekly', lastmod: buildTime },
    { url: 'trinidad/areas/', priority: 0.7, changefreq: 'weekly', lastmod: buildTime },
    { url: 'trinidad/archive/', priority: 0.7, changefreq: 'weekly', lastmod: buildTime },
    { url: 'trinidad/regions/', priority: 0.6, changefreq: 'weekly', lastmod: buildTime },
    { url: 'trinidad/safety-tips/', priority: 0.8, changefreq: 'weekly', lastmod: buildTime },
    // Static content — update the hardcoded date when you edit the page content
    { url: 'trinidad/compare/', priority: 0.5, changefreq: 'monthly', lastmod: '2026-03-17' },
    { url: 'trinidad/mp/', priority: 0.7, changefreq: 'yearly', lastmod: '2026-03-17' },
    { url: 'trinidad/safety-tips/submit/', priority: 0.5, changefreq: 'monthly', lastmod: '2026-03-15' },
    { url: 'report/', priority: 0.6, changefreq: 'monthly', lastmod: '2026-03-15' },
    { url: 'about/', priority: 0.7, changefreq: 'monthly', lastmod: '2026-03-15' },
    { url: 'faq/', priority: 0.7, changefreq: 'monthly', lastmod: '2026-03-17' },
    { url: 'methodology/', priority: 0.7, changefreq: 'monthly', lastmod: '2026-03-15' },
    { url: 'privacy/', priority: 0.5, changefreq: 'yearly', lastmod: '2026-03-15' },
    { url: 'terms/', priority: 0.5, changefreq: 'yearly', lastmod: '2026-03-15' },
    { url: 'tools/social-image-generator/', priority: 0.4, changefreq: 'monthly', lastmod: '2026-03-17' },
  ];

  // Crime pages - prioritize recent crimes
  const crimePages = crimes.map(crime => {
    const ageInDays = (Date.now() - crime.dateObj.getTime()) / (1000 * 60 * 60 * 24);
    const priority = ageInDays < 30 ? 0.8 : ageInDays < 90 ? 0.6 : 0.4;

    return {
      url: buildRoute.crime(crime.slug).slice(1),
      lastmod: (crime.dateUpdated ?? crime.datePublished ?? crime.dateObj).toISOString(),
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

  // Area pages — all unique areas with crime data
  const uniqueAreas = [...new Set(crimes.map(c => c.area).filter(a => a))];
  const areaPages = uniqueAreas.map(area => ({
    url: buildRoute.area(generateNameSlug(area)).slice(1),
    lastmod: new Date().toISOString(),
    priority: 0.6,
    changefreq: 'weekly' as const
  }));

  // Blog posts
  const blogPages = blogPosts.map(post => ({
    url: buildRoute.blogPost(post.slug).slice(1),
    lastmod: post.data.pubDate?.toISOString() || new Date().toISOString(),
    priority: 0.7,
    changefreq: 'monthly' as const
  }));

  // Tip individual pages
  const tipPages = publishedTips.map((tip: any) => ({
    url: buildRoute.safetyTip(tip.slug).slice(1),
    lastmod: (tip.data.date_updated || tip.data.date_added).toISOString(),
    priority: 0.7,
    changefreq: 'monthly' as const
  }));

  // Tip category pages
  const tipCategories = [...new Set(publishedTips.map((t: any) => t.data.category))];
  const tipCategoryPages = tipCategories.map((cat: any) => ({
    url: buildRoute.safetyTipsCategory(cat).slice(1),
    lastmod: new Date().toISOString(),
    priority: 0.8,
    changefreq: 'weekly' as const
  }));

  // Tip context pages
  const tipContexts = [...new Set(publishedTips.map((t: any) => t.data.context))];
  const tipContextPages = tipContexts.map((ctx: any) => ({
    url: buildRoute.safetyTipsContext(ctx).slice(1),
    lastmod: new Date().toISOString(),
    priority: 0.8,
    changefreq: 'weekly' as const
  }));

  // T&T MP profile pages — 41 individual pages
  // lastmod: update when mps.json data is refreshed
  const mpPages = mpsData.map(mp => ({
    url: buildRoute.mp(mp.nameSlug).slice(1),
    lastmod: '2026-03-17',
    priority: 0.7,
    changefreq: 'yearly' as const,
  }));

  // Jamaica static pages — only include pages with real content.
  // Data pages (dashboard, headlines, statistics, murder-count, archive) are noindex
  // and excluded here until Jamaica D1 is wired (Phase C).
  // lastmod: update when page content or jamaica MP data is refreshed
  const jamaicaStaticPages = [
    { url: 'jamaica/mp/', priority: 0.7, changefreq: 'yearly' as const, lastmod: '2026-03-17' },
    { url: 'jamaica/parishes/', priority: 0.6, changefreq: 'yearly' as const, lastmod: '2026-03-17' },
  ];

  // Jamaica MP profile pages — 63 individual pages
  // lastmod: update when mps-jamaica.json data is refreshed
  const jamaicaMpPages = mpsJamaicaData.map(mp => ({
    url: buildRoute.jamaicaMp(mp.nameSlug).slice(1),
    lastmod: '2026-03-17',
    priority: 0.7,
    changefreq: 'yearly' as const,
  }));

  // Tip area pages (only areas with ≥3 tips)
  const areaCountMap: Record<string, number> = {};
  publishedTips.forEach((t: any) => {
    if (t.data.area?.trim()) {
      const slug = t.data.area.trim().toLowerCase().replace(/\s+/g, '-');
      areaCountMap[slug] = (areaCountMap[slug] || 0) + 1;
    }
  });
  const tipAreaPages = Object.entries(areaCountMap)
    .filter(([, count]) => count >= 3)
    .map(([slug]) => ({
      url: buildRoute.safetyTipsArea(slug).slice(1),
      lastmod: new Date().toISOString(),
      priority: 0.7,
      changefreq: 'weekly' as const
    }));

  // Combine all pages
  const allPages = [
    ...staticPages,
    ...archivePages,
    ...areaPages,
    ...blogPages,
    ...tipPages,
    ...tipCategoryPages,
    ...tipContextPages,
    ...tipAreaPages,
    ...mpPages,
    ...jamaicaStaticPages,
    ...jamaicaMpPages,
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
      'CDN-Cache-Control': 'max-age=82800',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
};
