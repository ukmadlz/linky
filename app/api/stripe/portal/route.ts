import { NextResponse } from "next/server";
import { getUserById } from "@/lib/db/queries";
import { getSessionFromRequest } from "@/lib/session-jwt";
import { createPortalSession } from "@/lib/stripe";

export async function POST(request: Request) {
	try {
		const session = await getSessionFromRequest(request);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await getUserById(session.userId);
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		if (!user.stripeCustomerId) {
			return NextResponse.json({ error: "No Stripe customer ID found" }, { status: 400 });
		}

		const portalSession = await createPortalSession(user.stripeCustomerId);

		return NextResponse.json({ url: portalSession.url });
	} catch (error) {
		console.error("Portal session error:", error);
		return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
	}
}
