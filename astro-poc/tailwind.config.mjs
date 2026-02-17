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
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
			},
			fontSize: {
				// DESIGN SYSTEM v2: Strict 4-level type scale
				// 2 weights only: font-normal (400) and font-bold (700)
				'display': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],      // 32px — hero text, page titles
				'heading': ['1.375rem', { lineHeight: '1.35', letterSpacing: '-0.01em' }], // 22px — section/card headings
				'body': ['1.125rem', { lineHeight: '1.65' }],                               // 18px — all reading content
				'caption': ['0.75rem', { lineHeight: '1.35', letterSpacing: '0.02em' }],   // 12px — metadata, badges, labels
			},
			minHeight: {
				'22': '22px',     // Legacy — prefer min-h-button
				'30': '30px',     // Large button height
				'button': '22px', // Named token for standard button height
			},
			borderRadius: {
				'DEFAULT': '0.5rem', // 8px — default for all components
				'lg': '0.75rem',     // 12px — modals, large cards
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
