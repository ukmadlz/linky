import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { createUser, getUserByEmail, getUserByUsername } from "@/lib/db/queries";

export async function POST(request: Request) {
	try {
		const { email, username, name, password } = await request.json();

		// Validation
		if (!email || !username || !name || !password) {
			return NextResponse.json({ error: "All fields are required" }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
		}

		if (password.length < 8) {
			return NextResponse.json(
				{ error: "Password must be at least 8 characters" },
				{ status: 400 }
			);
		}

		if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
			return NextResponse.json(
				{ error: "Username can only contain letters, numbers, hyphens, and underscores" },
				{ status: 400 }
			);
		}

		// Check if email or username already exists
		const existingEmail = await getUserByEmail(email);
		if (existingEmail) {
			return NextResponse.json({ error: "Email already exists" }, { status: 400 });
		}

		const existingUsername = await getUserByUsername(username);
		if (existingUsername) {
			return NextResponse.json({ error: "Username already exists" }, { status: 400 });
		}

		// Hash password
		const hashedPassword = await hash(password, 10);

		// Create user with generated ID
		const userId = nanoid();
		const user = await createUser({
			id: userId,
			email,
			username,
			name,
			password: hashedPassword,
			isPro: false,
			theme: JSON.stringify({}),
		});

		if (!user) {
			return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
		}

		return NextResponse.json(
			{
				success: true,
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
					name: user.name,
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Registration error:", error);
		return NextResponse.json({ error: "Registration failed" }, { status: 500 });
	}
}
