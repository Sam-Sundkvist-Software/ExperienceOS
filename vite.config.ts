import path from "path";
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, '.', '');
	return {
		root: path.resolve(__dirname, "public/src"),

		build: {
			outDir: path.resolve(__dirname, "public/dist"),
		},

		resolve: {
			alias: {
				'@': path.resolve(__dirname, '.'),
			},
		},

		server: {
		},
	};
});
