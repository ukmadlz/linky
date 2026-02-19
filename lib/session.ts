import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export interface SessionData {
  userId?: string;
  username?: string | null;
}

const SESSION_OPTIONS = {
  cookieName: "bio_session",
  password: process.env.SESSION_SECRET ?? "fallback-dev-secret-change-in-production",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession(cookieStore?: ReadonlyRequestCookies) {
  const store = cookieStore ?? (await cookies());
  return getIronSession<SessionData>(store, SESSION_OPTIONS);
}

export async function saveSession(data: SessionData) {
  const session = await getSession();
  Object.assign(session, data);
  await session.save();
  return session;
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}
