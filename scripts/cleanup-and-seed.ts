import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { users } from "../lib/db/schema";

async function cleanupAndSeed() {
	try {
		console.log("Cleaning up old auth tables...\n");

		// Delete all sessions, accounts, verifications (from better-auth)
		await db.execute(sql`TRUNCATE TABLE sessions CASCADE;`);
		await db.execute(sql`TRUNCATE TABLE accounts CASCADE;`);
		await db.execute(sql`TRUNCATE TABLE verifications CASCADE;`);
		await db.execute(sql`TRUNCATE TABLE users CASCADE;`);

		console.log("✅ Old data cleared\n");

		console.log("Creating test users with new auth system...\n");

		const testUsers = [
			{ email: "testuser@example.com", password: "correctpassword", name: "Test User" },
			{ email: "freeuser@test.com", password: "password123", name: "Free User" },
			{ email: "prouser@test.com", password: "password123", name: "Pro User" },
			{ email: "existing@example.com", password: "password123", name: "Existing User" },
		];

		for (const userData of testUsers) {
			const hashedPassword = await hash(userData.password, 10);
			const userId = nanoid();
			const username = userData.email.split('@')[0] + nanoid(4);

			await db.insert(users).values({
				id: userId,
				email: userData.email,
				password: hashedPassword,
				name: userData.name,
				username,
				emailVerified: false,
				isPro: userData.email.includes("prouser"),
				theme: "{}",
			});

			console.log(`✅ Created: ${userData.email} (ID: ${userId}, username: ${username})`);
		}

		console.log("\n✅ Database ready for new auth system!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

cleanupAndSeed();
