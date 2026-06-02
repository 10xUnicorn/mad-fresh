import { NextRequest, NextResponse } from "next/server";
import { getStripeForStore, toCents } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

// POST: Create a new subscription
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check — subscription creation requires authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, billingInterval } = body;
    // Use authenticated user's email — never trust client-sent email for subscriptions
    const customerEmail = user.email;
    const customerName = body.customerName;

    if (!planId || !billingInterval || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { stripe, settings } = await getStripeForStore(STORE_ID);

    // Fetch the subscription plan
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Get the right price based on billing interval
    const priceMap: Record<string, number> = {
      weekly: plan.price_weekly,
      monthly: plan.price_monthly,
      annual: plan.price_annual,
    };
    const price = priceMap[billingInterval];
    if (!price) {
      return NextResponse.json({ error: "Invalid billing interval" }, { status: 400 });
    }

    // Check for existing Stripe price ID on the plan
    const stripePriceField = `stripe_price_id_${billingInterval}` as keyof typeof plan;
    let stripePriceId = plan[stripePriceField] as string | null;

    // If no Stripe price exists, create product + price
    if (!stripePriceId) {
      // Check if product exists
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

      // Create recurring price
      const intervalMap: Record<string, { interval: "week" | "month" | "year" }> = {
        weekly: { interval: "week" },
        monthly: { interval: "month" },
        annual: { interval: "year" },
      };

      const newPrice = await stripe.prices.create({
        product: productId,
        unit_amount: toCents(price),
        currency: settings.currency,
        recurring: intervalMap[billingInterval],
        metadata: { plan_id: planId, billing_interval: billingInterval },
      });

      stripePriceId = newPrice.id;

      // Save back to DB for next time
      await supabase
        .from("subscription_plans")
        .update({ [stripePriceField]: stripePriceId })
        .eq("id", planId);
    }

    // Find or create Stripe customer
    const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customer;
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: { store_id: STORE_ID },
      });
    }

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      subscription_data: {
        metadata: {
          store_id: STORE_ID,
          plan_id: planId,
          billing_interval: billingInterval,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mad-fresh.vercel.app"}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mad-fresh.vercel.app"}/menu`,
      metadata: {
        store_id: STORE_ID,
        plan_id: planId,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
      customerId: customer.id,
    });
  } catch (error: unknown) {
    console.error("Subscription error:", error);
    const message = error instanceof Error ? error.message : "Failed to create subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: List active subscription plans with prices
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("store_id", STORE_ID)
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw error;
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
