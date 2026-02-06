import { NextResponse } from "next/server";
import { incrementLinkClicks, getLinkById, getUserById } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const { linkId } = await request.json();

    if (!linkId) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 }
      );
    }

    // Get link
    const link = await getLinkById(linkId);
    if (!link) {
      return NextResponse.json(
        { error: "Link not found" },
        { status: 404 }
      );
    }

    // Increment click count
    await incrementLinkClicks(linkId);

    // Check if user is Pro for detailed tracking
    const user = await getUserById(link.userId);

    // TODO: Store detailed click data in linkClicks table for Pro users
    // This will be implemented when PostHog integration is complete

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Click tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    );
  }
}
