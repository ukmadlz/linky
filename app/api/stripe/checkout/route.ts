import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session-jwt";
import { getUserById } from "@/lib/db/queries";
import { createCheckoutSession } from "@/lib/stripe";

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

		if (user.isPro) {
			return NextResponse.json({ error: "User is already Pro" }, { status: 400 });
		}

		const checkoutSession = await createCheckoutSession(user.id, user.email);

		return NextResponse.json({ url: checkoutSession.url });
	} catch (error) {
		console.error("Checkout session error:", error);
		return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
	}
}
