"use client";

import { useEffect, useState } from "react";
import { usePostHogIdentify } from "@/hooks/usePostHogIdentify";

// Simple client-side hook to fetch session
function useSession() {
	// biome-ignore lint/suspicious/noExplicitAny: Session user type is complex
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/auth/session")
			.then((res) => res.json())
			.then((data) => {
				setUser(data.user);
				setLoading(false);
			})
			.catch(() => {
				setUser(null);
				setLoading(false);
			});
	}, []);

	return { user, loading };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { user } = useSession();

	// Identify user in PostHog
	usePostHogIdentify(user);

	return <>{children}</>;
}
