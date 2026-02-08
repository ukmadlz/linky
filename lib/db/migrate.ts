import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Run Drizzle migrations
 * This will apply all pending migrations from the drizzle folder
 */
export async function runMigrations() {
	console.log("🔄 Running database migrations...");

	const connectionString =
		process.env.DATABASE_URL || "postgresql://linky:linky@localhost:5432/linky";

	// Create a postgres connection for migrations
	const migrationClient = postgres(connectionString, { max: 1 });

	// Create drizzle instance
	const db = drizzle(migrationClient);

	try {
		// Run migrations
		await migrate(db, { migrationsFolder: "./drizzle" });

		console.log("✅ Migrations completed successfully!");
	} catch (error) {
		console.error("❌ Migration failed:", error);
		throw error;
	} finally {
		// Close the connection
		await migrationClient.end();
	}
}

// Run migrations if this file is executed directly
if (require.main === module) {
	runMigrations()
		.then(() => {
			console.log("Migration process completed");
			process.exit(0);
		})
		.catch((error) => {
			console.error("Migration process failed:", error);
			process.exit(1);
		});
}
