import * as bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/register/route";
import * as queries from "@/lib/db/queries";

// Mock dependencies
vi.mock("@/lib/db/queries");
vi.mock("bcryptjs");

describe("POST /api/register", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should successfully register a new user", async () => {
		// Mock database queries
		vi.mocked(queries.getUserByEmail).mockResolvedValue(null);
		vi.mocked(queries.getUserByUsername).mockResolvedValue(null);
		vi.mocked(queries.createUser).mockResolvedValue({
			id: "1",
			email: "test@example.com",
			username: "testuser",
			name: "Test User",
			password: "hashed",
			bio: null,
			avatarUrl: null,
			theme: "{}",
			isPro: false,
			stripeCustomerId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Mock bcrypt
		vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);

		const request = new Request("http://localhost:3000/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: "test@example.com",
				username: "testuser",
				name: "Test User",
				password: "password123",
			}),
		});

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(201);
		expect(data.success).toBe(true);
		expect(data.user.email).toBe("test@example.com");
		expect(data.user.username).toBe("testuser");
	});

	it("should reject registration with existing email", async () => {
		vi.mocked(queries.getUserByEmail).mockResolvedValue({
			id: "1",
			email: "test@example.com",
			username: "existing",
			name: "Existing",
			password: "hashed",
			bio: null,
			avatarUrl: null,
			theme: "{}",
			isPro: false,
			stripeCustomerId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const request = new Request("http://localhost:3000/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: "test@example.com",
				username: "testuser",
				name: "Test User",
				password: "password123",
			}),
		});

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("Email already exists");
	});

	it("should reject registration with existing username", async () => {
		vi.mocked(queries.getUserByEmail).mockResolvedValue(null);
		vi.mocked(queries.getUserByUsername).mockResolvedValue({
			id: "1",
			email: "other@example.com",
			username: "testuser",
			name: "Existing",
			password: "hashed",
			bio: null,
			avatarUrl: null,
			theme: "{}",
			isPro: false,
			stripeCustomerId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const request = new Request("http://localhost:3000/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: "test@example.com",
				username: "testuser",
				name: "Test User",
				password: "password123",
			}),
		});

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("Username already exists");
	});

	it("should reject registration with short password", async () => {
		const request = new Request("http://localhost:3000/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: "test@example.com",
				username: "testuser",
				name: "Test User",
				password: "short",
			}),
		});

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe("Password must be at least 8 characters");
	});

	it("should reject registration with invalid username", async () => {
		const request = new Request("http://localhost:3000/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: "test@example.com",
				username: "invalid user!",
				name: "Test User",
				password: "password123",
			}),
		});

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain("Username can only contain");
	});
});
