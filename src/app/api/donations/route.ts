import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

// GET: Fetch community donation stats
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("donations")
      .select("amount, meals_equivalent, donor_id, payment_status")
      .eq("store_id", STORE_ID)
      .eq("payment_status", "succeeded");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }

    const totalMeals = (data || []).reduce((sum, d) => sum + (d.meals_equivalent || 0), 0);
    const totalAmount = (data || []).reduce((sum, d) => sum + (d.amount || 0), 0);
    const uniqueDonors = new Set((data || []).map((d) => d.donor_id)).size;

    return NextResponse.json({
      totalMeals,
      totalAmount,
      totalDonors: uniqueDonors,
    });
  } catch (err) {
    console.error("GET /api/donations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create donation record + Stripe PaymentIntent
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, message, isAnonymous } = body;

    if (!amount || typeof amount !== "number" || amount < 1) {
      return NextResponse.json({ error: "Invalid donation amount" }, { status: 400 });
    }

    // Fetch user profile for donor name/email
    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const donorName = isAnonymous
      ? "Anonymous"
      : `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Friend";
    const donorEmail = isAnonymous ? null : user.email;

    // Calculate meals equivalent (roughly $10 = 1 meal)
    const mealsEquivalent = Math.floor(amount / 10);

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: "usd",
      metadata: {
        store_id: STORE_ID,
        user_id: user.id,
        donor_name: donorName,
        type: "donation",
        meals_equivalent: String(mealsEquivalent),
      },
      description: `Mad Fresh Kitchen donation — ${mealsEquivalent} meal${mealsEquivalent !== 1 ? "s" : ""}`,
    });

    // Insert donation record
    const { data: donation, error: insertError } = await serviceClient
      .from("donations")
      .insert({
        store_id: STORE_ID,
        donor_id: user.id,
        donor_name: donorName,
        donor_email: donorEmail,
        amount,
        meals_equivalent: mealsEquivalent,
        payment_intent_id: paymentIntent.id,
        payment_status: "pending",
        is_anonymous: isAnonymous || false,
        message: message || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Donation insert error:", insertError);
      return NextResponse.json({ error: "Failed to create donation" }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      donationId: donation.id,
      mealsEquivalent,
    });
  } catch (err) {
    console.error("POST /api/donations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
