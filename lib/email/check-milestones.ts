import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { sendMilestoneEmail } from "@/lib/email/send-milestone";

const MILESTONES = [100, 500, 1000, 5000, 10000];

export async function checkAndSendMilestones(
	pageId: string,
	metric: "views" | "clicks",
	newCount: number,
) {
	// Find the highest milestone crossed
	const crossedMilestone = [...MILESTONES]
		.reverse()
		.find((m) => newCount >= m && newCount - 1 < m);

	if (!crossedMilestone) return;

	// Fetch the page owner info
	const [page] = await db
		.select({
			userId: pages.userId,
			milestonesSent: pages.milestonesSent,
		})
		.from(pages)
		.where(eq(pages.id, pageId))
		.limit(1);

	if (!page) return;

	const milestonesSent = (page.milestonesSent ?? {}) as Record<string, boolean>;
	const milestoneKey = `${metric}_${crossedMilestone}`;

	// Avoid duplicate milestone emails
	if (milestonesSent[milestoneKey]) return;

	// Mark milestone as sent (non-blocking update)
	db.update(pages)
		.set({
			milestonesSent: { ...milestonesSent, [milestoneKey]: true },
		})
		.where(eq(pages.id, pageId))
		.catch(console.error);

	// Fetch user email for sending
	const { users } = await import("@/lib/db/schema");
	const { eq: eqFn } = await import("drizzle-orm");

	const [userInfo] = await db
		.select({
			email: users.email,
			name: users.name,
		})
		.from(users)
		.innerJoin(pages, eqFn(pages.userId, users.id))
		.where(eqFn(pages.id, pageId))
		.limit(1);

	if (!userInfo) return;

	sendMilestoneEmail({
		to: userInfo.email,
		name: userInfo.name ?? undefined,
		milestone: crossedMilestone,
		metric,
	}).catch(console.error);
}
