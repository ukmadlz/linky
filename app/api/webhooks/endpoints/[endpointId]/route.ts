import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  getWebhookEndpointById,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  getWebhookDeliveriesByEndpoint,
} from "@/lib/db/queries";
import { deleteSecret } from "@/lib/webhooks/vault";

interface Params {
  params: Promise<{ endpointId: string }>;
}

const updateSchema = z.object({
  url: z.string().url().optional(),
  events: z
    .array(z.enum(["page.viewed", "link.clicked", "page.updated", "block.created", "block.deleted"]))
    .min(1)
    .optional(),
  isActive: z.boolean().optional(),
});

async function getAuthorized(endpointId: string, userId: string) {
  const endpoint = await getWebhookEndpointById(endpointId);
  if (!endpoint || endpoint.userId !== userId) return null;
  return endpoint;
}

export async function GET(_req: Request, { params }: Params) {
  const user = await requireAuth();
  const { endpointId } = await params;

  const endpoint = await getAuthorized(endpointId, user.id);
  if (!endpoint) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deliveries = await getWebhookDeliveriesByEndpoint(endpointId, 20);
  return NextResponse.json({ endpoint, deliveries });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await requireAuth();
  const { endpointId } = await params;

  const endpoint = await getAuthorized(endpointId, user.id);
  if (!endpoint) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const updated = await updateWebhookEndpoint(endpointId, parsed.data);
  if (!updated) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireAuth();
  const { endpointId } = await params;

  const endpoint = await getAuthorized(endpointId, user.id);
  if (!endpoint) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Remove secret from Vault before deleting DB row
  try {
    await deleteSecret(endpoint.secretVaultId);
  } catch {
    // Log but don't block deletion if Vault operation fails
    console.error(`[webhook] Failed to delete Vault secret ${endpoint.secretVaultId}`);
  }

  await deleteWebhookEndpoint(endpointId);
  return new Response(null, { status: 204 });
}
