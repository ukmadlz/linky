import { describe, expect, it } from "vitest";

// NOTE: This test file is deprecated as password-based authentication has been removed
// Authentication is now handled exclusively via WorkOS OAuth (Google, Microsoft, Apple)
// See /app/api/auth/oauth/route.ts and /app/api/auth/callback/route.ts for current implementation

describe("Authentication Flow Integration (Deprecated)", () => {
	it("should skip - OAuth authentication is now handled by WorkOS", () => {
		// All authentication is now handled via OAuth providers
		// Users sign in through Google, Microsoft, or Apple
		// No password-based registration or login exists
		expect(true).toBe(true);
	});
});
