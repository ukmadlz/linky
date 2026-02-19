import { eq, asc, sql, and, or, lte, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./index";
import {
  users,
  pages,
  blocks,
  clickEvents,
  pageViews,
  type User,
  type Page,
  type Block,
  type NewUser,
  type NewBlock,
} from "./schema";

// ─────────────────────────────────────────────────────────────
// User queries
// ─────────────────────────────────────────────────────────────

export async function getUserByWorkosId(
  workosUserId: string
): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.workosUserId, workosUserId))
    .limit(1);
  return user ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}

export async function createUser(data: {
  email: string;
  workosUserId: string;
  name?: string;
  avatarUrl?: string;
}): Promise<User> {
  const id = nanoid();
  const [user] = await db
    .insert(users)
    .values({
      id,
      email: data.email,
      workosUserId: data.workosUserId,
      name: data.name,
      avatarUrl: data.avatarUrl,
    })
    .returning();
  return user;
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, "username" | "name" | "bio" | "avatarUrl" | "isPro" | "updatedAt">>
): Promise<User | null> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user ?? null;
}

// ─────────────────────────────────────────────────────────────
// Page queries
// ─────────────────────────────────────────────────────────────

export async function getPageById(id: string): Promise<Page | null> {
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, id))
    .limit(1);
  return page ?? null;
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1);
  return page ?? null;
}

export async function getPagesByUserId(userId: string): Promise<Page[]> {
  return db.select().from(pages).where(eq(pages.userId, userId));
}

export async function createPage(data: {
  userId: string;
  slug: string;
  title?: string;
}): Promise<Page> {
  const id = nanoid();
  const [page] = await db
    .insert(pages)
    .values({
      id,
      userId: data.userId,
      slug: data.slug,
      title: data.title,
    })
    .returning();
  return page;
}

export async function updatePage(
  id: string,
  data: Partial<
    Pick<
      Page,
      | "title"
      | "description"
      | "isPublished"
      | "themeId"
      | "themeOverrides"
      | "seoTitle"
      | "seoDescription"
      | "ogImageUrl"
      | "milestonesSent"
    >
  >
): Promise<Page | null> {
  const [page] = await db
    .update(pages)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pages.id, id))
    .returning();
  return page ?? null;
}

export async function deletePage(id: string): Promise<void> {
  await db.delete(pages).where(eq(pages.id, id));
}

// ─────────────────────────────────────────────────────────────
// Block queries
// ─────────────────────────────────────────────────────────────

export async function getBlockById(id: string): Promise<Block | null> {
  const [block] = await db
    .select()
    .from(blocks)
    .where(eq(blocks.id, id))
    .limit(1);
  return block ?? null;
}

/** Visible, scheduled-active blocks ordered by position — for public page rendering */
export async function getBlocksByPageId(pageId: string): Promise<Block[]> {
  const now = new Date();
  return db
    .select()
    .from(blocks)
    .where(
      and(
        eq(blocks.pageId, pageId),
        eq(blocks.isVisible, true),
        or(isNull(blocks.scheduledStart), lte(blocks.scheduledStart, now)),
        or(isNull(blocks.scheduledEnd), sql`${blocks.scheduledEnd} > NOW()`)
      )
    )
    .orderBy(asc(blocks.position));
}

/** All blocks including hidden, for dashboard editor */
export async function getAllBlocksByPageId(pageId: string): Promise<Block[]> {
  return db
    .select()
    .from(blocks)
    .where(eq(blocks.pageId, pageId))
    .orderBy(asc(blocks.position));
}

export async function createBlock(data: {
  pageId: string;
  type: NewBlock["type"];
  position: number;
  data: Record<string, unknown>;
}): Promise<Block> {
  const id = nanoid();
  const [block] = await db
    .insert(blocks)
    .values({
      id,
      pageId: data.pageId,
      type: data.type,
      position: data.position,
      data: data.data,
    })
    .returning();
  return block;
}

export async function updateBlock(
  id: string,
  data: Partial<Pick<Block, "data" | "isVisible" | "position" | "scheduledStart" | "scheduledEnd">>
): Promise<Block | null> {
  const [block] = await db
    .update(blocks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(blocks.id, id))
    .returning();
  return block ?? null;
}

export async function deleteBlock(id: string): Promise<void> {
  await db.delete(blocks).where(eq(blocks.id, id));
}

/** Bulk-update block positions from an ordered array of IDs */
export async function reorderBlocks(
  pageId: string,
  orderedIds: string[]
): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(blocks)
        .set({ position: i, updatedAt: new Date() })
        .where(eq(blocks.id, orderedIds[i]));
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Tracking queries
// ─────────────────────────────────────────────────────────────

export async function recordClick(data: {
  blockId: string;
  pageId: string;
  destinationUrl?: string;
  referrer?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  region?: string;
  city?: string;
  language?: string;
  isBot?: boolean;
}): Promise<void> {
  const id = nanoid();
  await db.insert(clickEvents).values({
    id,
    blockId: data.blockId,
    pageId: data.pageId,
    destinationUrl: data.destinationUrl,
    referrer: data.referrer,
    userAgent: data.userAgent,
    browser: data.browser,
    os: data.os,
    device: data.device,
    country: data.country,
    region: data.region,
    city: data.city,
    language: data.language,
    isBot: data.isBot ?? false,
  });
}

export async function recordPageView(data: {
  pageId: string;
  referrer?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  region?: string;
  city?: string;
  language?: string;
  isBot?: boolean;
}): Promise<void> {
  const id = nanoid();
  await db.insert(pageViews).values({
    id,
    pageId: data.pageId,
    referrer: data.referrer,
    userAgent: data.userAgent,
    browser: data.browser,
    os: data.os,
    device: data.device,
    country: data.country,
    region: data.region,
    city: data.city,
    language: data.language,
    isBot: data.isBot ?? false,
  });
}

/** Total page view count for a page (for milestone checking) */
export async function getPageViewCount(pageId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pageViews)
    .where(eq(pageViews.pageId, pageId));
  return Number(result?.count ?? 0);
}

/** Total click count for a page (for milestone checking) */
export async function getPageClickCount(pageId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clickEvents)
    .where(eq(clickEvents.pageId, pageId));
  return Number(result?.count ?? 0);
}
