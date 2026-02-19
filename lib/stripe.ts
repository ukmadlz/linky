import Stripe from "stripe";

let _client: Stripe | null = null;

export function getStripeClient(): Stripe {
	if (_client) return _client;

	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey) {
		throw new Error("STRIPE_SECRET_KEY is not set");
	}

	_client = new Stripe(secretKey, {
		apiVersion: "2026-01-28.clover",
	});

	return _client;
}
