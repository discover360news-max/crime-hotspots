#!/usr/bin/env node
/**
 * Daily health check for crimehotspots.com
 *
 * Checks:
 *   1. /api/health.json  — all required fields present, data is fresh
 *   2. /sitemap-0.xml    — URL count is reasonable
 *   3. 5 random story pages (new slugs)  → expect HTTP 200
 *   4. 5 random old redirect URLs        → expect HTTP 301 (not 500)
 *
 * Exits 0 on full PASS, 1 on any FAIL (triggers GitHub Actions failure email).
 *
 * Run locally:  node astro-poc/scripts/health-check.js
 * Run in CI:    node astro-poc/scripts/health-check.js  (from repo root)
 */

import https from 'https';
import fs    from 'fs';
import path  from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL          = 'https://crimehotspots.com';
const REDIRECT_MAP_PATH = path.join(__dirname, '../src/data/redirect-map.json');

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

/** Fetch URL body as parsed JSON, following redirects (native Node 18+ fetch). */
async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Fetch URL body as text, following redirects. */
async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/**
 * Get the raw HTTP status of a URL WITHOUT following redirects.
 * Uses Node's https module, which does not auto-follow 3xx responses.
 * This is how we verify 301 redirects are working.
 */
function getRawStatus(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 10_000 }, (res) => {
      res.resume(); // drain body so socket is released
      resolve({
        statusCode: res.statusCode,
        location: res.headers.location ?? null,
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout: ${url}`));
    });
  });
}

/** Pick n random items from an array. */
function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}

/** How many hours ago was an ISO timestamp? */
function hoursAgo(isoString) {
  return (Date.now() - new Date(isoString).getTime()) / 3_600_000;
}

// ─── Individual checks ────────────────────────────────────────────────────────

async function checkHealthEndpoint(failures) {
  console.log('\n── 1. Health endpoint  /api/health.json');
  let data = null;
  try {
    data = await fetchJson(`${BASE_URL}/api/health.json`);
  } catch (err) {
    const msg = `Failed to fetch: ${err.message}`;
    console.log(`   ❌ FAIL — ${msg}`);
    failures.push(`Health endpoint: ${msg}`);
    return null;
  }

  const requiredFields = [
    'status', 'csv_last_fetched', 'csv_row_count',
    'oldest_story', 'newest_story', 'build_time',
  ];
  const missing = requiredFields.filter(f => data[f] == null);
  if (missing.length > 0) {
    const msg = `Missing fields: ${missing.join(', ')}`;
    console.log(`   ❌ FAIL — ${msg}`);
    failures.push(`Health endpoint: ${msg}`);
    return data;
  }

  // status === "ok"
  if (data.status !== 'ok') {
    console.log(`   ❌ FAIL — status: "${data.status}" (expected "ok")`);
    failures.push(`Health endpoint: status is "${data.status}"`);
  } else {
    console.log(`   ✓  status: ${data.status}`);
  }

  // Row count sanity (> 100; actual count is 2400+)
  if (data.csv_row_count < 100) {
    console.log(`   ❌ FAIL — csv_row_count: ${data.csv_row_count} (suspiciously low)`);
    failures.push(`Health endpoint: csv_row_count ${data.csv_row_count} < 100`);
  } else {
    console.log(`   ✓  csv_row_count: ${data.csv_row_count}`);
  }

  // CSV fetched within 48 h (tolerates weekend builds)
  const fetchAge = hoursAgo(data.csv_last_fetched);
  if (fetchAge > 48) {
    console.log(`   ❌ FAIL — csv_last_fetched: ${fetchAge.toFixed(1)}h ago (>48h)`);
    failures.push(`Health endpoint: csv_last_fetched is ${fetchAge.toFixed(1)}h ago`);
  } else {
    console.log(`   ✓  csv_last_fetched: ${fetchAge.toFixed(1)}h ago`);
  }

  // Newest story within 14 days (data pipeline is alive)
  const newestAge = hoursAgo(data.newest_story + 'T12:00:00Z') / 24;
  if (newestAge > 14) {
    console.log(`   ❌ FAIL — newest_story: ${data.newest_story} (${newestAge.toFixed(1)} days ago, >14d)`);
    failures.push(`Health endpoint: newest_story is ${newestAge.toFixed(1)} days ago`);
  } else {
    console.log(`   ✓  newest_story: ${data.newest_story} (${newestAge.toFixed(1)} days ago)`);
  }

  return data;
}

async function checkSitemap(failures) {
  console.log('\n── 2. Sitemap  /sitemap-0.xml');
  try {
    const xml = await fetchText(`${BASE_URL}/sitemap-0.xml`);
    const urlCount = (xml.match(/<loc>/g) ?? []).length;

    if (urlCount < 100) {
      console.log(`   ❌ FAIL — only ${urlCount} URLs (expected >100)`);
      failures.push(`Sitemap: only ${urlCount} URLs`);
    } else {
      console.log(`   ✓  ${urlCount.toLocaleString()} URLs found`);
    }
    return urlCount;
  } catch (err) {
    const msg = `Failed to fetch: ${err.message}`;
    console.log(`   ❌ FAIL — ${msg}`);
    failures.push(`Sitemap: ${msg}`);
    return 0;
  }
}

async function checkStoryPages(failures) {
  console.log('\n── 3. Story pages  (5 random new slugs → expect 200)');

  let redirectMap;
  try {
    redirectMap = JSON.parse(fs.readFileSync(REDIRECT_MAP_PATH, 'utf8'));
  } catch (err) {
    const msg = `Cannot read redirect-map.json: ${err.message}`;
    console.log(`   ❌ FAIL — ${msg}`);
    failures.push(`Story pages: ${msg}`);
    return;
  }

  const newPaths = pickRandom(Object.values(redirectMap), 5);
  for (const urlPath of newPaths) {
    const url = `${BASE_URL}${urlPath}`;
    try {
      const { statusCode } = await getRawStatus(url);
      if (statusCode === 200) {
        console.log(`   ✓  200  ${urlPath}`);
      } else {
        const msg = `Expected 200, got ${statusCode}: ${urlPath}`;
        console.log(`   ❌ FAIL — ${msg}`);
        failures.push(`Story page: ${msg}`);
      }
    } catch (err) {
      const msg = `Error on ${urlPath}: ${err.message}`;
      console.log(`   ❌ FAIL — ${msg}`);
      failures.push(`Story page: ${msg}`);
    }
  }
}

async function checkRedirects(failures) {
  console.log('\n── 4. Old redirect URLs  (5 random → expect 301, not 500)');

  let redirectMap;
  try {
    redirectMap = JSON.parse(fs.readFileSync(REDIRECT_MAP_PATH, 'utf8'));
  } catch (err) {
    const msg = `Cannot read redirect-map.json: ${err.message}`;
    console.log(`   ❌ FAIL — ${msg}`);
    failures.push(`Redirects: ${msg}`);
    return;
  }

  const oldPaths = pickRandom(Object.keys(redirectMap), 5);
  for (const urlPath of oldPaths) {
    const url = `${BASE_URL}${urlPath}`;
    try {
      const { statusCode, location } = await getRawStatus(url);
      if (statusCode === 301) {
        console.log(`   ✓  301  ${urlPath}`);
        console.log(`        →  ${location}`);
      } else if (statusCode >= 500) {
        const msg = `Server error ${statusCode} on old URL: ${urlPath}`;
        console.log(`   ❌ FAIL — ${msg}`);
        failures.push(`Redirect: ${msg}`);
      } else {
        const msg = `Expected 301, got ${statusCode}: ${urlPath}`;
        console.log(`   ❌ FAIL — ${msg}`);
        failures.push(`Redirect: ${msg}`);
      }
    } catch (err) {
      const msg = `Error on ${urlPath}: ${err.message}`;
      console.log(`   ❌ FAIL — ${msg}`);
      failures.push(`Redirect: ${msg}`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('crimehotspots.com — Daily Health Check');
  console.log(`Timestamp : ${new Date().toISOString()}`);
  console.log(`Target    : ${BASE_URL}`);

  const failures = [];

  await checkHealthEndpoint(failures);
  await checkSitemap(failures);
  await checkStoryPages(failures);
  await checkRedirects(failures);

  console.log('\n' + '─'.repeat(55));
  if (failures.length === 0) {
    console.log('✅ PASS — all checks passed');
    process.exit(0);
  } else {
    console.log(`❌ FAIL — ${failures.length} check(s) failed:`);
    for (const f of failures) console.log(`   • ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
