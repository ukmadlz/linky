/**
 * Seed test users for E2E testing
 * Run with: tsx scripts/seed-test-users.ts
 */

import { hash } from "bcryptjs";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const TEST_USERS = [
	{
		email: "testuser@example.com",
		username: "testuser",
		name: "Test User",
		password: "correctpassword",
		isPro: false,
	},
	{
		email: "freeuser@test.com",
		username: "freeuser",
		name: "Free User",
		password: "FreeUser123!",
		isPro: false,
	},
	{
		email: "prouser@test.com",
		username: "prouser",
		name: "Pro User",
		password: "ProUser123!",
		isPro: true,
	},
];

async function seedTestUsers() {
	console.log("🌱 Seeding test users...");

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

			// Hash password
			const hashedPassword = await hash(testUser.password, 10);

			// Create user
			await db.insert(users).values({
				email: testUser.email,
				username: testUser.username,
				name: testUser.name,
				emailVerified: true,
				password: hashedPassword,
				isPro: testUser.isPro,
				theme: JSON.stringify({}),
			});

			console.log(`✓ Created user: ${testUser.email}`);
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
