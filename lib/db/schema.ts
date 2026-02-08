import { relations } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Users table
export const users = pgTable(
	"users",
	{
		id: text("id").primaryKey(),
		email: varchar("email", { length: 255 }).notNull().unique(),
		username: varchar("username", { length: 50 }),
		password: text("password").notNull(),
		name: varchar("name", { length: 100 }),
		emailVerified: boolean("email_verified").default(false),
		bio: text("bio"),
		avatarUrl: text("avatar_url"),
		theme: text("theme").default("{}"),
		isPro: boolean("is_pro").default(false).notNull(),
		stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		emailIdx: index("users_email_idx").on(table.email),
		usernameIdx: index("users_username_idx").on(table.username),
	})
);

// Links table
export const links = pgTable(
	"links",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: varchar("title", { length: 100 }).notNull(),
		url: text("url").notNull(),
		icon: varchar("icon", { length: 100 }),
		position: integer("position").notNull().default(0),
		isActive: boolean("is_active").default(true).notNull(),
		clicks: integer("clicks").default(0).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("links_user_id_idx").on(table.userId),
		positionIdx: index("links_position_idx").on(table.position),
	})
);

// Link clicks table (for Pro users analytics)
export const linkClicks = pgTable(
	"link_clicks",
	{
		id: text("id").primaryKey(),
		linkId: text("link_id")
			.notNull()
			.references(() => links.id, { onDelete: "cascade" }),
		referrer: text("referrer"),
		userAgent: text("user_agent"),
		country: varchar("country", { length: 2 }),
		city: varchar("city", { length: 100 }),
		timestamp: timestamp("timestamp").defaultNow().notNull(),
	},
	(table) => ({
		linkIdIdx: index("link_clicks_link_id_idx").on(table.linkId),
		timestampIdx: index("link_clicks_timestamp_idx").on(table.timestamp),
	})
);

// Subscriptions table
export const subscriptions = pgTable(
	"subscriptions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.unique()
			.references(() => users.id, { onDelete: "cascade" }),
		stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull().unique(),
		stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
		status: varchar("status", { length: 50 }).notNull(),
		periodStart: timestamp("period_start").notNull(),
		periodEnd: timestamp("period_end").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
		statusIdx: index("subscriptions_status_idx").on(table.status),
	})
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	links: many(links),
	subscriptions: many(subscriptions),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
	user: one(users, {
		fields: [links.userId],
		references: [users.id],
	}),
	clicks: many(linkClicks),
}));

export const linkClicksRelations = relations(linkClicks, ({ one }) => ({
	link: one(links, {
		fields: [linkClicks.linkId],
		references: [links.id],
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id],
	}),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type LinkClick = typeof linkClicks.$inferSelect;
export type NewLinkClick = typeof linkClicks.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
