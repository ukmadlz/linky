import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function fixSubscriptionsSchema() {
	try {
		console.log("Adding stripe_price_id column to subscriptions table...");

		// Check if column exists
		const checkQuery = sql`
			SELECT column_name
			FROM information_schema.columns
			WHERE table_name = 'subscriptions'
			AND column_name = 'stripe_price_id'
		`;

		const result = await db.execute(checkQuery);

		if (!result || result.length === 0) {
			// Column doesn't exist, add it
			await db.execute(sql`
				ALTER TABLE subscriptions
				ADD COLUMN stripe_price_id VARCHAR(255) NOT NULL DEFAULT 'price_unknown'
			`);

			console.log("✓ Added stripe_price_id column");
		} else {
			console.log("✓ stripe_price_id column already exists");
		}

		process.exit(0);
	} catch (error) {
		console.error("Error fixing schema:", error);
		process.exit(1);
	}
}

fixSubscriptionsSchema();
