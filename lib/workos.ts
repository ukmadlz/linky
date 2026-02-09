import { WorkOS } from "@workos-inc/node";

export const workos = new WorkOS(process.env.WORKOS_API_KEY || "");

export const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID || "";
export const WORKOS_REDIRECT_URI =
	process.env.WORKOS_REDIRECT_URI || "http://localhost:3000/api/auth/callback";

export function getAuthorizationUrl(provider: "google" | "microsoft" | "apple") {
	const authorizationUrl = workos.userManagement.getAuthorizationUrl({
		provider,
		clientId: WORKOS_CLIENT_ID,
		redirectUri: WORKOS_REDIRECT_URI,
	});

	return authorizationUrl;
}

export async function authenticateWithCode(code: string) {
	const { user } = await workos.userManagement.authenticateWithCode({
		clientId: WORKOS_CLIENT_ID,
		code,
	});

	return user;
}
