import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function updatePasswords() {
	try {
		console.log("Deleting testuser@example.com...");

		// Delete existing test user
		await db.delete(users).where(eq(users.email, "testuser@example.com"));

		console.log("Creating testuser with 'correctpassword'...\n");

		// Create with correct password
		const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: "http://localhost:3000",
			},
			body: JSON.stringify({
				email: "testuser@example.com",
				password: "correctpassword",
				name: "Test User",
			}),
		});

		if (response.ok) {
			const data = await response.json();
			console.log(`✅ Created testuser@example.com (ID: ${data.user.id})`);

			// Verify login works
			const loginResponse = await fetch("http://localhost:3000/api/auth/sign-in/email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Origin: "http://localhost:3000",
				},
				body: JSON.stringify({
					email: "testuser@example.com",
					password: "correctpassword",
				}),
			});

			if (loginResponse.ok) {
				console.log("✅ Login verification successful!");
			} else {
				console.error("❌ Login verification failed");
			}
		} else {
			const error = await response.json();
			console.error("❌ Failed to create user:", error);
		}

		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

updatePasswords();
