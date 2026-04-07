import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte'],
	preprocess: [vitePreprocess()],
	vitePlugin: {
		inspector: true,
	},
	kit: {
		adapter: adapter(),
		csrf: {
			checkOrigin: false,
		},
		paths: {
			base: '/admin',
		},
	}
};

export default config;
