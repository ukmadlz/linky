import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getPageById,
  updateCustomDomain,
  deleteCustomDomain,
  getCustomDomainsByPageId,
} from "@/lib/db/queries";
import { verifyDomain } from "@/lib/domains/verify";
import { db } from "@/lib/db";
import { customDomains } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ domainId: string }>;
}

async function getAuthorizedDomain(domainId: string, userId: string) {
  const [domain] = await db
    .select()
    .from(customDomains)
    .where(eq(customDomains.id, domainId))
    .limit(1);
  if (!domain) return null;

  const page = await getPageById(domain.pageId);
  if (!page || page.userId !== userId) return null;

  return domain;
}

/** DELETE /api/domains/[domainId] */
export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireAuth();
  const { domainId } = await params;

  const domain = await getAuthorizedDomain(domainId, user.id);
  if (!domain) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteCustomDomain(domainId);
  return new Response(null, { status: 204 });
}

/** POST /api/domains/[domainId]/verify — trigger DNS verification */
export async function POST(_req: Request, { params }: Params) {
  const user = await requireAuth();
  const { domainId } = await params;

  const domain = await getAuthorizedDomain(domainId, user.id);
  if (!domain) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const verified = await verifyDomain(domain.domain);

  const updated = await updateCustomDomain(domainId, {
    isVerified: verified,
    sslStatus: verified ? "active" : "pending",
    verifiedAt: verified ? new Date() : undefined,
  });

  return NextResponse.json({
    verified,
    domain: updated,
    message: verified
      ? "Domain verified successfully."
      : "DNS record not found. Please add the CNAME record and try again.",
  });
}
