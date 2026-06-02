import { NextRequest, NextResponse } from "next/server";
import { getStripeForStore, toCents } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

// POST: Create a refund for an order
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check - only admin users
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin role check
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin", "manager", "staff"])
      .maybeSingle();

    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, amount, reason } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const { stripe } = await getStripeForStore(STORE_ID);

    // Fetch order to get payment intent and validate amount
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.stripe_payment_intent_id) {
      return NextResponse.json({ error: "No payment found for this order" }, { status: 400 });
    }

    if (order.payment_status === "refunded") {
      return NextResponse.json({ error: "Order already refunded" }, { status: 400 });
    }

    // Validate refund amount doesn't exceed order total
    if (amount && amount > order.total_amount) {
      return NextResponse.json(
        { error: `Refund amount cannot exceed order total of $${order.total_amount.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Create refund — full or partial
    const refundParams: Record<string, unknown> = {
      payment_intent: order.stripe_payment_intent_id,
      reason: reason || "requested_by_customer",
    };

    if (amount) {
      refundParams.amount = toCents(amount);
    }

    const refund = await stripe.refunds.create(refundParams as Parameters<typeof stripe.refunds.create>[0]);

    // Update order status
    const isFullRefund = !amount || amount >= order.total_amount;
    await supabase
      .from("orders")
      .update({
        payment_status: isFullRefund ? "refunded" : "partially_refunded",
        status: isFullRefund ? "refunded" : order.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return NextResponse.json({
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      isFullRefund,
    });
  } catch (error: unknown) {
    console.error("Refund error:", error);
    const message = error instanceof Error ? error.message : "Failed to process refund";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
