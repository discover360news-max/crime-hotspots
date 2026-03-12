// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import pagefind from 'astro-pagefind';
import redirectGenerator from './src/integrations/redirectGenerator.ts';
import csvBuildPlugin from './src/integrations/csvBuildPlugin.ts';
import pagefindCrimeIndexer from './src/integrations/pagefindCrimeIndexer.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://crimehotspots.com',
  trailingSlash: 'always',
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough', // Use Astro's default image service
  }),
  integrations: [
    csvBuildPlugin(),
    pagefind(),
    sitemap(),
    redirectGenerator(),
    pagefindCrimeIndexer()
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});