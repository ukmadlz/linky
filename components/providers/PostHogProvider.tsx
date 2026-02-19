"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initPostHog, posthog } from "@/lib/posthog/client";

interface PostHogProviderProps {
  children: React.ReactNode;
  userId?: string;
  email?: string;
  username?: string;
}

export function PostHogProvider({
  children,
  userId,
  email,
  username,
}: PostHogProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    initPostHog();
  }, []);

  // Identify user on login
  useEffect(() => {
    if (userId) {
      posthog.identify(userId, {
        email,
        username,
      });
    }
  }, [userId, email, username]);

  // Track dashboard pageviews manually
  useEffect(() => {
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname]);

  return <>{children}</>;
}

export function resetPostHog() {
  posthog.reset();
}
