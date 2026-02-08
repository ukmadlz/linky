import postgres from "postgres";

/**
 * Initialize migration tracking for existing database
 * This marks existing migrations as applied without re-running them
 */
async function initMigrationTracking() {
	console.log("🔄 Initializing migration tracking...");

	const connectionString =
		process.env.DATABASE_URL || "postgresql://linky:linky@localhost:5432/linky";

	const sql = postgres(connectionString, { max: 1 });

	try {
		// Create drizzle schema if it doesn't exist
		await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;

		// Create the migration tracking table in drizzle schema
		await sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `;

		console.log("✅ Created drizzle.__drizzle_migrations table");

		// Check if migrations are already tracked
		const existing = await sql`
      SELECT hash FROM drizzle.__drizzle_migrations
    `;

		if (existing.length > 0) {
			console.log(
				`ℹ️  Found ${existing.length} existing migration records, skipping initialization`
			);
			return;
		}

		// Mark existing migrations as applied
		// Using the migration tags from drizzle/meta/_journal.json as hashes
		const migrations = [
			{
				hash: "0000_skinny_ego",
				created_at: 1770369154650,
			},
			{
				hash: "0001_fix_subscriptions_table",
				created_at: 1739048400000,
			},
			{
				hash: "0002_add_updated_at_columns",
				created_at: 1739048460000,
			},
		];

		for (const migration of migrations) {
			await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${migration.hash}, ${migration.created_at})
      `;
		}

		console.log(`✅ Marked ${migrations.length} existing migrations as applied`);
		console.log("✅ Migration tracking initialized successfully!");
		console.log("\nYou can now run 'npm run db:migrate' for future migrations");
	} catch (error) {
		console.error("❌ Initialization failed:", error);
		throw error;
	} finally {
		await sql.end();
	}
}

// Run if executed directly
if (require.main === module) {
	initMigrationTracking()
		.then(() => {
			console.log("Initialization completed");
			process.exit(0);
		})
		.catch((error) => {
			console.error("Initialization failed:", error);
			process.exit(1);
		});
}
