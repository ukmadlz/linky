import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as stripeWebhookPOST } from "@/app/api/webhooks/stripe/route";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import {
	clearDatabase,
	countSubscriptions,
	createTestSubscription,
	createTestUser,
} from "../helpers/test-db";
import {
	checkoutSessionCompleted,
	signStripeWebhook,
	subscriptionDeleted,
} from "../mocks/factories/stripe-events";

// Mock Stripe
vi.mock("@/lib/stripe", () => ({
	stripe: {
		webhooks: {
			constructEvent: vi.fn(),
		},
		subscriptions: {
			retrieve: vi.fn(),
		},
	},
}));

describe("Subscription Integration", () => {
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";

	beforeEach(async () => {
		await clearDatabase();
		vi.clearAllMocks();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	describe("Checkout Flow", () => {
		it("should upgrade user to Pro after successful checkout", async () => {
			const user = await createTestUser({
				email: "free@test.com",
				username: "freeuser",
				isPro: false,
			});

			expect(user.isPro).toBe(false);

			// Create checkout completed webhook event
			const event = checkoutSessionCompleted(user.id);
			const payload = JSON.stringify(event);
			const signature = signStripeWebhook(payload, webhookSecret);

			// Mock Stripe webhook constructEvent to return the event
			vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event);

			// Mock Stripe subscriptions.retrieve to return subscription data
			vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
				id: "sub_test_123",
				object: "subscription",
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
							} as any,
						} as any,
					],
				},
				current_period_start: Math.floor(Date.now() / 1000),
				current_period_end: Math.floor(Date.now() / 1000) + 2592000,
			} as any);

			const request = new Request("http://localhost:3000/api/webhooks/stripe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stripe-signature": signature,
				},
				body: payload,
			});

			const response = await stripeWebhookPOST(request);
			expect(response.status).toBe(200);

			// Verify user was upgraded
			const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id));
			expect(updatedUser.isPro).toBe(true);
			expect(updatedUser.stripeCustomerId).toBe("cus_test_123");
		});

		it("should create subscription record after checkout", async () => {
			const user = await createTestUser({
				email: "newpro@test.com",
				username: "newpro",
				isPro: false,
			});

			const event = checkoutSessionCompleted(user.id);
			const payload = JSON.stringify(event);
			const signature = signStripeWebhook(payload, webhookSecret);

			// Mock Stripe webhook constructEvent to return the event
			vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event);

			// Mock Stripe subscriptions.retrieve to return subscription data
			vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
				id: "sub_test_123",
				object: "subscription",
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
							} as any,
						} as any,
					],
				},
				current_period_start: Math.floor(Date.now() / 1000),
				current_period_end: Math.floor(Date.now() / 1000) + 2592000,
			} as any);

			const request = new Request("http://localhost:3000/api/webhooks/stripe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stripe-signature": signature,
				},
				body: payload,
			});

			await stripeWebhookPOST(request);

			// Verify subscription was created
			const subCount = await countSubscriptions();
			expect(subCount).toBeGreaterThan(0);

			const [subscription] = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.userId, user.id));

			expect(subscription).toBeDefined();
			expect(subscription.status).toBe("active");
		});
	});

	describe("Subscription Cancellation", () => {
		it("should downgrade user to Free when subscription is cancelled", async () => {
			const user = await createTestUser({
				email: "pro@test.com",
				username: "prouser",
				isPro: true,
				stripeCustomerId: "cus_test_123",
			});

			await createTestSubscription(user.id, {
				status: "active",
			});

			expect(user.isPro).toBe(true);

			// Create subscription deleted webhook event
			const event = subscriptionDeleted("cus_test_123");
			const payload = JSON.stringify(event);
			const signature = signStripeWebhook(payload, webhookSecret);

			// Mock Stripe webhook constructEvent to return the event
			vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event);

			const request = new Request("http://localhost:3000/api/webhooks/stripe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stripe-signature": signature,
				},
				body: payload,
			});

			const response = await stripeWebhookPOST(request);
			expect(response.status).toBe(200);

			// Verify user was downgraded
			const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id));
			expect(updatedUser.isPro).toBe(false);
		});

		it("should delete subscription record when cancelled", async () => {
			const user = await createTestUser({
				email: "pro@test.com",
				username: "prouser",
				isPro: true,
				stripeCustomerId: "cus_test_123",
			});

			await createTestSubscription(user.id, {
				status: "active",
			});

			const countBefore = await countSubscriptions();
			expect(countBefore).toBe(1);

			// Cancel subscription
			const event = subscriptionDeleted("cus_test_123");
			const payload = JSON.stringify(event);
			const signature = signStripeWebhook(payload, webhookSecret);

			// Mock Stripe webhook constructEvent to return the event
			vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event);

			const request = new Request("http://localhost:3000/api/webhooks/stripe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stripe-signature": signature,
				},
				body: payload,
			});

			await stripeWebhookPOST(request);

			// Verify subscription was deleted
			const countAfter = await countSubscriptions();
			expect(countAfter).toBe(0);
		});
	});

	describe("Feature Unlocking", () => {
		it("should unlock Pro features immediately after upgrade", async () => {
			const user = await createTestUser({
				email: "upgrade@test.com",
				username: "upgradeuser",
				isPro: false,
			});

			// Process checkout webhook
			const event = checkoutSessionCompleted(user.id);
			const payload = JSON.stringify(event);
			const signature = signStripeWebhook(payload, webhookSecret);

			// Mock Stripe webhook constructEvent to return the event
			vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event);

			// Mock Stripe subscriptions.retrieve to return subscription data
			vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
				id: "sub_test_123",
				object: "subscription",
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
							} as any,
						} as any,
					],
				},
				current_period_start: Math.floor(Date.now() / 1000),
				current_period_end: Math.floor(Date.now() / 1000) + 2592000,
			} as any);

			const request = new Request("http://localhost:3000/api/webhooks/stripe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stripe-signature": signature,
				},
				body: payload,
			});

			await stripeWebhookPOST(request);

			// Verify Pro status
			const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id));
			expect(updatedUser.isPro).toBe(true);

			// In a real application, this would unlock:
			// - Unlimited links
			// - Advanced themes
			// - Analytics access
			// - Custom branding removal
		});

		it("should lock Pro features after downgrade", async () => {
			const user = await createTestUser({
				email: "downgrade@test.com",
				username: "downgradeuser",
				isPro: true,
				stripeCustomerId: "cus_test_downgrade",
			});

			await createTestSubscription(user.id);

			// Process cancellation webhook
			const event = subscriptionDeleted("cus_test_downgrade");
			const payload = JSON.stringify(event);
			const signature = signStripeWebhook(payload, webhookSecret);

			// Mock Stripe webhook constructEvent to return the event
			vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event);

			const request = new Request("http://localhost:3000/api/webhooks/stripe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stripe-signature": signature,
				},
				body: payload,
			});

			await stripeWebhookPOST(request);

			// Verify Free status
			const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id));
			expect(updatedUser.isPro).toBe(false);

			// In a real application, this would lock Pro features
		});
	});

	describe("Webhook Security", () => {
		it("should reject webhook with invalid signature", async () => {
			const user = await createTestUser();
			const event = checkoutSessionCompleted(user.id);
			const payload = JSON.stringify(event);

			// Mock Stripe webhook constructEvent to throw error for invalid signature
			vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
				const error = new Error("Unable to extract timestamp and signatures from header");
				(error as any).type = "StripeSignatureVerificationError";
				throw error;
			});

			const request = new Request("http://localhost:3000/api/webhooks/stripe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stripe-signature": "invalid_signature",
				},
				body: payload,
			});

			const response = await stripeWebhookPOST(request);
			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.error).toBe("Invalid signature");
		});

		it("should reject webhook with missing signature", async () => {
			const user = await createTestUser();
			const event = checkoutSessionCompleted(user.id);
			const payload = JSON.stringify(event);

			const request = new Request("http://localhost:3000/api/webhooks/stripe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: payload,
			});

			const response = await stripeWebhookPOST(request);
			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.error).toBe("No signature");
		});
	});
});
