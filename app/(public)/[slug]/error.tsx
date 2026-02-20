"use client";

import { useEffect } from "react";
import { posthog } from "@/lib/posthog/client";

export default function PublicPageError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
		posthog.captureException(error, {
			digest: error.digest,
			location: "public_page_error_boundary",
		});
	}, [error]);

	return (
		<div
			className="flex min-h-screen flex-col items-center justify-center px-4"
			style={{ backgroundColor: "#f7f5f4" }}
		>
			<div className="text-center">
				<p className="text-4xl">😕</p>
				<h2
					className="mt-4 font-display text-xl font-semibold"
					style={{ color: "#292d4c" }}
				>
					Something went wrong
				</h2>
				<p className="mt-2 text-sm" style={{ color: "#67697f" }}>
					{error.message || "Failed to load this page."}
				</p>
				<button
					type="button"
					onClick={reset}
					className="mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
					style={{ backgroundColor: "#5f4dc5" }}
				>
					Try again
				</button>
			</div>
		</div>
	);
}
