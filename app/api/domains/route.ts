import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
	createCustomDomain,
	getCustomDomainsByPageId,
	getPageById,
} from "@/lib/db/queries";
import { getCnameTarget } from "@/lib/domains/verify";

const createSchema = z.object({
	pageId: z.string().min(1),
	domain: z
		.string()
		.min(3)
		.max(253)
		.regex(
			/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/,
			"Invalid domain format",
		),
});

/** GET /api/domains?pageId=xxx — list domains for a page */
export async function GET(request: Request) {
	const user = await requireAuth();
	const { searchParams } = new URL(request.url);
	const pageId = searchParams.get("pageId");

	if (!pageId) {
		return NextResponse.json({ error: "pageId is required" }, { status: 400 });
	}

	const page = await getPageById(pageId);
	if (!page || page.userId !== user.id) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const domains = await getCustomDomainsByPageId(pageId);
	return NextResponse.json({ domains, cnameTarget: getCnameTarget() });
}

/** POST /api/domains — add a custom domain */
export async function POST(request: Request) {
	const user = await requireAuth();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = createSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Validation failed", issues: parsed.error.issues },
			{ status: 422 },
		);
	}

	const { pageId, domain } = parsed.data;

	const page = await getPageById(pageId);
	if (!page || page.userId !== user.id) {
		return NextResponse.json({ error: "Page not found" }, { status: 404 });
	}

	try {
		const created = await createCustomDomain({ pageId, domain });
		return NextResponse.json(
			{ ...created, cnameTarget: getCnameTarget() },
			{ status: 201 },
		);
	} catch {
		return NextResponse.json(
			{ error: "Domain already registered or invalid." },
			{ status: 409 },
		);
	}
}
