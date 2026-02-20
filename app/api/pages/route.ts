import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
	createPage,
	getPageBySlug,
	getPagesByUserId,
} from "@/lib/db/queries";
import { captureServerEvent } from "@/lib/posthog/server";

export async function GET() {
	const user = await requireAuth();
	const pages = await getPagesByUserId(user.id);
	return NextResponse.json(pages);
}

const createPageSchema = z.object({
	slug: z
		.string()
		.min(1)
		.max(100)
		.regex(
			/^[a-z0-9-]+$/,
			"Slug may only contain lowercase letters, numbers, and hyphens",
		)
		.optional(),
	subSlug: z
		.string()
		.min(1)
		.max(100)
		.regex(
			/^[a-z0-9-]+$/,
			"URL may only contain lowercase letters, numbers, and hyphens",
		)
		.optional(),
	title: z.string().max(200).optional(),
});

export async function POST(request: Request) {
	const user = await requireAuth();

	let body: z.infer<typeof createPageSchema> = {};
	try {
		const raw = await request.json();
		const parsed = createPageSchema.safeParse(raw);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid input", issues: parsed.error.issues },
				{ status: 422 },
			);
		}
		body = parsed.data;
	} catch {
		// no body is fine
	}

	let slug: string;
	let subSlug: string | undefined;

	if (body.subSlug) {
		// Sub-page: check uniqueness within this user's pages
		const existingPages = await getPagesByUserId(user.id);
		const taken = existingPages.some((p) => p.subSlug === body.subSlug);
		if (taken) {
			return NextResponse.json(
				{ error: "That URL is already taken. Please choose another." },
				{ status: 409 },
			);
		}
		subSlug = body.subSlug;
		// Auto-generate a unique global slug for internal use
		slug = `${user.username ?? nanoid()}-${nanoid(6)}`;
		// Ensure the auto-generated slug isn't already taken (extremely unlikely but safe)
		while (await getPageBySlug(slug)) {
			slug = `${user.username ?? nanoid()}-${nanoid(6)}`;
		}
	} else if (body.slug) {
		// Validate slug is not taken
		const existing = await getPageBySlug(body.slug);
		if (existing) {
			return NextResponse.json(
				{ error: "That slug is already taken. Please choose another." },
				{ status: 409 },
			);
		}
		slug = body.slug;
	} else if (user.username) {
		const existingPages = await getPagesByUserId(user.id);
		slug =
			existingPages.length === 0
				? user.username
				: `${user.username}-${nanoid(6)}`;
	} else {
		slug = nanoid(10);
	}

	const page = await createPage({
		userId: user.id,
		slug,
		title: body.title,
		subSlug,
	});

	// Capture page_created event (non-blocking)
	captureServerEvent(user.id, "page_created", { slug: page.slug }).catch(
		console.error,
	);

	return NextResponse.json(page, { status: 201 });
}
