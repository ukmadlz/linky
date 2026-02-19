"use client";

import { useState } from "react";
import type { CustomCodeBlockData } from "@/lib/blocks/schemas";
import type { Block } from "@/lib/db/schema";

interface CustomCodeEditorProps {
	block: Block;
	onSave: (data: Record<string, unknown>) => Promise<void>;
	onCancel: () => void;
}

export function CustomCodeEditor({
	block,
	onSave,
	onCancel,
}: CustomCodeEditorProps) {
	const initial = block.data as unknown as CustomCodeBlockData;
	const [html, setHtml] = useState(initial.html ?? "");
	const [css, setCss] = useState(initial.css ?? "");
	const [saving, setSaving] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		// sanitized flag will be set server-side on save
		await onSave({ html, css: css || undefined, sanitized: false });
		setSaving(false);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
				<strong>Allowed HTML:</strong> div, span, p, a, img, ul, ol, li, h1–h6,
				strong, em, br, iframe (from allowed domains).{" "}
				<strong>Stripped:</strong> script tags, event handlers (onclick, etc.),
				javascript: URLs.
			</div>

			<div>
				<label
					htmlFor="custom-code-html"
					className="mb-1 block text-xs font-medium text-slate-600"
				>
					HTML
				</label>
				<textarea
					id="custom-code-html"
					value={html}
					onChange={(e) => setHtml(e.target.value)}
					placeholder="<div>Your custom HTML here</div>"
					rows={6}
					spellCheck={false}
					className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
				/>
			</div>

			<div>
				<label
					htmlFor="custom-code-css"
					className="mb-1 block text-xs font-medium text-slate-600"
				>
					CSS (scoped to this block)
				</label>
				<textarea
					id="custom-code-css"
					value={css}
					onChange={(e) => setCss(e.target.value)}
					placeholder=".my-class { color: red; }"
					rows={4}
					spellCheck={false}
					className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
				/>
				<p className="mt-1 text-xs text-slate-400">
					CSS is automatically scoped to this block&apos;s container — your
					styles won&apos;t affect the rest of the page.
				</p>
			</div>

			<div className="flex gap-2">
				<button
					type="submit"
					disabled={saving}
					className="rounded-lg bg-[#5f4dc5] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
				>
					{saving ? "Saving…" : "Save"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
