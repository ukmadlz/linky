import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session-jwt";

export async function GET() {
	try {
		const session = await getSessionFromCookie();

		if (!session) {
			return NextResponse.json({ user: null });
		}

		return NextResponse.json({
			user: {
				id: session.userId,
				email: session.email,
				name: session.name,
			},
		});
	} catch (error) {
		console.error("Session error:", error);
		return NextResponse.json({ user: null });
	}
}
