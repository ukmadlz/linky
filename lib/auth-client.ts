import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;

// Custom hook to get user from session
export function useUser() {
  const session = useSession();
  return {
    data: session.data?.user,
    isLoading: session.isPending,
  };
}
