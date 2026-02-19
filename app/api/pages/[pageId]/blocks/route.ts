import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  getPageById,
  getAllBlocksByPageId,
  createBlock,
} from "@/lib/db/queries";
import { blockDataSchemas } from "@/lib/blocks/schemas";
import { captureServerEvent } from "@/lib/posthog/server";
import type { BlockType } from "@/lib/blocks/schemas";

interface Params {
  params: Promise<{ pageId: string }>;
}

const BLOCK_TYPES = [
  "link",
  "text",
  "embed",
  "social_icons",
  "divider",
  "custom_code",
] as const;

const createBlockSchema = z.object({
  type: z.enum(BLOCK_TYPES),
  data: z.record(z.unknown()),
  position: z.number().int().min(0).optional(),
});

async function getAuthorizedPage(pageId: string, userId: string) {
  const page = await getPageById(pageId);
  if (!page || page.userId !== userId) return null;
  return page;
}

export async function GET(_req: Request, { params }: Params) {
  const user = await requireAuth();
  const { pageId } = await params;

  const page = await getAuthorizedPage(pageId, user.id);
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blocks = await getAllBlocksByPageId(page.id);
  return NextResponse.json(blocks);
}

export async function POST(request: Request, { params }: Params) {
  const user = await requireAuth();
  const { pageId } = await params;

  const page = await getAuthorizedPage(pageId, user.id);
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { type, data } = parsed.data;

  // Validate block data against its type-specific schema
  const dataSchema = blockDataSchemas[type as BlockType];
  const dataResult = dataSchema.safeParse(data);
  if (!dataResult.success) {
    return NextResponse.json(
      { error: "Invalid block data", issues: dataResult.error.issues },
      { status: 422 }
    );
  }

  // Auto-assign position: append after existing blocks
  const existing = await getAllBlocksByPageId(page.id);
  const position = parsed.data.position ?? existing.length;

  const block = await createBlock({
    pageId: page.id,
    type: type as BlockType,
    position,
    data: dataResult.data as Record<string, unknown>,
  });

  // Capture block_added event (non-blocking)
  captureServerEvent(user.id, "block_added", {
    block_type: type,
    page_id: page.id,
  }).catch(console.error);

  return NextResponse.json(block, { status: 201 });
}
