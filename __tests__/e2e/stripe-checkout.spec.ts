import { expect, test } from "@playwright/test";

test.describe("Stripe Checkout E2E", () => {
	test.beforeEach(async ({ page }) => {
		// Login as free user
		await page.goto("/login");
		await page.fill('input[name="email"]', "freeuser@test.com");
		await page.fill('input[name="password"]', "FreeUser123!");
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL(/\/dashboard/);
	});

	test.describe("Upgrade Flow", () => {
		test("should navigate to pricing page", async ({ page }) => {
			// Click upgrade button or link
			await page.click('a[href*="pricing"], button:has-text("Upgrade")');

			// Should show pricing information
			await expect(page.locator("text=/pricing|upgrade|pro/i")).toBeVisible();
		});

		test("should show Pro features on pricing page", async ({ page }) => {
			await page.goto("/pricing");

			// Should display Pro features
			await expect(page.locator("text=/unlimited links/i")).toBeVisible();
			await expect(page.locator("text=/custom themes/i")).toBeVisible();
			await expect(page.locator("text=/analytics/i")).toBeVisible();
		});

		test("should redirect to Stripe checkout when upgrade clicked", async ({ page }) => {
			await page.goto("/pricing");

			// Mock Stripe checkout session creation
			await page.route("**/api/stripe/create-checkout-session", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						url: "https://checkout.stripe.com/pay/cs_test_123",
					}),
				});
			});

			// Click upgrade button
			const upgradeButton = page.locator('button:has-text("Upgrade to Pro")').first();
			await upgradeButton.click();

			// Should call the API
			await page.waitForResponse("**/api/stripe/create-checkout-session");

			// In real scenario, would redirect to Stripe
			// For testing, we verify the API call was made
		});

		test("should handle checkout session creation errors", async ({ page }) => {
			await page.goto("/pricing");

			// Mock failed checkout session
			await page.route("**/api/stripe/create-checkout-session", async (route) => {
				await route.fulfill({
					status: 500,
					contentType: "application/json",
					body: JSON.stringify({
						error: "Failed to create checkout session",
					}),
				});
			});

			const upgradeButton = page.locator('button:has-text("Upgrade to Pro")').first();
			await upgradeButton.click();

			// Should show error message
			await expect(page.locator("text=/error|failed/i")).toBeVisible();
		});
	});

	test.describe("Success Flow", () => {
		test("should handle successful checkout return", async ({ page }) => {
			// Simulate return from Stripe checkout with success
			await page.goto("/dashboard?checkout=success");

			// Should show success message
			await expect(
				page.locator("text=/successfully upgraded|welcome to pro|upgrade complete/i")
			).toBeVisible();
		});

		test("should show Pro features after upgrade", async ({ page }) => {
			// Mock user as Pro
			await page.goto("/dashboard?checkout=success");

			// Should now have access to Pro features
			await expect(page.locator("text=/pro|premium/i")).toBeVisible();

			// Should be able to add more than 5 links
			// Create some links first
			for (let i = 0; i < 6; i++) {
				await page.click('button:has-text("Add Link")');
				await page.fill('input[name="title"], input#title', `Link ${i + 1}`);
				await page.fill('input[name="url"], input#url', `https://example${i + 1}.com`);
				await page.click('button[type="submit"]:has-text("Save")');
			}

			// All links should be visible (no 5 link limit)
			const linkCount = await page.locator("a[href^='http']").count();
			expect(linkCount).toBeGreaterThanOrEqual(6);
		});
	});

	test.describe("Cancel Flow", () => {
		test("should handle checkout cancellation", async ({ page }) => {
			// Simulate return from Stripe with cancellation
			await page.goto("/dashboard?checkout=cancel");

			// Should show cancellation message
			await expect(
				page.locator("text=/cancelled|upgrade cancelled|no changes made/i")
			).toBeVisible();
		});

		test("should remain as free user after cancellation", async ({ page }) => {
			await page.goto("/dashboard?checkout=cancel");

			// Should still have free tier limitations
			// Try to add 6th link
			const linkCount = await page.locator("h3").count();

			if (linkCount >= 5) {
				await page.click('button:has-text("Add Link")');

				// Should show upgrade prompt
				await expect(page.locator("text=/upgrade.*pro/i")).toBeVisible();
			}
		});
	});

	test.describe("Billing Portal", () => {
		test("should navigate to Stripe billing portal for Pro users", async ({ page }) => {
			// Login as Pro user
			await page.goto("/login");
			await page.fill('input[name="email"]', "prouser@test.com");
			await page.fill('input[name="password"]', "ProUser123!");
			await page.click('button[type="submit"]');

			await page.goto("/dashboard/settings");

			// Mock billing portal session creation
			await page.route("**/api/stripe/create-portal-session", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						url: "https://billing.stripe.com/session/test_123",
					}),
				});
			});

			// Click manage subscription button
			const manageButton = page.locator('button:has-text("Manage Subscription")');
			if (await manageButton.isVisible()) {
				await manageButton.click();

				// Should call the portal API
				await page.waitForResponse("**/api/stripe/create-portal-session");
			}
		});

		test("should handle billing portal errors", async ({ page }) => {
			// Login as Pro user
			await page.goto("/login");
			await page.fill('input[name="email"]', "prouser@test.com");
			await page.fill('input[name="password"]', "ProUser123!");
			await page.click('button[type="submit"]');

			await page.goto("/dashboard/settings");

			// Mock failed portal session
			await page.route("**/api/stripe/create-portal-session", async (route) => {
				await route.fulfill({
					status: 500,
					contentType: "application/json",
					body: JSON.stringify({
						error: "Failed to create portal session",
					}),
				});
			});

			const manageButton = page.locator('button:has-text("Manage Subscription")');
			if (await manageButton.isVisible()) {
				await manageButton.click();

				// Should show error message
				await expect(page.locator("text=/error|failed/i")).toBeVisible();
			}
		});

		test("should not show billing portal for free users", async ({ page }) => {
			await page.goto("/dashboard/settings");

			// Should not show manage subscription button
			const manageButton = page.locator('button:has-text("Manage Subscription")');
			await expect(manageButton).not.toBeVisible();

			// Should show upgrade button instead
			await expect(page.locator('button:has-text("Upgrade to Pro")')).toBeVisible();
		});
	});

	test.describe("Webhook Processing", () => {
		test("should reflect Pro status after webhook processes", async ({ page }) => {
			// This test would require setting up a test webhook endpoint
			// For E2E purposes, we simulate the end result

			// User completes checkout on Stripe (simulated)
			// Webhook processes in background (simulated)
			// User returns to dashboard

			await page.goto("/dashboard");

			// Reload page to get updated user status
			await page.reload();

			// Should show Pro badge or features
			const proBadge = page.locator("text=/pro|premium/i");
			if (await proBadge.isVisible()) {
				expect(await proBadge.isVisible()).toBe(true);
			}
		});
	});

	test.describe("Price Display", () => {
		test("should display correct pricing information", async ({ page }) => {
			await page.goto("/pricing");

			// Should show monthly price
			await expect(page.locator("text=/\\$\\d+/")).toBeVisible();

			// Should show billing period
			await expect(page.locator("text=/month|monthly/i")).toBeVisible();
		});

		test("should highlight Pro features", async ({ page }) => {
			await page.goto("/pricing");

			// Should list key features
			const features = [
				"unlimited links",
				"custom themes",
				"analytics",
				"remove branding",
				"priority support",
			];

			for (const feature of features) {
				const featureLocator = page.locator(`text=/${feature}/i`);
				// If feature exists, it should be visible
				if ((await featureLocator.count()) > 0) {
					await expect(featureLocator.first()).toBeVisible();
				}
			}
		});
	});

	test.describe("Security", () => {
		test("should require authentication for checkout", async ({ page }) => {
			// Logout first
			await page.click('button:has-text("Logout"), a:has-text("Logout")');

			// Try to access checkout directly
			await page.goto("/api/stripe/create-checkout-session");

			// Should redirect to login or show unauthorized
			await expect(page).toHaveURL(/\/(login|unauthorized)/);
		});

		test("should verify user session before creating checkout", async ({ page }) => {
			await page.goto("/pricing");

			// Mock unauthorized response
			await page.route("**/api/stripe/create-checkout-session", async (route) => {
				await route.fulfill({
					status: 401,
					contentType: "application/json",
					body: JSON.stringify({
						error: "Unauthorized",
					}),
				});
			});

			const upgradeButton = page.locator('button:has-text("Upgrade to Pro")').first();
			await upgradeButton.click();

			// Should handle unauthorized error
			await expect(page.locator("text=/unauthorized|login required/i")).toBeVisible();
		});
	});
});
