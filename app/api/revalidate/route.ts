import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const { secret, username } = await request.json();

    // Validate secret token
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Revalidate the username page
    revalidatePath(`/${username}`);

    return NextResponse.json({
      success: true,
      revalidated: true,
      path: `/${username}`,
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
