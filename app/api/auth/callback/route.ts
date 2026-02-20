import { type NextRequest, NextResponse } from "next/server";
import { createUser, getUserByWorkosId } from "@/lib/db/queries";
import { captureServerError, captureServerEvent } from "@/lib/posthog/server";
import { saveSession } from "@/lib/session";
import { getWorkOS } from "@/lib/workos";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const code = searchParams.get("code");

	if (!code) {
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/login?error=no_code`,
		);
	}

	try {
		const workos = getWorkOS();

		// Exchange code for authenticated user
		const { user: workosUser } =
			await workos.userManagement.authenticateWithCode({
				code,
				// biome-ignore lint/style/noNonNullAssertion: env var is required at startup
				clientId: process.env.WORKOS_CLIENT_ID!,
			});

		// Find or create the user in our DB
		let dbUser = await getUserByWorkosId(workosUser.id);
		let isNewUser = false;

		if (!dbUser) {
			isNewUser = true;
			dbUser = await createUser({
				email: workosUser.email,
				workosUserId: workosUser.id,
				name:
					workosUser.firstName && workosUser.lastName
						? `${workosUser.firstName} ${workosUser.lastName}`
						: (workosUser.firstName ?? undefined),
				avatarUrl: workosUser.profilePictureUrl ?? undefined,
			});
		}

		const hasUsername = !!dbUser.username;

		// Set session — include username so middleware can gate without a DB hit
		await saveSession({ userId: dbUser.id, username: dbUser.username ?? null });

		if (hasUsername) {
			// Returning user with a username — fire logged-in event and send to dashboard
			captureServerEvent(dbUser.id, "user_logged_in", {
				provider: "google",
			}).catch(console.error);

			return NextResponse.redirect(
				`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
			);
		}

		// New user or returning user without username — send to onboarding.
		// Welcome email, default page creation, and user_signed_up event are all
		// deferred to onboarding completion (where the username is known).
		// For returning users without username, skip the signed_up event.
		if (isNewUser) {
			// Store email domain so we can fire the event after onboarding
			// (handled in /api/auth/onboarding)
		}

		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
		);
	} catch (error) {
		console.error("[Auth callback]", error);
		captureServerError(error, { route: "/api/auth/callback" }).catch(console.error);
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_failed`,
		);
	}
}
