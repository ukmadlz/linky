import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateUser } from "@/lib/db/queries";

export async function PATCH(request: Request) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { name, bio, avatarUrl } = await request.json();

		const updated = await updateUser(session.user.id, {
			name,
			bio,
			avatarUrl,
		});

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
		console.error("Update profile error:", error);
		return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
	}
}
