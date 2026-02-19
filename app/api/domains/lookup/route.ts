import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customDomains, pages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/domains/lookup?domain=mysite.com
 * Returns the page slug for a verified custom domain.
 * Used by middleware to rewrite custom domain requests.
 * Not authenticated — called from edge middleware.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.toLowerCase();

  if (!domain) {
    return NextResponse.json({ slug: null }, { status: 400 });
  }

  const [result] = await db
    .select({ slug: pages.slug, isPublished: pages.isPublished })
    .from(customDomains)
    .innerJoin(pages, eq(customDomains.pageId, pages.id))
    .where(
      and(
        eq(customDomains.domain, domain),
        eq(customDomains.isVerified, true)
      )
    )
    .limit(1);

  if (!result || !result.isPublished) {
    return NextResponse.json({ slug: null });
  }

  return NextResponse.json(
    { slug: result.slug },
    {
      headers: {
        // Cache for 60s at the edge to reduce DB load
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    }
  );
}
