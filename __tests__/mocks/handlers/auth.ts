import crypto from "node:crypto";
import { HttpResponse, http } from "msw";

/**
 * Mock Auth API handlers for testing
 * Mocks JWT-based authentication endpoints
 */

// In-memory storage for mock sessions and users
const mockSessions = new Map<
	string,
	{
		id: string;
		userId: string;
		expiresAt: Date;
		token: string;
	}
>();

const mockUsers = new Map<
	string,
	{
		id: string;
		email: string;
		username: string;
		name: string;
		isPro: boolean;
		createdAt: Date;
	}
>();

export const authHandlers = [
	// Register endpoint
	http.post("*/api/auth/register", async ({ request }) => {
		const body = (await request.json()) as {
			email: string;
			username: string;
			password: string;
			name?: string;
		};

		// Check if user already exists
		const existingUser = Array.from(mockUsers.values()).find(
			(u) => u.email === body.email || u.username === body.username
		);

		if (existingUser) {
			return HttpResponse.json(
				{
					error: "User already exists",
				},
				{ status: 400 }
			);
		}

		// Create new user
		const userId = `usr_${crypto.randomBytes(12).toString("hex")}`;
		const user = {
			id: userId,
			email: body.email,
			username: body.username,
			name: body.name || body.username,
			isPro: false,
			createdAt: new Date(),
		};

		mockUsers.set(userId, user);

		// Create session
		const sessionId = `ses_${crypto.randomBytes(12).toString("hex")}`;
		const sessionToken = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

		mockSessions.set(sessionId, {
			id: sessionId,
			userId,
			expiresAt,
			token: sessionToken,
		});

		return HttpResponse.json(
			{
				user,
				session: {
					id: sessionId,
					token: sessionToken,
					expiresAt: expiresAt.toISOString(),
				},
			},
			{
				headers: {
					"Set-Cookie": `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax`,
				},
			}
		);
	}),

	// Login endpoint
	http.post("*/api/auth/login", async ({ request }) => {
		const body = (await request.json()) as {
			email: string;
			password: string;
		};

		// Find user by email
		const user = Array.from(mockUsers.values()).find((u) => u.email === body.email);

		if (!user) {
			return HttpResponse.json(
				{
					error: "Invalid credentials",
				},
				{ status: 401 }
			);
		}

		// Create session
		const sessionId = `ses_${crypto.randomBytes(12).toString("hex")}`;
		const sessionToken = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

		mockSessions.set(sessionId, {
			id: sessionId,
			userId: user.id,
			expiresAt,
			token: sessionToken,
		});

		return HttpResponse.json(
			{
				user,
				session: {
					id: sessionId,
					token: sessionToken,
					expiresAt: expiresAt.toISOString(),
				},
			},
			{
				headers: {
					"Set-Cookie": `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax`,
				},
			}
		);
	}),

	// Get session endpoint
	http.get("*/api/auth/session", ({ request }) => {
		const cookieHeader = request.headers.get("cookie");
		const sessionToken = cookieHeader
			?.split(";")
			.find((c) => c.trim().startsWith("session="))
			?.split("=")[1];

		if (!sessionToken) {
			return HttpResponse.json({ session: null, user: null });
		}

		const session = Array.from(mockSessions.values()).find((s) => s.token === sessionToken);

		if (!session || session.expiresAt < new Date()) {
			return HttpResponse.json({ session: null, user: null });
		}

		const user = mockUsers.get(session.userId);

		if (!user) {
			return HttpResponse.json({ session: null, user: null });
		}

		return HttpResponse.json({
			session: {
				id: session.id,
				userId: session.userId,
				expiresAt: session.expiresAt.toISOString(),
			},
			user,
		});
	}),

	// Logout endpoint
	http.post("*/api/auth/logout", ({ request }) => {
		const cookieHeader = request.headers.get("cookie");
		const sessionToken = cookieHeader
			?.split(";")
			.find((c) => c.trim().startsWith("session="))
			?.split("=")[1];

		if (sessionToken) {
			const session = Array.from(mockSessions.values()).find((s) => s.token === sessionToken);
			if (session) {
				mockSessions.delete(session.id);
			}
		}

		return HttpResponse.json(
			{ success: true },
			{
				headers: {
					"Set-Cookie": "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
				},
			}
		);
	}),
];

/**
 * Helper function to create a mock user
 */
export function createMockUser(
	overrides: { email?: string; username?: string; name?: string; isPro?: boolean } = {}
) {
	const userId = `usr_${crypto.randomBytes(12).toString("hex")}`;
	const user = {
		id: userId,
		email: overrides.email || `user${userId}@example.com`,
		username: overrides.username || `user${userId}`,
		name: overrides.name || `Test User ${userId}`,
		isPro: overrides.isPro || false,
		createdAt: new Date(),
	};

	mockUsers.set(userId, user);
	return user;
}

/**
 * Helper function to create a mock session
 */
export function createMockSession(userId: string) {
	const sessionId = `ses_${crypto.randomBytes(12).toString("hex")}`;
	const sessionToken = crypto.randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

	const session = {
		id: sessionId,
		userId,
		expiresAt,
		token: sessionToken,
	};

	mockSessions.set(sessionId, session);
	return session;
}

/**
 * Helper function to clear all mock data
 */
export function clearMockAuth() {
	mockSessions.clear();
	mockUsers.clear();
}
