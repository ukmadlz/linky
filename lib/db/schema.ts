import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		email: varchar("email", { length: 255 }).notNull().unique(),
		username: varchar("username", { length: 50 }).notNull().unique(),
		password: text("password").notNull(),
		name: varchar("name", { length: 100 }),
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
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
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
		id: uuid("id").primaryKey().defaultRandom(),
		linkId: uuid("link_id")
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
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
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

// BetterAuth sessions table
export const sessions = pgTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		ipAddress: varchar("ip_address", { length: 45 }),
		userAgent: text("user_agent"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("sessions_user_id_idx").on(table.userId),
		tokenIdx: index("sessions_token_idx").on(table.token),
	})
);

// BetterAuth accounts table (for OAuth providers)
export const accounts = pgTable(
	"accounts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		provider: varchar("provider", { length: 50 }).notNull(),
		providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
		refreshToken: text("refresh_token"),
		accessToken: text("access_token"),
		expiresAt: timestamp("expires_at"),
		tokenType: varchar("token_type", { length: 50 }),
		scope: text("scope"),
		idToken: text("id_token"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("accounts_user_id_idx").on(table.userId),
		providerIdx: index("accounts_provider_idx").on(table.provider, table.providerAccountId),
	})
);

// BetterAuth verifications table (for email verification, password reset)
export const verifications = pgTable(
	"verifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		identifier: varchar("identifier", { length: 255 }).notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		identifierIdx: index("verifications_identifier_idx").on(table.identifier),
	})
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type LinkClick = typeof linkClicks.$inferSelect;
export type NewLinkClick = typeof linkClicks.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
