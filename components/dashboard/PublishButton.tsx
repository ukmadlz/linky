"use client";

import { useState } from "react";

interface PublishButtonProps {
	pageId: string;
	isPublished: boolean;
	onToggle?: (newIsPublished: boolean) => void;
}

export function PublishButton({
	pageId,
	isPublished,
	onToggle,
}: PublishButtonProps) {
	const [published, setPublished] = useState(isPublished);
	const [loading, setLoading] = useState(false);

	async function handleClick() {
		setLoading(true);
		const next = !published;
		try {
			const res = await fetch(`/api/pages/${pageId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isPublished: next }),
			});
			if (!res.ok) throw new Error("Failed");
			setPublished(next);
			onToggle?.(next);
		} catch {
			// revert optimistic update on failure
		} finally {
			setLoading(false);
		}
	}

	return published ? (
		<button
			type="button"
			onClick={handleClick}
			disabled={loading}
			className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
		>
			{loading ? "Saving…" : "Unpublish"}
		</button>
	) : (
		<button
			type="button"
			onClick={handleClick}
			disabled={loading}
			className="rounded-lg bg-[#5f4dc5] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
		>
			{loading ? "Saving…" : "Publish"}
		</button>
	);
}
