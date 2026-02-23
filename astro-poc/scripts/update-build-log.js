#!/usr/bin/env node
/**
 * Appends a build summary entry to logs/build-history.json.
 *
 * Called by GitHub Actions after the health check step runs (pass or fail).
 * Fetches /api/health.json from the live site for CSV metrics.
 * Keeps the last 90 entries (approx. 3 months of daily runs).
 *
 * Env vars (set by GitHub Actions):
 *   HEALTH_CHECK_STATUS  — "success" | "failure" (step outcome)
 *
 * Run locally:
 *   HEALTH_CHECK_STATUS=success node astro-poc/scripts/update-build-log.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// logs/ lives at the repo root, two levels up from astro-poc/scripts/
const LOG_PATH = path.join(__dirname, '../../logs/build-history.json');
const BASE_URL = 'https://crimehotspots.com';
const MAX_ENTRIES = 90;

async function main() {
  // ── Read existing log ──────────────────────────────────────────────────────
  let log = { entries: [] };
  if (fs.existsSync(LOG_PATH)) {
    try {
      log = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
      if (!Array.isArray(log.entries)) log.entries = [];
    } catch {
      log = { entries: [] };
    }
  }

  // ── Fetch live health data ─────────────────────────────────────────────────
  let healthData = null;
  try {
    const res = await fetch(`${BASE_URL}/api/health.json`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) healthData = await res.json();
    else console.warn(`health.json returned HTTP ${res.status} — logging without metrics`);
  } catch (err) {
    console.warn(`Could not fetch health.json: ${err.message} — logging without metrics`);
  }

  // ── Build entry ────────────────────────────────────────────────────────────
  const healthCheckStatus = process.env.HEALTH_CHECK_STATUS;
  const entry = {
    logged_at:     new Date().toISOString(),
    health_check:  healthCheckStatus === 'success' ? 'PASS' : 'FAIL',
    // Fields from /api/health.json (null when endpoint was unreachable)
    status:           healthData?.status           ?? null,
    csv_row_count:    healthData?.csv_row_count     ?? null,
    build_time:       healthData?.build_time        ?? null,
    csv_last_fetched: healthData?.csv_last_fetched  ?? null,
    newest_story:     healthData?.newest_story      ?? null,
    oldest_story:     healthData?.oldest_story      ?? null,
  };

  log.entries.push(entry);

  // Keep only the most recent MAX_ENTRIES
  if (log.entries.length > MAX_ENTRIES) {
    log.entries = log.entries.slice(-MAX_ENTRIES);
  }

  // ── Write log ──────────────────────────────────────────────────────────────
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n');

  console.log(`Build history updated — ${log.entries.length} total entries`);
  console.log('Latest entry:');
  console.log(JSON.stringify(entry, null, 2));
}

main().catch((err) => {
  console.error('Error updating build log:', err);
  process.exit(1);
});
