import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
	// eslint-disable-next-line no-var
	var _pgClient: ReturnType<typeof postgres> | undefined;
}

// Lazy-init singleton — reuses connection across hot reloads in dev
const client =
	globalThis._pgClient ??
	// biome-ignore lint/style/noNonNullAssertion: env var is required at startup
	postgres(process.env.DATABASE_URL!, {
		max: 10,
		idle_timeout: 20,
		max_lifetime: 1800,
	});

if (process.env.NODE_ENV !== "production") {
	globalThis._pgClient = client;
}

export const db = drizzle(client, { schema });
