import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";

async function cleanupAndSeed() {
	try {
		console.log("Cleaning up old auth tables...\n");

		// Clear all users and related data
		await db.execute(sql`TRUNCATE TABLE users CASCADE;`);

		console.log("✅ Old data cleared\n");

		console.log("Creating test users with OAuth auth system...\n");

		const testUsers = [
			{ email: "testuser@example.com", name: "Test User", isPro: false },
			{ email: "freeuser@test.com", name: "Free User", isPro: false },
			{ email: "prouser@test.com", name: "Pro User", isPro: true },
			{ email: "existing@example.com", name: "Existing User", isPro: false },
		];

		for (const userData of testUsers) {
			const userId = nanoid();
			const username = userData.email.split("@")[0] + nanoid(4);

			await db.insert(users).values({
				id: userId,
				email: userData.email,
				password: null, // OAuth users don't have passwords
				name: userData.name,
				username,
				emailVerified: true, // OAuth users are auto-verified
				isPro: userData.isPro,
				theme: "{}",
				workosUserId: `workos_test_${nanoid()}`,
				oauthProvider: "google", // Simulate Google OAuth
			});

			console.log(`✅ Created: ${userData.email} (ID: ${userId}, username: ${username})`);
		}

		console.log("\n✅ Database ready for OAuth auth system!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

cleanupAndSeed();
