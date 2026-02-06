"use client";

import { useState } from "react";
import type { User } from "@/lib/db/schema";

interface AppearanceEditorProps {
	user: User;
}

const PRESET_COLORS = [
	{ name: "White", bg: "#ffffff", btn: "#000000", btnText: "#ffffff" },
	{ name: "Black", bg: "#000000", btn: "#ffffff", btnText: "#000000" },
	{ name: "Blue", bg: "#3b82f6", btn: "#ffffff", btnText: "#3b82f6" },
	{ name: "Purple", bg: "#a855f7", btn: "#ffffff", btnText: "#a855f7" },
	{ name: "Pink", bg: "#ec4899", btn: "#ffffff", btnText: "#ec4899" },
	{ name: "Green", bg: "#10b981", btn: "#ffffff", btnText: "#10b981" },
];

export default function AppearanceEditor({ user }: AppearanceEditorProps) {
	const currentTheme = user.theme ? JSON.parse(user.theme as string) : {};
	const [theme, setTheme] = useState({
		backgroundColor: currentTheme.backgroundColor || "#ffffff",
		buttonColor: currentTheme.buttonColor || "#000000",
		buttonTextColor: currentTheme.buttonTextColor || "#ffffff",
		fontFamily: currentTheme.fontFamily || "sans-serif",
	});
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleSave = async () => {
		setLoading(true);
		setSuccess(false);

		try {
			const response = await fetch("/api/user/theme", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ theme }),
			});

			if (response.ok) {
				setSuccess(true);
				setTimeout(() => setSuccess(false), 3000);
			}
		} catch (error) {
			console.error("Failed to save theme:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
			{/* Settings */}
			<div className="space-y-6">
				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-xl font-semibold mb-4">Color Presets</h2>
					<div className="grid grid-cols-2 gap-3">
						{PRESET_COLORS.map((preset) => (
							<button
								key={preset.name}
								onClick={() =>
									setTheme({
										...theme,
										backgroundColor: preset.bg,
										buttonColor: preset.btn,
										buttonTextColor: preset.btnText,
									})
								}
								className="p-4 border-2 border-gray-200 rounded-md hover:border-blue-500 transition-colors"
							>
								<div className="flex items-center gap-2">
									<div className="w-8 h-8 rounded" style={{ backgroundColor: preset.bg }} />
									<span className="text-sm font-medium">{preset.name}</span>
								</div>
							</button>
						))}
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-xl font-semibold mb-4">Custom Colors</h2>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Background Color
							</label>
							<input
								type="color"
								value={theme.backgroundColor}
								onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
								className="w-full h-12 rounded-md border border-gray-300 cursor-pointer"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
							<input
								type="color"
								value={theme.buttonColor}
								onChange={(e) => setTheme({ ...theme, buttonColor: e.target.value })}
								className="w-full h-12 rounded-md border border-gray-300 cursor-pointer"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Button Text Color
							</label>
							<input
								type="color"
								value={theme.buttonTextColor}
								onChange={(e) => setTheme({ ...theme, buttonTextColor: e.target.value })}
								className="w-full h-12 rounded-md border border-gray-300 cursor-pointer"
							/>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-xl font-semibold mb-4">Font</h2>
					<select
						value={theme.fontFamily}
						onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="sans-serif">Sans Serif</option>
						<option value="serif">Serif</option>
						<option value="monospace">Monospace</option>
					</select>
				</div>

				<button
					onClick={handleSave}
					disabled={loading}
					className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Saving..." : success ? "Saved!" : "Save Changes"}
				</button>
			</div>

			{/* Preview */}
			<div>
				<div className="sticky top-6">
					<h2 className="text-xl font-semibold mb-4">Preview</h2>
					<div
						className="rounded-lg shadow-lg p-8 min-h-[500px] flex flex-col items-center justify-center"
						style={{
							backgroundColor: theme.backgroundColor,
							fontFamily: theme.fontFamily,
						}}
					>
						<div className="w-24 h-24 bg-gray-300 rounded-full mb-4" />
						<h3 className="text-2xl font-bold mb-2">@{user.username}</h3>
						<p className="text-center text-gray-600 mb-8 max-w-sm">
							{user.bio || "Your bio will appear here"}
						</p>

						<div className="w-full max-w-md space-y-3">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="w-full py-3 px-6 rounded-lg font-medium text-center"
									style={{
										backgroundColor: theme.buttonColor,
										color: theme.buttonTextColor,
									}}
								>
									Sample Link {i}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
