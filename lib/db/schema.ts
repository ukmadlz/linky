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

// BetterAuth sessions table
export const sessions = pgTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("sessions_user_id_idx").on(table.userId),
		tokenIdx: index("sessions_token_idx").on(table.token),
	})
);

// BetterAuth accounts table (for OAuth providers and email/password)
export const accounts = pgTable(
	"accounts",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("accounts_user_id_idx").on(table.userId),
	})
);

// BetterAuth verifications table (for email verification, password reset)
export const verifications = pgTable(
	"verifications",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		identifierIdx: index("verifications_identifier_idx").on(table.identifier),
	})
);

// Relations for better-auth
export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
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
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
