import { db } from "../lib/db";
import { accounts, sessions, users } from "../lib/db/schema";

async function clearAndSeed() {
	try {
		console.log("Clearing all users, accounts, and sessions...");

		// Delete all data
		await db.delete(sessions);
		await db.delete(accounts);
		await db.delete(users);

		console.log("✅ All user data cleared\n");

		console.log("Creating test users via better-auth API...\n");

		const testUsers = [
			{ email: "testuser@example.com", password: "password123", name: "Test User" },
			{ email: "freeuser@test.com", password: "password123", name: "Free User" },
			{ email: "prouser@test.com", password: "password123", name: "Pro User" },
		];

		for (const user of testUsers) {
			const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Origin: "http://localhost:3000",
				},
				body: JSON.stringify(user),
			});

			if (response.ok) {
				const data = await response.json();
				console.log(`✅ Created: ${user.email} (ID: ${data.user.id})`);
			} else {
				const error = await response.json();
				console.error(`❌ Failed to create ${user.email}:`, error);
			}
		}

		console.log("\n✅ Test users seeded successfully!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

clearAndSeed();
