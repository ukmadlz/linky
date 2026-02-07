import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./index";
import {
	type Link,
	linkClicks,
	links,
	type NewLink,
	type NewLinkClick,
	type NewUser,
	subscriptions,
	type User,
	users,
} from "./schema";
import { withDatabaseErrorTracking } from "./db-error-handler";

// User queries
export async function getUserByEmail(email: string) {
	const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
	return user;
}

export async function getUserByUsername(username: string) {
	const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
	return user;
}

export async function getUserById(id: string) {
	const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return user;
}

export async function getUserByStripeCustomerId(customerId: string) {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.stripeCustomerId, customerId))
		.limit(1);
	return user;
}

export async function createUser(data: NewUser) {
	return withDatabaseErrorTracking(
		async () => {
			const [user] = await db.insert(users).values(data).returning();
			return user;
		},
		{
			operation: "create",
			table: "users",
			email: data.email,
			username: data.username,
		}
	);
}

export async function updateUser(id: string, data: Partial<User>) {
	return withDatabaseErrorTracking(
		async () => {
			const [user] = await db
				.update(users)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(users.id, id))
				.returning();
			return user;
		},
		{
			operation: "update",
			table: "users",
			user_id: id,
		}
	);
}

export async function deleteUser(id: string) {
	await db.delete(users).where(eq(users.id, id));
}

// Link queries
export async function getLinksByUserId(userId: string) {
	return db.select().from(links).where(eq(links.userId, userId)).orderBy(links.position);
}

export async function getActiveLinksByUserId(userId: string) {
	return db
		.select()
		.from(links)
		.where(and(eq(links.userId, userId), eq(links.isActive, true)))
		.orderBy(links.position);
}

export async function getLinkById(id: string) {
	const [link] = await db.select().from(links).where(eq(links.id, id)).limit(1);
	return link;
}

export async function createLink(data: NewLink) {
	return withDatabaseErrorTracking(
		async () => {
			const [link] = await db.insert(links).values(data).returning();
			return link;
		},
		{
			operation: "create",
			table: "links",
			user_id: data.userId,
		}
	);
}

export async function updateLink(id: string, data: Partial<Link>) {
	const [link] = await db
		.update(links)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(links.id, id))
		.returning();
	return link;
}

export async function deleteLink(id: string) {
	await db.delete(links).where(eq(links.id, id));
}

export async function incrementLinkClicks(id: string) {
	const [link] = await db
		.update(links)
		.set({ clicks: sql`${links.clicks} + 1` })
		.where(eq(links.id, id))
		.returning();
	return link;
}

export async function countLinksByUserId(userId: string) {
	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(links)
		.where(eq(links.userId, userId));
	return result[0]?.count || 0;
}

// Link click queries (for Pro users)
export async function createLinkClick(data: NewLinkClick) {
	const [click] = await db.insert(linkClicks).values(data).returning();
	return click;
}

export async function getLinkClicksByLinkId(linkId: string, limit = 100) {
	return db
		.select()
		.from(linkClicks)
		.where(eq(linkClicks.linkId, linkId))
		.orderBy(desc(linkClicks.timestamp))
		.limit(limit);
}

export async function getLinkClicksByUserId(userId: string, limit = 100) {
	return db
		.select()
		.from(linkClicks)
		.innerJoin(links, eq(linkClicks.linkId, links.id))
		.where(eq(links.userId, userId))
		.orderBy(desc(linkClicks.timestamp))
		.limit(limit);
}

// Subscription queries
export async function getSubscriptionByUserId(userId: string) {
	const [subscription] = await db
		.select()
		.from(subscriptions)
		.where(eq(subscriptions.userId, userId))
		.limit(1);
	return subscription;
}

export async function createSubscription(
	data: Omit<typeof subscriptions.$inferInsert, "id" | "createdAt" | "updatedAt">
) {
	return withDatabaseErrorTracking(
		async () => {
			const [subscription] = await db.insert(subscriptions).values(data).returning();
			return subscription;
		},
		{
			operation: "create",
			table: "subscriptions",
			user_id: data.userId,
		}
	);
}

export async function updateSubscription(
	userId: string,
	data: Partial<typeof subscriptions.$inferSelect>
) {
	return withDatabaseErrorTracking(
		async () => {
			const [subscription] = await db
				.update(subscriptions)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(subscriptions.userId, userId))
				.returning();
			return subscription;
		},
		{
			operation: "update",
			table: "subscriptions",
			user_id: userId,
		}
	);
}

export async function deleteSubscription(userId: string) {
	await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
}

// Link limit check
export async function canAddLink(userId: string): Promise<boolean> {
	const user = await getUserById(userId);
	if (!user) return false;

	// Pro users have unlimited links
	if (user.isPro) return true;

	// Free users limited to 5 links
	const linkCount = await countLinksByUserId(userId);
	return linkCount < 5;
}
