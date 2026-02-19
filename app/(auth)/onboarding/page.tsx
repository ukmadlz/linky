import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db/queries";
import { getSession } from "@/lib/session";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = {
	title: "Choose your username — biohasl.ink",
};

export default async function OnboardingPage() {
	const session = await getSession();

	// Must be logged in
	if (!session.userId) {
		redirect("/login");
	}

	// If already onboarded, skip to dashboard
	if (session.username) {
		redirect("/dashboard");
	}

	// Fetch user to get pre-fill data from Google profile
	const user = await getUserById(session.userId);
	if (!user) {
		redirect("/login");
	}

	// Suggest a username based on their display name
	const suggestion = user.name
		? user.name
				.toLowerCase()
				.replace(/\s+/g, "-")
				.replace(/[^a-z0-9-]/g, "")
				.replace(/^-+|-+$/g, "")
				.slice(0, 30) || undefined
		: undefined;

	return (
		<div className="bg-white rounded-2xl shadow-xl border border-border p-8 md:p-10">
			{/* Brand */}
			<div className="text-center mb-8">
				<span className="font-serif text-3xl font-bold text-foreground tracking-tight">
					biohasl.ink
				</span>
				<h1 className="font-serif text-2xl font-semibold text-foreground mt-4">
					Choose your username
				</h1>
				<p className="text-muted-foreground mt-2 text-sm">
					This becomes your page URL — choose wisely, you can change it later in
					settings.
				</p>
			</div>

			<OnboardingForm
				defaultUsername={suggestion}
				defaultName={user.name ?? undefined}
			/>
		</div>
	);
}
