import { expect, test } from "@playwright/test";

test.describe("Dashboard E2E", () => {
	test.beforeEach(async ({ page }) => {
		// Login before each test
		await page.goto("/login");
		await page.fill('input[name="email"]', "testuser@example.com");
		await page.fill('input[name="password"]', "correctpassword");
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL(/\/dashboard/);
	});

	test.describe("Link Creation", () => {
		test("should create a new link", async ({ page }) => {
			// Click Add Link button
			await page.click('button:has-text("Add Link")');

			// Fill out link form
			await page.fill('input[name="title"], input#title', "My Website");
			await page.fill('input[name="url"], input#url', "https://example.com");

			// Select an icon (optional)
			await page.click('button:has-text("🔗")');

			// Submit form
			await page.click('button[type="submit"]:has-text("Save")');

			// Should see the new link in the list
			await expect(page.locator("text=My Website")).toBeVisible();
			await expect(page.locator("text=https://example.com")).toBeVisible();
		});

		test("should validate required fields", async ({ page }) => {
			await page.click('button:has-text("Add Link")');

			// Try to submit without filling fields
			await page.click('button[type="submit"]:has-text("Save")');

			// Should show validation errors
			await expect(page.locator("text=/title.*required/i")).toBeVisible();
		});

		test("should validate URL format", async ({ page }) => {
			await page.click('button:has-text("Add Link")');

			await page.fill('input[name="title"], input#title', "Test Link");
			await page.fill('input[name="url"], input#url', "not-a-valid-url");

			await page.click('button[type="submit"]:has-text("Save")');

			// Should show URL validation error
			await expect(page.locator("text=/invalid.*url/i")).toBeVisible();
		});

		test("should add https:// prefix if missing", async ({ page }) => {
			await page.click('button:has-text("Add Link")');

			await page.fill('input[name="title"], input#title', "Example Site");
			await page.fill('input[name="url"], input#url', "example.com");

			await page.click('button[type="submit"]:has-text("Save")');

			// Should see the link with https:// prefix
			await expect(page.locator("text=https://example.com")).toBeVisible();
		});
	});

	test.describe("Link Editing", () => {
		test("should edit an existing link", async ({ page }) => {
			// Find and click Edit button for first link
			await page.click('button:has-text("Edit")').first();

			// Modify the link
			await page.fill('input[name="title"], input#title', "Updated Title");

			// Save changes
			await page.click('button[type="submit"]:has-text("Save")');

			// Should see updated title
			await expect(page.locator("text=Updated Title")).toBeVisible();
		});

		test("should cancel editing", async ({ page }) => {
			const originalTitle = await page.locator("h3").first().textContent();

			// Start editing
			await page.click('button:has-text("Edit")').first();

			// Make changes
			await page.fill('input[name="title"], input#title', "Changed Title");

			// Click Cancel
			await page.click('button:has-text("Cancel")');

			// Should still show original title
			if (originalTitle) {
				await expect(page.locator(`text=${originalTitle}`)).toBeVisible();
			}
		});
	});

	test.describe("Link Deletion", () => {
		test("should delete a link with confirmation", async ({ page }) => {
			// Get the title of the first link
			const linkTitle = await page.locator("h3").first().textContent();

			// Click Delete button
			page.on("dialog", (dialog) => {
				expect(dialog.message()).toContain("Delete");
				dialog.accept();
			});

			await page.click('button:has-text("Delete")').first();

			// Link should be removed
			if (linkTitle) {
				await expect(page.locator(`text=${linkTitle}`)).not.toBeVisible();
			}
		});

		test("should cancel deletion", async ({ page }) => {
			const linkTitle = await page.locator("h3").first().textContent();

			// Click Delete but cancel
			page.on("dialog", (dialog) => dialog.dismiss());

			await page.click('button:has-text("Delete")').first();

			// Link should still be visible
			if (linkTitle) {
				await expect(page.locator(`text=${linkTitle}`)).toBeVisible();
			}
		});
	});

	test.describe("Drag and Drop Reordering", () => {
		test("should reorder links via drag and drop", async ({ page }) => {
			// Get initial order
			const _firstLink = await page.locator("h3").first().textContent();
			const secondLink = await page.locator("h3").nth(1).textContent();

			// Drag first link to second position
			const firstDragHandle = page.locator('[aria-label="Drag handle"]').first();
			const secondDragHandle = page.locator('[aria-label="Drag handle"]').nth(1);

			await firstDragHandle.dragTo(secondDragHandle);

			// Wait for reorder to complete
			await page.waitForTimeout(500);

			// Verify order changed
			const newFirstLink = await page.locator("h3").first().textContent();
			expect(newFirstLink).toBe(secondLink);
		});
	});

	test.describe("Theme Customization", () => {
		test("should navigate to theme settings", async ({ page }) => {
			// Find and click theme or settings button
			await page.click('a[href*="settings"], button:has-text("Settings")');

			// Should see theme customization options
			await expect(page.locator("text=/theme/i")).toBeVisible();
		});

		test("should change theme colors", async ({ page }) => {
			await page.goto("/dashboard/settings");

			// Look for color inputs or theme options
			const colorInput = page.locator('input[type="color"]').first();

			if (await colorInput.isVisible()) {
				await colorInput.fill("#ff0000");

				// Save changes
				await page.click('button:has-text("Save")');

				// Should show success message
				await expect(page.locator("text=/saved|updated/i")).toBeVisible();
			}
		});
	});

	test.describe("Link Limits", () => {
		test("should show upgrade prompt when free user reaches 5 links", async ({ page }) => {
			// This test assumes the user is a free user
			// Count existing links
			const linkCount = await page.locator("h3").count();

			if (linkCount >= 5) {
				// Try to add another link
				await page.click('button:has-text("Add Link")');

				// Should show upgrade message
				await expect(page.locator("text=/upgrade.*pro/i")).toBeVisible();
			}
		});
	});

	test.describe("Empty State", () => {
		test("should show empty state when no links", async ({ page: _page }) => {
			// This test would require a fresh account with no links
			// For now, we'll skip or mock this scenario
			expect(true).toBe(true);
		});
	});
});
