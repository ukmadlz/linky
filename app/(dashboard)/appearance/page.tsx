"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LivePreview } from "@/components/dashboard/LivePreview";
import { ThemeEditor } from "@/components/dashboard/ThemeEditor";
import { resolveTheme } from "@/lib/themes/resolve";
import type { ThemeConfig } from "@/lib/themes/types";

interface PageData {
	id: string;
	themeId: string | null;
	themeOverrides: Partial<ThemeConfig> | null;
}

export default function AppearancePage() {
	const [page, setPage] = useState<PageData | null>(null);
	const [loading, setLoading] = useState(true);
	const [themeId, setThemeId] = useState("default");
	const [overrides, setOverrides] = useState<Partial<ThemeConfig>>({});
	const [saving, setSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);

	useEffect(() => {
		fetch("/api/pages")
			.then((r) => r.json())
			.then((pages: PageData[]) => {
				const p = pages[0];
				if (p) {
					setPage(p);
					setThemeId(p.themeId ?? "default");
					setOverrides((p.themeOverrides as Partial<ThemeConfig>) ?? {});
				}
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	const currentTheme = resolveTheme(themeId, overrides);

	function handlePresetChange(newPresetId: string) {
		setThemeId(newPresetId);
		setOverrides({}); // reset overrides when switching preset
	}

	function handleOverrideChange(newOverrides: Partial<ThemeConfig>) {
		setOverrides(newOverrides);
	}

	async function handleSave() {
		if (!page) return;
		setSaving(true);

		try {
			await fetch(`/api/pages/${page.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					themeId,
					themeOverrides: Object.keys(overrides).length > 0 ? overrides : {},
				}),
			});
			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 3000);
		} catch {
			// silently ignore on error for now
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center p-16">
				<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
			</div>
		);
	}

	return (
		<div className="p-6 lg:p-8">
			<div className="mb-6 flex items-center justify-between">
				<h1
					className="font-display text-2xl font-semibold"
					style={{ color: "#292d4c" }}
				>
					Appearance
				</h1>
				{saveSuccess && (
					<span className="rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-700">
						Theme saved!
					</span>
				)}
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				{/* Theme controls */}
				<div>
					<ThemeEditor
						themeId={themeId}
						overrides={overrides}
						currentTheme={currentTheme}
						onPresetChange={handlePresetChange}
						onOverrideChange={handleOverrideChange}
						onSave={handleSave}
						saving={saving}
					/>
				</div>

				{/* Live preview */}
				<div className="lg:sticky lg:top-8 lg:self-start">
					<p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
						Live preview
					</p>
					<LivePreview theme={currentTheme} />
				</div>
			</div>
		</div>
	);
}
