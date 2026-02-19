import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBlockById, recordClick, getPageClickCount } from "@/lib/db/queries";
import { parseRequest } from "@/lib/tracking/parse-request";
import { checkAndSendMilestones } from "@/lib/email/check-milestones";
import type { LinkBlockData } from "@/lib/blocks/schemas";

interface Params {
  params: Promise<{ blockId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const { blockId } = await params;

  // 1. Look up the block
  const block = await getBlockById(blockId);

  if (!block || !block.isVisible) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }

  if (block.type !== "link") {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }

  const data = block.data as unknown as LinkBlockData;

  if (!data.url) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }

  // 2. Check verification gate
  if (data.verificationEnabled) {
    const cookieStore = await cookies();
    const verifiedCookie = cookieStore.get(`linky_verified_${blockId}`);

    if (!verifiedCookie || verifiedCookie.value !== "1") {
      return NextResponse.redirect(
        new URL(`/verify/${blockId}`, request.url),
        { status: 302 }
      );
    }
  }

  // 3. Parse tracking data from request headers (no IP stored)
  const tracking = parseRequest(request);

  // 4. Write click_events row (fire-and-forget, non-blocking)
  const clickPromise = recordClick({
    blockId,
    pageId: block.pageId,
    destinationUrl: data.url,
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

  // 5. Check and send milestone email (async, non-blocking)
  const milestonePromise = clickPromise
    .then(() => getPageClickCount(block.pageId))
    .then((count) => checkAndSendMilestones(block.pageId, "clicks", count))
    .catch(console.error);

  // Use waitUntil if available (Vercel edge runtime), otherwise fire-and-forget
  if (typeof (globalThis as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil === "function") {
    (globalThis as { waitUntil: (p: Promise<unknown>) => void }).waitUntil(
      Promise.all([clickPromise, milestonePromise])
    );
  } else {
    Promise.all([clickPromise, milestonePromise]).catch(console.error);
  }

  // 6. Return 302 redirect to the destination URL
  return NextResponse.redirect(data.url, { status: 302 });
}
