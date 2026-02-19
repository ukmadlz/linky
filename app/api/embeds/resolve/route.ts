import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveEmbed } from "@/lib/embeds/resolve";
import { captureServerEvent } from "@/lib/posthog/server";
import { getSession } from "@/lib/session";

const schema = z.object({
  url: z.string().url("Must be a valid URL"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = schema.parse(body);

    const embedData = await resolveEmbed(url);

    // Track embed resolution (non-blocking)
    const session = await getSession();
    if (session.userId) {
      captureServerEvent(session.userId, "embed_resolved", {
        provider_name: embedData.providerName,
        embed_type: embedData.embedType,
      }).catch(console.error);
    }

    return NextResponse.json(embedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid URL", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[embed resolve]", error);
    return NextResponse.json(
      { error: "Failed to resolve embed" },
      { status: 500 }
    );
  }
}
