"use client";

import { useEffect } from "react";
import type { User } from "@/lib/db/schema";
import { identifyUser, resetUserIdentification } from "@/lib/posthog-identification";

/**
 * Hook to automatically identify user in PostHog when authenticated
 * Use this in your root layout or auth provider
 */
export function usePostHogIdentify(user: User | null) {
	useEffect(() => {
		if (user) {
			identifyUser(user);
		} else {
			resetUserIdentification();
		}
	}, [user]);
}
