import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

const REDEEM_TIERS = [
  { tier: "5_off", reward: "$5 off your order", points: 500, discount_amount: 5 },
  { tier: "free_meal", reward: "Free meal", points: 1000, discount_amount: 15 },
  { tier: "free_week", reward: "Free week of meals", points: 2000, discount_amount: 75 },
  { tier: "merch_pack", reward: "Mad Fresh merch pack", points: 5000, discount_amount: 0 },
];

function generatePromoCode(tier: string): string {
  const prefix = tier === "5_off" ? "MF5" : tier === "free_meal" ? "MFMEAL" : tier === "free_week" ? "MFWEEK" : "MFMERCH";
  const suffix = randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
  return `${prefix}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { tier } = await req.json();
    const redeemTier = REDEEM_TIERS.find((t) => t.tier === tier);
    if (!redeemTier) {
      return NextResponse.json({ error: "Invalid redemption tier" }, { status: 400 });
    }

    // Atomic point deduction using database function — prevents race conditions
    // The function locks rows FOR UPDATE, checks balance, and deducts in one transaction
    const serviceClient = createServiceClient();
    const { data: redeemResult, error: redeemError } = await serviceClient.rpc(
      "redeem_reward_points",
      {
        p_user_id: user.id,
        p_points_required: redeemTier.points,
        p_description: `Redeemed: ${redeemTier.reward}`,
      }
    );

    if (redeemError) {
      console.error("Points redemption error:", redeemError);
      return NextResponse.json({ error: "Failed to process redemption" }, { status: 500 });
    }

    if (redeemResult === false) {
      return NextResponse.json(
        { error: `Insufficient points. You need ${redeemTier.points} points.` },
        { status: 400 }
      );
    }

    let promoCode = "";

    if (tier === "merch_pack") {
      // For merch, record the redemption — fulfillment is manual
      promoCode = generatePromoCode(tier);
      // Could send an email to admin here
    } else {
      // Create a promo code in the promo_codes table
      promoCode = generatePromoCode(tier);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30-day expiry

      const { error: promoError } = await supabase.from("coupons").insert({
        store_id: "b0000000-0000-0000-0000-000000000001",
        code: promoCode,
        discount_type: "fixed",
        discount_value: redeemTier.discount_amount,
        max_uses: 1,
        current_uses: 0,
        min_order_amount: 0,
        is_active: true,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        description: `Reward Redemption: ${redeemTier.reward} (${user.id.slice(0, 8)})`,
      });

      if (promoError) {
        console.error("Promo code creation error:", promoError);
        // Refund points if promo creation fails
        await supabase.from("reward_points").insert({
          user_id: user.id,
          points: redeemTier.points,
          source: "redemption_refund",
          description: `Refund: Failed to create promo for ${redeemTier.reward}`,
        });
        return NextResponse.json({ error: "Failed to create promo code" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      promo_code: promoCode,
      reward: redeemTier.reward,
      points_deducted: redeemTier.points,
      message:
        tier === "merch_pack"
          ? `Your merch pack request has been submitted! Code: ${promoCode}. We'll reach out to arrange delivery.`
          : `Use code ${promoCode} at checkout for ${redeemTier.reward}. Valid for 30 days.`,
    });
  } catch (err) {
    console.error("Redeem error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
