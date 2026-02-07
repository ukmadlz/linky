import { test as base, type Page } from "@playwright/test";

/**
 * Test fixtures for E2E tests
 * Provides authenticated users, test data, and helper functions
 */

export interface TestUser {
	email: string;
	username: string;
	password: string;
	isPro: boolean;
}

export interface TestFixtures {
	freeUser: TestUser;
	proUser: TestUser;
	authenticatedPage: typeof base;
}

// Create test users
export const testUsers = {
	free: {
		email: "freeuser@test.com",
		username: "freeuser",
		password: "FreeUser123!",
		isPro: false,
	},
	pro: {
		email: "prouser@test.com",
		username: "prouser",
		password: "ProUser123!",
		isPro: true,
	},
	admin: {
		email: "admin@test.com",
		username: "admin",
		password: "Admin123!",
		isPro: true,
	},
};

/**
 * Extended Playwright test with fixtures
 */
export const test = base.extend<TestFixtures>({
	// biome-ignore lint/correctness/noEmptyPattern: Playwright fixture pattern
	freeUser: async ({}, use) => {
		await use(testUsers.free);
	},

	// biome-ignore lint/correctness/noEmptyPattern: Playwright fixture pattern
	proUser: async ({}, use) => {
		await use(testUsers.pro);
	},

	authenticatedPage: async ({ page }, use) => {
		// Login helper
		const login = async (user: TestUser) => {
			await page.goto("/login");
			await page.fill('input[name="email"]', user.email);
			await page.fill('input[name="password"]', user.password);
			await page.click('button[type="submit"]');
			await page.waitForURL(/\/dashboard/);
		};

		// Attach login helper to page
		// biome-ignore lint/suspicious/noExplicitAny: Extending Playwright Page type
		(page as any).login = login;

		// biome-ignore lint/suspicious/noExplicitAny: Extending Playwright Page type
		await use(page as any);
	},
});

export { expect } from "@playwright/test";

/**
 * Helper function to create a test link via UI
 */
export async function createLink(page: Page, data: { title: string; url: string; icon?: string }) {
	await page.click('button:has-text("Add Link")');
	await page.fill('input[name="title"], input#title', data.title);
	await page.fill('input[name="url"], input#url', data.url);

	if (data.icon) {
		await page.click(`button:has-text("${data.icon}")`);
	}

	await page.click('button[type="submit"]:has-text("Save")');
}

/**
 * Helper function to delete a link via UI
 */
export async function deleteLink(page: Page, title: string) {
	const linkRow = page.locator(`text=${title}`).locator("..");

	page.on("dialog", (dialog) => dialog.accept());

	await linkRow.locator('button:has-text("Delete")').click();
}

/**
 * Helper function to wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page) {
	await page.waitForLoadState("networkidle");
}

/**
 * Helper function to take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	await page.screenshot({ path: `screenshots/${name}-${timestamp}.png`, fullPage: true });
}
