import { db } from "@/lib/db";
import { users, links, subscriptions, linkClicks } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import crypto from "node:crypto";

/**
 * Test database utilities for integration tests
 */

/**
 * Clear all data from the database
 */
export async function clearDatabase() {
	await db.delete(linkClicks);
	await db.delete(links);
	await db.delete(subscriptions);
	await db.delete(users);
}

/**
 * Reset database sequences
 */
export async function resetSequences() {
	// PostgreSQL sequence reset if needed
	// This depends on your schema setup
}

/**
 * Create a test user in the database
 */
export async function createTestUser(
	overrides: {
		email?: string;
		username?: string;
		name?: string;
		isPro?: boolean;
		stripeCustomerId?: string | null;
	} = {}
) {
	const userId = `test_user_${crypto.randomBytes(8).toString("hex")}`;
	const timestamp = new Date();

	const userData = {
		id: overrides.email ? `user_${overrides.email.split("@")[0]}` : userId,
		email: overrides.email || `${userId}@test.com`,
		username: overrides.username || userId,
		name: overrides.name || `Test User ${userId}`,
		isPro: overrides.isPro ?? false,
		stripeCustomerId: overrides.stripeCustomerId ?? null,
		emailVerified: false,
		image: null,
		createdAt: timestamp,
		updatedAt: timestamp,
	};

	const [user] = await db.insert(users).values(userData).returning();
	return user;
}

/**
 * Create a test link in the database
 */
export async function createTestLink(
	userId: string,
	overrides: {
		title?: string;
		url?: string;
		icon?: string | null;
		position?: number;
		isActive?: boolean;
		clicks?: number;
	} = {}
) {
	const linkId = `test_link_${crypto.randomBytes(8).toString("hex")}`;
	const timestamp = new Date();

	const linkData = {
		id: linkId,
		userId,
		title: overrides.title || `Test Link ${linkId}`,
		url: overrides.url || `https://test-${linkId}.com`,
		icon: overrides.icon ?? "🔗",
		position: overrides.position ?? 0,
		isActive: overrides.isActive ?? true,
		clicks: overrides.clicks ?? 0,
		createdAt: timestamp,
		updatedAt: timestamp,
	};

	const [link] = await db.insert(links).values(linkData).returning();
	return link;
}

/**
 * Create a test subscription in the database
 */
export async function createTestSubscription(
	userId: string,
	overrides: {
		stripeSubscriptionId?: string;
		stripePriceId?: string;
		status?: string;
		periodStart?: Date;
		periodEnd?: Date;
	} = {}
) {
	const subscriptionId = `test_sub_${crypto.randomBytes(8).toString("hex")}`;
	const now = new Date();
	const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

	const subscriptionData = {
		id: subscriptionId,
		userId,
		stripeSubscriptionId: overrides.stripeSubscriptionId || `sub_test_${subscriptionId}`,
		stripePriceId: overrides.stripePriceId || "price_test_123",
		status: overrides.status || "active",
		periodStart: overrides.periodStart || now,
		periodEnd: overrides.periodEnd || monthFromNow,
		createdAt: now,
		updatedAt: now,
	};

	const [subscription] = await db.insert(subscriptions).values(subscriptionData).returning();
	return subscription;
}

/**
 * Create multiple test links for a user
 */
export async function createTestLinks(userId: string, count: number) {
	const createdLinks = [];
	for (let i = 0; i < count; i++) {
		const link = await createTestLink(userId, {
			title: `Test Link ${i + 1}`,
			url: `https://test-link-${i + 1}.com`,
			position: i,
		});
		createdLinks.push(link);
	}
	return createdLinks;
}

/**
 * Count records in a table
 */
export async function countUsers() {
	const result = await db.select({ count: sql<number>`count(*)::int` }).from(users);
	return result[0]?.count || 0;
}

export async function countLinks(userId?: string) {
	if (userId) {
		const result = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(links)
			.where(sql`${links.userId} = ${userId}`);
		return result[0]?.count || 0;
	}
	const result = await db.select({ count: sql<number>`count(*)::int` }).from(links);
	return result[0]?.count || 0;
}

export async function countSubscriptions() {
	const result = await db.select({ count: sql<number>`count(*)::int` }).from(subscriptions);
	return result[0]?.count || 0;
}

/**
 * Get user by email
 */
export async function getTestUserByEmail(email: string) {
	const result = await db.select().from(users).where(sql`${users.email} = ${email}`);
	return result[0] || null;
}

/**
 * Get user by username
 */
export async function getTestUserByUsername(username: string) {
	const result = await db.select().from(users).where(sql`${users.username} = ${username}`);
	return result[0] || null;
}

/**
 * Seed database with test data
 */
export async function seedTestData() {
	// Create a free user
	const freeUser = await createTestUser({
		email: "free@test.com",
		username: "freeuser",
		name: "Free User",
		isPro: false,
	});

	// Create links for free user
	await createTestLinks(freeUser.id, 3);

	// Create a Pro user
	const proUser = await createTestUser({
		email: "pro@test.com",
		username: "prouser",
		name: "Pro User",
		isPro: true,
		stripeCustomerId: "cus_test_pro",
	});

	// Create links for Pro user
	await createTestLinks(proUser.id, 10);

	// Create subscription for Pro user
	await createTestSubscription(proUser.id);

	return { freeUser, proUser };
}
