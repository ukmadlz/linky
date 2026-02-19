import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { getStripeClient } from "@/lib/stripe";

export async function POST() {
	const user = await requireAuth();
	const stripe = getStripeClient();

	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	// Find the user's Stripe subscription to get the customer ID
	const [sub] = await db
		.select({ stripeSubscriptionId: subscriptions.stripeSubscriptionId })
		.from(subscriptions)
		.where(eq(subscriptions.userId, user.id))
		.limit(1);

	if (!sub) {
		return NextResponse.json(
			{ error: "No subscription found" },
			{ status: 404 },
		);
	}

	// Retrieve subscription from Stripe to get customer ID
	const stripeSub = await stripe.subscriptions.retrieve(
		sub.stripeSubscriptionId,
	);
	const customerId = stripeSub.customer as string;

	const portalSession = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: `${baseUrl}/settings`,
	});

	return NextResponse.json({ url: portalSession.url });
}
