"use client";

import { useEffect, useState } from "react";
import { usePostHog } from "posthog-js/react";

/**
 * Cookie consent banner for GDPR compliance
 * Manages user consent for analytics tracking
 */
export function CookieConsent() {
	const [showBanner, setShowBanner] = useState(false);
	const posthog = usePostHog();

	useEffect(() => {
		// Check if user has already made a choice
		const consent = localStorage.getItem("cookie-consent");
		if (!consent) {
			setShowBanner(true);
		} else if (consent === "accepted") {
			posthog?.opt_in_capturing();
		} else if (consent === "rejected") {
			posthog?.opt_out_capturing();
		}
	}, [posthog]);

	const acceptCookies = () => {
		localStorage.setItem("cookie-consent", "accepted");
		posthog?.opt_in_capturing();
		setShowBanner(false);
	};

	const rejectCookies = () => {
		localStorage.setItem("cookie-consent", "rejected");
		posthog?.opt_out_capturing();
		setShowBanner(false);
	};

	if (!showBanner) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-lg">
			<div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
				<div className="flex-1">
					<p className="text-sm">
						We use cookies and similar technologies to improve your experience, analyze site usage,
						and personalize content. By clicking "Accept", you consent to the use of cookies for
						analytics.{" "}
						<a href="/privacy" className="underline hover:text-gray-300">
							Learn more
						</a>
					</p>
				</div>
				<div className="flex gap-3">
					<button
						type="button"
						onClick={rejectCookies}
						className="px-4 py-2 text-sm border border-gray-600 rounded hover:bg-gray-800"
					>
						Reject
					</button>
					<button
						type="button"
						onClick={acceptCookies}
						className="px-4 py-2 text-sm bg-blue-600 rounded hover:bg-blue-700"
					>
						Accept
					</button>
				</div>
			</div>
		</div>
	);
}
