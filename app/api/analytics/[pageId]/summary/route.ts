import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPageById } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { clickEvents, pageViews, blocks } from "@/lib/db/schema";
import { eq, gte, sql, and, desc } from "drizzle-orm";

interface Params {
  params: Promise<{ pageId: string }>;
}

type TimeRange = "7d" | "30d" | "90d";

function getDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: Request, { params }: Params) {
  const user = await requireAuth();
  const { pageId } = await params;

  const page = await getPageById(pageId);
  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const range = (url.searchParams.get("range") ?? "7d") as TimeRange;
  const days = range === "90d" ? 90 : range === "30d" ? 30 : 7;
  const since = getDaysAgo(days);

  // Total views in range
  const [viewsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pageViews)
    .where(and(eq(pageViews.pageId, pageId), gte(pageViews.timestamp, since)));

  // Total clicks in range
  const [clicksResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clickEvents)
    .where(and(eq(clickEvents.pageId, pageId), gte(clickEvents.timestamp, since)));

  // Top 5 referrers by click
  const topReferrers = await db
    .select({
      referrer: clickEvents.referrer,
      count: sql<number>`count(*)`,
    })
    .from(clickEvents)
    .where(
      and(
        eq(clickEvents.pageId, pageId),
        gte(clickEvents.timestamp, since),
        sql`${clickEvents.referrer} is not null`
      )
    )
    .groupBy(clickEvents.referrer)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  // Top 5 clicked blocks with block title
  const topBlocks = await db
    .select({
      blockId: clickEvents.blockId,
      count: sql<number>`count(*)`,
    })
    .from(clickEvents)
    .where(and(eq(clickEvents.pageId, pageId), gte(clickEvents.timestamp, since)))
    .groupBy(clickEvents.blockId)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  // Fetch block data for top blocks
  const topBlocksWithData = await Promise.all(
    topBlocks.map(async (row) => {
      const [block] = await db
        .select({ id: blocks.id, data: blocks.data, type: blocks.type })
        .from(blocks)
        .where(eq(blocks.id, row.blockId))
        .limit(1);

      const blockData = block?.data as Record<string, unknown> | undefined;
      const title =
        block?.type === "link"
          ? (blockData?.title as string) ?? "Untitled"
          : block?.type ?? "Unknown";

      return { blockId: row.blockId, title, clicks: Number(row.count) };
    })
  );

  const totalViews = Number(viewsResult?.count ?? 0);
  const totalClicks = Number(clicksResult?.count ?? 0);
  const ctr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;

  return NextResponse.json({
    totalViews,
    totalClicks,
    ctr,
    range,
    topReferrers: topReferrers.map((r) => ({
      referrer: r.referrer ?? "Direct",
      count: Number(r.count),
    })),
    topBlocks: topBlocksWithData,
  });
}
