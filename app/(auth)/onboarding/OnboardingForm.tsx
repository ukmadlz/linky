"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AvailabilityState =
	| { status: "idle" }
	| { status: "checking" }
	| { status: "available" }
	| { status: "unavailable"; reason: "taken" | "invalid" | "reserved" };

const REASON_MESSAGES: Record<string, string> = {
	taken: "That username is already taken.",
	reserved: "That username is reserved.",
	invalid:
		"Usernames must be 3–30 characters: lowercase letters, numbers, and hyphens only (no leading/trailing hyphens).",
};

export function OnboardingForm({
	defaultUsername,
	defaultName,
}: {
	defaultUsername?: string;
	defaultName?: string;
}) {
	const router = useRouter();
	const [username, setUsername] = useState(defaultUsername ?? "");
	const [displayName, setDisplayName] = useState(defaultName ?? "");
	const [availability, setAvailability] = useState<AvailabilityState>({
		status: "idle",
	});
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const checkAvailability = useCallback(async (value: string) => {
		if (!value) {
			setAvailability({ status: "idle" });
			return;
		}

		setAvailability({ status: "checking" });

		try {
			const res = await fetch(
				`/api/user/username/check?username=${encodeURIComponent(value)}`,
			);
			const data = await res.json();

			if (data.available) {
				setAvailability({ status: "available" });
			} else {
				setAvailability({
					status: "unavailable",
					reason: data.reason ?? "invalid",
				});
			}
		} catch {
			setAvailability({ status: "idle" });
		}
	}, []);

	useEffect(() => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);

		if (!username) {
			setAvailability({ status: "idle" });
			return;
		}

		debounceTimer.current = setTimeout(() => {
			checkAvailability(username);
		}, 300);

		return () => {
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
		};
	}, [username, checkAvailability]);

	// Pre-check default suggestion on mount
	useEffect(() => {
		if (defaultUsername) {
			checkAvailability(defaultUsername);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [checkAvailability, defaultUsername]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (availability.status !== "available") return;

		setSubmitting(true);
		setSubmitError(null);

		try {
			const res = await fetch("/api/auth/onboarding", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, name: displayName || undefined }),
			});

			if (res.ok) {
				router.push("/dashboard");
				router.refresh();
			} else {
				const data = await res.json().catch(() => ({}));
				if (res.status === 409 && data.reason === "taken") {
					setAvailability({ status: "unavailable", reason: "taken" });
					setSubmitError(
						"That username was just taken. Please choose another.",
					);
				} else {
					setSubmitError(
						data.error ?? "Something went wrong. Please try again.",
					);
				}
				setSubmitting(false);
			}
		} catch {
			setSubmitError("Network error. Please try again.");
			setSubmitting(false);
		}
	}

	const isReady = availability.status === "available" && !submitting;

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			{/* Username field */}
			<div className="space-y-1.5">
				<Label htmlFor="username">Username</Label>
				<div className="relative flex items-center">
					{/* Prefix */}
					<span className="absolute left-3 text-sm text-muted-foreground select-none pointer-events-none">
						biohasl.ink/
					</span>
					<Input
						id="username"
						type="text"
						autoCapitalize="none"
						autoCorrect="off"
						spellCheck={false}
						value={username}
						onChange={(e) =>
							setUsername(
								e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
							)
						}
						placeholder="yourname"
						className="pl-[calc(0.75rem+4.5rem)] pr-10"
						maxLength={30}
					/>
					{/* Availability indicator */}
					<span className="absolute right-3">
						{availability.status === "checking" && (
							<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						)}
						{availability.status === "available" && (
							<CheckCircle2 className="h-4 w-4 text-green-600" />
						)}
						{availability.status === "unavailable" && (
							<XCircle className="h-4 w-4 text-destructive" />
						)}
					</span>
				</div>

				{/* Status message */}
				{availability.status === "unavailable" && (
					<p className="text-xs text-destructive">
						{REASON_MESSAGES[availability.reason]}
					</p>
				)}
				{availability.status === "available" && (
					<p className="text-xs text-green-600">Username is available!</p>
				)}
				{availability.status === "idle" && (
					<p className="text-xs text-muted-foreground">
						3–30 characters. Lowercase letters, numbers, and hyphens only.
					</p>
				)}
			</div>

			{/* Display name field */}
			<div className="space-y-1.5">
				<Label htmlFor="displayName">
					Display name{" "}
					<span className="text-muted-foreground font-normal">(optional)</span>
				</Label>
				<Input
					id="displayName"
					type="text"
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
					placeholder="Your Name"
					maxLength={100}
				/>
			</div>

			{/* URL preview */}
			{username && (
				<p className="text-sm text-center text-muted-foreground bg-muted/50 rounded-lg py-2 px-3">
					Your page:{" "}
					<span className="font-medium text-foreground">
						biohasl.ink/{username}
					</span>
				</p>
			)}

			{/* Submit error */}
			{submitError && (
				<p className="text-sm text-destructive text-center">{submitError}</p>
			)}

			{/* Submit button */}
			<Button
				type="submit"
				disabled={!isReady}
				className="w-full h-11 font-medium"
			>
				{submitting ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Setting up your page…
					</>
				) : (
					<>Claim @{username || "username"}</>
				)}
			</Button>
		</form>
	);
}
