import { setupServer } from "msw/node";
import { stripeHandlers } from "./handlers/stripe";
import { posthogHandlers } from "./handlers/posthog";
import { betterAuthHandlers } from "./handlers/betterauth";

/**
 * Mock Service Worker server for testing
 * Intercepts HTTP requests and returns mock responses
 */

export const server = setupServer(...stripeHandlers, ...posthogHandlers, ...betterAuthHandlers);

// Start server before all tests
export function setupMockServer() {
	server.listen({
		onUnhandledRequest: "warn",
	});
}

// Reset handlers after each test
export function resetMockServer() {
	server.resetHandlers();
}

// Clean up after all tests
export function closeMockServer() {
	server.close();
}
