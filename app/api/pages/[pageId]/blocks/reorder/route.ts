import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
	getAllBlocksByPageId,
	getPageById,
	reorderBlocks,
} from "@/lib/db/queries";
import { captureServerEvent } from "@/lib/posthog/server";

interface Params {
	params: Promise<{ pageId: string }>;
}

const reorderSchema = z.object({
	orderedIds: z.array(z.string()).min(1),
});

export async function POST(request: Request, { params }: Params) {
	const user = await requireAuth();
	const { pageId } = await params;

	const page = await getPageById(pageId);
	if (!page || page.userId !== user.id) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = reorderSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Validation failed", issues: parsed.error.issues },
			{ status: 422 },
		);
	}

	const { orderedIds } = parsed.data;

	// Verify all IDs belong to this page
	const existing = await getAllBlocksByPageId(page.id);
	const existingIds = new Set(existing.map((b) => b.id));
	const allValid = orderedIds.every((id) => existingIds.has(id));

	if (!allValid) {
		return NextResponse.json(
			{ error: "One or more block IDs do not belong to this page" },
			{ status: 400 },
		);
	}

	await reorderBlocks(page.id, orderedIds);

	// Capture block_reordered event (non-blocking)
	captureServerEvent(user.id, "block_reordered", {
		page_id: page.id,
		block_count: orderedIds.length,
	}).catch(console.error);

	return new Response(null, { status: 204 });
}
