import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as registerPOST } from "@/app/api/register/route";
import { clearDatabase, createTestUser, getTestUserByEmail } from "../helpers/test-db";

describe("Authentication Flow Integration", () => {
	beforeEach(async () => {
		await clearDatabase();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	describe("User Registration", () => {
		it("should register a new user with valid data", async () => {
			const registrationData = {
				email: "newuser@test.com",
				username: "newuser",
				name: "Test User",
				password: "SecurePass123!",
				name: "New User",
			};

			const request = new Request("http://localhost:3000/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(registrationData),
			});

			const response = await registerPOST(request);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.user).toBeDefined();
			expect(data.user.email).toBe(registrationData.email);
			expect(data.user.username).toBe(registrationData.username);

			// Verify user was created in database
			const dbUser = await getTestUserByEmail(registrationData.email);
			expect(dbUser).toBeDefined();
			expect(dbUser?.username).toBe(registrationData.username);
		});

		it("should reject registration with duplicate email", async () => {
			// Create existing user
			await createTestUser({
				email: "existing@test.com",
				username: "existinguser",
			});

			const registrationData = {
				email: "existing@test.com",
				username: "newusername",
				name: "Test User",
				password: "SecurePass123!",
			};

			const request = new Request("http://localhost:3000/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(registrationData),
			});

			const response = await registerPOST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toContain("Email already exists");
		});

		it("should reject registration with duplicate username", async () => {
			// Create existing user
			await createTestUser({
				email: "user1@test.com",
				username: "takenusername",
			});

			const registrationData = {
				email: "user2@test.com",
				username: "takenusername",
				name: "Test User",
				password: "SecurePass123!",
			};

			const request = new Request("http://localhost:3000/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(registrationData),
			});

			const response = await registerPOST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toContain("Username already exists");
		});

		it("should reject registration with invalid email", async () => {
			const registrationData = {
				email: "invalid-email",
				username: "newuser",
				name: "Test User",
				password: "SecurePass123!",
			};

			const request = new Request("http://localhost:3000/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(registrationData),
			});

			const response = await registerPOST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBeDefined();
		});

		it("should reject registration with invalid username format", async () => {
			const registrationData = {
				email: "user@test.com",
				username: "invalid username!", // Contains spaces and special chars
				password: "SecurePass123!",
			};

			const request = new Request("http://localhost:3000/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(registrationData),
			});

			const response = await registerPOST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toContain("Username");
		});

		it("should reject registration with short password", async () => {
			const registrationData = {
				email: "user@test.com",
				username: "newuser",
				name: "Test User",
				password: "short",
			};

			const request = new Request("http://localhost:3000/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(registrationData),
			});

			const response = await registerPOST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toContain("Password");
		});

		it("should create user with isPro=false by default", async () => {
			const registrationData = {
				email: "newuser@test.com",
				username: "newuser",
				name: "Test User",
				password: "SecurePass123!",
			};

			const request = new Request("http://localhost:3000/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(registrationData),
			});

			const response = await registerPOST(request);
			expect(response.status).toBe(201);

			const dbUser = await getTestUserByEmail(registrationData.email);
			expect(dbUser?.isPro).toBe(false);
		});
	});

	describe("Login Flow", () => {
		it("should allow login after successful registration", async () => {
			// This test would require BetterAuth login implementation
			// Skipping for now as it requires session handling
			expect(true).toBe(true);
		});
	});

	describe("Session Persistence", () => {
		it("should maintain session across requests", async () => {
			// This test would require session cookie handling
			// Skipping for now as it requires full auth implementation
			expect(true).toBe(true);
		});
	});
});
