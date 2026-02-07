import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportUserData } from "@/lib/privacy";
import { trackAPIError } from "@/lib/posthog-server-error-tracking";

/**
 * GDPR Data Export endpoint
 * Allows users to download all their personal data
 */
export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;

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
