import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	site: 'http://localhost:4321',
	integrations: [
		mdx(),
		tailwind({
			configFile: './tailwind.config.cjs',
		}),
	],
});