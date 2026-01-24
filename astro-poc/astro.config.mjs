// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://crimehotspots.com',
  output: 'server', // SSR mode with selective pre-rendering via getStaticPaths()
  adapter: cloudflare({
    imageService: 'passthrough', // Use Astro's default image service
  }),
  integrations: [
    sitemap()
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});