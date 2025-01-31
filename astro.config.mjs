import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	adapter: cloudflare(),
	site: 'http://localhost:4321',
	integrations: [
		tailwind({
			configFile: './tailwind.config.cjs',
		}),
	],
});