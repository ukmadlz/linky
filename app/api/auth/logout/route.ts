import { NextResponse } from "next/server";

export async function POST() {
	try {
		const response = NextResponse.json({ success: true });

		// Delete session cookie
		response.cookies.set("session", "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 0,
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Logout error:", error);
		return NextResponse.json({ error: "Logout failed" }, { status: 500 });
	}
}
