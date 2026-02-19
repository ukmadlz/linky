import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./lib/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: env var is required at startup
		url: process.env.DATABASE_URL!,
	},
});
