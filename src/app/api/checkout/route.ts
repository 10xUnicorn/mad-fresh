import { NextRequest, NextResponse } from "next/server";
import { getStripeForStore, toCents } from "@/lib/stripe";
import { createServiceClient, createClient } from "@/lib/supabase/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

interface CheckoutItem {
  recipe_id: string;
  quantity: number;
  fulfillment_type: "pickup" | "delivery";
}

interface CheckoutRequest {
  items: CheckoutItem[];
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  fulfillmentType: "pickup" | "delivery";
  isSubscription?: boolean;
  couponCode?: string;
  scheduledFor?: string;
  timeSlot?: string;
  deliveryAddress?: {
    street: string;
    apt?: string;
    city: string;
    state: string;
    zip: string;
  };
}

/**
 * Server-side coupon/promotion validation.
 * Checks the `promotions` table first (store-scoped), then falls back to `coupons`.
 * Returns { discount: number, code: string } or null if invalid.
 */
async function validateCoupon(
  supabase: ReturnType<typeof createServiceClient>,
  code: string,
  subtotal: number,
): Promise<{ discount: number; code: string } | null> {
  const now = new Date().toISOString();

  // 1) Check promotions table first (store-scoped)
  //    Columns: type, value, max_uses_total, current_uses, start_date, end_date
  const { data: promo } = await supabase
    .from("promotions")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .eq("store_id", STORE_ID)
    .single();

  if (promo) {
    // Check date validity (null means no restriction)
    const startOk = !promo.start_date || promo.start_date <= now;
    const endOk = !promo.end_date || promo.end_date >= now;
    const usesOk = !promo.max_uses_total || promo.current_uses < promo.max_uses_total;

    if (startOk && endOk && usesOk) {
      if (promo.min_order_amount && subtotal < Number(promo.min_order_amount)) {
        return null; // order doesn't meet minimum
      }
      let discount: number;
      if (promo.type === "percentage") {
        discount = subtotal * (Number(promo.value) / 100);
      } else if (promo.type === "free_delivery") {
        // Free delivery promos are handled by the delivery fee logic, not as a line item discount
        return { discount: 0, code };
      } else {
        discount = Number(promo.value);
      }
      if (promo.max_discount_amount) {
        discount = Math.min(discount, Number(promo.max_discount_amount));
      }
      return { discount: Math.min(discount, subtotal), code };
    }
  }

  // 2) Fall back to coupons table
  //    Columns: discount_type, discount_value, max_uses, current_uses, starts_at, expires_at
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (coupon) {
    const startOk = !coupon.starts_at || coupon.starts_at <= now;
    const endOk = !coupon.expires_at || coupon.expires_at >= now;
    const usesOk = !coupon.max_uses || coupon.current_uses < coupon.max_uses;

    if (startOk && endOk && usesOk) {
      if (coupon.min_order_amount && subtotal < Number(coupon.min_order_amount)) {
        return null;
      }
      const discount =
        coupon.discount_type === "percentage"
          ? subtotal * (Number(coupon.discount_value) / 100)
          : Number(coupon.discount_value);
      const capped = coupon.max_discount ? Math.min(discount, Number(coupon.max_discount)) : discount;
      return { discount: Math.min(capped, subtotal), code };
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequest = await req.json();
    const {
      items,
      customerEmail,
      customerName,
      customerPhone,
      fulfillmentType,
      isSubscription,
      couponCode,
      scheduledFor,
      timeSlot,
      deliveryAddress,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }
    if (!customerEmail) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const { stripe, settings } = await getStripeForStore(STORE_ID);
    const supabase = createServiceClient();

    // Pull authenticated user (if any) so the order is linked to their account.
    // Guests are still allowed — customer_id stays null.
    let customerId: string | null = null;
    try {
      const authedClient = await createClient();
      const { data: { user } } = await authedClient.auth.getUser();
      customerId = user?.id ?? null;
    } catch (authErr) {
      // Auth lookup failure shouldn't block guest checkout
      console.warn("Could not resolve auth user during checkout:", authErr);
    }

    // ── Fetch server-side prices for all items ──────────────────────────
    const recipeIds = [...new Set(items.map((i) => i.recipe_id))];
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("id, name, base_price, is_available")
      .in("id", recipeIds);

    if (recipesError || !recipes) {
      console.error("Failed to fetch recipes:", recipesError);
      return NextResponse.json(
        { error: "Failed to validate menu items" },
        { status: 500 },
      );
    }

    const priceMap = new Map(
      recipes.map((r) => [r.id, { price: Number(r.base_price), name: r.name, available: r.is_available }]),
    );

    // Validate every item exists and is available
    for (const item of items) {
      const recipe = priceMap.get(item.recipe_id);
      if (!recipe) {
        return NextResponse.json(
          { error: `Menu item not found: ${item.recipe_id}` },
          { status: 400 },
        );
      }
      if (!recipe.available) {
        return NextResponse.json(
          { error: `"${recipe.name}" is currently unavailable` },
          { status: 400 },
        );
      }
    }

    // ── Calculate totals using SERVER-FETCHED prices ────────────────────
    const subtotal = items.reduce((sum, item) => {
      const recipe = priceMap.get(item.recipe_id)!;
      return sum + recipe.price * item.quantity;
    }, 0);

    const subscriptionDiscount = isSubscription ? subtotal * 0.15 : 0;

    // ── Server-side coupon validation ───────────────────────────────────
    let couponDiscount = 0;
    const subtotalAfterSubDiscount = Math.max(0, subtotal - subscriptionDiscount);

    if (couponCode) {
      const result = await validateCoupon(supabase, couponCode, subtotalAfterSubDiscount);
      if (result) {
        couponDiscount = result.discount;
      }
      // If coupon is invalid we silently ignore it — the client already
      // showed validation UI; a mismatch here means tampering.
    }

    const totalDiscount = subscriptionDiscount + couponDiscount;
    const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);

    // ── Delivery fee — calculated purely from server settings ───────────
    const baseDeliveryFee =
      fulfillmentType === "delivery" ? Number(settings.delivery_fee) : 0;
    const freeMin = settings.free_delivery_minimum
      ? Number(settings.free_delivery_minimum)
      : null;
    const qualifiesForFreeDelivery = !!(freeMin && subtotalAfterDiscount >= freeMin);
    const actualDeliveryFee = qualifiesForFreeDelivery ? 0 : baseDeliveryFee;

    const tax = subtotalAfterDiscount * Number(settings.tax_rate);
    const total = subtotalAfterDiscount + actualDeliveryFee + tax;

    // ── Find or create Stripe customer ──────────────────────────────────
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });
    let customer;
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: { store_id: STORE_ID, source: "website_checkout" },
      });
    }

    // ── Build metadata with server-validated values ─────────────────────
    const lineItemsDesc = items
      .map((i) => {
        const recipe = priceMap.get(i.recipe_id)!;
        return `${i.quantity}x ${recipe.name}`;
      })
      .join(", ");

    const orderMeta = {
      store_id: STORE_ID,
      user_id: customerId || "",
      order_type: isSubscription ? "subscription" : "individual",
      fulfillment_type: fulfillmentType,
      items_json: JSON.stringify(
        items.map((i) => ({
          id: i.recipe_id,
          qty: i.quantity,
          price: priceMap.get(i.recipe_id)!.price,
        })),
      ),
      subtotal: subtotal.toFixed(2),
      subscription_discount: subscriptionDiscount.toFixed(2),
      coupon_discount: couponDiscount.toFixed(2),
      total_discount: totalDiscount.toFixed(2),
      delivery_fee: actualDeliveryFee.toFixed(2),
      tax: tax.toFixed(2),
      coupon_code: couponCode || "",
    };

    const orderSummary = {
      subtotal: subtotal.toFixed(2),
      discount: totalDiscount.toFixed(2),
      deliveryFee: actualDeliveryFee.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      lineItems: lineItemsDesc,
    };

    // ── Generate order number ────────────────────────────────────────────
    const orderNumber = `MF-${String(Date.now()).slice(-5)}${String(Math.floor(Math.random() * 100)).padStart(2, "0")}`;

    // For free/near-free orders (under Stripe's $0.50 minimum), use a SetupIntent
    // to save the card without charging. This allows future charges like tips.
    if (total < 0.5) {
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        automatic_payment_methods: { enabled: true },
        metadata: orderMeta,
      });

      // Create order record server-side (pending_payment for free orders auto-confirms)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: STORE_ID,
          customer_id: customerId,
          order_number: orderNumber,
          order_type: isSubscription ? "subscription" : "individual",
          status: "confirmed",
          payment_status: "paid",
          stripe_setup_intent_id: setupIntent.id,
          stripe_customer_id: customer.id,
          payment_method: "card_saved",
          items_subtotal: subtotal,
          discount_amount: totalDiscount,
          discount_code: couponCode || null,
          delivery_fee: actualDeliveryFee,
          service_fee: 0,
          tax_amount: tax,
          tip_amount: 0,
          donation_amount: 0,
          total_amount: total,
          fulfillment_type: fulfillmentType,
          special_instructions: "",
          scheduled_for: scheduledFor || null,
          pickup_time: timeSlot || null,
          source: "website",
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone || null,
        })
        .select("id")
        .single();

      if (orderError || !orderData?.id) {
        console.error("Failed to create order (free path):", orderError);
        return NextResponse.json(
          { error: `Failed to save order: ${orderError?.message || "unknown error"}` },
          { status: 500 },
        );
      }

      // Insert order line items
      if (orderData?.id) {
        const orderItems = items.map((item) => ({
          order_id: orderData.id,
          recipe_id: item.recipe_id,
          quantity: item.quantity,
          unit_price: priceMap.get(item.recipe_id)!.price,
          total_price: priceMap.get(item.recipe_id)!.price * item.quantity,
          customizations: [],
          special_instructions: null,
          label_printed: false,
        }));
        await supabase.from("order_items").insert(orderItems);
      }

      // Upsert contact record
      await supabase.from("contacts").upsert(
        {
          store_id: STORE_ID,
          first_name: customerName.split(" ")[0] || "",
          last_name: customerName.split(" ").slice(1).join(" ") || "",
          email: customerEmail,
          phone: customerPhone || null,
          source: "website" as const,
          contact_type: "customer" as const,
          is_newsletter_subscribed: true,
        },
        { onConflict: "store_id,email" }
      );

      return NextResponse.json({
        clientSecret: setupIntent.client_secret,
        paymentIntentId: `setup_${setupIntent.id}`,
        customerId: customer.id,
        publishableKey:
          settings.stripe_publishable_key ||
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        isFreeOrder: true,
        order: orderSummary,
        orderId: orderData?.id || null,
        orderNumber,
      });
    }

    // Create PaymentIntent for orders with a balance
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toCents(total),
      currency: settings.currency,
      customer: customer.id,
      statement_descriptor_suffix: "MEAL ORDER",
      metadata: orderMeta,
      automatic_payment_methods: { enabled: true },
      ...(settings.auto_capture
        ? {}
        : { capture_method: "manual" as const }),
    });

    // ── Create order record server-side with pending_payment status ────
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: STORE_ID,
        customer_id: customerId,
        order_number: orderNumber,
        order_type: isSubscription ? "subscription" : "individual",
        status: "pending_payment",
        payment_status: "pending",
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: customer.id,
        payment_method: "card",
        items_subtotal: subtotal,
        discount_amount: totalDiscount,
        discount_code: couponCode || null,
        delivery_fee: actualDeliveryFee,
        service_fee: 0,
        tax_amount: tax,
        tip_amount: 0,
        donation_amount: 0,
        total_amount: total,
        fulfillment_type: fulfillmentType,
        special_instructions: "",
        scheduled_for: scheduledFor || null,
        pickup_time: timeSlot || null,
        source: "website",
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone || null,
      })
      .select("id")
      .single();

    if (orderError || !orderData?.id) {
      console.error("Failed to create order (paid path):", orderError);
      // Cancel the PaymentIntent so the customer isn't charged for a phantom order
      try {
        await stripe.paymentIntents.cancel(paymentIntent.id);
      } catch (cancelErr) {
        console.error("Failed to cancel PaymentIntent after order failure:", cancelErr);
      }
      return NextResponse.json(
        { error: `Failed to save order: ${orderError?.message || "unknown error"}` },
        { status: 500 },
      );
    }

    // Insert order line items
    if (orderData?.id) {
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        recipe_id: item.recipe_id,
        quantity: item.quantity,
        unit_price: priceMap.get(item.recipe_id)!.price,
        total_price: priceMap.get(item.recipe_id)!.price * item.quantity,
        customizations: [],
        special_instructions: null,
        label_printed: false,
      }));
      await supabase.from("order_items").insert(orderItems);
    }

    // Upsert contact record
    await supabase.from("contacts").upsert(
      {
        store_id: STORE_ID,
        first_name: customerName.split(" ")[0] || "",
        last_name: customerName.split(" ").slice(1).join(" ") || "",
        email: customerEmail,
        phone: customerPhone || null,
        source: "website" as const,
        contact_type: "customer" as const,
        is_newsletter_subscribed: true,
      },
      { onConflict: "store_id,email" }
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customer.id,
      publishableKey:
        settings.stripe_publishable_key ||
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      isFreeOrder: false,
      order: orderSummary,
      orderId: orderData?.id || null,
      orderNumber,
    });
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: return publishable key + store payment config for client
export async function GET() {
  try {
    const { settings } = await getStripeForStore(STORE_ID);
    return NextResponse.json({
      publishableKey:
        settings.stripe_publishable_key ||
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      currency: settings.currency,
      taxRate: settings.tax_rate,
      deliveryFee: settings.delivery_fee,
      freeDeliveryMinimum: settings.free_delivery_minimum,
      tipEnabled: settings.tip_enabled,
      tipPresets: settings.tip_presets,
    });
  } catch {
    return NextResponse.json(
      { error: "Payment not configured" },
      { status: 500 },
    );
  }
}
