"use client";

import { Download, QrCode, X } from "lucide-react";
import QRCode from "qrcode";
import { useState } from "react";

interface QRCodeButtonProps {
	slug: string;
	pageTitle?: string | null;
}

export function QRCodeButton({ slug, pageTitle }: QRCodeButtonProps) {
	const [open, setOpen] = useState(false);
	const [svgData, setSvgData] = useState<string>("");
	const [loading, setLoading] = useState(false);

	const url = `https://biohasl.ink/${slug}`;

	async function handleOpen() {
		setOpen(true);
		if (!svgData) {
			setLoading(true);
			try {
				const svg = await QRCode.toString(url, {
					type: "svg",
					margin: 2,
					color: { dark: "#292d4c", light: "#ffffff" },
					width: 300,
				});
				setSvgData(svg);
			} catch {
				// ignore
			} finally {
				setLoading(false);
			}
		}
	}

	function downloadSVG() {
		const blob = new Blob([svgData], { type: "image/svg+xml" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `${slug}-qr.svg`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	async function downloadPNG() {
		try {
			const dataUrl = await QRCode.toDataURL(url, {
				type: "image/png",
				margin: 2,
				color: { dark: "#292d4c", light: "#ffffff" },
				width: 600,
			});
			const a = document.createElement("a");
			a.href = dataUrl;
			a.download = `${slug}-qr.png`;
			a.click();
		} catch {
			// ignore
		}
	}

	return (
		<>
			<button
				type="button"
				onClick={handleOpen}
				className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
				title="Get QR code"
			>
				<QrCode className="h-4 w-4" />
				QR code
			</button>

			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<button
						type="button"
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => setOpen(false)}
						aria-label="Close"
					/>
					<div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-base font-semibold text-[#292d4c]">
								QR Code — {pageTitle ?? slug}
							</h2>
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="flex items-center justify-center rounded-xl bg-slate-50 p-6">
							{loading ? (
								<div className="h-48 w-48 animate-pulse rounded-lg bg-slate-200" />
							) : svgData ? (
								<div
									className="h-48 w-48"
									// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG from qrcode library
									dangerouslySetInnerHTML={{ __html: svgData }}
								/>
							) : (
								<p className="text-sm text-slate-400">
									Failed to generate QR code.
								</p>
							)}
						</div>

						<p className="mt-3 text-center text-xs text-slate-400 break-all">
							{url}
						</p>

						<div className="mt-4 flex gap-2">
							<button
								type="button"
								onClick={downloadSVG}
								disabled={!svgData}
								className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
							>
								<Download className="h-4 w-4" />
								SVG
							</button>
							<button
								type="button"
								onClick={downloadPNG}
								className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#5f4dc5] py-2.5 text-sm font-semibold text-white hover:brightness-110"
							>
								<Download className="h-4 w-4" />
								PNG
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
