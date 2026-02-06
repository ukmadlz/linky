import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Mock environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET = "test-secret-key-min-32-chars-long";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_mock";
process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_mock";
process.env.NEXT_PUBLIC_POSTHOG_HOST = "http://localhost:8000";
process.env.REVALIDATE_SECRET = "dev-revalidate-secret-token";
