import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createSessionToken } from "@/lib/session-jwt";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password, name } = body;

		// Validation
		if (!email || !password) {
			return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
		}

		if (password.length < 8) {
			return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
		}

		// Check if user already exists
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email),
		});

		if (existingUser) {
			return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
		}

		// Hash password
		const hashedPassword = await hash(password, 10);

		// Create user with auto-generated username from email
		const userId = nanoid();
		const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + nanoid(4);

		await db.insert(users).values({
			id: userId,
			email,
			password: hashedPassword,
			name: name || null,
			username,
			emailVerified: false,
			isPro: false,
			theme: "{}",
		});

		// Create session token
		const token = await createSessionToken({
			userId,
			email,
			name,
		});

		// Create response with cookie
		const response = NextResponse.json({
			success: true,
			user: { id: userId, email, name },
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
		console.error("Registration error:", error);
		return NextResponse.json({ error: "Registration failed" }, { status: 500 });
	}
}
