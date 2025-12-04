import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  base: '/',

  // Environment variable configuration for country filtering
  define: {
    'import.meta.env.VITE_COUNTRY_FILTER': JSON.stringify(process.env.VITE_COUNTRY_FILTER || 'all')
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false, // Disable in production for security

    // Multi-page configuration
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        headlinesTrinidad: resolve(__dirname, 'headlines-trinidad-and-tobago.html'),
        headlinesGuyana: resolve(__dirname, 'headlines-guyana.html'),
        headlinesBarbados: resolve(__dirname, 'headlines-barbados.html'),
        dashboardTrinidad: resolve(__dirname, 'dashboard-trinidad.html'),
        dashboardGuyana: resolve(__dirname, 'dashboard-guyana.html'),
        dashboardBarbados: resolve(__dirname, 'dashboard-barbados.html'),
        report: resolve(__dirname, 'report.html'),
        about: resolve(__dirname, 'about.html'),
        blog: resolve(__dirname, 'blog.html'),
        blogPost: resolve(__dirname, 'blog-post.html'),
        faq: resolve(__dirname, 'faq.html'),
        methodology: resolve(__dirname, 'methodology.html')
      },
      output: {
        manualChunks: {
          'vendor': ['dompurify'],
        }
      }
    },

    // Minification (using esbuild, the default)
    minify: 'esbuild',

    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 500
  },

  server: {
    port: 5173,
    strictPort: true,
    open: true,
    headers: {
      // Security headers for development
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  },

  preview: {
    port: 4173,
    strictPort: true,
    headers: {
      // Security headers for preview
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  },

  envPrefix: 'VITE_',

  optimizeDeps: {
    include: ['dompurify']
  }
});
