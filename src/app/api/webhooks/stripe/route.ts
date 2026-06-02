import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeForStore } from "@/lib/stripe";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const { stripe, settings } = await getStripeForStore(STORE_ID);
    const webhookSecret = settings.stripe_webhook_secret_encrypted || process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Dynamic import to avoid loading Supabase at module level
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const storeId = pi.metadata?.store_id;
        if (!storeId) break;

        // Handle donation payments
        if (pi.metadata?.type === "donation") {
          const { error: donationError } = await supabase
            .from("donations")
            .update({
              payment_status: "succeeded",
              updated_at: new Date().toISOString(),
            })
            .eq("payment_intent_id", pi.id);

          if (donationError) {
            console.error(`Failed to update donation for PI ${pi.id}:`, donationError);
          } else {
            console.log(`Donation payment succeeded: ${pi.id} for store ${storeId}`);
          }

          // Log notification for donation
          const donorName = pi.metadata?.donor_name || "A donor";
          const meals = pi.metadata?.meals_equivalent || "0";
          await supabase.from("notification_log").insert({
            store_id: storeId,
            recipient_email: pi.receipt_email || pi.metadata?.customer_email || "store@madfresh.app",
            notification_type: "donation_received",
            channel: "system",
            subject: `Donation received: $${(pi.amount / 100).toFixed(2)}`,
            body_preview: `${donorName} donated $${(pi.amount / 100).toFixed(2)} (${meals} meal${meals === "1" ? "" : "s"})`,
            reference_type: "donation",
            reference_id: pi.id,
            status: "sent",
          });

          break;
        }

        // Update order: confirm status and mark payment as paid
        // The order was created server-side during checkout with status "pending_payment"
        const { data: updatedOrder, error: updateOrderError } = await supabase
          .from("orders")
          .update({
            status: "confirmed",
            payment_status: "paid",
            payment_method: pi.payment_method_types?.[0] || "card",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", pi.id)
          .select("id, order_number")
          .single();

        if (updateOrderError) {
          console.error(`Failed to update order for PI ${pi.id}:`, updateOrderError);

          // Fallback: if no order exists (e.g. old flow or race condition), create one
          if (updateOrderError.code === "PGRST116") {
            console.log(`No existing order found for PI ${pi.id}, creating from metadata...`);
            const meta = pi.metadata;
            const itemsFromMeta = meta.items_json ? JSON.parse(meta.items_json) : [];
            const fallbackOrderNumber = `MF-${String(Date.now()).slice(-5)}${String(Math.floor(Math.random() * 100)).padStart(2, "0")}`;

            const { error: createErr } = await supabase.from("orders").insert({
              store_id: storeId,
              customer_id: meta.user_id || null,
              order_number: fallbackOrderNumber,
              order_type: meta.order_type || "individual",
              status: "confirmed",
              payment_status: "paid",
              stripe_payment_intent_id: pi.id,
              stripe_customer_id: pi.customer as string || null,
              payment_method: pi.payment_method_types?.[0] || "card",
              items_subtotal: Number(meta.subtotal) || 0,
              discount_amount: Number(meta.total_discount) || 0,
              discount_code: meta.coupon_code || null,
              delivery_fee: Number(meta.delivery_fee) || 0,
              service_fee: 0,
              tax_amount: Number(meta.tax) || 0,
              tip_amount: 0,
              donation_amount: 0,
              total_amount: pi.amount / 100,
              fulfillment_type: meta.fulfillment_type || "pickup",
              source: "website",
              customer_email: pi.receipt_email || meta.customer_email || null,
            });

            if (createErr) {
              console.error(`Fallback order creation failed for PI ${pi.id}:`, createErr);
            } else {
              console.log(`Fallback order created: ${fallbackOrderNumber} for PI ${pi.id}`);
            }
          }
        } else {
          console.log(`Order ${updatedOrder?.order_number} confirmed for PI ${pi.id}`);
        }

        // Increment promo code usage if one was applied
        const couponCode = pi.metadata?.coupon_code;
        if (couponCode) {
          // Try promotions table first
          const { data: promoMatch } = await supabase
            .from("promotions")
            .select("id, current_uses")
            .eq("code", couponCode)
            .eq("store_id", storeId)
            .single();
          if (promoMatch) {
            await supabase
              .from("promotions")
              .update({ current_uses: (promoMatch.current_uses || 0) + 1 })
              .eq("id", promoMatch.id);
          } else {
            // Fall back to coupons table
            const { data: couponMatch } = await supabase
              .from("coupons")
              .select("id, current_uses")
              .eq("code", couponCode)
              .eq("store_id", storeId)
              .single();
            if (couponMatch) {
              await supabase
                .from("coupons")
                .update({ current_uses: (couponMatch.current_uses || 0) + 1 })
                .eq("id", couponMatch.id);
            }
          }
        }

        // Log notification for payment success
        const email = pi.receipt_email || pi.metadata?.customer_email;
        if (email) {
          await supabase.from("notification_log").insert({
            store_id: storeId,
            recipient_email: email,
            notification_type: "payment_received",
            channel: "system",
            subject: `Payment received: $${(pi.amount / 100).toFixed(2)}`,
            body_preview: `Payment of $${(pi.amount / 100).toFixed(2)} received via Stripe`,
            reference_type: "payment",
            reference_id: pi.id,
            status: "sent",
          });
        }

        console.log(`Payment succeeded: ${pi.id} for store ${storeId}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", pi.id);

        console.log(`Payment failed: ${pi.id}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId = charge.payment_intent as string;
        if (piId) {
          const refundStatus = charge.amount_refunded === charge.amount ? "refunded" : "partially_refunded";
          await supabase
            .from("orders")
            .update({
              payment_status: refundStatus,
              status: refundStatus === "refunded" ? "refunded" : undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_payment_intent_id", piId);
        }
        console.log(`Refund processed: ${charge.id}`);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const subId = session.subscription as string;
        const planId = session.metadata?.plan_id;
        const userId = session.metadata?.user_id;
        const sessionStoreId = session.metadata?.store_id;
        const sessionBillingInterval = session.metadata?.billing_interval || "weekly";
        const sessionMealSize = session.metadata?.meal_size || "medium";
        const sessionCuisines = session.metadata?.cuisine_preferences
          ? JSON.parse(session.metadata.cuisine_preferences)
          : [];

        if (!planId || !userId || !sessionStoreId) break;

        // Check if subscription record already exists (idempotency)
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", subId)
          .single();

        if (!existingSub) {
          // Fetch plan to get price
          const { data: planData } = await supabase
            .from("subscription_plans")
            .select("price_weekly, price_monthly, price_annual")
            .eq("id", planId)
            .single();

          const priceMap: Record<string, number> = {
            weekly: planData?.price_weekly || 0,
            monthly: planData?.price_monthly || 0,
            annual: planData?.price_annual || 0,
          };

          // Calculate next Sunday for delivery
          const now = new Date();
          const dayOfWeek = now.getDay();
          const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
          const nextSunday = new Date(now);
          nextSunday.setDate(now.getDate() + daysUntilSunday);

          await supabase.from("subscriptions").insert({
            customer_id: userId,
            store_id: sessionStoreId,
            plan_id: planId,
            status: "active",
            billing_interval: sessionBillingInterval,
            current_price: priceMap[sessionBillingInterval] || 0,
            stripe_subscription_id: subId,
            start_date: new Date().toISOString().split("T")[0],
            next_delivery_date: nextSunday.toISOString().split("T")[0],
            delivery_day: "sunday",
            is_founding_member: false,
            meal_size: sessionMealSize,
            cuisine_preferences: sessionCuisines,
          });
        }

        console.log(`Subscription checkout completed: ${subId} for user ${userId}`);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const subStoreId = sub.metadata?.store_id;
        if (subStoreId) {
          const status = sub.status === "active" ? "active" :
                        sub.status === "past_due" ? "past_due" :
                        sub.status === "canceled" ? "cancelled" : "active";

          await supabase
            .from("subscriptions")
            .update({
              status,
              stripe_subscription_id: sub.id,
              next_billing_date: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", sub.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.metadata?.catering_order_id) {
          await supabase
            .from("catering_orders")
            .update({
              status: "confirmed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoice.metadata.catering_order_id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
