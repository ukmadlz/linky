import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigration() {
	try {
		console.log("Running accounts table migration...");

		const migrationSQL = readFileSync(
			join(__dirname, "update-accounts-schema.sql"),
			"utf-8"
		);

		// Execute the migration
		await db.execute(sql.raw(migrationSQL));

		console.log("✅ Migration completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	}
}

runMigration();
