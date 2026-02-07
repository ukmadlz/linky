import posthog from "posthog-js";

/**
 * Track an error in PostHog
 */
export function trackError(error: Error, context?: Record<string, unknown>) {
	if (typeof window === "undefined") return;

	const errorData = {
		error_message: error.message,
		error_name: error.name,
		error_stack: error.stack,
		error_type: "client_error",
		...context,
	};

	posthog.capture("$exception", errorData);
}

/**
 * Track a handled error (caught in try-catch)
 */
export function trackHandledError(error: Error | unknown, context?: Record<string, unknown>) {
	if (typeof window === "undefined") return;

	const errorMessage = error instanceof Error ? error.message : String(error);
	const errorStack = error instanceof Error ? error.stack : undefined;

	posthog.capture("handled_error", {
		error_message: errorMessage,
		error_stack: errorStack,
		error_type: "handled",
		...context,
	});
}

/**
 * Track a network error
 */
export function trackNetworkError(
	url: string,
	status: number,
	statusText: string,
	context?: Record<string, unknown>
) {
	if (typeof window === "undefined") return;

	posthog.capture("network_error", {
		url,
		status,
		status_text: statusText,
		error_type: "network",
		...context,
	});
}

/**
 * Set up global error handlers for unhandled errors and promise rejections
 */
export function setupGlobalErrorHandlers() {
	if (typeof window === "undefined") return;

	// Handle unhandled errors
	window.addEventListener("error", (event) => {
		trackError(event.error || new Error(event.message), {
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
			error_type: "unhandled",
		});
	});

	// Handle unhandled promise rejections
	window.addEventListener("unhandledrejection", (event) => {
		const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

		trackError(error, {
			error_type: "unhandled_promise_rejection",
			promise: String(event.promise),
		});
	});
}
