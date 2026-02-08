import { NextResponse } from "next/server";
import { trackAPIError } from "@/lib/posthog-server-error-tracking";
import { deleteUserData } from "@/lib/privacy";
import { getSessionFromRequest } from "@/lib/session-jwt";

/**
 * GDPR Data Deletion endpoint
 * Allows users to permanently delete all their personal data
 */
export async function POST(request: Request) {
	try {
		const session = await getSessionFromRequest(request);

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.userId;

		// Get confirmation from request body
		const body = await request.json();
		const { confirm } = body;

		if (confirm !== "DELETE_MY_DATA") {
			return NextResponse.json(
				{ error: "Invalid confirmation. Send { confirm: 'DELETE_MY_DATA' }" },
				{ status: 400 }
			);
		}

		// Delete all user data
		await deleteUserData(userId);

		return NextResponse.json({
			success: true,
			message: "All your data has been permanently deleted",
		});
	} catch (error) {
		await trackAPIError(error, request, {
			operation: "data_deletion",
		});
		console.error("Data deletion failed:", error);
		return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
	}
}
