import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";

export async function POST() {
	const user = await requireAuth();
	const stripe = getStripeClient();

	const priceId = process.env.STRIPE_PRO_PRICE_ID;
	if (!priceId) {
		return NextResponse.json(
			{ error: "Stripe price not configured" },
			{ status: 500 },
		);
	}

	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	const session = await stripe.checkout.sessions.create({
		mode: "subscription",
		payment_method_types: ["card"],
		customer_email: user.email,
		line_items: [{ price: priceId, quantity: 1 }],
		success_url: `${baseUrl}/dashboard?subscription=success`,
		cancel_url: `${baseUrl}/dashboard?subscription=canceled`,
		metadata: { userId: user.id },
		subscription_data: {
			metadata: { userId: user.id },
		},
	});

	return NextResponse.json({ url: session.url });
}
