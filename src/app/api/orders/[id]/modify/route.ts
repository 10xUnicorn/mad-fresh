import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripeForStore, toCents } from "@/lib/stripe";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

interface AddItemRequest {
  recipe_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ModifyRequest {
  action: "add_tip" | "add_items" | "get_status";
  tipAmount?: number;
  items?: AddItemRequest[];
}

/**
 * Check if the order is still within the modification window.
 * Customers can modify until 1 hour before pickup/ready time.
 */
function isWithinModificationWindow(order: Record<string, unknown>): { allowed: boolean; deadline: string | null; reason?: string } {
  // Don't allow modifications on cancelled/refunded/completed orders
  const terminalStatuses = ["cancelled", "refunded", "completed", "delivered"];
  if (terminalStatuses.includes(order.status as string)) {
    return { allowed: false, deadline: null, reason: "This order can no longer be modified." };
  }

  // Calculate the deadline: 1 hour before scheduled pickup/ready time
  const scheduledFor = order.scheduled_for as string | null;
  const pickupTime = order.pickup_time as string | null;

  if (!scheduledFor) {
    // No scheduled time — allow modifications for 24 hours after order creation
    const createdAt = new Date(order.created_at as string);
    const deadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    return {
      allowed: now < deadline,
      deadline: deadline.toISOString(),
      reason: now >= deadline ? "The modification window has closed." : undefined,
    };
  }

  // Parse scheduled date + time slot into a deadline
  let deadlineDate = new Date(scheduledFor);

  // Map time slots to hours
  const timeSlotMap: Record<string, number> = {
    morning: 10,    // 10 AM
    afternoon: 14,  // 2 PM
    evening: 18,    // 6 PM
  };

  if (pickupTime && timeSlotMap[pickupTime]) {
    deadlineDate.setHours(timeSlotMap[pickupTime], 0, 0, 0);
  } else if (pickupTime) {
    // Try to parse as HH:MM format
    const match = pickupTime.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      deadlineDate.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
    } else {
      // Default to end of day
      deadlineDate.setHours(23, 59, 0, 0);
    }
  } else {
    // Default to noon on scheduled day
    deadlineDate.setHours(12, 0, 0, 0);
  }

  // Subtract 1 hour for the modification cutoff
  const cutoff = new Date(deadlineDate.getTime() - 60 * 60 * 1000);
  const now = new Date();

  return {
    allowed: now < cutoff,
    deadline: cutoff.toISOString(),
    reason: now >= cutoff ? "The modification window has closed (1 hour before pickup)." : undefined,
  };
}

// GET: Check modification status for an order
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, scheduled_for, pickup_time, created_at, tip_amount, total_amount, customer_id, customer_email, stripe_payment_intent_id, stripe_setup_intent_id, payment_method, fulfillment_type, items_subtotal, discount_amount, delivery_fee, tax_amount")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Ownership check — guest orders (customer_id is null) cannot be modified
  if (!order.customer_id || order.customer_id !== user.id) {
    return NextResponse.json({ error: "Not authorized to modify this order" }, { status: 403 });
  }

  const window = isWithinModificationWindow(order);

  // Fetch order items
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*, recipes(id, name, image_url, base_price, category)")
    .eq("order_id", id);

  return NextResponse.json({
    orderId: order.id,
    canModify: window.allowed,
    deadline: window.deadline,
    reason: window.reason,
    currentTip: Number(order.tip_amount) || 0,
    currentTotal: Number(order.total_amount) || 0,
    items: orderItems || [],
    fulfillmentType: order.fulfillment_type,
  });
}

// POST: Add tip or items to an order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body: ModifyRequest = await req.json();
    const { action, tipAmount, items } = body;

    const supabase = await createClient();
    const service = createServiceClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch order
    const { data: order, error: orderError } = await service
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Ownership check — guest orders (customer_id is null) cannot be modified
    if (!order.customer_id || order.customer_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to modify this order" }, { status: 403 });
    }

    // Check modification window
    const window = isWithinModificationWindow(order);
    if (!window.allowed) {
      return NextResponse.json({ error: window.reason || "Modification window closed" }, { status: 403 });
    }

    const { stripe, settings } = await getStripeForStore(STORE_ID);

    if (action === "add_tip") {
      if (tipAmount === undefined || tipAmount < 0) {
        return NextResponse.json({ error: "Invalid tip amount" }, { status: 400 });
      }

      const previousTip = Number(order.tip_amount) || 0;
      const tipDifference = tipAmount - previousTip;
      const newTotal = Number(order.total_amount) + tipDifference;

      // If there's a charge to make (tip increase)
      if (tipDifference > 0) {
        const chargeAmount = toCents(tipDifference);

        // Try to charge using saved payment method
        const customerId = order.stripe_customer_id;
        const paymentIntentId = order.stripe_payment_intent_id;
        const setupIntentId = order.stripe_setup_intent_id;

        let paymentMethodId: string | null = null;

        // Get payment method from the original payment or setup intent
        if (paymentIntentId) {
          try {
            const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
            paymentMethodId = pi.payment_method as string;
          } catch { /* fall through */ }
        }

        if (!paymentMethodId && setupIntentId) {
          try {
            const si = await stripe.setupIntents.retrieve(setupIntentId);
            paymentMethodId = si.payment_method as string;
          } catch { /* fall through */ }
        }

        if (!paymentMethodId && customerId) {
          // Try to get default payment method from customer
          try {
            const customer = await stripe.customers.retrieve(customerId);
            if (customer && !customer.deleted) {
              const methods = await stripe.paymentMethods.list({
                customer: customerId,
                type: "card",
                limit: 1,
              });
              paymentMethodId = methods.data[0]?.id || null;
            }
          } catch { /* fall through */ }
        }

        // Find customer by email if no customer ID stored
        if (!paymentMethodId && order.customer_email) {
          try {
            const customers = await stripe.customers.list({ email: order.customer_email, limit: 1 });
            if (customers.data.length > 0) {
              const cust = customers.data[0];
              const methods = await stripe.paymentMethods.list({ customer: cust.id, type: "card", limit: 1 });
              paymentMethodId = methods.data[0]?.id || null;
              if (paymentMethodId) {
                // Store customer ID for future use
                await service.from("orders").update({ stripe_customer_id: cust.id }).eq("id", id);
              }
            }
          } catch { /* fall through */ }
        }

        if (!paymentMethodId) {
          return NextResponse.json({ error: "No payment method on file. Please contact us to add a tip." }, { status: 400 });
        }

        // Create a separate PaymentIntent for the tip
        const tipPayment = await stripe.paymentIntents.create({
          amount: chargeAmount,
          currency: settings.currency,
          customer: customerId || undefined,
          payment_method: paymentMethodId,
          confirm: true,
          off_session: true,
          statement_descriptor_suffix: "TIP",
          metadata: {
            store_id: STORE_ID,
            order_id: id,
            type: "tip",
            original_order: order.order_number,
          },
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
        });

        if (tipPayment.status !== "succeeded") {
          return NextResponse.json({ error: "Tip payment failed. Please try again." }, { status: 400 });
        }
      }

      // Update order with new tip amount
      const { error: updateError } = await service
        .from("orders")
        .update({
          tip_amount: tipAmount,
          total_amount: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        tipAmount,
        newTotal,
        message: tipDifference > 0 ? "Tip added successfully!" : "Tip updated!",
      });
    }

    if (action === "add_items") {
      if (!items || items.length === 0) {
        return NextResponse.json({ error: "No items to add" }, { status: 400 });
      }

      // Look up actual prices from the database to prevent price manipulation
      const recipeIds = items.map((item) => item.recipe_id);
      const { data: recipes, error: recipesError } = await service
        .from("recipes")
        .select("id, base_price, name")
        .in("id", recipeIds)
        .eq("store_id", STORE_ID);

      if (recipesError) {
        return NextResponse.json({ error: "Failed to verify item prices" }, { status: 500 });
      }

      // Build a price map from DB results
      const priceMap = new Map<string, { base_price: number; name: string }>();
      for (const recipe of recipes || []) {
        priceMap.set(recipe.id, { base_price: Number(recipe.base_price), name: recipe.name });
      }

      // Verify all requested recipe IDs exist
      const missingRecipes = recipeIds.filter((rid) => !priceMap.has(rid));
      if (missingRecipes.length > 0) {
        return NextResponse.json(
          { error: `Item(s) not found: ${missingRecipes.join(", ")}` },
          { status: 400 }
        );
      }

      // Use DB prices instead of client-sent prices
      const verifiedItems = items.map((item) => {
        const dbRecipe = priceMap.get(item.recipe_id)!;
        return { ...item, price: dbRecipe.base_price, name: dbRecipe.name };
      });

      // Calculate additional cost using verified prices
      const additionalSubtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const additionalTax = additionalSubtotal * Number(settings.tax_rate);
      const additionalTotal = additionalSubtotal + additionalTax;

      if (additionalTotal < 0.50) {
        return NextResponse.json({ error: "Minimum additional charge is $0.50" }, { status: 400 });
      }

      // Charge the additional amount
      const customerId = order.stripe_customer_id;
      let paymentMethodId: string | null = null;

      // Get payment method (same logic as tips)
      if (order.stripe_payment_intent_id) {
        try {
          const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
          paymentMethodId = pi.payment_method as string;
        } catch { /* fall through */ }
      }
      if (!paymentMethodId && order.stripe_setup_intent_id) {
        try {
          const si = await stripe.setupIntents.retrieve(order.stripe_setup_intent_id);
          paymentMethodId = si.payment_method as string;
        } catch { /* fall through */ }
      }
      if (!paymentMethodId && customerId) {
        try {
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !customer.deleted) {
            const methods = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 });
            paymentMethodId = methods.data[0]?.id || null;
          }
        } catch { /* fall through */ }
      }
      if (!paymentMethodId && order.customer_email) {
        try {
          const customers = await stripe.customers.list({ email: order.customer_email, limit: 1 });
          if (customers.data.length > 0) {
            const methods = await stripe.paymentMethods.list({ customer: customers.data[0].id, type: "card", limit: 1 });
            paymentMethodId = methods.data[0]?.id || null;
          }
        } catch { /* fall through */ }
      }

      if (!paymentMethodId) {
        return NextResponse.json({ error: "No payment method on file." }, { status: 400 });
      }

      // Create PaymentIntent for additional items
      const itemPayment = await stripe.paymentIntents.create({
        amount: toCents(additionalTotal),
        currency: settings.currency,
        customer: customerId || undefined,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        statement_descriptor_suffix: "ADD ITEMS",
        metadata: {
          store_id: STORE_ID,
          order_id: id,
          type: "add_items",
          original_order: order.order_number,
          items_json: JSON.stringify(verifiedItems.map(i => ({ id: i.recipe_id, name: i.name, qty: i.quantity, price: i.price }))),
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });

      if (itemPayment.status !== "succeeded") {
        return NextResponse.json({ error: "Payment for additional items failed." }, { status: 400 });
      }

      // Insert new order items using verified DB prices
      const newOrderItems = verifiedItems.map((item) => ({
        order_id: id,
        recipe_id: item.recipe_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        customizations: [],
        special_instructions: null,
        label_printed: false,
        is_addon: true,
      }));

      await service.from("order_items").insert(newOrderItems);

      // Update order totals
      const newSubtotal = Number(order.items_subtotal) + additionalSubtotal;
      const newTax = Number(order.tax_amount) + additionalTax;
      const newTotal = Number(order.total_amount) + additionalTotal;

      await service
        .from("orders")
        .update({
          items_subtotal: newSubtotal,
          tax_amount: newTax,
          total_amount: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json({
        success: true,
        addedItems: verifiedItems,
        additionalCharge: additionalTotal,
        newTotal,
        message: `${items.length} item(s) added to your order!`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Order modification error:", error);
    const message = error instanceof Error ? error.message : "Failed to modify order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
