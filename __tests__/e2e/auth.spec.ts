import { expect, test } from "@playwright/test";

test.describe("Authentication E2E", () => {
	test.beforeEach(async ({ page }) => {
		// Start from the home page
		await page.goto("/");
	});

	test.describe("Registration", () => {
		test("should register a new user successfully", async ({ page }) => {
			// Navigate to registration page
			await page.goto("/register");

			// Fill out registration form
			const timestamp = Date.now();
			await page.fill('input[name="email"]', `testuser${timestamp}@example.com`);
			await page.fill('input[name="username"]', `testuser${timestamp}`);
			await page.fill('input[name="password"]', "SecurePassword123!");
			await page.fill('input[name="name"]', "Test User");

			// Submit form
			await page.click('button[type="submit"]');

			// Should redirect to dashboard
			await page.waitForURL(/\/dashboard/, { timeout: 10000 });

			// Should see welcome message or dashboard content
			await expect(page.locator("text=Dashboard")).toBeVisible();
		});

		test("should show error for duplicate email", async ({ page }) => {
			await page.goto("/register");

			// Try to register with existing email
			await page.fill('input[name="email"]', "existing@example.com");
			await page.fill('input[name="username"]', "newusername123");
			await page.fill('input[name="password"]', "SecurePassword123!");

			await page.click('button[type="submit"]');

			// Should show error message
			await expect(page.locator("text=/email.*exists/i")).toBeVisible();
		});

		test("should validate email format", async ({ page }) => {
			await page.goto("/register");

			await page.fill('input[name="email"]', "invalid-email");
			await page.fill('input[name="username"]', "testuser");
			await page.fill('input[name="password"]', "SecurePassword123!");

			await page.click('button[type="submit"]');

			// Should show validation error
			await expect(page.locator("input[name='email']:invalid")).toBeVisible();
		});

		test("should validate password length", async ({ page }) => {
			await page.goto("/register");

			const timestamp = Date.now();
			await page.fill('input[name="email"]', `user${timestamp}@example.com`);
			await page.fill('input[name="username"]', `user${timestamp}`);
			await page.fill('input[name="password"]', "short");

			await page.click('button[type="submit"]');

			// Should show password validation error
			await expect(page.locator("text=/password.*8/i")).toBeVisible();
		});
	});

	test.describe("Login", () => {
		test("should login with valid credentials", async ({ page }) => {
			await page.goto("/login");

			// Fill login form
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");

			// Submit
			await page.click('button[type="submit"]');

			// Should redirect to dashboard
			await page.waitForURL(/\/dashboard/, { timeout: 10000 });
		});

		test("should show error for invalid credentials", async ({ page }) => {
			await page.goto("/login");

			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "wrongpassword");

			await page.click('button[type="submit"]');

			// Should show error message
			await expect(page.locator("text=/invalid.*credentials/i")).toBeVisible();
		});

		test("should have links to registration and password reset", async ({ page }) => {
			await page.goto("/login");

			// Should have link to register
			const registerLink = page.locator('a[href*="register"]');
			await expect(registerLink).toBeVisible();

			// Could also check for forgot password link
			// const forgotLink = page.locator('a[href*="forgot"]');
			// await expect(forgotLink).toBeVisible();
		});
	});

	test.describe("Logout", () => {
		test("should logout successfully", async ({ page }) => {
			// First login
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');

			await page.waitForURL(/\/dashboard/, { timeout: 10000 });

			// Click logout button
			await page.click('button:has-text("Sign Out")', { force: true });

			// Should redirect to home or login page
			await expect(page).toHaveURL(/\/(login)?$/);
		});

		test("should clear session after logout", async ({ page }) => {
			// Login
			await page.goto("/login");
			await page.fill('input[name="email"]', "testuser@example.com");
			await page.fill('input[name="password"]', "correctpassword");
			await page.click('button[type="submit"]');

			// Logout
			await page.click('button:has-text("Sign Out")', { force: true });

			// Try to access dashboard directly
			await page.goto("/dashboard");

			// Should redirect to login
			await expect(page).toHaveURL(/\/login/);
		});
	});

	test.describe("Protected Routes", () => {
		test("should redirect to login when accessing dashboard without auth", async ({ page }) => {
			await page.goto("/dashboard");

			// Should redirect to login
			await expect(page).toHaveURL(/\/login/);
		});

		test("should redirect to login when accessing settings without auth", async ({ page }) => {
			await page.goto("/dashboard/settings");

			// Should redirect to login
			await expect(page).toHaveURL(/\/login/);
		});
	});
});
