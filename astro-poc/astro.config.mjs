// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import redirectGenerator from './src/integrations/redirectGenerator.ts';
import csvBuildPlugin from './src/integrations/csvBuildPlugin.ts';

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
    sitemap(),
    redirectGenerator(),
  ],
  env: {
    schema: {
      BUTTONDOWN_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_SAFETY_TIPS_GAS_URL: envField.string({ context: 'client', access: 'public', optional: true }),
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
});