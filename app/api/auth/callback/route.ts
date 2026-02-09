import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authenticateWithCode } from "@/lib/workos";
import {
	getUserByEmail,
	getUserByWorkosId,
	createUser,
	updateUserOAuthInfo,
} from "@/lib/db/queries";
import { createSessionToken, setSessionCookie } from "@/lib/session-jwt";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");

	if (!code) {
		return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
	}

	try {
		// Exchange code for user profile from WorkOS
		const workosUser = await authenticateWithCode(code);

		// Determine OAuth provider from email or use generic "oauth"
		const oauthProvider = "oauth";

		// Check if user exists by WorkOS ID or email
		let user = await getUserByWorkosId(workosUser.id);

		if (!user && workosUser.email) {
			user = await getUserByEmail(workosUser.email);
		}

		if (user) {
			// Existing user - update OAuth info
			await updateUserOAuthInfo(user.id, {
				workosUserId: workosUser.id,
				oauthProvider,
				profilePictureUrl: workosUser.profilePictureUrl ?? undefined,
				lastLoginAt: new Date(),
			});
		} else {
			// New user - create account
			const username = workosUser.email
				? `${workosUser.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "")}_${nanoid(6)}`
				: nanoid(12);

			user = await createUser({
				id: nanoid(),
				email: workosUser.email || "",
				workosUserId: workosUser.id,
				oauthProvider,
				username,
				name: `${workosUser.firstName || ""} ${workosUser.lastName || ""}`.trim() || null,
				password: null,
				profilePictureUrl: workosUser.profilePictureUrl ?? null,
				emailVerified: true,
				isPro: false,
				theme: "{}",
			});
		}

		// Create session token
		const token = await createSessionToken({
			userId: user.id,
			email: user.email,
			name: user.name || undefined,
		});

		// Set session cookie
		await setSessionCookie(token);

		// Redirect to dashboard
		return NextResponse.redirect(new URL("/dashboard", request.url));
	} catch (error) {
		console.error("OAuth callback error:", error);
		return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
	}
}
