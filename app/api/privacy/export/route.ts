import { NextResponse } from "next/server";
import { trackAPIError } from "@/lib/posthog-server-error-tracking";
import { exportUserData } from "@/lib/privacy";
import { getSessionFromRequest } from "@/lib/session-jwt";

/**
 * GDPR Data Export endpoint
 * Allows users to download all their personal data
 */
export async function GET(request: Request) {
	try {
		const session = await getSessionFromRequest(request);

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.userId;

		// Export all user data
		const data = await exportUserData(userId);

		// Return data as JSON
		return NextResponse.json(
			{
				exportDate: new Date().toISOString(),
				userId,
				data,
			},
			{
				headers: {
					"Content-Disposition": `attachment; filename="linky-data-export-${userId}.json"`,
				},
			}
		);
	} catch (error) {
		await trackAPIError(error, request, {
			operation: "data_export",
		});
		console.error("Data export failed:", error);
		return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
	}
}
