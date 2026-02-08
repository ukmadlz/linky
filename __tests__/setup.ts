import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { clearMockAuth } from "./mocks/handlers/auth";
import { clearCapturedEvents } from "./mocks/handlers/posthog";
import { closeMockServer, resetMockServer, setupMockServer } from "./mocks/server";

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.confirm
global.confirm = vi.fn();

// Mock window.alert
global.alert = vi.fn();

// Setup MSW server
beforeAll(() => {
	setupMockServer();
});

// Reset handlers and clear captured data after each test
afterEach(() => {
	cleanup();
	resetMockServer();
	clearCapturedEvents();
	clearMockAuth();
});

// Close server after all tests
afterAll(() => {
	closeMockServer();
});

// Mock environment variables
process.env.DATABASE_URL = "postgresql://linky:linky@localhost:5432/linky";
process.env.SESSION_SECRET = "test-secret-key-min-32-chars-long-for-sessions";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_mock";
process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_mock";
process.env.NEXT_PUBLIC_POSTHOG_HOST = "http://localhost:8000";
process.env.REVALIDATE_SECRET = "dev-revalidate-secret-token";
