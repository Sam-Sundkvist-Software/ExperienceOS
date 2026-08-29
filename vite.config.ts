import { defineConfig } from "vite";
import { resolve } from "node:path";
import { glob } from "glob";

const __dirname = import.meta.dirname;

const root = resolve(__dirname, "src");
const appsDir = resolve(root, "apps");

const appEntries = Object.fromEntries(
	glob.sync("**/*.{js,ts}", {
		cwd: appsDir,
		ignore: [
			"**/node_modules/**",
			"**/*.test.*",
			"**/*.spec*",
		],
	}).map((file) => [
		`apps/${file.replace(/\.(js|ts)$/, "")}`,
		resolve(appsDir, file),
	])
);

export default defineConfig({
	root: resolve(__dirname, "src"),
	base: "./",
	publicDir: false,
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
			"@apps": resolve(__dirname, "src/apps"),
			"@system": resolve(__dirname, "src/system"),
			"@data": resolve(__dirname, "src/data"),
			"@theme": resolve(__dirname, "src/theme"),
		},
	},
	build: {
		outDir: resolve(__dirname, "public/dist"),
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: resolve(root, "index.html"),
				...appEntries,
			},
			output: {
				entryFileNames: (chunk) => {
					if (chunk.name.startsWith("apps/")) {
						return "[name].js";
					}

					return "assets/[name]-[hash].js";
				},
				chunkFileNames: "assets/[name]-[hash].js",
				assetFileNames: "assets/[name]-[hash][extname]",
			},
		},
	},
});
