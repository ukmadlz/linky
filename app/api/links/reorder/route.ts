import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateLink, getLinkById } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { links } = await request.json();

    // Update positions for all links
    await Promise.all(
      links.map(async ({ id, position }: { id: string; position: number }) => {
        const link = await getLinkById(id);
        if (link && link.userId === session.user.id) {
          await updateLink(id, { position });
        }
      })
    );

    // Trigger revalidation
    const { getUserById } = await import("@/lib/db/queries");
    const user = await getUserById(session.user.id);
    if (user) {
      await fetch(`${process.env.BETTER_AUTH_URL}/api/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.REVALIDATE_SECRET,
          username: user.username,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder links error:", error);
    return NextResponse.json({ error: "Failed to reorder links" }, { status: 500 });
  }
}
