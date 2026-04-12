#!/usr/bin/env node
/**
 * Seed local D1 databases from remote.
 *
 * Pulls all rows from the remote D1 `crimes` table and inserts them into the
 * local Wrangler state so `npm run dev` (wrangler) has real data.
 *
 * Usage:
 *   node scripts/seed-local-d1.js           # seed both TT and JM
 *   node scripts/seed-local-d1.js tt        # Trinidad only
 *   node scripts/seed-local-d1.js jm        # Jamaica only
 *
 * Re-run whenever .wrangler/state/ is wiped or new data is pushed remotely.
 */

const { execSync } = require('child_process');
const { writeFileSync, unlinkSync } = require('fs');
const { join } = require('path');
const os = require('os');

const DATABASES = {
  tt: { binding: 'crime-hotspots-db',         label: 'Trinidad' },
  jm: { binding: 'crime-hotspots-jamaica-db', label: 'Jamaica'  },
};

const COLUMNS = [
  'story_id', 'date', 'headline', 'summary', 'crime_type', 'primary_crime_type',
  'related_crime_types', 'victim_count', 'street', 'area', 'region', 'url', 'source',
  'latitude', 'longitude', 'date_published', 'date_updated', 'slug', 'old_slug',
  'year', 'month', 'day',
];

function escape(v) {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function seedDatabase(key, { binding, label }) {
  console.log(`\n[${label}] Fetching from remote ${binding}...`);

  const inserts = [];
  const batchSize = 500;
  let offset = 0;

  while (true) {
    const raw = execSync(
      `npx wrangler d1 execute ${binding} --remote --json --command "SELECT * FROM crimes ORDER BY rowid LIMIT ${batchSize} OFFSET ${offset};"`,
      { stdio: ['pipe', 'pipe', 'pipe'] }
    ).toString();

    const rows = JSON.parse(raw)[0].results;
    if (!rows.length) break;

    for (const r of rows) {
      const vals = COLUMNS.map(col => escape(r[col])).join(',');
      inserts.push(`INSERT OR IGNORE INTO crimes VALUES(${vals});`);
    }

    process.stdout.write(`\r[${label}] Fetched ${offset + rows.length} rows...`);
    offset += rows.length;
    if (rows.length < batchSize) break;
  }

  console.log(`\n[${label}] Writing ${inserts.length} INSERT statements...`);

  const tmpFile = join(os.tmpdir(), `seed-${key}.sql`);
  writeFileSync(tmpFile, inserts.join('\n'));

  execSync(
    `npx wrangler d1 execute ${binding} --local --file=${tmpFile}`,
    { stdio: 'inherit' }
  );

  unlinkSync(tmpFile);
  console.log(`[${label}] Done — ${inserts.length} rows seeded locally.`);
}

const arg = process.argv[2];
const targets = arg ? [arg] : Object.keys(DATABASES);

for (const key of targets) {
  if (!DATABASES[key]) {
    console.error(`Unknown target "${key}". Use: tt, jm, or omit for both.`);
    process.exit(1);
  }
  seedDatabase(key, DATABASES[key]);
}
