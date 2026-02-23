// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import redirectGenerator from './src/integrations/redirectGenerator.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://crimehotspots.com',
  trailingSlash: 'always',
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough', // Use Astro's default image service
  }),
  integrations: [
    sitemap(),
    redirectGenerator()
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});