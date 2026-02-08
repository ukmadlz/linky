/**
 * Seed test users via better-auth API
 * Run with: tsx scripts/seed-test-users-api.ts
 */

const TEST_USERS = [
	{
		email: "testuser@example.com",
		name: "Test User",
		password: "correctpassword",
	},
	{
		email: "freeuser@test.com",
		name: "Free User",
		password: "FreeUser123!",
	},
	{
		email: "prouser@test.com",
		name: "Pro User",
		password: "ProUser123!",
	},
];

async function seedTestUsers() {
	console.log("🌱 Seeding test users via better-auth API...");
	const baseURL = "http://localhost:3000";

	for (const testUser of TEST_USERS) {
		try {
			const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Origin: baseURL,
				},
				body: JSON.stringify(testUser),
			});

			const data = await response.json();

			if (!response.ok) {
				console.log(`⚠️  User ${testUser.email}: ${data.message || "Already exists or error"}`);
				console.log(`   Response:`, data);
				continue;
			}

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
