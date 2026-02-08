import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function testConnection() {
	try {
		console.log("Testing database connection...");
		console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));

		const result = await db.execute(sql`SELECT 1 as test`);
		console.log("✅ Database connection successful!");
		console.log("Result:", result);
		process.exit(0);
	} catch (error) {
		console.error("❌ Database connection failed:");
		console.error(error);
		process.exit(1);
	}
}

testConnection();
