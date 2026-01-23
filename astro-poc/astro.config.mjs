// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://crimehotspots.com',
  output: 'server', // Enable SSR mode (pages are SSR by default, use prerender: true for static)
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