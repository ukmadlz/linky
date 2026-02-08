import { type JWTPayload, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
	process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long"
);

export interface SessionPayload extends JWTPayload {
	userId: string;
	email: string;
	name?: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
	const token = await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(secret);

	return token;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
	try {
		const { payload } = await jwtVerify(token, secret);
		return payload as SessionPayload;
	} catch {
		return null;
	}
}

export async function setSessionCookie(token: string) {
	const cookieStore = await cookies();
	cookieStore.set("session", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 7, // 7 days
		path: "/",
	});
}

export async function getSessionFromCookie(): Promise<SessionPayload | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value;

	if (!token) {
		return null;
	}

	return verifySessionToken(token);
}

export async function deleteSessionCookie() {
	const cookieStore = await cookies();
	cookieStore.delete("session");
}

// Helper for API routes to get session from request headers
export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null> {
	const cookieHeader = request.headers.get("cookie");
	if (!cookieHeader) return null;

	// Parse cookies manually
	const cookies = cookieHeader.split(";").reduce(
		(acc, cookie) => {
			const [key, value] = cookie.trim().split("=");
			acc[key] = value;
			return acc;
		},
		{} as Record<string, string>
	);

	const token = cookies.session;
	if (!token) return null;

	return verifySessionToken(token);
}
