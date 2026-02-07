import crypto from "node:crypto";
import type Stripe from "stripe";

/**
 * Factory functions for creating mock Stripe webhook events
 */

export function createStripeEvent(type: string, data: Record<string, unknown>): Stripe.Event {
	return {
		id: `evt_test_${crypto.randomBytes(12).toString("hex")}`,
		object: "event",
		api_version: "2023-10-16",
		created: Math.floor(Date.now() / 1000),
		data: {
			object: data as Stripe.Event.Data["object"],
		},
		livemode: false,
		pending_webhooks: 1,
		request: {
			id: null,
			idempotency_key: null,
		},
		type: type as Stripe.Event.Type,
	};
}

/**
 * Sign a Stripe webhook payload for testing
 */
export function signStripeWebhook(payload: string, secret: string, timestamp?: number): string {
	const actualTimestamp = timestamp || Math.floor(Date.now() / 1000);
	const signedPayload = `${actualTimestamp}.${payload}`;
	const signature = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

	return `t=${actualTimestamp},v1=${signature}`;
}

/**
 * Pre-built Stripe event fixtures
 */

export function checkoutSessionCompleted(userId: string): Stripe.Event {
	return createStripeEvent("checkout.session.completed", {
		id: "cs_test_123",
		object: "checkout.session",
		customer: "cus_test_123",
		subscription: "sub_test_123",
		metadata: {
			userId,
		},
		payment_status: "paid",
		status: "complete",
		mode: "subscription",
		amount_total: 900,
		currency: "usd",
	});
}

export function subscriptionCreated(userId: string): Stripe.Event {
	return createStripeEvent("customer.subscription.created", {
		id: "sub_test_123",
		object: "subscription",
		customer: "cus_test_123",
		status: "active",
		items: {
			object: "list",
			data: [
				{
					id: "si_test_123",
					object: "subscription_item",
					price: {
						id: "price_test_123",
						object: "price",
						product: "prod_test_123",
						recurring: {
							interval: "month",
							interval_count: 1,
						},
						unit_amount: 900,
						currency: "usd",
					},
				},
			],
		},
		current_period_start: Math.floor(Date.now() / 1000),
		current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 days
		cancel_at_period_end: false,
		metadata: {
			userId,
		},
	});
}

export function subscriptionUpdated(userId: string): Stripe.Event {
	return createStripeEvent("customer.subscription.updated", {
		id: "sub_test_123",
		object: "subscription",
		customer: "cus_test_123",
		status: "active",
		items: {
			object: "list",
			data: [
				{
					id: "si_test_123",
					object: "subscription_item",
					price: {
						id: "price_test_123",
						object: "price",
						product: "prod_test_123",
					},
				},
			],
		},
		current_period_start: Math.floor(Date.now() / 1000),
		current_period_end: Math.floor(Date.now() / 1000) + 2592000,
		cancel_at_period_end: false,
		metadata: {
			userId,
		},
	});
}

export function subscriptionDeleted(customerId: string): Stripe.Event {
	return createStripeEvent("customer.subscription.deleted", {
		id: "sub_test_123",
		object: "subscription",
		customer: customerId,
		status: "canceled",
		canceled_at: Math.floor(Date.now() / 1000),
		ended_at: Math.floor(Date.now() / 1000),
		items: {
			object: "list",
			data: [
				{
					id: "si_test_123",
					object: "subscription_item",
					price: {
						id: "price_test_123",
						object: "price",
						product: "prod_test_123",
					},
				},
			],
		},
	});
}

export function invoicePaymentFailed(customerId: string): Stripe.Event {
	return createStripeEvent("invoice.payment_failed", {
		id: "in_test_123",
		object: "invoice",
		customer: customerId,
		subscription: "sub_test_123",
		amount_due: 900,
		amount_paid: 0,
		amount_remaining: 900,
		attempt_count: 1,
		attempted: true,
		billing_reason: "subscription_cycle",
		currency: "usd",
		status: "open",
		payment_intent: "pi_test_123",
	});
}

export function invoicePaymentSucceeded(customerId: string): Stripe.Event {
	return createStripeEvent("invoice.payment_succeeded", {
		id: "in_test_123",
		object: "invoice",
		customer: customerId,
		subscription: "sub_test_123",
		amount_due: 900,
		amount_paid: 900,
		amount_remaining: 0,
		billing_reason: "subscription_cycle",
		currency: "usd",
		status: "paid",
		payment_intent: "pi_test_123",
	});
}
