import { vi } from "vitest";

/**
 * Vitest mocks for external SDKs and modules
 */

// Mock PostHog client
export const mockPostHog = {
	capture: vi.fn(),
	identify: vi.fn(),
	reset: vi.fn(),
	register: vi.fn(),
	opt_in_capturing: vi.fn(),
	opt_out_capturing: vi.fn(),
	get_distinct_id: vi.fn(() => "test-distinct-id"),
	isFeatureEnabled: vi.fn(() => false),
};

// Mock PostHog server
export const mockPostHogServer = {
	capture: vi.fn(),
	identify: vi.fn(),
	shutdown: vi.fn(),
};

// Mock Stripe
export const mockStripe = {
	checkout: {
		sessions: {
			create: vi.fn(),
			retrieve: vi.fn(),
		},
	},
	billingPortal: {
		sessions: {
			create: vi.fn(),
		},
	},
	customers: {
		retrieve: vi.fn(),
		update: vi.fn(),
	},
	subscriptions: {
		retrieve: vi.fn(),
		update: vi.fn(),
		cancel: vi.fn(),
	},
	webhooks: {
		constructEvent: vi.fn(),
	},
};

// Mock auth client
export const mockAuthClient = {
	signIn: {
		email: vi.fn(),
		social: vi.fn(),
	},
	signUp: {
		email: vi.fn(),
	},
	signOut: vi.fn(),
	useSession: vi.fn(() => ({
		data: null,
		isPending: false,
		error: null,
	})),
};

/**
 * Setup function to configure all mocks
 */
export function setupMocks() {
	// Mock PostHog
	vi.mock("posthog-js", () => ({
		default: mockPostHog,
	}));

	vi.mock("posthog-js/react", () => ({
		PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
		usePostHog: () => mockPostHog,
	}));

	vi.mock("@/lib/posthog", () => ({
		posthogServer: mockPostHogServer,
	}));

	// Mock Stripe
	vi.mock("@/lib/stripe", () => ({
		stripe: mockStripe,
	}));

	// Mock auth
	vi.mock("@/lib/auth-client", () => ({
		authClient: mockAuthClient,
	}));

	// Mock Next.js modules
	vi.mock("next/navigation", () => ({
		useRouter: () => ({
			push: vi.fn(),
			replace: vi.fn(),
			refresh: vi.fn(),
		}),
		usePathname: () => "/",
		useSearchParams: () => new URLSearchParams(),
	}));
}

/**
 * Reset all mocks
 */
export function resetMocks() {
	vi.clearAllMocks();
}
