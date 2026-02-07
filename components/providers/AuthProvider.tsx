"use client";

import { useEffect, useState } from "react";
import { usePostHogIdentify } from "@/hooks/usePostHogIdentify";
import { useSession } from "@/lib/auth-client";
import type { User } from "@/lib/db/schema";

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		if (session?.user) {
			setUser(session.user as User);
		} else {
			setUser(null);
		}
	}, [session]);

	// Identify user in PostHog
	usePostHogIdentify(user);

	return <>{children}</>;
}
