/**
 * One-off script to generate crime type thumbnail PNGs.
 * Run with: npx tsx scripts/generate-crime-thumbnails.ts
 */
import { generateAllCrimeTypeThumbnails } from '../src/lib/generateCrimeTypeThumbnails';

async function main() {
  console.log('Generating crime type thumbnails...');
  const urlMap = await generateAllCrimeTypeThumbnails();
  console.log('Generated thumbnails:');
  for (const [type, url] of Object.entries(urlMap)) {
    console.log(`  ${type}: ${url}`);
  }
  console.log('Done!');
}

main().catch(console.error);
