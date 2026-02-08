import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "happy-dom",
		globals: true,
		setupFiles: ["./__tests__/setup.ts"],
		exclude: [
			"node_modules",
			"__tests__/e2e/**",
			"__tests__/a11y/**",
			"__tests__/performance/**",
			"**/*.spec.ts",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: ["node_modules/", "__tests__/", "*.config.ts", ".next/", "docker/"],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./"),
		},
	},
});
