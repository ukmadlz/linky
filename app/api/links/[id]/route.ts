import { NextResponse } from "next/server";
import { deleteLink, getLinkById, updateLink } from "@/lib/db/queries";
import { getSessionFromRequest } from "@/lib/session-jwt";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromRequest(request);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await context.params;
		const data = await request.json();

		// Verify link belongs to user
		const link = await getLinkById(id);
		if (!link || link.userId !== session.userId) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const updated = await updateLink(id, data);

		// Trigger revalidation
		const { getUserById } = await import("@/lib/db/queries");
		const user = await getUserById(session.userId);
		if (user) {
			const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
			await fetch(`${baseURL}/api/revalidate`, {
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
		const session = await getSessionFromRequest(request);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await context.params;

		// Verify link belongs to user
		const link = await getLinkById(id);
		if (!link || link.userId !== session.userId) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		await deleteLink(id);

		// Trigger revalidation
		const { getUserById } = await import("@/lib/db/queries");
		const user = await getUserById(session.userId);
		if (user) {
			const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
			await fetch(`${baseURL}/api/revalidate`, {
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
