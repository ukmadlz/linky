/**
 * Seed test users for E2E testing (OAuth version)
 * Run with: tsx scripts/seed-test-users.ts
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";

const TEST_USERS = [
	{
		email: "testuser@example.com",
		username: "testuser",
		name: "Test User",
		isPro: false,
	},
	{
		email: "freeuser@test.com",
		username: "freeuser",
		name: "Free User",
		isPro: false,
	},
	{
		email: "prouser@test.com",
		username: "prouser",
		name: "Pro User",
		isPro: true,
	},
];

async function seedTestUsers() {
	console.log("🌱 Seeding test users (OAuth version)...");

	for (const testUser of TEST_USERS) {
		try {
			// Check if user already exists
			const existing = await db
				.select()
				.from(users)
				.where(eq(users.email, testUser.email))
				.limit(1);

			if (existing.length > 0) {
				console.log(`✓ User ${testUser.email} already exists`);
				continue;
			}

			// Create OAuth user (no password)
			await db.insert(users).values({
				email: testUser.email,
				id: nanoid(),
				username: testUser.username,
				name: testUser.name,
				emailVerified: true,
				password: null, // OAuth users don't have passwords
				isPro: testUser.isPro,
				theme: JSON.stringify({}),
				workosUserId: `workos_test_${nanoid()}`,
				oauthProvider: "google", // Simulate Google OAuth
			});

			console.log(`✓ Created OAuth user: ${testUser.email}`);
		} catch (error) {
			console.error(`✗ Failed to create ${testUser.email}:`, error);
		}
	}

	console.log("✅ Test user seeding complete!");
	process.exit(0);
}

seedTestUsers().catch((error) => {
	console.error("❌ Seeding failed:", error);
	process.exit(1);
});
