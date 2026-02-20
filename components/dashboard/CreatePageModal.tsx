"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CreatePageModalProps {
	onClose: () => void;
	username: string;
}

export function CreatePageModal({ onClose, username }: CreatePageModalProps) {
	const [subSlug, setSubSlug] = useState("");
	const [title, setTitle] = useState("");
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	const sanitizedSubSlug = subSlug
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!sanitizedSubSlug) {
			setError("URL is required.");
			return;
		}
		setCreating(true);
		setError("");
		try {
			const res = await fetch("/api/pages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					subSlug: sanitizedSubSlug,
					title: title.trim() || sanitizedSubSlug,
				}),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				setError(body.error ?? "Failed to create page.");
				return;
			}
			const page = await res.json();
			router.push(`/dashboard/${page.id}`);
			router.refresh();
			onClose();
		} catch {
			setError("Network error.");
		} finally {
			setCreating(false);
		}
	}

	const urlPrefix = username ? `biohasl.ink/${username}/` : "biohasl.ink/";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onClose}
				aria-label="Close"
			/>
			<div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
				<div className="mb-5 flex items-center justify-between">
					<h2 className="text-base font-semibold text-[#292d4c]">
						Create new page
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={handleCreate} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="page-title"
							className="text-sm font-medium text-slate-700"
						>
							Page title
						</label>
						<input
							id="page-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="My Page"
							maxLength={200}
							className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="page-sub-slug"
							className="text-sm font-medium text-slate-700"
						>
							Page URL{" "}
							<span className="font-normal text-slate-400">(required)</span>
						</label>
						<div className="flex items-center gap-0 rounded-lg border border-slate-200 focus-within:border-[#5f4dc5] focus-within:ring-2 focus-within:ring-[#5f4dc5]/20">
							<span className="whitespace-nowrap rounded-l-lg border-r border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
								{urlPrefix}
							</span>
							<input
								id="page-sub-slug"
								value={subSlug}
								onChange={(e) => setSubSlug(e.target.value)}
								placeholder="my-page"
								maxLength={100}
								required
								className="min-w-0 flex-1 rounded-r-lg bg-transparent px-3 py-2 text-sm focus:outline-none"
							/>
						</div>
						{sanitizedSubSlug && sanitizedSubSlug !== subSlug && (
							<p className="text-xs text-slate-500">
								Will be saved as: {sanitizedSubSlug}
							</p>
						)}
					</div>

					{error && <p className="text-sm text-red-500">{error}</p>}

					<div className="flex gap-2 pt-1">
						<button
							type="submit"
							disabled={creating || !sanitizedSubSlug}
							className="flex-1 rounded-lg bg-[#5f4dc5] py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
						>
							{creating ? "Creating…" : "Create page"}
						</button>
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
