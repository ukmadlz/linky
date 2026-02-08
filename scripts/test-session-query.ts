import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function testQuery() {
	try {
		const token = "irQMvdfHQvPuJr6po4ALKW02ivk7dn3M";

		console.log(`Testing query for token: ${token}\n`);

		// Run the same query better-auth is running
		const result = await db.execute(
			sql`SELECT "id", "user_id", "expires_at", "token", "ip_address", "user_agent", "created_at", "updated_at"
			    FROM "sessions"
			    WHERE "sessions"."token" = ${token}`
		);

		console.log("Query succeeded!");
		console.log("Result:", JSON.stringify(result, null, 2));

		process.exit(0);
	} catch (error) {
		console.error("Query failed:", error);
		process.exit(1);
	}
}

testQuery();
