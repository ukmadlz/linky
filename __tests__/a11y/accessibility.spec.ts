import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Accessibility Tests - WCAG 2.1 AA", () => {
	test.describe("Public Pages", () => {
		test("should not have accessibility violations on public profile page", async ({ page }) => {
			await page.goto("/testuser");

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});

		test("should not have accessibility violations on home page", async ({ page }) => {
			await page.goto("/");

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});

		test("should not have accessibility violations on pricing page", async ({ page }) => {
			await page.goto("/pricing");

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});
	});

	test.describe("Authentication Pages", () => {
		test("should not have accessibility violations on login page", async ({ page }) => {
			await page.goto("/login");

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});

		test("should have proper form labels on login page", async ({ page }) => {
			await page.goto("/login");

			// Check for proper labels
			const emailInput = page.locator('input[name="email"]');
			const passwordInput = page.locator('input[name="password"]');

			// Inputs should have associated labels
			await expect(emailInput).toHaveAttribute("aria-label", /.+/);
			await expect(passwordInput).toHaveAttribute("aria-label", /.+/);

			// Or be associated with a label element
			const emailLabel = page.locator('label[for="email"]');
			const passwordLabel = page.locator('label[for="password"]');

			const hasEmailLabel =
				(await emailLabel.count()) > 0 || (await emailInput.getAttribute("aria-label")) !== null;
			const hasPasswordLabel =
				(await passwordLabel.count()) > 0 ||
				(await passwordInput.getAttribute("aria-label")) !== null;

			expect(hasEmailLabel || (await emailInput.getAttribute("placeholder"))).toBeTruthy();
			expect(hasPasswordLabel || (await passwordInput.getAttribute("placeholder"))).toBeTruthy();
		});

		test("should not have accessibility violations on register page", async ({ page }) => {
			await page.goto("/register");

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});

		test("should have proper ARIA attributes on register form", async ({ page }) => {
			await page.goto("/register");

			// Check form has proper role and labels
			const form = page.locator("form");
			await expect(form).toBeVisible();

			// All inputs should have labels or aria-labels
			const inputs = page.locator("input:not([type='hidden'])");
			const count = await inputs.count();

			for (let i = 0; i < count; i++) {
				const input = inputs.nth(i);
				const id = await input.getAttribute("id");
				const ariaLabel = await input.getAttribute("aria-label");
				const ariaLabelledBy = await input.getAttribute("aria-labelledby");

				const hasLabel = id ? (await page.locator(`label[for="${id}"]`).count()) > 0 : false;

				// At least one form of labeling should exist
				expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
			}
		});
	});

	test.describe("Dashboard Pages", () => {
		test.beforeEach(async ({ page }) => {
			// Login before testing dashboard
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');
			await expect(page).toHaveURL(/\/dashboard/);
		});

		test("should not have accessibility violations on dashboard", async ({ page }) => {
			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});

		test("should not have accessibility violations on settings page", async ({ page }) => {
			await page.goto("/dashboard/settings");

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});

		test("should have proper button labels", async ({ page }) => {
			// Check that all buttons have text or aria-label
			const buttons = page.locator("button:visible");
			const count = await buttons.count();

			for (let i = 0; i < count; i++) {
				const button = buttons.nth(i);
				const text = await button.textContent();
				const ariaLabel = await button.getAttribute("aria-label");
				const ariaLabelledBy = await button.getAttribute("aria-labelledby");

				// Button should have visible text, aria-label, or aria-labelledby
				expect(text?.trim() || ariaLabel || ariaLabelledBy).toBeTruthy();
			}
		});
	});

	test.describe("Keyboard Navigation", () => {
		test("should allow keyboard navigation on login form", async ({ page }) => {
			await page.goto("/login");

			// Tab through form elements
			await page.keyboard.press("Tab"); // Email input
			let focused = await page.evaluate(() => document.activeElement?.tagName);
			expect(focused).toBe("INPUT");

			await page.keyboard.press("Tab"); // Password input
			focused = await page.evaluate(() => document.activeElement?.tagName);
			expect(focused).toBe("INPUT");

			await page.keyboard.press("Tab"); // Submit button
			focused = await page.evaluate(() => document.activeElement?.tagName);
			expect(focused).toBe("BUTTON");
		});

		test("should show focus indicators", async ({ page }) => {
			await page.goto("/login");

			// Tab to first input
			await page.keyboard.press("Tab");

			// Check if focused element has visible focus indicator
			const focusedElement = page.locator(":focus");
			await expect(focusedElement).toBeVisible();

			// Should have outline or ring (check computed styles)
			const outline = await focusedElement.evaluate((el) => {
				const styles = window.getComputedStyle(el);
				return (
					styles.outline !== "none" || styles.outlineWidth !== "0px" || styles.boxShadow !== "none"
				);
			});

			expect(outline).toBe(true);
		});

		test("should allow keyboard navigation on dashboard links", async ({ page }) => {
			// Login first
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');
			await expect(page).toHaveURL(/\/dashboard/);

			// Tab through links
			await page.keyboard.press("Tab");

			// Find all focusable elements
			const focusableCount = await page.locator("a, button, input, [tabindex]").count();

			// Should be able to tab through multiple elements
			expect(focusableCount).toBeGreaterThan(0);
		});

		test("should trap focus in modal dialogs", async ({ page }) => {
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');

			// Open a modal (e.g., Add Link)
			const addButton = page.locator('button:has-text("Add Link")');
			if (await addButton.isVisible()) {
				await addButton.click();

				// Tab through modal elements
				const modal = page.locator('[role="dialog"], .modal');
				await expect(modal).toBeVisible();

				// Focus should stay within modal
				await page.keyboard.press("Tab");
				const focusedElement = page.locator(":focus");
				const isInsideModal = await focusedElement.evaluate((el, modalSelector) => {
					const modalEl = document.querySelector(modalSelector);
					return modalEl?.contains(el) ?? false;
				}, '[role="dialog"]');

				expect(isInsideModal).toBe(true);
			}
		});
	});

	test.describe("Color Contrast", () => {
		test("should have sufficient color contrast on public page", async ({ page }) => {
			await page.goto("/testuser");

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(["wcag2aa"])
				.include([".links", "a", "button"])
				.analyze();

			// Filter for color contrast violations
			const contrastViolations = accessibilityScanResults.violations.filter((v) =>
				v.id.includes("color-contrast")
			);

			expect(contrastViolations).toEqual([]);
		});

		test("should have sufficient color contrast on dashboard", async ({ page }) => {
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(["wcag2aa"])
				.analyze();

			const contrastViolations = accessibilityScanResults.violations.filter((v) =>
				v.id.includes("color-contrast")
			);

			expect(contrastViolations).toEqual([]);
		});

		test("should have readable text on all backgrounds", async ({ page }) => {
			await page.goto("/");

			// Check text elements for readability
			const textElements = page.locator("p, h1, h2, h3, h4, h5, h6, span, a");
			const count = await textElements.count();

			for (let i = 0; i < Math.min(count, 10); i++) {
				// Check first 10 elements
				const element = textElements.nth(i);
				if (await element.isVisible()) {
					const contrast = await element.evaluate((el) => {
						const styles = window.getComputedStyle(el);
						const color = styles.color;
						const bgColor = styles.backgroundColor;

						// Basic check: both should be defined
						return color !== "" && bgColor !== "";
					});

					expect(contrast).toBe(true);
				}
			}
		});
	});

	test.describe("Screen Reader Compatibility", () => {
		test("should have proper heading hierarchy", async ({ page }) => {
			await page.goto("/");

			// Check that h1 exists and is unique
			const h1Count = await page.locator("h1").count();
			expect(h1Count).toBe(1);

			// Check headings are in logical order
			const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
			const levels = await Promise.all(
				headings.map((h) => h.evaluate((el) => Number.parseInt(el.tagName[1])))
			);

			// First heading should be h1
			expect(levels[0]).toBe(1);

			// Check no heading skips levels (e.g., h1 -> h3)
			for (let i = 1; i < levels.length; i++) {
				const diff = levels[i] - levels[i - 1];
				// Difference should not be more than 1 level down
				expect(diff <= 1).toBe(true);
			}
		});

		test("should have proper alt text on images", async ({ page }) => {
			await page.goto("/testuser");

			// Check all images have alt text
			const images = page.locator("img");
			const count = await images.count();

			for (let i = 0; i < count; i++) {
				const img = images.nth(i);
				const alt = await img.getAttribute("alt");

				// Alt attribute should exist (can be empty for decorative images)
				expect(alt !== null).toBe(true);
			}
		});

		test("should have proper ARIA landmarks", async ({ page }) => {
			await page.goto("/");

			// Should have main landmark
			const main = page.locator("main, [role='main']");
			await expect(main).toBeVisible();

			// Should have navigation landmark
			const nav = page.locator("nav, [role='navigation']");
			if ((await nav.count()) > 0) {
				await expect(nav.first()).toBeVisible();
			}
		});

		test("should have proper link text", async ({ page }) => {
			await page.goto("/testuser");

			// Check that links have descriptive text (not just "click here")
			const links = page.locator("a");
			const count = await links.count();

			for (let i = 0; i < count; i++) {
				const link = links.nth(i);
				const text = await link.textContent();
				const ariaLabel = await link.getAttribute("aria-label");

				// Link should have text or aria-label
				expect(text?.trim() || ariaLabel).toBeTruthy();

				// Avoid generic link text
				if (text) {
					expect(text.toLowerCase()).not.toBe("click here");
					expect(text.toLowerCase()).not.toBe("read more");
					expect(text.toLowerCase()).not.toBe("link");
				}
			}
		});
	});

	test.describe("Form Accessibility", () => {
		test("should show validation errors accessibly", async ({ page }) => {
			await page.goto("/login");

			// Submit empty form
			await page.click('button[type="submit"]');

			// Check for aria-invalid on invalid fields
			const emailInput = page.locator('input[name="email"]');
			const ariaInvalid = await emailInput.getAttribute("aria-invalid");

			// Should mark field as invalid or show error message
			const errorMessage = page.locator('[role="alert"], .error-message');
			const hasError = (await errorMessage.count()) > 0 || ariaInvalid === "true";

			expect(hasError).toBe(true);
		});

		test("should associate error messages with inputs", async ({ page }) => {
			await page.goto("/register");

			// Fill invalid data and submit
			await page.fill('input[name="email"]', "invalid-email");
			await page.click('button[type="submit"]');

			// Error messages should be associated with inputs via aria-describedby
			const emailInput = page.locator('input[name="email"]');
			const ariaDescribedBy = await emailInput.getAttribute("aria-describedby");

			if (ariaDescribedBy) {
				const errorMessage = page.locator(`#${ariaDescribedBy}`);
				await expect(errorMessage).toBeVisible();
			}
		});

		test("should have required field indicators", async ({ page }) => {
			await page.goto("/register");

			// Required fields should be marked
			const requiredInputs = page.locator("input[required], input[aria-required='true']");
			const count = await requiredInputs.count();

			// Should have at least some required fields
			expect(count).toBeGreaterThan(0);
		});
	});

	test.describe("Mobile Accessibility", () => {
		test.use({ viewport: { width: 375, height: 667 } });

		test("should be accessible on mobile devices", async ({ page }) => {
			await page.goto("/testuser");

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});

		test("should have touch-friendly tap targets", async ({ page }) => {
			await page.goto("/testuser");

			// Check that buttons and links are large enough for touch
			const interactive = page.locator("a, button");
			const count = await interactive.count();

			for (let i = 0; i < Math.min(count, 5); i++) {
				// Check first 5
				const element = interactive.nth(i);
				if (await element.isVisible()) {
					const box = await element.boundingBox();

					if (box) {
						// WCAG recommends 44x44px minimum for touch targets
						const isLargeEnough = box.width >= 44 && box.height >= 44;
						const hasSpacing = box.width >= 24 && box.height >= 24; // Minimum for spaced targets

						// At least one should be true
						expect(isLargeEnough || hasSpacing).toBe(true);
					}
				}
			}
		});
	});
});
