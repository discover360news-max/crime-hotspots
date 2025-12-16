/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				// Rose palette (Primary/Accent)
				'rose-50': '#fff1f2',
				'rose-600': '#e11d48',
				'rose-700': '#be123c',

				// Slate palette (Text & Backgrounds)
				'slate-50': '#f8fafc',
				'slate-100': '#f1f5f9',
				'slate-200': '#e2e8f0',
				'slate-300': '#cbd5e1',
				'slate-400': '#94a3b8',
				'slate-500': '#64748b',
				'slate-600': '#475569',
				'slate-700': '#334155',
				'slate-800': '#1e293b',
				'slate-900': '#0f172a',
			},
			fontFamily: {
				sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
			},
			fontSize: {
				// Typography system from DESIGN-TOKENS.md
				'display': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],  // 36px
				'h1': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em' }],          // 32px
				'h2': ['1.5rem', { lineHeight: '2rem' }],                                     // 24px
				'h3': ['1.25rem', { lineHeight: '1.75rem' }],                                 // 20px
				'body': ['1rem', { lineHeight: '1.5rem' }],                                   // 16px
				'small': ['0.875rem', { lineHeight: '1.25rem' }],                            // 14px
				'tiny': ['0.75rem', { lineHeight: '1rem' }],                                  // 12px
				'nav': ['0.9375rem', { lineHeight: '1.25rem' }],                             // 15px
			},
			minHeight: {
				'22': '22px',  // Standard button height
				'30': '30px',  // Large button height
			},
			borderRadius: {
				'DEFAULT': '0.5rem',  // 8px - default for all components
				'lg': '0.5rem',       // 8px - buttons, cards
			},
			backdropBlur: {
				'xs': '2px',
				'sm': '4px',
				'DEFAULT': '8px',
				'md': '12px',
				'lg': '16px',
			},
		},
	},
	plugins: [],
}
