import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  getPageById,
  updatePage,
  deletePage,
  getAllBlocksByPageId,
  getUserById,
} from "@/lib/db/queries";
import { captureServerEvent } from "@/lib/posthog/server";
import { sendPagePublishedEmail } from "@/lib/email/send-page-published";
import type { ThemeConfig } from "@/lib/themes/types";

interface Params {
  params: Promise<{ pageId: string }>;
}

const updatePageSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  isPublished: z.boolean().optional(),
  themeId: z.string().max(50).optional(),
  themeOverrides: z.record(z.unknown()).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  ogImageUrl: z.string().url().max(500).optional().or(z.literal("")),
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
  return NextResponse.json({ ...page, blocks });
}

export async function PATCH(request: Request, { params }: Params) {
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

  const result = updatePageSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 422 }
    );
  }

  const data = result.data;

  const updated = await updatePage(page.id, {
    title: data.title,
    description: data.description,
    isPublished: data.isPublished,
    themeId: data.themeId,
    themeOverrides: data.themeOverrides as Partial<ThemeConfig> | undefined,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    ogImageUrl: data.ogImageUrl || undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Capture analytics events (non-blocking)
  if (data.isPublished !== undefined) {
    const event = data.isPublished ? "page_published" : "page_unpublished";
    captureServerEvent(user.id, event, { slug: page.slug }).catch(console.error);

    // Send page published email on first publish
    if (data.isPublished && !page.isPublished) {
      const fullUser = await getUserById(user.id);
      if (fullUser) {
        sendPagePublishedEmail({
          to: fullUser.email,
          name: fullUser.name ?? undefined,
          slug: page.slug,
        }).catch(console.error);
      }
    }
  }

  if (data.themeId !== undefined || data.themeOverrides !== undefined) {
    captureServerEvent(user.id, "theme_changed", {
      theme_id: data.themeId ?? page.themeId,
      has_overrides:
        data.themeOverrides !== undefined &&
        Object.keys(data.themeOverrides).length > 0,
    }).catch(console.error);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireAuth();
  const { pageId } = await params;

  const page = await getAuthorizedPage(pageId, user.id);
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deletePage(page.id);
  return new Response(null, { status: 204 });
}
