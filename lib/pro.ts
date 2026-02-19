import { redirect } from "next/navigation";
import { requireAuth } from "./auth";

/**
 * Requires the current user to have an active Pro subscription.
 * Redirects to /dashboard?upgrade=true if not Pro.
 */
export async function requirePro() {
  const user = await requireAuth();

  if (!user.isPro) {
    redirect("/dashboard?upgrade=true");
  }

  return user;
}

/**
 * Returns whether the current user is Pro without redirecting.
 * Use in components to conditionally render upgrade prompts.
 */
export function isProUser(isPro: boolean): boolean {
  return isPro;
}
