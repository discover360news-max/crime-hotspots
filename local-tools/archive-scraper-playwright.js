#!/usr/bin/env node
/**
 * Archive URL Scraper for Trinidad News Sources (Playwright Version)
 *
 * PURPOSE: Scrape Trinidad Express, Guardian TT, and Newsday archives using Playwright
 * CRITICAL: URLs are written to CSV for MANUAL review, NOT auto-processed
 *
 * Why Playwright?
 * - Handles JavaScript-rendered content
 * - Can take screenshots for verification
 * - Better at handling dynamic news sites
 *
 * Why manual review?
 * - We also collect news from Facebook sources
 * - Need to verify articles are actual crime incidents (not politics, court cases, etc.)
 * - Pre-filter helps but human verification preferred for backfill
 *
 * REQUIREMENTS:
 * npm install playwright csv-writer commander
 * npx playwright install chromium
 *
 * USAGE:
 * node archive-scraper-playwright.js --source all --output archive_review.csv
 * node archive-scraper-playwright.js --source express --max-pages 50
 * node archive-scraper-playwright.js --source guardian --start-date 2024-01-01 --end-date 2025-12-13
 * node archive-scraper-playwright.js --cross-reference existing_urls.csv --headless false
 */

const { chromium } = require('playwright');
const { createObjectCsvWriter } = require('csv-writer');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  TRINIDAD_EXPRESS: {
    baseUrl: 'https://trinidadexpress.com/news/local/',
    pageParam: '?page=',
    maxPages: 50,
    selectors: {
      articleLinks: 'a[href*="/article_"]',
      nextButton: '.pager__item--next a'
    }
  },
  GUARDIAN: {
    baseUrl: 'https://www.guardian.co.tt/archive/',
    selectors: {
      articleLinks: 'article a, .article-link, h2 a, h3 a'
    }
  },
  NEWSDAY: {
    baseUrl: 'https://newsday.co.tt/category/news/',
    pageParam: 'page/',
    maxPages: 50,
    selectors: {
      articleLinks: 'article a[href*="newsday.co.tt"]',
      nextButton: '.nav-links a.next'
    }
  }
};

// Crime keywords for simple scoring
const CRIME_KEYWORDS = ['murder', 'kill', 'shot', 'robbery', 'rape', 'assault', 'kidnap', 'theft', 'burglary', 'shooting', 'stabbing', 'crime', 'police', 'victim', 'arrested'];
const NON_CRIME_KEYWORDS = ['minister', 'rowley', 'court', 'case collapse', 'venezuela', 'election', 'parliament', 'festival', 'carnival', 'sports', 'cricket'];

class PlaywrightArchiveScraper {
  constructor(options = {}) {
    this.headless = options.headless !== false;
    this.delay = options.delay || 1000;
    this.browser = null;
    this.context = null;
  }

  async init() {
    console.log('🚀 Launching browser...');
    this.browser = await chromium.launch({
      headless: this.headless,
      args: ['--no-sandbox']
    });

    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeTrinidadExpress(maxPages = 50) {
    console.log(`📰 Scraping Trinidad Express (up to ${maxPages} pages)...`);
    const urls = new Set();
    const config = CONFIG.TRINIDAD_EXPRESS;

    const page = await this.context.newPage();

    try {
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const pageUrl = `${config.baseUrl}${config.pageParam}${pageNum}`;

        await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 60000 });

        // Wait for article links to load
        await page.waitForSelector(config.selectors.articleLinks, { timeout: 10000 }).catch(() => {});

        // Extract article URLs
        const articleLinks = await page.$$eval(config.selectors.articleLinks, links =>
          links.map(a => a.href).filter(href => href && href.includes('/article_'))
        );

        articleLinks.forEach(url => urls.add(url));

        if (pageNum % 10 === 0) {
          console.log(`  Page ${pageNum}/${maxPages} - ${urls.size} URLs so far`);
        }

        await page.waitForTimeout(this.delay);
      }
    } catch (error) {
      console.error(`⚠️  Error scraping Trinidad Express: ${error.message}`);
    } finally {
      await page.close();
    }

    console.log(`✅ Trinidad Express: ${urls.size} URLs found`);
    return Array.from(urls);
  }

  async scrapeGuardian(startDate = new Date('2024-01-01'), endDate = new Date()) {
    console.log(`📰 Scraping Guardian TT from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}...`);
    const urls = new Set();
    const config = CONFIG.GUARDIAN;

    const page = await this.context.newPage();

    try {
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const archiveUrl = `${config.baseUrl}${dateStr}`;

        try {
          await page.goto(archiveUrl, { waitUntil: 'networkidle', timeout: 30000 });

          // Wait for article links
          await page.waitForSelector(config.selectors.articleLinks, { timeout: 5000 }).catch(() => {});

          // Extract article URLs
          const articleLinks = await page.$$eval(config.selectors.articleLinks, links =>
            links.map(a => a.href).filter(href =>
              href &&
              href.includes('guardian.co.tt') &&
              !href.includes('/archive/') &&
              !href.includes('/category/')
            )
          );

          articleLinks.forEach(url => urls.add(url));

          // Log progress monthly
          if (currentDate.getDate() === 1) {
            console.log(`  ${year}-${month} - ${urls.size} URLs so far`);
          }

        } catch (error) {
          // Silent fail for dates without archives
        }

        // Next day
        currentDate.setDate(currentDate.getDate() + 1);

        await page.waitForTimeout(500);
      }
    } catch (error) {
      console.error(`⚠️  Error scraping Guardian: ${error.message}`);
    } finally {
      await page.close();
    }

    console.log(`✅ Guardian TT: ${urls.size} URLs found`);
    return Array.from(urls);
  }

  async scrapeNewsday(maxPages = 50) {
    console.log(`📰 Scraping Newsday (up to ${maxPages} pages)...`);
    const urls = new Set();
    const config = CONFIG.NEWSDAY;

    const page = await this.context.newPage();

    try {
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const pageUrl = `${config.baseUrl}${config.pageParam}${pageNum}`;

        await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 60000 });

        // Wait for article links to load
        await page.waitForSelector(config.selectors.articleLinks, { timeout: 10000 }).catch(() => {});

        // Extract article URLs
        const articleLinks = await page.$$eval(config.selectors.articleLinks, links =>
          links.map(a => a.href).filter(href => href && href.includes('newsday.co.tt'))
        );

        articleLinks.forEach(url => urls.add(url));

        if (pageNum % 10 === 0) {
          console.log(`  Page ${pageNum}/${maxPages} - ${urls.size} URLs so far`);
        }

        await page.waitForTimeout(this.delay);
      }
    } catch (error) {
      console.error(`⚠️  Error scraping Newsday: ${error.message}`);
    } finally {
      await page.close();
    }

    console.log(`✅ Newsday: ${urls.size} URLs found`);
    return Array.from(urls);
  }

  async fetchTitle(url) {
    """Fetch article title for pre-filter scoring"""
    const page = await this.context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const title = await page.title();
      return title;
    } catch {
      return '';
    } finally {
      await page.close();
    }
  }

  scoreUrl(url, title = '') {
    """Simple pre-filter scoring based on keywords"""
    let score = 0;
    const text = `${url} ${title}`.toLowerCase();

    CRIME_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword)) score += 5;
    });

    NON_CRIME_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword)) score -= 5;
    });

    return score;
  }
}

function crossReferenceUrls(scrapedUrls, existingCsvPath) {
  """Cross-reference scraped URLs with existing CSV"""
  console.log(`🔍 Cross-referencing with ${existingCsvPath}...`);

  try {
    const csvContent = fs.readFileSync(existingCsvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const existingUrls = new Set();

    // Skip header, get URLs from first column
    lines.slice(1).forEach(line => {
      const url = line.split(',')[0]?.trim().replace(/['"]/g, '');
      if (url) existingUrls.add(url);
    });

    const missingUrls = scrapedUrls.filter(url => !existingUrls.has(url));

    console.log(`📊 Total scraped: ${scrapedUrls.length}`);
    console.log(`📊 Existing: ${existingUrls.size}`);
    console.log(`🆕 Missing: ${missingUrls.length}`);

    return missingUrls;

  } catch (error) {
    console.error(`⚠️  Error reading existing CSV: ${error.message}`);
    return scrapedUrls;
  }
}

async function saveToCsv(urls, outputFile, scoreUrls = false, scraper = null) {
  """Save URLs to CSV for manual review"""
  console.log(`💾 Saving ${urls.length} URLs to ${outputFile}...`);

  const csvWriter = createObjectCsvWriter({
    path: outputFile,
    header: [
      { id: 'url', title: 'URL' },
      { id: 'source', title: 'Source' },
      { id: 'dateFound', title: 'Date Found' },
      { id: 'status', title: 'Status' },
      { id: 'score', title: 'Pre-filter Score' },
      { id: 'title', title: 'Title' },
      { id: 'notes', title: 'Notes' }
    ]
  });

  const records = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    // Determine source
    let source = 'Unknown';
    if (url.includes('trinidadexpress.com')) source = 'Trinidad Express';
    else if (url.includes('guardian.co.tt')) source = 'Guardian TT';
    else if (url.includes('newsday.co.tt')) source = 'Newsday';

    // Optional: Fetch title and score
    let title = '';
    let score = 0;

    if (scoreUrls && scraper) {
      if ((i + 1) % 10 === 0) {
        console.log(`  Scoring URL ${i + 1}/${urls.length}...`);
      }
      title = await scraper.fetchTitle(url);
      score = scraper.scoreUrl(url, title);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    records.push({
      url,
      source,
      dateFound: new Date().toISOString().split('T')[0],
      status: 'Pending Review',
      score: scoreUrls ? score : '',
      title,
      notes: ''
    });
  }

  await csvWriter.writeRecords(records);
  console.log(`✅ Saved to ${outputFile}`);
}

async function main() {
  const program = new Command();

  program
    .option('-s, --source <type>', 'News source to scrape (express|guardian|newsday|all)', 'all')
    .option('-m, --max-pages <number>', 'Maximum pages to scrape', '50')
    .option('--start-date <date>', 'Start date for Guardian (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date for Guardian (YYYY-MM-DD)')
    .option('-o, --output <file>', 'Output CSV file', 'archive_review.csv')
    .option('-c, --cross-reference <file>', 'CSV file with existing URLs')
    .option('--score', 'Fetch titles and calculate pre-filter scores (slower)')
    .option('--headless <boolean>', 'Run in headless mode', 'true')
    .option('-d, --delay <number>', 'Delay between requests (ms)', '1000')
    .parse(process.argv);

  const options = program.opts();

  const scraper = new PlaywrightArchiveScraper({
    headless: options.headless === 'true',
    delay: parseInt(options.delay)
  });

  await scraper.init();

  let allUrls = [];

  try {
    // Scrape sources
    if (options.source === 'express' || options.source === 'all') {
      const urls = await scraper.scrapeTrinidadExpress(parseInt(options.maxPages));
      allUrls = allUrls.concat(urls);
    }

    if (options.source === 'guardian' || options.source === 'all') {
      const startDate = options.startDate ? new Date(options.startDate) : new Date('2024-01-01');
      const endDate = options.endDate ? new Date(options.endDate) : new Date();
      const urls = await scraper.scrapeGuardian(startDate, endDate);
      allUrls = allUrls.concat(urls);
    }

    if (options.source === 'newsday' || options.source === 'all') {
      const urls = await scraper.scrapeNewsday(parseInt(options.maxPages));
      allUrls = allUrls.concat(urls);
    }

    // Remove duplicates
    allUrls = [...new Set(allUrls)];
    console.log(`\n📊 Total unique URLs scraped: ${allUrls.length}`);

    // Cross-reference if provided
    if (options.crossReference) {
      allUrls = crossReferenceUrls(allUrls, options.crossReference);
    }

    // Save to CSV
    if (allUrls.length > 0) {
      await saveToCsv(allUrls, options.output, options.score, scraper);
    } else {
      console.log('ℹ️  No URLs to save');
    }

  } finally {
    await scraper.close();
  }
}

main().catch(console.error);
