import { nanoid } from "nanoid";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";

async function seedUsers() {
	try {
		console.log("Creating test users (OAuth version)...\n");

		const testUsers = [
			{ email: "testuser@example.com", name: "Test User", isPro: false },
			{ email: "freeuser@test.com", name: "Free User", isPro: false },
			{ email: "prouser@test.com", name: "Pro User", isPro: true },
		];

		for (const userData of testUsers) {
			// Check if user already exists
			const existing = await db.query.users.findFirst({
				where: (users, { eq }) => eq(users.email, userData.email),
			});

			if (existing) {
				console.log(`ℹ️  User already exists: ${userData.email}`);
				continue;
			}

			// Create OAuth user (no password)
			const userId = nanoid();
			await db.insert(users).values({
				id: userId,
				email: userData.email,
				password: null, // OAuth users don't have passwords
				name: userData.name,
				username: null,
				emailVerified: true, // OAuth users are auto-verified
				isPro: userData.isPro,
				theme: "{}",
				workosUserId: `workos_test_${nanoid()}`,
				oauthProvider: "google", // Simulate Google OAuth
			});

			console.log(`✅ Created OAuth user: ${userData.email} (ID: ${userId})`);
		}

		console.log("\n✅ Test users seeded successfully!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

seedUsers();
