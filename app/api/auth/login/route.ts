import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createSessionToken } from "@/lib/session-jwt";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password } = body;

		// Validation
		if (!email || !password) {
			return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
		}

		// Find user
		const user = await db.query.users.findFirst({
			where: eq(users.email, email),
		});

		if (!user || !user.password) {
			return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
		}

		// Verify password
		const isValid = await compare(password, user.password);
		if (!isValid) {
			return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
		}

		// Create session token
		const token = await createSessionToken({
			userId: user.id,
			email: user.email,
			name: user.name || undefined,
		});

		// Create response with cookie
		const response = NextResponse.json({
			success: true,
			user: { id: user.id, email: user.email, name: user.name },
		});

		// Set session cookie on response
		response.cookies.set("session", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 7, // 7 days
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json({ error: "Login failed" }, { status: 500 });
	}
}
