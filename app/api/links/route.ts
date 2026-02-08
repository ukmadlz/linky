import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session-jwt";
import { canAddLink, createLink } from "@/lib/db/queries";
import { trackAPIError, trackExternalAPIError } from "@/lib/posthog-server-error-tracking";

export async function POST(request: Request) {
	try {
		const session = await getSessionFromRequest(request);

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
		const user = await getUserById(session.userId);
		if (user) {
			try {
				const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
				await fetch(`${baseURL}/api/revalidate`, {
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
					user_id: session.userId,
					username: user.username,
				});
			}
		}

		return NextResponse.json(link, { status: 201 });
	} catch (error) {
		// Track the error in PostHog
		await trackAPIError(error, request, {
			user_id: (await getSessionFromRequest(request))?.userId,
			operation: "create_link",
		});

		console.error("Create link error:", error);
		return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
	}
}
