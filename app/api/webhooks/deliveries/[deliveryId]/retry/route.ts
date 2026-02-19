import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWebhookEndpointById } from "@/lib/db/queries";
import { deliverWebhook } from "@/lib/webhooks/deliver";
import { db } from "@/lib/db";
import { webhookDeliveries, webhookEndpoints } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ deliveryId: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const user = await requireAuth();
  const { deliveryId } = await params;

  // Fetch delivery and verify ownership
  const [delivery] = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, deliveryId))
    .limit(1);

  if (!delivery) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const endpoint = await getWebhookEndpointById(delivery.endpointId);
  if (!endpoint || endpoint.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Reset delivery status and retry
  await db
    .update(webhookDeliveries)
    .set({ statusCode: null, response: null, attempts: 0, deliveredAt: null })
    .where(eq(webhookDeliveries.id, deliveryId));

  // Fire-and-forget retry
  deliverWebhook(deliveryId, endpoint).catch(console.error);

  return NextResponse.json({ message: "Retry queued." });
}
