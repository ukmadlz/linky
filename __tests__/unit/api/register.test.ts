import { describe, expect, it } from "vitest";

// NOTE: This test file is deprecated as password-based authentication has been removed
// Authentication is now handled exclusively via WorkOS OAuth (Google, Microsoft, Apple)
// See /app/api/auth/oauth/route.ts and /app/api/auth/callback/route.ts for current implementation

describe("POST /api/register (Deprecated)", () => {
	it("should skip - password registration no longer exists", () => {
		// Password-based registration has been removed
		// Users now register/login via OAuth providers only
		expect(true).toBe(true);
	});
});
