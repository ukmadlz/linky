"use client";

import { useEffect, useState } from "react";
import { usePostHogIdentify } from "@/hooks/usePostHogIdentify";
import { useSession } from "@/lib/auth-client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();
	// biome-ignore lint/suspicious/noExplicitAny: Session user type is complex
	const [user, setUser] = useState<any>(null);

	useEffect(() => {
		if (session?.user) {
			setUser(session.user);
		} else {
			setUser(null);
		}
	}, [session]);

	// Identify user in PostHog
	usePostHogIdentify(user);

	return <>{children}</>;
}
