"use client";

import { Component, type ReactNode } from "react";
import { trackError } from "@/lib/posthog-error-tracking";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Track error in PostHog with component stack
		trackError(error, {
			component_stack: errorInfo.componentStack,
			error_boundary: true,
		});

		// Log to console in development
		if (process.env.NODE_ENV === "development") {
			console.error("Error caught by boundary:", error, errorInfo);
		}
	}

	render() {
		if (this.state.hasError) {
			// Use custom fallback if provided, otherwise use default
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
					<div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
						<div className="mb-4">
							<svg
								className="mx-auto h-12 w-12 text-red-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								role="img"
								aria-label="Error icon"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
						<p className="text-gray-600 mb-6">
							We've encountered an unexpected error. Our team has been notified and we're working on
							it.
						</p>
						<button
							type="button"
							onClick={() => {
								this.setState({ hasError: false, error: null });
								window.location.href = "/";
							}}
							className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
						>
							Return to Home
						</button>
						{process.env.NODE_ENV === "development" && this.state.error && (
							<div className="mt-6 p-4 bg-gray-100 rounded-md text-left">
								<p className="text-sm font-mono text-gray-800 break-all">
									{this.state.error.message}
								</p>
							</div>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
