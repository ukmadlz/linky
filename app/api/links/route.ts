import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAddLink, createLink } from "@/lib/db/queries";
import { trackAPIError, trackExternalAPIError } from "@/lib/posthog-server-error-tracking";

export async function POST(request: Request) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { title, url, icon, userId, position } = await request.json();

		// Check if user can add more links
		const allowed = await canAddLink(userId);
		if (!allowed) {
			return NextResponse.json(
				{ error: "Free users are limited to 5 links. Upgrade to Pro for unlimited links." },
				{ status: 403 }
			);
		}

		const link = await createLink({
			userId,
			title,
			url,
			icon,
			position,
			isActive: true,
			clicks: 0,
		});

		// Trigger revalidation
		const { getUserById } = await import("@/lib/db/queries");
		const user = await getUserById(session.user.id);
		if (user) {
			try {
				await fetch(`${process.env.BETTER_AUTH_URL}/api/revalidate`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						secret: process.env.REVALIDATE_SECRET,
						username: user.username,
					}),
				});
			} catch (revalidateError) {
				// Track revalidation API failure but don't fail the request
				await trackExternalAPIError("revalidate-api", revalidateError, {
					endpoint: "/api/revalidate",
					user_id: session.user.id,
					username: user.username,
				});
			}
		}

		return NextResponse.json(link, { status: 201 });
	} catch (error) {
		// Track the error in PostHog
		await trackAPIError(error, request, {
			user_id: (await auth.api.getSession({ headers: request.headers }))?.user?.id,
			operation: "create_link",
		});

		console.error("Create link error:", error);
		return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
	}
}
