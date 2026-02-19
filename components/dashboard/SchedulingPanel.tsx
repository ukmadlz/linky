"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";
import type { Block } from "@/lib/db/schema";

interface SchedulingPanelProps {
	block: Block;
	pageId: string;
	onUpdate: (block: Block) => void;
}

function toDatetimeLocal(date: Date | null | undefined): string {
	if (!date) return "";
	// Format as YYYY-MM-DDTHH:MM for datetime-local input
	const d = new Date(date);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SchedulingPanel({
	block,
	pageId,
	onUpdate,
}: SchedulingPanelProps) {
	const [start, setStart] = useState(
		toDatetimeLocal(
			block.scheduledStart ? new Date(block.scheduledStart) : null,
		),
	);
	const [end, setEnd] = useState(
		toDatetimeLocal(block.scheduledEnd ? new Date(block.scheduledEnd) : null),
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const isScheduled = !!(block.scheduledStart || block.scheduledEnd);

	async function handleSave() {
		setSaving(true);
		setError("");
		setSuccess(false);
		try {
			const res = await fetch(`/api/pages/${pageId}/blocks/${block.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					scheduledStart: start ? new Date(start).toISOString() : null,
					scheduledEnd: end ? new Date(end).toISOString() : null,
				}),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				setError(err.error ?? "Failed to save schedule.");
				return;
			}
			const updated = await res.json();
			onUpdate(updated);
			setSuccess(true);
			setTimeout(() => setSuccess(false), 2000);
		} catch {
			setError("Network error.");
		} finally {
			setSaving(false);
		}
	}

	async function handleClear() {
		setSaving(true);
		setError("");
		try {
			const res = await fetch(`/api/pages/${pageId}/blocks/${block.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ scheduledStart: null, scheduledEnd: null }),
			});
			if (!res.ok) return;
			const updated = await res.json();
			onUpdate(updated);
			setStart("");
			setEnd("");
		} catch {
			setError("Network error.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<details className="rounded-lg border border-slate-200 bg-white">
			<summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 select-none">
				<Calendar className="h-3.5 w-3.5" />
				Scheduling
				{isScheduled && (
					<span className="ml-auto rounded-full bg-[#5f4dc5]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5f4dc5]">
						Active
					</span>
				)}
			</summary>

			<div className="flex flex-col gap-3 border-t border-slate-100 px-3 pb-3 pt-3">
				<p className="text-xs text-slate-500">
					Optionally set a window when this block is visible. Leave blank to
					always show.
				</p>

				<div className="grid grid-cols-2 gap-3">
					<div className="flex flex-col gap-1">
						<label
							htmlFor="schedule-start"
							className="text-xs font-medium text-slate-600"
						>
							Show from
						</label>
						<input
							id="schedule-start"
							type="datetime-local"
							value={start}
							onChange={(e) => setStart(e.target.value)}
							className="rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-[#5f4dc5] focus:outline-none focus:ring-1 focus:ring-[#5f4dc5]/30"
						/>
					</div>
					<div className="flex flex-col gap-1">
						<label
							htmlFor="schedule-end"
							className="text-xs font-medium text-slate-600"
						>
							Hide after
						</label>
						<input
							id="schedule-end"
							type="datetime-local"
							value={end}
							onChange={(e) => setEnd(e.target.value)}
							className="rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-[#5f4dc5] focus:outline-none focus:ring-1 focus:ring-[#5f4dc5]/30"
						/>
					</div>
				</div>

				{error && <p className="text-xs text-red-500">{error}</p>}

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="rounded-md bg-[#5f4dc5] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
					>
						{saving ? "Saving…" : success ? "Saved!" : "Save schedule"}
					</button>
					{isScheduled && (
						<button
							type="button"
							onClick={handleClear}
							disabled={saving}
							className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
						>
							Clear
						</button>
					)}
				</div>
			</div>
		</details>
	);
}
