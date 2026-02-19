import {
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────

export const blockTypeEnum = pgEnum("block_type", [
  "link",
  "text",
  "embed",
  "social_icons",
  "divider",
  "custom_code",
]);

// ─────────────────────────────────────────────────────────────
// users
// ─────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    username: varchar("username", { length: 50 }).unique(),
    name: varchar("name", { length: 100 }),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    workosUserId: varchar("workos_user_id", { length: 255 }).unique(),
    isPro: boolean("is_pro").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("users_email_idx").on(t.email),
    index("users_username_idx").on(t.username),
  ]
);

// ─────────────────────────────────────────────────────────────
// pages
// ─────────────────────────────────────────────────────────────

export const pages = pgTable(
  "pages",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).unique().notNull(),
    title: varchar("title", { length: 200 }),
    description: text("description"),
    isPublished: boolean("is_published").default(true).notNull(),
    themeId: varchar("theme_id", { length: 50 }).default("default").notNull(),
    themeOverrides: jsonb("theme_overrides").default({}).notNull(),
    // SEO (Phase 2)
    seoTitle: varchar("seo_title", { length: 200 }),
    seoDescription: text("seo_description"),
    ogImageUrl: text("og_image_url"),
    // Milestone tracking
    milestonesSent: jsonb("milestones_sent").default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("pages_user_id_idx").on(t.userId),
    index("pages_slug_idx").on(t.slug),
  ]
);

// ─────────────────────────────────────────────────────────────
// blocks
// ─────────────────────────────────────────────────────────────

export const blocks = pgTable(
  "blocks",
  {
    id: text("id").primaryKey(),
    pageId: text("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    parentId: text("parent_id"), // self-ref for groups (Phase 2)
    type: blockTypeEnum("type").notNull(),
    position: integer("position").default(0).notNull(),
    isVisible: boolean("is_visible").default(true).notNull(),
    data: jsonb("data").default({}).notNull(),
    // Scheduling (Phase 2)
    scheduledStart: timestamp("scheduled_start"),
    scheduledEnd: timestamp("scheduled_end"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("blocks_page_id_idx").on(t.pageId),
    index("blocks_page_id_position_idx").on(t.pageId, t.position),
    index("blocks_parent_id_idx").on(t.parentId),
  ]
);

// ─────────────────────────────────────────────────────────────
// click_events
// ─────────────────────────────────────────────────────────────

export const clickEvents = pgTable(
  "click_events",
  {
    id: text("id").primaryKey(),
    blockId: text("block_id")
      .notNull()
      .references(() => blocks.id, { onDelete: "cascade" }),
    pageId: text("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    destinationUrl: text("destination_url"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    browser: varchar("browser", { length: 50 }),
    os: varchar("os", { length: 50 }),
    device: varchar("device", { length: 20 }),
    country: varchar("country", { length: 2 }),
    region: varchar("region", { length: 100 }),
    city: varchar("city", { length: 100 }),
    language: varchar("language", { length: 20 }),
    isBot: boolean("is_bot").default(false).notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (t) => [
    index("click_events_block_id_idx").on(t.blockId),
    index("click_events_page_id_idx").on(t.pageId),
    index("click_events_timestamp_idx").on(t.timestamp),
    index("click_events_page_id_timestamp_idx").on(t.pageId, t.timestamp),
  ]
);

// ─────────────────────────────────────────────────────────────
// page_views
// ─────────────────────────────────────────────────────────────

export const pageViews = pgTable(
  "page_views",
  {
    id: text("id").primaryKey(),
    pageId: text("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    browser: varchar("browser", { length: 50 }),
    os: varchar("os", { length: 50 }),
    device: varchar("device", { length: 20 }),
    country: varchar("country", { length: 2 }),
    region: varchar("region", { length: 100 }),
    city: varchar("city", { length: 100 }),
    language: varchar("language", { length: 20 }),
    isBot: boolean("is_bot").default(false).notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (t) => [
    index("page_views_page_id_idx").on(t.pageId),
    index("page_views_timestamp_idx").on(t.timestamp),
    index("page_views_page_id_timestamp_idx").on(t.pageId, t.timestamp),
  ]
);

// ─────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  pages: many(pages),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  user: one(users, { fields: [pages.userId], references: [users.id] }),
  blocks: many(blocks),
  clickEvents: many(clickEvents),
  pageViews: many(pageViews),
}));

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  page: one(pages, { fields: [blocks.pageId], references: [pages.id] }),
  clickEvents: many(clickEvents),
}));

export const clickEventsRelations = relations(clickEvents, ({ one }) => ({
  block: one(blocks, { fields: [clickEvents.blockId], references: [blocks.id] }),
  page: one(pages, { fields: [clickEvents.pageId], references: [pages.id] }),
}));

export const pageViewsRelations = relations(pageViews, ({ one }) => ({
  page: one(pages, { fields: [pageViews.pageId], references: [pages.id] }),
}));

// ─────────────────────────────────────────────────────────────
// subscriptions
// ─────────────────────────────────────────────────────────────

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique().notNull(),
    stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(), // active, canceled, past_due, etc.
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("subscriptions_user_id_idx").on(t.userId),
    index("subscriptions_stripe_id_idx").on(t.stripeSubscriptionId),
  ]
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

// ─────────────────────────────────────────────────────────────
// TypeScript types
// ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type ClickEvent = typeof clickEvents.$inferSelect;
export type NewClickEvent = typeof clickEvents.$inferInsert;
export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
