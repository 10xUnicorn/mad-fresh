import { NextResponse } from "next/server";
import { getPaymentSettings } from "@/lib/stripe";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

// GET: Public endpoint — returns publishable key + payment config (no secrets)
export async function GET() {
  try {
    const settings = await getPaymentSettings(STORE_ID);

    return NextResponse.json({
      publishableKey: settings?.stripe_publishable_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
      currency: settings?.currency || "usd",
      taxRate: settings?.tax_rate || 0.086,
      deliveryFee: settings?.delivery_fee || 5.99,
      freeDeliveryMinimum: settings?.free_delivery_minimum || 40,
      tipEnabled: settings?.tip_enabled ?? true,
      tipPresets: settings?.tip_presets || [10, 15, 20, 25],
      isConfigured: !!(settings?.stripe_publishable_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    });
  } catch {
    return NextResponse.json({
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
      currency: "usd",
      taxRate: 0.086,
      deliveryFee: 5.99,
      freeDeliveryMinimum: 40,
      tipEnabled: true,
      tipPresets: [10, 15, 20, 25],
      isConfigured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
  }
}
