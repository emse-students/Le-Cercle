import adapterBun from 'svelte-adapter-bun';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const useNodeAdapter = process.env.ADAPTER === 'node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: useNodeAdapter ? adapterNode() : adapterBun(),
		prerender: {
			handleHttpError: 'warn'
		},
		csrf: {
			trustedOrigins: [
				'http://localhost:5173',
				'http://localhost:3000',
				'http://localhost:5174'
			]
		},
		version: {
			pollInterval: 60000
		}
	}
};

export default config;
