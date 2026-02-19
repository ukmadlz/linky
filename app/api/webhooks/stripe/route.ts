import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.userId;

      if (!userId) break;

      const priceId = sub.items.data[0]?.price.id ?? "";
      const status = sub.status;
      const periodStart = new Date((sub.current_period_start ?? 0) * 1000);
      const periodEnd = new Date((sub.current_period_end ?? 0) * 1000);

      // Upsert subscription
      await db
        .insert(subscriptions)
        .values({
          id: nanoid(),
          userId,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          status,
          periodStart,
          periodEnd,
        })
        .onConflictDoUpdate({
          target: subscriptions.stripeSubscriptionId,
          set: { status, stripePriceId: priceId, periodStart, periodEnd, updatedAt: new Date() },
        });

      // Update user.isPro based on active subscription
      const isPro = status === "active" || status === "trialing";
      await db.update(users).set({ isPro }).where(eq(users.id, userId));

      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.userId;

      if (!userId) break;

      // Mark subscription as canceled
      await db
        .update(subscriptions)
        .set({ status: "canceled", updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));

      // Remove Pro status
      await db.update(users).set({ isPro: false }).where(eq(users.id, userId));

      break;
    }

    default:
      // Ignore other events
      break;
  }

  return NextResponse.json({ received: true });
}
