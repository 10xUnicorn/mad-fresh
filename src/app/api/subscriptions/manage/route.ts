import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeForStore } from "@/lib/stripe";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subscriptionId, action } = await req.json();
    // subscriptionId is the Supabase subscription row ID

    // Fetch the subscription to get stripe_subscription_id
    const { data: sub, error } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, customer_id, status")
      .eq("id", subscriptionId)
      .single();

    if (error || !sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    if (sub.customer_id !== user.id) return NextResponse.json({ error: "Not your subscription" }, { status: 403 });

    // If no Stripe subscription ID, just update locally (manual/imported subscriptions)
    if (!sub.stripe_subscription_id) {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (action === "pause") {
        const pauseUntil = new Date();
        pauseUntil.setDate(pauseUntil.getDate() + 7);
        updates.status = "paused";
        updates.paused_until = pauseUntil.toISOString();
      } else if (action === "resume") {
        updates.status = "active";
        updates.paused_until = null;
      } else if (action === "cancel") {
        updates.status = "cancelled";
        updates.cancelled_at = new Date().toISOString();
        updates.cancel_reason = "customer_request";
      }

      await supabase.from("subscriptions").update(updates).eq("id", subscriptionId);
      return NextResponse.json({ success: true, action });
    }

    const { stripe } = await getStripeForStore(STORE_ID);

    if (action === "pause") {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        pause_collection: { behavior: "void" },
      });
      // Also update local DB
      const pauseUntil = new Date();
      pauseUntil.setDate(pauseUntil.getDate() + 7);
      await supabase.from("subscriptions").update({
        status: "paused",
        paused_until: pauseUntil.toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", subscriptionId);

    } else if (action === "resume") {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        pause_collection: null,  // removes pause
      });
      await supabase.from("subscriptions").update({
        status: "active",
        paused_until: null,
        updated_at: new Date().toISOString(),
      }).eq("id", subscriptionId);

    } else if (action === "cancel") {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      await supabase.from("subscriptions").update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: "customer_request",
        updated_at: new Date().toISOString(),
      }).eq("id", subscriptionId);

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, action });
  } catch (err: unknown) {
    console.error("Subscription manage error:", err);
    const message = err instanceof Error ? err.message : "Failed to manage subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
