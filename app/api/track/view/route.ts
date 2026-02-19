import { NextResponse } from "next/server";
import { getPageViewCount, recordPageView } from "@/lib/db/queries";
import { checkAndSendMilestones } from "@/lib/email/check-milestones";
import { parseRequest } from "@/lib/tracking/parse-request";

export async function POST(request: Request) {
	let pageId: string | undefined;

	try {
		const body = await request.json();
		pageId = typeof body.pageId === "string" ? body.pageId : undefined;
	} catch {
		return new NextResponse(null, { status: 400 });
	}

	if (!pageId) {
		return new NextResponse(null, { status: 400 });
	}
	// Capture narrowed value so callbacks don't need non-null assertions
	const resolvedPageId = pageId;

	// Parse tracking data from headers (no IP stored)
	const tracking = parseRequest(request);

	// Record page view (fire-and-forget)
	const viewPromise = recordPageView({
		pageId: resolvedPageId,
		referrer: tracking.referrer,
		userAgent: tracking.userAgent,
		browser: tracking.browser,
		os: tracking.os,
		device: tracking.device,
		country: tracking.country,
		region: tracking.region,
		city: tracking.city,
		language: tracking.language,
		isBot: tracking.isBot,
	});

	// Check milestone after recording (async, non-blocking)
	const milestonePromise = viewPromise
		.then(() => getPageViewCount(resolvedPageId))
		.then((count) => checkAndSendMilestones(resolvedPageId, "views", count))
		.catch(console.error);

	// Fire-and-forget — don't block the response
	Promise.all([viewPromise, milestonePromise]).catch(console.error);

	return new NextResponse(null, { status: 204 });
}
