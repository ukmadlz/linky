import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function checkSessions() {
	try {
		const sessions = await db.execute(
			sql`SELECT id, user_id, token, created_at
			    FROM sessions
			    ORDER BY created_at DESC
			    LIMIT 5;`
		);

		console.log("Recent sessions:");
		console.log(JSON.stringify(sessions, null, 2));

		process.exit(0);
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

checkSessions();
