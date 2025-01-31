/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#f5f3ff',
					100: '#ede9fe',
					200: '#ddd6fe',
					300: '#c4b5fd',
					400: '#a78bfa',
					500: '#8b5cf6',
					600: '#7c3aed',
					700: '#6d28d9',
					800: '#5b21b6',
					900: '#4c1d95',
					950: '#2e1065',
				},
				dark: {
					DEFAULT: '#0B0F1A',
					50: '#171C2C',
					100: '#1E2333',
					200: '#262B3B',
					300: '#2E3444',
					400: '#363C4D',
					500: '#3E4456',
					600: '#464C5F',
					700: '#4E5468',
					800: '#565C71',
					900: '#5E647A',
				},
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'gradient-mesh': 'url("/mesh-gradient.png")',
			},
			animation: {
				'glow-pulse': 'glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			},
			keyframes: {
				'glow-pulse': {
					'0%, 100%': {
						opacity: '1',
					},
					'50%': {
						opacity: '.5',
					},
				},
			},
			typography: {
				DEFAULT: {
					css: {
						maxWidth: '100ch',
						color: '#fff',
						'h1, h2, h3, h4': {
							color: '#fff',
							fontWeight: '600',
						},
						a: {
							color: '#8b5cf6',
							'&:hover': {
								color: '#7c3aed',
							},
						},
					},
				},
			},
			boxShadow: {
				'glow-sm': '0 0 15px rgba(139, 92, 246, 0.3)',
				'glow-md': '0 0 25px rgba(139, 92, 246, 0.4)',
				'glow-lg': '0 0 35px rgba(139, 92, 246, 0.5)',
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('@tailwindcss/line-clamp'),
	],
}