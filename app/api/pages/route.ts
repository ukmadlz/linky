import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { getPagesByUserId, createPage, getPageBySlug } from "@/lib/db/queries";
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
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens")
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
        { status: 422 }
      );
    }
    body = parsed.data;
  } catch {
    // no body is fine
  }

  let slug: string;

  if (body.slug) {
    // Validate slug is not taken
    const existing = await getPageBySlug(body.slug);
    if (existing) {
      return NextResponse.json(
        { error: "That slug is already taken. Please choose another." },
        { status: 409 }
      );
    }
    slug = body.slug;
  } else if (user.username) {
    const existingPages = await getPagesByUserId(user.id);
    slug = existingPages.length === 0 ? user.username : `${user.username}-${nanoid(6)}`;
  } else {
    slug = nanoid(10);
  }

  const page = await createPage({
    userId: user.id,
    slug,
    title: body.title,
  });

  // Capture page_created event (non-blocking)
  captureServerEvent(user.id, "page_created", { slug: page.slug }).catch(
    console.error
  );

  return NextResponse.json(page, { status: 201 });
}
