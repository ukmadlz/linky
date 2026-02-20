"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { initPostHog, posthog } from "@/lib/posthog/client";

interface PostHogProviderProps {
	children: React.ReactNode;
	userId?: string;
	email?: string;
	username?: string;
}

export function PostHogProvider({
	children,
	userId,
	email,
	username,
}: PostHogProviderProps) {
	const _pathname = usePathname();

	useEffect(() => {
		initPostHog();
	}, []);

	// Identify user on login
	useEffect(() => {
		if (userId) {
			posthog.identify(userId, {
				email,
				username,
			});
		}
	}, [userId, email, username]);

	// Track dashboard pageviews manually
	useEffect(() => {
		posthog.capture("$pageview", { $current_url: window.location.href });
	}, []);

	// Capture unhandled errors that never reach a React error boundary
	useEffect(() => {
		const handleError = (event: ErrorEvent) => {
			posthog.captureException(event.error ?? new Error(event.message), {
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
				source: "window_onerror",
			});
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			const error = event.reason instanceof Error
				? event.reason
				: new Error(String(event.reason));
			posthog.captureException(error, { source: "unhandledrejection" });
		};

		window.addEventListener("error", handleError);
		window.addEventListener("unhandledrejection", handleUnhandledRejection);

		return () => {
			window.removeEventListener("error", handleError);
			window.removeEventListener("unhandledrejection", handleUnhandledRejection);
		};
	}, []);

	return <>{children}</>;
}

export function resetPostHog() {
	posthog.reset();
}
