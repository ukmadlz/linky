"use client";

import { useEffect, useState } from "react";
import type { Link } from "@/lib/db/schema";

interface LinkEditorProps {
	link: Link | null;
	onSave: (data: Partial<Link>) => Promise<void>;
	onCancel: () => void;
}

const ICON_OPTIONS = ["🔗", "📱", "💼", "🎨", "📧", "🐦", "📸", "🎥", "🎵", "📝", "🛒", "💻"];

export default function LinkEditor({ link, onSave, onCancel }: LinkEditorProps) {
	const [formData, setFormData] = useState({
		title: link?.title || "",
		url: link?.url || "",
		icon: link?.icon || "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (link) {
			setFormData({
				title: link.title,
				url: link.url,
				icon: link.icon || "",
			});
		}
	}, [link]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Validation
		if (!formData.title.trim()) {
			setError("Title is required");
			return;
		}

		if (!formData.url.trim()) {
			setError("URL is required");
			return;
		}

		// Add https:// if no protocol
		let url = formData.url.trim();
		if (!url.startsWith("http://") && !url.startsWith("https://")) {
			url = `https://${url}`;
		}

		// Validate URL
		try {
			new URL(url);
		} catch {
			setError("Invalid URL");
			return;
		}

		setLoading(true);

		try {
			await onSave({
				title: formData.title.trim(),
				url,
				icon: formData.icon || null,
			});
		} catch (err) {
			setError("Failed to save link");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
			<h2 className="text-xl font-semibold mb-4">{link ? "Edit Link" : "Add New Link"}</h2>

			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
						Title *
					</label>
					<input
						type="text"
						id="title"
						value={formData.title}
						onChange={(e) => setFormData({ ...formData, title: e.target.value })}
						placeholder="My awesome link"
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>

				<div>
					<label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
						URL *
					</label>
					<input
						type="text"
						id="url"
						value={formData.url}
						onChange={(e) => setFormData({ ...formData, url: e.target.value })}
						placeholder="https://example.com"
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Icon (optional)</label>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => setFormData({ ...formData, icon: "" })}
							className={`w-10 h-10 border rounded-md flex items-center justify-center ${
								!formData.icon ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
							}`}
						>
							<span className="text-gray-400">—</span>
						</button>
						{ICON_OPTIONS.map((icon) => (
							<button
								key={icon}
								type="button"
								onClick={() => setFormData({ ...formData, icon })}
								className={`w-10 h-10 border rounded-md flex items-center justify-center text-xl ${
									formData.icon === icon
										? "border-blue-500 bg-blue-50"
										: "border-gray-300 hover:bg-gray-50"
								}`}
							>
								{icon}
							</button>
						))}
					</div>
				</div>

				<div className="flex gap-3 pt-4">
					<button
						type="submit"
						disabled={loading}
						className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "Saving..." : "Save"}
					</button>
					<button
						type="button"
						onClick={onCancel}
						disabled={loading}
						className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 disabled:opacity-50"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
