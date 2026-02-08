import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
	apiVersion: "2026-01-28.clover",
	typescript: true,
});

export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "price_placeholder";

export async function createCheckoutSession(userId: string, userEmail: string) {
	const session = await stripe.checkout.sessions.create({
		customer_email: userEmail,
		line_items: [
			{
				price: STRIPE_PRO_PRICE_ID,
				quantity: 1,
			},
		],
		mode: "subscription",
		success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings?success=true`,
		cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings?canceled=true`,
		metadata: {
			userId,
		},
	});

	return session;
}

export async function createPortalSession(customerId: string) {
	const session = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings`,
	});

	return session;
}

export async function getSubscriptionStatus(subscriptionId: string) {
	const subscription = await stripe.subscriptions.retrieve(subscriptionId);
	return subscription.status;
}
