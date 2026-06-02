import { NextRequest, NextResponse } from "next/server";
import { getStripeForStore, toCents } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

// POST: Create an embedded Stripe Checkout Session for subscription
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, billingInterval, mealSize, proteinPreferences, deliveryMethod, pickupDay, pickupTime, repeatMeals } = body;

    if (!planId || !billingInterval) {
      return NextResponse.json({ error: "Missing planId or billingInterval" }, { status: 400 });
    }

    // Validate meal size
    const validSizes = ["small", "medium", "large"];
    const selectedMealSize = validSizes.includes(mealSize) ? mealSize : "medium";
    const selectedProteins: string[] = Array.isArray(proteinPreferences) ? proteinPreferences : [];
    const selectedDeliveryMethod = deliveryMethod === "pickup" ? "pickup" : "delivery";
    const selectedPickupDay = typeof pickupDay === "string" ? pickupDay : null;
    const selectedPickupTime = typeof pickupTime === "string" ? pickupTime : null;
    const isRepeatMeals = repeatMeals === true;

    const { stripe, settings } = await getStripeForStore(STORE_ID);
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch user profile for name
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("first_name, last_name, stripe_customer_id")
      .eq("id", user.id)
      .single();

    // Fetch the subscription plan
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Get the correct Stripe price ID
    const stripePriceField = `stripe_price_id_${billingInterval}` as keyof typeof plan;
    let stripePriceId = plan[stripePriceField] as string | null;

    // If no Stripe price exists, create one
    if (!stripePriceId) {
      // Find or create product
      let productId: string;
      const existingProducts = await stripe.products.search({
        query: `metadata['plan_id']:'${planId}'`,
      });

      if (existingProducts.data.length > 0) {
        productId = existingProducts.data[0].id;
      } else {
        const product = await stripe.products.create({
          name: `Mad Fresh Kitchen — ${plan.name}`,
          description: plan.description || `${plan.meals_per_week} meals per week`,
          metadata: { plan_id: planId, store_id: STORE_ID },
        });
        productId = product.id;
      }

      const priceMap: Record<string, number> = {
        weekly: plan.price_weekly,
        monthly: plan.price_monthly,
        annual: plan.price_annual,
      };

      const intervalMap: Record<string, { interval: "week" | "month" | "year" }> = {
        weekly: { interval: "week" },
        monthly: { interval: "month" },
        annual: { interval: "year" },
      };

      const newPrice = await stripe.prices.create({
        product: productId,
        unit_amount: toCents(priceMap[billingInterval]),
        currency: settings.currency,
        recurring: intervalMap[billingInterval],
        metadata: { plan_id: planId, billing_interval: billingInterval },
      });

      stripePriceId = newPrice.id;

      // Cache it for next time
      await supabase
        .from("subscription_plans")
        .update({ [stripePriceField]: stripePriceId })
        .eq("id", planId);
    }

    // Find or create Stripe customer
    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      const existingCustomers = await stripe.customers.list({
        email: user.email!,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email!,
          name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || undefined,
          metadata: { store_id: STORE_ID, user_id: user.id },
        });
        stripeCustomerId = customer.id;
      }

      // Save Stripe customer ID to profile
      await supabase
        .from("user_profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mad-fresh.vercel.app";

    // If repeat meals selected, find or create a 15% forever coupon
    let repeatCouponId: string | undefined;
    if (isRepeatMeals) {
      const couponCode = "REPEAT_MEALS_15";
      try {
        const existing = await stripe.coupons.retrieve(couponCode);
        repeatCouponId = existing.id;
      } catch {
        // Coupon doesn't exist yet — create it
        const coupon = await stripe.coupons.create({
          id: couponCode,
          percent_off: 15,
          duration: "forever",
          name: "Repeat Meals – 15% Off",
          metadata: { store_id: STORE_ID },
        });
        repeatCouponId = coupon.id;
      }
    }

    // Create embedded checkout session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionParams: any = {
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      mode: "subscription",
      ui_mode: "embedded",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      subscription_data: {
        metadata: {
          store_id: STORE_ID,
          plan_id: planId,
          user_id: user.id,
          billing_interval: billingInterval,
          meal_size: selectedMealSize,
          protein_preferences: JSON.stringify(selectedProteins),
          delivery_method: selectedDeliveryMethod,
          pickup_day: selectedPickupDay || "",
          pickup_time: selectedPickupTime || "",
          repeat_meals: isRepeatMeals ? "true" : "false",
        },
      },
      return_url: `${siteUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        store_id: STORE_ID,
        plan_id: planId,
        user_id: user.id,
        billing_interval: billingInterval,
        meal_size: selectedMealSize,
        protein_preferences: JSON.stringify(selectedProteins),
        delivery_method: selectedDeliveryMethod,
        pickup_day: selectedPickupDay || "",
        pickup_time: selectedPickupTime || "",
        repeat_meals: isRepeatMeals ? "true" : "false",
      },
    };

    // Apply repeat meals coupon to the checkout
    if (repeatCouponId) {
      sessionParams.discounts = [{ coupon: repeatCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error: unknown) {
    console.error("Subscription checkout error:", error);
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: Check session status after completion
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const { stripe } = await getStripeForStore(STORE_ID);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      customerEmail: session.customer_details?.email,
      subscriptionId: session.subscription,
    });
  } catch (error: unknown) {
    console.error("Session status error:", error);
    return NextResponse.json({ error: "Failed to check session" }, { status: 500 });
  }
}
