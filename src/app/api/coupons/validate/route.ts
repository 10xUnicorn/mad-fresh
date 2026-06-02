import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

interface ValidateRequest {
  code: string;
  subtotal: number;
  user_id?: string;
}

interface ValidateResponse {
  valid: boolean;
  message?: string;
  discount_type?: "percentage" | "fixed" | "free_delivery";
  discount_value?: number;
  max_discount?: number;
  description?: string;
  applied_discount?: number;
  code?: string;
  promo_id?: string;
  source?: "promotions" | "coupons";
}

// Normalize a promotion row into a common shape for validation
function normalizePromotion(promo: any) {
  return {
    id: promo.id,
    source: "promotions" as const,
    code: promo.code,
    is_active: promo.is_active,
    discount_type: promo.type === "fixed_amount" ? "fixed" : promo.type, // fixed_amount → fixed
    discount_value: parseFloat(promo.value),
    min_order_amount: promo.min_order_amount ? parseFloat(promo.min_order_amount) : null,
    max_discount: promo.max_discount_amount ? parseFloat(promo.max_discount_amount) : null,
    max_uses: promo.max_uses_total,
    max_uses_per_user: promo.max_uses_per_user,
    current_uses: promo.current_uses || 0,
    starts_at: promo.start_date,
    expires_at: promo.end_date,
    description: promo.display_title || promo.description || promo.name,
  };
}

// Normalize a coupon row into a common shape
function normalizeCoupon(coupon: any) {
  return {
    id: coupon.id,
    source: "coupons" as const,
    code: coupon.code,
    is_active: coupon.is_active,
    discount_type: coupon.discount_type,
    discount_value: parseFloat(coupon.discount_value),
    min_order_amount: coupon.min_order_amount ? parseFloat(coupon.min_order_amount) : null,
    max_discount: coupon.max_discount ? parseFloat(coupon.max_discount) : null,
    max_uses: coupon.max_uses,
    max_uses_per_user: coupon.max_uses_per_user,
    current_uses: coupon.current_uses || 0,
    starts_at: coupon.starts_at,
    expires_at: coupon.expires_at,
    description: coupon.description,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<ValidateResponse>> {
  try {
    const body = (await request.json()) as ValidateRequest;
    const { code, subtotal } = body;

    if (!code || subtotal === undefined) {
      return NextResponse.json(
        { valid: false, message: "Missing code or subtotal" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Auth check - allow both authenticated and unauthenticated access
    const { data: { user } } = await supabase.auth.getUser();
    const authenticatedUserId = user?.id;

    // 1) Check promotions table first (admin-created promo codes)
    const { data: promo } = await supabase
      .from("promotions")
      .select("*")
      .eq("store_id", STORE_ID)
      .ilike("code", code.toUpperCase())
      .single();

    // 2) Fall back to coupons table (legacy codes)
    const { data: coupon } = !promo
      ? await supabase
          .from("coupons")
          .select("*")
          .eq("store_id", STORE_ID)
          .eq("code", code.toUpperCase())
          .single()
      : { data: null };

    if (!promo && !coupon) {
      return NextResponse.json(
        { valid: false, message: "Promo code not found" },
        { status: 404 }
      );
    }

    // Normalize to a common shape
    const normalized = promo ? normalizePromotion(promo) : normalizeCoupon(coupon);

    // Check if active
    if (!normalized.is_active) {
      return NextResponse.json(
        { valid: false, message: "This code is no longer active" },
        { status: 400 }
      );
    }

    // Check date range
    const now = new Date();
    if (normalized.starts_at && new Date(normalized.starts_at) > now) {
      return NextResponse.json(
        { valid: false, message: "This code is not yet active" },
        { status: 400 }
      );
    }

    if (normalized.expires_at && new Date(normalized.expires_at) < now) {
      return NextResponse.json(
        { valid: false, message: "This code has expired" },
        { status: 400 }
      );
    }

    // Check total usage limit
    if (normalized.max_uses !== null && normalized.max_uses !== undefined && normalized.current_uses >= normalized.max_uses) {
      return NextResponse.json(
        { valid: false, message: "This code has reached its usage limit" },
        { status: 400 }
      );
    }

    // Check minimum order amount
    if (normalized.min_order_amount && subtotal < normalized.min_order_amount) {
      return NextResponse.json(
        {
          valid: false,
          message: `Minimum order of $${normalized.min_order_amount.toFixed(2)} required`,
        },
        { status: 400 }
      );
    }

    // Check per-user usage (only if authenticated)
    if (authenticatedUserId && normalized.max_uses_per_user && normalized.max_uses_per_user > 0) {
      // Check promo_uses for promotions, coupon_uses for coupons
      const usageTable = normalized.source === "promotions" ? "promo_uses" : "coupon_uses";
      const idColumn = normalized.source === "promotions" ? "promo_id" : "coupon_id";

      const { data: userUses } = await supabase
        .from(usageTable)
        .select("id")
        .eq(idColumn, normalized.id)
        .eq("user_id", authenticatedUserId);

      if (userUses && userUses.length >= normalized.max_uses_per_user) {
        return NextResponse.json(
          { valid: false, message: "You have already used this code" },
          { status: 400 }
        );
      }
    }

    // Calculate discount
    let appliedDiscount = 0;
    if (normalized.discount_type === "percentage" && normalized.discount_value) {
      appliedDiscount = (subtotal * normalized.discount_value) / 100;
      if (normalized.max_discount && appliedDiscount > normalized.max_discount) {
        appliedDiscount = normalized.max_discount;
      }
    } else if (normalized.discount_type === "fixed" && normalized.discount_value) {
      appliedDiscount = Math.min(normalized.discount_value, subtotal); // Don't exceed subtotal
    } else if (normalized.discount_type === "free_delivery") {
      appliedDiscount = 0; // Handled by checkout — flags free delivery
    }

    return NextResponse.json({
      valid: true,
      discount_type: normalized.discount_type as "percentage" | "fixed" | "free_delivery",
      discount_value: normalized.discount_value,
      max_discount: normalized.max_discount ?? undefined,
      description: normalized.description ?? undefined,
      applied_discount: appliedDiscount,
      code: normalized.code,
      promo_id: normalized.id,
      source: normalized.source,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { valid: false, message: "Error validating coupon" },
      { status: 500 }
    );
  }
}
