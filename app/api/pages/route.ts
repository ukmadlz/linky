import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth";
import { getPagesByUserId, createPage } from "@/lib/db/queries";
import { captureServerEvent } from "@/lib/posthog/server";

export async function GET() {
  const user = await requireAuth();
  const pages = await getPagesByUserId(user.id);
  return NextResponse.json(pages);
}

export async function POST(request: Request) {
  const user = await requireAuth();

  let slug: string;

  // Try to use username as slug, fall back to a nanoid
  if (user.username) {
    const existing = await getPagesByUserId(user.id);
    if (existing.length === 0) {
      slug = user.username;
    } else {
      slug = `${user.username}-${nanoid(6)}`;
    }
  } else {
    slug = nanoid(10);
  }

  let body: { title?: string; slug?: string } = {};
  try {
    body = await request.json();
  } catch {
    // no body is fine
  }

  const page = await createPage({
    userId: user.id,
    slug: body.slug || slug,
    title: body.title,
  });

  // Capture page_created event (non-blocking)
  captureServerEvent(user.id, "page_created", { slug: page.slug }).catch(
    console.error
  );

  return NextResponse.json(page, { status: 201 });
}
