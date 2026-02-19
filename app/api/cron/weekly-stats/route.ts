import { and, eq, gte, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clickEvents, pages, pageViews, users } from "@/lib/db/schema";
import { sendWeeklyStatsEmail } from "@/lib/email/send-weekly-stats";

export async function GET(request: NextRequest) {
	// Verify cron secret
	const authHeader = request.headers.get("authorization");
	const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

	if (!process.env.CRON_SECRET || authHeader !== expectedSecret) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const now = new Date();
	const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

	// Get all users with published pages
	const publishedPages = await db
		.select({
			pageId: pages.id,
			userId: pages.userId,
			slug: pages.slug,
			userEmail: users.email,
			userName: users.name,
		})
		.from(pages)
		.innerJoin(users, eq(pages.userId, users.id))
		.where(eq(pages.isPublished, true));

	const results = [];

	for (const page of publishedPages) {
		// This week's views
		const thisWeekViews = await db
			.select({ count: sql<number>`count(*)` })
			.from(pageViews)
			.where(
				and(
					eq(pageViews.pageId, page.pageId),
					gte(pageViews.timestamp, sevenDaysAgo),
				),
			);

		// Last week's views
		const lastWeekViews = await db
			.select({ count: sql<number>`count(*)` })
			.from(pageViews)
			.where(
				and(
					eq(pageViews.pageId, page.pageId),
					gte(pageViews.timestamp, fourteenDaysAgo),
					sql`${pageViews.timestamp} < ${sevenDaysAgo}`,
				),
			);

		// This week's clicks
		const thisWeekClicks = await db
			.select({ count: sql<number>`count(*)` })
			.from(clickEvents)
			.where(
				and(
					eq(clickEvents.pageId, page.pageId),
					gte(clickEvents.timestamp, sevenDaysAgo),
				),
			);

		// Last week's clicks
		const lastWeekClicks = await db
			.select({ count: sql<number>`count(*)` })
			.from(clickEvents)
			.where(
				and(
					eq(clickEvents.pageId, page.pageId),
					gte(clickEvents.timestamp, fourteenDaysAgo),
					sql`${clickEvents.timestamp} < ${sevenDaysAgo}`,
				),
			);

		const viewCount = Number(thisWeekViews[0]?.count ?? 0);
		const clickCount = Number(thisWeekClicks[0]?.count ?? 0);
		const viewDelta = viewCount - Number(lastWeekViews[0]?.count ?? 0);
		const clickDelta = clickCount - Number(lastWeekClicks[0]?.count ?? 0);

		// Fire-and-forget
		sendWeeklyStatsEmail({
			to: page.userEmail,
			name: page.userName ?? undefined,
			pageViews: viewCount,
			totalClicks: clickCount,
			viewsDelta: viewDelta,
			clicksDelta: clickDelta,
		}).catch(console.error);

		results.push({ pageId: page.pageId, email: page.userEmail });
	}

	return NextResponse.json({ sent: results.length, pages: results });
}
