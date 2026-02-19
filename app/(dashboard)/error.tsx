"use client";

import { useEffect } from "react";

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
			<div className="text-4xl">⚠️</div>
			<h2 className="text-lg font-semibold text-[#292d4c]">
				Something went wrong
			</h2>
			<p className="max-w-xs text-sm text-slate-500">
				{error.message || "An unexpected error occurred in the dashboard."}
			</p>
			<button
				type="button"
				onClick={reset}
				className="rounded-lg bg-[#5f4dc5] px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
			>
				Try again
			</button>
		</div>
	);
}
