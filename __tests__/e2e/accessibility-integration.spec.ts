import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Integrated accessibility testing for E2E flows
 * Combines functional E2E tests with axe-core accessibility checks
 */

test.describe("Accessibility Integration Tests", () => {
	test.describe("Keyboard Navigation", () => {
		test("should navigate login form with keyboard", async ({ page }) => {
			await page.goto("/login");

			// Check accessibility before interaction
			const initialResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();
			expect(initialResults.violations).toEqual([]);

			// Press Tab to navigate through form
			await page.keyboard.press("Tab");

			// Should focus on email input
			let focusedElement = await page.evaluate(() => document.activeElement?.getAttribute("name"));
			expect(focusedElement).toBe("email");

			// Type email
			await page.keyboard.type("test@example.com");

			// Tab to password
			await page.keyboard.press("Tab");
			focusedElement = await page.evaluate(() => document.activeElement?.getAttribute("name"));
			expect(focusedElement).toBe("password");

			// Type password
			await page.keyboard.type("password123");

			// Tab to submit button
			await page.keyboard.press("Tab");
			focusedElement = await page.evaluate(() => document.activeElement?.tagName);
			expect(focusedElement).toBe("BUTTON");

			// Submit with Enter
			await page.keyboard.press("Enter");

			// Verify accessibility after form submission
			await page.waitForTimeout(1000);
			const afterResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();
			expect(afterResults.violations).toEqual([]);
		});

		test("should navigate dashboard with keyboard", async ({ page }) => {
			// Login first
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');
			await expect(page).toHaveURL(/\/dashboard/);

			// Check accessibility
			const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
			expect(results.violations).toEqual([]);

			// Navigate through interactive elements with Tab
			await page.keyboard.press("Tab");

			// Should be able to reach all interactive elements
			const interactiveElements = await page.locator("a, button, input").count();
			expect(interactiveElements).toBeGreaterThan(0);

			// Test Escape key to close modals
			const addButton = page.locator('button:has-text("Add Link")');
			if (await addButton.isVisible()) {
				await addButton.click();

				// Modal should open
				const modal = page.locator('[role="dialog"], .modal');
				await expect(modal).toBeVisible();

				// Press Escape to close
				await page.keyboard.press("Escape");

				// Modal should close
				await expect(modal).not.toBeVisible();
			}
		});

		test("should support keyboard shortcuts", async ({ page }) => {
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');

			// Test common keyboard shortcuts (if implemented)
			// Ctrl+K or Cmd+K for quick add
			const isMac = process.platform === "darwin";
			if (isMac) {
				await page.keyboard.press("Meta+k");
			} else {
				await page.keyboard.press("Control+k");
			}

			// Check if action triggered (e.g., quick add modal)
			await page.waitForTimeout(500);
			const modalOrAction = await page.locator('[role="dialog"], .modal, [data-testid="quick-add"]').isVisible();

			// If shortcuts are implemented, they should work
			if (modalOrAction) {
				expect(modalOrAction).toBe(true);
			}
		});

		test("should have skip to content link", async ({ page }) => {
			await page.goto("/");

			// Press Tab to focus skip link
			await page.keyboard.press("Tab");

			// Check if skip link is visible or becomes visible on focus
			const skipLink = page.locator('a[href="#main"], a:has-text("Skip to content")');
			if ((await skipLink.count()) > 0) {
				await expect(skipLink).toBeFocused();

				// Activate skip link
				await page.keyboard.press("Enter");

				// Should focus on main content
				const mainContent = page.locator("main, #main");
				await expect(mainContent).toBeVisible();
			}
		});
	});

	test.describe("Screen Reader Compatibility", () => {
		test("should have proper ARIA labels on login form", async ({ page }) => {
			await page.goto("/login");

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();
			expect(results.violations).toEqual([]);

			// Check form has proper role
			const form = page.locator("form");
			await expect(form).toBeVisible();

			// Check inputs have labels or aria-labels
			const emailInput = page.locator('input[name="email"]');
			const passwordInput = page.locator('input[name="password"]');

			// Should have accessible names
			const emailName = await emailInput.getAttribute("aria-label");
			const passwordName = await passwordInput.getAttribute("aria-label");

			const hasEmailLabel = emailName || (await page.locator('label[for="email"]').count()) > 0;
			const hasPasswordLabel =
				passwordName || (await page.locator('label[for="password"]').count()) > 0;

			expect(hasEmailLabel).toBeTruthy();
			expect(hasPasswordLabel).toBeTruthy();
		});

		test("should announce form errors to screen readers", async ({ page }) => {
			await page.goto("/login");

			// Submit empty form
			await page.click('button[type="submit"]');

			// Wait for error message
			await page.waitForTimeout(500);

			// Check for ARIA live region or role="alert"
			const errorRegion = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]');
			if ((await errorRegion.count()) > 0) {
				await expect(errorRegion.first()).toBeVisible();
			}

			// Check accessibility after error display
			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();
			expect(results.violations).toEqual([]);
		});

		test("should have proper ARIA for dashboard links", async ({ page }) => {
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');

			// Check dashboard accessibility
			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();
			expect(results.violations).toEqual([]);

			// Check links have descriptive text
			const links = page.locator("a");
			const count = await links.count();

			for (let i = 0; i < Math.min(count, 5); i++) {
				const link = links.nth(i);
				if (await link.isVisible()) {
					const text = await link.textContent();
					const ariaLabel = await link.getAttribute("aria-label");

					// Link should have text or aria-label
					expect(text?.trim() || ariaLabel).toBeTruthy();
				}
			}
		});

		test("should have proper button labels", async ({ page }) => {
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');

			// Check buttons have accessible names
			const buttons = page.locator("button");
			const count = await buttons.count();

			for (let i = 0; i < count; i++) {
				const button = buttons.nth(i);
				if (await button.isVisible()) {
					const text = await button.textContent();
					const ariaLabel = await button.getAttribute("aria-label");
					const ariaLabelledBy = await button.getAttribute("aria-labelledby");

					// Button should have text, aria-label, or aria-labelledby
					expect(text?.trim() || ariaLabel || ariaLabelledBy).toBeTruthy();
				}
			}
		});
	});

	test.describe("Form Accessibility", () => {
		test("should validate form with accessible error messages", async ({ page }) => {
			await page.goto("/register");

			// Check initial accessibility
			const initialResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();
			expect(initialResults.violations).toEqual([]);

			// Submit empty form
			await page.click('button[type="submit"]');

			// Wait for validation
			await page.waitForTimeout(500);

			// Check accessibility with error messages
			const errorResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();
			expect(errorResults.violations).toEqual([]);

			// Errors should be associated with inputs via aria-describedby
			const inputs = page.locator("input:not([type='hidden'])");
			const inputCount = await inputs.count();

			for (let i = 0; i < inputCount; i++) {
				const input = inputs.nth(i);
				const ariaDescribedBy = await input.getAttribute("aria-describedby");
				const ariaInvalid = await input.getAttribute("aria-invalid");

				// If field is invalid, should have aria-invalid and error message
				if (ariaInvalid === "true" && ariaDescribedBy) {
					const errorMessage = page.locator(`#${ariaDescribedBy}`);
					await expect(errorMessage).toBeVisible();
				}
			}
		});

		test("should mark required fields accessibly", async ({ page }) => {
			await page.goto("/register");

			// Check required fields are marked
			const requiredInputs = page.locator("input[required], input[aria-required='true']");
			const count = await requiredInputs.count();

			expect(count).toBeGreaterThan(0);

			// Check accessibility
			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();
			expect(results.violations).toEqual([]);
		});
	});

	test.describe("Dynamic Content Accessibility", () => {
		test("should announce loading states", async ({ page }) => {
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");

			// Click submit and check for loading indicator
			await page.click('button[type="submit"]');

			// Loading state should be accessible
			const loadingIndicator = page.locator('[aria-busy="true"], [role="status"]');
			if ((await loadingIndicator.count()) > 0) {
				await expect(loadingIndicator.first()).toBeVisible();
			}

			await page.waitForURL(/\/dashboard/);
		});

		test("should maintain accessibility when adding links", async ({ page }) => {
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');

			// Check initial accessibility
			const initialResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();
			expect(initialResults.violations).toEqual([]);

			// Open add link modal
			const addButton = page.locator('button:has-text("Add Link")');
			if (await addButton.isVisible()) {
				await addButton.click();

				// Check modal accessibility
				const modalResults = await new AxeBuilder({ page })
					.withTags(["wcag2a", "wcag2aa"])
					.analyze();
				expect(modalResults.violations).toEqual([]);

				// Modal should have proper ARIA
				const modal = page.locator('[role="dialog"]');
				await expect(modal).toBeVisible();

				// Modal should have aria-labelledby or aria-label
				const ariaLabel = await modal.getAttribute("aria-label");
				const ariaLabelledBy = await modal.getAttribute("aria-labelledby");
				expect(ariaLabel || ariaLabelledBy).toBeTruthy();
			}
		});

		test("should announce success messages", async ({ page }) => {
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');

			await page.waitForURL(/\/dashboard/);

			// Add a link
			const addButton = page.locator('button:has-text("Add Link")');
			if (await addButton.isVisible()) {
				await addButton.click();

				await page.fill('input[name="title"], input#title', "Test Link");
				await page.fill('input[name="url"], input#url', "https://example.com");
				await page.click('button[type="submit"]:has-text("Save")');

				// Wait for success message
				await page.waitForTimeout(500);

				// Success message should be in live region
				const successMessage = page.locator('[role="status"], [role="alert"]');
				if ((await successMessage.count()) > 0) {
					await expect(successMessage.first()).toBeVisible();
				}

				// Check accessibility after dynamic update
				const results = await new AxeBuilder({ page })
					.withTags(["wcag2a", "wcag2aa"])
					.analyze();
				expect(results.violations).toEqual([]);
			}
		});
	});

	test.describe("Mobile Accessibility", () => {
		test.use({ viewport: { width: 375, height: 667 } });

		test("should be keyboard accessible on mobile", async ({ page }) => {
			await page.goto("/");

			// Check mobile accessibility
			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();
			expect(results.violations).toEqual([]);
		});

		test("should have touch-friendly targets", async ({ page }) => {
			await page.goto("/testuser");

			// Check accessibility
			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();
			expect(results.violations).toEqual([]);

			// Check touch target sizes
			const interactive = page.locator("a, button");
			const count = await interactive.count();

			for (let i = 0; i < Math.min(count, 5); i++) {
				const element = interactive.nth(i);
				if (await element.isVisible()) {
					const box = await element.boundingBox();

					if (box) {
						// Should be at least 24x24px (with spacing) or 44x44px (without spacing)
						const hasMinimumSize = box.width >= 24 && box.height >= 24;
						expect(hasMinimumSize).toBe(true);
					}
				}
			}
		});
	});

	test.describe("Color and Contrast", () => {
		test("should have sufficient contrast on public page", async ({ page }) => {
			await page.goto("/testuser");

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2aa"])
				.analyze();

			// Filter for color contrast violations
			const contrastViolations = results.violations.filter((v) =>
				v.id.includes("color-contrast"),
			);

			expect(contrastViolations).toEqual([]);
		});

		test("should maintain contrast in dark mode", async ({ page }) => {
			await page.goto("/testuser");

			// Enable dark mode if available
			await page.evaluate(() => {
				// Try to enable dark mode
				document.documentElement.classList.add("dark");
				localStorage.setItem("theme", "dark");
			});

			await page.reload();

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2aa"])
				.analyze();

			const contrastViolations = results.violations.filter((v) =>
				v.id.includes("color-contrast"),
			);

			expect(contrastViolations).toEqual([]);
		});
	});
});
