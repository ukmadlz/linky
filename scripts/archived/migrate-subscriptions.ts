import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function migrateSubscriptions() {
	try {
		console.log("Migrating subscriptions table...");

		// Rename current_period_start to period_start
		try {
			await db.execute(sql`
				ALTER TABLE subscriptions
				RENAME COLUMN current_period_start TO period_start
			`);
			console.log("✓ Renamed current_period_start to period_start");
		} catch (e: any) {
			if (e.code !== "42703") {
				// Column doesn't exist
				console.log("  period_start already exists or migration done");
			}
		}

		// Rename current_period_end to period_end
		try {
			await db.execute(sql`
				ALTER TABLE subscriptions
				RENAME COLUMN current_period_end TO period_end
			`);
			console.log("✓ Renamed current_period_end to period_end");
		} catch (e: any) {
			if (e.code !== "42703") {
				console.log("  period_end already exists or migration done");
			}
		}

		// Drop unused columns
		const columnsToDelete = ["stripe_customer_id", "price_id", "quantity", "cancel_at_period_end"];

		for (const column of columnsToDelete) {
			try {
				await db.execute(
					sql.raw(`
					ALTER TABLE subscriptions
					DROP COLUMN IF EXISTS ${column}
				`)
				);
				console.log(`✓ Dropped ${column} column`);
			} catch (_e) {
				console.log(`  ${column} already dropped or doesn't exist`);
			}
		}

		console.log("\nMigration complete!");
		process.exit(0);
	} catch (error) {
		console.error("Migration error:", error);
		process.exit(1);
	}
}

migrateSubscriptions();
