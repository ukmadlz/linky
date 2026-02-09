import { WorkOS } from "@workos-inc/node";

// Lazy initialization to avoid build-time errors
let workosInstance: WorkOS | null = null;

function getWorkOSInstance(): WorkOS {
	if (!workosInstance) {
		const apiKey = process.env.WORKOS_API_KEY;
		if (!apiKey) {
			throw new Error("WORKOS_API_KEY environment variable is required");
		}
		workosInstance = new WorkOS(apiKey);
	}
	return workosInstance;
}

export const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID || "";
export const WORKOS_REDIRECT_URI =
	process.env.WORKOS_REDIRECT_URI || "http://localhost:3000/api/auth/callback";

export function getAuthorizationUrl(provider: "google" | "microsoft" | "apple") {
	const workos = getWorkOSInstance();
	const authorizationUrl = workos.userManagement.getAuthorizationUrl({
		provider,
		clientId: WORKOS_CLIENT_ID,
		redirectUri: WORKOS_REDIRECT_URI,
	});

	return authorizationUrl;
}

export async function authenticateWithCode(code: string) {
	const workos = getWorkOSInstance();
	const { user } = await workos.userManagement.authenticateWithCode({
		clientId: WORKOS_CLIENT_ID,
		code,
	});

	return user;
}
