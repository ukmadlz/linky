import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteLink, getLinkById, updateLink } from "@/lib/db/queries";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await context.params;
		const data = await request.json();

		// Verify link belongs to user
		const link = await getLinkById(id);
		if (!link || link.userId !== session.user.id) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const updated = await updateLink(id, data);

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

		return NextResponse.json(updated);
	} catch (error) {
		console.error("Update link error:", error);
		return NextResponse.json({ error: "Failed to update link" }, { status: 500 });
	}
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await context.params;

		// Verify link belongs to user
		const link = await getLinkById(id);
		if (!link || link.userId !== session.user.id) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		await deleteLink(id);

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
		console.error("Delete link error:", error);
		return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
	}
}
