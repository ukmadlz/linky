import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function checkTable() {
	try {
		// Get table structure
		const result = await db.execute(
			sql`SELECT column_name, data_type
			    FROM information_schema.columns
			    WHERE table_name = 'sessions'
			    ORDER BY ordinal_position;`
		);

		console.log("Sessions table columns:");
		console.log(JSON.stringify(result, null, 2));

		// Try to select from sessions
		const sessions = await db.execute(sql`SELECT * FROM sessions LIMIT 1;`);
		console.log("\nSample session (if any):");
		console.log(JSON.stringify(sessions, null, 2));

		process.exit(0);
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

checkTable();
