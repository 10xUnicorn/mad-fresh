// ═══════════════════════════════════════════
// Mad Fresh Kitchen — Stripe Integration
// Portable: reads config from DB per store
// Swap Stripe accounts by updating payment_settings
// ═══════════════════════════════════════════

import Stripe from "stripe";

// ── Singleton cache for Stripe instances per store ──
const stripeInstances = new Map<string, Stripe>();

/**
 * Get a Stripe instance for a specific store.
 * Falls back to env vars if no DB config is provided.
 * This makes it easy to swap Stripe accounts per store.
 */
export function getStripe(secretKey?: string): Stripe {
  const key = secretKey || process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe secret key not configured. Add STRIPE_SECRET_KEY to env or configure in payment_settings.");

  if (stripeInstances.has(key)) {
    return stripeInstances.get(key)!;
  }

  const stripe = new Stripe(key, {
    apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
    typescript: true,
  });

  stripeInstances.set(key, stripe);
  return stripe;
}

/**
 * Get the publishable key for client-side use.
 * Falls back to env var if not provided.
 */
export function getPublishableKey(publishableKey?: string): string {
  const key = publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) throw new Error("Stripe publishable key not configured.");
  return key;
}

// ── Payment Settings Helper ──

export interface PaymentSettings {
  id: string;
  store_id: string;
  provider: string;
  stripe_account_id: string | null;
  stripe_publishable_key: string | null;
  stripe_secret_key_encrypted: string | null;
  stripe_webhook_secret_encrypted: string | null;
  currency: string;
  tax_rate: number;
  delivery_fee: number;
  free_delivery_minimum: number | null;
  tip_enabled: boolean;
  tip_presets: number[];
  auto_capture: boolean;
  statement_descriptor: string | null;
  is_live_mode: boolean;
  is_active: boolean;
}

/**
 * Fetch payment settings from Supabase for a given store.
 * Used server-side to get Stripe keys + tax/fee config.
 */
export async function getPaymentSettings(storeId: string): Promise<PaymentSettings | null> {
  // Dynamic import to avoid circular deps
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_settings")
    .select("*")
    .eq("store_id", storeId)
    .eq("provider", "stripe")
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data as PaymentSettings;
}

/**
 * Get a configured Stripe instance for a specific store.
 * Reads the secret key from payment_settings, falls back to env.
 */
export async function getStripeForStore(storeId: string): Promise<{ stripe: Stripe; settings: PaymentSettings }> {
  const settings = await getPaymentSettings(storeId);

  // Use DB key if available, otherwise fall back to env
  const secretKey = settings?.stripe_secret_key_encrypted || process.env.STRIPE_SECRET_KEY;
  const stripe = getStripe(secretKey || undefined);

  // Return settings with defaults if no DB record
  const finalSettings: PaymentSettings = settings || {
    id: "",
    store_id: storeId,
    provider: "stripe",
    stripe_account_id: null,
    stripe_publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
    stripe_secret_key_encrypted: null,
    stripe_webhook_secret_encrypted: null,
    currency: "usd",
    tax_rate: 0.086,
    delivery_fee: 5.99,
    free_delivery_minimum: 40,
    tip_enabled: true,
    tip_presets: [10, 15, 20, 25],
    auto_capture: true,
    statement_descriptor: "MAD FRESH KITCHEN",
    is_live_mode: false,
    is_active: true,
  };

  return { stripe, settings: finalSettings };
}

// ── Existing product/price mapping (kept for backwards compat) ──

export const STRIPE_CONFIG = {
  products: {
    fiveMealPlan: "prod_UGj3SsWmrip5wd",
    tenMealPlan: "prod_UGj3E3nvMRIG8W",
    fifteenMealPlan: "prod_UGj35MiRoRM0T8",
    individualMeal: "prod_UGj30O2SF467fx",
  },
  prices: {
    fiveMealWeekly: "price_1TIBbIBiXnUmQZ6ksuHxh7wk",
    fiveMealMonthly: "price_1TIBbJBiXnUmQZ6kasGDVJXt",
    tenMealWeekly: "price_1TIBbJBiXnUmQZ6kNZxsm3Dj",
    tenMealMonthly: "price_1TIBbKBiXnUmQZ6kDsbjNhI5",
    fifteenMealWeekly: "price_1TIBbKBiXnUmQZ6kNzdOvpVZ",
    fifteenMealMonthly: "price_1TIBbLBiXnUmQZ6kbmIhaXYR",
    individualMeal: "price_1TIBbMBiXnUmQZ6k1AqXON0h",
  },
  paymentLinks: {
    fiveMealWeekly: "https://buy.stripe.com/dRmfZgblZgdI3tbbj88g00l",
    fiveMealMonthly: "https://buy.stripe.com/8x2cN44XB7Hc4xf72S8g00m",
    tenMealWeekly: "https://buy.stripe.com/7sY3cu1Lp9Pke7P0Eu8g00n",
    tenMealMonthly: "https://buy.stripe.com/6oU14m9dRgdIaVD86W8g00o",
    fifteenMealWeekly: "https://buy.stripe.com/9B6bJ075J1iO7Jrcnc8g00p",
    fifteenMealMonthly: "https://buy.stripe.com/9B69AS89N5z44xf5YO8g00q",
  },
} as const;

// Map subscription plan IDs to Stripe payment links
export function getPaymentLink(
  planId: string,
  interval: "weekly" | "monthly"
): string | null {
  const planMap: Record<string, { weekly: string; monthly: string }> = {
    "e0000000-0000-0000-0000-000000000001": {
      weekly: STRIPE_CONFIG.paymentLinks.fiveMealWeekly,
      monthly: STRIPE_CONFIG.paymentLinks.fiveMealMonthly,
    },
    "e0000000-0000-0000-0000-000000000002": {
      weekly: STRIPE_CONFIG.paymentLinks.tenMealWeekly,
      monthly: STRIPE_CONFIG.paymentLinks.tenMealMonthly,
    },
    "e0000000-0000-0000-0000-000000000003": {
      weekly: STRIPE_CONFIG.paymentLinks.fifteenMealWeekly,
      monthly: STRIPE_CONFIG.paymentLinks.fifteenMealMonthly,
    },
  };

  return planMap[planId]?.[interval] || null;
}

// Format cents to dollar string
export function formatAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Convert dollar amount to cents for Stripe
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}
