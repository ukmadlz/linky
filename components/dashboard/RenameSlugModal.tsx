"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { Page } from "@/lib/db/schema";

interface RenameSlugModalProps {
	page: Page;
	username: string;
	onSave: (updatedPage: Page) => void;
	onSkip: () => void;
}

export function RenameSlugModal({
	page,
	username,
	onSave,
	onSkip,
}: RenameSlugModalProps) {
	const [subSlug, setSubSlug] = useState(page.subSlug ?? "");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const sanitized = subSlug
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	const urlPrefix = username ? `biohasl.ink/${username}/` : "biohasl.ink/";

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!sanitized) {
			setError("URL is required.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			const res = await fetch(`/api/pages/${page.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subSlug: sanitized }),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				setError(body.error ?? "Failed to save URL.");
				return;
			}
			const updated = await res.json();
			onSave(updated);
		} catch {
			setError("Network error.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onSkip}
				aria-label="Close"
			/>
			<div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
				<div className="mb-5 flex items-center justify-between">
					<div>
						<h2 className="text-base font-semibold text-[#292d4c]">
							Rename page URL
						</h2>
						<p className="mt-0.5 text-sm text-slate-400">
							Choose a URL for your duplicated page, or skip to keep the
							generated one.
						</p>
					</div>
					<button
						type="button"
						onClick={onSkip}
						className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={handleSave} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="rename-sub-slug"
							className="text-sm font-medium text-slate-700"
						>
							Page URL
						</label>
						<div className="flex items-center gap-0 rounded-lg border border-slate-200 focus-within:border-[#5f4dc5] focus-within:ring-2 focus-within:ring-[#5f4dc5]/20">
							<span className="whitespace-nowrap rounded-l-lg border-r border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
								{urlPrefix}
							</span>
							<input
								id="rename-sub-slug"
								value={subSlug}
								onChange={(e) => setSubSlug(e.target.value)}
								maxLength={100}
								required
								className="min-w-0 flex-1 rounded-r-lg bg-transparent px-3 py-2 text-sm focus:outline-none"
							/>
						</div>
						{sanitized && sanitized !== subSlug && (
							<p className="text-xs text-slate-500">
								Will be saved as: {sanitized}
							</p>
						)}
					</div>

					{error && <p className="text-sm text-red-500">{error}</p>}

					<div className="flex gap-2 pt-1">
						<button
							type="submit"
							disabled={saving || !sanitized}
							className="flex-1 rounded-lg bg-[#5f4dc5] py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
						>
							{saving ? "Saving…" : "Save URL"}
						</button>
						<button
							type="button"
							onClick={onSkip}
							className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
						>
							Skip
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
