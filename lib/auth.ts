import { redirect } from "next/navigation";
import { getUserById } from "./db/queries";
import type { User } from "./db/schema";
import { getSession } from "./session";

/**
 * Reads the session and returns the authenticated user.
 * Redirects to /login if not authenticated.
 * Use in Server Components and Route Handlers.
 */
export async function requireAuth(): Promise<User> {
	const session = await getSession();

	if (!session.userId) {
		redirect("/login");
	}

	const user = await getUserById(session.userId);
	if (!user) {
		redirect("/login");
	}

	// Second-layer guard: if user hasn't completed onboarding, redirect there
	if (!user.username) {
		redirect("/onboarding");
	}

	return user;
}

/**
 * Returns the authenticated user or null if not authenticated.
 * Does not redirect — use for optional auth checks.
 */
export async function getAuthUser(): Promise<User | null> {
	try {
		const session = await getSession();
		if (!session.userId) return null;
		return getUserById(session.userId);
	} catch {
		return null;
	}
}
