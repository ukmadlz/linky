// Create test users via better-auth API

async function createUser(email: string, password: string, name: string) {
	try {
		const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: "http://localhost:3000",
			},
			body: JSON.stringify({ email, password, name }),
		});

		if (response.ok) {
			const data = await response.json();
			console.log(`✅ Created user: ${email} (ID: ${data.user.id})`);
			return true;
		} else {
			const error = await response.json();
			if (error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
				console.log(`ℹ️  User already exists: ${email}`);
				return true;
			}
			console.error(`❌ Failed to create ${email}:`, error);
			return false;
		}
	} catch (error) {
		console.error(`❌ Error creating ${email}:`, error);
		return false;
	}
}

async function main() {
	console.log("Creating test users...\n");

	await createUser("testuser@example.com", "password123", "Test User");
	await createUser("freeuser@test.com", "password123", "Free User");
	await createUser("prouser@test.com", "password123", "Pro User");

	console.log("\n✅ Test user creation complete!");
	process.exit(0);
}

main();
