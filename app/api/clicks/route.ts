import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { createLinkClick, getLinkById, getUserById, incrementLinkClicks } from "@/lib/db/queries";
import { posthogServer } from "@/lib/posthog";

export async function POST(request: Request) {
	try {
		const { linkId } = await request.json();

		if (!linkId) {
			return NextResponse.json({ error: "Link ID is required" }, { status: 400 });
		}

		// Get link
		const link = await getLinkById(linkId);
		if (!link) {
			return NextResponse.json({ error: "Link not found" }, { status: 404 });
		}

		// Increment click count
		await incrementLinkClicks(linkId);

		// Check if user is Pro for detailed tracking
		const user = await getUserById(link.userId);

		// Store detailed click data for Pro users
		if (user?.isPro) {
			const userAgent = request.headers.get("user-agent") || undefined;
			const referrer = request.headers.get("referer") || undefined;

			// Store in database
			await createLinkClick({
				id: nanoid(),
				linkId,
				userAgent,
				referrer,
				// Country and city would be extracted from IP in production
				country: undefined,
				city: undefined,
			});
		}

		// Track with PostHog server-side
		posthogServer.capture({
			distinctId: link.userId,
			event: "link_clicked_server",
			properties: {
				linkId: link.id,
				linkTitle: link.title,
				linkUrl: link.url,
				userId: link.userId,
				isPro: user?.isPro || false,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Click tracking error:", error);
		return NextResponse.json({ error: "Failed to track click" }, { status: 500 });
	}
}
