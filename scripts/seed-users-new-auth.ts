import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";

async function seedUsers() {
	try {
		console.log("Creating test users...\n");

		const testUsers = [
			{ email: "testuser@example.com", password: "correctpassword", name: "Test User" },
			{ email: "freeuser@test.com", password: "password123", name: "Free User" },
			{ email: "prouser@test.com", password: "password123", name: "Pro User" },
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

			// Hash password
			const hashedPassword = await hash(userData.password, 10);

			// Create user
			const userId = nanoid();
			await db.insert(users).values({
				id: userId,
				email: userData.email,
				password: hashedPassword,
				name: userData.name,
				username: null,
				emailVerified: false,
				isPro: userData.email.includes("prouser"),
				theme: "{}",
			});

			console.log(`✅ Created user: ${userData.email} (ID: ${userId})`);
		}

		console.log("\n✅ Test users seeded successfully!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

seedUsers();
