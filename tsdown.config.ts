import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	platform: 'node',
	clean: true,
	outDir: 'dist',
	outExtensions({ format }) {
		return { js: '.js' };
	},
});
