import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import type { BlockType } from "@/lib/blocks/schemas";
import { blockDataSchemas } from "@/lib/blocks/schemas";
import {
	deleteBlock,
	getBlockById,
	getPageById,
	updateBlock,
} from "@/lib/db/queries";
import { captureServerEvent } from "@/lib/posthog/server";

interface Params {
	params: Promise<{ pageId: string; blockId: string }>;
}

const updateBlockSchema = z.object({
	data: z.record(z.unknown()).optional(),
	isVisible: z.boolean().optional(),
	scheduledStart: z.string().datetime().nullable().optional(),
	scheduledEnd: z.string().datetime().nullable().optional(),
});

async function getAuthorizedBlock(
	blockId: string,
	pageId: string,
	userId: string,
) {
	const page = await getPageById(pageId);
	if (!page || page.userId !== userId) return null;

	const block = await getBlockById(blockId);
	if (!block || block.pageId !== page.id) return null;

	return { block, page };
}

export async function PATCH(request: Request, { params }: Params) {
	const user = await requireAuth();
	const { pageId, blockId } = await params;

	const ctx = await getAuthorizedBlock(blockId, pageId, user.id);
	if (!ctx) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = updateBlockSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Validation failed", issues: parsed.error.issues },
			{ status: 422 },
		);
	}

	const updateData: Parameters<typeof updateBlock>[1] = {};

	if (parsed.data.isVisible !== undefined) {
		updateData.isVisible = parsed.data.isVisible;
	}

	if (parsed.data.scheduledStart !== undefined) {
		updateData.scheduledStart = parsed.data.scheduledStart
			? new Date(parsed.data.scheduledStart)
			: null;
	}

	if (parsed.data.scheduledEnd !== undefined) {
		updateData.scheduledEnd = parsed.data.scheduledEnd
			? new Date(parsed.data.scheduledEnd)
			: null;
	}

	if (parsed.data.data !== undefined) {
		// Validate data against the block's type schema
		const dataSchema = blockDataSchemas[ctx.block.type as BlockType];
		const dataResult = dataSchema.safeParse(parsed.data.data);
		if (!dataResult.success) {
			return NextResponse.json(
				{ error: "Invalid block data", issues: dataResult.error.issues },
				{ status: 422 },
			);
		}
		updateData.data = dataResult.data as Record<string, unknown>;
	}

	const updated = await updateBlock(ctx.block.id, updateData);
	if (!updated) {
		return NextResponse.json({ error: "Update failed" }, { status: 500 });
	}

	return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
	const user = await requireAuth();
	const { pageId, blockId } = await params;

	const ctx = await getAuthorizedBlock(blockId, pageId, user.id);
	if (!ctx) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	await deleteBlock(ctx.block.id);

	// Capture block_deleted event (non-blocking)
	captureServerEvent(user.id, "block_deleted", {
		block_type: ctx.block.type,
		page_id: pageId,
	}).catch(console.error);

	return new Response(null, { status: 204 });
}
