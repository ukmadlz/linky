import { NextResponse } from "next/server";
import { trackAPIError } from "./posthog-server-error-tracking";

export interface APIErrorResponse {
	error: string;
	message?: string;
	code?: string;
	status?: number;
}

/**
 * Wrap an API route handler with error tracking
 */
export function withAPIErrorHandling<T = unknown>(
	handler: (request: Request, context?: Record<string, unknown>) => Promise<NextResponse<T>>,
	options: {
		errorMessage?: string;
		includeStackTrace?: boolean;
	} = {}
) {
	return async (request: Request, context?: Record<string, unknown>) => {
		try {
			return await handler(request, context);
		} catch (error) {
			// Track the error
			await trackAPIError(error, request, {
				handler_options: options,
			});

			// Determine error message
			const errorMessage =
				options.errorMessage ||
				(error instanceof Error ? error.message : "An unexpected error occurred");

			// Build error response
			const errorResponse: APIErrorResponse = {
				error: errorMessage,
			};

			// Include stack trace in development
			if (options.includeStackTrace && process.env.NODE_ENV === "development") {
				errorResponse.message = error instanceof Error ? error.stack : String(error);
			}

			// Determine status code
			let statusCode = 500;
			if (error instanceof Error) {
				// Check for common error types
				if (error.message.includes("Unauthorized") || error.message.includes("unauthorized")) {
					statusCode = 401;
				} else if (error.message.includes("Forbidden") || error.message.includes("forbidden")) {
					statusCode = 403;
				} else if (error.message.includes("Not found") || error.message.includes("not found")) {
					statusCode = 404;
				} else if (error.message.includes("Bad request") || error.message.includes("Invalid")) {
					statusCode = 400;
				}
			}

			return NextResponse.json(errorResponse, { status: statusCode });
		}
	};
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
	message: string,
	status = 500,
	additionalData?: Record<string, unknown>
): NextResponse<APIErrorResponse> {
	return NextResponse.json(
		{
			error: message,
			...additionalData,
		},
		{ status }
	);
}

/**
 * Check if an error is a known error type
 */
export function isKnownError(error: unknown): error is Error {
	return error instanceof Error;
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return "An unexpected error occurred";
}
