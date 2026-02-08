import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function checkSchema() {
	try {
		const result = await db.execute(sql`
			SELECT column_name, data_type
			FROM information_schema.columns
			WHERE table_name = 'subscriptions'
			ORDER BY ordinal_position
		`);

		console.log("Subscriptions table columns:");
		console.log(result);

		process.exit(0);
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

checkSchema();
