import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session-jwt";
import { updateUser } from "@/lib/db/queries";

export async function PATCH(request: Request) {
	try {
		const session = await getSessionFromRequest(request);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { theme } = await request.json();

		const updated = await updateUser(session.userId, {
			theme: JSON.stringify(theme),
		});

		// Trigger revalidation
		const { getUserById } = await import("@/lib/db/queries");
		const user = await getUserById(session.userId);
		if (user) {
			await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/revalidate`, {
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
		console.error("Update theme error:", error);
		return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
	}
}
