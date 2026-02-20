"use client";

import { useEffect, useRef, useState } from "react";

interface VerificationModalProps {
	blockId: string;
	verificationMode: "age" | "acknowledge";
	error?: string;
	cssVars: Record<string, string>;
	onClose: () => void;
}

export function VerificationModal({
	blockId,
	verificationMode,
	error: initialError,
	cssVars,
	onClose,
}: VerificationModalProps) {
	const isAge = verificationMode === "age";
	const [error, setError] = useState<string | undefined>(initialError);
	const [submitting, setSubmitting] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);

	// Dismiss on Escape key
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(undefined);
		setSubmitting(true);

		try {
			const formData = new FormData(e.currentTarget);
			const res = await fetch(`/api/verify/${blockId}`, {
				method: "POST",
				body: formData,
			});

			const json = await res.json();

			if (!res.ok) {
				setError(json.error ?? "invalid");
			} else {
				// Verification passed — open destination in a new tab and close the modal
				window.open(json.redirectUrl, "_blank", "noopener,noreferrer");
				onClose();
			}
		} catch {
			setError("invalid");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
			{/* Backdrop */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss */}
			<div
				className="absolute inset-0"
				style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
				onClick={onClose}
			/>

			{/* Dialog */}
			<div
				role="dialog"
				aria-modal="true"
				className="relative w-full max-w-sm rounded-xl p-8 shadow-xl"
				style={{ backgroundColor: "#ffffff" }}
			>
				{/* Header */}
				<div className="mb-6 text-center">
					<div
						className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
						style={{
							backgroundColor: `${cssVars["--btn-color"] || "#5f4dc5"}15`,
						}}
					>
						{isAge ? "🔞" : "⚠️"}
					</div>
					<h1
						className="font-display text-xl font-semibold"
						style={{ color: cssVars["--heading-color"] || "#292d4c" }}
					>
						{isAge ? "Age-Restricted Content" : "Mature Content"}
					</h1>
					<p
						className="mt-2 text-sm"
						style={{
							color: cssVars["--text-color"] || "#292d4c",
							opacity: 0.7,
						}}
					>
						{isAge
							? "This link contains age-restricted content. You must be 18 or older to continue."
							: "The following link may contain content not suitable for all audiences."}
					</p>
				</div>

				{/* Error state */}
				{error && (
					<div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
						{error === "underage"
							? "You must be 18 or older to access this link."
							: "Verification failed. Please try again."}
					</div>
				)}

				<form ref={formRef} onSubmit={handleSubmit}>
					{isAge ? (
						<>
							<p
								className="mb-3 text-xs font-medium"
								style={{ color: cssVars["--text-color"] || "#292d4c" }}
							>
								Enter your date of birth
							</p>
							<div className="mb-5 flex gap-2">
								<select
									name="day"
									required
									className="flex-1 rounded-lg border px-3 py-2.5 text-sm"
									style={{ borderColor: "#e5e7eb" }}
									defaultValue=""
								>
									<option value="" disabled>
										Day
									</option>
									{Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
										<option key={d} value={d}>
											{d}
										</option>
									))}
								</select>
								<select
									name="month"
									required
									className="flex-1 rounded-lg border px-3 py-2.5 text-sm"
									style={{ borderColor: "#e5e7eb" }}
									defaultValue=""
								>
									<option value="" disabled>
										Month
									</option>
									{[
										"January",
										"February",
										"March",
										"April",
										"May",
										"June",
										"July",
										"August",
										"September",
										"October",
										"November",
										"December",
									].map((m, i) => (
										<option key={m} value={i + 1}>
											{m}
										</option>
									))}
								</select>
								<select
									name="year"
									required
									className="flex-[1.5] rounded-lg border px-3 py-2.5 text-sm"
									style={{ borderColor: "#e5e7eb" }}
									defaultValue=""
								>
									<option value="" disabled>
										Year
									</option>
									{Array.from(
										{ length: 100 },
										(_, i) => new Date().getFullYear() - i,
									).map((y) => (
										<option key={y} value={y}>
											{y}
										</option>
									))}
								</select>
							</div>
							<button
								type="submit"
								disabled={submitting}
								className="w-full rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 hover:brightness-110 disabled:opacity-60"
								style={{
									backgroundColor: cssVars["--btn-color"] || "#5f4dc5",
									color: cssVars["--btn-text-color"] || "#ffffff",
									borderRadius: cssVars["--btn-radius"] || "0.5rem",
								}}
							>
								{submitting ? "Verifying…" : "Continue"}
							</button>
							<p
								className="mt-4 text-center text-xs"
								style={{
									color: cssVars["--text-color"] || "#292d4c",
									opacity: 0.5,
								}}
							>
								We do not store your date of birth. Age is verified on your
								device.
							</p>
						</>
					) : (
						<>
							<button
								type="submit"
								disabled={submitting}
								className="w-full rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 hover:brightness-110 disabled:opacity-60"
								style={{
									backgroundColor: cssVars["--btn-color"] || "#5f4dc5",
									color: cssVars["--btn-text-color"] || "#ffffff",
									borderRadius: cssVars["--btn-radius"] || "0.5rem",
								}}
							>
								{submitting ? "Loading…" : "Continue"}
							</button>
							<button
								type="button"
								onClick={onClose}
								className="mt-3 block w-full rounded-lg border py-2.5 text-center text-sm font-medium transition-all duration-200"
								style={{
									borderColor: "#e5e7eb",
									color: cssVars["--text-color"] || "#292d4c",
								}}
							>
								Go back
							</button>
						</>
					)}
				</form>
			</div>
		</div>
	);
}
