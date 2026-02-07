import { http, HttpResponse } from "msw";

/**
 * Mock Stripe API handlers for testing
 */

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export const stripeHandlers = [
	// Create checkout session
	http.post(`${STRIPE_API_BASE}/checkout/sessions`, async () => {
		return HttpResponse.json({
			id: "cs_test_123",
			object: "checkout.session",
			url: "https://checkout.stripe.com/pay/cs_test_123",
			customer: "cus_test_123",
			metadata: {
				userId: "test-user-id",
			},
			payment_status: "unpaid",
			status: "open",
		});
	}),

	// Retrieve checkout session
	http.get(`${STRIPE_API_BASE}/checkout/sessions/:sessionId`, ({ params }) => {
		const { sessionId } = params;
		return HttpResponse.json({
			id: sessionId,
			object: "checkout.session",
			customer: "cus_test_123",
			subscription: "sub_test_123",
			metadata: {
				userId: "test-user-id",
			},
			payment_status: "paid",
			status: "complete",
		});
	}),

	// Create billing portal session
	http.post(`${STRIPE_API_BASE}/billing_portal/sessions`, async () => {
		return HttpResponse.json({
			id: "bps_test_123",
			object: "billing_portal.session",
			url: "https://billing.stripe.com/session/test_123",
			customer: "cus_test_123",
		});
	}),

	// Retrieve customer
	http.get(`${STRIPE_API_BASE}/customers/:customerId`, ({ params }) => {
		const { customerId } = params;
		return HttpResponse.json({
			id: customerId,
			object: "customer",
			email: "test@example.com",
			metadata: {
				userId: "test-user-id",
			},
			subscriptions: {
				data: [
					{
						id: "sub_test_123",
						status: "active",
						items: {
							data: [
								{
									price: {
										id: "price_test_123",
										product: "prod_test_123",
									},
								},
							],
						},
						current_period_start: Math.floor(Date.now() / 1000),
						current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 days
					},
				],
			},
		});
	}),

	// Retrieve subscription
	http.get(`${STRIPE_API_BASE}/subscriptions/:subscriptionId`, ({ params }) => {
		const { subscriptionId } = params;
		return HttpResponse.json({
			id: subscriptionId,
			object: "subscription",
			status: "active",
			customer: "cus_test_123",
			items: {
				data: [
					{
						id: "si_test_123",
						price: {
							id: "price_test_123",
							product: "prod_test_123",
							recurring: {
								interval: "month",
							},
							unit_amount: 900,
							currency: "usd",
						},
					},
				],
			},
			current_period_start: Math.floor(Date.now() / 1000),
			current_period_end: Math.floor(Date.now() / 1000) + 2592000,
			cancel_at_period_end: false,
		});
	}),

	// Cancel subscription
	http.delete(`${STRIPE_API_BASE}/subscriptions/:subscriptionId`, ({ params }) => {
		const { subscriptionId } = params;
		return HttpResponse.json({
			id: subscriptionId,
			object: "subscription",
			status: "canceled",
			customer: "cus_test_123",
			canceled_at: Math.floor(Date.now() / 1000),
			cancel_at_period_end: false,
		});
	}),

	// List subscriptions
	http.get(`${STRIPE_API_BASE}/subscriptions`, () => {
		return HttpResponse.json({
			object: "list",
			data: [
				{
					id: "sub_test_123",
					object: "subscription",
					status: "active",
					customer: "cus_test_123",
				},
			],
			has_more: false,
		});
	}),
];
