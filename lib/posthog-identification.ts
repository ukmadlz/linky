import posthog from "posthog-js";
import type { User } from "@/lib/db/schema";

/**
 * Identify a user in PostHog with their properties
 * Call this after login or registration
 */
export function identifyUser(user: User) {
	if (typeof window === "undefined") return;

	const userId = user.id;

	// Identify the user
	posthog.identify(userId, {
		email: user.email,
		username: user.username,
		name: user.name,
		is_pro: user.isPro,
		created_at: user.createdAt?.toISOString(),
		avatar_url: user.avatarUrl,
		bio: user.bio,
		stripe_customer_id: user.stripeCustomerId,
	});

	// Set user properties
	posthog.setPersonProperties({
		email: user.email,
		username: user.username,
		name: user.name,
		is_pro: user.isPro,
		created_at: user.createdAt?.toISOString(),
		has_avatar: !!user.avatarUrl,
		has_bio: !!user.bio,
	});

	// Register super properties that will be included in all future events
	posthog.register({
		user_id: userId,
		is_pro: user.isPro,
	});
}

/**
 * Update user properties in PostHog
 * Call this when user updates their profile or subscription
 */
export function updateUserProperties(updates: Partial<User>) {
	if (typeof window === "undefined") return;

	const properties: Record<string, unknown> = {};

	if (updates.name !== undefined) properties.name = updates.name;
	if (updates.bio !== undefined) {
		properties.bio = updates.bio;
		properties.has_bio = !!updates.bio;
	}
	if (updates.avatarUrl !== undefined) {
		properties.avatar_url = updates.avatarUrl;
		properties.has_avatar = !!updates.avatarUrl;
	}
	if (updates.isPro !== undefined) {
		properties.is_pro = updates.isPro;
		// Update super property
		posthog.register({ is_pro: updates.isPro });
	}
	if (updates.theme !== undefined) {
		properties.has_custom_theme = true;
	}

	posthog.setPersonProperties(properties);
}

/**
 * Track when a user upgrades to Pro
 */
export function trackUpgrade(user: User) {
	if (typeof window === "undefined") return;

	posthog.capture("user_upgraded_to_pro", {
		user_id: user.id,
		username: user.username,
		email: user.email,
		stripe_customer_id: user.stripeCustomerId,
	});

	// Update properties
	updateUserProperties({ isPro: true });
}

/**
 * Track when a user downgrades from Pro
 */
export function trackDowngrade(user: User) {
	if (typeof window === "undefined") return;

	posthog.capture("user_downgraded_from_pro", {
		user_id: user.id,
		username: user.username,
		email: user.email,
	});

	// Update properties
	updateUserProperties({ isPro: false });
}

/**
 * Reset user identification (call on logout)
 */
export function resetUserIdentification() {
	if (typeof window === "undefined") return;

	posthog.reset();
}
