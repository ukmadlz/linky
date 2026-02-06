import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { updateUser, createSubscription, deleteSubscription, getUserByStripeCustomerId } from "@/lib/db/queries";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder"
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error("No userId in checkout session metadata");
          break;
        }

        // Update user to Pro
        await updateUser(userId, {
          isPro: true,
          stripeCustomerId: session.customer as string,
        });

        // Get subscription details
        const subscriptionId = session.subscription as string;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Create subscription record
          await createSubscription({
            userId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: subscription.items.data[0].price.id,
            status: subscription.status,
            periodStart: new Date((subscription as any).current_period_start * 1000),
            periodEnd: new Date((subscription as any).current_period_end * 1000),
          });
        }

        console.log(`User ${userId} upgraded to Pro`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        // For now we'll skip this as we need to query the user
        // In production, store customerId in metadata or query by it

        console.log(`Subscription ${subscription.id} updated`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID and downgrade
        const user = await getUserByStripeCustomerId(customerId);
        if (user) {
          await updateUser(user.id, { isPro: false });
          await deleteSubscription(user.id);
          console.log(`User ${user.id} downgraded to Free`);
        } else {
          console.log(`Subscription ${subscription.id} cancelled for customer ${customerId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for invoice ${invoice.id}`);
        // Optionally notify user or take action
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
