import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
	checkoutSessionCompleted,
	signStripeWebhook,
	subscriptionDeleted,
} from "@/__tests__/mocks/factories/stripe-events";
import { createMockUser } from "@/__tests__/mocks/handlers/betterauth";
import { POST } from "@/app/api/webhooks/stripe/route";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

describe("Stripe Webhook Handler", () => {
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";

	beforeEach(async () => {
		// Clean up database before each test
		await db.delete(users);
	});

	describe("checkout.session.completed", () => {
		it("should upgrade user to Pro after successful checkout", async () => {
			// Create a test user
			const mockUser = createMockUser({
				email: "test@example.com",
				username: "testuser",
				isPro: false,
			});

			// Insert user into database
			await db.insert(users).values({
				id: mockUser.id,
				email: mockUser.email,
				username: mockUser.username,
				name: mockUser.name,
				isPro: false,
				emailVerified: false,
			});

			// Create checkout completed event
			const event = checkoutSessionCompleted(mockUser.id);
			const payload = JSON.stringify(event);
			const signature = signStripeWebhook(payload, webhookSecret);

			// Create request
			const request = new Request("http://localhost:3000/api/webhooks/stripe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stripe-signature": signature,
				},
				body: payload,
			});

			// Call webhook handler
			const response = await POST(request);

			// Verify response
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body).toEqual({ received: true });

			// Verify user was upgraded
			const [updatedUser] = await db.select().from(users).where(eq(users.id, mockUser.id));
			expect(updatedUser.isPro).toBe(true);
			expect(updatedUser.stripeCustomerId).toBe("cus_test_123");
		});

		it("should reject webhook with invalid signature", async () => {
			const mockUser = createMockUser();
			const event = checkoutSessionCompleted(mockUser.id);
			const payload = JSON.stringify(event);

			const request = new Request("http://localhost:3000/api/webhooks/stripe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stripe-signature": "invalid_signature",
				},
				body: payload,
			});

			const response = await POST(request);

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error).toBe("Invalid signature");
		});
	});

	describe("customer.subscription.deleted", () => {
		it("should downgrade user to Free when subscription is cancelled", async () => {
			// Create a Pro user
			const mockUser = createMockUser({
				email: "pro@example.com",
				username: "prouser",
				isPro: true,
			});

			// Insert Pro user into database
			await db.insert(users).values({
				id: mockUser.id,
				email: mockUser.email,
				username: mockUser.username,
				name: mockUser.name,
				isPro: true,
				stripeCustomerId: "cus_test_123",
				emailVerified: false,
			});

			// Create subscription deleted event
			const event = subscriptionDeleted("cus_test_123");
			const payload = JSON.stringify(event);
			const signature = signStripeWebhook(payload, webhookSecret);

			// Create request
			const request = new Request("http://localhost:3000/api/webhooks/stripe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stripe-signature": signature,
				},
				body: payload,
			});

			// Call webhook handler
			const response = await POST(request);

			// Verify response
			expect(response.status).toBe(200);

			// Verify user was downgraded
			const [updatedUser] = await db.select().from(users).where(eq(users.id, mockUser.id));
			expect(updatedUser.isPro).toBe(false);
		});
	});
});
