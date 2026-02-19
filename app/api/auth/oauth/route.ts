import { NextResponse } from "next/server";
import { getWorkOS } from "@/lib/workos";

export async function GET() {
  const workos = getWorkOS();

  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: "GoogleOAuth",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    clientId: process.env.WORKOS_CLIENT_ID!,
  });

  return NextResponse.redirect(authorizationUrl);
}
