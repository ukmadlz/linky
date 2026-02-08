import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
	userId: string;
	email: string;
	name?: string;
	isLoggedIn: boolean;
}

const sessionOptions = {
	password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
	cookieName: "linky_session",
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		sameSite: "lax" as const,
		maxAge: 60 * 60 * 24 * 7, // 7 days
	},
};

export async function getSession(): Promise<IronSession<SessionData>> {
	const cookieStore = await cookies();
	return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function createSession(userId: string, email: string, name?: string) {
	const session = await getSession();
	session.userId = userId;
	session.email = email;
	session.name = name;
	session.isLoggedIn = true;
	await session.save();
}

export async function destroySession() {
	const session = await getSession();
	session.destroy();
}
