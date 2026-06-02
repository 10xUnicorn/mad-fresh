import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { amount, reason, type } = await request.json();

    const supabase = await createClient();

    // Verify admin auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate refund amount — account for previous refunds
    const previouslyRefunded = Number(order.refunded_amount) || 0;
    const maxRefundable = Number(order.total_amount) - previouslyRefunded;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Refund amount must be greater than zero" },
        { status: 400 }
      );
    }

    if (amount > maxRefundable) {
      return NextResponse.json(
        {
          error: `Refund amount ($${amount.toFixed(2)}) exceeds refundable balance ($${maxRefundable.toFixed(2)}). Previously refunded: $${previouslyRefunded.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Process Stripe refund if payment intent exists
    if (order.stripe_payment_intent_id) {
      try {
        const stripe = getStripe();
        await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent_id,
          amount: Math.round(amount * 100), // Convert to cents
          reason: "requested_by_customer",
        });
      } catch (stripeError: any) {
        console.error("Stripe refund error:", stripeError);
        return NextResponse.json(
          { error: `Stripe refund failed: ${stripeError.message}` },
          { status: 500 }
        );
      }
    }

    // Calculate new totals
    const newRefundedAmount = previouslyRefunded + amount;
    const isFullyRefunded = newRefundedAmount >= Number(order.total_amount);
    const newPaymentStatus = isFullyRefunded ? "refunded" : "partially_refunded";

    const updates: Record<string, unknown> = {
      payment_status: newPaymentStatus,
      refunded_amount: newRefundedAmount,
    };

    if (isFullyRefunded) {
      updates.status = "refunded";
    }

    // Log the refund in admin notes + update in single query
    const notePrefix = order.admin_notes ? order.admin_notes + "\n\n" : "";
    const refundNote = `[REFUND ${new Date().toISOString()}] ${isFullyRefunded ? "Full" : "Partial"} refund of $${amount.toFixed(2)} (total refunded: $${newRefundedAmount.toFixed(2)})${reason ? ` — ${reason}` : ""}`;
    updates.admin_notes = notePrefix + refundNote;

    await supabase.from("orders").update(updates).eq("id", orderId);

    return NextResponse.json({
      success: true,
      refund_amount: amount,
      total_refunded: newRefundedAmount,
      payment_status: newPaymentStatus,
    });
  } catch (err) {
    console.error("Refund error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
