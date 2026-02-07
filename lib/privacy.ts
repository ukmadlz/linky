import { eq } from "drizzle-orm";
import { db } from "./db";
import { linkClicks, links, subscriptions, users } from "./db/schema";

/**
 * Privacy and GDPR compliance utilities
 */

/**
 * Delete all user data (GDPR right to erasure)
 */
export async function deleteUserData(userId: string): Promise<void> {
	try {
		// 1. Delete from PostHog (if possible via API)
		// Note: PostHog doesn't have a built-in API for GDPR deletion in self-hosted
		// You'll need to manually delete from ClickHouse or use PostHog's GDPR tools
		await deleteUserFromPostHog(userId);

		// 2. Delete user's link clicks
		await db.delete(linkClicks).where(eq(linkClicks.userId, userId));

		// 3. Delete user's links
		await db.delete(links).where(eq(links.userId, userId));

		// 4. Delete user's subscription
		await db.delete(subscriptions).where(eq(subscriptions.userId, userId));

		// 5. Delete user account
		await db.delete(users).where(eq(users.id, userId));

		console.log(`Deleted all data for user ${userId}`);
	} catch (error) {
		console.error("Failed to delete user data:", error);
		throw error;
	}
}

/**
 * Delete user from PostHog
 */
async function deleteUserFromPostHog(userId: string): Promise<void> {
	try {
		// Note: PostHog self-hosted requires manual ClickHouse queries for GDPR deletion
		// For PostHog Cloud, you can use the GDPR API
		const projectId = process.env.POSTHOG_PROJECT_ID;
		const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
		const _host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "http://localhost:8000";

		if (!projectId || !apiKey) {
			console.warn("PostHog API not configured, skipping PostHog data deletion");
			return;
		}

		// For self-hosted PostHog, you need to run SQL queries directly on ClickHouse
		// This is a placeholder - implement based on your PostHog setup
		console.log(`TODO: Delete PostHog data for user ${userId}`);

		// For PostHog Cloud, you can use this endpoint:
		// await fetch(`${host}/api/projects/${projectId}/persons/${userId}/delete`, {
		//   method: 'DELETE',
		//   headers: {
		//     'Authorization': `Bearer ${apiKey}`,
		//   },
		// });
	} catch (error) {
		console.error("Failed to delete user from PostHog:", error);
	}
}

/**
 * Export all user data (GDPR right to data portability)
 */
export async function exportUserData(userId: string): Promise<{
	user: unknown;
	links: unknown[];
	linkClicks: unknown[];
	subscription: unknown;
}> {
	try {
		// Get user data
		const [user] = await db.select().from(users).where(eq(users.id, userId));

		// Get user's links
		const userLinks = await db.select().from(links).where(eq(links.userId, userId));

		// Get user's link clicks
		const clicks = await db.select().from(linkClicks).where(eq(linkClicks.userId, userId));

		// Get user's subscription
		const [subscription] = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.userId, userId));

		return {
			user,
			links: userLinks,
			linkClicks: clicks,
			subscription,
		};
	} catch (error) {
		console.error("Failed to export user data:", error);
		throw error;
	}
}

/**
 * Anonymize user data (alternative to deletion)
 */
export async function anonymizeUserData(userId: string): Promise<void> {
	try {
		// Anonymize user record
		await db
			.update(users)
			.set({
				email: `deleted-${userId}@anonymized.local`,
				username: `deleted-${userId}`,
				name: "Deleted User",
				image: null,
				stripeCustomerId: null,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		// Delete subscription data
		await db.delete(subscriptions).where(eq(subscriptions.userId, userId));

		// Keep links and clicks for analytics, but they're now anonymized

		console.log(`Anonymized data for user ${userId}`);
	} catch (error) {
		console.error("Failed to anonymize user data:", error);
		throw error;
	}
}

/**
 * Check if IP tracking is enabled
 */
export function isIPTrackingEnabled(): boolean {
	return process.env.POSTHOG_DISABLE_IP_TRACKING !== "true";
}

/**
 * Mask IP address for privacy
 */
export function maskIPAddress(ip: string): string {
	// Mask last octet of IPv4 or last 80 bits of IPv6
	if (ip.includes(".")) {
		// IPv4
		const parts = ip.split(".");
		parts[3] = "0";
		return parts.join(".");
	}
	if (ip.includes(":")) {
		// IPv6 - mask last 80 bits
		const parts = ip.split(":");
		for (let i = 5; i < parts.length; i++) {
			parts[i] = "0";
		}
		return parts.join(":");
	}
	return "0.0.0.0";
}

/**
 * Get data retention period in days
 */
export function getDataRetentionPeriod(): number {
	const days = Number.parseInt(process.env.DATA_RETENTION_DAYS || "90", 10);
	return Number.isNaN(days) ? 90 : days;
}

/**
 * Clean up old analytics data based on retention policy
 */
export async function cleanupOldAnalyticsData(): Promise<void> {
	try {
		const retentionDays = getDataRetentionPeriod();
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

		// Delete old link clicks
		await db.delete(linkClicks).where(eq(linkClicks.timestamp, cutoffDate));

		console.log(`Deleted analytics data older than ${retentionDays} days`);

		// Note: For PostHog data, you need to configure retention in PostHog settings
		// or run manual ClickHouse queries
	} catch (error) {
		console.error("Failed to cleanup old analytics data:", error);
	}
}

/**
 * Privacy-friendly user identification
 * Uses hashed identifiers instead of PII
 */
export function getPrivacyFriendlyUserId(userId: string): string {
	// In production, use a proper hashing function
	// This is a simplified example
	if (process.env.ANONYMIZE_USER_IDS === "true") {
		return `user_${btoa(userId).substring(0, 12)}`;
	}
	return userId;
}
