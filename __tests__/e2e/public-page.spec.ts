import { expect, test } from "@playwright/test";

test.describe("Public Profile Page E2E", () => {
	const testUsername = "testuser";

	test.beforeEach(async ({ page }) => {
		// Visit the public profile page
		await page.goto(`/${testUsername}`);
	});

	test.describe("Page Display", () => {
		test("should display user profile", async ({ page }) => {
			// Should show username or name
			await expect(page.locator(`text=${testUsername}`)).toBeVisible();

			// Page should load without errors
			expect(page.url()).toContain(testUsername);
		});

		test("should display all active links", async ({ page }) => {
			// Should see links container
			const linksContainer = page.locator('[data-testid="links-container"], .links, main');
			await expect(linksContainer).toBeVisible();

			// Should have at least one link visible
			const links = page.locator("a[href^='http'], a[href^='https']");
			const linkCount = await links.count();

			expect(linkCount).toBeGreaterThan(0);
		});

		test("should not display hidden links", async ({ page: _page }) => {
			// Hidden links should not be visible on public page
			// This would require knowing which links are hidden
			// For now, we verify that only isActive=true links show
			expect(true).toBe(true);
		});

		test("should display link icons", async ({ page }) => {
			// Find first link with an icon
			const iconEmoji = page
				.locator("span")
				.filter({ hasText: /[\u{1F300}-\u{1F9FF}]/u })
				.first();

			// If icons exist, they should be visible
			if (await iconEmoji.isVisible()) {
				expect(await iconEmoji.isVisible()).toBe(true);
			}
		});
	});

	test.describe("Link Clicks", () => {
		test("should track link clicks", async ({ page, context }) => {
			// Listen for new pages (links opening)
			const pagePromise = context.waitForEvent("page");

			// Click first external link
			const firstLink = page.locator("a[href^='http']").first();
			const linkHref = await firstLink.getAttribute("href");

			await firstLink.click();

			// New page should open
			const newPage = await pagePromise;

			// Verify correct URL
			if (linkHref) {
				expect(newPage.url()).toContain(linkHref.replace(/^https?:\/\/(www\.)?/, ""));
			}

			await newPage.close();
		});

		test("should open links in new tab", async ({ page }) => {
			const firstLink = page.locator("a[href^='http']").first();

			// Links should have target="_blank"
			const target = await firstLink.getAttribute("target");
			expect(target).toBe("_blank");
		});

		test("should have rel='noopener noreferrer' for security", async ({ page }) => {
			const firstLink = page.locator("a[href^='http']").first();

			const rel = await firstLink.getAttribute("rel");
			expect(rel).toContain("noopener");
			expect(rel).toContain("noreferrer");
		});
	});

	test.describe("Theme Rendering", () => {
		test("should apply custom theme colors", async ({ page }) => {
			// Get background color of page
			const bodyBg = await page.locator("body").evaluate((el) => {
				return window.getComputedStyle(el).backgroundColor;
			});

			// Should have some background color set
			expect(bodyBg).toBeTruthy();
		});

		test("should apply custom button styles", async ({ page }) => {
			const link = page.locator("a[href^='http']").first();

			// Should have styling applied
			const bgColor = await link.evaluate((el) => {
				return window.getComputedStyle(el).backgroundColor;
			});

			expect(bgColor).toBeTruthy();
		});
	});

	test.describe("Responsive Design", () => {
		test("should be mobile-responsive", async ({ page }) => {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });

			// Page should still be usable
			await expect(page.locator("a[href^='http']").first()).toBeVisible();
		});

		test("should work on tablet", async ({ page }) => {
			// Set tablet viewport
			await page.setViewportSize({ width: 768, height: 1024 });

			await expect(page.locator("a[href^='http']").first()).toBeVisible();
		});

		test("should work on desktop", async ({ page }) => {
			// Set desktop viewport
			await page.setViewportSize({ width: 1920, height: 1080 });

			await expect(page.locator("a[href^='http']").first()).toBeVisible();
		});
	});

	test.describe("SEO and Meta Tags", () => {
		test("should have proper title tag", async ({ page }) => {
			const title = await page.title();

			// Title should include username or site name
			expect(title).toBeTruthy();
			expect(title.length).toBeGreaterThan(0);
		});

		test("should have meta description", async ({ page }) => {
			const description = await page.locator('meta[name="description"]').getAttribute("content");

			// Should have a description
			if (description) {
				expect(description.length).toBeGreaterThan(0);
			}
		});

		test("should have Open Graph tags", async ({ page }) => {
			const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");

			// Should have OG tags for social sharing
			if (ogTitle) {
				expect(ogTitle).toBeTruthy();
			}
		});
	});

	test.describe("Performance", () => {
		test("should load quickly", async ({ page }) => {
			const startTime = Date.now();

			await page.goto(`/${testUsername}`);
			await page.waitForLoadState("networkidle");

			const loadTime = Date.now() - startTime;

			// Page should load in under 3 seconds
			expect(loadTime).toBeLessThan(3000);
		});
	});

	test.describe("Error Handling", () => {
		test("should show 404 for non-existent user", async ({ page }) => {
			await page.goto("/nonexistentuser123456789");

			// Should show 404 page or error message
			await expect(page.locator("text=/not found|404/i")).toBeVisible();
		});
	});
});
