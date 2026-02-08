import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigration() {
	try {
		console.log("Adding updatedAt columns...");

		const migrationSQL = readFileSync(
			join(__dirname, "add-updated-at.sql"),
			"utf-8"
		);

		await db.execute(sql.raw(migrationSQL));

		console.log("✅ Migration completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	}
}

runMigration();
